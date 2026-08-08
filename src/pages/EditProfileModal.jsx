import React, { useState, useRef, useEffect } from 'react';
import { supabase } from '../supabase'; // 🔥 Firebase हटाकर Supabase लगा दिया
import { X, Camera, Check, Loader2, User, Type, Link as LinkIcon } from 'lucide-react';

export default function EditProfileModal({ isOpen, onClose, currentUser, onUpdateSuccess }) {
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [link, setLink] = useState('');
  
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  
  const fileInputRef = useRef(null);

  // जब भी पॉप-अप खुले, तो पुराना डेटा इनपुट में भर दो
  useEffect(() => {
    if (isOpen && currentUser) {
      setUsername(currentUser.username || '');
      setBio(currentUser.bio || '');
      setLink(currentUser.link || '');
      setPreviewUrl(currentUser.profilePic || `https://api.dicebear.com/7.x/avataaars/svg?seed=${currentUser.id}`);
    }
  }, [isOpen, currentUser]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file)); // तुरंत प्रिव्यू दिखाएँ
    }
  };

  const handleSave = async () => {
    if (!currentUser?.id) return;
    setIsSaving(true);

    try {
      let newPhotoUrl = currentUser.profilePic;

      // 🔥 1. अगर नई फोटो चुनी है, तो उसे Supabase Storage में अपलोड करें
      if (selectedFile) {
        const fileExt = selectedFile.name.split('.').pop();
        const fileName = `profiles/${currentUser.id}_${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('yellowgram_uploads') // आपकी बकेट का नाम
          .upload(fileName, selectedFile, { upsert: true });

        if (uploadError) throw uploadError;

        // अपलोड होने के बाद Public URL निकालें
        const { data: publicUrlData } = supabase.storage
          .from('yellowgram_uploads')
          .getPublicUrl(fileName);
          
        newPhotoUrl = publicUrlData.publicUrl;
      }

      // 🔥 2. Supabase Database ('users' टेबल) में डेटा अपडेट करें
      const { error: dbError } = await supabase
        .from('users')
        .update({
          username: username,
          bio: bio,
          link: link,
          profile_pic: newPhotoUrl,
        })
        .eq('id', currentUser.id); // सिर्फ करेंट यूज़र का डेटा बदलें

      if (dbError) throw dbError;

      alert("Profile updated successfully! ✨");
      if (onUpdateSuccess) onUpdateSuccess(); // Profile Page को रीफ्रेश करने के लिए
      onClose();
    } catch (error) {
      console.error("Error updating profile:", error.message);
      alert("Failed to update profile.");
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex flex-col justify-end overflow-hidden">
      
      {/* 🌟 स्लाइड होकर ऊपर आने वाला डिज़ाइन 🌟 */}
      <div className="w-full bg-yellow-50 rounded-t-3xl shadow-2xl animate-in slide-in-from-bottom duration-300 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="bg-yellow-400 p-4 rounded-t-3xl flex justify-between items-center border-b border-yellow-500 shadow-sm sticky top-0 z-10">
          <button onClick={onClose} className="p-1 hover:bg-yellow-500 rounded-full transition-colors text-gray-900">
            <X className="w-7 h-7" />
          </button>
          <h2 className="text-xl font-black text-gray-900">Edit Profile</h2>
          <button 
            onClick={handleSave} 
            disabled={isSaving}
            className="p-1.5 bg-gray-900 text-yellow-400 rounded-full hover:bg-gray-800 disabled:opacity-50 transition-colors"
          >
            {isSaving ? <Loader2 className="w-6 h-6 animate-spin" /> : <Check className="w-6 h-6" strokeWidth={3} />}
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex flex-col gap-6">
          
          {/* 📸 Profile Picture Upload */}
          <div className="flex flex-col items-center gap-3">
            <div className="relative group cursor-pointer" onClick={() => fileInputRef.current.click()}>
              <div className="w-28 h-28 rounded-full border-4 border-yellow-400 overflow-hidden bg-gray-200 shadow-lg">
                <img src={previewUrl} alt="Profile" className="w-full h-full object-cover" />
              </div>
              <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera className="w-8 h-8 text-white" />
              </div>
              <div className="absolute bottom-0 right-0 bg-gray-900 p-2 rounded-full border-2 border-yellow-50 shadow-md">
                <Camera className="w-4 h-4 text-yellow-400" />
              </div>
            </div>
            <input type="file" accept="image/*" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
            <span className="text-sm font-bold text-gray-500 cursor-pointer hover:text-gray-900" onClick={() => fileInputRef.current.click()}>
              Change Profile Photo
            </span>
          </div>

          {/* 📝 Edit Fields */}
          <div className="flex flex-col gap-4">
            
            {/* Username */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Username</label>
              <div className="flex items-center gap-3 bg-white p-3 rounded-xl border border-gray-200 focus-within:border-yellow-400 focus-within:ring-2 focus-within:ring-yellow-400/20 transition-all shadow-sm">
                <User className="w-5 h-5 text-gray-400" />
                <input 
                  type="text" value={username} onChange={(e) => setUsername(e.target.value)}
                  placeholder="Your Name" className="flex-1 outline-none font-bold text-gray-900 bg-transparent"
                />
              </div>
            </div>

            {/* Bio */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Bio</label>
              <div className="flex gap-3 bg-white p-3 rounded-xl border border-gray-200 focus-within:border-yellow-400 focus-within:ring-2 focus-within:ring-yellow-400/20 transition-all shadow-sm">
                <Type className="w-5 h-5 text-gray-400 mt-1" />
                <textarea 
                  rows="3" value={bio} onChange={(e) => setBio(e.target.value)}
                  placeholder="Write something about yourself..." 
                  className="flex-1 outline-none font-medium text-gray-900 bg-transparent resize-none"
                />
              </div>
            </div>

            {/* Link / Website */}
            <div className="flex flex-col gap-1 mb-8">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Link</label>
              <div className="flex items-center gap-3 bg-white p-3 rounded-xl border border-gray-200 focus-within:border-yellow-400 focus-within:ring-2 focus-within:ring-yellow-400/20 transition-all shadow-sm">
                <LinkIcon className="w-5 h-5 text-gray-400" />
                <input 
                  type="url" value={link} onChange={(e) => setLink(e.target.value)}
                  placeholder="https://yourwebsite.com" className="flex-1 outline-none font-medium text-blue-600 bg-transparent"
                />
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}