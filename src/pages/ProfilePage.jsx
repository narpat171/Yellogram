import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../supabase';
import { Grid, PlaySquare, ArrowLeft, Settings, Loader2, Camera, X, Check, Bookmark } from 'lucide-react';
import SettingsMenu from '../components/Settings'; // Ensure this path is correct
import Skeleton from '../components/Skeleton';

export default function ProfilePage() {
  const { userId } = useParams();
  const navigate = useNavigate();
  
  const [currentUser, setCurrentUser] = useState(null);
  const [profileData, setProfileData] = useState(null);
  const [posts, setPosts] = useState([]);
  const [savedPosts, setSavedPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [isFollowing, setIsFollowing] = useState(false);
  const [myFollowingList, setMyFollowingList] = useState([]); 

  const [activeTab, setActiveTab] = useState('posts'); 

  // Modal States
  const [showSettings, setShowSettings] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Followers/Following List States
  const [showFollowList, setShowFollowList] = useState(null); 
  const [followListData, setFollowListData] = useState([]);
  const [loadingFollowList, setLoadingFollowList] = useState(false);

  const [editForm, setEditForm] = useState({ name: '', username: '', bio: '', profile_pic: '' });
  const fileInputRef = useRef(null);

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);

      const targetUserId = userId || user?.id;
      if (!targetUserId) return setLoading(false);

      const { data: userData } = await supabase.from('users').select('*').eq('id', targetUserId).single();
      
      if (user) {
        const { data: myData } = await supabase.from('users').select('following').eq('id', user.id).single();
        const myFollowing = myData?.following || [];
        setMyFollowingList(myFollowing);
        if (userId && userId !== user.id) {
           setIsFollowing(myFollowing.includes(userId));
        }
      }

      if (userData) setProfileData(userData);

      const { data: postData } = await supabase.from('posts').select('*').eq('user_id', targetUserId).order('created_at', { ascending: false });
      if (postData) setPosts(postData);

      if (!userId || (user && userId === user.id)) {
        try {
          const { data: savedData } = await supabase
            .from('saved_posts')
            .select('post:post_id (*)') 
            .eq('user_id', targetUserId)
            .order('created_at', { ascending: false });
            
          if (savedData) {
             setSavedPosts(savedData.map(item => item.post).filter(Boolean));
          }
        } catch (e) { console.log("Saved posts fetch error", e) }
      }

      setLoading(false);
    };

    fetchProfile();
  }, [userId]);

  const toggleFollow = async () => {
    if (!currentUser || !profileData) return;
    await toggleListFollow(profileData.id);
  };

  const toggleListFollow = async (targetId) => {
    if (!currentUser) return;
    const myId = currentUser.id;
    const isCurrentlyFollowing = myFollowingList.includes(targetId);

    setMyFollowingList(prev => isCurrentlyFollowing ? prev.filter(id => id !== targetId) : [...prev, targetId]);
    if (profileData && profileData.id === targetId) setIsFollowing(!isCurrentlyFollowing);

    const { data: targetData } = await supabase.from('users').select('followers').eq('id', targetId).single();
    let targetFollowers = targetData?.followers || [];

    if (isCurrentlyFollowing) {
      targetFollowers = targetFollowers.filter(id => id !== myId);
    } else {
      if (!targetFollowers.includes(myId)) targetFollowers.push(myId);
      supabase.from('notifications').insert({ user_id: targetId, sender_id: myId, type: 'follow', content: 'started following you.' }).then();
    }

    await supabase.from('users').update({ following: isCurrentlyFollowing ? myFollowingList.filter(id => id !== targetId) : [...myFollowingList, targetId] }).eq('id', myId);
    await supabase.from('users').update({ followers: targetFollowers }).eq('id', targetId);

    if (!userId || (currentUser && userId === currentUser.id)) {
      setProfileData(prev => ({ ...prev, following: isCurrentlyFollowing ? prev.following.filter(id => id !== targetId) : [...(prev.following||[]), targetId] }));
    }
  };

  const openFollowList = async (type) => {
    setShowFollowList(type);
    setLoadingFollowList(true);
    const idsToFetch = type === 'followers' ? profileData.followers : profileData.following;
    
    if (!idsToFetch || idsToFetch.length === 0) {
      setFollowListData([]);
      setLoadingFollowList(false);
      return;
    }

    const { data } = await supabase.from('users').select('*').in('id', idsToFetch);
    setFollowListData(data || []);
    setLoadingFollowList(false);
  };

  const openEditModal = () => { 
    setEditForm({ 
      name: profileData.name || '', 
      username: profileData.username || '', 
      bio: profileData.bio || '', 
      profile_pic: profileData.profile_pic || '' 
    }); 
    setIsEditing(true); 
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0]; 
    if (!file) return; 
    setIsUploading(true);
    try {
      const fileName = `profiles/${currentUser.id}_${Date.now()}.${file.name.split('.').pop()}`;
      await supabase.storage.from('yellowgram_uploads').upload(fileName, file);
      const { data } = supabase.storage.from('yellowgram_uploads').getPublicUrl(fileName);
      setEditForm(prev => ({ ...prev, profile_pic: data.publicUrl }));
    } catch (error) { 
      alert("Failed: " + error.message); 
    } finally { 
      setIsUploading(false); 
    }
  };

  const handleSaveProfile = async () => {
    if (!editForm.username.trim()) return alert("Username required!");
    setIsSaving(true);
    try {
      await supabase.from('users').update(editForm).eq('id', currentUser.id);
      setProfileData(prev => ({ ...prev, ...editForm }));
      setIsEditing(false);
    } catch (error) { 
      alert("Error: " + error.message); 
    } finally { 
      setIsSaving(false); 
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-white pb-20 px-4 pt-8 flex flex-col items-center">
      <Skeleton className="w-24 h-24 rounded-full" />
      <Skeleton className="w-40 h-5 mt-4" />
      <Skeleton className="w-24 h-3 mt-2" />
      <Skeleton className="w-64 h-3 mt-3" />
      <div className="flex gap-3 w-full max-w-sm mt-6"><Skeleton className="flex-1 h-10 rounded-xl" /><Skeleton className="flex-1 h-10 rounded-xl" /></div>
      <div className="grid grid-cols-3 gap-[2px] w-full mt-8">
        {[...Array(9)].map((_, i) => <Skeleton key={i} className="aspect-square w-full rounded-none" />)}
      </div>
    </div>
  );
  if (!profileData) return <div className="p-4 text-center mt-20 text-gray-500">User not found</div>;

  const isMyProfile = !userId || (currentUser && userId === currentUser.id);

  let displayMedia = [];
  if (activeTab === 'posts') displayMedia = posts.filter(p => p.type !== 'video' && !p.media_url?.includes('.mp4'));
  else if (activeTab === 'reels') displayMedia = posts.filter(p => p.type === 'video' || p.media_url?.includes('.mp4'));
  else if (activeTab === 'saved') displayMedia = savedPosts;

  return (
    <div className="min-h-screen bg-white pb-20 relative">
      
      {/* 🔝 Header */}
      <div className="bg-white p-4 sticky top-0 z-10 flex items-center justify-between">
        <div className="flex items-center gap-4">
          {userId && <ArrowLeft className="w-6 h-6 cursor-pointer active:scale-90" onClick={() => navigate(-1)} />}
          <h1 className="text-xl font-bold text-gray-900">{isMyProfile ? 'Profile' : profileData.username}</h1>
        </div>
        {isMyProfile && <Settings className="w-6 h-6 text-gray-800 cursor-pointer active:scale-90" onClick={() => setShowSettings(true)} />}
      </div>

      {/* 👤 Profile Info */}
      <div className="flex flex-col items-center px-4 pt-2 pb-4">
        <div className="relative mb-3">
          <img src={profileData.profile_pic || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profileData.id}`} className="w-24 h-24 rounded-full object-cover border-[3px] border-yellow-400 p-0.5 shadow-sm" />
        </div>
        <h2 className="text-xl font-extrabold text-gray-900 leading-tight">{profileData.name || profileData.username}</h2>
        <p className="text-[14px] font-medium text-gray-500 mb-3">@{profileData.username.toLowerCase().replace(/\s+/g, '')}</p>
        <p className="text-[15px] text-gray-800 text-center max-w-[90%] whitespace-pre-wrap mb-6">{profileData.bio || "Available on YellowGram 💛"}</p>

        {isMyProfile ? (
          <div className="flex gap-3 w-full max-w-sm mb-6">
            <button onClick={openEditModal} className="flex-1 bg-gray-100 text-gray-900 font-bold py-2.5 rounded-xl text-[14.5px] active:scale-95 transition-transform">Edit profile</button>
            <button className="flex-1 bg-gray-100 text-gray-900 font-bold py-2.5 rounded-xl text-[14.5px] active:scale-95 transition-transform">Share profile</button>
          </div>
        ) : (
          <div className="flex gap-3 w-full max-w-sm mb-6">
            <button onClick={toggleFollow} className={`flex-1 font-bold py-2.5 rounded-xl text-[14.5px] active:scale-95 transition-all ${isFollowing ? 'bg-gray-100 text-gray-900' : 'bg-yellow-400 text-gray-900 shadow-sm'}`}>
              {isFollowing ? 'Following' : 'Follow'}
            </button>
            <button onClick={() => navigate(`/chat/${profileData.id}`)} className="flex-1 bg-gray-100 text-gray-900 font-bold py-2.5 rounded-xl text-[14.5px] active:scale-95 transition-transform">Message</button>
          </div>
        )}

        {/* Stats */}
        <div className="flex items-center justify-center gap-10 w-full border-t border-gray-100 pt-5">
          <div className="flex flex-col items-center">
            <span className="font-bold text-xl leading-none">{posts.length}</span>
            <span className="text-[13px] text-gray-500 font-medium mt-1">Posts</span>
          </div>
          <div className="flex flex-col items-center cursor-pointer active:opacity-50" onClick={() => openFollowList('followers')}>
            <span className="font-bold text-xl leading-none">{profileData.followers?.length || 0}</span>
            <span className="text-[13px] text-gray-500 font-medium mt-1">Followers</span>
          </div>
          <div className="flex flex-col items-center cursor-pointer active:opacity-50" onClick={() => openFollowList('following')}>
            <span className="font-bold text-xl leading-none">{profileData.following?.length || 0}</span>
            <span className="text-[13px] text-gray-500 font-medium mt-1">Following</span>
          </div>
        </div>
      </div>

      {/* 📱 TABS */}
      <div className="flex border-t border-gray-200 mt-2">
        <div onClick={() => setActiveTab('posts')} className={`flex-1 flex justify-center py-3 cursor-pointer transition-colors ${activeTab === 'posts' ? 'border-b-[2px] border-gray-900' : ''}`}>
          <Grid className={`w-6 h-6 ${activeTab === 'posts' ? 'text-gray-900' : 'text-gray-400'}`} />
        </div>
        <div onClick={() => setActiveTab('reels')} className={`flex-1 flex justify-center py-3 cursor-pointer transition-colors ${activeTab === 'reels' ? 'border-b-[2px] border-gray-900' : ''}`}>
          <PlaySquare className={`w-6 h-6 ${activeTab === 'reels' ? 'text-gray-900' : 'text-gray-400'}`} />
        </div>
        {isMyProfile && (
          <div onClick={() => setActiveTab('saved')} className={`flex-1 flex justify-center py-3 cursor-pointer transition-colors ${activeTab === 'saved' ? 'border-b-[2px] border-gray-900' : ''}`}>
            <Bookmark className={`w-6 h-6 ${activeTab === 'saved' ? 'text-gray-900' : 'text-gray-400'}`} />
          </div>
        )}
      </div>

      {/* 📸 Grid */}
      <div className="grid grid-cols-3 gap-[2px]">
        {displayMedia.map(post => {
          const isVideo = post.type === 'video' || post.type === 'reel' || post.media_url?.includes('.mp4');
          return (
            <div key={post.id} className="aspect-square bg-gray-200 cursor-pointer active:opacity-70 transition-opacity relative group">
              {isVideo ? (
                <><video src={post.media_url} className="w-full h-full object-cover" /><div className="absolute top-2 right-2"><PlaySquare className="w-4 h-4 text-white fill-white drop-shadow-md" /></div></>
              ) : (
                <img src={post.media_url} className="w-full h-full object-cover" />
              )}
            </div>
          );
        })}
      </div>
      
      {displayMedia.length === 0 && (
        <div className="flex flex-col items-center justify-center mt-12 text-gray-400">
          <div className="w-16 h-16 rounded-full border-2 border-gray-200 flex items-center justify-center mb-3">
            {activeTab === 'posts' ? <Grid className="w-8 h-8 opacity-50" /> : activeTab === 'reels' ? <PlaySquare className="w-8 h-8 opacity-50" /> : <Bookmark className="w-8 h-8 opacity-50" />}
          </div>
          <h2 className="text-lg font-bold text-gray-900">No {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Yet</h2>
        </div>
      )}

      {/* 🔥 FOLLOWERS / FOLLOWING MODAL LIST 🔥 */}
      {showFollowList && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-end sm:items-center justify-center animate-in fade-in duration-200">
          <div className="bg-white w-full sm:w-[400px] h-[75vh] sm:max-h-[80vh] rounded-t-3xl sm:rounded-3xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-[100%] duration-300">
            <div className="flex justify-between items-center px-5 py-4 border-b border-gray-100 bg-white">
              <h2 className="font-bold text-[17px] text-gray-900 capitalize">{showFollowList}</h2>
              <button onClick={() => setShowFollowList(null)} className="p-1 active:scale-90"><X className="w-6 h-6 text-gray-900" /></button>
            </div>
            
            <div className="flex-1 overflow-y-auto">
              {loadingFollowList ? (
                <div className="flex justify-center mt-10"><Loader2 className="w-8 h-8 animate-spin text-yellow-500" /></div>
              ) : followListData.length === 0 ? (
                <div className="text-center mt-10 text-gray-500 font-medium">No users found.</div>
              ) : (
                followListData.map(user => {
                  const amIFollowing = myFollowingList.includes(user.id);
                  const isMe = currentUser?.id === user.id;

                  return (
                    <div key={user.id} className="flex justify-between items-center px-4 py-3 border-b border-gray-50">
                      <div className="flex items-center gap-3 cursor-pointer" onClick={() => { setShowFollowList(null); navigate(`/profile/${user.id}`); }}>
                        <img src={user.profile_pic || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.id}`} className="w-12 h-12 rounded-full border border-gray-200 object-cover" />
                        <div className="flex flex-col">
                          <span className="font-bold text-[14px] text-gray-900 leading-tight">{user.username}</span>
                          <span className="text-[13px] text-gray-500">{user.name || ''}</span>
                        </div>
                      </div>
                      
                      {!isMe && (
                        <button 
                          onClick={() => toggleListFollow(user.id)}
                          className={`px-4 py-1.5 rounded-lg text-[13px] font-bold active:scale-95 transition-all ${amIFollowing ? 'bg-gray-100 text-gray-900' : 'bg-blue-500 text-white'}`}
                        >
                          {amIFollowing ? 'Following' : 'Follow'}
                        </button>
                      )}
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* 🔥 SETTINGS MENU (External Component) 🔥 */}
      {showSettings && (
        <SettingsMenu onClose={() => setShowSettings(false)} />
      )}

      {/* 🔥 EDIT PROFILE MODAL 🔥 */}
      {isEditing && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-end sm:items-center justify-center animate-in fade-in duration-300">
          <div className="bg-white w-full sm:w-[400px] h-[90vh] sm:h-auto sm:max-h-[90vh] rounded-t-3xl sm:rounded-3xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-[100%] duration-300">
            
            <div className="flex justify-between items-center px-4 py-3 border-b border-gray-100 bg-white shadow-sm z-10">
              <div className="flex items-center gap-4">
                <button onClick={() => setIsEditing(false)} className="p-1 active:scale-90"><X className="w-7 h-7 text-gray-900" /></button>
                <h2 className="font-bold text-[17px] text-gray-900">Edit Profile</h2>
              </div>
              <button 
                onClick={handleSaveProfile}
                disabled={isSaving || isUploading}
                className="text-blue-500 font-bold p-1 active:scale-90 disabled:opacity-50"
              >
                {isSaving ? <Loader2 className="w-6 h-6 animate-spin" /> : <Check className="w-7 h-7" />}
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 flex flex-col items-center">
              
              {/* Photo Edit */}
              <div className="relative mb-8 flex flex-col items-center">
                <div onClick={() => fileInputRef.current?.click()} className="relative w-[100px] h-[100px] rounded-full border-2 border-gray-200 overflow-hidden cursor-pointer group shadow-sm">
                  <img src={editForm.profile_pic || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profileData.id}`} className={`w-full h-full object-cover transition-opacity ${isUploading ? 'opacity-50' : 'group-hover:opacity-80'}`} />
                  <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><Camera className="w-8 h-8 text-white" /></div>
                  {isUploading && <div className="absolute inset-0 flex items-center justify-center"><Loader2 className="w-8 h-8 text-white animate-spin" /></div>}
                </div>
                <button onClick={() => fileInputRef.current?.click()} className="mt-3 text-blue-500 font-bold text-[15px] active:scale-95">Edit picture</button>
                <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handlePhotoUpload} />
              </div>

              {/* Form Fields */}
              <div className="w-full flex flex-col gap-6">
                <div className="flex flex-col">
                  <label className="text-gray-500 text-[13px] font-bold mb-1 ml-1">Name</label>
                  <input type="text" value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} placeholder="Your Name" className="border-b border-gray-300 px-2 py-2 outline-none focus:border-gray-900 text-[16px] font-medium transition-colors" />
                </div>
                <div className="flex flex-col">
                  <label className="text-gray-500 text-[13px] font-bold mb-1 ml-1">Username</label>
                  <input type="text" value={editForm.username} onChange={e => setEditForm({...editForm, username: e.target.value})} placeholder="Username" className="border-b border-gray-300 px-2 py-2 outline-none focus:border-gray-900 text-[16px] font-medium transition-colors" />
                </div>
                <div className="flex flex-col">
                  <label className="text-gray-500 text-[13px] font-bold mb-1 ml-1">Bio</label>
                  <textarea value={editForm.bio} onChange={e => setEditForm({...editForm, bio: e.target.value})} placeholder="Write something about yourself..." rows="3" className="border-b border-gray-300 px-2 py-2 outline-none focus:border-gray-900 text-[16px] font-medium transition-colors resize-none"></textarea>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
}