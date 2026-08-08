import React, { useEffect, useRef, useState } from 'react';
import { Search, X, Play, Pause, Loader2 } from 'lucide-react';

const TRENDING = [
  'Dhanda Nyoliwala', 'Masoom Sharma', 'Amanraj Gill', 'KD Desi Rock',
  'Arijit Singh', 'Badshah', 'AR Rahman', 'Sidhu Moose Wala', 'Anirudh Ravichander',
  'Diljit Dosanjh', 'Taylor Swift', 'Shreya Ghoshal', 'Dua Lipa', 'Neha Kakkar',
  'Ed Sheeran', 'Jubin Nautiyal', 'The Weeknd', 'Karan Aujla', 'Pritam',
];

export default function MusicPicker({ onSelect, onClose }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState('');
  const [playingUrl, setPlayingUrl] = useState('');
  const audioRef = useRef(null);

  useEffect(() => {
    return () => { if (audioRef.current) { audioRef.current.pause(); audioRef.current.src = ''; } };
  }, []);

  const searchSongs = async term => {
    if (!term.trim()) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(term)}&media=music&limit=25&country=IN`);
      const data = await res.json();
      setResults((data.results || []).filter(s => s.previewUrl));
    } catch (err) {
      setError('Songs load nahi hue. Internet check karo.');
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async e => {
    e.preventDefault();
    if (!query.trim()) return;
    setSearching(true);
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

  return (
    <div className="absolute inset-0 bg-[#121212]/95 z-[100] flex flex-col animate-in fade-in duration-200">
      <div className="flex items-center gap-3 px-4 py-4 border-b border-white/10">
        <button onClick={onClose} className="text-white hover:text-gray-300 active:scale-90 transition-transform"><X className="w-7 h-7" /></button>
        <div className="flex-1 flex items-center gap-2 bg-white/10 rounded-full px-4 py-2.5">
          <Search className="w-5 h-5 text-white/60 flex-shrink-0" />
          <input
            autoFocus
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

      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="py-16 flex flex-col items-center gap-3 text-white/60"><Loader2 className="w-8 h-8 animate-spin" /><p className="text-sm font-bold">Searching...</p></div>
        ) : error ? (
          <div className="py-16 text-center text-red-400 font-bold">{error}</div>
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
              <button onClick={() => onSelect(`${song.trackName} - ${song.artistName}`)} className="text-gray-900 font-black text-sm bg-yellow-400 hover:bg-yellow-500 active:scale-95 px-4 py-2 rounded-full transition-all flex-shrink-0">
                Add
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
