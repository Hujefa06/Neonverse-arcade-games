import React, { useState } from 'react';
import { X, Mail, Lock, Sparkles, ShieldCheck } from 'lucide-react';
import { useStore } from '../store/useStore';
import { supabase, isRealSupabaseConfigured } from '../services/supabaseClient';
import { audioManager } from '../game-sdk/AudioManager';

export const AuthModal: React.FC = () => {
  const { isAuthOpen, setAuthOpen, user, setUser } = useStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(true);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  if (!isAuthOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setLoading(true);
    setMessage(null);
    audioManager.playUiClick();

    try {
      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { username: email.split('@')[0] },
          },
        });
        if (error) throw error;

        // Upgrade guest user to registered user
        setUser({
          id: data.user?.id || `user_${Date.now()}`,
          email,
          username: email.split('@')[0],
          isGuest: false,
        });

        setMessage({
          text: isRealSupabaseConfigured
            ? 'Account created! Verification email sent.'
            : 'Account upgraded! Your local guest progress is now linked to cloud.',
          type: 'success',
        });
        audioManager.playLevelUpChime();
        setTimeout(() => setAuthOpen(false), 1200);
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;

        setUser({
          id: data.user?.id || `user_${Date.now()}`,
          email,
          username: data.user?.user_metadata?.username || email.split('@')[0],
          isGuest: false,
        });

        setMessage({ text: 'Signed in successfully!', type: 'success' });
        audioManager.playLevelUpChime();
        setTimeout(() => setAuthOpen(false), 1000);
      }
    } catch (err: any) {
      setMessage({ text: err.message || 'Authentication error', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="relative w-full max-w-md bg-[#0B0E1A] border border-neon-cyan/40 rounded-2xl shadow-neon-cyan p-6 overflow-hidden animate-fadeIn">
        <button
          onClick={() => setAuthOpen(false)}
          className="absolute top-4 right-4 text-slate-400 hover:text-white"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center space-x-2 text-neon-cyan mb-2">
          <Sparkles className="w-5 h-5 text-neon-magenta" />
          <span className="font-orbitron font-bold text-lg">
            {isSignUp ? 'Upgrade to Cloud Save' : 'Sign In'}
          </span>
        </div>

        <p className="text-xs text-slate-400 mb-5">
          {user.isGuest
            ? 'Play as a guest anytime! Creating an account syncs your high scores, XP, coins, and unlocks across devices.'
            : 'Access your Neonverse cloud arcade account.'}
        </p>

        {message && (
          <div
            className={`p-3 rounded-xl text-xs mb-4 border ${
              message.type === 'success'
                ? 'bg-neon-lime/10 border-neon-lime/40 text-neon-lime'
                : 'bg-red-500/10 border-red-500/40 text-red-400'
            }`}
          >
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="player@neonverse.io"
                className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-3 py-2 text-sm text-white focus:outline-none focus:border-neon-cyan"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-3 py-2 text-sm text-white focus:outline-none focus:border-neon-cyan"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-xl bg-neon-cyan text-black font-orbitron font-bold text-xs shadow-neon-cyan hover:scale-[1.02] transition-all disabled:opacity-50"
          >
            {loading ? 'PROCESSING...' : isSignUp ? 'CREATE ACCOUNT & SYNC' : 'SIGN IN'}
          </button>
        </form>

        <div className="mt-4 pt-4 border-t border-white/10 flex justify-between items-center text-xs">
          <button
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-slate-400 hover:text-neon-cyan transition-colors"
          >
            {isSignUp ? 'Already have an account? Sign In' : 'Need an account? Upgrade'}
          </button>
          <div className="flex items-center space-x-1 text-slate-500 text-[10px]">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Guest play is always free</span>
          </div>
        </div>
      </div>
    </div>
  );
};
