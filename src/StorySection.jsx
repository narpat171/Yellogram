import React from 'react';
import { Plus } from 'lucide-react';

export default function StorySection() {
  const stories = [1, 2, 3, 4, 5, 6, 7, 8];

  return (
    <div className="bg-white md:bg-transparent p-3 md:pt-8 md:pb-6 border-b border-yellow-200 md:border-none flex gap-4 overflow-x-auto scrollbar-hide">
      {/* Your Story */}
      <div className="flex flex-col items-center flex-shrink-0 cursor-pointer">
        <div className="w-16 h-16 bg-yellow-100 rounded-xl flex items-center justify-center relative border border-yellow-400 mb-1">
          <Plus className="w-8 h-8 text-yellow-600" />
        </div>
        <span className="text-xs text-gray-800 font-medium">Your Story</span>
      </div>
      
      {/* Other Stories */}
      {stories.map((story, i) => (
        <div key={i} className="flex flex-col items-center flex-shrink-0 cursor-pointer hover:scale-105 transition-transform">
          <div className="w-16 h-16 rounded-xl border-2 border-yellow-500 p-[2px] mb-1">
            <img
              src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${i}`}
              alt="Story"
              className="w-full h-full object-cover rounded-lg bg-yellow-100"
            />
          </div>
          <span className="text-xs text-gray-800 font-medium">User_{i+1}</span>
        </div>
      ))}
    </div>
  );
}