import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, MessageCircle, Send, Bookmark, Bell, MoreHorizontal, Loader2, Upload, X, Type, Smile, Wand2, Music, AtSign, Users, Trash2, ZoomIn, ZoomOut, Download, ChevronRight } from 'lucide-react';
import { supabase } from '../supabase'; 
import { setPendingReelItem } from '../pendingReel';
import StoryViewer from "../components/StoryViewer";
import Skeleton from "../components/Skeleton";
import MusicPicker from "../components/MusicPicker";

const dummyPosts = [
  {
    id: 'dummy_1',
    user_id: 'dummy_user_1',
    username: 'photography_lover',
    user_profile_pic: 'https://api.dicebear.com/7.x/avataaars/svg?seed=photoLover',
    media_url: 'https://images.unsplash.com/photo-1682687220742-aba13b6e50ba?w=800&q=80', 
    likes: 342,
    comments: 2,
    commentsList: [],
    caption: 'Loving this new YellowGram vibe! ✨💛',
    type: 'post',
    created_at: new Date().toISOString()
  }
];

const DraggableItem = ({ item, updateItem, removeItem }) => {
  const [pos, setPos] = useState({ x: window.innerWidth / 2 - 50, y: window.innerHeight / 2 - 100 });
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef(null);

  const handlePointerDown = (e) => { setIsDragging(true); e.target.setPointerCapture(e.pointerId); };
  const handlePointerMove = (e) => { if (!isDragging) return; setPos(prev => ({ x: prev.x + e.movementX, y: prev.y + e.movementY })); };
  const handlePointerUp = (e) => { setIsDragging(false); e.target.releasePointerCapture(e.pointerId); };

  return (
    <div className="absolute flex flex-col items-center group touch-none" style={{ left: pos.x, top: pos.y, transform: `scale(${item.scale})`, cursor: isDragging ? 'grabbing' : 'grab', zIndex: 50 }}>
      <div className="flex gap-2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity bg-black/70 rounded-full px-3 py-1.5 backdrop-blur-md border border-white/10 shadow-lg">
        <button onClick={(e) => { e.stopPropagation(); updateItem(item.id, item.scale + 0.2); }} className="text-white hover:text-green-400 p-1 active:scale-90 transition-transform"><ZoomIn className="w-5 h-5" /></button>
        <button onClick={(e) => { e.stopPropagation(); updateItem(item.id, Math.max(0.5, item.scale - 0.2)); }} className="text-white hover:text-yellow-400 p-1 active:scale-90 transition-transform border-l border-white/20 pl-3 ml-1"><ZoomOut className="w-5 h-5" /></button>
        <button onClick={(e) => { e.stopPropagation(); removeItem(item.id); }} className="text-red-400 hover:text-red-500 p-1 border-l border-white/20 pl-3 ml-1 active:scale-90 transition-transform"><Trash2 className="w-5 h-5" /></button>
      </div>
      <div ref={dragRef} onPointerDown={handlePointerDown} onPointerMove={handlePointerMove} onPointerUp={handlePointerUp} onPointerCancel={handlePointerUp} className={`font-black drop-shadow-2xl select-none transition-transform duration-100 ${isDragging ? 'scale-105' : 'scale-100'} ${item.type === 'text' ? 'text-white text-3xl px-4 py-2 bg-black/30 rounded-2xl border-2 border-dashed border-transparent group-hover:border-white/50' : 'text-6xl'}`}>
        {item.content}
      </div>
    </div>
  );
};

const POSTS_PER_PAGE = 20;
const REELS_DENSITY = 0.2;
const REELS_IN_FEED_PAGE = 10;

const FeedImage = ({ src, alt, className }) => {
  const [loaded, setLoaded] = useState(false);
  return (
    <div className={`relative overflow-hidden bg-gray-100 ${className}`}>
      <img
        src={src}
        alt={alt || ''}
        loading="lazy"
        onLoad={() => setLoaded(true)}
        className={`w-full h-full object-cover transition-opacity duration-500 ease-out ${loaded ? 'opacity-100' : 'opacity-0'}`}
      />
    </div>
  );
};

const FeedReelCard = ({ reel, currentUser, isLiked, isFollowing, onLikeToggle, onOpenComments, onNavigate, onFollowToggle, onShare, onOpenPlayer }) => {
  const videoRef = useRef(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          video.play().catch(() => {});
        } else {
          video.pause();
        }
      });
    }, { threshold: 0.6 });
    observer.observe(video);
    return () => observer.disconnect();
  }, []);

  return (
    <article className="bg-white border-b border-gray-200 mb-2 w-full">
      <header className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3 min-w-0 cursor-pointer active:opacity-70 transition-opacity" onClick={() => onNavigate(reel.user_id)}>
          <img
            src={reel.users?.profile_pic || `https://api.dicebear.com/7.x/avataaars/svg?seed=${reel.user_id}`}
            alt=""
            className="h-10 w-10 rounded-lg object-cover bg-gray-100"
          />
          <span className="font-bold mr-1 cursor-pointer hover:underline">{reel.users?.username || reel.username || 'User'}</span>
          {reel.user_id !== currentUser?.id && (
            <button
              onClick={(e) => { e.stopPropagation(); onFollowToggle(reel.user_id); }}
              className={`ml-1 px-3 py-1 rounded-lg text-[12px] font-bold transition-all active:scale-95 flex-shrink-0 ${
                isFollowing ? 'bg-gray-100 text-gray-500' : 'bg-gray-900 text-yellow-400'
              }`}
            >
              {isFollowing ? 'Following' : 'Follow'}
            </button>
          )}
        </div>
        <button type="button" className="p-1 text-gray-700" aria-label="Reel options">
          <MoreHorizontal className="h-5 w-5" />
        </button>
      </header>

      <div className="relative w-full aspect-[9/16] bg-black flex items-center justify-center cursor-pointer" onClick={() => onOpenPlayer(reel)}>
        <video ref={videoRef} src={reel.media_url} loop muted playsInline preload="metadata" className="w-full h-full object-cover" />
      </div>

      <div className="px-4 pt-3 pb-4">
        <div className="flex items-center gap-4 mb-3">
          <button type="button" onClick={() => onLikeToggle(reel)} className={`flex items-center gap-1.5 ${isLiked ? 'text-red-500' : 'text-gray-900'}`} aria-label="Like reel">
            <Heart className="h-6 w-6" fill={isLiked ? 'currentColor' : 'none'} />
            <span className="text-sm font-bold">{Number(reel.likes) || 0}</span>
          </button>
          <button type="button" onClick={() => onOpenComments(reel)} className="flex items-center gap-1.5 text-gray-900" aria-label="Comment on reel">
            <MessageCircle className="h-6 w-6" />
            <span className="text-sm font-bold">{Number(reel.comments) || 0}</span>
          </button>
          <button type="button" onClick={() => onShare(reel)} className="flex items-center gap-1.5 text-gray-900" aria-label="Share reel">
            <Send className="h-6 w-6" />
          </button>
        </div>
        {reel.caption && (
          <p className="text-sm break-words">
            <span className="font-bold mr-1 cursor-pointer hover:underline" onClick={() => onNavigate(reel.user_id)}>{reel.users?.username || reel.username || 'User'}</span>
            {reel.caption}
          </p>
        )}
      </div>
    </article>
  );
};

export default function HomeFeed() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [myProfilePic, setMyProfilePic] = useState('');
  const [posts, setPosts] = useState([]);
  const [reels, setReels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hasMorePosts, setHasMorePosts] = useState(true);
  const feedOffsetRef = useRef(0);
  const reelsOffsetRef = useRef(0);
  const reelSlotsRef = useRef([]);
  const feedSentinelRef = useRef(null);
  const [feedError, setFeedError] = useState('');
  const [followedUsers, setFollowedUsers] = useState({});
  const [likedPosts, setLikedPosts] = useState({});
  const [savedPosts, setSavedPosts] = useState({}); // 🔥 SAVED POSTS STATE
  const [commentsSheetPost, setCommentsSheetPost] = useState(null);
  const [commentsByPost, setCommentsByPost] = useState({});
  const [pendingDeleteComment, setPendingDeleteComment] = useState(null);
  const [commentDrafts, setCommentDrafts] = useState({});
  
  const [unreadChatCount, setUnreadChatCount] = useState(0);
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);

  const [groupedStoriesList, setGroupedStoriesList] = useState([]);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [selectedUserIndex, setSelectedUserIndex] = useState(0);
  const [viewedStoryIds, setViewedStoryIds] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('yellowgram_viewed_story_ids') || '{}');
    } catch {
      return {};
    }
  });

  const [editorOpen, setEditorOpen] = useState(false);
  const [editingFile, setEditingFile] = useState(null);
  const [mediaPreviewUrl, setMediaPreviewUrl] = useState('');
  const [uploadingStory, setUploadingStory] = useState(false);
  
  const [overlays, setOverlays] = useState([]); 
  const [activeFilter, setActiveFilter] = useState('none');
  const [music, setMusic] = useState('');
  const [musicUrl, setMusicUrl] = useState('');
  const [musicStart, setMusicStart] = useState(0);
  const [musicDuration, setMusicDuration] = useState(30);
  const [isCloseFriends, setIsCloseFriends] = useState(false);
  
  const [showTextMenu, setShowTextMenu] = useState(false);
  const [textInput, setTextInput] = useState('');
  const [showStickerMenu, setShowStickerMenu] = useState(false);
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [showMusicPicker, setShowMusicPicker] = useState(false);

  const fileInputRef = useRef(null);
  const deleteCommentTimerRef = useRef(null);
  
  const handleStoryViewed = useCallback((storyId) => {
    setViewedStoryIds((value) => {
      if (value[storyId]) return value;
      const nextValue = { ...value, [storyId]: true };
      localStorage.setItem('yellowgram_viewed_story_ids', JSON.stringify(nextValue));
      return nextValue;
    });
  }, []);

  useEffect(() => {
    const initializeFeed = async () => {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);

      let followingDict = {};
      if (user) {
        const { data: profileRow } = await supabase.from('users').select('profile_pic').eq('id', user.id).maybeSingle();
        setMyProfilePic(profileRow?.profile_pic || '');
        const { data: myData } = await supabase.from('users').select('following').eq('id', user.id).single();
        if (myData?.following) {
          myData.following.forEach(id => { followingDict[id] = true; });
          setFollowedUsers(followingDict);
        }
      }
      await fetchStories(user, followingDict);
      await fetchPosts(user);
    };
    initializeFeed();
  }, []);

  useEffect(() => {
    const sentinel = feedSentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && hasMorePosts && !loading) {
        fetchPosts(currentUser, true);
      }
    }, { rootMargin: '400px' });
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMorePosts, loading, currentUser]);

  useEffect(() => {
    if (!currentUser?.id) return;
    const fetchUnreadCount = async () => {
      const { data, error } = await supabase.from('messages').select('sender_id').eq('receiver_id', currentUser.id).eq('is_read', false); 
      if (!error && data) {
        const uniqueSenders = new Set(data.map(msg => msg.sender_id));
        setUnreadChatCount(uniqueSenders.size);
      }
    };
    fetchUnreadCount();
    const messageSubscription = supabase.channel('public:messages:feed').on('postgres_changes', { event: '*', schema: 'public', table: 'messages', filter: `receiver_id=eq.${currentUser.id}` }, payload => { fetchUnreadCount(); }).subscribe();
    return () => supabase.removeChannel(messageSubscription);
  }, [currentUser]);

  useEffect(() => {
    if (!currentUser?.id) return;
    const fetchUnreadNotifications = async () => {
      const { count, error } = await supabase.from('notifications').select('*', { count: 'exact', head: true }).eq('user_id', currentUser.id).eq('is_read', false);
      if (!error) setUnreadNotificationCount(count || 0);
    };
    fetchUnreadNotifications();
    const notifSubscription = supabase.channel('public:notifications').on('postgres_changes', { event: '*', schema: 'public', table: 'notifications', filter: `user_id=eq.${currentUser.id}` }, () => { fetchUnreadNotifications(); }).subscribe();
    return () => supabase.removeChannel(notifSubscription);
  }, [currentUser]);

  const fetchStories = async (userObj, followingDict) => {
    try {
      const yesterday = new Date();
      yesterday.setHours(yesterday.getHours() - 24);
      const followingIds = Object.keys(followingDict || {});
      const allowedUserIds = userObj ? [...followingIds, userObj.id] : followingIds;

      if (allowedUserIds.length > 0) {
        const { data, error } = await supabase
          .from('stories')
          .select(`*, users:user_id ( username, profile_pic )`)
          .in('user_id', allowedUserIds)
          .gte('created_at', yesterday.toISOString())
          .order('created_at', { ascending: false });

        if (!error && data) {
          const groupsMap = {};
          data.forEach(story => {
            const uid = story.user_id;
            if (!groupsMap[uid]) groupsMap[uid] = { user_id: uid, user: story.users, items: [] };
            groupsMap[uid].items.unshift(story); 
          });
          setGroupedStoriesList(Object.values(groupsMap));
        }
      }
    } catch (err) { console.error("Error fetching stories:", err); }
  };

  const fetchReels = async () => {
    try {
      const start = reelsOffsetRef.current;
      const { data, error } = await supabase
        .from('ranked_reels')
        .select('*')
        .order('rank_score', { ascending: false })
        .range(start, start + REELS_IN_FEED_PAGE - 1);
      if (error) throw error;
      const loadedReels = data || [];
      reelsOffsetRef.current = start + loadedReels.length;

      const userIds = [...new Set(loadedReels.map((reel) => reel.user_id).filter(Boolean))];
      const { data: userRows } = userIds.length
        ? await supabase.from('users').select('id, username, profile_pic').in('id', userIds)
        : { data: [] };
      const userMap = Object.fromEntries((userRows || []).map((u) => [u.id, u]));

      setReels((prev) => [...prev, ...loadedReels.map((reel) => ({ ...reel, users: userMap[reel.user_id] }))]);
    } catch (err) {
      console.error('Could not load reels:', err);
    }
  };

  const fetchPosts = async (viewer = currentUser, loadMore = false) => {
    try {
      setFeedError('');
      const start = loadMore ? feedOffsetRef.current : 0;
      const { data, error } = await supabase
        .from('ranked_posts')
        .select('*')
        .order('rank_score', { ascending: false })
        .range(start, start + POSTS_PER_PAGE - 1);
      if (error) throw error;
      const loadedPosts = data || [];
      feedOffsetRef.current = start + loadedPosts.length;
      setHasMorePosts(loadedPosts.length === POSTS_PER_PAGE);

      const userIds = [...new Set(loadedPosts.map((post) => post.user_id).filter(Boolean))];
      const { data: userRows } = userIds.length
        ? await supabase.from('users').select('id, username, profile_pic').in('id', userIds)
        : { data: [] };
      const userMap = Object.fromEntries((userRows || []).map((u) => [u.id, u]));

      const newPosts = loadedPosts.map((post) => ({ ...post, users: userMap[post.user_id], commentsList: [] }));
      setPosts((prev) => (loadMore ? [...prev, ...newPosts] : newPosts));
      if (!loadMore) reelSlotsRef.current = [];

      if (viewer && loadedPosts.length > 0) {
        const postIds = loadedPosts.map((post) => post.id);

        const { data: myLikes } = await supabase.from('post_likes').select('post_id').eq('user_id', viewer.id).in('post_id', postIds);
        setLikedPosts((prev) => ({ ...prev, ...Object.fromEntries((myLikes || []).map((like) => [like.post_id, true])) }));

        const { data: mySaves } = await supabase.from('saved_posts').select('post_id').eq('user_id', viewer.id).in('post_id', postIds);
        setSavedPosts((prev) => ({ ...prev, ...Object.fromEntries((mySaves || []).map((save) => [save.post_id, true])) }));
      }

      const reelsNeeded = Math.ceil(feedOffsetRef.current * REELS_DENSITY) + 2;
      if (reels.length < reelsNeeded) await fetchReels();
    } catch (error) {
      console.error('Could not load posts:', error);
      if (!loadMore) {
        setPosts([]);
        setFeedError(error.message || 'Posts could not be loaded.');
      }
    } finally {
      setLoading(false);
    }
  };

  const toggleLike = async (post) => {
    if (!currentUser) return alert('Please log in to like posts.');
    const wasLiked = Boolean(likedPosts[post.id]);
    const previousLikes = Number(post.likes) || 0;

    setLikedPosts((value) => ({ ...value, [post.id]: !wasLiked }));
    setPosts((value) => value.map((item) => item.id === post.id ? { ...item, likes: Math.max(0, previousLikes + (wasLiked ? -1 : 1)) } : item));
    setReels((value) => value.map((item) => item.id === post.id ? { ...item, likes: Math.max(0, previousLikes + (wasLiked ? -1 : 1)) } : item));

    const request = wasLiked
      ? supabase.from('post_likes').delete().eq('post_id', post.id).eq('user_id', currentUser.id)
      : supabase.from('post_likes').insert({ post_id: post.id, user_id: currentUser.id });
    const { error } = await request;

    if (error) {
      setLikedPosts((value) => ({ ...value, [post.id]: wasLiked }));
      setPosts((value) => value.map((item) => item.id === post.id ? { ...item, likes: previousLikes } : item));
      setReels((value) => value.map((item) => item.id === post.id ? { ...item, likes: previousLikes } : item));
      alert(error.message);
    } else if (!wasLiked && post.user_id !== currentUser.id) {
      supabase.from('notifications').insert({ user_id: post.user_id, sender_id: currentUser.id, post_id: post.id, type: 'like', content: 'liked your post.' }).then();
    }
  };

  // 🔥 TOGGLE SAVE FUNCTION 🔥
  const toggleSave = async (post) => {
    if (!currentUser) return alert('Please log in to save posts.');
    const wasSaved = Boolean(savedPosts[post.id]);
    
    // UI को तुरंत अपडेट करें
    setSavedPosts(prev => ({ ...prev, [post.id]: !wasSaved }));

    // डेटाबेस में अपडेट करें
    if (wasSaved) {
      await supabase.from('saved_posts').delete().eq('post_id', post.id).eq('user_id', currentUser.id);
    } else {
      await supabase.from('saved_posts').insert({ post_id: post.id, user_id: currentUser.id });
    }
  };

  // 🔥 SHARE POST: copy link + count badhao 🔥
  const handleShare = async (post) => {
    if (!currentUser) return alert('Please log in to share posts.');
    if (navigator.clipboard) {
      try { await navigator.clipboard.writeText(post.media_url); } catch (err) { console.error(err); }
    }
    const nextShares = (Number(post.shares) || 0) + 1;
    setPosts((value) => value.map((item) => item.id === post.id ? { ...item, shares: nextShares } : item));
    try {
      await supabase.from('posts').update({ shares: nextShares }).eq('id', post.id);
    } catch (err) {
      console.error('Could not increment share count:', err);
    }
  };

  // 🔥 TOGGLE FOLLOW FUNCTION 🔥
  const toggleFollow = async (targetUserId) => {
    if (!currentUser) return alert('Please log in to follow users.');
    if (String(targetUserId).startsWith('dummy')) {
      setFollowedUsers(prev => ({ ...prev, [targetUserId]: !prev[targetUserId] }));
      return;
    }

    const isFollowing = Boolean(followedUsers[targetUserId]);
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
        supabase.from('notifications').insert({ user_id: targetUserId, sender_id: currentUser.id, type: 'follow', content: 'started following you.' }).then();
      }

      await supabase.from('users').update({ following: myFollowing }).eq('id', currentUser.id);
      await supabase.from('users').update({ followers: targetFollowers }).eq('id', targetUserId);
    } catch (error) {
      console.error('Error following user:', error);
      setFollowedUsers(prev => ({ ...prev, [targetUserId]: isFollowing }));
    }
  };

  const loadComments = async (postId) => {
    const { data, error } = await supabase.from('post_comments').select('*').eq('post_id', postId).order('created_at', { ascending: true });
    if (error) return alert(error.message);
    const comments = data || [];
    const userIds = [...new Set(comments.map((comment) => comment.user_id).filter(Boolean))];
    const { data: userRows } = userIds.length
      ? await supabase.from('users').select('id, profile_pic').in('id', userIds)
      : { data: [] };
    const picMap = Object.fromEntries((userRows || []).map((user) => [user.id, user.profile_pic]));
    setCommentsByPost((value) => ({ ...value, [postId]: comments.map((comment) => ({ ...comment, avatar: picMap[comment.user_id] })) }));
  };

  const openCommentSheet = (post) => {
    setCommentsSheetPost(post);
    loadComments(post.id);
  };

  const confirmDeleteComment = async () => {
    if (!pendingDeleteComment) return;
    const { postId, comment } = pendingDeleteComment;
    setPendingDeleteComment(null);
    const { data: deletedRows, error } = await supabase.from('post_comments').delete().eq('id', comment.id).select('id');
    if (error || !deletedRows || deletedRows.length === 0) {
      console.error('Delete comment failed:', error);
      alert('Delete failed: ' + (error?.message || 'comment DB me delete nahi hua (RLS blocked, 0 rows)'));
      return;
    }
    setCommentsByPost((value) => ({ ...value, [postId]: (value[postId] || []).filter((c) => c.id !== comment.id) }));
    setPosts((value) => value.map((item) => item.id === postId ? { ...item, comments: Math.max(0, (Number(item.comments) || 0) - 1) } : item));
  };

  const startDeleteCommentPress = (comment) => {
    if (comment.user_id !== currentUser?.id) return;
    deleteCommentTimerRef.current = setTimeout(() => {
      setPendingDeleteComment({ postId: commentsSheetPost.id, comment });
    }, 500);
  };

  const submitComment = async (event, post) => {
    event.preventDefault();
    const content = (commentDrafts[post.id] || '').trim();
    if (!content) return;
    if (!currentUser) return alert('Please log in to comment.');
    const { data: me } = await supabase.from('users').select('username, profile_pic').eq('id', currentUser.id).maybeSingle();
    const username = me?.username || currentUser.email?.split('@')[0] || 'User';

    const { data, error } = await supabase.from('post_comments').insert({
      post_id: post.id, user_id: currentUser.id, username, content,
    }).select().single();

    if (error) return alert(error.message);
    setCommentDrafts((value) => ({ ...value, [post.id]: '' }));
    setCommentsByPost((value) => ({ ...value, [post.id]: [...(value[post.id] || []), { ...data, avatar: me?.profile_pic }] }));
    setPosts((value) => value.map((item) => item.id === post.id ? { ...item, comments: (Number(item.comments) || 0) + 1 } : item));
      
    if (post.user_id !== currentUser.id) {
      supabase.from('notifications').insert({ user_id: post.user_id, sender_id: currentUser.id, post_id: post.id, type: 'message', content: `commented: "${content}"` }).then();
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setEditingFile(file); setMediaPreviewUrl(URL.createObjectURL(file));
    setOverlays([]); setActiveFilter('none'); setMusic(''); setMusicUrl(''); setMusicStart(0); setMusicDuration(30); setIsCloseFriends(false);
    setEditorOpen(true);
  };

  const addOverlay = (type, content) => setOverlays([...overlays, { id: Date.now().toString(), type, content, scale: 1 }]);
  const updateOverlayScale = (id, newScale) => setOverlays(overlays.map(o => o.id === id ? { ...o, scale: newScale } : o));
  const removeOverlay = (id) => setOverlays(overlays.filter(o => o.id !== id));

  const handleFinalUpload = async () => {
    if (!editingFile || !currentUser) return;
    const currentUserId = currentUser.id || currentUser.uid;
    setUploadingStory(true);
    try {
      const fileExt = editingFile.name.split('.').pop();
      const fileName = `stories/${currentUserId}_${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from('yellowgram_uploads').upload(fileName, editingFile);
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from('yellowgram_uploads').getPublicUrl(fileName);
      const storyDurationMs = musicUrl ? Math.max(1000, (musicDuration || 30) * 1000) : null;
      const { error: dbError } = await supabase.from('stories').insert({
        user_id: currentUserId, media_url: urlData.publicUrl, filter: activeFilter, music: music, music_url: musicUrl || null, music_start: musicStart || 0, duration_ms: storyDurationMs, is_close_friends: isCloseFriends
      });
      if (dbError) throw dbError;
      await fetchStories(currentUser, followedUsers);
      setEditorOpen(false); 
    } catch (error) { alert("Story अपलोड करने में दिक्कत आई!"); } finally { setUploadingStory(false); }
  };

  const closeEditor = () => {
    if(window.confirm("Discard your story edits?")) { setEditorOpen(false); setEditingFile(null); setMediaPreviewUrl(''); }
  };

  const openReelsPlayer = (post) => {
    setPendingReelItem(post);
    navigate('/reels');
  };

  const myStoryGroup = groupedStoriesList.find(g => g.user_id === currentUser?.id);
  const displayStoryGroups = groupedStoriesList.filter(g => g.user_id !== currentUser?.id);

  const ensureReelSlots = (count) => {
    const slots = reelSlotsRef.current;
    while (slots.length < count) {
      slots.push(slots.length > 0 && Math.random() < REELS_DENSITY);
    }
  };

  ensureReelSlots(posts.length);
  const feedItems = [];
  let reelIndex = 0;
  posts.forEach((post, index) => {
    if (index > 0 && reelSlotsRef.current[index] && reelIndex < reels.length) {
      feedItems.push({ kind: 'reel', reel: reels[reelIndex++] });
    }
    feedItems.push({ kind: 'post', post });
  });

  return (
    <div className="w-full bg-gray-50 min-h-screen pb-24 relative">
      <div className="bg-white p-4 sticky top-0 z-20 shadow-sm border-b border-gray-100 flex justify-between items-center rounded-b-[20px]">
        <h1 className="text-2xl font-black text-gray-900 italic tracking-tight">YellowGram</h1>
        <div className="flex items-center gap-3">
          <div className="relative">
            <button onClick={() => navigate('/notifications')} className="rounded-full p-2 text-gray-900 hover:bg-gray-100 active:scale-90 transition-transform">
              <Bell className="h-6 w-6" />
            </button>
            {unreadNotificationCount > 0 && (
              <span className="absolute top-1 right-1 bg-red-500 text-white text-[11px] font-black w-[18px] h-[18px] flex items-center justify-center rounded-full border-2 border-white shadow-sm animate-in zoom-in duration-200">
                {unreadNotificationCount > 9 ? '9+' : unreadNotificationCount}
              </span>
            )}
          </div>
          <div className="relative">
            <button onClick={() => navigate('/messages')} className="rounded-full p-2 text-gray-900 hover:bg-gray-100 active:scale-90 transition-transform">
              <Send className="h-6 w-6" />
            </button>
            {unreadChatCount > 0 && (
              <span className="absolute top-1 right-1 bg-red-500 text-white text-[11px] font-black w-[18px] h-[18px] flex items-center justify-center rounded-full border-2 border-white shadow-sm animate-in zoom-in duration-200">
                {unreadChatCount > 9 ? '9+' : unreadChatCount}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white pt-4 pb-3 px-3 border-b border-gray-200 flex gap-4 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div className="flex flex-col items-center gap-1 cursor-pointer flex-shrink-0 group" onClick={(e) => {
          if (e.target.closest('button') || e.target.closest('label')) return;
          if (myStoryGroup) {
            const idx = groupedStoriesList.findIndex(g => g.user_id === currentUser?.id);
            setSelectedUserIndex(idx);
            setViewerOpen(true);
          } else {
            fileInputRef.current?.click();
          }
        }}>
            <div className={`w-[75px] h-[75px] rounded-2xl border-[3px] p-[2px] bg-white group-hover:scale-95 transition-transform ${myStoryGroup ? (myStoryGroup.items.every((story) => viewedStoryIds[story.id]) ? 'border-gray-300' : 'border-yellow-400') : 'border-transparent'}`}>
            <div className="relative w-full h-full">
              <img src={myProfilePic || `https://api.dicebear.com/7.x/avataaars/svg?seed=${currentUser?.id || 'currentUser'}`} alt="Your Story" className="w-full h-full rounded-[12px] object-cover bg-gray-100" />
              {uploadingStory && (
                <div className="absolute -inset-[6px] rounded-2xl pointer-events-none animate-spin"
                  style={{ background: 'conic-gradient(from 270deg, transparent 0deg, rgba(250,204,21,1) 80deg, transparent 160deg)', animationDuration: '1.2s' }} />
              )}
              <label onClick={(e) => e.stopPropagation()} className="absolute -bottom-2 -right-2 bg-yellow-400 rounded-lg w-7 h-7 border-2 border-white shadow-sm active:scale-90 transition-transform cursor-pointer flex items-center justify-center" aria-label="Add story">
                {uploadingStory ? <Loader2 className="w-3.5 h-3.5 text-gray-900 animate-spin" /> : <Upload className="w-3.5 h-3.5 text-gray-900" strokeWidth={3} />}
                <input type="file" accept="image/*,video/*" onChange={handleFileSelect} className="hidden" />
              </label>
            </div>
          </div>
          <span className="text-[12px] font-bold text-gray-500 mt-1">Your story</span>
        </div>
        <input type="file" ref={fileInputRef} accept="image/*,video/*" onChange={handleFileSelect} onClick={(e) => e.stopPropagation()} className="hidden" />

        {displayStoryGroups.map((group, i) => (
          <div key={group.user_id || i} onClick={() => { setSelectedUserIndex(i); setViewerOpen(true); }} className="flex flex-col items-center gap-1 cursor-pointer flex-shrink-0 group">
            <div className={`w-[75px] h-[75px] rounded-2xl border-[3px] p-[2px] bg-white group-hover:scale-95 transition-transform ${group.items.every((story) => viewedStoryIds[story.id]) ? 'border-gray-300' : 'border-yellow-400'}`}>
              <img src={group.user?.profile_pic || `https://api.dicebear.com/7.x/avataaars/svg?seed=${group.user?.username || i}`} alt="Story" className="w-full h-full rounded-[12px] object-cover bg-gray-100" />
            </div>
            <span className="text-[12px] font-bold text-gray-800 mt-1 truncate w-[75px] text-center">{group.user?.username || `User_${i+1}`}</span>
          </div>
        ))}
      </div>

      {editorOpen && mediaPreviewUrl && (
        <div className="fixed inset-0 z-[200] bg-[#121212] flex flex-col animate-in slide-in-from-bottom-full duration-300 font-sans">
          <div className="flex justify-between items-center px-4 py-5 z-20 absolute top-0 w-full bg-gradient-to-b from-black/80 via-black/30 to-transparent">
            <button onClick={closeEditor} className="text-white drop-shadow-lg active:scale-90 transition-transform"><X className="w-8 h-8" strokeWidth={2} /></button>
            <div className="flex items-center gap-5">
              <button onClick={() => setShowTextMenu(true)} className="text-white drop-shadow-lg hover:text-gray-300 active:scale-90 transition-transform"><Type className="w-7 h-7" strokeWidth={2.5}/></button>
              <button onClick={() => setShowStickerMenu(!showStickerMenu)} className="text-white drop-shadow-lg hover:text-gray-300 active:scale-90 transition-transform"><Smile className="w-7 h-7" strokeWidth={2.5}/></button>
              <button onClick={() => setShowFilterMenu(!showFilterMenu)} className="text-white drop-shadow-lg hover:text-gray-300 active:scale-90 transition-transform"><Wand2 className="w-7 h-7" strokeWidth={2.5}/></button>
              <button onClick={() => setShowMusicPicker(true)} className={`drop-shadow-lg active:scale-90 transition-transform ${music ? 'text-yellow-400' : 'text-white hover:text-gray-300'}`}><Music className="w-7 h-7" strokeWidth={2.5}/></button>
              <button onClick={() => alert("Save to gallery feature coming soon!")} className="text-white drop-shadow-lg hover:text-gray-300 active:scale-90 transition-transform"><Download className="w-7 h-7" strokeWidth={2.5}/></button>
            </div>
          </div>

          {showTextMenu && (
            <div className="absolute inset-0 bg-black/85 z-50 flex flex-col items-center justify-center p-4 backdrop-blur-md animate-in fade-in duration-200">
              <input autoFocus type="text" value={textInput} onChange={e => setTextInput(e.target.value)} className="bg-transparent text-white text-5xl font-black text-center outline-none border-b-2 border-white/50 focus:border-white pb-2 w-full max-w-[80%] transition-colors" placeholder="Type here..." />
              <div className="flex gap-4 mt-8">
                <button onClick={() => { setTextInput(''); setShowTextMenu(false); }} className="text-white/60 font-bold px-6 py-3 rounded-full hover:bg-white/10 transition-colors">Cancel</button>
                <button onClick={() => { if(textInput.trim()) addOverlay('text', textInput); setTextInput(''); setShowTextMenu(false); }} className="bg-white text-black px-8 py-3 rounded-full font-black text-xl active:scale-95 shadow-lg">Done</button>
              </div>
            </div>
          )}

          <div className="flex-1 relative overflow-hidden bg-[#121212] flex items-center justify-center rounded-[30px] mt-2 mb-20">
            <img src={mediaPreviewUrl} alt="Preview" className="w-full h-full object-cover rounded-[30px] shadow-2xl" style={{ filter: activeFilter !== 'none' ? activeFilter : 'none' }} />
            {overlays.map(item => <DraggableItem key={item.id} item={item} updateItem={updateOverlayScale} removeItem={removeOverlay} />)}
            {music && (
              <div className="absolute top-28 flex items-center gap-2 bg-black/50 backdrop-blur-md px-4 py-2.5 rounded-xl text-white font-bold text-sm border border-white/20 animate-in fade-in slide-in-from-top-4 shadow-lg">
                <Music className="w-4 h-4 text-white animate-pulse" /> {music}
                <button onClick={() => setMusic('')} className="ml-2 text-white/50 hover:text-white"><X className="w-3 h-3" /></button>
              </div>
            )}
          </div>

          {showFilterMenu && (
            <div className="absolute bottom-24 w-full bg-gradient-to-t from-black/90 to-transparent pt-10 pb-4 px-4 flex gap-4 overflow-x-auto z-30 animate-in slide-in-from-bottom-4">
              {['none', 'grayscale(100%)', 'sepia(80%)', 'saturate(200%)', 'hue-rotate(90deg)', 'invert(100%)'].map((f, i) => (
                <button key={i} onClick={() => setActiveFilter(f)} className={`w-16 h-20 rounded-2xl flex-shrink-0 border-2 overflow-hidden transition-all ${activeFilter === f ? 'border-white scale-110 shadow-[0_0_15px_rgba(255,255,255,0.3)]' : 'border-white/20 opacity-70 hover:opacity-100'}`}>
                  <img src={mediaPreviewUrl} style={{ filter: f }} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}

          {showStickerMenu && (
            <div className="absolute bottom-24 w-full bg-gradient-to-t from-black/90 to-transparent pt-10 pb-4 px-4 flex gap-6 overflow-x-auto z-30 animate-in slide-in-from-bottom-4 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {['📍', '🔥', '💛', '😂', '💯', '🚀', '✨', '🎉', '😍', '👀', '😎', '🎵', '🏆', '🙌', '💔', '👑'].map((emoji, i) => (
                <button key={i} onClick={() => { addOverlay('sticker', emoji); setShowStickerMenu(false); }} className="text-5xl hover:scale-125 transition-transform active:scale-90 flex-shrink-0 drop-shadow-lg">{emoji}</button>
              ))}
            </div>
          )}

          {showMusicPicker && (
            <MusicPicker onClose={() => setShowMusicPicker(false)} onSelect={(song) => { setMusic(song.name); setMusicUrl(song.url || ''); setMusicStart(song.start || 0); setMusicDuration(song.duration || 30); setShowMusicPicker(false); }} />
          )}

          <div className="bg-black/80 backdrop-blur-xl py-4 px-5 z-20 flex items-center justify-between border-t border-white/10 absolute bottom-0 w-full rounded-t-[30px]">
            <div className="flex items-center gap-3 cursor-pointer group" onClick={handleFinalUpload}>
               <div className="w-10 h-10 rounded-full overflow-hidden border border-white/20 group-active:scale-95 transition-transform bg-gray-800">
                 <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=currentUser`} className="w-full h-full object-cover" />
               </div>
               <span className="text-white text-[15px] font-semibold tracking-tight group-hover:text-gray-300">Your Story</span>
            </div>
            <div className="flex items-center gap-2.5">
              <button onClick={() => setIsCloseFriends(!isCloseFriends)} className={`flex items-center gap-1.5 px-4 py-2.5 rounded-full text-[13px] font-bold transition-all active:scale-95 ${isCloseFriends ? 'bg-green-500 text-white shadow-[0_0_15px_rgba(34,197,94,0.4)]' : 'bg-[#262626] text-white hover:bg-[#333]'}`}>
                <Users className="w-4 h-4" /> {isCloseFriends ? 'Close Friends' : 'Close Friends'}
              </button>
              <button onClick={handleFinalUpload} disabled={uploadingStory} className="bg-blue-500 hover:bg-blue-600 text-white pl-5 pr-4 py-2.5 rounded-full flex items-center justify-center gap-1 font-bold text-[15px] active:scale-95 transition-all shadow-lg shadow-blue-500/30 disabled:opacity-50">
                {uploadingStory ? <Loader2 className="w-5 h-5 animate-spin mx-2" /> : <><ChevronRight className="w-6 h-6" strokeWidth={2.5}/></>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FEED UI */}
      <div className="flex flex-col w-full">
        {loading ? (
          <div className="px-3 pt-4 flex flex-col gap-4">
            <div className="flex gap-3 overflow-hidden">
              {[...Array(6)].map((_, i) => <Skeleton key={i} className="w-[70px] h-[86px] rounded-2xl flex-shrink-0" />)}
            </div>
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl overflow-hidden shadow-sm">
                <div className="flex items-center gap-3 px-4 py-3"><Skeleton className="w-10 h-10 rounded-lg" /><Skeleton className="w-32 h-4" /></div>
                <Skeleton className="w-full aspect-square rounded-none" />
                <div className="p-4 flex flex-col gap-2"><Skeleton className="w-16 h-4" /><Skeleton className="w-40 h-4" /></div>
              </div>
            ))}
          </div>
        ) : feedError ? (
          <div className="flex flex-col items-center justify-center py-20 px-6 text-center text-red-600"><p className="font-bold">Posts load नहीं हो पाए</p><p className="mt-1 text-sm">{feedError}</p></div>
        ) : posts.length === 0 && reels.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-500"><p className="font-bold">No posts yet!</p></div>
        ) : (
          feedItems.map((item) => {
            const post = item.post;
            return item.kind === 'reel' ? (
              <FeedReelCard
                key={item.reel.id}
                reel={item.reel}
                currentUser={currentUser}
                isLiked={Boolean(likedPosts[item.reel.id])}
                isFollowing={Boolean(followedUsers[item.reel.user_id])}
                onLikeToggle={toggleLike}
                onOpenComments={openCommentSheet}
                onNavigate={(uid) => navigate(`/profile/${uid}`)}
                onFollowToggle={toggleFollow}
                onShare={handleShare}
                onOpenPlayer={openReelsPlayer}
              />
            ) : (
            <article key={post.id} className="bg-white border-b border-gray-200 mb-2 w-full">
              <header className="flex items-center justify-between px-4 py-3">
                <div 
                  className="flex items-center gap-3 min-w-0 cursor-pointer active:opacity-70 transition-opacity"
                  onClick={() => navigate(`/profile/${post.user_id}`)} 
                >
                  <img
                    src={post.users?.profile_pic || post.user_profile_pic || `https://api.dicebear.com/7.x/avataaars/svg?seed=${post.user_id}`}
                    alt=""
                    className="h-10 w-10 rounded-lg object-cover bg-gray-100"
                  />
                  <span 
                    className="font-bold mr-1 cursor-pointer hover:underline"
                    onClick={(e) => { e.stopPropagation(); navigate(`/profile/${post.user_id}`); }}
                  >
                    {post.users?.username || post.username || 'User'}
                  </span>

                  {/* 🔥 POST FOLLOW BUTTON 🔥 */}
                  {post.user_id !== currentUser?.id && (
                    <button
                      onClick={(e) => { e.stopPropagation(); toggleFollow(post.user_id); }}
                      className={`ml-1 px-3 py-1 rounded-lg text-[12px] font-bold transition-all active:scale-95 flex-shrink-0 ${
                        followedUsers[post.user_id] ? 'bg-gray-100 text-gray-500' : 'bg-gray-900 text-yellow-400'
                      }`}
                    >
                      {followedUsers[post.user_id] ? 'Following' : 'Follow'}
                    </button>
                  )}
                </div>
                
                <button type="button" className="p-1 text-gray-700" aria-label="Post options">
                  <MoreHorizontal className="h-5 w-5" />
                </button>
              </header>

              <div className="cursor-pointer" onClick={() => openReelsPlayer(post)}>
                <FeedImage src={post.media_url} alt={post.caption || 'Post'} className="w-full aspect-square" />
              </div>

              <div className="px-4 pt-3 pb-4">
                <div className="flex items-center gap-4 mb-3">
                  <button type="button" onClick={() => toggleLike(post)} className={`flex items-center gap-1.5 ${likedPosts[post.id] ? 'text-red-500' : 'text-gray-900'}`} aria-label="Like post">
                    <Heart className="h-6 w-6" fill={likedPosts[post.id] ? 'currentColor' : 'none'} />
                    <span className="text-sm font-bold">{Number(post.likes) || 0}</span>
                  </button>
                  <button type="button" onClick={() => openCommentSheet(post)} className="flex items-center gap-1.5 text-gray-900" aria-label="Comment on post">
                    <MessageCircle className="h-6 w-6" />
                    <span className="text-sm font-bold">{Number(post.comments) || 0}</span>
                  </button>
                  <button type="button" onClick={() => handleShare(post)} className="flex items-center gap-1.5 text-gray-900" aria-label="Share post">
                    <Send className="h-6 w-6" />
                    <span className="text-sm font-bold">{Number(post.shares) || 0}</span>
                  </button>
                  
                  {/* 🔥 NEW BOOKMARK BUTTON 🔥 */}
                  <button type="button" onClick={() => toggleSave(post)} className="ml-auto text-gray-900 active:scale-90 transition-transform" aria-label="Save post">
                    <Bookmark className="h-6 w-6" fill={savedPosts[post.id] ? 'currentColor' : 'none'} />
                  </button>
                </div>

                {post.caption && (
                  <p className="text-sm break-words">
                    <span 
                      className="font-bold mr-1 cursor-pointer hover:underline"
                      onClick={() => navigate(`/profile/${post.user_id}`)}
                    >
                      {post.username || 'User'}
                    </span>
                    {post.caption}
                  </p>
                )}
              </div>
            </article>
            );
          })
        )}

        {hasMorePosts && (
          <div ref={feedSentinelRef} className="flex justify-center py-8 text-gray-400">
            <Loader2 className="w-6 h-6 animate-spin" />
          </div>
        )}
      </div>

      {commentsSheetPost !== null && (
        <div className="fixed inset-0 z-[210] bg-black/60 flex items-end justify-center" onClick={() => setCommentsSheetPost(null)}>
          <div className="w-full max-w-lg bg-white rounded-t-3xl flex flex-col max-h-[80vh] animate-in slide-in-from-bottom-full duration-300" onClick={(event) => event.stopPropagation()}>
            <div className="px-5 pt-4 pb-3 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-black text-gray-900">{Number(commentsSheetPost.comments) || 0} comments</h3>
              <button onClick={() => setCommentsSheetPost(null)} className="p-1 active:scale-90 transition-transform" aria-label="Close comments"><X className="w-6 h-6 text-gray-500" /></button>
            </div>
            <div className="flex-1 overflow-y-auto px-5 py-3">
              {(commentsByPost[commentsSheetPost.id] || []).map((comment) => (
                <div key={comment.id} className="flex items-start gap-3 py-2.5 active:bg-gray-50 transition-colors"
                  onPointerDown={() => startDeleteCommentPress(comment)}
                  onPointerUp={() => clearTimeout(deleteCommentTimerRef.current)}
                  onPointerCancel={() => clearTimeout(deleteCommentTimerRef.current)}
                  onPointerLeave={() => clearTimeout(deleteCommentTimerRef.current)}
                >
                  <img src={comment.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${comment.user_id}`} alt="" className="h-9 w-9 rounded-full object-cover bg-gray-100 cursor-pointer" onClick={() => navigate(`/profile/${comment.user_id}`)} />
                  <div className="flex-1 min-w-0">
                    <span className="font-bold text-sm mr-1 cursor-pointer hover:underline" onClick={() => navigate(`/profile/${comment.user_id}`)}>{comment.username || 'User'}</span>
                    <span className="text-sm text-gray-800 break-words">{comment.content}</span>
                  </div>
                </div>
              ))}
              {(commentsByPost[commentsSheetPost.id] || []).length === 0 && <p className="py-8 text-center text-gray-400 font-bold">No comments yet</p>}
            </div>
            <div className="border-t border-gray-100 px-4 py-3">
              <form onSubmit={(event) => submitComment(event, commentsSheetPost)} className="flex items-center gap-2">
                <input value={commentDrafts[commentsSheetPost.id] || ''} onChange={(event) => setCommentDrafts((value) => ({ ...value, [commentsSheetPost.id]: event.target.value }))} maxLength={1000} placeholder="Add a comment..." autoFocus className="flex-1 rounded-full bg-gray-100 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-yellow-400" />
                <button type="submit" className="font-bold text-sm text-blue-600 disabled:text-gray-400" disabled={!commentDrafts[commentsSheetPost.id]?.trim()}>Post</button>
              </form>
            </div>
          </div>
        </div>
      )}

      {pendingDeleteComment && (
        <div className="fixed inset-0 z-[400] bg-black/50 flex items-center justify-center p-6" onClick={() => setPendingDeleteComment(null)}>
          <div className="w-full max-w-xs bg-white rounded-2xl overflow-hidden shadow-2xl animate-in zoom-in duration-200" onClick={(event) => event.stopPropagation()}>
            <p className="px-5 pt-5 pb-3 text-center font-bold text-gray-900">Delete this comment?</p>
            <button onClick={confirmDeleteComment} className="w-full border-t border-gray-100 py-3 font-bold text-red-500 active:bg-red-50">Delete</button>
            <button onClick={() => setPendingDeleteComment(null)} className="w-full border-t border-gray-100 py-3 font-bold text-gray-900 active:bg-gray-50">Cancel</button>
          </div>
        </div>
      )}

      {viewerOpen && groupedStoriesList.length > 0 && (
        <StoryViewer 
          groupedStories={groupedStoriesList} 
          initialUserIndex={selectedUserIndex} 
          currentUserId={currentUser?.id}
          onStoryViewed={handleStoryViewed}
          onStoryDeleted={() => fetchStories(currentUser, followedUsers)}
          onClose={() => setViewerOpen(false)} 
        />
      )}
    </div>
  );
}