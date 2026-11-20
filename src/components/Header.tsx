import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Gamepad2,
  Search,
  Settings,
  Volume2,
  VolumeX,
  User,
  Sparkles,
  Trophy,
  Dices,
} from 'lucide-react';
import { useStore } from '../store/useStore';
import { audioManager } from '../game-sdk/AudioManager';
import { GAME_REGISTRY } from '../games/registry';

export const Header: React.FC = () => {
  const navigate = useNavigate();
  const {
    audioSettings,
    toggleMute,
    user,
    setAuthOpen,
    setSettingsOpen,
    setSearchOpen,
  } = useStore();

  // Keyboard shortcut: '/' opens search modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.key === '/' &&
        !(e.target instanceof HTMLInputElement) &&
        !(e.target instanceof HTMLTextAreaElement)
      ) {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setSearchOpen]);

  // Random Game Picker
  const handleRandomGame = () => {
    audioManager.playUiClick();
    const randomIndex = Math.floor(Math.random() * GAME_REGISTRY.length);
    const randomGame = GAME_REGISTRY[randomIndex];
    navigate(`/play/${randomGame.id}`);
  };

  const categories = [
    'All',
    'Action',
    'Arcade',
    'Puzzle',
    'Typing',
    'Funny Physics',
    'Chill/Aesthetic',
    'Rhythm',
    '2-Player Co-op',
  ];

  return (
    <header className="sticky top-0 z-40 w-full bg-[#07080F]/80 backdrop-blur-md border-b border-white/10 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Brand Logo */}
        <Link
          to="/"
          onClick={() => audioManager.playUiClick()}
          className="flex items-center space-x-2.5 group flex-shrink-0"
        >
          <div className="w-10 h-10 rounded-xl bg-neon-surface border border-neon-cyan/40 flex items-center justify-center shadow-neon-cyan group-hover:scale-105 transition-all">
            <Gamepad2 className="w-6 h-6 text-neon-cyan animate-pulse" />
          </div>
          <div>
            <div className="font-orbitron font-black text-lg tracking-wider text-white group-hover:text-neon-cyan transition-colors">
              NEON<span className="text-neon-magenta">VERSE</span>
            </div>
            <div className="text-[10px] tracking-widest text-slate-400 font-mono -mt-1">
              ARCADE PLATFORM
            </div>
          </div>
        </Link>

        {/* Search Bar / Trigger */}
        <button
          onClick={() => {
            audioManager.playUiClick();
            setSearchOpen(true);
          }}
          className="hidden md:flex items-center justify-between w-64 lg:w-80 px-3.5 py-1.5 rounded-xl bg-white/5 border border-white/10 hover:border-neon-cyan/40 text-slate-400 hover:text-white transition-all text-xs"
        >
          <div className="flex items-center space-x-2">
            <Search className="w-3.5 h-3.5 text-neon-cyan" />
            <span>Search 24 original games...</span>
          </div>
          <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-[10px] font-mono text-slate-300 border border-white/10">
            /
          </kbd>
        </button>

        {/* Right Action Controls */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          {/* Random Game 🎲 Button */}
          <button
            onClick={handleRandomGame}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-neon-cyan/10 hover:bg-neon-cyan/20 border border-neon-cyan/30 hover:border-neon-cyan/60 text-neon-cyan transition-all text-xs font-orbitron font-bold shadow-xs hover:scale-105 active:scale-95"
            title="Play a Random Game"
          >
            <Dices className="w-4 h-4 text-neon-cyan animate-pulse" />
            <span className="hidden sm:inline">RANDOM</span>
          </button>

          {/* Mobile Search Button */}
          <button
            onClick={() => {
              audioManager.playUiClick();
              setSearchOpen(true);
            }}
            className="md:hidden p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white"
            title="Search"
          >
            <Search className="w-4 h-4" />
          </button>

          {/* Leaderboards link */}
          <Link
            to="/leaderboard"
            onClick={() => audioManager.playUiClick()}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-neon-cyan transition-colors hidden sm:flex items-center space-x-1"
            title="Global Leaderboards"
          >
            <Trophy className="w-4 h-4 text-neon-amber" />
          </Link>

          {/* Quick Sound Mute Toggle */}
          <button
            onClick={() => {
              audioManager.playUiClick();
              toggleMute();
            }}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-colors"
            title={audioSettings.isMuted ? 'Unmute Audio' : 'Mute Audio'}
          >
            {audioSettings.isMuted ? (
              <VolumeX className="w-4 h-4 text-neon-magenta" />
            ) : (
              <Volume2 className="w-4 h-4 text-neon-cyan" />
            )}
          </button>

          {/* Settings Modal Trigger */}
          <button
            onClick={() => {
              audioManager.playUiClick();
              setSettingsOpen(true);
            }}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-colors"
            title="Settings"
          >
            <Settings className="w-4 h-4" />
          </button>

          {/* Guest / User Profile Pill */}
          <div
            onClick={() => {
              audioManager.playUiClick();
              if (user.isGuest) {
                setAuthOpen(true);
              } else {
                navigate('/profile');
              }
            }}
            className="flex items-center space-x-2 pl-2 pr-3 py-1 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-neon-cyan/50 cursor-pointer transition-all"
          >
            <div className="w-7 h-7 rounded-lg bg-neon-cyan/20 border border-neon-cyan/50 flex items-center justify-center text-xs font-bold font-orbitron text-neon-cyan">
              L{user.level}
            </div>
            <div className="text-left hidden sm:block">
              <div className="text-xs font-semibold text-slate-200 leading-tight">
                {user.username}
              </div>
              <div className="text-[10px] text-neon-cyan/80 font-mono">
                {user.isGuest ? 'Guest (Save to Cloud)' : `${user.xp} XP`}
              </div>
            </div>
            {user.isGuest && (
              <Sparkles className="w-3.5 h-3.5 text-neon-magenta animate-pulse hidden xs:inline" />
            )}
          </div>
        </div>
      </div>

      {/* Category Horizontal Scrolling Navigation Bar */}
      <div className="w-full overflow-x-auto scrollbar-none px-4 sm:px-6 py-2 border-t border-white/5 bg-[#0B0E1A]/40 flex space-x-2">
        {categories.map((cat) => (
          <Link
            key={cat}
            to={cat === 'All' ? '/' : `/category/${encodeURIComponent(cat.toLowerCase())}`}
            onClick={() => audioManager.playUiClick()}
            className="whitespace-nowrap px-3 py-1 rounded-full text-xs font-medium text-slate-400 hover:text-neon-cyan bg-white/5 hover:bg-neon-cyan/10 border border-white/5 hover:border-neon-cyan/30 transition-all flex-shrink-0"
          >
            {cat}
          </Link>
        ))}
      </div>
    </header>
  );
};
