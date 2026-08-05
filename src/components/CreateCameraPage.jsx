import React, { useState, useRef, useEffect } from 'react';
import { X, Settings, Music, Type, Wand2, RefreshCcw, Zap, ChevronLeft } from 'lucide-react';

export default function CreateCameraPage({ onClose, onShare, isVisible }) {
  const [mode, setMode] = useState('post'); 
  const [capturedMedia, setCapturedMedia] = useState(null);
  const [caption, setCaption] = useState('');
  const [cameraError, setCameraError] = useState(false);
  const videoRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    let stream;
    const startCamera = async () => {
      try {
        setCameraError(false);
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" }, audio: mode === 'reel' });
        if (videoRef.current) videoRef.current.srcObject = stream;
      } catch (err) {
        setCameraError(true);
      }
    };
    if (!capturedMedia) startCamera();
    return () => { if (stream) stream.getTracks().forEach(track => track.stop()); };
  }, [capturedMedia, mode]);

  const takePhoto = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth; canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      setCapturedMedia(canvas.toDataURL('image/jpeg'));
    }
  };

  const handleGalleryUpload = (e) => {
    const file = e.target.files[0];
    if (file) setCapturedMedia(URL.createObjectURL(file));
  };

  return (
    <div className={`fixed inset-0 z-[100] bg-black text-white flex flex-col font-sans h-screen w-screen overflow-hidden transition-transform duration-300 ease-out transform ${isVisible ? 'translate-y-0' : 'translate-y-full'}`}>
      {capturedMedia ? (
        <>
          <div className="absolute top-0 w-full p-4 flex justify-between items-center z-20 bg-gradient-to-b from-black/60 to-transparent">
            <button onClick={() => setCapturedMedia(null)} className="p-2"><ChevronLeft size={32} /></button>
            <div className="flex gap-6">
              <Music size={28} className="cursor-pointer hover:text-yellow-400" />
              <Type size={28} className="cursor-pointer hover:text-yellow-400" />
              <Wand2 size={28} className="cursor-pointer hover:text-yellow-400" />
            </div>
          </div>
          <div className="flex-1 w-full relative bg-gray-900 flex items-center justify-center">
            <img src={capturedMedia} alt="Captured" className="w-full h-full object-contain" />
          </div>
          <div className="bg-black p-4 pb-8 flex flex-col gap-4 rounded-t-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.5)] z-20">
            <div className="flex items-center gap-3 bg-gray-800 p-3 rounded-2xl">
              <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=myprofile" alt="profile" className="w-10 h-10 rounded-full bg-yellow-400" />
              <input type="text" placeholder="Write a caption..." value={caption} onChange={(e) => setCaption(e.target.value)} className="bg-transparent flex-1 text-white focus:outline-none" />
            </div>
            <button onClick={() => onShare(capturedMedia, caption)} className="w-full bg-yellow-400 text-black font-extrabold text-lg py-3 rounded-2xl hover:bg-yellow-500 transition-colors shadow-lg">Share</button>
          </div>
        </>
      ) : (
        <>
          <div className="absolute top-0 w-full p-4 flex justify-between items-center z-20 bg-gradient-to-b from-black/50 to-transparent">
            <button onClick={onClose} className="hover:scale-110 transition-transform"><X size={32} /></button>
            <Zap size={28} className="cursor-pointer hover:text-yellow-400" />
            <Settings size={28} className="cursor-pointer hover:text-yellow-400" />
          </div>
          <div className="flex-1 w-full relative bg-gray-900 rounded-b-3xl overflow-hidden flex items-center justify-center shadow-xl">
            {cameraError ? (
              <div className="text-center p-6"><p className="text-gray-400 mb-4">Camera access denied.</p><p className="text-yellow-400 font-bold">Please use Gallery.</p></div>
            ) : (
              <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
            )}
          </div>
          <div className="h-48 bg-black flex flex-col items-center justify-center gap-6 pb-6 pt-2">
            <div className="flex gap-6 text-sm font-bold tracking-widest text-gray-500">
              <span onClick={() => setMode('post')} className={`cursor-pointer transition-colors ${mode === 'post' ? 'text-yellow-400' : 'hover:text-white'}`}>POST</span>
              <span onClick={() => setMode('reel')} className={`cursor-pointer transition-colors ${mode === 'reel' ? 'text-yellow-400' : 'hover:text-white'}`}>REEL</span>
            </div>
            <div className="flex justify-between items-center w-full px-12">
              <div className="w-10 h-10 overflow-hidden rounded-xl border-2 border-white cursor-pointer hover:scale-110" onClick={() => fileInputRef.current.click()}>
                <img src="https://picsum.photos/100/100" alt="Gallery" className="w-full h-full object-cover opacity-80" />
                <input type="file" accept="image/*,video/*" ref={fileInputRef} onChange={handleGalleryUpload} className="hidden" />
              </div>
              <div onClick={takePhoto} className={`w-20 h-20 rounded-full border-[4px] flex items-center justify-center cursor-pointer hover:scale-95 transition-transform ${mode === 'reel' ? 'border-red-500' : 'border-white'}`}>
                <div className={`w-[66px] h-[66px] rounded-full ${mode === 'reel' ? 'bg-red-500' : 'bg-white'}`}></div>
              </div>
              <div className="w-10 h-10 flex items-center justify-center bg-gray-800 rounded-full cursor-pointer hover:bg-gray-700"><RefreshCcw size={20} className="text-white" /></div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}