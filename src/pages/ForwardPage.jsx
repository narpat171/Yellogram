import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ChevronLeft, Search, Send, Check } from 'lucide-react';
import { supabase } from '../supabase';

export default function ForwardPage() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const originalMsg = state?.message;

  const [me, setMe] = useState(null);
  const [contacts, setContacts] = useState([]);
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState([]);
  const [sendingId, setSendingId] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!originalMsg) return;
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return setLoading(false);
      setMe(user);

      const { data: myData } = await supabase.from('users').select('following, followers').eq('id', user.id).maybeSingle();
      const following = myData?.following || [];
      const followers = myData?.followers || [];
      const contactIds = [...new Set([...following, ...followers])];

      if (contactIds.length === 0) {
        setContacts([]);
        setLoading(false);
        return;
      }

      const { data: users } = await supabase.from('users').select('id, username, profile_pic').in('id', contactIds);
      setContacts(users || []);
      setLoading(false);
    };
    load();
  }, [originalMsg]);

  const matches = c => (c.username || '').toLowerCase().includes(query.toLowerCase());
  const visibleContacts = contacts.filter(matches);

  const toggleSelect = id => {
    setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const handleSendTo = async contact => {
    if (!me || !originalMsg || sendingId) return;
    setSendingId(contact.id);
    try {
      const content = originalMsg.message_type === 'text'
        ? originalMsg.content
        : originalMsg.message_type === 'voice' ? '🎤 Voice message' : '📷 Media';

      const { error } = await supabase.from('messages').insert({
        sender_id: me.id,
        receiver_id: contact.id,
        content,
        message_type: originalMsg.message_type,
        media_url: originalMsg.media_url || null,
        duration: originalMsg.duration || null,
        forwarded_from: originalMsg.sender_id,
        reply_to_id: null,
      });
      if (error) throw error;
      navigate(`/chat/${contact.id}`);
    } catch (err) {
      alert(`Forward failed: ${err.message}`);
    } finally {
      setSendingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-yellow-50 flex flex-col">
      <div className="bg-yellow-400 p-4 sticky top-0 z-20 flex items-center gap-4 shadow-sm">
        <ChevronLeft className="w-8 h-8 text-gray-900 cursor-pointer" onClick={() => navigate(-1)} />
        <h1 className="text-xl font-extrabold text-gray-900 flex-1">Forward</h1>
        {selected.length > 0 && (
          <span className="text-sm font-bold text-gray-900">{selected.length} selected</span>
        )}
      </div>

      <div className="p-4">
        <div className="bg-white p-3 rounded-2xl flex items-center gap-3 border border-yellow-300 shadow-sm">
          <Search className="text-gray-400 w-5 h-5" />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search followers / following..."
            className="bg-transparent w-full focus:outline-none text-gray-800"
          />
        </div>
      </div>

      <div className="flex-1 flex flex-col px-2">
        {!originalMsg ? (
          <p className="py-12 text-center text-gray-500">No message selected to forward.</p>
        ) : loading ? (
          <p className="py-12 text-center text-gray-500">Loading contacts...</p>
        ) : visibleContacts.length === 0 ? (
          <p className="py-12 text-center text-gray-500">No followers or following found.</p>
        ) : (
          visibleContacts.map(contact => {
            const isSelected = selected.includes(contact.id);
            return (
              <div
                key={contact.id}
                onClick={() => toggleSelect(contact.id)}
                className={`flex items-center gap-3 p-3 rounded-2xl mb-1 border-2 transition-all cursor-pointer ${isSelected ? 'bg-yellow-100 border-yellow-400' : 'bg-transparent border-transparent hover:bg-yellow-100'}`}
              >
                <div className={`w-14 h-14 rounded-xl overflow-hidden shrink-0 border-2 ${isSelected ? 'border-yellow-500' : 'border-transparent'}`}>
                  <img
                    src={contact.profile_pic || `https://api.dicebear.com/7.x/avataaars/svg?seed=${contact.id}`}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="flex-1 overflow-hidden min-w-0">
                  <h3 className="font-bold text-gray-900 truncate">{contact.username || 'User'}</h3>
                </div>
                {isSelected ? (
                  <button
                    onClick={e => { e.stopPropagation(); handleSendTo(contact); }}
                    disabled={sendingId === contact.id}
                    className="w-11 h-11 rounded-full bg-yellow-400 hover:bg-yellow-500 active:bg-yellow-600 text-gray-900 flex items-center justify-center flex-shrink-0 shadow-md disabled:opacity-60"
                  >
                    {sendingId === contact.id ? (
                      <span className="w-5 h-5 border-2 border-gray-900 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Send className="w-5 h-5" strokeWidth={3} />
                    )}
                  </button>
                ) : (
                  <div className={`w-7 h-7 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${isSelected ? 'bg-yellow-400 border-yellow-500' : 'border-gray-300'}`}>
                    {isSelected && <Check className="w-4 h-4 text-gray-900" strokeWidth={4} />}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
