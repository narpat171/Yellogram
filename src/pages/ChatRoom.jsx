import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, Send } from 'lucide-react';

export default function ChatRoom() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [message, setMessage] = useState('');
  const [chatHistory, setChatHistory] = useState([
    { id: 1, sender: 'them', text: 'Hey, did you see the new update?' },
    { id: 2, sender: 'me', text: 'Yes! The YellowGram DM is looking fire! 🔥' }
  ]);

  const sendMessage = () => {
    if(!message.trim()) return;
    setChatHistory([...chatHistory, { id: Date.now(), sender: 'me', text: message }]);
    setMessage('');
  };

  return (
    <div className="h-[calc(100vh)] bg-yellow-50 flex flex-col">
      <div className="bg-yellow-400 p-4 sticky top-0 z-20 flex items-center gap-4 shadow-sm">
        <ChevronLeft className="w-8 h-8 text-gray-900 cursor-pointer hover:scale-110" onClick={() => navigate('/messages')} />
        <div className="w-10 h-10 rounded-xl bg-yellow-300 overflow-hidden border border-yellow-500">
          <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=user_${id}`} alt="avatar" />
        </div>
        <h1 className="text-lg font-bold text-gray-900 flex-1">Chat User {id}</h1>
      </div>

      <div className="flex-1 p-4 overflow-y-auto flex flex-col gap-4">
        {chatHistory.map(msg => (
          <div key={msg.id} className={`max-w-[75%] p-3 px-4 shadow-sm ${msg.sender === 'me' ? 'bg-gray-900 text-yellow-400 self-end rounded-t-2xl rounded-bl-2xl' : 'bg-white text-gray-900 border border-yellow-300 self-start rounded-t-2xl rounded-br-2xl'}`}>
            <p className="text-sm font-medium">{msg.text}</p>
          </div>
        ))}
      </div>

      <div className="p-4 bg-white border-t border-yellow-200 flex items-center gap-3 sticky bottom-0">
        <div className="flex-1 bg-yellow-50 border border-yellow-300 rounded-full flex items-center px-4 py-2">
          <input 
            type="text" placeholder="Message..." 
            value={message} onChange={(e) => setMessage(e.target.value)} 
            onKeyDown={(e) => e.key === 'Enter' && sendMessage()} 
            className="w-full bg-transparent focus:outline-none text-gray-900" 
          />
        </div>
        <button onClick={sendMessage} className="bg-gray-900 p-3 rounded-full text-yellow-400 hover:scale-110 transition-transform shadow-md">
          <Send className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}