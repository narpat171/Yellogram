import React, { useState, useRef } from 'react';
import { X, ImagePlus, UploadCloud } from 'lucide-react';

export default function CreatePostModal({ isOpen, onClose }) {
  const [caption, setCaption] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);
  
  // छिपे हुए <input type="file"> को क्लिक करने के लिए
  const fileInputRef = useRef(null);

  // अगर पॉप-अप खुला नहीं है, तो कुछ भी मत दिखाओ
  if (!isOpen) return null;

  // जब यूज़र कोई फोटो सेलेक्ट करे
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // फाइल को URL में बदलकर स्टेट में सेव करें ताकि प्रीव्यू दिख सके
      const imageUrl = URL.createObjectURL(file);
      setSelectedImage(imageUrl);
    }
  };

  // जब पोस्ट शेयर हो जाए
  const handleShare = () => {
    if (!selectedImage) {
      alert("Please select an image first!");
      return;
    }
    alert("Your post is ready to be shared! 🚀");
    // सब कुछ रीसेट करें और पॉप-अप बंद करें
    setCaption('');
    setSelectedImage(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden transform scale-100 transition-all">
        
        {/* Header */}
        <div className="bg-yellow-400 p-4 flex justify-between items-center border-b border-yellow-500">
          <h2 className="text-lg font-extrabold text-gray-900">Create New Post</h2>
          <button 
            onClick={() => {
              setCaption('');
              setSelectedImage(null);
              onClose();
            }}
            className="p-1 hover:bg-yellow-500 rounded-full transition-colors outline-none"
          >
            <X className="w-6 h-6 text-gray-900" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 flex flex-col gap-4">
          
          {/* अदृश्य फाइल इनपुट (File Input) */}
          <input 
            type="file" 
            accept="image/*" 
            ref={fileInputRef} 
            onChange={handleImageChange} 
            className="hidden" 
          />

          {/* इमेज अपलोड एरिया या इमेज प्रीव्यू */}
          {selectedImage ? (
            <div className="w-full h-64 relative rounded-xl overflow-hidden border-2 border-yellow-400 group">
              <img src={selectedImage} alt="Preview" className="w-full h-full object-cover" />
              {/* फोटो बदलने का बटन (होवर करने पर दिखेगा) */}
              <div 
                onClick={() => fileInputRef.current.click()}
                className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center cursor-pointer"
              >
                <UploadCloud className="w-10 h-10 text-white mb-2" />
                <span className="text-white font-bold">Change Photo</span>
              </div>
            </div>
          ) : (
            <div 
              onClick={() => fileInputRef.current.click()}
              className="w-full h-64 border-2 border-dashed border-yellow-400 bg-yellow-50 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:bg-yellow-100 transition-colors"
            >
              <ImagePlus className="w-12 h-12 text-yellow-600 mb-3" />
              <span className="text-base font-bold text-gray-700">Click to select a photo</span>
              <span className="text-xs text-gray-500 mt-1">Supports JPG, PNG</span>
            </div>
          )}

          {/* कैप्शन */}
          <textarea 
            rows="3"
            placeholder="Write a caption for your post..."
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-400 resize-none text-gray-800"
          />
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-100 flex justify-end">
          <button 
            onClick={handleShare}
            className="bg-gray-900 text-yellow-400 px-6 py-2 rounded-xl font-bold hover:bg-gray-800 transform hover:-translate-y-1 transition-all shadow-md"
          >
            Share Post
          </button>
        </div>
      </div>
    </div>
  );
}