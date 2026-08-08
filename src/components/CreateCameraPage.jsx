import React, { useState, useEffect, useRef } from 'react';
import { X, Image as ImageIcon, Loader2, RefreshCcw } from 'lucide-react';
import { collection, addDoc, serverTimestamp, doc, getDoc } from 'firebase/firestore';
import { db, auth } from '../firebase'; 

export default function CreateCameraPage({ isVisible, onClose }) {
  const [imageBase64, setImageBase64] = useState(null); // फाइनल फोटो का कोड
  const [caption, setCaption] = useState('');
  const [loading, setLoading] = useState(false);
  const [userData, setUserData] = useState(null);
  
  // कैमरे के लिए
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [facingMode, setFacingMode] = useState("environment"); // 'environment' मतलब बैक कैमरा, 'user' मतलब फ्रंट

  // 1. यूज़र का डेटा लाना
  useEffect(() => {
    const fetchUser = async () => {
      if (auth.currentUser) {
        const docRef = doc(db, "users", auth.currentUser.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) setUserData(docSnap.data());
      }
    };
    if (isVisible) fetchUser();
  }, [isVisible]);

  // 2. कैमरा चालू / बंद करना
  const startCamera = async () => {
    try {
      if (stream) stream.getTracks().forEach(track => track.stop());
      
      const newStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: facingMode }
      });
      setStream(newStream);
      if (videoRef.current) videoRef.current.srcObject = newStream;
    } catch (err) {
      console.error("Camera Error:", err);
      alert("कैमरा चालू नहीं हो पाया। कृपया परमिशन चेक करें!");
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  // पेज खुलते ही कैमरा चालू करना, और फोटो खींचने पर बंद करना
  useEffect(() => {
    if (isVisible && !imageBase64) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => stopCamera(); // जब पेज बंद हो तो कैमरा भी बंद हो जाए
  }, [isVisible, imageBase64, facingMode]);

  const toggleCamera = () => {
    setFacingMode(prev => prev === "user" ? "environment" : "user");
  };

  // 3. 🔥 लाइव फोटो क्लिक करना 🔥
  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      // वीडियो की साइज़ के हिसाब से कैनवस सेट करना
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      // कैनवस से फोटो का कोड (Base64) निकालना
      const base64 = canvas.toDataURL('image/jpeg', 0.8);
      setImageBase64(base64); // फोटो सेव हो गई
      stopCamera();
    }
  };

  // 4. 🔥 गैलरी से फोटो चुनना और हल्का करना (Compress) 🔥
  const compressGalleryImage = (file) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target.result;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 600; 
          const scaleSize = MAX_WIDTH / img.width;
          canvas.width = MAX_WIDTH;
          canvas.height = img.height * scaleSize;
          
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL('image/jpeg', 0.8));
        };
      };
    });
  };

  const handleGallerySelect = async (e) => {
    const file = e.target.files[0];
    if (file) {
      const base64 = await compressGalleryImage(file);
      setImageBase64(base64);
      stopCamera();
    }
  };

  // 5. पोस्ट को डेटाबेस में शेयर करना
  const handleShare = async () => {
    if (!imageBase64 || !userData) return;
    setLoading(true);

    try {
      await addDoc(collection(db, "posts"), {
        userId: userData.uid,
        username: userData.username,
        userProfilePic: userData.profilePic,
        image: imageBase64,
        caption: caption,
        likes: 0,
        createdAt: serverTimestamp()
      });

      handleClose(); // काम होने के बाद पेज बंद
    } catch (error) {
      console.error("Post upload error:", error);
      setLoading(false);
    }
  };

  const handleClose = () => {
    stopCamera();
    setImageBase64(null);
    setCaption('');
    setLoading(false);
    onClose();
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col items-center animate-in fade-in duration-300 w-full h-full">
      
      {/* Top Bar */}
      <div className="absolute top-0 w-full max-w-lg p-4 flex justify-between items-center text-white z-10 bg-gradient-to-b from-black/60 to-transparent pt-6">
        <button onClick={handleClose} className="p-2 bg-black/40 rounded-full hover:bg-black/60 backdrop-blur-md">
          <X className="w-6 h-6" />
        </button>
        <h2 className="text-xl font-bold">{imageBase64 ? 'New Post' : 'Camera'}</h2>
        {imageBase64 ? (
          <button 
            onClick={handleShare} 
            disabled={loading}
            className="px-4 py-1.5 rounded-full font-bold bg-yellow-400 text-black hover:bg-yellow-500"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin mx-2" /> : 'Share'}
          </button>
        ) : (
          <div className="w-10"></div> /* Empty div for layout balance */
        )}
      </div>

      {/* Main Area: Camera OR Preview */}
      <div className="w-full h-full max-w-lg relative flex flex-col justify-center items-center bg-gray-900">
        
        {!imageBase64 ? (
          <>
            {/* 🎥 Live Camera View */}
            <video 
              ref={videoRef} 
              autoPlay 
              playsInline 
              muted 
              className="w-full h-full object-cover"
            />
            
            {/* Bottom Camera Controls */}
            <div className="absolute bottom-10 w-full flex justify-around items-center px-8 z-10">
              
              {/* Gallery Button */}
              <label className="p-3 bg-gray-800/80 rounded-full text-white cursor-pointer hover:bg-gray-700 backdrop-blur-sm">
                <ImageIcon className="w-7 h-7" />
                <input type="file" accept="image/*" onChange={handleGallerySelect} className="hidden" />
              </label>

              {/* Capture Button (Big Circle) */}
              <button 
                onClick={capturePhoto} 
                className="w-20 h-20 bg-transparent border-4 border-white rounded-full flex items-center justify-center focus:outline-none"
              >
                <div className="w-16 h-16 bg-white rounded-full active:scale-90 transition-transform"></div>
              </button>

              {/* Flip Camera Button */}
              <button 
                onClick={toggleCamera} 
                className="p-3 bg-gray-800/80 rounded-full text-white hover:bg-gray-700 backdrop-blur-sm"
              >
                <RefreshCcw className="w-7 h-7" />
              </button>

            </div>
          </>
        ) : (
          <>
            {/* 🖼️ Photo Preview Area (After Clicking/Selecting) */}
            <div className="w-full flex-1 relative flex flex-col pt-24 px-4 bg-gray-900">
              <div className="w-full aspect-[4/5] rounded-2xl overflow-hidden shadow-xl border border-gray-700">
                <img src={imageBase64} alt="Preview" className="w-full h-full object-cover" />
              </div>

              {/* Caption Input */}
              <div className="w-full mt-6 flex items-start gap-3 bg-gray-800 p-4 rounded-xl shadow-lg border border-gray-700">
                <img 
                  src={userData?.profilePic || 'https://api.dicebear.com/7.x/avataaars/svg?seed=fallback'} 
                  alt="Profile" 
                  className="w-10 h-10 rounded-full border border-gray-600 object-cover" 
                />
                <textarea
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder="Write a caption for your post..."
                  className="w-full bg-transparent text-white focus:outline-none resize-none min-h-[60px]"
                  maxLength="150"
                />
              </div>

              <button 
                onClick={() => setImageBase64(null)} 
                className="mt-6 text-gray-400 font-bold hover:text-white transition-colors self-center"
              >
                Retake Photo
              </button>
            </div>
          </>
        )}

        {/* Hidden Canvas used for capturing the frame */}
        <canvas ref={canvasRef} className="hidden"></canvas>
      </div>
    </div>
  );
}