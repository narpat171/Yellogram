import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { Home, Search, Plus, PlaySquare, Heart, Send } from 'lucide-react';
import NotificationsPage from './pages/NotificationsPage';
import CreateCameraPage from './components/CreateCameraPage';
import HomeFeed from './pages/HomeFeed';
import SearchPage from './pages/SearchPage';
import ReelsPage from './pages/ReelsPage';
import ProfilePage from './pages/ProfilePage';
import MessagesPage from './pages/MessagesPage';
import ChatRoom from './pages/ChatRoom';

const MainLayout = () => {
  const [posts, setPosts] = useState([{ id: 1, isReal: false }, { id: 2, isReal: false }, { id: 3, isReal: false }]);
  const stories = [1, 2, 3, 4, 5, 6, 7, 8];
  
  const [isCameraMounted, setIsCameraMounted] = useState(false);
  const [isCameraVisible, setIsCameraVisible] = useState(false);
  
  const navigate = useNavigate();
  const location = useLocation();

  const openCamera = () => { setIsCameraMounted(true); setTimeout(() => setIsCameraVisible(true), 10); };
  const closeCamera = () => { setIsCameraVisible(false); setTimeout(() => setIsCameraMounted(false), 300); };
  
  const addNewPost = (image, caption) => {
    setPosts([{ id: Date.now(), isReal: true, image, caption }, ...posts]);
    closeCamera();
    navigate('/');
  };

  const isMessageRoute = location.pathname.includes('/messages') || location.pathname.includes('/chat');

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
            
            <div onClick={openCamera} className="flex items-center gap-3 cursor-pointer bg-gray-900 text-yellow-400 p-3 rounded-xl hover:bg-gray-800 transition-all shadow-md w-max mt-2">
              <Plus className="w-6 h-6" strokeWidth={3} />
              <span className="text-lg font-bold pr-2">Create</span>
            </div>

            <div onClick={() => navigate('/profile')} className="flex items-center gap-4 cursor-pointer hover:scale-105 transition-transform mt-auto">
              <div className={`w-8 h-8 rounded-full overflow-hidden border-2 ${location.pathname === '/profile' ? 'border-gray-900' : 'border-transparent'}`}><img src="https://api.dicebear.com/7.x/avataaars/svg?seed=myprofile" /></div>
              <span className="text-lg font-bold text-gray-900">Profile</span>
            </div>
          </div>
        </nav>
      )}

      <main className={`flex-1 w-full flex justify-center ${!isMessageRoute ? 'pb-16 md:pb-0 md:ml-64' : ''}`}>
        <div className="w-full max-w-lg min-h-screen border-x border-yellow-200 shadow-2xl bg-yellow-50 flex flex-col">
          <Routes>
            <Route path="/" element={<HomeFeed posts={posts} stories={stories} />} />
            <Route path="/search" element={<SearchPage />} />
            <Route path="/reels" element={<ReelsPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/messages" element={<MessagesPage />} />
            <Route path="/chat/:id" element={<ChatRoom />} />
            <Route path="/notifications" element={<NotificationsPage />} />
          </Routes>
        </div>
      </main>

      {!isMessageRoute && (
        <footer className="md:hidden bg-yellow-400 fixed bottom-0 w-full flex justify-around items-center p-3 border-t border-yellow-500 z-40">
          <Home onClick={() => navigate('/')} className={`w-7 h-7 cursor-pointer hover:scale-110 transition-transform ${location.pathname === '/' ? 'text-black fill-black' : 'text-gray-700'}`} />
          <Search onClick={() => navigate('/search')} className={`w-7 h-7 cursor-pointer hover:scale-110 transition-transform ${location.pathname === '/search' ? 'text-black' : 'text-gray-700'}`} />
          <div onClick={openCamera} className="bg-gray-900 rounded-xl p-2 cursor-pointer hover:bg-gray-800 transform hover:-translate-y-1 transition-all shadow-lg">
            <Plus className="w-6 h-6 text-yellow-400" strokeWidth={3} />
          </div>
          <PlaySquare onClick={() => navigate('/reels')} className={`w-7 h-7 cursor-pointer hover:scale-110 transition-transform ${location.pathname === '/reels' ? 'text-black fill-black' : 'text-gray-700'}`} />
          <div onClick={() => navigate('/profile')} className={`w-7 h-7 rounded-full overflow-hidden cursor-pointer border-2 ${location.pathname === '/profile' ? 'border-gray-900' : 'border-transparent'}`}>
            <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=myprofile" />
          </div>
        </footer>
      )}
      
      {isCameraMounted && <CreateCameraPage isVisible={isCameraVisible} onClose={closeCamera} onShare={addNewPost} />}
    </div>
  );
};

export default function App() {
  return (
    <BrowserRouter>
      <MainLayout />
    </BrowserRouter>
  );
}