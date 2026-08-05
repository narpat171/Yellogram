import React from 'react';
import { Heart, MessageCircle, Send } from 'lucide-react'; // आइकन्स को इम्पोर्ट करना ज़रूरी है

// 'export default' लगाना ज़रूरी है ताकि App.jsx इसे इस्तेमाल कर सके
export default function ReelsPage() {
  return (
    <div className="h-[calc(100vh-64px)] md:h-screen bg-black flex items-center justify-center relative overflow-hidden text-white">
      
      {/* बैकग्राउंड वीडियो */}
      <video autoPlay loop muted className="w-full h-full object-cover opacity-80" src="https://www.w3schools.com/html/mov_bbb.mp4" />
      
      {/* राइट साइड वाले लाइक, कमेंट और शेयर के बटन्स */}
      <div className="absolute right-4 bottom-24 flex flex-col gap-6 items-center">
        <div className="flex flex-col items-center gap-1 cursor-pointer">
          <Heart className="w-8 h-8 hover:scale-110 transition-transform" />
          <span>142k</span>
        </div>
        <div className="flex flex-col items-center gap-1 cursor-pointer">
          <MessageCircle className="w-8 h-8 hover:scale-110 transition-transform" />
          <span>1,203</span>
        </div>
        <div className="flex flex-col items-center gap-1 cursor-pointer">
          <Send className="w-8 h-8 hover:scale-110 transition-transform" />
        </div>
      </div>
      
      {/* बॉटम लेफ्ट में क्रिएटर की प्रोफाइल और कैप्शन */}
      <div className="absolute bottom-16 left-4">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-10 h-10 rounded-full bg-yellow-400 overflow-hidden">
            <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=reelcreator" alt="creator avatar" />
          </div>
          <span className="font-bold">awesome_creator</span>
          <button className="border border-white px-3 py-1 rounded-xl text-xs font-bold ml-2 hover:bg-white hover:text-black transition-colors">
            Follow
          </button>
        </div>
        <p className="text-sm drop-shadow-md">Enjoying the YellowGram reels! ✨🔥</p>
      </div>

    </div>
  );
}