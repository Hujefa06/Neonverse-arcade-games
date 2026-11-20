import React from 'react';
import { Gamepad2, Shield, Zap, Sparkles, Heart } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="w-full bg-[#07080F] border-t border-white/10 mt-16 text-slate-400 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand Info */}
          <div className="space-y-3 md:col-span-2">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-lg bg-neon-cyan/20 border border-neon-cyan/40 flex items-center justify-center">
                <Gamepad2 className="w-5 h-5 text-neon-cyan" />
              </div>
              <span className="font-orbitron font-extrabold text-base text-white tracking-wider">
                NEON<span className="text-neon-magenta">VERSE</span> ARCADE
              </span>
            </div>
            <p className="text-slate-400 text-xs leading-relaxed max-w-md">
              A 100% free browser gaming hub featuring 24 original titles with synthesized audio,
              responsive mobile touch controls, zero fake multiplayer bots, and instant guest progression.
            </p>
            <div className="flex flex-wrap gap-2 pt-2">
              <span className="px-2.5 py-1 rounded-md bg-white/5 border border-white/10 text-[10px] text-neon-cyan font-mono flex items-center space-x-1">
                <Zap className="w-3 h-3" />
                <span>60 FPS Target</span>
              </span>
              <span className="px-2.5 py-1 rounded-md bg-white/5 border border-white/10 text-[10px] text-neon-magenta font-mono flex items-center space-x-1">
                <Shield className="w-3 h-3" />
                <span>Zero Account Barrier</span>
              </span>
              <span className="px-2.5 py-1 rounded-md bg-white/5 border border-white/10 text-[10px] text-neon-lime font-mono flex items-center space-x-1">
                <Sparkles className="w-3 h-3" />
                <span>Synthesized Audio</span>
              </span>
            </div>
          </div>

          {/* Quick Categories */}
          <div>
            <div className="font-orbitron font-bold text-slate-200 uppercase text-xs tracking-wider mb-3">
              Categories
            </div>
            <ul className="space-y-1.5 text-xs text-slate-400">
              <li><a href="/category/action" className="hover:text-neon-cyan">Action & Runners</a></li>
              <li><a href="/category/typing" className="hover:text-neon-cyan">Typing Combat</a></li>
              <li><a href="/category/funny%20physics" className="hover:text-neon-cyan">Funny Physics</a></li>
              <li><a href="/category/2-player%20co-op" className="hover:text-neon-cyan">2-Player Real Co-Op</a></li>
              <li><a href="/category/chill%2faesthetic" className="hover:text-neon-cyan">Chill & Aesthetic</a></li>
            </ul>
          </div>

          {/* Platform Information */}
          <div>
            <div className="font-orbitron font-bold text-slate-200 uppercase text-xs tracking-wider mb-3">
              Platform Features
            </div>
            <ul className="space-y-1.5 text-xs text-slate-400">
              <li>Guest Saves (LocalStorage)</li>
              <li>Cloud Sync (Supabase Auth)</li>
              <li>Touch Virtual Joystick</li>
              <li>Anti-Cheat Score Plausibility</li>
              <li>4-Channel Audio Mixer</li>
            </ul>
          </div>
        </div>

        <div className="pt-6 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-slate-500 font-mono">
          <div>© 2026 NEONVERSE ARCADE. All 24 games are original creations.</div>
          <div className="flex items-center space-x-1">
            <span>Engineered with</span>
            <Heart className="w-3 h-3 text-neon-magenta fill-neon-magenta" />
            <span>in TypeScript & Phaser</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
