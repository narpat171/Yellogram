import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Heart, Send } from 'lucide-react';
import PostCard from '../components/PostCard'; 
import StoryViewer from '../components/StoryViewer'; // 👈 StoryViewer इम्पोर्ट किया

export default function HomeFeed({ posts, stories }) {
  const navigate = useNavigate();
  
  // स्टोरी व्यूअर को खोलने और बंद करने के लिए State
  const [activeStoryIndex, setActiveStoryIndex] = useState(null);

  return (
    <>
      <header className="md:hidden bg-yellow-400 p-4 sticky top-0 z-20 flex justify-between items-center shadow-sm">
        <h1 className="text-2xl font-extrabold text-gray-900 italic">YellowGram</h1>
        <div className="flex gap-4">
          <Heart className="w-6 h-6 text-gray-900 cursor-pointer" />
          <Send onClick={() => navigate('/messages')} className="w-6 h-6 text-gray-900 cursor-pointer hover:scale-110 transition-transform" />
        </div>
      </header>

      {/* Stories Section */}
      <div className="bg-white md:bg-transparent p-3 md:pt-8 md:pb-6 border-b border-yellow-200 md:border-none flex gap-4 overflow-x-auto scrollbar-hide">
        <div className="flex flex-col items-center flex-shrink-0 cursor-pointer">
          <div className="w-16 h-16 bg-yellow-100 rounded-xl flex items-center justify-center relative border border-yellow-400 mb-1">
            <Plus className="w-8 h-8 text-yellow-600" />
          </div>
          <span className="text-xs text-gray-800 font-medium">Your Story</span>
        </div>
        
        {stories.map((story, index) => (
          <div 
            key={index} 
            onClick={() => setActiveStoryIndex(index)} // 👈 क्लिक करने पर स्टोरी ओपन होगी
            className="flex flex-col items-center flex-shrink-0 cursor-pointer hover:scale-105 transition-transform"
          >
            <div className="w-16 h-16 rounded-xl border-2 border-yellow-500 p-[2px] mb-1">
              <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${story}`} alt="story" className="w-full h-full object-cover rounded-lg bg-yellow-100" />
            </div>
            <span className="text-xs text-gray-800 font-medium">User_{story + 1}</span>
          </div>
        ))}
      </div>

      {/* Posts Section */}
      <div className="flex flex-col md:px-2 pt-2 md:pt-0">
        {posts.map((post, index) => <PostCard key={post.id} post={post} index={index} />)}
      </div>

      {/* Story Viewer Overlay (अगर कोई स्टोरी सेलेक्टेड है तो यह दिखेगा) */}
      {activeStoryIndex !== null && (
        <StoryViewer 
          stories={stories} 
          initialIndex={activeStoryIndex} 
          onClose={() => setActiveStoryIndex(null)} 
        />
      )}
    </>
  );
}