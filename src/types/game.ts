export type GameCategory =
  | 'All'
  | 'Action'
  | 'Arcade'
  | 'Puzzle'
  | 'Typing'
  | 'Funny Physics'
  | 'Chill/Aesthetic'
  | 'Rhythm'
  | '2-Player Co-op';

export type GameEngine = 'phaser' | 'three' | 'custom-canvas';

export interface GameControls {
  desktop: { key: string; action: string }[];
  mobile: { gesture: string; action: string }[];
}

export interface GameAssets {
  thumb: string;
  hero: string;
  screenshots: string[];
  bg?: string;
}

export interface GameMusicConfig {
  trackId: string;
  mood: string;
  bpm: number;
  key: string;
}

export interface GameFaq {
  q: string;
  a: string;
}

export interface GameMetadata {
  id: string;
  slug: string;
  title: string;
  tagline: string;
  description: string;
  category: GameCategory;
  tags: string[];
  players: { min: number; max: number };
  engine: GameEngine;
  controls: GameControls;
  assets: GameAssets;
  music: GameMusicConfig;
  progression: 'levels' | 'endless' | 'zen' | 'career' | 'co-op';
  version: string;
  enabled: boolean;
  badge?: 'HOT' | 'NEW' | 'FLAGSHIP';
  accentColor: string;
  iconEmoji: string;
  howToPlay: string[];
  faq?: GameFaq[];
  // Backwards-compatible aliases
  minPlayers: number;
  maxPlayers: number;
  progressionType: 'levels' | 'endless' | 'zen' | 'career' | 'co-op';
  isCoop?: boolean;
}

export interface PlayerScore {
  id: string;
  gameId: string;
  userId?: string;
  username: string;
  score: number;
  levelReached: number;
  durationSeconds: number;
  createdAt: string;
  metadata?: Record<string, unknown>;
}

export interface UserProfile {
  id: string;
  username: string;
  avatar: string;
  xp: number;
  level: number;
  coins: number;
  isGuest: boolean;
  email?: string;
}

export interface Achievement {
  id: string;
  gameId?: string; // optional if global
  title: string;
  description: string;
  icon: string;
  xpReward: number;
  unlockedAt?: string;
}

export interface AudioSettings {
  masterVolume: number;
  musicVolume: number;
  sfxVolume: number;
  typingVolume: number;
  victoryVolume: number;
  isMuted: boolean;
}

export interface FXSettings {
  lowFxMode: boolean;
  reducedMotion: boolean;
  leftHandedTouch: boolean;
}
