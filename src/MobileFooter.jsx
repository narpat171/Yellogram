import React from 'react';
import { Home, Search, Plus, PlaySquare } from 'lucide-react';

// 🔥 1. यहाँ (Props में) onOpenCreateModal जोड़ें 
export default function MobileFooter({ onOpenCreateModal }) {
  return (
    <footer className="md:hidden bg-yellow-400 fixed bottom-0 w-full flex justify-around items-center p-3 border-t border-yellow-500 z-50">
      <Home className="w-7 h-7 text-gray-900 cursor-pointer hover:scale-110 transition-transform" />
      <Search className="w-7 h-7 text-gray-900 cursor-pointer hover:scale-110 transition-transform" />
      
      {/* 🔥 2. Upload Button पर onClick लगाएँ 🔥 */}
      <div 
        onClick={onOpenCreateModal} 
        className="bg-gray-900 rounded-xl p-2 cursor-pointer hover:bg-gray-800 transform hover:-translate-y-1 transition-all shadow-lg"
      >
        <Plus className="w-6 h-6 text-yellow-400" strokeWidth={3} />
      </div>
      
      <PlaySquare className="w-7 h-7 text-gray-900 cursor-pointer hover:scale-110 transition-transform" />
      
      <div className="w-7 h-7 rounded-md bg-gray-900 overflow-hidden cursor-pointer hover:scale-110 transition-transform border border-gray-900">
        <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=myprofile" alt="profile" className="w-full h-full object-cover" />
      </div>
    </footer>
  );
}