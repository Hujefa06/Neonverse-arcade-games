import { useStore } from '../store/useStore';
import { supabase, isRealSupabaseConfigured } from '../services/supabaseClient';

class SaveManager {
  private syncTimers: Map<string, any> = new Map();

  async loadSave<T = any>(gameId: string, defaultState: T): Promise<T> {
    const { user } = useStore.getState();

    // 1. Try local storage first for instant response
    let localData: T | null = null;
    try {
      const raw = localStorage.getItem(`neonverse_save_${gameId}`);
      if (raw) localData = JSON.parse(raw);
    } catch (e) {
      console.warn('[SaveManager] Failed to read local save', e);
    }

    // 2. If authenticated, try fetching cloud save
    if (!user.isGuest && user.id) {
      try {
        if (isRealSupabaseConfigured) {
          const { data, error } = await supabase
            .from('saves')
            .select('state')
            .eq('game_id', gameId)
            .eq('user_id', user.id)
            .single();

          if (!error && data?.state) {
            return data.state as T;
          }
        } else {
          // Fetch from mock API
          const res = await fetch(`/api/saves/${gameId}`, {
            headers: { 'x-user-id': user.id },
          });
          const json = await res.json();
          if (json.state) return json.state as T;
        }
      } catch (err) {
        console.warn('[SaveManager] Cloud save fetch error, falling back to local', err);
      }
    }

    return localData ?? defaultState;
  }

  save<T = any>(gameId: string, state: T) {
    // Save to local storage immediately
    try {
      localStorage.setItem(`neonverse_save_${gameId}`, JSON.stringify(state));
    } catch (e) {
      console.warn('[SaveManager] localStorage write failed', e);
    }

    // Debounced cloud sync if logged in
    const { user } = useStore.getState();
    if (!user.isGuest && user.id) {
      if (this.syncTimers.has(gameId)) {
        clearTimeout(this.syncTimers.get(gameId));
      }

      const timer = setTimeout(async () => {
        try {
          if (isRealSupabaseConfigured) {
            await supabase.from('saves').upsert({
              game_id: gameId,
              user_id: user.id,
              state,
              updated_at: new Date().toISOString(),
            });
          } else {
            await fetch(`/api/saves/${gameId}`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'x-user-id': user.id,
              },
              body: JSON.stringify({ state }),
            });
          }
        } catch (err) {
          console.warn('[SaveManager] Cloud sync failed', err);
        }
      }, 1000); // 1-second debounce

      this.syncTimers.set(gameId, timer);
    }
  }
}

export const saveManager = new SaveManager();
