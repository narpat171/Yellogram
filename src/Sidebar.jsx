import React from 'react';
import { Home, Search, Plus, PlaySquare, Heart } from 'lucide-react';

export default function Sidebar() {
  return (
    <nav className="hidden md:flex flex-col fixed left-0 top-0 h-screen w-64 bg-yellow-400 border-r border-yellow-500 p-6 z-50 shadow-lg">
      <h1 className="text-3xl font-extrabold text-gray-900 italic tracking-tight mb-10">YellowGram</h1>
      
      <div className="flex flex-col gap-7 flex-1">
        <div className="flex items-center gap-4 cursor-pointer hover:scale-105 transition-transform">
          <Home className="w-7 h-7 text-gray-900" />
          <span className="text-lg font-semibold text-gray-900">Home</span>
        </div>
        <div className="flex items-center gap-4 cursor-pointer hover:scale-105 transition-transform">
          <Search className="w-7 h-7 text-gray-900" />
          <span className="text-lg font-semibold text-gray-900">Search</span>
        </div>
        <div className="flex items-center gap-4 cursor-pointer hover:scale-105 transition-transform">
          <PlaySquare className="w-7 h-7 text-gray-900" />
          <span className="text-lg font-semibold text-gray-900">Reels</span>
        </div>
        <div className="flex items-center gap-4 cursor-pointer hover:scale-105 transition-transform">
          <Heart className="w-7 h-7 text-gray-900" />
          <span className="text-lg font-semibold text-gray-900">Notifications</span>
        </div>
        
        {/* Create Button */}
        <div className="flex items-center gap-3 cursor-pointer bg-gray-900 text-yellow-400 p-3 rounded-xl hover:bg-gray-800 transition-all shadow-md w-max mt-2">
          <Plus className="w-6 h-6" strokeWidth={3} />
          <span className="text-lg font-bold pr-2">Create</span>
        </div>

        <div className="flex items-center gap-4 cursor-pointer hover:scale-105 transition-transform mt-auto">
          <div className="w-8 h-8 rounded-md bg-gray-900 overflow-hidden border border-gray-900">
            <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=myprofile" alt="profile" className="w-full h-full object-cover" />
          </div>
          <span className="text-lg font-semibold text-gray-900">Profile</span>
        </div>
      </div>
    </nav>
  );
}