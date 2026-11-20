import confetti from 'canvas-confetti';
import { useStore } from '../store/useStore';
import { audioManager } from './AudioManager';
import { supabase, isRealSupabaseConfigured } from '../services/supabaseClient';

export interface ScoreSubmissionOptions {
  gameId: string;
  score: number;
  levelReached?: number;
  durationSeconds?: number;
  metadata?: Record<string, any>;
}

class ScoreManager {
  private sessionTokens: Map<string, string> = new Map();

  async startSession(gameId: string): Promise<string> {
    try {
      const res = await fetch('/api/sessions/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gameId }),
      });
      if (res.ok) {
        const data = await res.json();
        this.sessionTokens.set(gameId, data.sessionToken);
        return data.sessionToken;
      }
    } catch {
      // Local fallback token
      const fallbackToken = `sess_local_${Date.now()}`;
      this.sessionTokens.set(gameId, fallbackToken);
      return fallbackToken;
    }
    return '';
  }

  async submitScore(opts: ScoreSubmissionOptions): Promise<{
    success: boolean;
    leveledUp: boolean;
    newLevel: number;
    earnedXp: number;
    earnedCoins: number;
  }> {
    const { user, recordGamePlay, addXp, addCoins } = useStore.getState();
    const sessionToken = this.sessionTokens.get(opts.gameId);

    // 1. Calculate XP and Coins earned
    // Formula: 1 XP per 20 points + 50 XP per level reached
    const baseScoreXp = Math.floor(opts.score / 20);
    const levelXp = (opts.levelReached || 1) * 50;
    const earnedXp = Math.max(10, Math.min(2500, baseScoreXp + levelXp));
    const earnedCoins = Math.max(5, Math.floor(earnedXp / 10));

    const { leveledUp, newLevel } = addXp(earnedXp);
    addCoins(earnedCoins);
    recordGamePlay(opts.gameId, opts.score);

    // 2. Play Audio & Trigger Confetti celebration
    if (opts.score > 0) {
      if (leveledUp) {
        audioManager.playLevelUpChime();
      } else {
        audioManager.playVictoryFanfare();
      }
      this.triggerConfetti();
    }

    // 3. Post to API / Supabase
    try {
      if (isRealSupabaseConfigured && !user.isGuest) {
        await supabase.from('scores').insert({
          game_id: opts.gameId,
          user_id: user.id,
          username: user.username,
          score: opts.score,
          level_reached: opts.levelReached || 1,
          duration_seconds: opts.durationSeconds || 0,
          metadata: opts.metadata || {},
        });
      } else {
        // API fallback
        await fetch('/api/scores', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionToken,
            gameId: opts.gameId,
            username: user.username,
            score: opts.score,
            levelReached: opts.levelReached || 1,
            durationSeconds: opts.durationSeconds || 0,
          }),
        });
      }
    } catch (e) {
      console.warn('[ScoreManager] Score submission network issue (recorded locally)', e);
    }

    return { success: true, leveledUp, newLevel, earnedXp, earnedCoins };
  }

  triggerConfetti() {
    const { fxSettings } = useStore.getState();
    if (fxSettings.reducedMotion) return;

    try {
      confetti({
        particleCount: fxSettings.lowFxMode ? 40 : 90,
        spread: 75,
        origin: { y: 0.65 },
        colors: ['#00F0FF', '#FF2E9A', '#7C4DFF', '#B6FF3C', '#FFFFFF'],
      });
    } catch (e) {
      console.warn('[ScoreManager] Confetti render error', e);
    }
  }
}

export const scoreManager = new ScoreManager();
