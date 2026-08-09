import React, { useState, useRef, useEffect } from 'react';
import { Heart, MessageCircle, Send, Bookmark, MoreHorizontal, Music, Volume2, VolumeX, Camera, X } from 'lucide-react';
import { supabase } from '../supabase'; 
import Skeleton from '../components/Skeleton';

const dummyReels = [
  {
    id: 'dummy_1',
    user_id: 'dummy_user_1',
    videoUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    username: 'sarwar_singh',
    userPic: 'https://api.dicebear.com/7.x/avataaars/svg?seed=sarwar',
    caption: 'Chilling out with some amazing views! ✨💛 #nature #yellowgram',
    music: 'Original Audio - sarwar_singh',
    likes: 12400,
    comments: 450,
  }
];

const formatCount = (count) => {
  if (!count) return 0;
  if (count >= 1000000) return (count / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
  if (count >= 1000) return (count / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
  return count;
};

// 🔥 सिंगल रील कॉम्पोनेंट 🔥
const Reel = ({ reel, onLikeToggle, currentUser, isFollowing, onFollowToggle, onOpenComments }) => {
  const videoRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true); 
  
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(reel.likes || 0);
  const [showHeartAnim, setShowHeartAnim] = useState(false);

  useEffect(() => {
    const options = { root: null, rootMargin: '0px', threshold: 0.8 };
    const callback = (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          videoRef.current?.play();
          setIsPlaying(true);
        } else {
          videoRef.current?.pause();
          setIsPlaying(false);
        }
      });
    };
    const observer = new IntersectionObserver(callback, options);
    if (videoRef.current) observer.observe(videoRef.current);
    return () => observer.disconnect();
  }, []);

  const togglePlay = () => {
    if (isPlaying) {
      videoRef.current?.pause();
      setIsPlaying(false);
    } else {
      videoRef.current?.play();
      setIsPlaying(true);
    }
  };

  const handleDoubleTap = () => {
    if (!isLiked) {
      setIsLiked(true);
      setLikesCount(prev => prev + 1);
      if (onLikeToggle) onLikeToggle(reel.id, likesCount + 1, true);
    }
    setShowHeartAnim(true);
    setTimeout(() => setShowHeartAnim(false), 800);
  };

  const toggleLike = () => {
    if (isLiked) {
      setIsLiked(false);
      setLikesCount(prev => prev - 1);
      if (onLikeToggle) onLikeToggle(reel.id, likesCount - 1, false);
    } else {
      setIsLiked(true);
      setLikesCount(prev => prev + 1);
      if (onLikeToggle) onLikeToggle(reel.id, likesCount + 1, true);
    }
  };

  return (
    <div className="relative w-full h-full snap-start bg-black flex items-center justify-center overflow-hidden">
      
      <video
        ref={videoRef}
        src={reel.media_url || reel.videoUrl} 
        loop
        muted={isMuted}
        playsInline
        className="w-full h-full object-cover"
        onClick={(e) => {
          if (e.detail === 2) handleDoubleTap();
          else if (e.detail === 1) togglePlay();
        }}
      />

      {showHeartAnim && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
          <Heart className="w-24 h-24 text-white fill-white animate-in zoom-in duration-300 drop-shadow-2xl" />
        </div>
      )}

      <button onClick={() => setIsMuted(!isMuted)} className="absolute top-6 right-4 z-20 p-2 bg-black/40 backdrop-blur-sm rounded-full text-white hover:bg-black/60 transition-colors">
        {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
      </button>

      {!isPlaying && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
          <div className="w-16 h-16 bg-black/40 backdrop-blur-sm rounded-full flex items-center justify-center">
            <div className="w-0 h-0 border-t-8 border-t-transparent border-l-[14px] border-l-white border-b-8 border-b-transparent ml-1"></div>
          </div>
        </div>
      )}

      <div className="absolute bottom-0 w-full px-4 pb-20 pt-32 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex justify-between items-end pointer-events-none z-10">
        
        <div className="flex flex-col text-white gap-3 pb-2 w-[75%] pointer-events-auto">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-full border border-white/50 p-0.5 overflow-hidden">
              <img src={reel.user_profile_pic || reel.userPic || `https://api.dicebear.com/7.x/avataaars/svg?seed=${reel.username}`} alt="dp" className="w-full h-full rounded-full object-cover bg-white" />
            </div>
            <span className="font-extrabold text-[15px]">{reel.username || 'Creator'}</span>
            
            {/* 🔥 Reels में Smart Follow Button 🔥 */}
            {currentUser && currentUser.id !== reel.user_id && (
              <button 
                onClick={(e) => { e.stopPropagation(); onFollowToggle(reel.user_id); }}
                className={`px-3 py-1 rounded-lg text-[12px] font-bold ml-2 transition-all active:scale-95 flex-shrink-0 ${
                  isFollowing 
                    ? 'bg-white/20 text-white border border-white/40' 
                    : 'bg-gray-900 text-yellow-400 border border-gray-900'
                }`}
              >
                {isFollowing ? 'Following' : 'Follow'}
              </button>
            )}

          </div>
          
          <p className="text-[14px] font-medium leading-tight line-clamp-2">{reel.caption}</p>
          
          <div className="flex items-center gap-2 bg-white/20 backdrop-blur-md px-3 py-1.5 rounded-full w-max">
            <Music className="w-3.5 h-3.5 animate-pulse" />
            <span className="text-[12px] font-bold">{reel.music || 'Original Audio'}</span>
          </div>
        </div>

        <div className="flex flex-col items-center gap-5 pb-2 pointer-events-auto">
          <div className="flex flex-col items-center gap-1 group">
            <button onClick={toggleLike} className="active:scale-90 transition-transform">
              <Heart className={`w-8 h-8 transition-colors ${isLiked ? 'fill-red-500 text-red-500' : 'text-white'}`} strokeWidth={isLiked ? 0 : 2} />
            </button>
            <span className="text-white text-[13px] font-extrabold">{formatCount(likesCount)}</span>
          </div>

          <div className="flex flex-col items-center gap-1">
            <button onClick={() => onOpenComments(reel)} className="active:scale-90 transition-transform">
              <MessageCircle className="w-8 h-8 text-white" strokeWidth={2} />
            </button>
            <span className="text-white text-[13px] font-extrabold">{formatCount(reel.comments)}</span>
          </div>

          <div className="flex flex-col items-center gap-1">
            <button className="active:scale-90 transition-transform">
              <Send className="w-8 h-8 text-white -mt-1" strokeWidth={2} />
            </button>
            <span className="text-white text-[13px] font-extrabold">Share</span>
          </div>

          <button className="active:scale-90 transition-transform mt-2">
            <MoreHorizontal className="w-7 h-7 text-white" strokeWidth={2.5} />
          </button>
          
          <div className="w-9 h-9 rounded-md border-2 border-white overflow-hidden mt-3 animate-[spin_4s_linear_infinite]">
            <img src={reel.user_profile_pic || reel.userPic || `https://api.dicebear.com/7.x/avataaars/svg?seed=${reel.username}`} alt="audio" className="w-full h-full object-cover bg-black" />
          </div>
        </div>
      </div>
    </div>
  );
};

// 🔥 Main Reels Page Component 🔥
export default function ReelsPage() {
  const [currentUser, setCurrentUser] = useState(null);
  const [followedUsers, setFollowedUsers] = useState({});
  const [reels, setReels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [commentsSheetReel, setCommentsSheetReel] = useState(null);
  const [reelComments, setReelComments] = useState({});
  const [reelCommentDrafts, setReelCommentDrafts] = useState({});
  const [pendingDeleteComment, setPendingDeleteComment] = useState(null);

  useEffect(() => {
    const initializeReels = async () => {
      setLoading(true);
      
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);

      if (user) {
        const { data: myData } = await supabase.from('users').select('following').eq('id', user.id).single();
        if (myData?.following) {
          const followingDict = {};
          myData.following.forEach(id => { followingDict[id] = true; });
          setFollowedUsers(followingDict);
        }
      }

      await fetchReels();
    };
    
    initializeReels();
  }, []);

  const fetchReels = async () => {
    try {
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .eq('type', 'reel')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      if (data && data.length > 0) {
        setReels(data);
      } else {
        setReels(dummyReels);
      }
    } catch (error) {
      console.error("Error fetching reels:", error.message);
      setReels(dummyReels);
    } finally {
      setLoading(false);
    }
  };

  // 🚀 🔥 Reels के लिए असली Follow / Unfollow फंक्शन 🔥 🚀
  const handleFollowToggle = async (targetUserId) => {
    if (!currentUser) return alert("Please login to follow users!");
    if (String(targetUserId).startsWith('dummy')) {
      setFollowedUsers(prev => ({ ...prev, [targetUserId]: !prev[targetUserId] }));
      return;
    }

    const isFollowing = followedUsers[targetUserId];
    setFollowedUsers(prev => ({ ...prev, [targetUserId]: !isFollowing })); 

    try {
      const { data: me } = await supabase.from('users').select('following').eq('id', currentUser.id).single();
      const { data: target } = await supabase.from('users').select('followers').eq('id', targetUserId).single();

      let myFollowing = me?.following || [];
      let targetFollowers = target?.followers || [];

      if (isFollowing) {
        myFollowing = myFollowing.filter(id => id !== targetUserId);
        targetFollowers = targetFollowers.filter(id => id !== currentUser.id);
      } else {
        if (!myFollowing.includes(targetUserId)) myFollowing.push(targetUserId);
        if (!targetFollowers.includes(currentUser.id)) targetFollowers.push(currentUser.id);
      }

      await supabase.from('users').update({ following: myFollowing }).eq('id', currentUser.id);
      await supabase.from('users').update({ followers: targetFollowers }).eq('id', targetUserId);
    } catch (error) {
      console.error("Error following user:", error);
      setFollowedUsers(prev => ({ ...prev, [targetUserId]: isFollowing }));
    }
  };

  const handleLikeSync = async (reelId, newLikesCount, isLiked) => {
    if (!String(reelId).startsWith('dummy')) {
      try {
        await supabase.from('posts').update({ likes: newLikesCount }).eq('id', reelId);
      } catch (error) {
        console.error("Error syncing like:", error);
      }
    }
  };

  const loadReelComments = async (reelId) => {
    const { data, error } = await supabase.from('post_comments').select('*').eq('post_id', reelId).order('created_at', { ascending: true });
    if (error) return alert(error.message);
    const comments = data || [];
    const userIds = [...new Set(comments.map((comment) => comment.user_id).filter(Boolean))];
    const { data: userRows } = userIds.length
      ? await supabase.from('users').select('id, profile_pic').in('id', userIds)
      : { data: [] };
    const picMap = Object.fromEntries((userRows || []).map((user) => [user.id, user.profile_pic]));
    setReelComments((value) => ({ ...value, [reelId]: comments.map((comment) => ({ ...comment, avatar: picMap[comment.user_id] })) }));
  };

  const openReelComments = (reel) => {
    setCommentsSheetReel(reel);
    loadReelComments(reel.id);
  };

  const deleteCommentTimerRef = useRef(null);

  const confirmDeleteReelComment = async () => {
    if (!pendingDeleteComment) return;
    const { reelId, comment } = pendingDeleteComment;
    setPendingDeleteComment(null);
    const { error } = await supabase.from('post_comments').delete().eq('id', comment.id);
    if (error) return alert(error.message);
    setReelComments((value) => ({ ...value, [reelId]: (value[reelId] || []).filter((c) => c.id !== comment.id) }));
    setReels((value) => value.map((item) => item.id === reelId ? { ...item, comments: Math.max(0, (Number(item.comments) || 0) - 1) } : item));
  };

  const startDeleteReelCommentPress = (comment) => {
    if (comment.user_id !== currentUser?.id) return;
    deleteCommentTimerRef.current = setTimeout(() => {
      setPendingDeleteComment({ reelId: commentsSheetReel.id, comment });
    }, 500);
  };

  const submitReelComment = async (event, reel) => {
    event.preventDefault();
    const content = (reelCommentDrafts[reel.id] || '').trim();
    if (!content) return;
    if (!currentUser) return alert('Please log in to comment.');

    const { data, error } = await supabase.from('post_comments').insert({
      post_id: reel.id, user_id: currentUser.id, username: currentUser.email?.split('@')[0] || 'User', content,
    }).select().single();

    if (error) return alert(error.message);
    setReelCommentDrafts((value) => ({ ...value, [reel.id]: '' }));
    setReelComments((value) => ({ ...value, [reel.id]: [...(value[reel.id] || []), { ...data, avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${currentUser.id}` }] }));
    setReels((value) => value.map((item) => item.id === reel.id ? { ...item, comments: (Number(item.comments) || 0) + 1 } : item));

    if (reel.user_id !== currentUser.id) {
      supabase.from('notifications').insert({ user_id: reel.user_id, sender_id: currentUser.id, post_id: reel.id, type: 'message', content: `commented: "${content}"` }).then();
    }
  };

  return (
    <div className="bg-black w-full h-[100dvh] overflow-y-scroll snap-y snap-mandatory [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] relative">
      
      <div className="absolute top-0 left-0 w-full p-4 flex justify-between items-center z-20 pointer-events-none">
        <h1 className="text-2xl font-black text-white drop-shadow-md tracking-tight">Reels</h1>
        <Camera className="w-7 h-7 text-white drop-shadow-md pointer-events-auto cursor-pointer" />
      </div>

      {loading ? (
        <div className="w-full h-full relative bg-black">
          <Skeleton className="w-full h-full rounded-none bg-gray-900" />
          <div className="absolute bottom-0 left-0 right-0 p-5 flex flex-col gap-3">
            <div className="flex items-center gap-3"><Skeleton className="w-10 h-10 rounded-full bg-gray-800" /><Skeleton className="w-28 h-4 bg-gray-800" /></div>
            <Skeleton className="w-64 h-3 bg-gray-800" />
            <Skeleton className="w-40 h-3 bg-gray-800" />
          </div>
        </div>
      ) : reels.length === 0 ? (
        <div className="w-full h-full flex flex-col justify-center items-center text-white">
          <span className="text-4xl mb-2">🎬</span>
          <p className="font-bold">No reels yet!</p>
        </div>
      ) : (
        reels.map((reel) => (
          <Reel 
            key={reel.id} 
            reel={reel} 
            onLikeToggle={handleLikeSync} 
            currentUser={currentUser}
            isFollowing={followedUsers[reel.user_id]}
            onFollowToggle={handleFollowToggle}
            onOpenComments={openReelComments}
          />
        ))
      )}

      {commentsSheetReel !== null && (
        <div className="fixed inset-0 z-[210] bg-black/60 flex items-end justify-center" onClick={() => setCommentsSheetReel(null)}>
          <div className="w-full max-w-lg bg-white rounded-t-3xl flex flex-col max-h-[80vh] animate-in slide-in-from-bottom-full duration-300" onClick={(event) => event.stopPropagation()}>
            <div className="px-5 pt-4 pb-3 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-black text-gray-900">{Number(commentsSheetReel.comments) || 0} comments</h3>
              <button onClick={() => setCommentsSheetReel(null)} className="p-1 active:scale-90 transition-transform" aria-label="Close comments"><X className="w-6 h-6 text-gray-500" /></button>
            </div>
            <div className="flex-1 overflow-y-auto px-5 py-3">
              {(reelComments[commentsSheetReel.id] || []).map((comment) => (
                <div key={comment.id} className="flex items-start gap-3 py-2.5 active:bg-gray-50 transition-colors"
                  onPointerDown={() => startDeleteReelCommentPress(comment)}
                  onPointerUp={() => clearTimeout(deleteCommentTimerRef.current)}
                  onPointerCancel={() => clearTimeout(deleteCommentTimerRef.current)}
                  onPointerLeave={() => clearTimeout(deleteCommentTimerRef.current)}
                >
                  <img src={comment.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${comment.user_id}`} alt="" className="h-9 w-9 rounded-full object-cover bg-gray-100" />
                  <div className="flex-1 min-w-0">
                    <span className="font-bold text-sm mr-1">{comment.username || 'User'}</span>
                    <span className="text-sm text-gray-800 break-words">{comment.content}</span>
                  </div>
                </div>
              ))}
              {(reelComments[commentsSheetReel.id] || []).length === 0 && <p className="py-8 text-center text-gray-400 font-bold">No comments yet</p>}
            </div>
            <div className="border-t border-gray-100 px-4 py-3">
              <form onSubmit={(event) => submitReelComment(event, commentsSheetReel)} className="flex items-center gap-2">
                <input value={reelCommentDrafts[commentsSheetReel.id] || ''} onChange={(event) => setReelCommentDrafts((value) => ({ ...value, [commentsSheetReel.id]: event.target.value }))} maxLength={1000} placeholder="Add a comment..." autoFocus className="flex-1 rounded-full bg-gray-100 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-yellow-400" />
                <button type="submit" className="font-bold text-sm text-blue-600 disabled:text-gray-400" disabled={!reelCommentDrafts[commentsSheetReel.id]?.trim()}>Post</button>
              </form>
            </div>
          </div>
        </div>
      )}

      {pendingDeleteComment && (
        <div className="fixed inset-0 z-[400] bg-black/50 flex items-center justify-center p-6" onClick={() => setPendingDeleteComment(null)}>
          <div className="w-full max-w-xs bg-white rounded-2xl overflow-hidden shadow-2xl animate-in zoom-in duration-200" onClick={(event) => event.stopPropagation()}>
            <p className="px-5 pt-5 pb-3 text-center font-bold text-gray-900">Delete this comment?</p>
            <button onClick={confirmDeleteReelComment} className="w-full border-t border-gray-100 py-3 font-bold text-red-500 active:bg-red-50">Delete</button>
            <button onClick={() => setPendingDeleteComment(null)} className="w-full border-t border-gray-100 py-3 font-bold text-gray-900 active:bg-gray-50">Cancel</button>
          </div>
        </div>
      )}
      
    </div>
  );
}