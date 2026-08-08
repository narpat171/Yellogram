import React, { useState } from 'react';
import { X, Check, Palette } from 'lucide-react';

export const CHAT_THEMES = [
  { id: 'yellow', name: 'Sunny', bg: 'linear-gradient(160deg, #fefce8 0%, #fef08a 100%)' },
  { id: 'sunset', name: 'Sunset', bg: 'linear-gradient(160deg, #ffedd5 0%, #fb7185 100%)' },
  { id: 'ocean', name: 'Ocean', bg: 'linear-gradient(160deg, #ecfeff 0%, #38bdf8 100%)' },
  { id: 'forest', name: 'Forest', bg: 'linear-gradient(160deg, #ecfdf5 0%, #34d399 100%)' },
  { id: 'lavender', name: 'Lavender', bg: 'linear-gradient(160deg, #f5f3ff 0%, #a78bfa 100%)' },
  { id: 'midnight', name: 'Midnight', bg: 'linear-gradient(160deg, #1e293b 0%, #0f172a 100%)' },
  { id: 'peach', name: 'Peach', bg: 'linear-gradient(160deg, #fff7ed 0%, #fdba74 100%)' },
  { id: 'mint', name: 'Mint', bg: 'linear-gradient(160deg, #f0fdf4 0%, #4ade80 100%)' },
  { id: 'rose', name: 'Rose', bg: 'linear-gradient(160deg, #fff1f2 0%, #fb7185 100%)' },
  { id: 'gold', name: 'Gold', bg: 'linear-gradient(160deg, #fefce8 0%, #facc15 100%)' },
  { id: 'sky', name: 'Sky', bg: 'linear-gradient(160deg, #f0f9ff 0%, #7dd3fc 100%)' },
  { id: 'violet', name: 'Violet', bg: 'linear-gradient(160deg, #faf5ff 0%, #8b5cf6 100%)' },
  { id: 'berry', name: 'Berry', bg: 'linear-gradient(160deg, #fdf4ff 0%, #e879f9 100%)' },
  { id: 'emerald', name: 'Emerald', bg: 'linear-gradient(160deg, #ecfdf5 0%, #10b981 100%)' },
  { id: 'charcoal', name: 'Charcoal', bg: 'linear-gradient(160deg, #334155 0%, #1e293b 100%)' },
  { id: 'sunrise', name: 'Sunrise', bg: 'linear-gradient(160deg, #fefce8 0%, #f59e0b 100%)' },
  { id: 'candy', name: 'Candy', bg: 'linear-gradient(160deg, #fdf2f8 0%, #f472b6 100%)' },
  { id: 'slate', name: 'Slate', bg: 'linear-gradient(160deg, #f8fafc 0%, #94a3b8 100%)' },
  { id: 'tropical', name: 'Tropical', bg: 'linear-gradient(160deg, #ecfeff 0%, #2dd4bf 100%)' },
  { id: 'coral', name: 'Coral', bg: 'linear-gradient(160deg, #fff7ed 0%, #f97316 100%)' },
];

export default function ChatTheme({ open, currentThemeId, onApply, onClose }) {
  const [selected, setSelected] = useState(currentThemeId || 'yellow');

  if (!open) return null;

  const selectedTheme = CHAT_THEMES.find(t => t.id === selected) || CHAT_THEMES[0];

  return (
    <div className="fixed inset-0 z-[150] flex">
      {/* Background fade */}
      <div className="absolute inset-0 bg-black/50 animate-in fade-in" onClick={onClose} />

      {/* 📄 SIDE PAGE — right se slide-in */}
      <div className="absolute right-0 top-0 bottom-0 w-full max-w-md bg-white shadow-2xl flex flex-col animate-in slide-in-from-right-full duration-300">
        {/* Header */}
        <div className="bg-yellow-400 px-4 py-4 flex items-center justify-between border-b border-yellow-500 flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <button onClick={onClose} className="p-1 hover:bg-yellow-500 rounded-full transition-colors">
              <X className="w-6 h-6 text-gray-900" />
            </button>
            <Palette className="w-6 h-6 text-gray-900" />
            <h2 className="text-lg font-black text-gray-900">Chat Theme</h2>
          </div>
        </div>

        {/* Body */}
        <div className="p-4 flex-1 overflow-y-auto min-h-0">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">Select a background</p>
          <div className="grid grid-cols-4 gap-3">
            {CHAT_THEMES.map(theme => (
              <button
                key={theme.id}
                onClick={() => setSelected(theme.id)}
                className={`relative rounded-xl aspect-square flex items-center justify-center shadow-sm transition-all active:scale-95 ${selected === theme.id ? 'ring-[3px] ring-gray-900 ring-offset-2' : 'hover:scale-105'}`}
                style={{ background: theme.bg }}
              >
                {selected === theme.id && (
                  <span className="w-6 h-6 rounded-full bg-gray-900 text-yellow-400 flex items-center justify-center">
                    <Check className="w-4 h-4" strokeWidth={3} />
                  </span>
                )}
              </button>
            ))}
          </div>
          <p className="mt-3 text-sm font-bold text-gray-900">Selected: {selectedTheme.name}</p>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-100 flex-shrink-0">
          <button
            onClick={() => onApply(selectedTheme)}
            className="w-full bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-black py-3.5 rounded-2xl shadow-md active:scale-95 transition-all"
          >
            Apply Theme
          </button>
        </div>
      </div>
    </div>
  );
}
