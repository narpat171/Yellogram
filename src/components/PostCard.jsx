import React, { useState } from 'react';
import { Heart, MessageCircle, Send, Bookmark } from 'lucide-react';

export default function PostCard({ post, index }) {
  const [isLiked, setIsLiked] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  
  const imageUrl = post.isReal ? post.image : `https://picsum.photos/500/500?random=${index}`;
  const captionText = post.isReal ? post.caption : "YellowGram is looking awesome! 💛";
  const creatorName = post.isReal ? "myprofile" : `creator_${index + 1}`;

  return (
    <article className="bg-white md:rounded-2xl border-y md:border border-yellow-200 shadow-sm overflow-hidden mb-6">
      <div className="flex items-center p-3 gap-3">
        <div className="w-8 h-8 rounded-md bg-yellow-300 overflow-hidden border border-yellow-400">
          <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${creatorName}`} alt="avatar" />
        </div>
        <span className="font-semibold text-sm text-gray-900">{creatorName}</span>
      </div>
      <div className="w-full h-[450px] bg-yellow-100 relative">
        <img src={imageUrl} alt="Post" className="w-full h-full object-cover" />
      </div>
      <div className="p-4">
        <div className="flex justify-between items-center mb-4">
          <div className="flex gap-4">
            <button onClick={() => setIsLiked(!isLiked)} className="outline-none flex items-center justify-center transform hover:scale-110">
              <Heart className={`w-6 h-6 ${isLiked ? 'text-red-500' : 'text-gray-900'}`} fill={isLiked ? "currentColor" : "none"} />
            </button>
            <MessageCircle className="w-6 h-6 text-gray-900 cursor-pointer" />
            <Send className="w-6 h-6 text-gray-900 cursor-pointer" />
          </div>
          <button onClick={() => setIsSaved(!isSaved)} className="outline-none transform hover:scale-110">
            <Bookmark className={`w-6 h-6 ${isSaved ? 'text-gray-900' : 'text-gray-900'}`} fill={isSaved ? "currentColor" : "none"} />
          </button>
        </div>
        <p className="font-bold text-sm text-gray-900 mb-1">{(1234 + (isLiked ? 1 : 0)).toLocaleString()} likes</p>
        <p className="text-sm text-gray-800"><span className="font-bold mr-2 text-gray-900">{creatorName}</span> {captionText}</p>
      </div>
    </article>
  );
}