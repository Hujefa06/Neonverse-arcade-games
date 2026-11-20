import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  User,
  Award,
  Heart,
  ShieldCheck,
  Coins,
  Sparkles,
  Zap,
  LogOut,
  Edit2,
  Check,
} from 'lucide-react';
import { useStore } from '../store/useStore';
import { GAME_REGISTRY } from '../games/registry';
import { GameCard } from '../components/GameCard';
import { audioManager } from '../game-sdk/AudioManager';

export const ProfilePage: React.FC = () => {
  const { user, setUser, favorites, logoutUser, setAuthOpen } = useStore();

  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [newUsername, setNewUsername] = useState(user.username);

  const xpNeeded = user.level * 250;
  const progressPercent = Math.min(100, Math.round((user.xp / xpNeeded) * 100));

  const favGameObjs = favorites
    .map((id) => GAME_REGISTRY.find((g) => g.id === id))
    .filter(Boolean) as typeof GAME_REGISTRY;

  const avatars = [
    { id: 'cyber_ninja', label: 'Cyber Ninja', emoji: '🥷' },
    { id: 'neon_samurai', label: 'Neon Samurai', emoji: '⚔️' },
    { id: 'pixel_hacker', label: 'Pixel Hacker', emoji: '👾' },
    { id: 'astro_pilot', label: 'Astro Pilot', emoji: '🚀' },
  ];

  const handleSaveUsername = () => {
    if (newUsername.trim()) {
      setUser({ username: newUsername.trim() });
    }
    setIsEditingUsername(false);
    audioManager.playUiClick();
  };

  const achievementsList = [
    { title: 'First Blood', desc: 'Played your first game in Neonverse', unlocked: true, icon: '⚡' },
    { title: 'Typing Prodigy', desc: 'Achieved 80+ WPM in TypeStrike Arena', unlocked: user.xp > 200, icon: '⌨️' },
    { title: 'Combo Master', desc: 'Triggered a 5x Combo Ultimate', unlocked: user.level >= 2, icon: '💥' },
    { title: 'Co-Op Legend', desc: 'Completed a mission in Tethered', unlocked: user.level >= 3, icon: '🔗' },
    { title: 'Arcade Veteran', desc: 'Reached Level 5 in Neonverse', unlocked: user.level >= 5, icon: '👑' },
  ];

  return (
    <div className="space-y-10 pb-16">
      {/* Profile Header Hero Card */}
      <div className="relative rounded-3xl glass-card border border-neon-cyan/40 p-6 sm:p-8 overflow-hidden shadow-neon-cyan">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
          {/* Avatar */}
          <div className="relative group">
            <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-neon-cyan/30 to-neon-magenta/30 border-2 border-neon-cyan flex items-center justify-center text-5xl shadow-neon-cyan">
              {avatars.find((a) => a.id === user.avatar)?.emoji || '🥷'}
            </div>
          </div>

          {/* User Meta */}
          <div className="flex-1 text-center sm:text-left space-y-2">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 justify-between">
              <div className="flex items-center justify-center sm:justify-start space-x-2">
                {isEditingUsername ? (
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={newUsername}
                      onChange={(e) => setNewUsername(e.target.value)}
                      className="bg-black/40 border border-neon-cyan rounded-lg px-2 py-1 text-sm text-white font-orbitron"
                    />
                    <button
                      onClick={handleSaveUsername}
                      className="p-1 rounded bg-neon-cyan text-black"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <>
                    <h1 className="font-orbitron font-extrabold text-2xl text-white">
                      {user.username}
                    </h1>
                    <button
                      onClick={() => setIsEditingUsername(true)}
                      className="text-slate-400 hover:text-neon-cyan p-1"
                      title="Edit Username"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                  </>
                )}
              </div>

              {/* Status Badge */}
              <div>
                {user.isGuest ? (
                  <button
                    onClick={() => setAuthOpen(true)}
                    className="px-3 py-1 rounded-full bg-neon-magenta/20 border border-neon-magenta text-neon-magenta text-xs font-mono flex items-center space-x-1.5 hover:scale-105 transition-transform"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Guest Mode • Upgrade to Cloud Save</span>
                  </button>
                ) : (
                  <div className="px-3 py-1 rounded-full bg-neon-lime/20 border border-neon-lime text-neon-lime text-xs font-mono flex items-center space-x-1.5">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Cloud Sync Active</span>
                  </div>
                )}
              </div>
            </div>

            {/* Level & XP Progress Bar */}
            <div className="pt-2 max-w-lg space-y-1.5">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-neon-cyan font-bold">LEVEL {user.level}</span>
                <span className="text-slate-400">
                  {user.xp} / {xpNeeded} XP ({progressPercent}%)
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-neon-cyan to-neon-magenta rounded-full transition-all duration-500"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>

            {/* Currency & Stats pills */}
            <div className="flex flex-wrap items-center gap-4 pt-3 text-xs font-mono">
              <div className="flex items-center space-x-1.5 text-neon-amber">
                <Coins className="w-4 h-4" />
                <span className="font-bold">{user.coins} COINS</span>
              </div>
              <div className="flex items-center space-x-1.5 text-neon-cyan">
                <Award className="w-4 h-4" />
                <span>{achievementsList.filter((a) => a.unlocked).length} Achievements</span>
              </div>
              <div className="flex items-center space-x-1.5 text-neon-magenta">
                <Heart className="w-4 h-4" />
                <span>{favorites.length} Favorites</span>
              </div>
            </div>
          </div>
        </div>

        {/* Change Avatar selector */}
        <div className="mt-6 pt-6 border-t border-white/10">
          <div className="text-xs font-mono text-slate-400 uppercase mb-3">
            Select Arcade Avatar
          </div>
          <div className="flex gap-3">
            {avatars.map((av) => (
              <button
                key={av.id}
                onClick={() => {
                  audioManager.playUiClick();
                  setUser({ avatar: av.id });
                }}
                className={`p-3 rounded-xl border flex items-center space-x-2 text-xs transition-all ${
                  user.avatar === av.id
                    ? 'bg-neon-cyan/20 border-neon-cyan text-white shadow-neon-cyan'
                    : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
                }`}
              >
                <span className="text-xl">{av.emoji}</span>
                <span className="font-medium hidden sm:inline">{av.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Achievements Showcase */}
      <section className="space-y-4">
        <div className="flex items-center space-x-2">
          <Award className="w-5 h-5 text-neon-cyan" />
          <h2 className="font-orbitron font-bold text-xl text-white">Achievements</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {achievementsList.map((ach, idx) => (
            <div
              key={idx}
              className={`p-4 rounded-2xl glass-card border transition-all ${
                ach.unlocked
                  ? 'border-neon-cyan/40 shadow-neon-cyan'
                  : 'border-white/5 opacity-50'
              }`}
            >
              <div className="flex items-center space-x-3">
                <div className="text-2xl">{ach.icon}</div>
                <div>
                  <div className="font-orbitron font-bold text-sm text-white">
                    {ach.title}
                  </div>
                  <div className="text-xs text-slate-400">{ach.desc}</div>
                </div>
              </div>
              <div className="mt-3 text-right">
                <span
                  className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-full ${
                    ach.unlocked
                      ? 'bg-neon-cyan/20 text-neon-cyan border border-neon-cyan/30'
                      : 'bg-white/5 text-slate-500'
                  }`}
                >
                  {ach.unlocked ? 'UNLOCKED' : 'LOCKED'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Favorite Games */}
      <section className="space-y-4">
        <div className="flex items-center space-x-2">
          <Heart className="w-5 h-5 text-neon-magenta" />
          <h2 className="font-orbitron font-bold text-xl text-white">Favorite Games</h2>
        </div>
        {favGameObjs.length === 0 ? (
          <div className="p-8 text-center text-slate-400 glass-card rounded-2xl border border-white/10 text-xs">
            No favorite games saved yet. Click the heart icon on any game card to add it!
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {favGameObjs.map((game) => (
              <GameCard key={game.id} game={game} />
            ))}
          </div>
        )}
      </section>

      {/* Logout / Switch profile */}
      <div className="pt-6 border-t border-white/10 flex justify-end">
        <button
          onClick={() => {
            audioManager.playUiClick();
            logoutUser();
          }}
          className="px-4 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 text-xs font-mono flex items-center space-x-2 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span>Reset to Fresh Guest Session</span>
        </button>
      </div>
    </div>
  );
};
