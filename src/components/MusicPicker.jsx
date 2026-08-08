import React, { useEffect, useRef, useState } from 'react';
import { Search, X, Play, Pause, Loader2, ChevronLeft } from 'lucide-react';

const TRENDING = [
  'Dhanda Nyoliwala', 'Masoom Sharma', 'Amanraj Gill', 'KD Desi Rock',
  'Arijit Singh', 'Badshah', 'AR Rahman', 'Sidhu Moose Wala', 'Anirudh Ravichander',
  'Diljit Dosanjh', 'Taylor Swift', 'Shreya Ghoshal', 'Dua Lipa', 'Neha Kakkar',
  'Ed Sheeran', 'Jubin Nautiyal', 'The Weeknd', 'Karan Aujla', 'Pritam',
];

const LANGUAGE_TABS = [
  { id: 'hindi', label: 'Hindi', emoji: '🇮🇳', artists: [
    'Arijit Singh', 'Shreya Ghoshal', 'Jubin Nautiyal', 'Atif Aslam',
    'Armaan Malik', 'Darshan Raval', 'Kishore Kumar', 'Mohammed Rafi',
    'Lata Mangeshkar', 'Asha Bhosle', 'Kumar Sanu', 'Udit Narayan',
    'Alka Yagnik', 'Sonu Nigam', 'Mika Singh', 'Yo Yo Honey Singh',
    'Badshah', 'Neha Kakkar', 'Sunidhi Chauhan', 'KK',
    'Mohit Chauhan', 'Amit Trivedi', 'Vishal Mishra', 'Shankar Mahadevan',
    'Pritam', 'Sachin Jigar', 'Ajay-Atul', 'Vishal Dadlani',
    'Raftaar', 'B Praak', 'Jass Manak', 'Guru Randhawa',
  ]},
  { id: 'punjabi', label: 'Punjabi', emoji: '🪔', artists: [
    'Sidhu Moose Wala', 'Diljit Dosanjh', 'Karan Aujla', 'AP Dhillon',
    'Honey Singh', 'Ammy Virk', 'Harbhajan Mann', 'Surjit Bindrakhia',
    'Gurdas Maan', 'Balkar Sidhu', 'Garry Sandhu', 'Kulwinder Billa',
    'Sharry Maan', 'Neha Kakkar', 'Amar Singh Chamkila', 'Babbu Maan',
  ]},
  { id: 'haryanvi', label: 'Haryanvi', emoji: '🐪', artists: [
    'Khasa Aala Chahar', 'Gulzaar Chhaniwala', 'Mister Lehri', 'A K Atish',
    'Dhanda Nyoliwala', 'Masoom Sharma', 'Amanraj Gill', 'KD Desi Rock',
    'Sumit Goswami', 'Manisha Sharma', 'R Dayal', 'Raj Mawar',
    'Monu Gurjar', 'R K Rathore', 'Manish Mahen', 'Firdaus',
    'Sapna Choudhary', 'Rohit Sardana', 'Nanna Maliya', 'Parveen Kaushik',
  ]},
  { id: 'tamil', label: 'Tamil', emoji: '🇮🇳', artists: [
    'Anirudh Ravichander', 'AR Rahman', 'Ilaiyaraaja', 'S.P. Balasubrahmanyam',
    'GV Prakash', 'Yuvan Shankar Raja', 'Vijay Yesudas', 'Hiphop Tamizha',
    'Santhosh Narayanan', 'Deva', 'Harris Jayaraj', 'A.R. Rahman',
  ]},
  { id: 'telugu', label: 'Telugu', emoji: '🇮🇳', artists: [
    'Devi Sri Prasad', 'Mani Sharma', 'M.M. Keeravani', 'Thaman S',
    'Ilaiyaraaja', 'Vijay Prakash', 'Kalyani Malik', 'Ram Sampath',
  ]},
  { id: 'malayalam', label: 'Malayalam', emoji: '🇮🇳', artists: [
    'Vineeth Sreenivasan', 'Vidyasagar', 'Gopi Sundar', 'Ranjin Raj',
    'Shankar Mahadevan', 'Sushin Shyam', 'Deepak Dev',
  ]},
  { id: 'kannada', label: 'Kannada', emoji: '🇮🇳', artists: [
    'Hamsalekha', 'V. Harikrishna', 'Arjun Janya', 'Raghu Dixit',
    'Sonu Nigam', 'Vijay Prakash',
  ]},
  { id: 'marathi', label: 'Marathi', emoji: '🇮🇳', artists: [
    'Ajay-Atul', 'Amitraj', 'Avadhoot Gupte', 'Shreya Ghoshal',
    'Kavita Ramdas', 'Vaishali Samant', 'Prashant Nakti',
  ]},
  { id: 'bhojpuri', label: 'Bhojpuri', emoji: '🇮🇳', artists: [
    'Khesari Lal Yadav', 'Pawan Singh', 'Dinesh Lal Yadav', 'Amit Star',
    'Shilpi Raj', 'Neelkamal Singh', 'Anupma Yadav', 'Pramod Premi Yadav',
  ]},
  { id: 'gujarati', label: 'Gujarati', emoji: '🇮🇳', artists: [
    'Aishwarya Majmudar', 'Osman Mir', 'Aditya Gadhvi', 'Manoj Desai',
    'Jignesh Kaviraj', 'Priyam Patel',
  ]},
  { id: 'bengali', label: 'Bengali', emoji: '🇮🇳', artists: [
    'Arijit Singh', 'Kumar Sanu', 'Anup Jalota', 'Kishore Kumar',
    'Srikanta Acharya', 'Shreya Ghoshal', 'Bappi Lahiri',
  ]},
  { id: 'english', label: 'English', emoji: '🌍', artists: [
    'Taylor Swift', 'Ed Sheeran', 'Dua Lipa', 'Ariana Grande',
    'Drake', 'Justin Bieber', 'The Weeknd', 'Beyonce',
    'Eminem', 'Coldplay', 'Post Malone', 'Billie Eilish',
    'Imagine Dragons', 'Rihanna', 'Shawn Mendes', 'Alan Walker',
  ]},
];

const BHAJAN_DEVTAS = [
  'Karni Mata bhajan', 'Khatu Shyam bhajan', 'Hanuman bhajan', 'Shiv bhajan',
  'Ganesh bhajan', 'Durga Maa bhajan', 'Krishna bhajan', 'Radhe Krishna bhajan',
  'Sai Baba bhajan', 'Om Jai Lakshmi Mata', 'Shri Ram bhajan', 'Santoshi Mata bhajan',
  'Vaishno Devi bhajan', 'Baba Balak Nath bhajan', 'Guru Nanak shabad', 'Baba Ramdev bhajan',
  'Jai Mata Di bhajan', 'Shirdi Sai bhajan', 'Mahadev bhajan', 'Shyam Baba bhajan',
];

export default function MusicPicker({ onSelect, onClose }) {
  const [tab, setTab] = useState('trending');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState('');
  const [playingUrl, setPlayingUrl] = useState('');
  const [activeArtist, setActiveArtist] = useState(null);
  const [cropSong, setCropSong] = useState(null);
  const [cropStart, setCropStart] = useState(0);
  const audioRef = useRef(null);

  useEffect(() => {
    return () => { if (audioRef.current) { audioRef.current.pause(); audioRef.current.src = ''; } };
  }, []);

  const searchSongs = async (term, limit = 25) => {
    if (!term.trim()) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(term)}&media=music&limit=${limit}&country=IN`);
      const data = await res.json();
      setResults((data.results || []).filter(s => s.previewUrl));
    } catch (err) {
      setError('Songs load nahi hue. Internet check karo.');
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const openArtist = artist => {
    setActiveArtist(artist);
    setQuery(artist);
    searchSongs(artist, 50);
  };

  const handleSearch = async e => {
    e.preventDefault();
    if (!query.trim()) return;
    setSearching(true);
    setTab('trending');
    setActiveArtist(null);
    await searchSongs(query);
    setSearching(false);
  };

  const togglePlay = url => {
    if (playingUrl === url) {
      audioRef.current?.pause();
      setPlayingUrl('');
      return;
    }
    if (audioRef.current) audioRef.current.pause();
    const audio = new Audio(url);
    audioRef.current = audio;
    audio.play().then(() => setPlayingUrl(url)).catch(() => {});
    audio.onended = () => setPlayingUrl('');
  };

  const openCrop = song => {
    setCropSong(song);
    setCropStart(0);
    setPlayingUrl('');
  };

  const toggleCropPlay = () => {
    if (!cropSong) return;
    if (playingUrl) {
      audioRef.current?.pause();
      setPlayingUrl('');
      return;
    }
    if (audioRef.current) audioRef.current.pause();
    const audio = new Audio(cropSong.previewUrl);
    audio.currentTime = cropStart;
    audioRef.current = audio;
    audio.play().then(() => setPlayingUrl(cropSong.previewUrl)).catch(() => {});
    audio.onended = () => setPlayingUrl('');
  };

  const handleCropDone = () => {
    onSelect({ name: `${cropSong.trackName} - ${cropSong.artistName}`, url: cropSong.previewUrl, start: Math.round(cropStart * 100) / 100 });
  };

  const formatTime = s => {
    const sec = Math.max(0, Math.floor(s));
    return `${String(Math.floor(sec / 60)).padStart(2, '0')}:${String(sec % 60).padStart(2, '0')}`;
  };

  const languageTab = LANGUAGE_TABS.find(t => t.id === tab);

  return (
    <div className="absolute inset-0 bg-[#121212]/95 z-[100] flex flex-col animate-in fade-in duration-200">
      {cropSong ? (
        <div className="flex-1 flex flex-col">
          <div className="flex items-center gap-3 px-4 py-4 border-b border-white/10">
            <button onClick={() => { setCropSong(null); setPlayingUrl(''); }} className="text-white hover:text-gray-300 active:scale-90 transition-transform"><X className="w-7 h-7" /></button>
            <p className="text-white font-bold text-sm flex-1">Crop song</p>
            <button onClick={handleCropDone} className="text-gray-900 font-black text-sm bg-yellow-400 hover:bg-yellow-500 active:scale-95 px-5 py-2 rounded-full transition-all">
              Done
            </button>
          </div>

          <div className="flex-1 flex flex-col items-center justify-center px-6">
            {cropSong.artworkUrl100 && (
              <img src={cropSong.artworkUrl100} alt="" className="w-40 h-40 rounded-2xl object-cover shadow-2xl" />
            )}
            <p className="text-white font-bold mt-5 text-center">{cropSong.trackName}</p>
            <p className="text-white/50 text-sm text-center mb-8">{cropSong.artistName}</p>

            <button onClick={toggleCropPlay} className="w-16 h-16 rounded-full bg-yellow-400 text-gray-900 flex items-center justify-center active:scale-90 transition-all shadow-lg">
              {playingUrl ? <Pause className="w-7 h-7" fill="currentColor" /> : <Play className="w-7 h-7 ml-1" fill="currentColor" />}
            </button>
            <p className="text-white/60 text-xs mt-3 font-bold">{playingUrl ? 'Preview from crop point' : 'Tap to preview from crop point'}</p>

            <div className="w-full mt-8">
              <div className="flex justify-between text-white/60 text-xs font-bold mb-2">
                <span>{formatTime(cropStart)}</span>
                <span>30</span>
              </div>
              <input
                type="range"
                min="0"
                max="28"
                step="0.5"
                value={cropStart}
                onChange={e => { setCropStart(Number(e.target.value)); if (audioRef.current && !audioRef.current.paused) { audioRef.current.pause(); setPlayingUrl(''); } }}
                className="w-full accent-yellow-400"
              />
              <p className="text-white/40 text-xs mt-2 text-center">Song ise point se start hoga</p>
            </div>
          </div>
        </div>
      ) : (
      <>
      <div className="flex items-center gap-3 px-4 py-4 border-b border-white/10">
        <button onClick={activeArtist ? () => { setActiveArtist(null); setResults([]); } : onClose} className="text-white hover:text-gray-300 active:scale-90 transition-transform">
          {activeArtist ? <ChevronLeft className="w-7 h-7" /> : <X className="w-7 h-7" />}
        </button>
        <div className="flex-1 flex items-center gap-2 bg-white/10 rounded-full px-4 py-2.5">
          <Search className="w-5 h-5 text-white/60 flex-shrink-0" />
          <input
            autoFocus={!activeArtist}
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSearch(e)}
            placeholder="Search any song..."
            className="bg-transparent text-white outline-none w-full placeholder:text-white/40"
          />
          <button onClick={handleSearch} disabled={searching} className="text-white font-bold text-sm bg-white/10 px-3 py-1 rounded-full disabled:opacity-50">
            {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Search'}
          </button>
        </div>
      </div>

      {!activeArtist && (
        <div className="flex px-4 pt-3 gap-2 border-b border-white/10 pb-0 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <button onClick={() => setTab('trending')} className={`px-5 py-2 rounded-full text-sm font-bold transition-all flex-shrink-0 ${tab === 'trending' ? 'bg-yellow-400 text-gray-900' : 'bg-white/10 text-white/70 hover:bg-white/20'}`}>🔥 Trending</button>
          {LANGUAGE_TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} className={`px-5 py-2 rounded-full text-sm font-bold transition-all flex-shrink-0 ${tab === t.id ? 'bg-yellow-400 text-gray-900' : 'bg-white/10 text-white/70 hover:bg-white/20'}`}>{t.emoji} {t.label}</button>
          ))}
          <button onClick={() => setTab('bhajan')} className={`px-5 py-2 rounded-full text-sm font-bold transition-all flex-shrink-0 ${tab === 'bhajan' ? 'bg-yellow-400 text-gray-900' : 'bg-white/10 text-white/70 hover:bg-white/20'}`}>🕉️ Bhajan</button>
        </div>
      )}

      {!activeArtist && tab === 'trending' && (
        <div className="px-4 py-3 border-b border-white/10">
          <p className="text-white/50 text-xs font-bold uppercase tracking-wide mb-2">Trending searches</p>
          <div className="flex gap-2 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {TRENDING.map((t, i) => (
              <button key={i} onClick={() => { setQuery(t); searchSongs(t); }} className="flex-shrink-0 bg-white/10 hover:bg-white/20 text-white text-sm font-bold px-3.5 py-1.5 rounded-full transition-colors">
                {t}
              </button>
            ))}
          </div>
        </div>
      )}

      {!activeArtist && languageTab && (
        <div className="px-2 py-2 border-b border-white/10 flex-1 overflow-y-auto">
          <p className="text-white/50 text-xs font-bold uppercase tracking-wide px-3 py-2">{languageTab.emoji} {languageTab.label} artists</p>
          {languageTab.artists.map((artist, i) => (
            <button key={i} onClick={() => openArtist(artist)} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 active:bg-white/10 transition-colors rounded-xl">
              <div className="w-11 h-11 rounded-full bg-white/10 text-yellow-400 flex items-center justify-center font-black text-lg flex-shrink-0">
                {artist.charAt(0)}
              </div>
              <div className="flex-1 min-w-0 text-left">
                <p className="text-white font-bold text-sm truncate">{artist}</p>
              </div>
              <ChevronLeft className="w-5 h-5 text-white/30 rotate-180 flex-shrink-0" />
            </button>
          ))}
        </div>
      )}

      {!activeArtist && tab === 'bhajan' && (
        <div className="px-2 py-2 border-b border-white/10 flex-1 overflow-y-auto">
          <p className="text-white/50 text-xs font-bold uppercase tracking-wide px-3 py-2">🕉️ Bhajan · Devtas</p>
          {BHAJAN_DEVTAS.map((bhajan, i) => (
            <button key={i} onClick={() => openArtist(bhajan)} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 active:bg-white/10 transition-colors rounded-xl">
              <div className="w-11 h-11 rounded-full bg-white/10 text-yellow-400 flex items-center justify-center text-xl flex-shrink-0">
                🕉️
              </div>
              <div className="flex-1 min-w-0 text-left">
                <p className="text-white font-bold text-sm truncate">{bhajan}</p>
              </div>
              <ChevronLeft className="w-5 h-5 text-white/30 rotate-180 flex-shrink-0" />
            </button>
          ))}
        </div>
      )}

      {activeArtist && (
        <div className="px-4 py-3 border-b border-white/10">
          <p className="text-white font-bold">{activeArtist}</p>
          <p className="text-white/50 text-xs">All songs</p>
        </div>
      )}

      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="py-16 flex flex-col items-center gap-3 text-white/60"><Loader2 className="w-8 h-8 animate-spin" /><p className="text-sm font-bold">Loading songs...</p></div>
        ) : error ? (
          <div className="py-16 text-center text-red-400 font-bold">{error}</div>
        ) : activeArtist && results.length === 0 ? (
          <div className="py-16 text-center text-white/40 font-bold">No songs found for this artist</div>
        ) : results.length === 0 ? (
          <div className="py-16 text-center text-white/40 font-bold">Search a song above ☝️</div>
        ) : (
          results.map((song, i) => (
            <div key={song.trackId || i} className="flex items-center gap-3 px-4 py-2.5 hover:bg-white/5 active:bg-white/10 transition-colors">
              <button onClick={() => togglePlay(song.previewUrl)} className="w-11 h-11 rounded-full bg-white/10 hover:bg-yellow-400 hover:text-gray-900 text-white flex items-center justify-center flex-shrink-0 active:scale-90 transition-all">
                {playingUrl === song.previewUrl ? <Pause className="w-5 h-5" fill="currentColor" /> : <Play className="w-5 h-5 ml-0.5" fill="currentColor" />}
              </button>
              {song.artworkUrl60 && (
                <img src={song.artworkUrl60} alt="" className="w-11 h-11 rounded-lg object-cover flex-shrink-0 bg-white/10" />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-white font-bold text-sm truncate">{song.trackName}</p>
                <p className="text-white/50 text-xs truncate">{song.artistName} · {song.collectionName || song.primaryGenreName}</p>
              </div>
              <button onClick={() => openCrop(song)} className="text-gray-900 font-black text-sm bg-yellow-400 hover:bg-yellow-500 active:scale-95 px-4 py-2 rounded-full transition-all flex-shrink-0">
                Add
              </button>
            </div>
          ))
        )}
      </div>
      </>
      )}
    </div>
  );
}
