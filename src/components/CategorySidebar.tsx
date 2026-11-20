import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Gamepad2,
  Flame,
  Zap,
  Tv,
  Puzzle,
  Keyboard,
  Sparkles,
  Moon,
  Music,
  Users,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { audioManager } from '../game-sdk/AudioManager';
import { GAME_REGISTRY } from '../games/registry';
import { GameCategory } from '../types/game';

interface CategorySidebarProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  selectedCategory?: string;
  onSelectCategory?: (category: GameCategory) => void;
}

export const CategorySidebar: React.FC<CategorySidebarProps> = ({
  isCollapsed,
  onToggleCollapse,
  selectedCategory = 'All',
  onSelectCategory,
}) => {
  const location = useLocation();

  const categoryItems: { label: GameCategory; icon: React.FC<any>; count: number; color: string }[] = [
    { label: 'All', icon: Gamepad2, count: GAME_REGISTRY.length, color: '#00F0FF' },
    { label: 'Action', icon: Zap, count: GAME_REGISTRY.filter((g) => g.category === 'Action').length, color: '#FF2E9A' },
    { label: 'Arcade', icon: Tv, count: GAME_REGISTRY.filter((g) => g.category === 'Arcade').length, color: '#00F0FF' },
    { label: 'Puzzle', icon: Puzzle, count: GAME_REGISTRY.filter((g) => g.category === 'Puzzle').length, color: '#B6FF3C' },
    { label: 'Typing', icon: Keyboard, count: GAME_REGISTRY.filter((g) => g.category === 'Typing').length, color: '#00F0FF' },
    { label: 'Funny Physics', icon: Sparkles, count: GAME_REGISTRY.filter((g) => g.category === 'Funny Physics').length, color: '#FF9E00' },
    { label: 'Chill/Aesthetic', icon: Moon, count: GAME_REGISTRY.filter((g) => g.category === 'Chill/Aesthetic').length, color: '#7C4DFF' },
    { label: 'Rhythm', icon: Music, count: GAME_REGISTRY.filter((g) => g.category === 'Rhythm').length, color: '#FF2E9A' },
    { label: '2-Player Co-op', icon: Users, count: GAME_REGISTRY.filter((g) => g.category === '2-Player Co-op').length, color: '#FF2E9A' },
  ];

  return (
    <aside
      className={`hidden lg:flex flex-col flex-shrink-0 transition-all duration-300 rounded-2xl glass-card border border-white/10 p-3 h-fit sticky top-20 bg-[#07080F]/90 backdrop-blur-xl ${
        isCollapsed ? 'w-16 items-center' : 'w-56'
      }`}
    >
      {/* Sidebar Header with Collapse Toggle */}
      <div className={`flex items-center justify-between pb-3 mb-2 border-b border-white/10 w-full ${isCollapsed ? 'justify-center' : ''}`}>
        {!isCollapsed && (
          <span className="font-orbitron font-bold text-xs uppercase tracking-wider text-slate-300">
            Categories
          </span>
        )}
        <button
          onClick={() => {
            audioManager.playUiClick();
            onToggleCollapse();
          }}
          className="p-1.5 rounded-lg bg-white/5 hover:bg-white/15 text-slate-400 hover:text-white transition-colors"
          title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4 text-neon-cyan" /> : <ChevronLeft className="w-4 h-4 text-slate-400" />}
        </button>
      </div>

      {/* Category List */}
      <nav className="flex flex-col space-y-1 w-full">
        {categoryItems.map((item) => {
          const Icon = item.icon;
          const isSelected = selectedCategory.toLowerCase() === item.label.toLowerCase();

          return (
            <button
              key={item.label}
              onClick={() => {
                audioManager.playUiClick();
                if (onSelectCategory) {
                  onSelectCategory(item.label);
                }
              }}
              title={isCollapsed ? `${item.label} (${item.count})` : undefined}
              className={`flex items-center space-x-3 w-full px-2.5 py-2 rounded-xl transition-all text-xs font-mono group relative ${
                isSelected
                  ? 'bg-neon-cyan/15 text-white border border-neon-cyan/50 shadow-neon-cyan'
                  : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'
              } ${isCollapsed ? 'justify-center px-0' : ''}`}
            >
              <Icon
                className="w-4 h-4 flex-shrink-0 transition-transform group-hover:scale-110"
                style={{ color: isSelected ? item.color : undefined }}
              />

              {!isCollapsed && (
                <>
                  <span className="font-medium truncate flex-1 text-left">{item.label}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-black/60 border border-white/10 text-slate-400 font-mono">
                    {item.count}
                  </span>
                </>
              )}
            </button>
          );
        })}
      </nav>
    </aside>
  );
};
