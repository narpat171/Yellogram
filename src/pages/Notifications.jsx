import React, { useEffect, useState } from 'react';
import { supabase } from '../supabase';
import { Heart, UserPlus, MessageCircle, ArrowLeft, Video } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Skeleton from '../components/Skeleton';

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchNotifications = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // 🔥 post:post_id से हम पोस्ट की फोटो (media_url) भी मँगवा रहे हैं 🔥
      const { data, error } = await supabase
        .from('notifications')
        .select(`
          *,
          sender:sender_id (username, profile_pic),
          post:post_id (media_url, type)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (!error && data) {
        setNotifications(data);
        
        // सारे अनरीड (unread) को Read कर दो
        const unreadIds = data.filter(n => !n.is_read).map(n => n.id);
        if (unreadIds.length > 0) {
          await supabase.from('notifications').update({ is_read: true }).in('id', unreadIds);
        }
      }
      setLoading(false);
    };

    fetchNotifications();

    // 🔥 REAL-TIME SUBSCRIPTION: बिना रिफ्रेश किए नया नोटिफिकेशन आएगा 🔥
    const notifSubscription = supabase
      .channel('realtime-notifs-page')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications' },
        async (payload) => {
          const { data: { user } } = await supabase.auth.getUser();
          
          // अगर नोटिफिकेशन मेरे लिए है
          if (payload.new.user_id === user?.id) {
            // उस नए नोटिफिकेशन की पूरी जानकारी (भेजने वाले की फोटो और पोस्ट की फोटो) लाओ
            const { data: fullNotif } = await supabase
              .from('notifications')
              .select('*, sender:sender_id(username, profile_pic), post:post_id(media_url, type)')
              .eq('id', payload.new.id)
              .single();
              
            if (fullNotif) {
              setNotifications(prev => [fullNotif, ...prev]);
              // चूँकि हम इसी पेज पर हैं, इसे तुरंत read मार्क कर दें
              supabase.from('notifications').update({ is_read: true }).eq('id', fullNotif.id).then();
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(notifSubscription);
    };
  }, []);

  const getIcon = (type) => {
    switch (type) {
      case 'like': return <Heart className="w-4 h-4 text-white fill-white" />;
      case 'follow': return <UserPlus className="w-4 h-4 text-white" />;
      case 'message': return <MessageCircle className="w-4 h-4 text-white fill-white" />;
      default: return <Heart className="w-4 h-4 text-white" />;
    }
  };

  const getIconBgColor = (type) => {
    switch (type) {
      case 'like': return 'bg-red-500';
      case 'follow': return 'bg-blue-500';
      case 'message': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m`;
    if (diffInMinutes < 24 * 60) return `${Math.floor(diffInMinutes / 60)}h`;
    return `${Math.floor(diffInMinutes / (24 * 60))}d`;
  };

  return (
    <div className="min-h-screen bg-white pb-20">
      {/* Header */}
      <div className="bg-white p-4 sticky top-0 z-10 border-b border-gray-100 flex items-center gap-4 shadow-sm">
        <ArrowLeft className="w-6 h-6 text-gray-900 cursor-pointer active:scale-90 transition-transform" onClick={() => navigate(-1)} />
        <h1 className="text-xl font-bold text-gray-900">Notifications</h1>
      </div>

      {/* Notifications List */}
      <div className="p-0">
        {loading ? (
          <div className="px-4 py-4 flex flex-col gap-5">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="flex items-center gap-4">
                <Skeleton className="w-12 h-12 rounded-full" />
                <div className="flex-1 flex flex-col gap-2"><Skeleton className="w-48 h-4" /><Skeleton className="w-24 h-3" /></div>
              </div>
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center mt-20 text-gray-400">
            <Heart className="w-16 h-16 mb-4 opacity-30" />
            <p className="font-medium">No notifications yet.</p>
          </div>
        ) : (
          notifications.map((notif) => (
            <div 
              key={notif.id} 
              className={`flex items-center px-4 py-3 border-b border-gray-50 transition-colors ${notif.is_read ? 'bg-white' : 'bg-blue-50/30'}`}
            >
              {/* Profile Pic with small badge */}
              <div className="relative flex-shrink-0 cursor-pointer">
                <img 
                  src={notif.sender?.profile_pic || `https://api.dicebear.com/7.x/avataaars/svg?seed=${notif.sender_id}`} 
                  alt="avatar" 
                  className="w-12 h-12 rounded-full object-cover border border-gray-100 bg-gray-50"
                />
                <div className={`absolute -bottom-1 -right-1 rounded-full p-1 border-2 border-white ${getIconBgColor(notif.type)} shadow-sm`}>
                  {getIcon(notif.type)}
                </div>
              </div>
              
              {/* Text */}
              <div className="ml-4 flex-1 pr-2">
                <p className="text-[14px] leading-snug text-gray-800">
                  <span className="font-bold text-gray-900 cursor-pointer">{notif.sender?.username}</span> {notif.content}
                </p>
                <span className="text-[12px] text-gray-500 font-medium">{getTimeAgo(notif.created_at)}</span>
              </div>

              {/* 🔥 Post Thumbnail (अगर लाइक/कमेंट किसी पोस्ट पर है) 🔥 */}
              {notif.post && (
                <div className="flex-shrink-0 cursor-pointer ml-2 relative">
                  {notif.post.type === 'video' ? (
                    <div className="relative w-11 h-11 rounded-md overflow-hidden bg-black flex items-center justify-center">
                      <video src={notif.post.media_url} className="w-full h-full object-cover opacity-80 pointer-events-none" />
                      <Video className="w-4 h-4 text-white absolute z-10" />
                    </div>
                  ) : (
                    <img 
                      src={notif.post.media_url} 
                      alt="post" 
                      className="w-11 h-11 rounded-md object-cover border border-gray-200"
                    />
                  )}
                </div>
              )}

              {/* अगर Follow का नोटिफिकेशन है तो Follow बैक बटन दिखा सकते हैं (अभी के लिए "Following" टेक्स्ट) */}
              {notif.type === 'follow' && !notif.post && (
                <button className="flex-shrink-0 ml-2 bg-gray-100 text-gray-900 px-4 py-1.5 rounded-lg text-sm font-bold active:scale-95 transition-transform">
                  Following
                </button>
              )}

            </div>
          ))
        )}
      </div>
    </div>
  );
}