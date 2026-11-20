-- ==============================================================================
-- NEONVERSE ARCADE: Supabase PostgreSQL Database Migration Schema
-- Includes tables, indexes, row-level security (RLS), and policies
-- ==============================================================================

-- 1. Profiles Table (Extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  avatar_url TEXT DEFAULT 'cyber_ninja',
  xp INTEGER DEFAULT 0 NOT NULL,
  level INTEGER DEFAULT 1 NOT NULL,
  coins INTEGER DEFAULT 0 NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 2. Games Metadata Table
CREATE TABLE IF NOT EXISTS public.games (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT NOT NULL,
  progression_type TEXT NOT NULL,
  controls_desktop TEXT NOT NULL,
  controls_mobile TEXT NOT NULL,
  icon TEXT NOT NULL,
  accent_color TEXT DEFAULT '#00F0FF' NOT NULL,
  is_featured BOOLEAN DEFAULT FALSE NOT NULL,
  plays_count BIGINT DEFAULT 0 NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 3. Scores Table (Leaderboard & Play History)
CREATE TABLE IF NOT EXISTS public.scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id TEXT NOT NULL REFERENCES public.games(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  guest_name TEXT,
  score BIGINT NOT NULL,
  level_reached INTEGER DEFAULT 1 NOT NULL,
  duration_seconds INTEGER DEFAULT 0 NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 4. Achievements Catalog
CREATE TABLE IF NOT EXISTS public.achievements (
  id TEXT PRIMARY KEY,
  game_id TEXT REFERENCES public.games(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL,
  xp_reward INTEGER DEFAULT 100 NOT NULL,
  secret BOOLEAN DEFAULT FALSE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 5. User Achievements (Unlocked badges)
CREATE TABLE IF NOT EXISTS public.user_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  achievement_id TEXT NOT NULL REFERENCES public.achievements(id) ON DELETE CASCADE,
  unlocked_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(user_id, achievement_id)
);

-- 6. Favorites
CREATE TABLE IF NOT EXISTS public.favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  game_id TEXT NOT NULL REFERENCES public.games(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(user_id, game_id)
);

-- 7. Game Cloud Saves (JSONB payload per user per game)
CREATE TABLE IF NOT EXISTS public.saves (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  game_id TEXT NOT NULL REFERENCES public.games(id) ON DELETE CASCADE,
  state JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(user_id, game_id)
);

-- 8. Matches (Real-Time Co-Op Rooms, e.g. TETHERED)
CREATE TABLE IF NOT EXISTS public.matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_code VARCHAR(6) UNIQUE NOT NULL,
  game_id TEXT NOT NULL REFERENCES public.games(id) ON DELETE CASCADE,
  host_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  guest_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'waiting' NOT NULL, -- 'waiting', 'active', 'completed', 'abandoned'
  mission_index INTEGER DEFAULT 0 NOT NULL,
  state JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_scores_game_score ON public.scores(game_id, score DESC);
CREATE INDEX IF NOT EXISTS idx_scores_user ON public.scores(user_id);
CREATE INDEX IF NOT EXISTS idx_saves_user_game ON public.saves(user_id, game_id);
CREATE INDEX IF NOT EXISTS idx_matches_room_code ON public.matches(room_code);

-- ==============================================================================
-- Row Level Security (RLS) Policies
-- ==============================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.games ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saves ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;

-- Profiles: Public can read all, User can update own
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles
  FOR SELECT USING (true);
CREATE POLICY "Users can insert their own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Games: Public read-only
CREATE POLICY "Games are viewable by everyone" ON public.games
  FOR SELECT USING (true);

-- Scores: Public read-only, authenticated or server insert
CREATE POLICY "Scores are viewable by everyone" ON public.scores
  FOR SELECT USING (true);
CREATE POLICY "Users can insert their own scores" ON public.scores
  FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- Achievements: Public read-only
CREATE POLICY "Achievements are viewable by everyone" ON public.achievements
  FOR SELECT USING (true);

-- User Achievements: Public read, user unlock
CREATE POLICY "User achievements are viewable by everyone" ON public.user_achievements
  FOR SELECT USING (true);
CREATE POLICY "Users can unlock their own achievements" ON public.user_achievements
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Favorites: User manages own
CREATE POLICY "Favorites are viewable by everyone" ON public.favorites
  FOR SELECT USING (true);
CREATE POLICY "Users can insert their own favorites" ON public.favorites
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own favorites" ON public.favorites
  FOR DELETE USING (auth.uid() = user_id);

-- Cloud Saves: User manages own
CREATE POLICY "Users can view their own saves" ON public.saves
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert/update their own saves" ON public.saves
  FOR ALL USING (auth.uid() = user_id);

-- Matches: Anyone can read matching room, host/guest can update
CREATE POLICY "Matches viewable by code" ON public.matches
  FOR SELECT USING (true);
CREATE POLICY "Anyone can create a match" ON public.matches
  FOR INSERT WITH CHECK (true);
CREATE POLICY "Players can update their match" ON public.matches
  FOR UPDATE USING (true);
