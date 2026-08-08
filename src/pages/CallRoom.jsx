import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ZegoUIKitPrebuilt } from '@zegocloud/zego-uikit-prebuilt';
import { supabase } from '../supabase';

export default function CallRoom() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const containerRef = useRef(null);
  
  // कॉल के 2 States: 'calling' (रिंग जा रही है) और 'connected' (कॉल उठ गई)
  const [callState, setCallState] = useState('calling'); 
  
  // Audio फाइल का रेफरेंस (public फोल्डर से)
  const ringtoneRef = useRef(typeof Audio !== "undefined" ? new Audio('/calling-ringtone.mp3') : null);

  useEffect(() => {
    // 🎵 जैसे ही यह पेज खुलेगा, रिंगटोन लूप में बजना शुरू हो जाएगी
    if (ringtoneRef.current) {
      ringtoneRef.current.loop = true;
      ringtoneRef.current.play().catch(e => console.log("Audio play error (Browser Auto-play policy):", e));
    }

    const startCall = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return navigate('/');

      const appID = 2073286966;
      const serverSecret = "4286ee0bb458dfd072a231c7057bde0e";

      const kitToken = ZegoUIKitPrebuilt.generateKitTokenForTest(
        appID,
        serverSecret,
        roomId,
        user.id,
        user.user_metadata?.username || user.email?.split('@')[0] || 'User'
      );

      const zp = ZegoUIKitPrebuilt.create(kitToken);
      
      // ZegoCloud बैकग्राउंड में कनेक्ट होना शुरू कर देगा
      zp.joinRoom({
        container: containerRef.current,
        scenario: {
          mode: ZegoUIKitPrebuilt.OneONoneCall,
        },
        showPreJoinView: false,
        showScreenSharingButton: false,
        onLeaveRoom: () => {
          // अगर कोई कॉल काटता है, तो रिंगटोन बंद करो और वापस चैट में जाओ
          if (ringtoneRef.current) {
            ringtoneRef.current.pause();
          }
          navigate(-1);
        },
      });

      // 🕒 4 सेकंड का टाइमर: 4 सेकंड बाद हम मान लेंगे कि कॉल कनेक्ट हो गई 
      // रिंगटोन बंद कर देंगे और ZegoCloud का असली वीडियो दिखा देंगे
      setTimeout(() => {
        setCallState('connected');
        if (ringtoneRef.current) {
          ringtoneRef.current.pause();
          ringtoneRef.current.currentTime = 0;
        }
      }, 4000); 
    };

    startCall();

    // 🧹 Cleanup: जब यूजर बैक जाए या कंपोनेंट हटे, तो रिंगटोन पक्का बंद होनी चाहिए
    return () => {
      if (ringtoneRef.current) {
        ringtoneRef.current.pause();
        ringtoneRef.current.currentTime = 0;
      }
    };
  }, [roomId, navigate]);

  return (
    // 'fixed inset-0 z-[9999]' यह सुनिश्चित करेगा कि Bottom Bar छुप जाए और कॉल फुल स्क्रीन पर हो
    <div className="fixed top-0 left-0 w-full h-[100dvh] bg-gray-900 z-[9999]">
      
      {/* 🟡 1. CALLING UI (जब तक कॉल कनेक्ट हो रही है, तब तक यह दिखेगा) */}
      {callState === 'calling' && (
        <div className="absolute inset-0 bg-gray-900 flex flex-col items-center justify-center z-50 text-white">
          {/* Profile Picture (Placeholder) */}
          <div className="w-28 h-28 mb-6 bg-gray-800 rounded-full flex items-center justify-center border-4 border-yellow-400 overflow-hidden shadow-[0_0_20px_rgba(250,204,21,0.4)]">
            <img 
              src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${roomId}`} 
              alt="Avatar" 
              className="w-full h-full object-cover" 
            />
          </div>
          
          <h2 className="text-3xl font-extrabold mb-2 tracking-wide">Connecting...</h2>
          <p className="text-yellow-400 animate-pulse font-medium text-lg">Ringing</p>

          {/* End Call Button */}
          <button
            onClick={() => navigate(-1)}
            className="mt-16 bg-red-500 hover:bg-red-600 p-4 rounded-full shadow-[0_0_15px_rgba(239,68,68,0.5)] transition-transform active:scale-90"
          >
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* 🟢 2. REAL ZEGOCLOUD UI (यह छुपकर लोड होगा और 4 सेकंड बाद दिखेगा) */}
      <div
        className="w-full h-full"
        ref={containerRef}
        style={{ visibility: callState === 'connected' ? 'visible' : 'hidden' }}
      ></div>

    </div>
  );
}