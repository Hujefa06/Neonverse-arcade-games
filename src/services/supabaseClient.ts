import { createClient } from '@supabase/supabase-js';

const env = typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env : (typeof process !== 'undefined' ? process.env : {});
const supabaseUrl = env?.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = env?.VITE_SUPABASE_ANON_KEY as string | undefined;

export const isRealSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  supabaseUrl.startsWith('http') &&
  supabaseAnonKey.length > 20
);

// In-memory / LocalStorage Mock Client for 100% offline guest play
class LocalMockChannel {
  name: string;
  private bc: BroadcastChannel | null = null;
  private listeners: Record<string, ((payload: any) => void)[]> = {};
  private presenceState: Record<string, any> = {};

  constructor(name: string) {
    this.name = name;
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        this.bc = new BroadcastChannel(`neonverse_channel_${name}`);
        this.bc.onmessage = (event) => {
          const { type, eventName, payload } = event.data || {};
          if (type === 'broadcast' && eventName && this.listeners[eventName]) {
            this.listeners[eventName].forEach((fn) => fn({ payload }));
          } else if (type === 'presence_sync') {
            this.presenceState = payload;
            if (this.listeners['presence_sync']) {
              this.listeners['presence_sync'].forEach((fn) => fn(this.presenceState));
            }
          }
        };
      } catch (err) {
        console.warn('[MockChannel] BroadcastChannel init error', err);
      }
    }
  }

  on(event: string, opts: any, callback?: any) {
    const cb = typeof opts === 'function' ? opts : callback;
    const key = typeof opts === 'object' && opts.event ? opts.event : event;
    if (!this.listeners[key]) this.listeners[key] = [];
    if (cb) this.listeners[key].push(cb);
    return this;
  }

  send(data: { type: string; event: string; payload: any }) {
    if (this.bc) {
      this.bc.postMessage({
        type: data.type || 'broadcast',
        eventName: data.event,
        payload: data.payload,
      });
    }
    // Also trigger local listeners
    if (this.listeners[data.event]) {
      this.listeners[data.event].forEach((fn) => fn({ payload: data.payload }));
    }
    return Promise.resolve({ error: null });
  }

  track(presenceData: any) {
    const key = presenceData.id || `user_${Date.now()}`;
    this.presenceState[key] = presenceData;
    if (this.bc) {
      this.bc.postMessage({
        type: 'presence_sync',
        payload: this.presenceState,
      });
    }
    return Promise.resolve({ error: null });
  }

  subscribe(callback?: (status: string) => void) {
    if (callback) setTimeout(() => callback('SUBSCRIBED'), 10);
    return this;
  }

  unsubscribe() {
    if (this.bc) {
      this.bc.close();
      this.bc = null;
    }
    this.listeners = {};
    return Promise.resolve({ error: null });
  }
}

class LocalMockQueryBuilder {
  private table: string;
  private filters: ((item: any) => boolean)[] = [];
  private sortField: string | null = null;
  private sortAsc = true;
  private limitCount: number | null = null;

  constructor(table: string) {
    this.table = table;
  }

  private getStorageKey(): string {
    return `neonverse_mock_db_${this.table}`;
  }

  private readAll(): any[] {
    try {
      const data = localStorage.getItem(this.getStorageKey());
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  private writeAll(items: any[]) {
    try {
      localStorage.setItem(this.getStorageKey(), JSON.stringify(items));
    } catch (e) {
      console.warn('[MockDB] localStorage write error', e);
    }
  }

  select(columns: string = '*') {
    return this;
  }

  eq(column: string, value: any) {
    this.filters.push((item) => item[column] === value);
    return this;
  }

  order(column: string, { ascending = true }: { ascending?: boolean } = {}) {
    this.sortField = column;
    this.sortAsc = ascending;
    return this;
  }

  limit(count: number) {
    this.limitCount = count;
    return this;
  }

  async single() {
    const res = await this.then();
    return {
      data: res.data && res.data.length > 0 ? res.data[0] : null,
      error: res.data && res.data.length > 0 ? null : { message: 'Row not found' },
    };
  }

  async insert(record: any | any[]) {
    const current = this.readAll();
    const newItems = Array.isArray(record) ? record : [record];
    const withIds = newItems.map((item) => ({
      id: item.id || `mock_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      created_at: item.created_at || new Date().toISOString(),
      ...item,
    }));
    this.writeAll([...current, ...withIds]);
    return { data: withIds, error: null };
  }

  async upsert(record: any) {
    const current = this.readAll();
    const idx = current.findIndex((item) => {
      if (record.id && item.id === record.id) return true;
      if (record.game_id && record.user_id && item.game_id === record.game_id && item.user_id === record.user_id) return true;
      return false;
    });
    if (idx >= 0) {
      current[idx] = { ...current[idx], ...record, updated_at: new Date().toISOString() };
    } else {
      current.push({
        id: record.id || `mock_${Date.now()}`,
        created_at: new Date().toISOString(),
        ...record,
      });
    }
    this.writeAll(current);
    return { data: record, error: null };
  }

  async delete() {
    let current = this.readAll();
    if (this.filters.length > 0) {
      current = current.filter((item) => !this.filters.every((fn) => fn(item)));
    } else {
      current = [];
    }
    this.writeAll(current);
    return { data: null, error: null };
  }

  async then(resolve?: (value: any) => void) {
    let list = this.readAll();
    for (const filter of this.filters) {
      list = list.filter(filter);
    }
    if (this.sortField) {
      const field = this.sortField;
      const asc = this.sortAsc;
      list.sort((a, b) => {
        if (a[field] < b[field]) return asc ? -1 : 1;
        if (a[field] > b[field]) return asc ? 1 : -1;
        return 0;
      });
    }
    if (this.limitCount !== null) {
      list = list.slice(0, this.limitCount);
    }
    const result = { data: list, error: null };
    if (resolve) resolve(result);
    return result;
  }
}

class LocalMockSupabaseClient {
  auth = {
    async getUser() {
      try {
        const stored = localStorage.getItem('neonverse_mock_user');
        return { data: { user: stored ? JSON.parse(stored) : null }, error: null };
      } catch {
        return { data: { user: null }, error: null };
      }
    },
    async getSession() {
      const userRes = await this.getUser();
      return {
        data: {
          session: userRes.data.user ? { user: userRes.data.user, access_token: 'mock_token' } : null,
        },
        error: null,
      };
    },
    async signUp({ email, password, options }: any) {
      const newUser = {
        id: `usr_${Date.now()}`,
        email,
        user_metadata: options?.data || { username: email.split('@')[0] },
      };
      localStorage.setItem('neonverse_mock_user', JSON.stringify(newUser));
      return { data: { user: newUser, session: { user: newUser } }, error: null };
    },
    async signInWithPassword({ email }: any) {
      const user = {
        id: `usr_${email.replace(/[^a-zA-Z0-9]/g, '') || 'player'}`,
        email,
        user_metadata: { username: email.split('@')[0] },
      };
      localStorage.setItem('neonverse_mock_user', JSON.stringify(user));
      return { data: { user, session: { user } }, error: null };
    },
    async signInWithOtp({ email }: any) {
      const user = {
        id: `usr_${email.replace(/[^a-zA-Z0-9]/g, '') || 'magic_player'}`,
        email,
        user_metadata: { username: email.split('@')[0] },
      };
      localStorage.setItem('neonverse_mock_user', JSON.stringify(user));
      return { data: { user, session: { user } }, error: null };
    },
    async signOut() {
      localStorage.removeItem('neonverse_mock_user');
      return { error: null };
    },
    onAuthStateChange(callback: (event: string, session: any) => void) {
      // Mock listener
      return {
        data: {
          subscription: {
            unsubscribe: () => {},
          },
        },
      };
    },
  };

  from(table: string) {
    return new LocalMockQueryBuilder(table);
  }

  channel(name: string) {
    return new LocalMockChannel(name);
  }
}

// Export singleton instance: real if credentials provided, else local mock
export const supabase = isRealSupabaseConfigured
  ? createClient(supabaseUrl!, supabaseAnonKey!)
  : (new LocalMockSupabaseClient() as any);
