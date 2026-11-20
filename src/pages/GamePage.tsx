import React, { useEffect, useState, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Heart,
  Share2,
  Trophy,
  Gamepad2,
  CheckCircle2,
  Sparkles,
  ThumbsUp,
  ThumbsDown,
  Eye,
  Keyboard,
  Smartphone,
  ChevronDown,
  ChevronUp,
  HelpCircle,
} from 'lucide-react';
import { GAME_REGISTRY, getGame, getRelatedGames, getGameMountFunction } from '../games/registry';
import { GameShell } from '../game-sdk/GameShell';
import { GameCard } from '../components/GameCard';
import { useStore } from '../store/useStore';
import { audioManager } from '../game-sdk/AudioManager';
import { getAssetUrl } from '../utils/assetUrl';

export const GamePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<'info' | 'leaderboard'>('info');
  const [controlsTab, setControlsTab] = useState<'desktop' | 'mobile'>('desktop');
  const [isTheater, setIsTheater] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [leaderboardData, setLeaderboardData] = useState<any[]>([]);
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  // Likes / Dislikes state (persisted locally)
  const [userVote, setUserVote] = useState<'like' | 'dislike' | null>(null);
  const [likeCount, setLikeCount] = useState(1420);
  const [dislikeCount, setDislikeCount] = useState(18);

  const { favorites, toggleFavorite } = useStore();

  const game = useMemo(() => {
    return getGame(id || '') || GAME_REGISTRY.find((g) => g.id === id);
  }, [id]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setIsTheater(false);
    setUserVote(null);
    setShowFullDescription(false);
    setOpenFaqIndex(null);

    // Dynamic base like count based on game id hash
    if (game) {
      const hash = game.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
      setLikeCount(800 + (hash % 1200));
      setDislikeCount(10 + (hash % 25));

      // Fetch leaderboards for this game
      fetch(`/api/leaderboard?gameId=${game.id}&period=all-time`)
        .then((res) => res.json())
        .then((data) => {
          if (data.leaderboard && data.leaderboard.length > 0) {
            setLeaderboardData(data.leaderboard);
          } else {
            // Default sample top players
            setLeaderboardData([
              { username: 'CyberViper', score: 14200, levelReached: 10 },
              { username: 'NeonKnight', score: 11800, levelReached: 8 },
              { username: 'QuantumDuo', score: 9500, levelReached: 6 },
              { username: 'PixelMaster', score: 8100, levelReached: 5 },
            ]);
          }
        })
        .catch(() => {
          setLeaderboardData([
            { username: 'CyberViper', score: 14200, levelReached: 10 },
            { username: 'NeonKnight', score: 11800, levelReached: 8 },
          ]);
        });
    }
  }, [id, game]);

  if (!game) {
    return (
      <div className="p-16 text-center space-y-4">
        <h2 className="font-orbitron font-bold text-2xl text-white">Game Not Found</h2>
        <Link
          to="/"
          className="px-6 py-2 rounded-xl bg-neon-cyan text-black font-orbitron font-bold inline-block"
        >
          Return to Arcade
        </Link>
      </div>
    );
  }

  const isFav = favorites.includes(game.id);
  const mountFn = getGameMountFunction(game);
  const relatedGames = getRelatedGames(game.id, 4);

  const handleLike = () => {
    audioManager.playUiClick();
    if (userVote === 'like') {
      setUserVote(null);
      setLikeCount((c) => c - 1);
    } else {
      if (userVote === 'dislike') setDislikeCount((c) => c - 1);
      setUserVote('like');
      setLikeCount((c) => c + 1);
    }
  };

  const handleDislike = () => {
    audioManager.playUiClick();
    if (userVote === 'dislike') {
      setUserVote(null);
      setDislikeCount((c) => c - 1);
    } else {
      if (userVote === 'like') setLikeCount((c) => c - 1);
      setUserVote('dislike');
      setDislikeCount((c) => c + 1);
    }
  };

  const handleShare = () => {
    audioManager.playUiClick();
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const toggleFaq = (idx: number) => {
    audioManager.playUiClick();
    setOpenFaqIndex(openFaqIndex === idx ? null : idx);
  };

  const totalVotes = likeCount + dislikeCount;
  const ratingPercent = totalVotes > 0 ? Math.round((likeCount / totalVotes) * 100) : 98;

  return (
    <div className="relative space-y-8 pb-16">
      {/* Dynamic Game Background (blurred + darkened thumb) */}
      <div
        className="fixed inset-0 bg-cover bg-center filter blur-3xl opacity-15 pointer-events-none z-0 scale-110"
        style={{
          backgroundImage: `url('${getAssetUrl(game.assets?.thumb || `/assets/games/${game.id}/thumb.webp`)}')`,
        }}
      />

      {/* Top Breadcrumb & Actions Bar */}
      <div className="relative z-10 flex flex-wrap items-center justify-between gap-4">
        <Link
          to="/"
          onClick={() => audioManager.playUiClick()}
          className="inline-flex items-center space-x-1.5 text-xs text-slate-400 hover:text-neon-cyan font-mono"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>BACK TO ALL GAMES</span>
        </Link>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => {
              audioManager.playUiClick();
              toggleFavorite(game.id);
            }}
            className={`px-3 py-1.5 rounded-xl border text-xs flex items-center space-x-1.5 transition-all ${
              isFav
                ? 'bg-neon-magenta/20 border-neon-magenta text-neon-magenta shadow-neon-magenta'
                : 'bg-white/5 border-white/10 text-slate-300 hover:text-white'
            }`}
          >
            <Heart className={`w-3.5 h-3.5 ${isFav ? 'fill-neon-magenta' : ''}`} />
            <span>{isFav ? 'FAVORITED' : 'FAVORITE'}</span>
          </button>

          <button
            onClick={handleShare}
            className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 hover:border-neon-cyan/40 text-xs text-slate-300 hover:text-white flex items-center space-x-1.5 transition-all"
          >
            {copiedLink ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-neon-lime" />
                <span className="text-neon-lime font-mono">COPIED LINK</span>
              </>
            ) : (
              <>
                <Share2 className="w-3.5 h-3.5" />
                <span>SHARE</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* PLAYER AREA FIRST (Theater + Fullscreen Mode) */}
      <section className="w-full relative z-10">
        <GameShell
          game={game}
          onMountGame={mountFn}
          isTheaterMode={isTheater}
          onToggleTheater={() => setIsTheater(!isTheater)}
        />
      </section>

      {/* ACTION BAR: Likes, Rating %, Plays Count, and Tag Chips */}
      <section className="relative z-10 rounded-2xl glass-card border border-white/10 p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4 bg-[#0B0E1A]/80 backdrop-blur-xl">
        <div className="flex items-center space-x-4">
          {/* Like Button */}
          <button
            onClick={handleLike}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border text-xs font-mono transition-all ${
              userVote === 'like'
                ? 'bg-neon-cyan/20 border-neon-cyan text-neon-cyan shadow-neon-cyan'
                : 'bg-white/5 border-white/10 text-slate-300 hover:text-white hover:bg-white/10'
            }`}
          >
            <ThumbsUp className={`w-4 h-4 ${userVote === 'like' ? 'fill-neon-cyan' : ''}`} />
            <span>{likeCount}</span>
          </button>

          {/* Dislike Button */}
          <button
            onClick={handleDislike}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border text-xs font-mono transition-all ${
              userVote === 'dislike'
                ? 'bg-rose-500/20 border-rose-500 text-rose-400'
                : 'bg-white/5 border-white/10 text-slate-300 hover:text-white hover:bg-white/10'
            }`}
          >
            <ThumbsDown className={`w-4 h-4 ${userVote === 'dislike' ? 'fill-rose-500' : ''}`} />
            <span>{dislikeCount}</span>
          </button>

          {/* Rating Badge */}
          <div className="text-xs font-mono text-neon-lime flex items-center space-x-1">
            <span>★ {ratingPercent}%</span>
            <span className="text-slate-500 text-[10px]">({totalVotes} votes)</span>
          </div>

          {/* Play Count */}
          <div className="hidden sm:flex items-center space-x-1 text-xs font-mono text-slate-400">
            <Eye className="w-3.5 h-3.5 text-neon-cyan" />
            <span>24.8K Plays</span>
          </div>
        </div>

        {/* Tag Chips */}
        <div className="flex flex-wrap items-center gap-1.5">
          {game.tags.map((tag) => (
            <span
              key={tag}
              className="text-[11px] font-mono px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-slate-300"
            >
              #{tag}
            </span>
          ))}
        </div>
      </section>

      {/* MAIN TWO-COLUMN LAYOUT: Content Left & "Play Next" Right Rail */}
      <section className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Info, Controls, Gallery & FAQ */}
        <div className="lg:col-span-8 space-y-6">
          {/* Tab Navigation (Info & Controls vs Leaderboards) */}
          <div className="flex space-x-2 border-b border-white/10 pb-2">
            <button
              onClick={() => {
                audioManager.playUiClick();
                setActiveTab('info');
              }}
              className={`px-4 py-2 rounded-xl text-xs font-orbitron font-bold transition-all ${
                activeTab === 'info'
                  ? 'bg-neon-cyan/20 border border-neon-cyan/60 text-neon-cyan shadow-neon-cyan'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              ABOUT & CONTROLS
            </button>
            <button
              onClick={() => {
                audioManager.playUiClick();
                setActiveTab('leaderboard');
              }}
              className={`px-4 py-2 rounded-xl text-xs font-orbitron font-bold transition-all flex items-center space-x-1.5 ${
                activeTab === 'leaderboard'
                  ? 'bg-neon-amber/20 border border-neon-amber/60 text-neon-amber shadow-neon-amber'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Trophy className="w-3.5 h-3.5" />
              <span>LEADERBOARD</span>
            </button>
          </div>

          {activeTab === 'info' ? (
            <div className="space-y-6">
              {/* Expandable Game Description */}
              <div className="glass-card p-6 rounded-2xl border border-white/10 space-y-3 bg-[#0B0E1A]/80 backdrop-blur-xl">
                <h3 className="font-orbitron font-bold text-lg text-white">About {game.title}</h3>
                <p className={`text-slate-300 text-sm leading-relaxed ${showFullDescription ? '' : 'line-clamp-3'}`}>
                  {game.description}
                </p>
                <button
                  onClick={() => {
                    audioManager.playUiClick();
                    setShowFullDescription(!showFullDescription);
                  }}
                  className="text-xs font-mono text-neon-cyan hover:underline flex items-center space-x-1 pt-1"
                >
                  <span>{showFullDescription ? 'Show Less' : 'Show More'}</span>
                  {showFullDescription ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>
              </div>

              {/* How to Play Card */}
              <div className="glass-card p-6 rounded-2xl border border-white/10 space-y-4 bg-[#0B0E1A]/80 backdrop-blur-xl">
                <h3 className="font-orbitron font-bold text-sm text-white flex items-center space-x-2 uppercase tracking-wider">
                  <Sparkles className="w-4 h-4 text-neon-magenta" />
                  <span>How to Play</span>
                </h3>
                <ul className="space-y-2.5 text-xs text-slate-300">
                  {game.howToPlay.map((step, idx) => (
                    <li key={idx} className="flex items-start space-x-2.5">
                      <span className="w-5 h-5 rounded-full bg-neon-cyan/20 text-neon-cyan flex items-center justify-center font-mono font-bold text-[10px] flex-shrink-0">
                        {idx + 1}
                      </span>
                      <span className="pt-0.5">{step}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Controls Card with Desktop / Mobile Tabs */}
              <div className="glass-card p-6 rounded-2xl border border-white/10 space-y-4 bg-[#0B0E1A]/80 backdrop-blur-xl">
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <h3 className="font-orbitron font-bold text-sm text-white uppercase tracking-wider">
                    Game Controls
                  </h3>
                  <div className="flex space-x-1 bg-black/40 p-1 rounded-xl border border-white/10">
                    <button
                      onClick={() => {
                        audioManager.playUiClick();
                        setControlsTab('desktop');
                      }}
                      className={`px-3 py-1 rounded-lg text-xs font-mono flex items-center space-x-1.5 transition-all ${
                        controlsTab === 'desktop'
                          ? 'bg-neon-cyan text-black font-bold shadow-xs'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <Keyboard className="w-3.5 h-3.5" />
                      <span>Desktop</span>
                    </button>
                    <button
                      onClick={() => {
                        audioManager.playUiClick();
                        setControlsTab('mobile');
                      }}
                      className={`px-3 py-1 rounded-lg text-xs font-mono flex items-center space-x-1.5 transition-all ${
                        controlsTab === 'mobile'
                          ? 'bg-neon-lime text-black font-bold shadow-xs'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <Smartphone className="w-3.5 h-3.5" />
                      <span>Mobile</span>
                    </button>
                  </div>
                </div>

                {/* Active Controls Content */}
                {controlsTab === 'desktop' ? (
                  <div className="space-y-2.5 text-xs">
                    {game.controls.desktop.map((c, idx) => (
                      <div key={idx} className="flex justify-between items-center py-1 border-b border-white/5 last:border-0">
                        <span className="text-slate-300">{c.action}</span>
                        <kbd className="px-2.5 py-1 rounded-md bg-black/60 border border-white/10 font-mono text-neon-cyan text-[11px] font-semibold">
                          {c.key}
                        </kbd>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-2.5 text-xs">
                    {game.controls.mobile.map((c, idx) => (
                      <div key={idx} className="flex justify-between items-center py-1 border-b border-white/5 last:border-0">
                        <span className="text-slate-300">{c.action}</span>
                        <span className="px-2.5 py-1 rounded-md bg-black/60 border border-neon-lime/30 font-mono text-neon-lime text-[11px] font-semibold">
                          {c.gesture}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Action Gameplay Screenshots Strip (The 3 captured shots) */}
              <div className="glass-card p-6 rounded-2xl border border-white/10 space-y-4 bg-[#0B0E1A]/80 backdrop-blur-xl">
                <h4 className="font-orbitron font-bold text-xs uppercase tracking-wider text-neon-cyan flex items-center space-x-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Action Gameplay Gallery</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {(game.assets?.screenshots || [
                    `/assets/games/${game.id}/shot1.webp`,
                    `/assets/games/${game.id}/shot2.webp`,
                    `/assets/games/${game.id}/shot3.webp`,
                  ]).map((shot, idx) => (
                    <div
                      key={idx}
                      className="relative aspect-video rounded-xl overflow-hidden glass-card border border-white/10 group cursor-pointer"
                    >
                      <img
                        src={getAssetUrl(shot)}
                        alt={`${game.title} Action Screenshot ${idx + 1}`}
                        loading="lazy"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors" />
                      <span className="absolute bottom-1.5 right-2 text-[10px] font-mono font-bold text-white/80 bg-black/70 px-1.5 py-0.5 rounded border border-white/10">
                        SHOT #{idx + 1}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Interactive FAQ Accordion (3 Questions) */}
              <div className="glass-card p-6 rounded-2xl border border-white/10 space-y-3 bg-[#0B0E1A]/80 backdrop-blur-xl">
                <h3 className="font-orbitron font-bold text-sm text-white flex items-center space-x-2 uppercase tracking-wider mb-2">
                  <HelpCircle className="w-4 h-4 text-neon-cyan" />
                  <span>Frequently Asked Questions</span>
                </h3>
                {(game.faq || [
                  { q: `How do I score points in ${game.title}?`, a: 'Maintain high combos and complete level objectives rapidly to trigger score multipliers!' },
                  { q: `Can I play ${game.title} on mobile?`, a: 'Yes, full touch controls with responsive gestures are supported out of the box.' },
                  { q: `Is game progress saved automatically?`, a: 'Yes, your high scores and progress are instantly stored in guest local storage.' },
                ]).map((item, idx) => {
                  const isOpen = openFaqIndex === idx;
                  return (
                    <div key={idx} className="border border-white/10 rounded-xl overflow-hidden">
                      <button
                        onClick={() => toggleFaq(idx)}
                        className="w-full p-3.5 text-left flex justify-between items-center text-xs font-mono font-bold text-slate-200 hover:text-white bg-white/5 hover:bg-white/10 transition-colors"
                      >
                        <span>{item.q}</span>
                        {isOpen ? <ChevronUp className="w-4 h-4 text-neon-cyan" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                      </button>
                      {isOpen && (
                        <div className="p-3.5 text-xs text-slate-300 bg-black/40 border-t border-white/10 leading-relaxed font-sans">
                          {item.a}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            /* Leaderboard Tab */
            <div className="glass-card p-6 rounded-2xl border border-white/10 space-y-4 bg-[#0B0E1A]/80 backdrop-blur-xl">
              <h3 className="font-orbitron font-bold text-base text-white flex items-center space-x-2">
                <Trophy className="w-5 h-5 text-neon-amber" />
                <span>Top Players — {game.title}</span>
              </h3>

              <div className="divide-y divide-white/5">
                {leaderboardData.map((record, idx) => (
                  <div key={idx} className="py-3 flex items-center justify-between text-xs font-mono">
                    <div className="flex items-center space-x-3">
                      <span
                        className={`w-6 text-center font-bold font-orbitron ${
                          idx === 0
                            ? 'text-neon-amber text-sm'
                            : idx === 1
                            ? 'text-slate-300'
                            : idx === 2
                            ? 'text-amber-700'
                            : 'text-slate-500'
                        }`}
                      >
                        #{idx + 1}
                      </span>
                      <span className="text-white font-medium">{record.username}</span>
                    </div>
                    <div className="text-right">
                      <div className="font-orbitron font-bold text-neon-cyan">
                        {record.score.toLocaleString()} PTS
                      </div>
                      {record.levelReached && (
                        <div className="text-[10px] text-slate-400">LVL {record.levelReached}</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Rail: "Play Next" Related Games Column */}
        <div className="lg:col-span-4 space-y-6">
          {/* Game Specifications Quick Card */}
          <div className="glass-card p-5 rounded-2xl border border-white/10 space-y-3 bg-[#0B0E1A]/80 backdrop-blur-xl">
            <h4 className="font-orbitron font-bold text-xs uppercase tracking-wider text-slate-400 border-b border-white/10 pb-2">
              Game Overview
            </h4>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Category</span>
                <span className="text-neon-cyan font-medium">{game.category}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Engine</span>
                <span className="text-white uppercase font-mono">{game.engine}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Players</span>
                <span className="text-white font-mono">{game.players.min === game.players.max ? `${game.players.min} Player` : `${game.players.min}-${game.players.max} Players`}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Progression</span>
                <span className="text-neon-lime capitalize font-mono">{game.progression}</span>
              </div>
            </div>
          </div>

          {/* "Play Next" Right Rail of Recommended Titles */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Gamepad2 className="w-4 h-4 text-neon-cyan" />
              <h3 className="font-orbitron font-bold text-sm text-white uppercase tracking-wider">
                Play Next
              </h3>
            </div>
            <div className="space-y-3">
              {relatedGames.map((rg) => (
                <GameCard key={rg.id} game={rg} />
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
