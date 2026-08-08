import React, { useState, useEffect } from 'react';
// 🔥 Firebase हटाकर Supabase मँगवाया 🔥
import { supabase } from './supabase';
import { OnlineContext } from './OnlineContext';
import { BrowserRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { Home, Search, Plus, PlaySquare, Heart, Send } from 'lucide-react';
import CreatePostModal from './pages/CreatePostModal'; 
import HomeFeed from './pages/HomeFeed';
import SearchPage from './pages/SearchPage';
import ReelsPage from './pages/ReelsPage';
import ProfilePage from './pages/ProfilePage';
import MessagesPage from './pages/MessagesPage';
import ChatRoom from './pages/ChatRoom';
import AuthPage from './pages/AuthPage'; 
import CallRoom from './pages/CallRoom';
import Notifications from './pages/Notifications';
import ForwardPage from './pages/ForwardPage';

const MainLayout = ({ currentUser }) => {
  // 🔥 नए पॉप-अप (Modal) को खोलने और बंद करने का State 🔥
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  
  const navigate = useNavigate();
  const location = useLocation();

  const isMessageRoute = location.pathname.includes('/messages') || location.pathname.includes('/chat') || location.pathname.includes('/call');

  // 🔥 Keep-alive Tabs: Tab एक बार लोड हुआ तो हमेशा के लिए रहता है, बस दिखना/छिपना होता है → बिना loading के तुरंत खुलता है 🔥
  const isTabActive = (path) => (location.pathname === path ? 'block' : 'hidden');

  // 👇 आपका शानदार UI बिल्कुल वैसा ही है 👇
  return (
    <div className="min-h-screen bg-yellow-50 flex flex-col md:flex-row font-sans relative overflow-x-hidden">
      
      {!isMessageRoute && (
        <nav className="hidden md:flex flex-col fixed left-0 top-0 h-screen w-64 bg-yellow-400 border-r border-yellow-500 p-6 z-40 shadow-lg">
          <h1 className="text-3xl font-extrabold text-gray-900 italic tracking-tight mb-10">YellowGram</h1>
          <div className="flex flex-col gap-7 flex-1">
            <div onClick={() => navigate('/')} className={`flex items-center gap-4 cursor-pointer hover:scale-105 transition-transform ${location.pathname === '/' ? 'text-black' : 'text-gray-700'}`}><Home className="w-7 h-7" /><span className="text-lg font-bold">Home</span></div>
            <div onClick={() => navigate('/search')} className={`flex items-center gap-4 cursor-pointer hover:scale-105 transition-transform ${location.pathname === '/search' ? 'text-black' : 'text-gray-700'}`}><Search className="w-7 h-7" /><span className="text-lg font-bold">Search</span></div>
            <div onClick={() => navigate('/reels')} className={`flex items-center gap-4 cursor-pointer hover:scale-105 transition-transform ${location.pathname === '/reels' ? 'text-black' : 'text-gray-700'}`}><PlaySquare className="w-7 h-7" /><span className="text-lg font-bold">Reels</span></div>
            <div onClick={() => navigate('/messages')} className={`flex items-center gap-4 cursor-pointer hover:scale-105 transition-transform ${location.pathname.includes('/messages') ? 'text-black' : 'text-gray-700'}`}><Send className="w-7 h-7" /><span className="text-lg font-bold">Messages</span></div>
            <div onClick={() => navigate('/notifications')} className="flex items-center gap-4 cursor-pointer hover:scale-105 transition-transform text-gray-700"><Heart className="w-7 h-7" /><span className="text-lg font-bold">Notifications</span></div>
            
            {/* 🔥 Sidebar का Create Button 🔥 */}
            <div onClick={() => setIsCreateModalOpen(true)} className="flex items-center gap-3 cursor-pointer bg-gray-900 text-yellow-400 p-3 rounded-xl hover:bg-gray-800 transition-all shadow-md w-max mt-2">
              <Plus className="w-6 h-6" strokeWidth={3} />
              <span className="text-lg font-bold pr-2">Create</span>
            </div>

            <div onClick={() => navigate('/profile')} className="flex items-center gap-4 cursor-pointer hover:scale-105 transition-transform mt-auto">
              <div className={`w-8 h-8 rounded-full overflow-hidden border-2 ${location.pathname === '/profile' ? 'border-gray-900' : 'border-transparent'}`}>
                <img src={currentUser?.profilePic || "https://api.dicebear.com/7.x/avataaars/svg?seed=myprofile"} alt="Profile" className="w-full h-full object-cover" />
              </div>
              <span className="text-lg font-bold text-gray-900">Profile</span>
            </div>
          </div>
        </nav>
      )}

      <main className={`flex-1 w-full flex justify-center ${!isMessageRoute ? 'pb-16 md:pb-0 md:ml-64' : ''}`}>
        <div className="w-full max-w-lg min-h-screen border-x border-yellow-200 shadow-2xl bg-yellow-50 flex flex-col">
          {/* 🔥 Keep-alive Tabs — हमेशा mounted रहते हैं, बिना loading के तुरंत खुलते हैं 🔥 */}
          <div className={isTabActive('/')}><HomeFeed /></div>
          <div className={isTabActive('/search')}><SearchPage /></div>
          <div className={isTabActive('/reels')}><ReelsPage /></div>
          <div className={isTabActive('/profile')}><ProfilePage /></div>

          <Routes>
            {/* 🔥 पुश की गई Pages — खुलते समय ताज़ा fetch करती हैं 🔥 */}
            <Route path="/profile/:userId" element={<ProfilePage />} />
            <Route path="/messages" element={<MessagesPage />} />
            <Route path="/chat/:id" element={<ChatRoom />} />
            <Route path="/forward" element={<ForwardPage />} />
            <Route path="/call/:roomId" element={<CallRoom />} />
            <Route path="/notifications" element={<Notifications />} />
            <Route path="*" element={null} />
          </Routes>
        </div>
      </main>

      {!isMessageRoute && (
        <footer className="md:hidden bg-yellow-400 fixed bottom-0 w-full flex justify-around items-center p-3 border-t border-yellow-500 z-40">
          <Home onClick={() => navigate('/')} className={`w-7 h-7 cursor-pointer hover:scale-110 transition-transform ${location.pathname === '/' ? 'text-black fill-black' : 'text-gray-700'}`} />
          <Search onClick={() => navigate('/search')} className={`w-7 h-7 cursor-pointer hover:scale-110 transition-transform ${location.pathname === '/search' ? 'text-black' : 'text-gray-700'}`} />
          
          {/* 🔥 Mobile Footer का Create Button 🔥 */}
          <div onClick={() => setIsCreateModalOpen(true)} className="bg-gray-900 rounded-xl p-2 cursor-pointer hover:bg-gray-800 transform hover:-translate-y-1 transition-all shadow-lg">
            <Plus className="w-6 h-6 text-yellow-400" strokeWidth={3} />
          </div>
          
          <PlaySquare onClick={() => navigate('/reels')} className={`w-7 h-7 cursor-pointer hover:scale-110 transition-transform ${location.pathname === '/reels' ? 'text-black fill-black' : 'text-gray-700'}`} />
          <div onClick={() => navigate('/profile')} className={`w-7 h-7 rounded-full overflow-hidden cursor-pointer border-2 ${location.pathname === '/profile' ? 'border-gray-900' : 'border-transparent'}`}>
            <img src={currentUser?.profilePic || "https://api.dicebear.com/7.x/avataaars/svg?seed=myprofile"} alt="Profile" className="w-full h-full object-cover" />
          </div>
        </footer>
      )}
      
      {/* 🔥 सबसे नीचे नया CreatePostModal रेंडर किया है 🔥 */}
      <CreatePostModal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} />
      
    </div>
  );
};

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [onlineUsers, setOnlineUsers] = useState(() => new Set());

  // 🟢 Global Presence — jab bhi user app khula rakhe, online dikhe + last_seen update hota rahe 🟢
  useEffect(() => {
    if (!currentUser?.uid) return;
    let cancelled = false;
    let channel = null;

    try {
      channel = supabase.channel('global-presence', { config: { presence: { key: currentUser.uid } } });
      channel
        .on('presence', { event: 'sync' }, () => {
          if (cancelled) return;
          const state = channel.presenceState();
          setOnlineUsers(new Set(Object.keys(state)));
        })
        .subscribe(async status => {
          if (status === 'SUBSCRIBED' && !cancelled) {
            await channel.track({ user_id: currentUser.uid, online_at: new Date().toISOString() });
          }
        });
    } catch (e) {
      console.error('Presence error:', e);
    }

    // 🔥 heartbeat: हर 30 सेकंड में last_seen ताज़ा करो 🔥
    const heartbeat = setInterval(() => {
      supabase.from('users').update({ last_seen: new Date().toISOString() }).eq('id', currentUser.uid).then();
    }, 30000);

    return () => {
      cancelled = true;
      clearInterval(heartbeat);
      if (channel) supabase.removeChannel(channel);
      supabase.from('users').update({ last_seen: new Date().toISOString() }).eq('id', currentUser.uid).then();
    };
  }, [currentUser?.uid]);

  // 🚀 Supabase Auth Logic 🚀
  useEffect(() => {
    // 1. फंक्शन जो यूज़र का डेटा Supabase Database से लाता है
    const fetchUserData = async (sessionUser) => {
      if (sessionUser) {
        const { data: userDoc } = await supabase
          .from('users')
          .select('*')
          .eq('id', sessionUser.id)
          .single();

        if (userDoc) {
          setCurrentUser({
            uid: sessionUser.id,
            email: sessionUser.email,
            displayName: userDoc.username || "New Creator",
            username: userDoc.username || sessionUser.email.split('@')[0],
            profilePic: userDoc.profile_pic || `https://api.dicebear.com/7.x/avataaars/svg?seed=${sessionUser.email}`
          });
        } else {
          setCurrentUser({
            uid: sessionUser.id,
            email: sessionUser.email,
            displayName: "New Creator",
            username: sessionUser.email.split('@')[0],
            profilePic: `https://api.dicebear.com/7.x/avataaars/svg?seed=${sessionUser.email}`
          });
        }
      } else {
        setCurrentUser(null);
      }
      setLoading(false);
    };

    // 2. पहली बार ऐप खुलते ही सेशन चेक करें
    supabase.auth.getSession().then(({ data: { session } }) => {
      fetchUserData(session?.user);
    });

    // 3. अगर यूज़र लॉग-इन या लॉग-आउट होता है, तो तुरंत अपडेट करें
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      fetchUserData(session?.user);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-yellow-50">
        <div className="w-12 h-12 border-4 border-yellow-400 border-t-gray-900 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!currentUser) {
    return <AuthPage onLogin={() => {}} />;
  }

  return (
    <OnlineContext.Provider value={onlineUsers}>
      <BrowserRouter>
        <MainLayout currentUser={currentUser} />
      </BrowserRouter>
    </OnlineContext.Provider>
  );
}