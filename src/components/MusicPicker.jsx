import React, { useEffect, useRef, useState } from 'react';
import { Search, X, Play, Pause, Loader2, ChevronLeft, Check, Square } from 'lucide-react';

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

  const cropAreaRef = useRef(null);
  const timelineRef = useRef(null);
  const draggingRef = useRef(false);

  const setCropFromElement = (el, clientX) => {
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
    setCropStart(Math.round(ratio * 28 * 10) / 10);
    if (audioRef.current && !audioRef.current.paused) {
      audioRef.current.pause();
      audioRef.current.src = '';
      setPlayingUrl('');
    }
  };

  const startDrag = e => {
    e.preventDefault();
    draggingRef.current = true;
    e.currentTarget.setPointerCapture?.(e.pointerId);
    setCropFromElement(e.currentTarget, e.clientX);
  };
  const moveDrag = e => {
    if (!draggingRef.current) return;
    setCropFromElement(e.currentTarget, e.clientX);
  };
  const endDrag = () => { draggingRef.current = false; };

  const closeCrop = () => { setCropSong(null); setPlayingUrl(''); draggingRef.current = false; };

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

  const cropBars = cropSong ? (() => {
    let seed = (Number(cropSong.trackId || 7) * 2654435761) % 233280 || 7;
    return Array.from({ length: 84 }, () => {
      seed = (seed * 9301 + 49297) % 233280;
      return 0.3 + (seed / 233280) * 0.7;
    });
  })() : [];

  const CROP_BG = 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=900&q=80';

  const languageTab = LANGUAGE_TABS.find(t => t.id === tab);

  return (
    <div className="absolute inset-0 bg-[#121212]/95 z-[100] flex flex-col animate-in fade-in duration-200">
      {cropSong ? (
        <div className="relative flex-1 flex flex-col overflow-hidden">
          <img src={CROP_BG} alt="" className="absolute inset-0 w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black/45" />

          <div className="relative z-10 flex flex-col h-full">
            <div className="flex items-center justify-between px-4 pt-4">
              <button onClick={closeCrop} className="w-10 h-10 rounded-full bg-black/30 backdrop-blur-md border border-white/20 flex items-center justify-center text-white active:scale-90 transition-transform" aria-label="Cancel">
                <X className="w-5 h-5" />
              </button>
              <button onClick={handleCropDone} className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-gray-900 shadow-lg active:scale-90 transition-transform" aria-label="Done">
                <Check className="w-5 h-5" strokeWidth={3} />
              </button>
            </div>

            <div className="flex-1" />

            <div className="px-4 pb-7 space-y-5">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-black/40 backdrop-blur-md border border-white/25 flex items-center justify-center text-white font-black text-lg">
                  {Math.max(0, Math.round(30 - cropStart))}
                </div>
                <div
                  ref={timelineRef}
                  onPointerDown={startDrag}
                  onPointerMove={moveDrag}
                  onPointerUp={endDrag}
                  onPointerCancel={endDrag}
                  className="flex-1 relative h-10 flex items-center select-none touch-none cursor-ew-resize"
                >
                  <div className="absolute left-0 right-0 top-1/2 h-px bg-white/30" />
                  <div className="absolute left-0 top-1/2 h-[2.5px] -translate-y-1/2 bg-yellow-400 rounded-full" style={{ width: `${(cropStart / 30) * 100}%` }} />
                  {[0.25, 0.5, 0.75].map(m => (
                    <span key={m} className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 w-[5px] h-[5px] rounded-full bg-pink-400" style={{ left: `${m * 100}%` }} />
                  ))}
                  <div className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 w-[18px] h-[18px] rounded-full bg-yellow-400 shadow-md ring-2 ring-white/80" style={{ left: `${(cropStart / 30) * 100}%` }} />
                </div>
                <button onClick={toggleCropPlay} className="w-12 h-12 rounded-full bg-white flex items-center justify-center text-gray-900 shadow-lg active:scale-90 transition-transform" aria-label="Play preview">
                  {playingUrl ? <Square className="w-4 h-4 fill-current" /> : <Play className="w-5 h-5 ml-0.5 fill-current" />}
                </button>
              </div>

              <div
                ref={cropAreaRef}
                onPointerDown={startDrag}
                onPointerMove={moveDrag}
                onPointerUp={endDrag}
                onPointerLeave={endDrag}
                onPointerCancel={endDrag}
                className="relative h-24 select-none touch-none cursor-ew-resize"
              >
                <div
                  className="absolute inset-y-1 bg-yellow-400/70 border-2 border-white/60 shadow-xl pointer-events-none"
                  style={{ left: `${(cropStart / 30) * 100}%`, width: `${((30 - cropStart) / 30) * 100}%` }}
                />
                <div className="absolute inset-0 flex items-end gap-[3px] px-1 pb-1.5">
                  {cropBars.map((h, i) => {
                    const t = (i / cropBars.length) * 30;
                    const inClip = t >= cropStart;
                    const isHighlight = inClip && (i + Math.floor(Number(cropSong.trackId || 0))) % 7 === 0;
                    return (
                      <div
                        key={i}
                        className="flex-1 rounded-full transition-colors"
                        style={{ height: `${h * 100}%`, background: isHighlight ? '#fb7185' : inClip ? 'rgba(255,255,255,0.92)' : 'rgba(255,255,255,0.28)' }}
                      />
                    );
                  })}
                </div>
              </div>
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
