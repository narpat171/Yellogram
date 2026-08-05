import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

export default function StoryViewer({ stories, initialIndex, onClose }) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [progress, setProgress] = useState(0);

  // 5 सेकंड का टाइमर चलाने के लिए (Progress bar)
  useEffect(() => {
    setProgress(0);
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 1; // हर 50ms में 1% बढ़ेगा (कुल 5 सेकंड)
      });
    }, 50);

    return () => clearInterval(interval);
  }, [currentIndex]);

  // जब प्रोग्रेस 100% हो जाए, तो अगली स्टोरी पर जाएं
  useEffect(() => {
    if (progress === 100) {
      if (currentIndex < stories.length - 1) {
        setCurrentIndex(currentIndex + 1);
      } else {
        onClose(); // अगर आखिरी स्टोरी है, तो बंद कर दो
      }
    }
  }, [progress, currentIndex, stories, onClose]);

  // स्क्रीन पर टैप करने से आगे या पीछे जाने के लिए
  const handleTap = (e) => {
    const screenWidth = window.innerWidth;
    if (e.clientX < screenWidth / 2) {
      // लेफ्ट में टैप किया -> पिछली स्टोरी
      if (currentIndex > 0) setCurrentIndex(currentIndex - 1);
    } else {
      // राइट में टैप किया -> अगली स्टोरी
      if (currentIndex < stories.length - 1) setCurrentIndex(currentIndex + 1);
      else onClose();
    }
  };

  const currentStoryId = stories[currentIndex];

  return (
    <div className="fixed inset-0 z-[100] bg-black flex flex-col h-screen w-screen overflow-hidden text-white">
      
      {/* ऊपर का Progress Bar */}
      <div className="absolute top-0 left-0 w-full flex gap-1 p-2 z-20 pt-4">
        {stories.map((_, index) => (
          <div key={index} className="h-[3px] flex-1 bg-gray-600 rounded-full overflow-hidden">
            <div 
              className="h-full bg-white transition-all duration-75 ease-linear"
              style={{
                width: index === currentIndex ? `${progress}%` : index < currentIndex ? '100%' : '0%'
              }}
            ></div>
          </div>
        ))}
      </div>

      {/* हेडर (प्रोफाइल और क्लोज बटन) */}
      <div className="absolute top-6 left-0 w-full flex justify-between items-center px-4 z-20">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full overflow-hidden border border-white">
            <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${currentStoryId}`} alt="creator" />
          </div>
          <span className="font-bold text-sm shadow-black drop-shadow-md">User_{currentStoryId + 1}</span>
          <span className="text-gray-300 text-xs shadow-black drop-shadow-md">2h</span>
        </div>
        <button onClick={onClose} className="p-2 cursor-pointer hover:scale-110">
          <X size={28} className="drop-shadow-md" />
        </button>
      </div>

      {/* स्टोरी की इमेज और टैप एरिया */}
      <div className="flex-1 w-full relative flex items-center justify-center cursor-pointer" onClick={handleTap}>
        <img 
          src={`https://picsum.photos/400/800?random=${currentStoryId + 20}`} 
          alt="Story Content" 
          className="w-full h-full object-cover md:w-auto md:max-w-md" 
        />
        
        {/* नीचे का रिप्लाई बॉक्स */}
        <div className="absolute bottom-4 left-0 w-full px-4 flex gap-3 z-20" onClick={e => e.stopPropagation()}>
          <input 
            type="text" 
            placeholder="Send message..." 
            className="flex-1 bg-transparent border border-gray-400 rounded-full px-4 py-2 text-white focus:outline-none focus:border-white placeholder-gray-300"
          />
          <button className="text-2xl hover:scale-110 transition-transform">❤️</button>
        </div>
      </div>

    </div>
  );
}