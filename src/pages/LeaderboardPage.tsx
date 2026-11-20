import React, { useState, useEffect } from 'react';
import { Trophy, Medal, Sparkles, Filter } from 'lucide-react';
import { GAME_REGISTRY } from '../games/registry';
import { audioManager } from '../game-sdk/AudioManager';

export const LeaderboardPage: React.FC = () => {
  const [selectedGame, setSelectedGame] = useState<string>('all');
  const [selectedPeriod, setSelectedPeriod] = useState<'daily' | 'weekly' | 'all-time'>('all-time');
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/leaderboard?gameId=${selectedGame}&period=${selectedPeriod}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.leaderboard) setLeaderboard(data.leaderboard);
      })
      .catch(() => {
        // Mock fallback
        setLeaderboard([
          { id: '1', username: 'CyberViper', gameId: 'typestrike-arena', score: 14200, levelReached: 10 },
          { id: '2', username: 'NeonKnight', gameId: 'typestrike-arena', score: 11800, levelReached: 8 },
          { id: '3', username: 'GlitchRunner', gameId: 'fliprush', score: 8750, levelReached: 12 },
          { id: '4', username: 'SlimeMaster', gameId: 'goo-merge', score: 26400, levelReached: 1 },
          { id: '5', username: 'BurgerKingPin', gameId: 'chef-panic', score: 13200, levelReached: 9 },
        ]);
      })
      .finally(() => setLoading(false));
  }, [selectedGame, selectedPeriod]);

  const getGameTitle = (id: string) => {
    const g = GAME_REGISTRY.find((item) => item.id === id);
    return g ? g.title : id;
  };

  return (
    <div className="space-y-8 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <div className="flex items-center space-x-2 text-neon-amber mb-1">
            <Trophy className="w-5 h-5" />
            <span className="text-xs font-mono font-bold uppercase tracking-wider">
              ARCADE HALL OF FAME
            </span>
          </div>
          <h1 className="font-orbitron font-black text-3xl sm:text-4xl text-white">
            Global Leaderboards
          </h1>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Game Select */}
          <select
            value={selectedGame}
            onChange={(e) => {
              audioManager.playUiClick();
              setSelectedGame(e.target.value);
            }}
            className="bg-[#0B0E1A] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-neon-cyan font-mono"
          >
            <option value="all">All 24 Games</option>
            {GAME_REGISTRY.map((g) => (
              <option key={g.id} value={g.id}>
                {g.title}
              </option>
            ))}
          </select>

          {/* Timeframe Chips */}
          <div className="flex bg-white/5 p-1 rounded-xl border border-white/10 text-xs font-mono">
            {(['daily', 'weekly', 'all-time'] as const).map((period) => (
              <button
                key={period}
                onClick={() => {
                  audioManager.playUiClick();
                  setSelectedPeriod(period);
                }}
                className={`px-3 py-1 rounded-lg uppercase transition-all ${
                  selectedPeriod === period
                    ? 'bg-neon-cyan text-black font-bold shadow-neon-cyan'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {period}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Leaderboard Table */}
      <div className="glass-card rounded-2xl border border-white/10 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-white/5 border-b border-white/10 text-slate-400 uppercase text-[10px]">
              <tr>
                <th className="py-3 px-4">Rank</th>
                <th className="py-3 px-4">Player</th>
                <th className="py-3 px-4">Game</th>
                <th className="py-3 px-4 text-right">Score</th>
                <th className="py-3 px-4 text-right">Level</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {leaderboard.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-500">
                    No scores recorded for this selection yet. Be the first to play!
                  </td>
                </tr>
              ) : (
                leaderboard.map((row, idx) => (
                  <tr key={idx} className="hover:bg-white/5 transition-colors">
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center justify-center w-6 h-6 rounded-full font-bold font-orbitron ${
                          idx === 0
                            ? 'bg-neon-amber/20 text-neon-amber border border-neon-amber/40'
                            : idx === 1
                            ? 'bg-slate-300/20 text-slate-200 border border-slate-300/40'
                            : idx === 2
                            ? 'bg-amber-700/20 text-amber-500 border border-amber-700/40'
                            : 'text-slate-400'
                        }`}
                      >
                        {idx + 1}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-bold text-white flex items-center space-x-2">
                      <span>{row.username}</span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-300">
                      {getGameTitle(row.gameId)}
                    </td>
                    <td className="py-3.5 px-4 text-right font-orbitron font-bold text-neon-cyan text-sm">
                      {row.score.toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 text-right text-slate-400">
                      LVL {row.levelReached || 1}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
