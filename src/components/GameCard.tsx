import React, { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, Users, Play } from 'lucide-react';
import { GameMetadata } from '../types/game';
import { useStore } from '../store/useStore';
import { audioManager } from '../game-sdk/AudioManager';
import { getAssetUrl } from '../utils/assetUrl';

interface GameCardProps {
  game: GameMetadata;
  aspect?: 'landscape' | 'portrait' | 'square';
  featured?: boolean;
}

export const GameCard: React.FC<GameCardProps> = ({
  game,
  aspect = 'landscape',
  featured = false,
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [rotate, setRotate] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  const { favorites, toggleFavorite, fxSettings } = useStore();
  const isFav = favorites.includes(game.id);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (fxSettings.reducedMotion || fxSettings.lowFxMode) return;
    if (!cardRef.current) return;

    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    // Max tilt 7 deg
    const rotateX = ((y - centerY) / centerY) * -7;
    const rotateY = ((x - centerX) / centerX) * 7;

    setRotate({ x: rotateX, y: rotateY });
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setRotate({ x: 0, y: 0 });
  };

  const handleFavClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    audioManager.playUiClick();
    toggleFavorite(game.id);
  };

  const heightClass = featured
    ? 'h-64 sm:h-80 md:h-96'
    : aspect === 'portrait'
    ? 'h-64 sm:h-72'
    : aspect === 'square'
    ? 'h-48 sm:h-56'
    : 'h-44 sm:h-48';

  const rawThumb = game.assets?.thumb || `/assets/games/${game.id}/thumb.webp`;
  const rawHero = game.assets?.hero || `/assets/games/${game.id}/shot1.webp`;
  const thumbUrl = getAssetUrl(rawThumb);
  const heroUrl = getAssetUrl(rawHero);

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className="perspective-1000 group relative transition-transform duration-200"
    >
      <Link
        to={`/play/${game.id}`}
        onClick={() => audioManager.playUiClick()}
        style={{
          transform:
            isHovered && !fxSettings.reducedMotion
              ? `rotateX(${rotate.x}deg) rotateY(${rotate.y}deg) translateY(-5px)`
              : 'rotateX(0deg) rotateY(0deg) translateY(0px)',
        }}
        className={`block relative w-full ${heightClass} rounded-2xl glass-card overflow-hidden border border-white/10 group-hover:border-neon-cyan/60 group-hover:shadow-neon-cyan transition-all duration-300 bg-[#0B0E1A]`}
      >
        {/* Tiny Blurred LQIP / Ambient Background Glow */}
        <div
          className="absolute inset-0 bg-cover bg-center filter blur-md opacity-40 transition-opacity"
          style={{
            backgroundImage: `radial-gradient(circle at 50% 40%, ${game.accentColor}44, #07080F 85%)`,
          }}
        />

        {/* Real WebP Game Thumbnail with Ken-Burns Zoom on Desktop Hover */}
        <img
          src={thumbUrl}
          srcSet={`${thumbUrl} 640w, ${heroUrl} 960w`}
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          alt={game.title}
          loading="lazy"
          decoding="async"
          onLoad={() => setImageLoaded(true)}
          className={`w-full h-full object-cover transition-all duration-500 ease-out ${
            imageLoaded ? 'opacity-90 group-hover:opacity-100' : 'opacity-0'
          } ${
            isHovered && !fxSettings.reducedMotion && !fxSettings.lowFxMode
              ? 'scale-108'
              : 'scale-100'
          }`}
        />

        {/* Dark Vignette Overlay for High Contrast Text */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#07080F] via-[#07080F]/40 to-black/30 pointer-events-none" />

        {/* Card Header Badges */}
        <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between z-10">
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-black/75 backdrop-blur-md border border-white/10 text-slate-200">
            {game.category}
          </span>
          <div className="flex items-center space-x-1.5">
            {game.badge && (
              <span
                className="text-[9px] font-orbitron font-black uppercase tracking-wider px-1.5 py-0.5 rounded-md border shadow-xs"
                style={{
                  color: game.accentColor,
                  borderColor: `${game.accentColor}88`,
                  backgroundColor: 'rgba(7, 8, 15, 0.85)',
                }}
              >
                {game.badge}
              </span>
            )}
            <button
              onClick={handleFavClick}
              className="p-1.5 rounded-full bg-black/70 hover:bg-black/95 backdrop-blur-md text-slate-300 hover:text-neon-magenta border border-white/10 transition-colors"
              title="Add to Favorites"
            >
              <Heart
                className={`w-3.5 h-3.5 ${
                  isFav ? 'fill-neon-magenta text-neon-magenta' : ''
                }`}
              />
            </button>
          </div>
        </div>

        {/* Center Hover Play Button Overlay */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-black/30 backdrop-blur-[2px]">
          <div className="w-12 h-12 rounded-full bg-neon-cyan/95 text-black flex items-center justify-center shadow-neon-cyan transform scale-90 group-hover:scale-100 transition-transform duration-200">
            <Play className="w-6 h-6 fill-black ml-0.5" />
          </div>
        </div>

        {/* Card Bottom Meta Bar */}
        <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-[#07080F] via-[#07080F]/90 to-transparent">
          <div className="font-orbitron font-bold text-sm text-white group-hover:text-neon-cyan truncate transition-colors">
            {game.title}
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-400 mt-0.5">
            <span className="truncate pr-2 text-slate-300">{game.tagline}</span>
            <div className="flex items-center space-x-1 flex-shrink-0 text-slate-400">
              <Users className="w-3 h-3 text-neon-cyan/70" />
              <span>{game.maxPlayers > 1 ? '2P' : '1P'}</span>
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
};
