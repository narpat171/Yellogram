import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Plus, Search } from 'lucide-react';

export default function MessagesPage() {
  const navigate = useNavigate();
  const chats = [
    { id: 1, name: 'creator_1', msg: 'Awesome UI bro! 💛', time: '2h' },
    { id: 2, name: 'awesome_creator', msg: 'Sent an attachment.', time: '5h' },
    { id: 3, name: 'react_dev', msg: 'Can you share the code?', time: '1d' },
    { id: 4, name: 'design_guru', msg: 'Love the yellow theme! ✨', time: '2d' }
  ];

  return (
    <div className="min-h-screen bg-yellow-50 flex flex-col">
      <div className="bg-yellow-400 p-4 sticky top-0 z-20 flex items-center gap-4 shadow-sm">
        <ChevronLeft className="w-8 h-8 text-gray-900 cursor-pointer hover:scale-110" onClick={() => navigate('/')} />
        <h1 className="text-xl font-extrabold text-gray-900 flex-1">Messages</h1>
        <Plus className="w-7 h-7 text-gray-900 cursor-pointer" />
      </div>
      <div className="p-4">
        <div className="bg-white p-3 rounded-2xl flex items-center gap-3 border border-yellow-300 shadow-sm">
          <Search className="text-gray-400 w-5 h-5" />
          <input type="text" placeholder="Search messages..." className="bg-transparent w-full focus:outline-none text-gray-800" />
        </div>
      </div>
      <div className="flex flex-col px-2">
        {chats.map(chat => (
          <div key={chat.id} onClick={() => navigate(`/chat/${chat.id}`)} className="flex items-center gap-4 p-3 hover:bg-yellow-100 cursor-pointer rounded-2xl transition-colors mb-1">
            <div className="w-14 h-14 rounded-xl bg-yellow-300 border-2 border-yellow-500 overflow-hidden flex-shrink-0">
              <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${chat.name}`} alt={chat.name} />
            </div>
            <div className="flex-1 overflow-hidden">
              <h3 className="font-bold text-gray-900">{chat.name}</h3>
              <p className="text-sm text-gray-600 truncate">{chat.msg}</p>
            </div>
            <span className="text-xs font-bold text-gray-500">{chat.time}</span>
          </div>
        ))}
      </div>
    </div>
  );
}