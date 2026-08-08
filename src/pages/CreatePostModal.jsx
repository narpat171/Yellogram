import React, { useState, useRef, useEffect } from 'react';
import { supabase } from '../supabase';
import { 
  X, Camera as CameraIcon, Video as VideoIcon, Image as ImageIcon, 
  ArrowLeft, Music, Type, Mic, SmilePlus, Sparkles, ChevronRight, Loader2, Check, Trash2, Maximize 
} from 'lucide-react';

import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile } from '@ffmpeg/util';

const ffmpeg = new FFmpeg();

const FILTERS = [
  { name: 'Normal', style: 'none' },
  { name: 'Clarendon', style: 'contrast(1.2) saturate(1.3)' },
  { name: 'Gingham', style: 'sepia(0.5) hue-rotate(-30deg)' },
  { name: 'Moon', style: 'grayscale(100%) contrast(1.1)' },
  { name: 'Sepia', style: 'sepia(100%)' },
];
const STICKERS = ['😂', '❤️', '🔥', '✨', '🥺', '🎉', '👑', '💯'];

export default function CreatePostModal({ isOpen, onClose }) {
  const [step, setStep] = useState('select'); 
  const [type, setType] = useState(null); 
  const [showAnimation, setShowAnimation] = useState(false);
  
  const videoRef = useRef(null);
  const fileInputRef = useRef(null);
  const containerRef = useRef(null); 
  const [stream, setStream] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [caption, setCaption] = useState('');
  
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0); 
  const [isCompressing, setIsCompressing] = useState(false);
  const [compressProgress, setCompressProgress] = useState(0);

  const [activeTool, setActiveTool] = useState(null); 
  const [activeFilter, setActiveFilter] = useState('none');
  const [tempText, setTempText] = useState(''); 
  const [selectedAudio, setSelectedAudio] = useState(null);
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const [overlays, setOverlays] = useState([]); 
  const [activeOverlayId, setActiveOverlayId] = useState(null); 
  const [draggingId, setDraggingId] = useState(null);
  const [pinchStart, setPinchStart] = useState({ dist: 0, scale: 1 });

  useEffect(() => {
    const loadFFmpeg = async () => {
      try {
        if (!ffmpeg.loaded) {
          ffmpeg.on('progress', ({ progress }) => {
            setCompressProgress(Math.round(progress * 100));
          });
          await ffmpeg.load();
        }
      } catch (err) {
        console.warn("FFmpeg compression not supported on this browser.");
      }
    };
    if (isOpen) {
      setTimeout(() => setShowAnimation(true), 50);
      loadFFmpeg(); 
    } else {
      resetEverything();
    }
  }, [isOpen]);

  useEffect(() => {
    if (step === 'camera') startCamera();
    else stopCamera();
    return () => stopCamera();
  }, [step]);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: type === 'reel' });
      setStream(mediaStream);
      if (videoRef.current) videoRef.current.srcObject = mediaStream;
    } catch (err) { console.error("Camera error:", err); }
  };

  const stopCamera = () => {
    if (stream) { stream.getTracks().forEach(track => track.stop()); setStream(null); }
  };

  const handleFileImport = (e) => {
    const file = e.target.files[0];
    if (file) { setSelectedFile(file); setPreviewUrl(URL.createObjectURL(file)); stopCamera(); setStep('edit'); }
  };

  const resetEverything = () => {
    setShowAnimation(false); stopCamera(); setStep('select');
    setType(null); setSelectedFile(null); setPreviewUrl(null);
    setCaption(''); setIsUploading(false); setUploadProgress(0);
    setIsCompressing(false); setCompressProgress(0);
    setActiveFilter('none'); setOverlays([]); setTempText(''); setSelectedAudio(null); setIsRecordingVoice(false);
    setActiveTool(null); setActiveOverlayId(null); setDraggingId(null);
  };

  const handleClose = () => { resetEverything(); setTimeout(() => onClose(), 200); };

  const handlePointerMove = (e) => {
    if (draggingId && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const clientX = e.clientX || e.touches?.[0]?.clientX;
      const clientY = e.clientY || e.touches?.[0]?.clientY;
      if (!clientX || !clientY) return;
      const x = ((clientX - rect.left) / rect.width) * 100;
      const y = ((clientY - rect.top) / rect.height) * 100;
      setOverlays(prev => prev.map(o => o.id === draggingId ? { ...o, x, y } : o));
    }
  };

  const getTouchDist = (touches) => Math.hypot(touches[0].clientX - touches[1].clientX, touches[0].clientY - touches[1].clientY);
  const handleTouchStart = (e) => {
    if (e.touches.length === 2 && activeOverlayId) {
      const item = overlays.find(o => o.id === activeOverlayId);
      setPinchStart({ dist: getTouchDist(e.touches), scale: item ? item.scale : 1 });
    }
  };
  const handleTouchMove = (e) => {
    if (e.touches.length === 2 && activeOverlayId && pinchStart.dist > 0) {
      const newDist = getTouchDist(e.touches);
      const newScale = Math.max(0.5, Math.min(pinchStart.scale * (newDist / pinchStart.dist), 5));
      updateOverlayScale(newScale);
    }
  };
  const handleWheel = (e, id) => {
    if (activeOverlayId === id) {
      const item = overlays.find(o => o.id === id);
      if (item) {
        const newScale = Math.max(0.5, Math.min(item.scale + (e.deltaY > 0 ? -0.1 : 0.1), 5));
        updateOverlayScale(newScale);
      }
    }
  };
  const updateOverlayScale = (newScale) => {
    setOverlays(prev => prev.map(o => o.id === activeOverlayId ? { ...o, scale: newScale } : o));
  };
  const deleteActiveOverlay = () => {
    setOverlays(prev => prev.filter(o => o.id !== activeOverlayId));
    setActiveOverlayId(null);
  };

  const compressVideo = async (file) => {
    if (!ffmpeg.loaded) await ffmpeg.load();
    await ffmpeg.writeFile('input.mp4', await fetchFile(file));
    await ffmpeg.exec(['-i', 'input.mp4', '-vf', 'scale=-2:720', '-vcodec', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '32', '-preset', 'ultrafast', 'output.mp4']);
    const data = await ffmpeg.readFile('output.mp4');
    const safeData = new Uint8Array(data);
    return new File([safeData], `compressed_${file.name}`, { type: 'video/mp4' });
  };

  // 🚀 अपलोड फंक्शन (पॉप-अप हटाया गया) 🚀
  const handleShare = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!selectedFile || !user) {
      alert("लॉगिन यूज़र या फाइल नहीं मिली!");
      return;
    }
    
    let fileToUpload = selectedFile;

    if (type === 'reel' && ffmpeg.loaded) {
      setIsCompressing(true);
      setCompressProgress(0);
      try {
        fileToUpload = await compressVideo(selectedFile);
      } catch (error) {
        console.warn("Compression skipped:", error);
      }
      setIsCompressing(false);
    }

    setIsUploading(true);
    setUploadProgress(10); 
    
    try {
      const folder = type === 'post' ? 'posts' : 'reels';
      const safeName = fileToUpload.name.replace(/[^a-zA-Z0-9.\-_]/g, '');
      const fileName = `${folder}/${user.id}_${Date.now()}_${safeName}`;
      
      const { error: uploadError } = await supabase.storage
        .from('yellowgram_uploads')
        .upload(fileName, fileToUpload, { cacheControl: '3600', upsert: false });

      if (uploadError) throw new Error("Storage Upload Failed: " + uploadError.message);
      
      setUploadProgress(60); 

      const { data: publicUrlData } = supabase.storage
        .from('yellowgram_uploads')
        .getPublicUrl(fileName);
        
      const downloadURL = publicUrlData.publicUrl;
      setUploadProgress(80); 

      const { data: userData } = await supabase
        .from('users')
        .select('username, profile_pic')
        .eq('id', user.id)
        .maybeSingle();

      const postData = {
        user_id: user.id,
        username: userData?.username || user?.email?.split('@')[0] || 'Creator',
        user_profile_pic: userData?.profile_pic || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.id}`,
        caption: caption || '',
        type: type, 
        media_url: downloadURL,
        likes: 0,
        comments: 0
      };

      const { error: dbError } = await supabase.from('posts').insert([postData]);

      if (dbError) throw new Error("Database Save Failed: " + dbError.message);

      setUploadProgress(100); 
      
      // 🔥 यहाँ से 'alert' हटा दिया गया है! सीधा क्लोज और रिफ्रेश होगा 🔥
      handleClose();
      window.location.reload(); 

    } catch (error) { 
      console.error("Upload Error:", error); 
      alert("Error: " + (error.message || "Failed to upload file.")); 
    } finally { 
      setIsUploading(false); 
      setUploadProgress(0);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex flex-col justify-end overflow-hidden">
      
      {/* 🚀 STEP 1: Select Type */}
      {step === 'select' && (
        <div className="relative h-full w-full flex flex-col items-center justify-end pb-24">
          <button onClick={handleClose} className="absolute top-8 right-6 p-2 bg-white/20 hover:bg-white/30 rounded-full text-white transition-colors"><X className="w-7 h-7" /></button>
          <div className={`flex gap-10 mb-8 transform transition-all duration-500 ${showAnimation ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-20 opacity-0 scale-75'}`}>
            <div className="flex flex-col items-center gap-3 cursor-pointer group" onClick={() => { setType('post'); setStep('camera'); }}>
              <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center group-hover:scale-110 transition-all shadow-lg"><CameraIcon className="w-8 h-8 text-gray-900" /></div><span className="text-white font-extrabold text-[15px]">Post</span>
            </div>
            <div className="flex flex-col items-center gap-3 cursor-pointer group" onClick={() => { setType('reel'); setStep('camera'); }}>
              <div className="w-16 h-16 bg-gradient-to-tr from-yellow-400 to-orange-500 rounded-full flex items-center justify-center group-hover:scale-110 transition-all shadow-lg"><VideoIcon className="w-8 h-8 text-white" /></div><span className="text-white font-extrabold text-[15px]">Reel</span>
            </div>
          </div>
        </div>
      )}

      {/* 📸 STEP 2: Camera */}
      {step === 'camera' && (
        <div className="relative h-full w-full bg-black flex flex-col animate-in zoom-in-95 duration-300">
          <button onClick={() => setStep('select')} className="absolute top-8 left-4 p-2 bg-black/40 rounded-full text-white z-20"><X className="w-7 h-7" /></button>
          <div className="absolute top-10 w-full text-center z-20"><span className="bg-black/40 text-white px-4 py-1.5 rounded-full font-bold text-sm uppercase">{type === 'post' ? 'Photo' : 'Reel'}</span></div>
          <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
          <div className="absolute bottom-0 left-0 w-full px-8 pb-14 pt-20 bg-gradient-to-t from-black via-black/50 to-transparent z-20 flex items-center justify-between">
            <div onClick={() => fileInputRef.current.click()} className="w-12 h-12 rounded-xl bg-black/40 border-2 border-white/30 flex items-center justify-center cursor-pointer"><ImageIcon className="w-6 h-6 text-white" /><input type="file" accept={type === 'post' ? "image/*" : "video/*"} ref={fileInputRef} onChange={handleFileImport} className="hidden" /></div>
            <div onClick={() => alert("Capture Feature Coming Soon! Please upload from gallery for now.")} className="w-20 h-20 rounded-full border-[5px] border-white flex items-center justify-center cursor-pointer"><div className={`w-[60px] h-[60px] rounded-full ${type === 'post' ? 'bg-white' : 'bg-red-500'}`}></div></div>
            <div className="w-12 h-12"></div>
          </div>
        </div>
      )}

      {/* 🎨 STEP 3: Edit UI */}
      {step === 'edit' && (
        <div className="relative h-full w-full bg-black animate-in slide-in-from-right duration-300 overflow-hidden flex flex-col">
          
          <div 
            ref={containerRef}
            onPointerMove={handlePointerMove}
            onPointerUp={() => setDraggingId(null)}
            onPointerLeave={() => setDraggingId(null)}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            className="relative flex-1 w-full overflow-hidden flex items-center justify-center bg-gray-900 touch-none"
          >
            {type === 'post' ? (
              <img src={previewUrl} className="w-full h-full object-cover transition-all duration-300 pointer-events-none" style={{ filter: activeFilter }} />
            ) : (
              <video src={previewUrl} autoPlay loop playsInline className="w-full h-full object-cover transition-all duration-300 pointer-events-none" style={{ filter: activeFilter }} />
            )}

            {overlays.map(item => (
              <div
                key={item.id}
                onPointerDown={(e) => { e.preventDefault(); setActiveOverlayId(item.id); setDraggingId(item.id); setActiveTool(null); }}
                onWheel={(e) => handleWheel(e, item.id)}
                className={`absolute z-10 cursor-move touch-none select-none transition-opacity ${draggingId === item.id ? 'opacity-70' : 'opacity-100'} ${activeOverlayId === item.id ? 'ring-2 ring-dashed ring-yellow-400 p-2 rounded-xl' : ''}`}
                style={{ top: `${item.y}%`, left: `${item.x}%`, transform: `translate(-50%, -50%) scale(${item.scale})` }}
              >
                {item.type === 'text' ? (
                  <span className="text-white text-4xl font-black drop-shadow-[0_4px_4px_rgba(0,0,0,0.8)] bg-black/30 px-3 py-1 rounded-xl whitespace-nowrap">{item.content}</span>
                ) : (<span className="text-6xl drop-shadow-lg">{item.content}</span>)}
              </div>
            ))}

            {selectedAudio && !activeTool && !activeOverlayId && (
              <div className="absolute top-24 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur-md px-4 py-1.5 rounded-full flex items-center gap-2 z-10 pointer-events-none">
                <Music className="w-4 h-4 text-white animate-pulse" />
                <span className="text-white font-bold text-xs">{selectedAudio}</span>
              </div>
            )}
          </div>

          {activeOverlayId && (
            <div className="absolute bottom-24 left-1/2 -translate-x-1/2 bg-black/80 backdrop-blur-md px-4 py-3 rounded-2xl z-40 flex items-center gap-4 border border-white/20 shadow-2xl animate-in zoom-in-95">
              <button onClick={deleteActiveOverlay} className="p-2.5 bg-red-500/20 hover:bg-red-500 rounded-xl text-red-500 hover:text-white transition-all group" title="Delete Sticker"><Trash2 className="w-5 h-5 group-active:scale-90 transition-transform" /></button>
              <div className="flex items-center gap-2 px-3 border-l border-r border-white/10 hidden sm:flex">
                <Maximize className="w-4 h-4 text-gray-400" />
                <input type="range" min="0.5" max="4" step="0.1" value={overlays.find(o => o.id === activeOverlayId)?.scale || 1} onChange={(e) => updateOverlayScale(parseFloat(e.target.value))} className="w-24 accent-yellow-400 h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer" />
              </div>
              <button onClick={() => setActiveOverlayId(null)} className="p-2.5 px-4 bg-green-500 hover:bg-green-600 rounded-xl text-white shadow-[0_0_15px_rgba(34,197,94,0.4)] transition-all flex items-center gap-2 font-bold text-sm active:scale-95"><Check className="w-5 h-5" strokeWidth={3} /> Done</button>
            </div>
          )}

          {!activeTool && (
            <>
              <div className="absolute top-8 left-4 z-20"><button onClick={() => setStep('camera')} className="p-2 bg-black/40 backdrop-blur-md rounded-full text-white hover:bg-black/60 shadow-lg"><ArrowLeft className="w-6 h-6" /></button></div>
              <div className="absolute top-8 right-4 z-20"><button onClick={handleClose} className="p-2 bg-black/40 backdrop-blur-md rounded-full text-white hover:bg-black/60 shadow-lg"><X className="w-6 h-6" /></button></div>
              {!activeOverlayId && (
                <div className="absolute top-24 right-4 z-20 flex flex-col gap-5">
                  {[{ id: 'audio', icon: Music, label: 'Audio' }, { id: 'text', icon: Type, label: 'Text' }, { id: 'voice', icon: Mic, label: 'Voice' }, { id: 'sticker', icon: SmilePlus, label: 'Sticker' }, { id: 'filter', icon: Sparkles, label: 'Filter' }].map(tool => (
                    <div key={tool.id} onClick={() => setActiveTool(tool.id)} className="flex flex-col items-center gap-1 cursor-pointer group">
                      <div className="p-3 bg-black/40 backdrop-blur-md rounded-full text-white group-hover:bg-white group-hover:text-black transition-colors shadow-lg active:scale-90"><tool.icon className="w-6 h-6" /></div>
                      <span className="text-white text-[11px] font-bold drop-shadow-md">{tool.label}</span>
                    </div>
                  ))}
                </div>
              )}
              <div className="absolute bottom-8 right-6 z-20"><button onClick={() => setStep('details')} className="bg-white text-gray-900 px-6 py-2.5 rounded-full font-black text-[15px] flex items-center gap-2 shadow-xl hover:bg-gray-100 active:scale-95 transition-all">Next <ChevronRight className="w-5 h-5" /></button></div>
            </>
          )}

          {activeTool && (
            <div className="absolute bottom-0 w-full bg-black/80 backdrop-blur-xl rounded-t-3xl p-5 z-30 animate-in slide-in-from-bottom flex flex-col gap-4">
              <div className="flex justify-between items-center mb-2"><button onClick={() => setActiveTool(null)} className="p-2 bg-white/20 hover:bg-white/30 rounded-full text-white transition-colors"><X className="w-5 h-5" /></button><h3 className="text-white font-extrabold capitalize text-lg">{activeTool}</h3><div className="w-9 h-9"></div></div>
              
              {activeTool === 'filter' && (
                <div className="flex gap-4 overflow-x-auto pb-4 snap-x">
                  {FILTERS.map(f => (
                    <div key={f.name} onClick={() => setActiveFilter(f.style)} className="flex flex-col items-center gap-2 snap-center cursor-pointer">
                      <div className={`w-16 h-16 rounded-full border-4 overflow-hidden ${activeFilter === f.style ? 'border-yellow-400' : 'border-transparent'}`}>{type === 'post' ? <img src={previewUrl} style={{ filter: f.style }} className="w-full h-full object-cover" /> : <video src={previewUrl} style={{ filter: f.style }} className="w-full h-full object-cover" />}</div>
                      <span className="text-white text-xs font-bold">{f.name}</span>
                    </div>
                  ))}
                </div>
              )}

              {activeTool === 'text' && (
                <div className="flex flex-col gap-4 pb-4">
                  <input type="text" autoFocus placeholder="Type something..." value={tempText} onChange={(e) => setTempText(e.target.value)} className="w-full bg-white/10 text-white font-bold text-xl p-4 rounded-xl outline-none placeholder-gray-400 text-center" />
                  <button onClick={() => { if(tempText.trim()) { const newId = Date.now(); setOverlays([...overlays, { id: newId, type: 'text', content: tempText, x: 50, y: 50, scale: 1 }]); setActiveOverlayId(newId); } setTempText(''); setActiveTool(null); }} className="w-full bg-yellow-400 text-gray-900 font-bold py-3 rounded-xl hover:bg-yellow-500 active:scale-95 transition-all">Add to Screen</button>
                </div>
              )}

              {activeTool === 'sticker' && (
                <div className="grid grid-cols-4 gap-4 pb-4">
                  {STICKERS.map((s, idx) => (<button key={idx} onClick={() => { const newId = Date.now(); setOverlays([...overlays, { id: newId, type: 'sticker', content: s, x: 50, y: 50, scale: 1 }]); setActiveOverlayId(newId); setActiveTool(null); }} className="text-4xl bg-white/10 p-3 rounded-2xl hover:bg-white/30 transition-colors active:scale-90">{s}</button>))}
                </div>
              )}

              {activeTool === 'audio' && (
                <div className="flex flex-col gap-3 pb-4">
                  {['Trending Song 1 🎵', 'Viral Beat 2026 🥁', 'Cinematic BGM 🎬'].map((song, i) => (<button key={i} onClick={() => { setSelectedAudio(song); setActiveTool(null); }} className="flex items-center gap-3 bg-white/10 p-3 rounded-xl hover:bg-white/20 text-white font-bold text-sm text-left active:scale-95 transition-all"><Music className="w-5 h-5 text-yellow-400" /> {song}</button>))}
                </div>
              )}

              {activeTool === 'voice' && (
                <div className="flex flex-col items-center gap-4 pb-4"><button onClick={() => setIsRecordingVoice(!isRecordingVoice)} className={`p-6 rounded-full transition-all duration-300 ${isRecordingVoice ? 'bg-red-500 animate-pulse' : 'bg-white/20 hover:bg-white/30'}`}><Mic className="w-10 h-10 text-white" /></button><span className="text-white font-bold">{isRecordingVoice ? 'Recording... Tap to stop' : 'Tap to record Voiceover'}</span></div>
              )}
            </div>
          )}

        </div>
      )}

      {/* 📝 STEP 4: Final Upload Details */}
      {step === 'details' && (
        <div className="relative h-full w-full bg-yellow-50 flex flex-col animate-in slide-in-from-right duration-300">
          <div className="bg-yellow-400 p-4 pt-8 flex items-center gap-4 border-b border-yellow-500 shadow-sm"><button onClick={() => setStep('edit')} className="p-1 hover:bg-yellow-500 rounded-full transition-colors"><ArrowLeft className="w-7 h-7 text-gray-900" /></button><h2 className="text-xl font-black text-gray-900">New {type === 'post' ? 'Post' : 'Reel'}</h2></div>
          <div className="p-4 flex gap-4 bg-white border-b border-gray-200">
            <div className="w-16 h-20 bg-black rounded-lg overflow-hidden flex-shrink-0">
               {type === 'post' ? <img src={previewUrl} style={{ filter: activeFilter }} className="w-full h-full object-cover" /> : <video src={previewUrl} style={{ filter: activeFilter }} className="w-full h-full object-cover" />}
            </div>
            <textarea placeholder="Write a caption..." value={caption} onChange={(e) => setCaption(e.target.value)} className="flex-1 resize-none outline-none font-medium text-gray-800 placeholder-gray-400" />
          </div>
          
          <div className="p-4 mt-auto">
            {isCompressing ? (
              <div className="w-full flex flex-col gap-2">
                <div className="flex justify-between text-sm font-bold text-blue-600 px-1">
                  <span className="flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Compressing Video...</span>
                  <span>{compressProgress}%</span>
                </div>
                <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden shadow-inner">
                  <div className="h-full bg-gradient-to-r from-blue-400 to-indigo-500 transition-all duration-300 ease-out" style={{ width: `${compressProgress}%` }}></div>
                </div>
              </div>
            ) : isUploading ? (
              <div className="w-full flex flex-col gap-2">
                <div className="flex justify-between text-sm font-bold text-gray-700 px-1">
                  <span>Uploading {type}...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden shadow-inner">
                  <div className="h-full bg-gradient-to-r from-yellow-400 to-orange-500 transition-all duration-300 ease-out" style={{ width: `${uploadProgress}%` }}></div>
                </div>
              </div>
            ) : (
              <button 
                onClick={handleShare} 
                className="w-full bg-gray-900 text-yellow-400 py-3.5 rounded-xl font-black text-lg flex justify-center items-center gap-2 shadow-lg hover:bg-gray-800 active:scale-95 transition-all"
              >
                Share
              </button>
            )}
          </div>

        </div>
      )}

    </div>
  );
}