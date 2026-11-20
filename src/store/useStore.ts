import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AudioSettings, FXSettings, UserProfile } from '../types/game';

interface RecentlyPlayedGame {
  gameId: string;
  lastPlayedAt: string;
  highScore: number;
}

interface AppState {
  // Audio
  audioSettings: AudioSettings;
  setAudioSetting: <K extends keyof AudioSettings>(key: K, value: AudioSettings[K]) => void;
  toggleMute: () => void;

  // FX & Accessibility
  fxSettings: FXSettings;
  setFxSetting: <K extends keyof FXSettings>(key: K, value: FXSettings[K]) => void;

  // Profile / Auth
  user: UserProfile;
  setUser: (user: Partial<UserProfile>) => void;
  addXp: (amount: number) => { leveledUp: boolean; newLevel: number };
  addCoins: (amount: number) => void;
  logoutUser: () => void;

  // Game Persistence
  favorites: string[];
  toggleFavorite: (gameId: string) => boolean;
  recentlyPlayed: RecentlyPlayedGame[];
  recordGamePlay: (gameId: string, score: number) => void;

  // Modals
  isAuthOpen: boolean;
  setAuthOpen: (open: boolean) => void;
  isSettingsOpen: boolean;
  setSettingsOpen: (open: boolean) => void;
  isSearchOpen: boolean;
  setSearchOpen: (open: boolean) => void;
}

const defaultAudio: AudioSettings = {
  masterVolume: 0.8,
  musicVolume: 0.7,
  sfxVolume: 0.8,
  typingVolume: 0.6,
  victoryVolume: 0.9,
  isMuted: false,
};

const defaultFX: FXSettings = {
  lowFxMode: false,
  reducedMotion: false,
  leftHandedTouch: false,
};

const createDefaultGuest = (): UserProfile => {
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  return {
    id: `guest_${randomSuffix}`,
    username: `NeonGuest_${randomSuffix}`,
    avatar: 'cyber_ninja',
    xp: 0,
    level: 1,
    coins: 50,
    isGuest: true,
  };
};

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Audio
      audioSettings: defaultAudio,
      setAudioSetting: (key, value) =>
        set((state) => ({
          audioSettings: { ...state.audioSettings, [key]: value },
        })),
      toggleMute: () =>
        set((state) => ({
          audioSettings: {
            ...state.audioSettings,
            isMuted: !state.audioSettings.isMuted,
          },
        })),

      // FX
      fxSettings: defaultFX,
      setFxSetting: (key, value) =>
        set((state) => ({
          fxSettings: { ...state.fxSettings, [key]: value },
        })),

      // User
      user: createDefaultGuest(),
      setUser: (updates) =>
        set((state) => ({
          user: { ...state.user, ...updates },
        })),
      addXp: (amount) => {
        const currentXp = get().user.xp + amount;
        // Formula: each level requires level * 250 XP
        const currentLevel = get().user.level;
        const xpNeededForNext = currentLevel * 250;
        let newLevel = currentLevel;
        let leveledUp = false;

        if (currentXp >= xpNeededForNext) {
          newLevel = currentLevel + 1;
          leveledUp = true;
        }

        set((state) => ({
          user: { ...state.user, xp: currentXp, level: newLevel },
        }));

        return { leveledUp, newLevel };
      },
      addCoins: (amount) =>
        set((state) => ({
          user: { ...state.user, coins: state.user.coins + amount },
        })),
      logoutUser: () =>
        set(() => ({
          user: createDefaultGuest(),
        })),

      // Favorites
      favorites: ['typestrike-arena', 'fliprush', 'tethered'],
      toggleFavorite: (gameId) => {
        const { favorites } = get();
        const exists = favorites.includes(gameId);
        const newFavs = exists
          ? favorites.filter((id) => id !== gameId)
          : [...favorites, gameId];
        set({ favorites: newFavs });
        return !exists;
      },

      // Recently Played
      recentlyPlayed: [],
      recordGamePlay: (gameId, score) => {
        set((state) => {
          const existing = state.recentlyPlayed.find((r) => r.gameId === gameId);
          const highScore = existing ? Math.max(existing.highScore, score) : score;
          const filtered = state.recentlyPlayed.filter((r) => r.gameId !== gameId);
          return {
            recentlyPlayed: [
              { gameId, lastPlayedAt: new Date().toISOString(), highScore },
              ...filtered,
            ].slice(0, 10),
          };
        });
      },

      // Modals
      isAuthOpen: false,
      setAuthOpen: (open) => set({ isAuthOpen: open }),
      isSettingsOpen: false,
      setSettingsOpen: (open) => set({ isSettingsOpen: open }),
      isSearchOpen: false,
      setSearchOpen: (open) => set({ isSearchOpen: open }),
    }),
    {
      name: 'neonverse_arcade_state',
      partialize: (state) => ({
        audioSettings: state.audioSettings,
        fxSettings: state.fxSettings,
        user: state.user,
        favorites: state.favorites,
        recentlyPlayed: state.recentlyPlayed,
      }),
    }
  )
);
