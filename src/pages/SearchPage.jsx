import React, { useState, useEffect } from 'react';
import { Search, UserPlus, UserCheck } from 'lucide-react';
import { supabase } from '../supabase'; 
import Skeleton from '../components/Skeleton';

export default function SearchPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [allUsers, setAllUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUserData, setCurrentUserData] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();

        if (user) {
          const { data: myData } = await supabase
            .from('users')
            .select('*')
            .eq('id', user.id)
            .single();

          if (myData) {
            setCurrentUserData({ ...myData, following: myData.following || [] });
          }

          const { data: usersList } = await supabase.from('users').select('*');

          if (usersList) {
            const formattedUsers = usersList.map(u => ({
              ...u,
              profilePic: u.profile_pic || u.profilePic, 
              displayName: u.full_name || u.displayName || u.username, 
              following: u.following || [],
              followers: u.followers || []
            }));
            setAllUsers(formattedUsers);
          }
        }
      } catch (error) {
        console.error("यूज़र्स लाने में दिक्कत:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredUsers([]);
      return;
    }
    const results = allUsers.filter(user => 
      user.id !== currentUserData?.id && 
      (
        (user.username?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (user.displayName?.toLowerCase() || '').includes(searchTerm.toLowerCase())
      )
    );
    setFilteredUsers(results);
  }, [searchTerm, allUsers, currentUserData]);

  // 🔥 एकदम ताज़ा डेटाबेस डेटा के साथ Follow/Unfollow 🔥
  const handleFollowToggle = async (targetUserId) => {
    if (!currentUserData) return;

    const isFollowing = currentUserData.following?.includes(targetUserId);
    
    // UI तुरंत अपडेट करें
    const newFollowing = isFollowing 
      ? currentUserData.following.filter(id => id !== targetUserId) 
      : [...currentUserData.following, targetUserId]; 
      
    setCurrentUserData(prev => ({ ...prev, following: newFollowing }));
    setAllUsers(prev => prev.map(u => u.id === targetUserId ? { 
      ...u, 
      followers: isFollowing 
        ? u.followers.filter(id => id !== currentUserData.id) 
        : [...(u.followers || []), currentUserData.id] 
    } : u));

    try {
      // डेटाबेस से ताज़ा लिस्ट मँगाकर अपडेट करें (No conflict)
      const { data: me } = await supabase.from('users').select('following').eq('id', currentUserData.id).single();
      const { data: target } = await supabase.from('users').select('followers').eq('id', targetUserId).single();

      let myFollowing = me?.following || [];
      let targetFollowers = target?.followers || [];

      if (isFollowing) {
        myFollowing = myFollowing.filter(id => id !== targetUserId);
        targetFollowers = targetFollowers.filter(id => id !== currentUserData.id);
      } else {
        if (!myFollowing.includes(targetUserId)) myFollowing.push(targetUserId);
        if (!targetFollowers.includes(currentUserData.id)) targetFollowers.push(currentUserData.id);
      }

      await supabase.from('users').update({ following: myFollowing }).eq('id', currentUserData.id);
      await supabase.from('users').update({ followers: targetFollowers }).eq('id', targetUserId);
    } catch (error) {
      console.error("Follow error:", error);
    }
  };

  return (
    <div className="bg-yellow-50/30 min-h-screen pb-24 font-sans flex flex-col">
      <div className="px-4 pt-6 pb-4 bg-yellow-400 sticky top-0 z-20 shadow-sm rounded-b-[30px]">
        <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight mb-4 px-2">Explore</h1>
        <div className="relative flex items-center">
          <div className="absolute left-4 text-gray-400">
            <Search className="w-6 h-6" strokeWidth={2.5} />
          </div>
          <input 
            type="text" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search users..." 
            className="w-full bg-white text-gray-900 font-bold text-[16px] py-4 pl-12 pr-4 rounded-2xl shadow-md border-2 border-transparent focus:border-gray-900 focus:outline-none transition-all placeholder-gray-400"
          />
        </div>
      </div>

      <div className="px-4 mt-6 flex-1">
        {loading ? (
          <div className="flex flex-col gap-3 mt-2">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white p-3 rounded-2xl flex items-center gap-4 shadow-sm border border-yellow-200">
                <Skeleton className="w-14 h-14 rounded-xl" />
                <div className="flex flex-col gap-2 flex-1"><Skeleton className="w-32 h-4" /><Skeleton className="w-20 h-3" /></div>
                <Skeleton className="w-10 h-10 rounded-xl" />
              </div>
            ))}
          </div>
        ) : searchTerm.trim() === '' ? (
          <div className="flex flex-col items-center justify-center mt-20 text-center opacity-60">
            <div className="w-24 h-24 bg-yellow-200 rounded-full flex items-center justify-center mb-4"><Search className="w-12 h-12 text-yellow-600" /></div>
            <h2 className="text-xl font-extrabold text-gray-900">Find Your Friends</h2>
            <p className="text-gray-600 font-medium mt-1">Search by name or username</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="flex flex-col items-center justify-center mt-20 text-center">
            <p className="text-lg font-bold text-gray-500">No users found for "{searchTerm}" 😢</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <h3 className="font-extrabold text-gray-900 text-sm uppercase tracking-wider mb-2 px-2">Results</h3>
            {filteredUsers.map((user) => {
              const isFollowing = currentUserData?.following?.includes(user.id);
              return (
                <div key={user.id} className="bg-white p-3 rounded-2xl flex items-center justify-between shadow-sm border border-yellow-200 group hover:shadow-md transition-shadow cursor-pointer">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-xl border-2 border-yellow-400 p-0.5 bg-yellow-50">
                      <img src={user.profilePic || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`} alt="avatar" className="w-full h-full rounded-lg object-cover" />
                    </div>
                    <div className="flex flex-col">
                      <span className="font-extrabold text-gray-900 text-[16px]">{user.displayName || 'Creator'}</span>
                      <span className="font-bold text-gray-500 text-[13px]">@{user.username}</span>
                    </div>
                  </div>
                  <button onClick={() => handleFollowToggle(user.id)} className={`p-2.5 rounded-xl hover:scale-105 active:scale-95 transition-all shadow-sm flex items-center gap-1 ${isFollowing ? 'bg-gray-100 text-gray-900 border-2 border-gray-200' : 'bg-gray-900 text-yellow-400 border-2 border-gray-900 shadow-md'}`}>
                    {isFollowing ? <UserCheck className="w-5 h-5" strokeWidth={2.5} /> : <UserPlus className="w-5 h-5" strokeWidth={2.5} />}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}