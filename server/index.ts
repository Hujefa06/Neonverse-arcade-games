import express, { Request, Response } from 'express';
import cors from 'cors';
import { GAME_REGISTRY, getGame } from '../src/games/registry';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// In-memory score cache and session token validation store
interface GameSession {
  token: string;
  gameId: string;
  startedAt: number;
}

interface ScoreRecord {
  id: string;
  gameId: string;
  userId?: string;
  username: string;
  score: number;
  levelReached: number;
  durationSeconds: number;
  createdAt: string;
}

const activeSessions: Map<string, GameSession> = new Map();
const inMemoryScores: ScoreRecord[] = [
  // Seed sample leaderboard entries across multiple games
  { id: 'sc-1', gameId: 'typestrike-arena', username: 'CyberViper', score: 14200, levelReached: 10, durationSeconds: 240, createdAt: new Date(Date.now() - 3600000).toISOString() },
  { id: 'sc-2', gameId: 'typestrike-arena', username: 'NeonKnight', score: 11800, levelReached: 8, durationSeconds: 195, createdAt: new Date(Date.now() - 7200000).toISOString() },
  { id: 'sc-3', gameId: 'typestrike-arena', username: 'PixelSamurai', score: 9500, levelReached: 7, durationSeconds: 150, createdAt: new Date(Date.now() - 86400000).toISOString() },
  { id: 'sc-4', gameId: 'fliprush', username: 'GlitchRunner', score: 8750, levelReached: 12, durationSeconds: 180, createdAt: new Date().toISOString() },
  { id: 'sc-5', gameId: 'goo-merge', username: 'SlimeMaster', score: 26400, levelReached: 1, durationSeconds: 420, createdAt: new Date().toISOString() },
  { id: 'sc-6', gameId: 'chef-panic', username: 'BurgerKingPin', score: 13200, levelReached: 9, durationSeconds: 210, createdAt: new Date().toISOString() },
  { id: 'sc-7', gameId: 'whack-a-glitch', username: 'CRT_Crusher', score: 18900, levelReached: 1, durationSeconds: 300, createdAt: new Date().toISOString() },
  { id: 'sc-8', gameId: 'echo-bloom', username: 'ZenGardener', score: 5400, levelReached: 1, durationSeconds: 600, createdAt: new Date().toISOString() },
  { id: 'sc-9', gameId: 'beat-serpent', username: 'SynthRider', score: 12400, levelReached: 1, durationSeconds: 250, createdAt: new Date().toISOString() },
  { id: 'sc-10', gameId: 'tethered', username: 'QuantumDuo', score: 9900, levelReached: 5, durationSeconds: 360, createdAt: new Date().toISOString() },
];

const matchesStore: Map<string, { roomCode: string; gameId: string; hostId: string; status: string; createdAt: number }> = new Map();
const userFavorites: Map<string, Set<string>> = new Map();
const userSaves: Map<string, Map<string, any>> = new Map();
const userAchievements: Map<string, Set<string>> = new Map();

// Rate-limiting map: ipOrUser -> lastSubmissionTimestamp
const rateLimitMap: Map<string, number> = new Map();

// Strip loader function from registry for pure JSON API output
const cleanGamesCatalog = GAME_REGISTRY.map(({ loader, ...rest }) => rest);

// 1. Health check
app.get('/api/health', (_req: Request, res: Response) => {
  return res.json({
    status: 'ok',
    service: 'Neonverse Arcade API',
    version: '2.0.0',
    gamesCount: cleanGamesCatalog.length,
    timestamp: new Date().toISOString(),
  });
});

// 2. Games catalog endpoints (Returns all 24 games from single source of truth)
app.get('/api/games', (req: Request, res: Response) => {
  const { category, tag } = req.query;
  let results = [...cleanGamesCatalog];

  if (category && category !== 'All') {
    results = results.filter((g) => g.category.toLowerCase() === String(category).toLowerCase());
  }
  if (tag) {
    results = results.filter((g) => g.tags.map((t) => t.toLowerCase()).includes(String(tag).toLowerCase()));
  }

  return res.json({
    count: results.length,
    games: results,
  });
});

app.get('/api/games/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const game = getGame(id);
  if (!game) {
    return res.status(404).json({ error: `Game not found: ${id}` });
  }
  const { loader, ...cleanGame } = game;
  return res.json({ game: cleanGame });
});

// 3. Anti-Cheat Session Tokens
app.post('/api/sessions/start', (req: Request, res: Response) => {
  const { gameId } = req.body;
  if (!gameId) {
    return res.status(400).json({ error: 'Missing gameId' });
  }
  const token = `sess_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  activeSessions.set(token, {
    token,
    gameId,
    startedAt: Date.now(),
  });

  // Garbage collect expired sessions
  if (activeSessions.size > 2000) {
    const twoHoursAgo = Date.now() - 7200000;
    for (const [k, v] of activeSessions.entries()) {
      if (v.startedAt < twoHoursAgo) activeSessions.delete(k);
    }
  }
  return res.json({ sessionToken: token, gameId });
});

// 4. Rate-limited & Plausibility-Validated Score Submission
app.post('/api/scores', (req: Request, res: Response) => {
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  const { sessionToken, gameId, username, score, levelReached, durationSeconds } = req.body;

  // Rate Limiting: Max 1 submission per 1800ms in production, 50ms in dev/test
  const now = Date.now();
  const lastSubmission = rateLimitMap.get(ip) || 0;
  const minInterval = process.env.NODE_ENV === 'production' ? 1800 : 50;
  if (now - lastSubmission < minInterval) {
    return res.status(429).json({ error: 'Rate limit exceeded: please wait before submitting another score.' });
  }
  rateLimitMap.set(ip, now);

  if (!gameId || typeof score !== 'number' || score < 0) {
    return res.status(400).json({ error: 'Invalid score payload: gameId and non-negative score required' });
  }

  // Anti-Cheat Plausibility Check 1: Minimum play duration (reject only if duration is reported < 2s with impossibly high score)
  if (durationSeconds !== undefined && durationSeconds > 0 && durationSeconds < 2 && score > 3000) {
    return res.status(403).json({ error: 'Score rejected: duration too short for reported score' });
  }

  // Anti-Cheat Plausibility Check 2: Absolute score ceilings per game
  const maxScoreCaps: Record<string, number> = {
    'typestrike-arena': 300000,
    'fliprush': 250000,
    'goo-merge': 600000,
    'chef-panic': 200000,
    'whack-a-glitch': 350000,
    'echo-bloom': 60000,
    'beat-serpent': 250000,
    'cloud-shepherd': 50000,
    'rocket-postman': 100000,
    'magnet-surfer': 300000,
    'splat-squad': 200000,
    'thirty-second-detective': 150000,
    'stack-storm': 400000,
    'lantern-glider': 50000,
    'squish-volley': 100000,
    'circuit-sprint': 250000,
    'dream-diver': 100000,
    'noodle-knockout': 150000,
    'ember-and-frost': 120000,
    'star-painter': 80000,
    'traffic-tamer': 200000,
    'orbit-oddballs': 150000,
    'mirror-twins': 300000,
    'tethered': 200000,
  };
  const cap = maxScoreCaps[gameId] || 1000000;
  if (score > cap) {
    return res.status(403).json({ error: 'Score rejected: exceeds maximum plausible threshold' });
  }

  // Consume session token if valid
  if (sessionToken && activeSessions.has(sessionToken)) {
    activeSessions.delete(sessionToken);
  }

  const newRecord: ScoreRecord = {
    id: `sc_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    gameId,
    username: username ? String(username).substring(0, 24) : 'Guest Gamer',
    score: Math.floor(score),
    levelReached: Number(levelReached) || 1,
    durationSeconds: Number(durationSeconds) || 0,
    createdAt: new Date().toISOString(),
  };

  inMemoryScores.push(newRecord);
  return res.json({ success: true, record: newRecord });
});

// 5. Leaderboard Queries
app.get('/api/leaderboard', (req: Request, res: Response) => {
  const { gameId, period } = req.query;
  let filtered = [...inMemoryScores];

  if (gameId && gameId !== 'all') {
    filtered = filtered.filter((s) => s.gameId === gameId);
  }

  const now = Date.now();
  if (period === 'daily') {
    const oneDayAgo = now - 24 * 60 * 60 * 1000;
    filtered = filtered.filter((s) => new Date(s.createdAt).getTime() >= oneDayAgo);
  } else if (period === 'weekly') {
    const oneWeekAgo = now - 7 * 24 * 60 * 60 * 1000;
    filtered = filtered.filter((s) => new Date(s.createdAt).getTime() >= oneWeekAgo);
  }

  filtered.sort((a, b) => b.score - a.score);

  return res.json({
    gameId: gameId || 'all',
    period: period || 'all-time',
    leaderboard: filtered.slice(0, 50),
  });
});

// 6. Cloud Saves per game
app.get('/api/saves/:gameId', (req: Request, res: Response) => {
  const { gameId } = req.params;
  const userId = (req.headers['x-user-id'] as string) || 'guest';
  const userMap = userSaves.get(userId);
  const saveState = userMap ? userMap.get(gameId) : null;
  return res.json({ gameId, state: saveState || null });
});

app.post('/api/saves/:gameId', (req: Request, res: Response) => {
  const { gameId } = req.params;
  const userId = (req.headers['x-user-id'] as string) || 'guest';
  const { state } = req.body;
  if (!userSaves.has(userId)) {
    userSaves.set(userId, new Map());
  }
  userSaves.get(userId)!.set(gameId, state);
  return res.json({ success: true, savedAt: new Date().toISOString() });
});

// 7. Favorites Management
app.get('/api/favorites', (req: Request, res: Response) => {
  const userId = (req.headers['x-user-id'] as string) || 'guest';
  const favs = userFavorites.get(userId) || new Set();
  return res.json({ favorites: Array.from(favs) });
});

app.post('/api/favorites/:gameId', (req: Request, res: Response) => {
  const { gameId } = req.params;
  const userId = (req.headers['x-user-id'] as string) || 'guest';
  if (!userFavorites.has(userId)) {
    userFavorites.set(userId, new Set());
  }
  const favs = userFavorites.get(userId)!;
  let favorited = false;
  if (favs.has(gameId)) {
    favs.delete(gameId);
    favorited = false;
  } else {
    favs.add(gameId);
    favorited = true;
  }
  return res.json({ gameId, favorited, allFavorites: Array.from(favs) });
});

// 8. Achievements
app.get('/api/achievements', (req: Request, res: Response) => {
  const userId = (req.headers['x-user-id'] as string) || 'guest';
  const unlocked = userAchievements.get(userId) || new Set();
  return res.json({ unlocked: Array.from(unlocked) });
});

app.post('/api/achievements/:id/unlock', (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = (req.headers['x-user-id'] as string) || 'guest';
  if (!userAchievements.has(userId)) {
    userAchievements.set(userId, new Set());
  }
  userAchievements.get(userId)!.add(id);
  return res.json({ success: true, achievementId: id });
});

// 9. Co-Op Match Rooms
app.post('/api/matches', (req: Request, res: Response) => {
  const { gameId, hostId } = req.body;
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let roomCode = '';
  for (let i = 0; i < 6; i++) {
    roomCode += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  matchesStore.set(roomCode, {
    roomCode,
    gameId: gameId || 'tethered',
    hostId: hostId || `guest_${Date.now()}`,
    status: 'waiting',
    createdAt: Date.now(),
  });
  return res.json({ roomCode, status: 'waiting' });
});

app.get('/api/matches/:roomCode', (req: Request, res: Response) => {
  const { roomCode } = req.params;
  const match = matchesStore.get(roomCode.toUpperCase());
  if (!match) {
    return res.status(404).json({ error: 'Room not found' });
  }
  return res.json({ match });
});

// Start server if directly executed
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`[Neonverse Server] Express API listening on http://localhost:${PORT}`);
  });
}

export default app;
