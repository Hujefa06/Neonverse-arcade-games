import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Flame,
  Sparkles,
  Play,
  RotateCcw,
  Zap,
  TrendingUp,
  Gamepad2,
  Clock,
  Trophy,
  ArrowRight,
  ArrowUp,
  Brain,
  Smile,
  Timer,
  ChevronRight,
  Moon,
} from 'lucide-react';
import { GAME_REGISTRY, getAllGames, getGamesByCategory, getGamesByTag } from '../games/registry';
import { GameCard } from '../components/GameCard';
import { CategorySidebar } from '../components/CategorySidebar';
import { useStore } from '../store/useStore';
import { audioManager } from '../game-sdk/AudioManager';
import { GameCategory, GameMetadata } from '../types/game';

export const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { recentlyPlayed, favorites } = useStore();
  const [selectedCategory, setSelectedCategory] = useState<GameCategory>('All');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [showBackToTop, setShowBackToTop] = useState(false);

  // Weekly Leaderboard Season Countdown Timer (e.g. 3 days 14 hours remaining)
  const [timeLeft, setTimeLeft] = useState({ days: 3, hours: 14, minutes: 22, seconds: 45 });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev.seconds > 0) return { ...prev, seconds: prev.seconds - 1 };
        if (prev.minutes > 0) return { ...prev, minutes: 59, seconds: 59 };
        if (prev.hours > 0) return { ...prev, hours: prev.hours - 1, minutes: 59, seconds: 59 };
        if (prev.days > 0) return { ...prev, days: prev.days - 1, hours: 23, minutes: 59, seconds: 59 };
        return prev;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Back to Top scroll listener
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 400) {
        setShowBackToTop(true);
      } else {
        setShowBackToTop(false);
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    audioManager.playUiClick();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const allGames = getAllGames();
  const featuredFlagship = allGames.find((g) => g.id === 'typestrike-arena') || allGames[0];
  const coopFlagship = allGames.find((g) => g.id === 'tethered') || allGames[1];

  // Continue playing history
  const recentGameObjs = recentlyPlayed
    .map((r) => {
      const g = allGames.find((item) => item.id === r.gameId);
      return g ? { ...g, highScore: r.highScore, lastPlayedAt: r.lastPlayedAt } : null;
    })
    .filter(Boolean) as (GameMetadata & { highScore?: number; lastPlayedAt?: string })[];

  // Filtered games if specific category is selected
  const categoryFiltered =
    selectedCategory === 'All'
      ? allGames
      : allGames.filter((g) => g.category.toLowerCase() === selectedCategory.toLowerCase());

  // Mood Rows mapped from registry tags
  const fiveMinuteFunGames = allGames.filter((g) => g.tags.includes('5-Minute Fun')).slice(0, 6);
  const justRelaxGames = allGames.filter((g) => g.tags.includes('Just Relax')).slice(0, 6);
  const brainTrainingGames = allGames.filter((g) => g.tags.includes('Brain Training')).slice(0, 6);
  const funnyPhysicsGames = allGames.filter((g) => g.tags.includes('Funny Physics')).slice(0, 6);
  const deepProgressGames = allGames.filter((g) => g.tags.includes('Deep Progress')).slice(0, 6);

  // Top Season Players
  const seasonTopPlayers = [
    { rank: 1, name: 'CyberViper', score: 148200, badge: '👑' },
    { rank: 2, name: 'NeonKnight', score: 122400, badge: '🥈' },
    { rank: 3, name: 'QuantumDuo', score: 98500, badge: '🥉' },
    { rank: 4, name: 'SlimeMaster', score: 86200, badge: '⚡' },
    { rank: 5, name: 'PixelSamurai', score: 74100, badge: '🔥' },
  ];

  const categoriesMobileList: GameCategory[] = [
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
    <div className="relative flex gap-6 pb-20">
      {/* Collapsible Left Category Sidebar (Desktop Only) */}
      <CategorySidebar
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        selectedCategory={selectedCategory}
        onSelectCategory={(cat) => setSelectedCategory(cat)}
      />

      {/* Main Content Area */}
      <div className="flex-1 min-w-0 space-y-10">
        {/* Mobile Horizontal Category Bar */}
        <div className="lg:hidden flex items-center space-x-2 overflow-x-auto pb-2 scrollbar-none">
          {categoriesMobileList.map((cat) => (
            <button
              key={cat}
              onClick={() => {
                audioManager.playUiClick();
                setSelectedCategory(cat);
              }}
              className={`px-3 py-1.5 rounded-full text-xs font-mono whitespace-nowrap transition-all ${
                selectedCategory === cat
                  ? 'bg-neon-cyan text-black font-bold shadow-neon-cyan'
                  : 'bg-white/5 border border-white/10 text-slate-300 hover:text-white'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Hero Banner: Neon Arcade Cityscape with 2x Featured Card */}
        {selectedCategory === 'All' && (
          <section className="relative w-full rounded-3xl overflow-hidden glass-card border border-neon-cyan/40 shadow-neon-cyan p-6 sm:p-8 transition-all">
            <div
              className="absolute inset-0 bg-cover bg-center opacity-30 mix-blend-screen pointer-events-none"
              style={{ backgroundImage: `url('/assets/bg/hero-cityscape.webp')` }}
            />
            <div className="absolute -top-24 -right-24 w-96 h-96 bg-neon-cyan/20 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-neon-magenta/20 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-7 space-y-4">
                <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-neon-cyan/10 border border-neon-cyan/30 text-neon-cyan text-xs font-mono">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>CRAZYGAMES-STYLE DISCOVERY • 24 ORIGINAL TITLES</span>
                </div>

                <h1 className="font-orbitron font-black text-3xl sm:text-5xl text-white tracking-tight leading-tight">
                  NEON<span className="text-neon-cyan">VERSE</span> ARCADE
                </h1>

                <p className="text-slate-300 text-sm sm:text-base leading-relaxed max-w-xl">
                  Dive into 24 completely original browser arcade games. Zero install, instant guest play, real-time 2-player co-op, synthesized audio, and 60 FPS performance on mobile and desktop.
                </p>

                <div className="pt-2 flex flex-wrap gap-3">
                  <Link
                    to={`/play/${featuredFlagship.id}`}
                    onClick={() => audioManager.playUiClick()}
                    className="px-6 py-3 rounded-xl bg-neon-cyan hover:bg-neon-cyan/90 text-black font-orbitron font-extrabold text-xs sm:text-sm shadow-neon-cyan hover:scale-105 transition-all flex items-center space-x-2"
                  >
                    <Play className="w-4 h-4 fill-black" />
                    <span>PLAY {featuredFlagship.title.toUpperCase()}</span>
                  </Link>

                  <Link
                    to={`/play/tethered`}
                    onClick={() => audioManager.playUiClick()}
                    className="px-5 py-3 rounded-xl bg-neon-magenta/15 hover:bg-neon-magenta/25 text-white font-orbitron font-bold text-xs sm:text-sm border border-neon-magenta/50 shadow-neon-magenta hover:scale-105 transition-all flex items-center space-x-2"
                  >
                    <span>🔗 2-PLAYER CO-OP</span>
                  </Link>
                </div>
              </div>

              {/* Weekly Leaderboard Season Card on Hero Right */}
              <div className="lg:col-span-5">
                <div className="rounded-2xl glass-card border border-white/10 p-5 bg-[#0B0E1A]/90 backdrop-blur-xl shadow-xl space-y-4">
                  <div className="flex items-center justify-between border-b border-white/10 pb-3">
                    <div className="flex items-center space-x-2">
                      <Trophy className="w-4 h-4 text-neon-amber" />
                      <span className="font-orbitron font-bold text-xs uppercase text-white tracking-wider">
                        Season 1 Arena
                      </span>
                    </div>
                    <div className="flex items-center space-x-1 font-mono text-[11px] text-neon-lime">
                      <Timer className="w-3.5 h-3.5" />
                      <span>{timeLeft.days}d {timeLeft.hours}h {timeLeft.minutes}m</span>
                    </div>
                  </div>

                  {/* Top 5 Leaderboard Season Roster */}
                  <div className="space-y-2">
                    {seasonTopPlayers.map((player) => (
                      <div
                        key={player.rank}
                        className="flex items-center justify-between text-xs font-mono px-2.5 py-1.5 rounded-lg bg-white/5 border border-white/5"
                      >
                        <div className="flex items-center space-x-2">
                          <span className="text-sm">{player.badge}</span>
                          <span className="font-bold text-slate-200">{player.name}</span>
                        </div>
                        <span className="text-neon-cyan font-bold">
                          {player.score.toLocaleString()} XP
                        </span>
                      </div>
                    ))}
                  </div>

                  <Link
                    to="/leaderboard"
                    onClick={() => audioManager.playUiClick()}
                    className="w-full py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-neon-cyan font-mono text-xs text-center flex items-center justify-center space-x-1.5 transition-colors border border-white/10"
                  >
                    <span>View Global Leaderboards</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Continue Playing (Guest History Row) */}
        {recentGameObjs.length > 0 && selectedCategory === 'All' && (
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4 text-neon-lime" />
                <h2 className="font-orbitron font-bold text-lg text-white">Continue Playing</h2>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {recentGameObjs.map((game) => (
                <GameCard key={game.id} game={game} />
              ))}
            </div>
          </section>
        )}

        {/* Dense CrazyGames Mixed-Grid: Featured & Trending Showcase */}
        {selectedCategory === 'All' && (
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Flame className="w-5 h-5 text-neon-magenta" />
                <h2 className="font-orbitron font-bold text-xl text-white">Trending Now</h2>
              </div>
              <button
                onClick={() => setSelectedCategory('Action')}
                className="text-xs font-mono text-neon-cyan hover:underline flex items-center space-x-1"
              >
                <span>All Games →</span>
              </button>
            </div>

            {/* CrazyGames Dense Grid with 2x Featured Tile */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {/* 2x Tile for Flagship TypeStrike Arena */}
              <div className="col-span-2 sm:col-span-2 row-span-2">
                <GameCard game={featuredFlagship} featured={true} />
              </div>

              {/* Adjacent dense game tiles */}
              {allGames.slice(1, 9).map((game) => (
                <div key={game.id} className="col-span-1">
                  <GameCard game={game} />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Mood Row 1: 5-Minute Fun ⚡ */}
        {selectedCategory === 'All' && (
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Zap className="w-4 h-4 text-neon-cyan" />
                <h2 className="font-orbitron font-bold text-lg text-white">5-Minute Fun</h2>
              </div>
              <button
                onClick={() => setSelectedCategory('Action')}
                className="text-xs font-mono text-slate-400 hover:text-neon-cyan flex items-center space-x-1"
              >
                <span>All 5-Minute Games →</span>
              </button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {fiveMinuteFunGames.map((game) => (
                <GameCard key={game.id} game={game} />
              ))}
            </div>
          </section>
        )}

        {/* Mood Row 2: Just Relax 🧘 */}
        {selectedCategory === 'All' && (
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Moon className="w-4 h-4 text-neon-lime" />
                <h2 className="font-orbitron font-bold text-lg text-white">Just Relax & Chill</h2>
              </div>
              <button
                onClick={() => setSelectedCategory('Chill/Aesthetic')}
                className="text-xs font-mono text-slate-400 hover:text-neon-lime flex items-center space-x-1"
              >
                <span>All Chill Games →</span>
              </button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {justRelaxGames.map((game) => (
                <GameCard key={game.id} game={game} />
              ))}
            </div>
          </section>
        )}

        {/* Mood Row 3: Brain Training 🧠 */}
        {selectedCategory === 'All' && (
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Brain className="w-4 h-4 text-neon-violet" />
                <h2 className="font-orbitron font-bold text-lg text-white">Brain Training & Logic</h2>
              </div>
              <button
                onClick={() => setSelectedCategory('Puzzle')}
                className="text-xs font-mono text-slate-400 hover:text-neon-violet flex items-center space-x-1"
              >
                <span>All Puzzle Games →</span>
              </button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {brainTrainingGames.map((game) => (
                <GameCard key={game.id} game={game} />
              ))}
            </div>
          </section>
        )}

        {/* Mood Row 4: Funny Physics 🤪 */}
        {selectedCategory === 'All' && (
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Smile className="w-4 h-4 text-neon-amber" />
                <h2 className="font-orbitron font-bold text-lg text-white">Funny Physics Chaos</h2>
              </div>
              <button
                onClick={() => setSelectedCategory('Funny Physics')}
                className="text-xs font-mono text-slate-400 hover:text-neon-amber flex items-center space-x-1"
              >
                <span>All Physics Games →</span>
              </button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {funnyPhysicsGames.map((game) => (
                <GameCard key={game.id} game={game} />
              ))}
            </div>
          </section>
        )}

        {/* Complete Filtered Category Grid View */}
        <section className="space-y-6 pt-4">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div className="flex items-center space-x-2">
              <Gamepad2 className="w-5 h-5 text-neon-cyan" />
              <h2 className="font-orbitron font-bold text-xl text-white tracking-wide">
                {selectedCategory === 'All' ? 'All 24 Arcade Games' : `${selectedCategory} Games`}
              </h2>
            </div>
            <span className="text-xs font-mono text-slate-400">
              {categoryFiltered.length} Titles Available
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {categoryFiltered.map((game) => (
              <GameCard key={game.id} game={game} />
            ))}
          </div>
        </section>
      </div>

      {/* Floating Back to Top Button */}
      {showBackToTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-6 right-6 z-50 p-3 rounded-full bg-neon-cyan text-black shadow-neon-cyan hover:scale-110 active:scale-95 transition-all flex items-center justify-center font-bold"
          title="Back to Top"
        >
          <ArrowUp className="w-5 h-5 stroke-[2.5]" />
        </button>
      )}
    </div>
  );
};
