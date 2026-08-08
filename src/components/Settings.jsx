import React from 'react';
import { ArrowLeft, ChevronRight, LogOut } from 'lucide-react';
import { supabase } from '../supabase'; // अगर supabase किसी और फोल्डर में है, तो पाथ सही कर लें

export default function Settings({ onClose }) {
  
  // Logout का पूरा लॉजिक अब यहीं रहेगा
  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = '/'; 
  };

  return (
    <div className="fixed inset-0 z-50 bg-gray-50 flex flex-col animate-in slide-in-from-right-full duration-300">
      
      {/* Header */}
      <div className="bg-white p-4 flex items-center gap-4 border-b border-gray-100 shadow-sm sticky top-0">
        <ArrowLeft 
          className="w-6 h-6 text-gray-900 cursor-pointer active:scale-90 transition-transform" 
          onClick={onClose} 
        />
        <h2 className="text-xl font-bold text-gray-900">Settings</h2>
      </div>

      {/* Menu Options */}
      <div className="mt-3 bg-white border-y border-gray-100 flex flex-col">
        <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between text-gray-900 cursor-pointer hover:bg-gray-50 active:bg-gray-100 transition-colors">
           <span className="font-semibold text-[16px]">Account center</span>
           <ChevronRight className="w-5 h-5 text-gray-400" />
        </div>
        <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between text-gray-900 cursor-pointer hover:bg-gray-50 active:bg-gray-100 transition-colors">
           <span className="font-semibold text-[16px]">Notifications</span>
           <ChevronRight className="w-5 h-5 text-gray-400" />
        </div>
        <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between text-gray-900 cursor-pointer hover:bg-gray-50 active:bg-gray-100 transition-colors">
           <span className="font-semibold text-[16px]">Privacy & security</span>
           <ChevronRight className="w-5 h-5 text-gray-400" />
        </div>
      </div>

      {/* Logout Button */}
      <div className="mt-3 bg-white border-y border-gray-100 flex flex-col">
        <button 
          onClick={handleLogout} 
          className="w-full px-5 py-4 text-left text-red-600 font-bold active:bg-red-50 flex items-center gap-3 transition-colors text-[16px]"
        >
          <LogOut className="w-[22px] h-[22px]" /> Log out
        </button>
      </div>
      
    </div>
  );
}