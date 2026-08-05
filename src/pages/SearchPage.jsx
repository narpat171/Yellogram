import React from 'react';
import { Search } from 'lucide-react'; // Search आइकॉन इम्पोर्ट करना ज़रूरी है

export default function SearchPage() {
  return (
    <div className="p-2 md:pt-8 min-h-screen">
      
      {/* सर्च बार (Search Input) */}
      <div className="bg-white p-3 rounded-2xl flex items-center gap-3 border border-yellow-300 shadow-sm mb-4 mx-2">
        <Search className="text-gray-400 w-5 h-5" />
        <input 
          type="text" 
          placeholder="Search accounts, tags..." 
          className="bg-transparent w-full focus:outline-none text-gray-800" 
        />
      </div>

      {/* एक्सप्लोर ग्रिड (Explore Grid Images) */}
      <div className="grid grid-cols-3 gap-1 md:gap-2 px-1">
        {[...Array(15)].map((_, i) => (
          <div 
            key={i} 
            className="aspect-square bg-yellow-100 rounded-md overflow-hidden cursor-pointer hover:opacity-80 transition-opacity"
          >
            <img 
              src={`https://picsum.photos/300/300?random=${i + 10}`} 
              alt="Explore" 
              className="w-full h-full object-cover" 
            />
          </div>
        ))}
      </div>
      
    </div>
  );
}