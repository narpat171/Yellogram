import React, { useState, useRef, useEffect } from 'react';
import { Heart, MessageCircle, Send, Bookmark, MoreHorizontal, Music, Volume2, VolumeX, Camera } from 'lucide-react';
import { supabase } from '../supabase'; 
import Skeleton from '../components/Skeleton';

const dummyReels = [
  {
    id: 'dummy_1',
    user_id: 'dummy_user_1',
    videoUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    username: 'sarwar_singh',
    userPic: 'https://api.dicebear.com/7.x/avataaars/svg?seed=sarwar',
    caption: 'Chilling out with some amazing views! ✨💛 #nature #yellowgram',
    music: 'Original Audio - sarwar_singh',
    likes: 12400,
    comments: 450,
  }
];

const formatCount = (count) => {
  if (!count) return 0;
  if (count >= 1000000) return (count / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
  if (count >= 1000) return (count / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
  return count;
};

// 🔥 सिंगल रील कॉम्पोनेंट 🔥
const Reel = ({ reel, onLikeToggle, currentUser, isFollowing, onFollowToggle }) => {
  const videoRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true); 
  
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(reel.likes || 0);
  const [showHeartAnim, setShowHeartAnim] = useState(false);

  useEffect(() => {
    const options = { root: null, rootMargin: '0px', threshold: 0.8 };
    const callback = (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          videoRef.current?.play();
          setIsPlaying(true);
        } else {
          videoRef.current?.pause();
          setIsPlaying(false);
        }
      });
    };
    const observer = new IntersectionObserver(callback, options);
    if (videoRef.current) observer.observe(videoRef.current);
    return () => observer.disconnect();
  }, []);

  const togglePlay = () => {
    if (isPlaying) {
      videoRef.current?.pause();
      setIsPlaying(false);
    } else {
      videoRef.current?.play();
      setIsPlaying(true);
    }
  };

  const handleDoubleTap = () => {
    if (!isLiked) {
      setIsLiked(true);
      setLikesCount(prev => prev + 1);
      if (onLikeToggle) onLikeToggle(reel.id, likesCount + 1, true);
    }
    setShowHeartAnim(true);
    setTimeout(() => setShowHeartAnim(false), 800);
  };

  const toggleLike = () => {
    if (isLiked) {
      setIsLiked(false);
      setLikesCount(prev => prev - 1);
      if (onLikeToggle) onLikeToggle(reel.id, likesCount - 1, false);
    } else {
      setIsLiked(true);
      setLikesCount(prev => prev + 1);
      if (onLikeToggle) onLikeToggle(reel.id, likesCount + 1, true);
    }
  };

  return (
    <div className="relative w-full h-full snap-start bg-black flex items-center justify-center overflow-hidden">
      
      <video
        ref={videoRef}
        src={reel.media_url || reel.videoUrl} 
        loop
        muted={isMuted}
        playsInline
        className="w-full h-full object-cover"
        onClick={(e) => {
          if (e.detail === 2) handleDoubleTap();
          else if (e.detail === 1) togglePlay();
        }}
      />

      {showHeartAnim && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
          <Heart className="w-24 h-24 text-white fill-white animate-in zoom-in duration-300 drop-shadow-2xl" />
        </div>
      )}

      <button onClick={() => setIsMuted(!isMuted)} className="absolute top-6 right-4 z-20 p-2 bg-black/40 backdrop-blur-sm rounded-full text-white hover:bg-black/60 transition-colors">
        {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
      </button>

      {!isPlaying && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
          <div className="w-16 h-16 bg-black/40 backdrop-blur-sm rounded-full flex items-center justify-center">
            <div className="w-0 h-0 border-t-8 border-t-transparent border-l-[14px] border-l-white border-b-8 border-b-transparent ml-1"></div>
          </div>
        </div>
      )}

      <div className="absolute bottom-0 w-full px-4 pb-20 pt-32 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex justify-between items-end pointer-events-none z-10">
        
        <div className="flex flex-col text-white gap-3 pb-2 w-[75%] pointer-events-auto">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-full border border-white/50 p-0.5 overflow-hidden">
              <img src={reel.user_profile_pic || reel.userPic || `https://api.dicebear.com/7.x/avataaars/svg?seed=${reel.username}`} alt="dp" className="w-full h-full rounded-full object-cover bg-white" />
            </div>
            <span className="font-extrabold text-[15px]">{reel.username || 'Creator'}</span>
            
            {/* 🔥 Reels में Smart Follow Button 🔥 */}
            {currentUser && currentUser.id !== reel.user_id && (
              <button 
                onClick={(e) => { e.stopPropagation(); onFollowToggle(reel.user_id); }}
                className={`px-3 py-1 rounded-lg text-[12px] font-bold ml-2 transition-all active:scale-95 flex-shrink-0 ${
                  isFollowing 
                    ? 'bg-white/20 text-white border border-white/40' 
                    : 'bg-gray-900 text-yellow-400 border border-gray-900'
                }`}
              >
                {isFollowing ? 'Following' : 'Follow'}
              </button>
            )}

          </div>
          
          <p className="text-[14px] font-medium leading-tight line-clamp-2">{reel.caption}</p>
          
          <div className="flex items-center gap-2 bg-white/20 backdrop-blur-md px-3 py-1.5 rounded-full w-max">
            <Music className="w-3.5 h-3.5 animate-pulse" />
            <span className="text-[12px] font-bold">{reel.music || 'Original Audio'}</span>
          </div>
        </div>

        <div className="flex flex-col items-center gap-5 pb-2 pointer-events-auto">
          <div className="flex flex-col items-center gap-1 group">
            <button onClick={toggleLike} className="active:scale-90 transition-transform">
              <Heart className={`w-8 h-8 transition-colors ${isLiked ? 'fill-red-500 text-red-500' : 'text-white'}`} strokeWidth={isLiked ? 0 : 2} />
            </button>
            <span className="text-white text-[13px] font-extrabold">{formatCount(likesCount)}</span>
          </div>

          <div className="flex flex-col items-center gap-1">
            <button className="active:scale-90 transition-transform">
              <MessageCircle className="w-8 h-8 text-white" strokeWidth={2} />
            </button>
            <span className="text-white text-[13px] font-extrabold">{formatCount(reel.comments)}</span>
          </div>

          <div className="flex flex-col items-center gap-1">
            <button className="active:scale-90 transition-transform">
              <Send className="w-8 h-8 text-white -mt-1" strokeWidth={2} />
            </button>
            <span className="text-white text-[13px] font-extrabold">Share</span>
          </div>

          <button className="active:scale-90 transition-transform mt-2">
            <MoreHorizontal className="w-7 h-7 text-white" strokeWidth={2.5} />
          </button>
          
          <div className="w-9 h-9 rounded-md border-2 border-white overflow-hidden mt-3 animate-[spin_4s_linear_infinite]">
            <img src={reel.user_profile_pic || reel.userPic || `https://api.dicebear.com/7.x/avataaars/svg?seed=${reel.username}`} alt="audio" className="w-full h-full object-cover bg-black" />
          </div>
        </div>
      </div>
    </div>
  );
};

// 🔥 Main Reels Page Component 🔥
export default function ReelsPage() {
  const [currentUser, setCurrentUser] = useState(null);
  const [followedUsers, setFollowedUsers] = useState({});
  const [reels, setReels] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeReels = async () => {
      setLoading(true);
      
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);

      if (user) {
        const { data: myData } = await supabase.from('users').select('following').eq('id', user.id).single();
        if (myData?.following) {
          const followingDict = {};
          myData.following.forEach(id => { followingDict[id] = true; });
          setFollowedUsers(followingDict);
        }
      }

      await fetchReels();
    };
    
    initializeReels();
  }, []);

  const fetchReels = async () => {
    try {
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .eq('type', 'reel')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      if (data && data.length > 0) {
        setReels(data);
      } else {
        setReels(dummyReels);
      }
    } catch (error) {
      console.error("Error fetching reels:", error.message);
      setReels(dummyReels);
    } finally {
      setLoading(false);
    }
  };

  // 🚀 🔥 Reels के लिए असली Follow / Unfollow फंक्शन 🔥 🚀
  const handleFollowToggle = async (targetUserId) => {
    if (!currentUser) return alert("Please login to follow users!");
    if (String(targetUserId).startsWith('dummy')) {
      setFollowedUsers(prev => ({ ...prev, [targetUserId]: !prev[targetUserId] }));
      return;
    }

    const isFollowing = followedUsers[targetUserId];
    setFollowedUsers(prev => ({ ...prev, [targetUserId]: !isFollowing })); 

    try {
      const { data: me } = await supabase.from('users').select('following').eq('id', currentUser.id).single();
      const { data: target } = await supabase.from('users').select('followers').eq('id', targetUserId).single();

      let myFollowing = me?.following || [];
      let targetFollowers = target?.followers || [];

      if (isFollowing) {
        myFollowing = myFollowing.filter(id => id !== targetUserId);
        targetFollowers = targetFollowers.filter(id => id !== currentUser.id);
      } else {
        if (!myFollowing.includes(targetUserId)) myFollowing.push(targetUserId);
        if (!targetFollowers.includes(currentUser.id)) targetFollowers.push(currentUser.id);
      }

      await supabase.from('users').update({ following: myFollowing }).eq('id', currentUser.id);
      await supabase.from('users').update({ followers: targetFollowers }).eq('id', targetUserId);
    } catch (error) {
      console.error("Error following user:", error);
      setFollowedUsers(prev => ({ ...prev, [targetUserId]: isFollowing }));
    }
  };

  const handleLikeSync = async (reelId, newLikesCount, isLiked) => {
    if (!String(reelId).startsWith('dummy')) {
      try {
        await supabase.from('posts').update({ likes: newLikesCount }).eq('id', reelId);
      } catch (error) {
        console.error("Error syncing like:", error);
      }
    }
  };

  return (
    <div className="bg-black w-full h-[100dvh] overflow-y-scroll snap-y snap-mandatory [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] relative">
      
      <div className="absolute top-0 left-0 w-full p-4 flex justify-between items-center z-20 pointer-events-none">
        <h1 className="text-2xl font-black text-white drop-shadow-md tracking-tight">Reels</h1>
        <Camera className="w-7 h-7 text-white drop-shadow-md pointer-events-auto cursor-pointer" />
      </div>

      {loading ? (
        <div className="w-full h-full relative bg-black">
          <Skeleton className="w-full h-full rounded-none bg-gray-900" />
          <div className="absolute bottom-0 left-0 right-0 p-5 flex flex-col gap-3">
            <div className="flex items-center gap-3"><Skeleton className="w-10 h-10 rounded-full bg-gray-800" /><Skeleton className="w-28 h-4 bg-gray-800" /></div>
            <Skeleton className="w-64 h-3 bg-gray-800" />
            <Skeleton className="w-40 h-3 bg-gray-800" />
          </div>
        </div>
      ) : reels.length === 0 ? (
        <div className="w-full h-full flex flex-col justify-center items-center text-white">
          <span className="text-4xl mb-2">🎬</span>
          <p className="font-bold">No reels yet!</p>
        </div>
      ) : (
        reels.map((reel) => (
          <Reel 
            key={reel.id} 
            reel={reel} 
            onLikeToggle={handleLikeSync} 
            currentUser={currentUser}
            isFollowing={followedUsers[reel.user_id]}
            onFollowToggle={handleFollowToggle}
          />
        ))
      )}
      
    </div>
  );
}