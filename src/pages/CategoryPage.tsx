import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Sparkles } from 'lucide-react';
import { GAME_REGISTRY, getGamesByCategory } from '../games/registry';
import { GameCard } from '../components/GameCard';
import { audioManager } from '../game-sdk/AudioManager';

export const CategoryPage: React.FC = () => {
  const { categoryName } = useParams<{ categoryName: string }>();
  const decoded = decodeURIComponent(categoryName || '');

  const filtered = getGamesByCategory(decoded);

  const categoryBgMap: Record<string, string> = {
    action: '/assets/bg/cat-action.webp',
    arcade: '/assets/bg/cat-arcade.webp',
    puzzle: '/assets/bg/cat-puzzle.webp',
    typing: '/assets/bg/cat-typing.webp',
    'funny physics': '/assets/bg/cat-physics.webp',
    'chill/aesthetic': '/assets/bg/cat-chill.webp',
    rhythm: '/assets/bg/cat-rhythm.webp',
    '2-player co-op': '/assets/bg/cat-coop.webp',
  };
  const bgUrl = categoryBgMap[decoded.toLowerCase()] || '/assets/bg/cat-arcade.webp';

  return (
    <div className="relative space-y-8 pb-16">
      {/* Subtle Category Thematic Background */}
      <div
        className="fixed inset-0 bg-cover bg-center opacity-25 filter blur-sm pointer-events-none z-0"
        style={{ backgroundImage: `url('${bgUrl}')` }}
      />
      {/* Category Header */}
      <div className="relative z-10 flex items-center justify-between border-b border-white/10 pb-6">
        <div>
          <Link
            to="/"
            onClick={() => audioManager.playUiClick()}
            className="inline-flex items-center space-x-1.5 text-xs text-slate-400 hover:text-neon-cyan mb-2 font-mono"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>BACK TO HOME</span>
          </Link>
          <h1 className="font-orbitron font-black text-3xl sm:text-4xl text-white capitalize flex items-center space-x-3">
            <span>{decoded} Games</span>
            <span className="text-xs px-2.5 py-1 rounded-full bg-neon-cyan/10 border border-neon-cyan/30 text-neon-cyan font-mono font-normal">
              {filtered.length} TITLES
            </span>
          </h1>
        </div>
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="p-16 text-center text-slate-400 glass-card rounded-2xl border border-white/10">
          No games found in category "{decoded}".
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filtered.map((game) => (
            <GameCard key={game.id} game={game} />
          ))}
        </div>
      )}
    </div>
  );
};
