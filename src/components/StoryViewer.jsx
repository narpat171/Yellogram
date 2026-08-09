import React, { useCallback, useEffect, useRef, useState } from 'react';
import { X, MoreHorizontal, Heart, Smile, Trash2, Eye, ChevronUp } from 'lucide-react';
import { supabase } from '../supabase';

const DEFAULT_STORY_DURATION = 5000;

export default function StoryViewer({ groupedStories, initialUserIndex = 0, currentUserId, onClose, onStoryDeleted, onStoryViewed }) {
  const [userIndex, setUserIndex] = useState(initialUserIndex);
  const [storyIndex, setStoryIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [loadedStoryKey, setLoadedStoryKey] = useState(null);
  const [message, setMessage] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isStoryLiked, setIsStoryLiked] = useState(false);
  const [storyLikers, setStoryLikers] = useState([]);
  const [storyViewsCount, setStoryViewsCount] = useState(0);
  const [storyViewers, setStoryViewers] = useState([]);
  const [showViewersSheet, setShowViewersSheet] = useState(false);
  const [showStickers, setShowStickers] = useState(false);
  const progressRef = useRef(0);
  const pointerDownAtRef = useRef(0);
  const consumeTapRef = useRef(false);

  const currentUserGroup = groupedStories[userIndex];
  const currentStoriesList = currentUserGroup?.items ?? [];
  const currentStory = currentStoriesList[storyIndex];
  const storyKey = `${userIndex}-${storyIndex}-${currentStory?.media_url ?? ''}`;
  const isMediaReady = loadedStoryKey === storyKey;
  const duration = currentStory?.duration_ms ?? DEFAULT_STORY_DURATION;
  const isOwnStory = currentStory?.user_id === currentUserId;

  useEffect(() => {
    if (currentStory?.id) onStoryViewed?.(currentStory.id);
  }, [currentStory?.id, onStoryViewed]);

  const loadStoryStats = useCallback(async () => {
    if (!currentStory?.id) return;
    const { data: likes, error } = await supabase.from('story_likes').select('user_id').eq('story_id', currentStory.id);
    if (error) return console.error('Could not load story likes:', error);
    const likedIds = (likes || []).map((like) => like.user_id);
    setIsStoryLiked(likedIds.includes(currentUserId));

    if (isOwnStory) {
      const { data: views } = await supabase.from('story_views').select('user_id, viewed_at').eq('story_id', currentStory.id).order('viewed_at', { ascending: false });
      const viewerIds = (views || []).map((view) => view.user_id);
      setStoryViewsCount(viewerIds.length);

      const allIds = [...new Set([...viewerIds, ...likedIds])];
      if (allIds.length) {
        const { data: users } = await supabase.from('users').select('id, username, profile_pic').in('id', allIds);
        const userMap = Object.fromEntries((users || []).map((user) => [user.id, user]));
        setStoryViewers(allIds.map((id) => ({ ...(userMap[id] || { id }), liked: likedIds.includes(id) })));
        setStoryLikers(likedIds.map((id) => userMap[id]).filter(Boolean));
      } else {
        setStoryViewers([]);
        setStoryLikers([]);
      }
    } else {
      setStoryViewers([]);
      setStoryLikers([]);
    }
  }, [currentStory?.id, currentUserId, isOwnStory]);

  useEffect(() => {
    loadStoryStats();
    setShowStickers(false);
    setShowViewersSheet(false);
  }, [loadStoryStats, storyKey]);

  useEffect(() => {
    if (!currentStory?.id || currentStory.user_id === currentUserId) return;
    supabase.from('story_views').upsert(
      { story_id: currentStory.id, user_id: currentUserId, viewed_at: new Date().toISOString() },
      { onConflict: 'story_id,user_id' }
    ).then();
  }, [currentStory?.id, currentStory?.user_id, currentUserId]);

  const toggleStoryLike = async () => {
    if (!currentUserId || isOwnStory) return;
    const wasLiked = isStoryLiked;
    setIsStoryLiked(!wasLiked);
    const request = wasLiked
      ? supabase.from('story_likes').delete().eq('story_id', currentStory.id).eq('user_id', currentUserId)
      : supabase.from('story_likes').insert({ story_id: currentStory.id, user_id: currentUserId });
    const { error } = await request;
    if (error) {
      setIsStoryLiked(wasLiked);
      alert(error.message);
    }
  };

  // 🔥 YAHAN MAIN GHALTI THI: ISE UPDATE KIYA GAYA HAI 🔥
  const sendStoryReply = async (content, messageType = 'text') => {
    const reply = content.trim();
    if (!reply || !currentUserId || isOwnStory) return;

    try {
      // 1. Send Message to Chat Room
      const { error: msgError } = await supabase.from('messages').insert({
        sender_id: currentUserId,
        receiver_id: currentStory.user_id,
        content: reply, // User ka text ya emoji
        // 🔥 Media URL zaroori hai taki chat room mein story dikhe
        media_url: currentStory.media_url, 
        // Type image ya video bhejna hai taaki ChatRoom render kar sake
        message_type: currentStory.media_url?.includes('.mp4') ? 'video' : 'image',
      });

      if (msgError) throw msgError;

      // 2. Send Notification to Story Owner
      await supabase.from('notifications').insert({
        user_id: currentStory.user_id,
        sender_id: currentUserId,
        type: 'message',
        content: messageType === 'sticker' ? `reacted to your story: ${reply}` : `replied to your story: "${reply}"`
      });

      setMessage('');
      setShowStickers(false);
      // Story pause hatane ke liye alert ke baad
      setIsPaused(false); 
      
    } catch (err) {
      alert("Error sending reply: " + err.message);
    }
  };

  const setSyncedProgress = useCallback((value) => {
    const nextValue = Math.min(100, Math.max(0, value));
    progressRef.current = nextValue;
    setProgress(nextValue);
  }, []);

  const handleNext = useCallback(() => {
    setSyncedProgress(0);
    if (storyIndex < currentStoriesList.length - 1) {
      setStoryIndex((value) => value + 1);
    } else if (userIndex < groupedStories.length - 1) {
      setUserIndex((value) => value + 1);
      setStoryIndex(0);
    } else {
      onClose();
    }
  }, [currentStoriesList.length, groupedStories.length, onClose, setSyncedProgress, storyIndex, userIndex]);

  const handlePrev = useCallback(() => {
    setSyncedProgress(0);
    if (storyIndex > 0) {
      setStoryIndex((value) => value - 1);
    } else if (userIndex > 0) {
      setUserIndex((value) => value - 1);
      setStoryIndex(groupedStories[userIndex - 1].items.length - 1);
    }
  }, [groupedStories, setSyncedProgress, storyIndex, userIndex]);

  const startHoldingStory = () => {
    pointerDownAtRef.current = performance.now();
    setIsPaused(true);
  };

  const stopHoldingStory = () => {
    if (performance.now() - pointerDownAtRef.current > 180) {
      consumeTapRef.current = true;
      setTimeout(() => { consumeTapRef.current = false; }, 0);
    }
    setIsPaused(false);
  };

  const deleteCurrentStory = async () => {
    if (!isOwnStory || !currentStory || isDeleting) return;

    if (!window.confirm('Delete this story?')) return;
    setIsDeleting(true);

    const storagePath = currentStory.media_url?.split('/object/public/')[1]?.split('?')[0];
    if (storagePath) {
      await supabase.storage.from('yellowgram_uploads').remove([storagePath]);
    }

    const { error } = await supabase
      .from('stories')
      .delete()
      .eq('id', currentStory.id)
      .eq('user_id', currentUserId);

    if (error) {
      setIsDeleting(false);
      return alert(`Story could not be deleted: ${error.message}`);
    }

    setMenuOpen(false);
    setSyncedProgress(0);
    onStoryDeleted?.(currentStory.id);

    if (storyIndex < currentStoriesList.length - 1) {
      setStoryIndex((value) => value + 1);
    } else if (userIndex < groupedStories.length - 1) {
      setUserIndex((value) => value + 1);
      setStoryIndex(0);
    } else {
      onClose();
    }
    setIsDeleting(false);
  };

  useEffect(() => {
    setSyncedProgress(0);
  }, [setSyncedProgress, storyKey]);

  useEffect(() => {
    const nextStory = storyIndex < currentStoriesList.length - 1
      ? currentStoriesList[storyIndex + 1]
      : groupedStories[userIndex + 1]?.items?.[0];

    if (nextStory?.media_url) {
      const image = new Image();
      image.src = nextStory.media_url;
    }
  }, [currentStoriesList, groupedStories, storyIndex, userIndex]);

  const audioRef = useRef(null);
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
      audioRef.current = null;
    }
    if (!currentStory?.music_url) return;

    const audio = new Audio(currentStory.music_url);
    audio.loop = true;
    audio.volume = 0.85;
    audio.currentTime = Math.min(Number(currentStory.music_start) || 0, Number(currentStory.duration_ms || 30000) / 1000);
    audioRef.current = audio;
    audio.play().then(() => {}).catch(() => {});
    return () => { audio.pause(); audio.src = ''; };
  }, [storyKey, currentStory?.music_url, currentStory?.music_start, currentStory?.duration_ms]);

  useEffect(() => {
    if (!currentStory || !isMediaReady || isPaused) return undefined;

    let frameId;
    const startedAt = performance.now() - (progressRef.current / 100) * duration;

    const tick = (now) => {
      const nextProgress = ((now - startedAt) / duration) * 100;
      if (nextProgress >= 100) {
        setSyncedProgress(100);
        handleNext();
        return;
      }

      setSyncedProgress(nextProgress);
      frameId = requestAnimationFrame(tick);
    };

    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  }, [currentStory, duration, handleNext, isMediaReady, isPaused, setSyncedProgress]);

  if (!currentStory) return null;

  return (
    <div className="fixed inset-0 z-[300] bg-black flex flex-col font-sans">
      <div className="flex gap-1 px-2 pt-4 pb-2 z-30 absolute top-0 w-full">
        {currentStoriesList.map((_, index) => {
          const width = index < storyIndex ? 100 : index === storyIndex ? progress : 0;
          return (
            <div key={index} className="h-[2.5px] flex-1 bg-white/30 rounded-full overflow-hidden">
              <div className="h-full bg-white" style={{ width: `${width}%` }} />
            </div>
          );
        })}
      </div>

      <div className="flex justify-between items-center px-4 pt-8 absolute top-0 w-full z-20 bg-gradient-to-b from-black/80 via-black/40 to-transparent pb-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full border-2 border-gray-400 p-[2px] overflow-hidden">
            <img src={currentUserGroup.user?.profile_pic || `https://api.dicebear.com/7.x/avataaars/svg?seed=${currentUserGroup.user?.username}`} alt="avatar" className="w-full h-full rounded-full object-cover bg-black" />
          </div>
          <div className="flex items-center gap-2"><span className="text-white font-bold text-[15px]">{currentUserGroup.user?.username || 'User'}</span><span className="text-white/60 font-medium text-[13px]">2h</span></div>
        </div>
        <div className="flex items-center gap-4 relative">
          {isOwnStory && (
            <>
              <button onClick={() => { setIsPaused(true); setMenuOpen((value) => !value); }} className="text-white" aria-label="Story options"><MoreHorizontal className="w-6 h-6" /></button>
              {menuOpen && (
                <div className="absolute right-10 top-10 w-40 overflow-hidden rounded-xl bg-white shadow-xl">
                  <button onClick={deleteCurrentStory} disabled={isDeleting} className="flex w-full items-center gap-2 px-4 py-3 text-left text-sm font-bold text-red-600 hover:bg-red-50 disabled:opacity-50">
                    <Trash2 className="h-4 w-4" />{isDeleting ? 'Deleting...' : 'Delete story'}
                  </button>
                </div>
              )}
            </>
          )}
          <button onClick={onClose} className="text-white" aria-label="Close story"><X className="w-8 h-8" /></button>
        </div>
      </div>

      <div className="flex-1 relative w-full h-full flex items-center justify-center bg-[#121212] overflow-hidden" onPointerDown={startHoldingStory} onPointerUp={stopHoldingStory} onPointerCancel={stopHoldingStory}>
        <div className="absolute left-0 top-0 bottom-0 w-1/3 z-10" onClick={(event) => { event.stopPropagation(); if (!consumeTapRef.current) handlePrev(); }} />
        <div className="absolute right-0 top-0 bottom-0 w-2/3 z-10" onClick={(event) => { event.stopPropagation(); if (!consumeTapRef.current) handleNext(); }} />
        <img key={storyKey} src={currentStory.media_url} alt="story" onLoad={() => setLoadedStoryKey(storyKey)} onError={() => setLoadedStoryKey(storyKey)} className="w-full h-full object-cover" style={{ filter: currentStory.filter !== 'none' ? currentStory.filter : 'none' }} />
      </div>

      <div className="absolute bottom-0 w-full bg-gradient-to-t from-black/90 via-black/50 to-transparent pt-12 pb-6 px-4 z-20">
        {isOwnStory ? (
          <div className="rounded-2xl bg-black/40 border border-white/20 px-4 py-3 text-white backdrop-blur-md cursor-pointer active:opacity-80 transition-opacity" onClick={() => setShowViewersSheet(true)}>
            <div className="flex items-center gap-1.5 font-bold">
              <Eye className="h-5 w-5" />
              <span>{storyViewsCount}</span>
              <span className="text-white/60 font-medium">views</span>
              <span className="mx-1.5 text-white/30">·</span>
              <Heart className="h-5 w-5 fill-red-500 text-red-500" />
              <span>{storyLikers.length}</span>
              <span className="text-white/60 font-medium">liked your story</span>
              <ChevronUp className="h-4 w-4 ml-auto text-white/50" />
            </div>
            {storyLikers.length > 0 && (
              <div className="mt-2 flex items-center">
                <div className="flex gap-1">
                  {storyLikers.slice(0, 4).map((user) => (
                    <img key={user.id} src={user.profile_pic || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.id}`} alt="" className="h-6 w-6 rounded-full border-2 border-black/50 object-cover" />
                  ))}
                </div>
                <span className="ml-2 text-xs text-white/50 font-semibold">View all</span>
              </div>
            )}
          </div>
        ) : (
          <>
            {showStickers && <div className="mb-3 flex gap-3 overflow-x-auto rounded-2xl bg-black/70 p-3">{['❤️', '🔥', '😂', '😍', '👏', '🎉'].map((sticker) => <button key={sticker} onClick={() => sendStoryReply(sticker, 'sticker')} className="text-3xl">{sticker}</button>)}</div>}
            <div className="flex items-center gap-4">
              <div className="flex-1 flex items-center bg-black/30 border border-white/30 rounded-full px-4 py-3 backdrop-blur-md">
                <input type="text" value={message} onChange={(event) => setMessage(event.target.value)} onFocus={() => setIsPaused(true)} onBlur={() => setIsPaused(false)} onKeyDown={(event) => event.key === 'Enter' && sendStoryReply(message)} placeholder={`Reply to ${currentUserGroup.user?.username || 'User'}...`} className="bg-transparent text-white w-full outline-none placeholder-white/70 text-[15px] font-medium" />
                <button onClick={() => setShowStickers((value) => !value)} className="text-white/80 ml-2" aria-label="Send sticker"><Smile className="w-6 h-6" /></button>
              </div>
              {!message.trim() ? <button onClick={toggleStoryLike} className={isStoryLiked ? 'text-red-500' : 'text-white'} aria-label="Like story"><Heart className="w-7 h-7" fill={isStoryLiked ? 'currentColor' : 'none'} /></button> : <button onClick={() => sendStoryReply(message)} className="text-white bg-blue-500 px-5 py-2.5 rounded-full font-bold text-[15px]">Send</button>}
            </div>
          </>
        )}
      </div>

      {showViewersSheet && (
        <div className="fixed inset-0 z-[350] bg-black/60 flex items-end justify-center" onClick={() => setShowViewersSheet(false)}>
          <div className="w-full max-w-lg bg-white rounded-t-3xl pb-6 max-h-[75vh] overflow-y-auto animate-in slide-in-from-bottom-full duration-300" onClick={(event) => event.stopPropagation()}>
            <div className="sticky top-0 bg-white pt-4 pb-3 px-5 border-b border-gray-100 flex items-center justify-between z-10">
              <div>
                <h3 className="font-black text-gray-900">Story viewers</h3>
                <p className="text-sm text-gray-500 font-medium">{storyViewsCount} views</p>
              </div>
              <button onClick={() => setShowViewersSheet(false)} className="p-1 active:scale-90 transition-transform" aria-label="Close viewers"><X className="w-6 h-6 text-gray-500" /></button>
            </div>
            <div className="px-5 pt-3 flex flex-col">
              {storyViewers.map((viewer) => (
                <div key={viewer.id} className="flex items-center gap-3 py-3 border-b border-gray-50 last:border-0">
                  <img src={viewer.profile_pic || `https://api.dicebear.com/7.x/avataaars/svg?seed=${viewer.id}`} alt="" className="h-11 w-11 rounded-full object-cover bg-gray-100" />
                  <span className="flex-1 font-bold text-gray-900 truncate">{viewer.username || 'User'}</span>
                  {viewer.liked && <Heart className="w-5 h-5 fill-red-500 text-red-500" />}
                </div>
              ))}
              {storyViewers.length === 0 && <p className="py-10 text-center text-gray-400 font-bold">No views yet</p>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}