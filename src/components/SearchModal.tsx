import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, Gamepad2, ArrowRight } from 'lucide-react';
import { GAME_REGISTRY } from '../games/registry';
import { useStore } from '../store/useStore';
import { audioManager } from '../game-sdk/AudioManager';

export const SearchModal: React.FC = () => {
  const navigate = useNavigate();
  const { isSearchOpen, setSearchOpen } = useStore();
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isSearchOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
    }
  }, [isSearchOpen]);

  // Escape key handler
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isSearchOpen) {
        setSearchOpen(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isSearchOpen, setSearchOpen]);

  if (!isSearchOpen) return null;

  const filtered = GAME_REGISTRY.filter((g) => {
    const q = query.toLowerCase();
    return (
      g.title.toLowerCase().includes(q) ||
      g.category.toLowerCase().includes(q) ||
      g.tagline.toLowerCase().includes(q) ||
      g.description.toLowerCase().includes(q)
    );
  });

  const handleSelectGame = (gameId: string) => {
    audioManager.playUiClick();
    setSearchOpen(false);
    navigate(`/play/${gameId}`);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-start justify-center pt-20 px-4">
      <div className="relative w-full max-w-xl bg-[#0B0E1A] border border-neon-cyan/40 rounded-2xl shadow-neon-cyan overflow-hidden animate-fadeIn">
        {/* Search Input Bar */}
        <div className="p-4 flex items-center space-x-3 border-b border-white/10">
          <Search className="w-5 h-5 text-neon-cyan flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search 24 original games (e.g. TypeStrike, Tethered, runner, co-op)..."
            className="w-full bg-transparent text-sm text-white focus:outline-none placeholder-slate-500 font-sans"
          />
          <button
            onClick={() => setSearchOpen(false)}
            className="p-1 rounded-lg text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Results List */}
        <div className="max-h-80 overflow-y-auto p-2 divide-y divide-white/5">
          {filtered.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-sm">
              No games matched "<span className="text-neon-cyan">{query}</span>"
            </div>
          ) : (
            filtered.map((game) => (
              <div
                key={game.id}
                onClick={() => handleSelectGame(game.id)}
                className="p-3 rounded-xl hover:bg-white/5 cursor-pointer flex items-center justify-between group transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">{game.iconEmoji}</span>
                  <div>
                    <div className="font-orbitron font-bold text-sm text-white group-hover:text-neon-cyan transition-colors">
                      {game.title}
                    </div>
                    <div className="text-xs text-slate-400 truncate max-w-xs sm:max-w-md">
                      {game.tagline}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-[10px] font-mono text-neon-magenta border border-neon-magenta/30 px-2 py-0.5 rounded-full">
                    {game.category}
                  </span>
                  <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-neon-cyan transition-colors" />
                </div>
              </div>
            ))
          )}
        </div>

        {/* Quick Footer */}
        <div className="p-3 bg-black/40 border-t border-white/5 text-[11px] text-slate-400 flex justify-between items-center px-4 font-mono">
          <span>{filtered.length} games found</span>
          <span>ESC to close</span>
        </div>
      </div>
    </div>
  );
};
