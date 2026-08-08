import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Search } from 'lucide-react';
import { supabase } from '../supabase';
import Skeleton from '../components/Skeleton';

export default function MessagesPage() {
  const navigate = useNavigate();
  const [chats, setChats] = useState([]);
  const [people, setPeople] = useState([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    let channel = null;

    const loadInbox = async () => {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return setLoading(false);
      const [{ data: messages, error }, { data: users, error: usersError }] = await Promise.all([
        supabase.from('messages').select('*').or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`).order('created_at', { ascending: false }),
        supabase.from('users').select('id, username, profile_pic').neq('id', user.id).order('username'),
      ]);
      if (cancelled) return;
      if (error) console.error('Could not load messages:', error);
      if (usersError) console.error('Could not load accounts:', usersError);
      setPeople(users || []);

      const latestByUser = new Map();
      (messages || []).forEach((message) => {
        const otherId = message.sender_id === user.id ? message.receiver_id : message.sender_id;
        if (!latestByUser.has(otherId)) latestByUser.set(otherId, message);
      });
      const profiles = new Map((users || []).map((profile) => [profile.id, profile]));
      setChats([...latestByUser.entries()].map(([id, lastMessage]) => ({ id, lastMessage, profile: profiles.get(id) })));
      setLoading(false);

      // 🔥 REALTIME — naya message aate hi chat list me live dikhe (account name ke niche) 🔥
      channel = supabase
        .channel(`inbox_${user.id}`)
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, payload => {
          const newMsg = payload.new;
          const otherId = newMsg.sender_id === user.id ? newMsg.receiver_id : newMsg.sender_id;
          setChats(prev => {
            const existing = prev.find(c => c.id === otherId);
            const profile = existing?.profile || profiles.get(otherId);
            const rest = prev.filter(c => c.id !== otherId);
            return [{ id: otherId, lastMessage: newMsg, profile }, ...rest];
          });
        })
        .subscribe();
    };

    loadInbox();

    return () => {
      cancelled = true;
      if (channel) supabase.removeChannel(channel);
    };
  }, []);

  const matches = (person) => (person.username || '').toLowerCase().includes(query.toLowerCase());
  const visibleChats = chats.filter((chat) => matches(chat.profile || {}));
  const visiblePeople = people.filter(matches);
  const openChat = (userId) => navigate(`/chat/${userId}`);

  return (
    <div className="min-h-screen bg-yellow-50 flex flex-col">
      <div className="bg-yellow-400 p-4 sticky top-0 z-20 flex items-center gap-4 shadow-sm">
        <ChevronLeft className="w-8 h-8 text-gray-900 cursor-pointer" onClick={() => navigate('/')} />
        <h1 className="text-xl font-extrabold text-gray-900 flex-1">Messages</h1>
      </div>
      <div className="p-4">
        <div className="bg-white p-3 rounded-2xl flex items-center gap-3 border border-yellow-300 shadow-sm"><Search className="text-gray-400 w-5 h-5" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search accounts or messages..." className="bg-transparent w-full focus:outline-none text-gray-800" /></div>
      </div>
      <div className="flex flex-col px-2">
        {loading ? (
          <div className="px-3 py-4 flex flex-col gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="flex items-center gap-4">
                <Skeleton className="w-14 h-14 rounded-2xl" />
                <div className="flex-1 flex flex-col gap-2"><Skeleton className="w-36 h-4" /><Skeleton className="w-24 h-3" /></div>
              </div>
            ))}
          </div>
        ) : (
          <>
        {visibleChats.map((chat) => <button key={chat.id} onClick={() => openChat(chat.id)} className="text-left flex items-center gap-4 p-3 hover:bg-yellow-100 rounded-2xl mb-1"><div className="w-14 h-14 rounded-xl bg-yellow-300 border-2 border-yellow-500 overflow-hidden shrink-0"><img src={chat.profile?.profile_pic || `https://api.dicebear.com/7.x/avataaars/svg?seed=${chat.id}`} alt="" className="h-full w-full object-cover" /></div><div className="flex-1 overflow-hidden"><h3 className="font-bold text-gray-900">{chat.profile?.username || 'User'}</h3><p className="text-sm text-gray-600 truncate">{chat.lastMessage.message_type === 'voice' ? '🎤 Voice message' : chat.lastMessage.message_type !== 'text' ? '📷 Media' : chat.lastMessage.content}</p></div></button>)}
        {visibleChats.length > 0 && <p className="px-3 pt-4 pb-2 text-xs font-black uppercase tracking-wide text-gray-500">Accounts</p>}
        {visiblePeople.map((person) => <button key={person.id} onClick={() => openChat(person.id)} className="w-full text-left flex items-center gap-3 p-3 hover:bg-yellow-100 rounded-2xl"><img src={person.profile_pic || `https://api.dicebear.com/7.x/avataaars/svg?seed=${person.id}`} alt="" className="h-12 w-12 rounded-full bg-yellow-100 object-cover" /><span className="font-bold text-gray-900">{person.username || 'User'}</span></button>)}
        {visiblePeople.length === 0 && <p className="py-12 text-center text-gray-500">No accounts found.</p>}
          </>
        )}
      </div>
    </div>
  );
}
