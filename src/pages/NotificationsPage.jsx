import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';

export default function NotificationsPage() {
  const navigate = useNavigate();

  // डमी नोटिफिकेशंस का डेटा
  const notifications = [
    { id: 1, type: 'like', user: 'creator_1', time: '2m', text: 'liked your post.', img: '10' },
    { id: 2, type: 'follow', user: 'awesome_creator', time: '1h', text: 'started following you.', img: null },
    { id: 3, type: 'comment', user: 'react_dev', time: '3h', text: 'commented: "This is pure gold! 🔥"', img: '11' },
    { id: 4, type: 'like', user: 'design_guru', time: '5h', text: 'liked your reel.', img: '12' },
    { id: 5, type: 'follow', user: 'sarwar_fan', time: '1d', text: 'started following you.', img: null },
    { id: 6, type: 'like', user: 'coder_xyz', time: '2d', text: 'liked your post.', img: '13' },
  ];

  return (
    <div className="min-h-screen bg-yellow-50 flex flex-col">
      
      {/* हेडर */}
      <div className="bg-yellow-400 p-4 sticky top-0 z-20 flex items-center gap-4 shadow-sm">
        <ChevronLeft 
          className="w-8 h-8 text-gray-900 cursor-pointer hover:scale-110 transition-transform" 
          onClick={() => navigate(-1)} // वापस पिछले पेज पर जाने के लिए
        />
        <h1 className="text-xl font-extrabold text-gray-900 flex-1">Notifications</h1>
      </div>

      {/* नोटिफिकेशंस लिस्ट */}
      <div className="flex flex-col p-2">
        <h2 className="font-bold text-gray-900 px-2 py-3">Today</h2>
        
        {notifications.map((notif) => (
          <div key={notif.id} className="flex items-center gap-3 p-3 hover:bg-yellow-100 rounded-2xl cursor-pointer transition-colors mb-1">
            
            {/* यूज़र का अवतार */}
            <div className="w-12 h-12 rounded-full bg-yellow-300 border border-yellow-500 overflow-hidden flex-shrink-0">
              <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${notif.user}`} alt={notif.user} />
            </div>
            
            {/* नोटिफिकेशन टेक्स्ट */}
            <div className="flex-1 text-sm">
              <span className="font-bold text-gray-900">{notif.user}</span>{' '}
              <span className="text-gray-700">{notif.text}</span>{' '}
              <span className="text-gray-500 font-medium ml-1">{notif.time}</span>
            </div>

            {/* राईट साइड का एक्शन (फॉलो बटन या पोस्ट की फोटो) */}
            {notif.type === 'follow' ? (
              <button className="bg-gray-900 text-yellow-400 font-bold px-4 py-1.5 rounded-xl text-xs hover:bg-gray-800 transition-colors">
                Follow
              </button>
            ) : (
              <div className="w-12 h-12 bg-yellow-200 rounded-md overflow-hidden flex-shrink-0">
                <img src={`https://picsum.photos/300/300?random=${notif.img}`} alt="Post preview" className="w-full h-full object-cover" />
              </div>
            )}
          </div>
        ))}
      </div>
      
    </div>
  );
}