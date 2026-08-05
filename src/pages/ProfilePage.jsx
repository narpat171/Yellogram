import React from 'react';
import { Grid, Video, Bookmark } from 'lucide-react'; // आइकन्स इम्पोर्ट करना ज़रूरी है

// export default लगाना ज़रूरी है
export default function ProfilePage() {
  return (
    <div className="bg-yellow-50 min-h-screen">
      
      {/* मोबाइल हेडर */}
      <header className="md:hidden bg-yellow-400 p-4 sticky top-0 z-20 flex justify-center items-center shadow-sm">
        <h1 className="text-lg font-extrabold text-gray-900">sarwar_singh</h1>
      </header>
      
      <div className="p-4 md:p-8">
        
        {/* प्रोफाइल पिक्चर और स्टैट्स */}
        <div className="flex items-center gap-6 mb-6">
          <div className="w-20 h-20 md:w-32 md:h-32 rounded-full p-1 border-2 border-yellow-500">
            <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=sarwar" alt="profile" className="w-full h-full rounded-full bg-yellow-200" />
          </div>
          <div className="flex-1 flex justify-around text-center">
            <div><p className="font-extrabold text-lg text-gray-900">12</p><p className="text-xs text-gray-600 font-medium">Posts</p></div>
            <div><p className="font-extrabold text-lg text-gray-900">1.2K</p><p className="text-xs text-gray-600 font-medium">Followers</p></div>
            <div><p className="font-extrabold text-lg text-gray-900">150</p><p className="text-xs text-gray-600 font-medium">Following</p></div>
          </div>
        </div>
        
        {/* बायो (Bio) सेक्शन */}
        <div className="mb-6">
          <h2 className="font-bold text-gray-900 text-lg">Sarwar Singh</h2>
          <p className="text-sm text-gray-700">Building YellowGram 💛<br/>React Dev 🚀</p>
        </div>
        
        {/* एडिट और शेयर प्रोफाइल बटन्स */}
        <div className="flex justify-between gap-2 mb-6">
          <button className="flex-1 bg-gray-200 text-gray-900 font-bold py-2 rounded-xl hover:bg-gray-300 transition-colors">Edit Profile</button>
          <button className="flex-1 bg-gray-200 text-gray-900 font-bold py-2 rounded-xl hover:bg-gray-300 transition-colors">Share Profile</button>
        </div>
        
        {/* ग्रिड, वीडियो और सेव्ड आइकन्स का टैब */}
        <div className="flex border-t border-yellow-200 pt-3 mb-1">
          <div className="flex-1 flex justify-center border-b-2 border-gray-900 pb-2 cursor-pointer">
            <Grid className="text-gray-900" />
          </div>
          <div className="flex-1 flex justify-center pb-2 opacity-40 hover:opacity-100 transition-opacity cursor-pointer">
            <Video className="text-gray-900" />
          </div>
          <div className="flex-1 flex justify-center pb-2 opacity-40 hover:opacity-100 transition-opacity cursor-pointer">
            <Bookmark className="text-gray-900" />
          </div>
        </div>
        
        {/* यूज़र की पोस्ट्स (Images Grid) */}
        <div className="grid grid-cols-3 gap-1">
          {[...Array(12)].map((_, i) => (
            <div key={i} className="aspect-square bg-yellow-100 overflow-hidden cursor-pointer hover:opacity-80 transition-opacity">
              <img src={`https://picsum.photos/300/300?random=${i + 50}`} alt="Post" className="w-full h-full object-cover" />
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}