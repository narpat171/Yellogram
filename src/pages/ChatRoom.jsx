import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ChevronLeft,
  Send,
  Paperclip,
  X,
  Reply,
  Forward,
  Copy,
  Loader2,
  Phone,
  Video,
  Trash2,
  Download,
  Check,
  CheckCheck,
  Mic,
  Play,
  Pause,
  MoreVertical,
  Trash,
  Image as ImageIcon,
  Link2,
  FileText,
  Palette
} from 'lucide-react';
import { supabase } from '../supabase';
import { useOnlineUsers } from '../OnlineContext';
import ChatTheme, { CHAT_THEMES } from '../components/ChatTheme';

export default function ChatRoom() {
  const navigate = useNavigate();
  const { id: otherUserId } = useParams();

  const [me, setMe] = useState(null);
  const [otherUser, setOtherUser] = useState(null);
  const [message, setMessage] = useState('');
  const [chatHistory, setChatHistory] = useState([]);

  const [replyTo, setReplyTo] = useState(null);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  const [selectedFile, setSelectedFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [viewingMedia, setViewingMedia] = useState(null);
  const [forwardedNames, setForwardedNames] = useState({});

  const onlineUsers = useOnlineUsers();
  const [isTyping, setIsTyping] = useState(false);
  
  const [lastSeenTime, setLastSeenTime] = useState(null);
  const [isOtherUserOnline, setIsOtherUserOnline] = useState(false);

  const fileInputRef = useRef(null);
  const pressTimer = useRef(null);
  const chatEndRef = useRef(null);
  const chatScrollRef = useRef(null);
  const channelRef = useRef(null);
  const typingTimeout = useRef(null);

  const [swipeData, setSwipeData] = useState({ id: null, offset: 0 });

  // 🎤 VOICE MESSAGE STATE 🎤
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const recTimerRef = useRef(null);
  const recStreamRef = useRef(null);
  const audioRef = useRef(null);
  const [playingVoiceId, setPlayingVoiceId] = useState(null);
  const [voiceProgress, setVoiceProgress] = useState({});

  // 🎨 CHAT THEME STATE 🎨
  const [themeOpen, setThemeOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [chatTheme, setChatTheme] = useState(() => {
    const saved = localStorage.getItem('chatTheme');
    return saved || 'yellow';
  });

  useEffect(() => {
    localStorage.setItem('chatTheme', chatTheme);
  }, [chatTheme]);

  const activeTheme = CHAT_THEMES.find(t => t.id === chatTheme) || CHAT_THEMES[0];

  // 🔥 Online = presence active AND last_seen fresh (60s andar) — taaki stale presence se "Online" na dikhe 🔥
  useEffect(() => {
    if (!otherUserId) return;
    let cancelled = false;
    const refresh = async () => {
      const { data } = await supabase.from('users').select('last_seen').eq('id', otherUserId).maybeSingle();
      if (cancelled) return;
      if (data?.last_seen) {
        setLastSeenTime(data.last_seen);
        const fresh = (Date.now() - new Date(data.last_seen).getTime()) < 60000;
        setIsOtherUserOnline(onlineUsers.has(otherUserId) && fresh);
      } else {
        setIsOtherUserOnline(false);
      }
    };
    refresh();
    const id = setInterval(refresh, 20000);
    return () => { cancelled = true; clearInterval(id); };
  }, [otherUserId, onlineUsers]);

  /*
   * ============================================================
   * MOBILE KEYBOARD / VISUAL VIEWPORT FIX
   * ============================================================
   */
  useEffect(() => {
    const updateViewport = () => {
      const viewport = window.visualViewport;
      if (!viewport) return;

      const keyboardHeight = Math.max(0, window.innerHeight - viewport.height - viewport.offsetTop);
      document.documentElement.style.setProperty('--chat-keyboard-height', `${keyboardHeight}px`);

      // 🔥 Keyboard khulte hi last message tak scroll karo, taaki wo chhupe na 🔥
      if (keyboardHeight > 0) {
        setTimeout(() => {
          const container = chatScrollRef.current;
          if (container) container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' });
        }, 250);
      }
    };

    updateViewport();

    const viewport = window.visualViewport;
    viewport?.addEventListener('resize', updateViewport);
    viewport?.addEventListener('scroll', updateViewport);
    window.addEventListener('resize', updateViewport);

    return () => {
      viewport?.removeEventListener('resize', updateViewport);
      viewport?.removeEventListener('scroll', updateViewport);
      window.removeEventListener('resize', updateViewport);
      document.documentElement.style.removeProperty('--chat-keyboard-height');
    };
  }, []);

  const scrollToBottom = (instant = false) => {
    setTimeout(() => {
      const container = chatScrollRef.current;
      if (container) {
        const target = container.scrollHeight;
        if (Math.abs(container.scrollTop + container.clientHeight - target) < 250 || instant) {
          container.scrollTo({ top: target, behavior: instant ? 'auto' : 'smooth' });
        }
      }
    }, instant ? 0 : 100);
  };

  useEffect(() => {
    scrollToBottom(true);
  }, [chatHistory, isTyping, filePreview]);

  useEffect(() => {
    if (!chatHistory.length) return;
    const forwardedIds = [...new Set(chatHistory.map(m => m.forwarded_from).filter(Boolean))];
    if (!forwardedIds.length) return;
    supabase.from('users').select('id, username').in('id', forwardedIds).then(({ data }) => {
      if (!data) return;
      const map = {};
      data.forEach(u => { map[u.id] = u.username; });
      setForwardedNames(prev => ({ ...prev, ...map }));
    });
  }, [chatHistory]);

  /*
   * ============================================================
   * LOAD CHAT & PRESENCE LOGIC
   * ============================================================
   */
  useEffect(() => {
    let cancelled = false;
    let presenceChannel = null;
    let messageChannel = null;

    const loadChat = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return navigate('/');
      if (cancelled) return;
      setMe(user);

      supabase.from('users').update({ last_seen: new Date().toISOString() }).eq('id', user.id).then();

      const [
        { data: profile },
        { data: messages, error }
      ] = await Promise.all([
        supabase.from('users').select('username, profile_pic, last_seen').eq('id', otherUserId).maybeSingle(),
        supabase.from('messages').select('*')
          .or(`and(sender_id.eq.${user.id},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${user.id})`)
          .order('created_at', { ascending: true })
      ]);

      if (cancelled) return;
      if (error) return console.error('Could not load chat:', error);

      setOtherUser(profile);
      setLastSeenTime(profile?.last_seen);
      setChatHistory(messages || []);

      if (messages && messages.length > 0) {
        supabase.from('messages').update({ is_read: true, is_delivered: true })
          .eq('receiver_id', user.id).eq('sender_id', otherUserId).eq('is_read', false).then();
      }

      // 🔥 UNIQUE + DETERMINISTIC channel name — dono users ke liye SAME rahe, warna broadcast pahunchta nahi 🔥
      const roomKey = `chat_${[user.id, otherUserId].sort().join('_')}`;

      presenceChannel = supabase.channel(`typing_${roomKey}`);
      channelRef.current = presenceChannel;

      presenceChannel
        .on('broadcast', { event: 'typing' }, ({ payload }) => {
          if (payload.userId === otherUserId) {
            setIsTyping(payload.isTyping);
            scrollToBottom();
          }
        })
        .subscribe();

      messageChannel = supabase
        .channel(`messages_${roomKey}`)
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, payload => {
            const newMsg = payload.new;
            setChatHistory(prev => {
              if (prev.some(msg => msg.id === newMsg.id || (msg.media_url && msg.media_url === newMsg.media_url))) return prev;
              if ((newMsg.sender_id === user.id && newMsg.receiver_id === otherUserId) || (newMsg.sender_id === otherUserId && newMsg.receiver_id === user.id)) {
                if (newMsg.receiver_id === user.id) {
                  supabase.from('messages').update({ is_delivered: true })
                    .eq('id', newMsg.id).eq('is_delivered', false).then();
                }
                return [...prev, newMsg];
              }
              return prev;
            });
          }
        )
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'messages' }, payload => {
            const updated = payload.new;
            setChatHistory(prev => prev.map(msg =>
              String(msg.id) === String(updated.id) ? { ...msg, ...updated } : msg
            ));
          }
        )
        .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'messages' }, payload => {
            setChatHistory(prev => prev.filter(msg => String(msg.id) !== String(payload.old.id)));
          }
        )
        .subscribe();
    };

    loadChat();

    return () => {
      cancelled = true;
      if (presenceChannel) supabase.removeChannel(presenceChannel);
      if (messageChannel) supabase.removeChannel(messageChannel);

      clearInterval(recTimerRef.current);
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') mediaRecorderRef.current.stop();
      recStreamRef.current?.getTracks().forEach(t => t.stop());
      if (audioRef.current) { audioRef.current.pause(); audioRef.current.src = ''; }

      supabase.auth.getUser().then(({ data: { user } }) => {
        if (user) supabase.from('users').update({ last_seen: new Date().toISOString() }).eq('id', user.id).then();
      });
    };
  }, [navigate, otherUserId]);

  const getLastSeenText = () => {
    if (isTyping) return 'typing...';
    if (isOtherUserOnline) return 'Online';

    const timeToUse = lastSeenTime || [...chatHistory].reverse().find(m => m.sender_id === otherUserId)?.created_at;

    if (timeToUse) {
      const date = new Date(timeToUse);
      const now = new Date();
      
      const isToday = now.toDateString() === date.toDateString();
      
      const yesterday = new Date(now);
      yesterday.setDate(now.getDate() - 1);
      const isYesterday = yesterday.toDateString() === date.toDateString();

      const timeStr = date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });

      if (isToday) {
        return `Last seen today at ${timeStr}`;
      } else if (isYesterday) {
        return `Last seen yesterday at ${timeStr}`;
      } else {
        const dateStr = date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
        return `Last seen on ${dateStr} at ${timeStr}`;
      }
    }
    
    return 'Offline';
  };

  const formatTime = ts => {
    if (!ts) return '';
    try {
      return new Date(ts).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
    } catch {
      return '';
    }
  };

  const formatVoiceTime = secs => {
    const s = Math.max(0, Math.floor(secs || 0));
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
  };

  // 🎤 VOICE RECORDING 🎤
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      recStreamRef.current = stream;
      audioChunksRef.current = [];
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      recorder.ondataavailable = e => { if (e.data.size > 0) audioChunksRef.current.push(e.data); };
      recorder.onstop = () => recStreamRef.current?.getTracks().forEach(t => t.stop());
      recorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      recTimerRef.current = setInterval(() => setRecordingTime(t => t + 1), 1000);
    } catch (err) {
      console.error('Mic error:', err);
      alert('Microphone access denied. Please allow mic permission.');
    }
  };

  const cancelRecording = () => {
    clearInterval(recTimerRef.current);
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') mediaRecorderRef.current.stop();
    mediaRecorderRef.current = null;
    audioChunksRef.current = [];
    setIsRecording(false);
    setRecordingTime(0);
  };

  const sendVoiceRecording = async () => {
    const recorder = mediaRecorderRef.current;
    const duration = recordingTime;
    if (!recorder || recorder.state === 'inactive') return;

    clearInterval(recTimerRef.current);
    setIsRecording(false);

    const blobPromise = new Promise(resolve => {
      recorder.onstop = () => resolve(new Blob(audioChunksRef.current, { type: recorder.mimeType || 'audio/webm' }));
    });
    recorder.stop();
    mediaRecorderRef.current = null;

    const blob = await blobPromise;
    if (blob.size === 0) return;

    await uploadVoiceBlob(blob, duration);
    setRecordingTime(0);
  };

  const uploadVoiceBlob = async (blob, duration) => {
    if (!me) return;
    const replyId = replyTo ? replyTo.id : null;
    setReplyTo(null);

    const tempId = `temp_voice_${Date.now()}`;
    const blobUrl = URL.createObjectURL(blob);
    const optimistic = {
      id: tempId, sender_id: me.id, receiver_id: otherUserId, content: '🎤 Voice message',
      media_url: blobUrl, message_type: 'voice', duration, reply_to_id: replyId,
      created_at: new Date().toISOString(), isTemp: true
    };

    setChatHistory(prev => [...prev, optimistic]);

    try {
      const fileExt = blob.type.includes('mp4') ? 'm4a' : 'webm';
      const fileName = `chats/${me.id}_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${fileExt}`;

      const { error: uploadError } = await supabase.storage.from('yellowgram_uploads')
        .upload(fileName, blob, { cacheControl: '3600', upsert: false, contentType: blob.type || 'audio/webm' });
      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage.from('yellowgram_uploads').getPublicUrl(fileName);
      const mediaUrl = publicUrlData?.publicUrl;

      const { data: finalMsg, error: msgError } = await supabase.from('messages').insert({
          sender_id: me.id, receiver_id: otherUserId, content: '🎤 Voice message', message_type: 'voice',
          duration, media_url: mediaUrl, reply_to_id: replyId
        }).select().single();
      if (msgError) throw msgError;

      setChatHistory(prev => prev.map(msg => msg.id === tempId ? finalMsg : msg));
      supabase.from('users').update({ last_seen: new Date().toISOString() }).eq('id', me.id).then();
    } catch (error) {
      console.error('Voice send error:', error);
      setChatHistory(prev => prev.filter(msg => msg.id !== tempId));
      alert(`Failed to send voice: ${error.message}`);
    } finally {
      URL.revokeObjectURL(blobUrl);
    }
  };

  // 🎤 VOICE PLAYBACK 🎤
  const toggleVoicePlay = item => {
    if (playingVoiceId === item.id) {
      audioRef.current?.pause();
      setPlayingVoiceId(null);
      return;
    }
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
    }
    const audio = new Audio(item.media_url);
    audioRef.current = audio;
    audio.onloadedmetadata = () => {
      const dur = (audio.duration && isFinite(audio.duration)) ? audio.duration : (item.duration || 0);
      setVoiceProgress(prev => ({ ...prev, [item.id]: dur ? audio.currentTime / dur : 0 }));
    };
    audio.ontimeupdate = () => {
      const dur = (audio.duration && isFinite(audio.duration)) ? audio.duration : (item.duration || 0);
      setVoiceProgress(prev => ({ ...prev, [item.id]: dur ? audio.currentTime / dur : 0 }));
    };
    audio.onended = () => {
      setPlayingVoiceId(null);
      setVoiceProgress(prev => ({ ...prev, [item.id]: 1 }));
    };
    audio.play().then(() => {
      setPlayingVoiceId(item.id);
      const dur = (audio.duration && isFinite(audio.duration)) ? audio.duration : (item.duration || 0);
      setVoiceProgress(prev => ({ ...prev, [item.id]: dur ? audio.currentTime / dur : 0 }));
    }).catch(err => console.error('Playback error:', err));
  };

  const handleTyping = e => {
    setMessage(e.target.value);
    if (!channelRef.current) return;

    channelRef.current.send({
      type: 'broadcast', event: 'typing', payload: { userId: me?.id, isTyping: e.target.value.length > 0 }
    });

    clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => {
      channelRef.current?.send({
        type: 'broadcast', event: 'typing', payload: { userId: me?.id, isTyping: false }
      });
    }, 2000);
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isImage = file.type.startsWith('image/');
    const isVideo = file.type.startsWith('video/');

    if (!isImage && !isVideo) {
      alert("Only image and video files are allowed.");
      return;
    }

    setSelectedFile(file);
    setFilePreview({ url: URL.createObjectURL(file), type: isVideo ? 'video' : 'image' });
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const cancelFilePreview = () => {
    setSelectedFile(null);
    if (filePreview?.url) URL.revokeObjectURL(filePreview.url);
    setFilePreview(null);
  };

  const sendMessage = async () => {
    const content = message.trim();
    const hasFile = !!selectedFile;
    
    if ((!content && !hasFile) || !me) return;

    setMessage('');
    const fileToSend = selectedFile;
    const previewData = filePreview;
    
    cancelFilePreview(); 
    
    const replyId = replyTo ? replyTo.id : null;
    setReplyTo(null);

    channelRef.current?.send({
      type: 'broadcast', event: 'typing', payload: { userId: me.id, isTyping: false }
    });

    if (!hasFile) {
      const tempId = `temp_text_${Date.now()}`;
      const optimisticMsg = {
        id: tempId, sender_id: me.id, receiver_id: otherUserId, content, message_type: 'text', reply_to_id: replyId, created_at: new Date().toISOString()
      };
      
      setChatHistory(prev => [...prev, optimisticMsg]);

      const { data: finalMsg, error } = await supabase.from('messages').insert({
          sender_id: me.id, receiver_id: otherUserId, content, message_type: 'text', reply_to_id: replyId
        }).select().single();

      if (error) {
        setChatHistory(prev => prev.filter(msg => msg.id !== tempId));
        alert('Failed to send: ' + error.message);
      } else {
        setChatHistory(prev => prev.map(msg => msg.id === tempId ? finalMsg : msg));
        supabase.from('users').update({ last_seen: new Date().toISOString() }).eq('id', me.id).then();
      }
      return;
    }

    setIsUploading(true);
    
    const tempId = `temp_media_${Date.now()}`;
    const optimisticMessage = {
      id: tempId, sender_id: me.id, receiver_id: otherUserId, content: content || (previewData.type === 'video' ? '🎥 Video' : '📷 Photo'),
      media_url: previewData.url, message_type: previewData.type, reply_to_id: replyId, created_at: new Date().toISOString(), isTemp: true
    };
    
    setChatHistory(prev => [...prev, optimisticMessage]);

    try {
      const fileExt = fileToSend.name.split('.').pop()?.toLowerCase();
      const fileName = `chats/${me.id}_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${fileExt}`;

      const { error: uploadError } = await supabase.storage.from('yellowgram_uploads')
        .upload(fileName, fileToSend, { cacheControl: '3600', upsert: false, contentType: fileToSend.type });

      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage.from('yellowgram_uploads').getPublicUrl(fileName);
      const mediaUrl = publicUrlData?.publicUrl;

      const { data: finalMsg, error: messageError } = await supabase.from('messages').insert({
          sender_id: me.id, receiver_id: otherUserId, content: content || (previewData.type === 'video' ? '🎥 Video' : '📷 Photo'),
          media_url: mediaUrl, message_type: previewData.type, reply_to_id: replyId
        }).select().single();

      if (messageError) throw messageError;
      setChatHistory(prev => prev.map(msg => msg.id === tempId ? finalMsg : msg));
      
      supabase.from('users').update({ last_seen: new Date().toISOString() }).eq('id', me.id).then();

    } catch (error) {
      console.error("Upload error:", error);
      setChatHistory(prev => prev.filter(msg => msg.id !== tempId));
      alert(`Failed to send file: ${error.message}`);
    } finally {
      setIsUploading(false);
      URL.revokeObjectURL(previewData.url); 
    }
  };

  const sendQuickReaction = async emoji => {
    if (!selectedMessage || !me) return;
    await supabase.from('messages').insert({
        sender_id: me.id, receiver_id: otherUserId, content: emoji, message_type: 'sticker', reply_to_id: selectedMessage.id
      });
    setSelectedMessage(null);
  };

  const handleDeleteMessage = async () => {
    if (!selectedMessage || !me) return;
    if (String(selectedMessage.sender_id) !== String(me.id)) {
      alert('You can only delete your own messages.');
      setSelectedMessage(null);
      return;
    }

    try {
      const { data, error } = await supabase.from('messages').delete().eq('id', selectedMessage.id).select();
      if (error) alert(`Delete failed: ${error.message}`);
      else setChatHistory(prev => prev.filter(msg => String(msg.id) !== String(selectedMessage.id)));
    } catch (err) { alert('Unexpected error: ' + err.message); } 
    finally { setSelectedMessage(null); }
  };

  const handleClearChat = async () => {
    setMenuOpen(false);
    if (!me) return;
    if (!window.confirm(`Clear chat with ${otherUser?.username || 'this user'}?`)) return;
    try {
      const { error } = await supabase.from('messages').delete()
        .or(`and(sender_id.eq.${me.id},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${me.id})`);
      if (error) alert(`Clear chat failed: ${error.message}`);
      else setChatHistory([]);
    } catch (err) { alert('Unexpected error: ' + err.message); }
  };

  const handleDownloadMedia = async () => {
    if (!viewingMedia) return;
    try {
      const response = await fetch(viewingMedia.url);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `yellowgram_media_${Date.now()}.${viewingMedia.type === 'video' ? 'mp4' : 'jpg'}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      URL.revokeObjectURL(blobUrl);
    } catch (error) {
      alert("Failed to download media.");
    }
  };

  let touchStartX = 0;
  let touchCurrentX = 0;

  const handleTouchStart = (e, msg) => {
    if (msg.isTemp) return; 
    touchStartX = e.touches[0].clientX;
    touchCurrentX = touchStartX;

    pressTimer.current = setTimeout(() => {
      if (navigator.vibrate) navigator.vibrate([40, 50, 60]);
      setSelectedMessage(msg);
      setSwipeData({ id: null, offset: 0 });
    }, 700);
  };

  const handleTouchMove = (e, msg) => {
    if (msg.isTemp) return;
    touchCurrentX = e.touches[0].clientX;
    const diffX = touchCurrentX - touchStartX;

    if (Math.abs(diffX) > 10) clearTimeout(pressTimer.current);
    if (diffX > 15 && diffX < 80) setSwipeData({ id: msg.id, offset: diffX });
  };

  const handleTouchEnd = (e, msg) => {
    if (msg.isTemp) return;
    clearTimeout(pressTimer.current);
    const diffX = touchCurrentX - touchStartX;

    if (diffX > 50) {
      if (navigator.vibrate) navigator.vibrate(30);
      setReplyTo(msg);
    }
    setSwipeData({ id: null, offset: 0 });
  };

  const getRepliedMessage = replyId => chatHistory.find(m => String(m.id) === String(replyId));

  return (
    <div className="h-[100dvh] w-full flex flex-col relative overflow-hidden" style={{ background: activeTheme.bg }}>
      
      {/* 🔝 TOP BAR */}
      <div className="fixed top-0 left-0 right-0 h-[64px] bg-white border-b border-yellow-200 px-3 z-30 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <ChevronLeft className="w-8 h-8 text-gray-900 cursor-pointer active:scale-90" onClick={() => navigate('/messages')} />
          <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-yellow-400 bg-yellow-100 flex-shrink-0">
            <img src={otherUser?.profile_pic || `https://api.dicebear.com/7.x/avataaars/svg?seed=${otherUserId}`} alt="avatar" className="h-full w-full object-cover" />
          </div>
          <div className="flex flex-col min-w-0">
            <h1 className="text-[17px] font-extrabold text-gray-900 leading-tight truncate">{otherUser?.username || 'Chat'}</h1>
            <span className={`text-[11.5px] font-bold truncate ${isOtherUserOnline || isTyping ? 'text-green-600' : 'text-gray-500'}`}>
              {getLastSeenText()}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-4 pr-2 flex-shrink-0">
          <Video className="w-6 h-6 text-gray-900 cursor-pointer active:scale-90 opacity-90 hover:opacity-100" />
          <Phone className="w-[22px] h-[22px] text-gray-900 cursor-pointer active:scale-90 opacity-90 hover:opacity-100" />
          <MoreVertical className="w-6 h-6 text-gray-900 cursor-pointer active:scale-90 opacity-90 hover:opacity-100" onClick={() => setMenuOpen(!menuOpen)} />
        </div>
      </div>

      {/* ⋮ CHAT MENU DROPDOWN */}
      {menuOpen && (
        <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)}>
          <div className="absolute right-2 top-[60px] w-56 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden animate-in zoom-in-95 origin-top-right" onClick={e => e.stopPropagation()}>
            <button onClick={() => { setMenuOpen(false); setThemeOpen(true); }} className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-yellow-50 active:bg-yellow-100 text-left border-b border-gray-100 transition-colors">
              <Palette className="w-5 h-5 text-gray-700" /> <span className="font-bold text-gray-900 text-sm">Chat Theme</span>
            </button>
            <button onClick={() => { setMenuOpen(false); alert('Media coming soon!'); }} className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-yellow-50 active:bg-yellow-100 text-left border-b border-gray-100 transition-colors">
              <ImageIcon className="w-5 h-5 text-gray-700" /> <span className="font-bold text-gray-900 text-sm">Media</span>
            </button>
            <button onClick={() => { setMenuOpen(false); alert('Links coming soon!'); }} className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-yellow-50 active:bg-yellow-100 text-left border-b border-gray-100 transition-colors">
              <Link2 className="w-5 h-5 text-gray-700" /> <span className="font-bold text-gray-900 text-sm">Links</span>
            </button>
            <button onClick={() => { setMenuOpen(false); alert('Docs coming soon!'); }} className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-yellow-50 active:bg-yellow-100 text-left border-b border-gray-100 transition-colors">
              <FileText className="w-5 h-5 text-gray-700" /> <span className="font-bold text-gray-900 text-sm">Docs</span>
            </button>
            <button onClick={handleClearChat} className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-red-50 active:bg-red-100 text-left transition-colors">
              <Trash className="w-5 h-5 text-red-600" /> <span className="font-bold text-red-600 text-sm">Clear Chat</span>
            </button>
          </div>
        </div>
      )}

      {/* 💬 CHAT HISTORY */}
      <div
        ref={chatScrollRef}
        className="flex-1 overflow-y-auto overflow-x-hidden flex flex-col gap-2 pt-[70px] pb-[160px] px-3 scroll-smooth"
        style={{ WebkitOverflowScrolling: 'touch', paddingBottom: filePreview ? 'calc(260px + var(--chat-keyboard-height, 0px))' : 'calc(110px + var(--chat-keyboard-height, 0px))' }}
      >
        {chatHistory.map(item => {
          const mine = String(item.sender_id) === String(me?.id);
          const repliedMsg = item.reply_to_id ? getRepliedMessage(item.reply_to_id) : null;
          const isSwiping = swipeData.id === item.id;
          const swipeStyle = isSwiping ? { transform: `translateX(${swipeData.offset}px)`, transition: 'none' } : { transform: 'translateX(0px)', transition: 'transform 0.2s ease-out' };

          return (
            <div
              key={item.id}
              className={`relative flex flex-col select-none touch-pan-y ${mine ? 'items-end' : 'items-start'} ${item.isTemp ? 'opacity-80' : ''}`}
              onTouchStart={e => handleTouchStart(e, item)}
              onTouchMove={e => handleTouchMove(e, item)}
              onTouchEnd={e => handleTouchEnd(e, item)}
            >
              {!mine && isSwiping && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 text-gray-400 opacity-70">
                  <Reply className="w-5 h-5" />
                </div>
              )}

              <div
                style={swipeStyle}
                className={`relative max-w-[85%] sm:max-w-[75%] p-2 px-3 shadow-sm ${
                  mine ? 'bg-gray-900 text-yellow-400 rounded-t-2xl rounded-bl-2xl rounded-br-sm' : 'bg-white text-gray-900 border border-yellow-200/50 rounded-t-2xl rounded-br-2xl rounded-bl-sm'
                } ${isSwiping && !mine ? 'ml-8' : ''}`}
              >
                {repliedMsg && (
                  <div className={`mb-1.5 p-1.5 rounded text-xs border-l-4 opacity-90 ${mine ? 'bg-gray-800 border-yellow-500 text-gray-300' : 'bg-yellow-50 border-yellow-500 text-gray-600'}`}>
                    <span className="font-bold text-yellow-600 block mb-0.5">{String(repliedMsg.sender_id) === String(me?.id) ? 'You' : otherUser?.username}</span>
                    <span className="truncate block line-clamp-1">{repliedMsg.message_type === 'voice' ? '🎤 Voice message' : repliedMsg.message_type !== 'text' ? '📷 Media' : repliedMsg.content}</span>
                  </div>
                )}

                {item.forwarded_from && (
                  <div className={`mb-1 text-[11px] font-extrabold uppercase tracking-wide ${mine ? 'text-yellow-400/90' : 'text-yellow-600'}`}>
                    Forwarded from {String(item.forwarded_from) === String(me?.id) ? 'You' : (forwardedNames[item.forwarded_from] || 'Unknown')}
                  </div>
                )}

                {/* 🔥 CLICKABLE MEDIA 🔥 */}
                {(item.message_type === 'image' || item.message_type === 'video') && (
                  <div 
                    className="relative mb-1 cursor-pointer active:scale-[0.98] transition-transform" 
                    onClick={() => !item.isTemp && setViewingMedia({ url: item.media_url, type: item.message_type })}
                  >
                    {item.message_type === 'image' ? (
                      <img src={item.media_url} alt="media" className="w-full h-auto rounded-md object-cover max-h-60" />
                    ) : (
                      <video src={item.media_url} className="w-full h-auto rounded-md max-h-60 bg-black pointer-events-none" />
                    )}
                    
                    {item.message_type === 'video' && !item.isTemp && (
                       <div className="absolute inset-0 flex items-center justify-center bg-black/20 rounded-md">
                         <div className="w-10 h-10 bg-white/80 rounded-full flex items-center justify-center pl-1"><Video className="w-5 h-5 text-gray-900" /></div>
                       </div>
                    )}

                    {item.isTemp && (
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center rounded-md">
                        <Loader2 className="w-8 h-8 text-white animate-spin" />
                      </div>
                    )}
                  </div>
                )}

                {/* 🔥 TEXT OR CAPTION / STORY REPLY 🔥 */}
                {item.message_type === 'text' && <p className="text-[15px] leading-snug break-words">{item.content}</p>}
                
                {(item.message_type === 'image' || item.message_type === 'video') && item.content && item.content !== '📷 Photo' && item.content !== '🎥 Video' && (
                  <p className="text-[15px] leading-snug break-words mt-1.5">{item.content}</p>
                )}

                {item.message_type === 'sticker' && <p className="text-4xl">{item.content}</p>}

                {/* 🎤 VOICE MESSAGE 🎤 */}
                {item.message_type === 'voice' && (
                  <div className={`flex items-center gap-2 min-w-[170px] max-w-[220px] ${mine ? 'flex-row' : 'flex-row-reverse'}`}>
                    <button onClick={() => toggleVoicePlay(item)} className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 active:scale-90 transition-transform ${mine ? 'bg-yellow-400 text-gray-900' : 'bg-gray-900 text-yellow-400'}`}>
                      {playingVoiceId === item.id ? <Pause className="w-4 h-4" fill="currentColor" /> : <Play className="w-4 h-4 ml-0.5" fill="currentColor" />}
                    </button>
                    <div className={`flex-1 h-1.5 rounded-full overflow-hidden ${mine ? 'bg-yellow-400/25' : 'bg-gray-200'}`}>
                      <div className={`h-full rounded-full transition-all duration-100 ${mine ? 'bg-yellow-400' : 'bg-gray-900'}`} style={{ width: `${Math.min(100, (voiceProgress[item.id] || 0) * 100)}%` }} />
                    </div>
                    <span className={`text-[11px] font-semibold tabular-nums whitespace-nowrap ${mine ? 'text-yellow-400/80' : 'text-gray-500'}`}>
                      {formatVoiceTime(item.duration || 0)}
                    </span>
                  </div>
                )}

                <div className={`mt-0.5 flex items-center justify-end gap-1 ${item.message_type === 'sticker' ? 'text-lg leading-none' : 'text-[11px]'} ${mine ? 'text-yellow-400/80' : 'text-gray-400'}`}>
                  {formatTime(item.created_at)}
                  {mine && (
                    item.is_read ? (
                      <CheckCheck className="w-3.5 h-3.5 text-yellow-400" />
                    ) : item.is_delivered ? (
                      <CheckCheck className="w-3.5 h-3.5 text-yellow-400/40" />
                    ) : (
                      <Check className="w-3.5 h-3.5 text-yellow-400/40" />
                    )
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {isTyping && (
          <div className="self-start bg-white border border-yellow-200/50 rounded-t-2xl rounded-br-2xl rounded-bl-sm p-3 px-4 shadow-sm flex items-center gap-2 mt-1 w-fit animate-in fade-in">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 bg-yellow-500 rounded-full animate-bounce" />
              <span className="w-2 h-2 bg-yellow-500 rounded-full animate-bounce" style={{ animationDelay: '0.15s' }} />
              <span className="w-2 h-2 bg-yellow-500 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }} />
            </span>
            <span className="text-gray-700 font-semibold text-sm animate-pulse">{otherUser?.username || 'User'} is typing...</span>
          </div>
        )}
        <div ref={chatEndRef} className="h-2" />
      </div>

      {/* 📸 FULL SCREEN MEDIA VIEWER 📸 */}
      {viewingMedia && (
        <div className="fixed inset-0 z-[200] bg-black/95 backdrop-blur-md flex flex-col animate-in fade-in zoom-in-95 duration-200">
          <div className="flex items-center justify-between p-4 bg-gradient-to-b from-black/80 to-transparent absolute top-0 w-full z-10">
            <button onClick={() => setViewingMedia(null)} className="p-2 bg-white/10 rounded-full hover:bg-white/20 text-white transition-colors">
              <X className="w-6 h-6" />
            </button>
            <button onClick={handleDownloadMedia} className="flex items-center gap-2 px-4 py-2 bg-yellow-400 hover:bg-yellow-500 text-gray-900 rounded-full font-bold transition-colors active:scale-95">
              <Download className="w-5 h-5" /> Save
            </button>
          </div>
          <div className="flex-1 flex items-center justify-center p-4">
            {viewingMedia.type === 'image' ? (
              <img src={viewingMedia.url} alt="Full Screen" className="max-w-full max-h-full object-contain rounded-lg" />
            ) : (
              <video src={viewingMedia.url} controls autoPlay className="max-w-full max-h-full object-contain rounded-lg" />
            )}
          </div>
        </div>
      )}

      {/* 🎨 CHAT THEME PICKER */}
      <ChatTheme
        open={themeOpen}
        currentThemeId={chatTheme}
        onClose={() => setThemeOpen(false)}
        onApply={theme => { setChatTheme(theme.id); setThemeOpen(false); }}
      />

      {/* LONG PRESS MENU */}
      {selectedMessage && !selectedMessage.isTemp && !viewingMedia && (
        <div className="fixed inset-0 z-[100] bg-white/70 flex items-center justify-center animate-in fade-in" onClick={() => setSelectedMessage(null)}>
          <div className="flex flex-col items-center gap-4 w-72" onClick={e => e.stopPropagation()}>
            <div className="bg-white px-4 py-3 rounded-full flex gap-4 shadow-xl animate-in slide-in-from-bottom-5">
              {['👍', '❤️', '😂', '😮', '😢', '🙏'].map(emoji => (
                <button key={emoji} onClick={() => sendQuickReaction(emoji)} className="text-2xl hover:scale-125 transition-transform active:scale-90">{emoji}</button>
              ))}
            </div>

            <div className="bg-white rounded-2xl w-full overflow-hidden shadow-2xl animate-in zoom-in-95">
              <button onClick={() => { setReplyTo(selectedMessage); setSelectedMessage(null); }} className="w-full flex items-center gap-3 px-5 py-4 hover:bg-gray-50 active:bg-gray-100 border-b border-gray-100">
                <Reply className="w-5 h-5 text-gray-700" /> <span className="font-bold text-gray-900">Reply</span>
              </button>

              {selectedMessage.message_type === 'text' && (
                <button onClick={() => { navigator.clipboard.writeText(selectedMessage.content); setSelectedMessage(null); }} className="w-full flex items-center gap-3 px-5 py-4 hover:bg-gray-50 active:bg-gray-100 border-b border-gray-100">
                  <Copy className="w-5 h-5 text-gray-700" /> <span className="font-bold text-gray-900">Copy</span>
                </button>
              )}

              <button onClick={() => { navigate('/forward', { state: { message: selectedMessage } }); setSelectedMessage(null); }} className="w-full flex items-center gap-3 px-5 py-4 hover:bg-gray-50 active:bg-gray-100 border-b border-gray-100">
                <Forward className="w-5 h-5 text-gray-700" /> <span className="font-bold text-gray-900">Forward</span>
              </button>

              {String(selectedMessage.sender_id) === String(me?.id) && (
                <button onClick={handleDeleteMessage} className="w-full flex items-center gap-3 px-5 py-4 hover:bg-red-50 active:bg-red-100 text-red-600 transition-colors">
                  <Trash2 className="w-5 h-5" /> <span className="font-bold">Delete</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* BOTTOM MESSAGE COMPOSER */}
      <div className="fixed left-0 right-0 bg-yellow-400 border-t border-yellow-500 flex flex-col z-30 shadow-[0_-2px_10px_rgba(0,0,0,0.08)]"
        style={{ bottom: 'var(--chat-keyboard-height, 0px)', paddingBottom: 'env(safe-area-inset-bottom, 0px)', transform: 'translateZ(0)', willChange: 'bottom' }}>
        
        {replyTo && (
          <div className="bg-white/90 px-4 py-2.5 flex items-center justify-between border-b border-yellow-500 animate-in slide-in-from-bottom-2">
            <div className="flex flex-col flex-1 border-l-4 border-gray-900 pl-2 min-w-0">
              <span className="text-yellow-700 font-bold text-xs truncate">Replying to {String(replyTo.sender_id) === String(me?.id) ? 'Yourself' : otherUser?.username}</span>
              <span className="text-gray-700 text-sm truncate">{replyTo.message_type === 'voice' ? '🎤 Voice message' : replyTo.content}</span>
            </div>
            <button onClick={() => setReplyTo(null)} className="p-1.5 ml-2 bg-gray-900/10 rounded-full text-gray-700 hover:bg-gray-900/20 flex-shrink-0">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {filePreview && (
          <div className="p-3 bg-white/90 border-b border-yellow-500 relative animate-in slide-in-from-bottom-2">
            <button onClick={cancelFilePreview} className="absolute top-4 right-4 bg-gray-900/70 p-1.5 rounded-full text-white hover:bg-gray-900 z-10">
              <X className="w-5 h-5" />
            </button>
            <div className="w-32 h-32 rounded-xl overflow-hidden border-2 border-gray-900 bg-black flex items-center justify-center mx-auto shadow-md">
              {filePreview.type === 'image' ? <img src={filePreview.url} alt="Preview" className="w-full h-full object-cover" /> : <video src={filePreview.url} className="w-full h-full object-cover" />}
            </div>
          </div>
        )}

        <div className="p-2 flex items-end gap-2 pb-safe">
          <button onClick={() => fileInputRef.current?.click()} className="p-2.5 text-gray-900 hover:text-gray-900 transition-colors mb-0.5 flex-shrink-0">
            {isUploading ? <Loader2 className="w-6 h-6 animate-spin text-gray-900" /> : <Paperclip className="w-6 h-6" />}
          </button>
          <input type="file" accept="image/*,video/*" ref={fileInputRef} onChange={handleFileSelect} className="hidden" />

          {isRecording ? (
            <div className="flex-1 bg-white border border-gray-200 rounded-3xl flex items-center gap-3 px-4 py-2 min-h-[44px] mb-0.5 min-w-0">
              <span className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse flex-shrink-0" />
              <span className="text-red-600 font-bold text-sm tabular-nums flex-shrink-0">{formatVoiceTime(recordingTime)}</span>
              <div className="flex-1 h-1.5 bg-red-100 rounded-full overflow-hidden min-w-0">
                <div className="h-full bg-red-500 rounded-full transition-all" style={{ width: `${Math.min(100, (recordingTime / 60) * 100)}%` }} />
              </div>
            </div>
          ) : (
            <div className="flex-1 bg-white border border-gray-300 rounded-3xl flex items-center px-4 py-2 min-h-[44px] max-h-24 mb-0.5 overflow-hidden min-w-0">
              <textarea placeholder={filePreview ? "Add a caption..." : "Message..."} value={message} onChange={handleTyping} onFocus={() => { scrollToBottom(); setTimeout(scrollToBottom, 250); }} onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }} rows={1} className="w-full bg-transparent focus:outline-none text-gray-900 font-medium resize-none max-h-20 min-w-0" style={{ overflowY: 'auto' }} />
            </div>
          )}

          {isRecording ? (
            <>
              <button onClick={cancelRecording} className="p-3 rounded-full bg-white/70 text-gray-700 active:scale-90 transition-all mb-0.5 shadow-sm flex-shrink-0">
                <X className="w-[18px] h-[18px]" strokeWidth={3} />
              </button>
              <button onClick={sendVoiceRecording} className="p-3 rounded-full bg-gray-900 text-yellow-400 active:scale-90 transition-all mb-0.5 shadow-sm flex-shrink-0">
                <Send className="w-[18px] h-[18px]" strokeWidth={3} />
              </button>
            </>
          ) : message.trim() || filePreview ? (
            <button onClick={sendMessage} disabled={!message.trim() && !filePreview} className={`p-3 rounded-full active:scale-90 transition-all mb-0.5 shadow-sm flex-shrink-0 ${message.trim() || filePreview ? 'bg-gray-900 text-yellow-400' : 'bg-white/60 text-gray-500'}`}>
              <Send className="w-[18px] h-[18px]" strokeWidth={3} />
            </button>
          ) : (
            <button onClick={startRecording} className="p-3 rounded-full bg-gray-900 text-yellow-400 active:scale-90 transition-all mb-0.5 shadow-sm flex-shrink-0 hover:bg-gray-800">
              <Mic className="w-[18px] h-[18px]" strokeWidth={3} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}