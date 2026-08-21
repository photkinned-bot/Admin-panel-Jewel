import { createClient, SupabaseClient } from '@supabase/supabase-js';

let supabaseInstance: SupabaseClient | null = null;

const isValidUrl = (url: string) => {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
};

// Mock client for when Supabase is not configured
const mockSupabase = {
  from: () => ({
    select: () => ({
      order: () => Promise.resolve({ data: [], error: null }),
      limit: () => Promise.resolve({ data: [], error: null }),
      eq: () => Promise.resolve({ data: [], error: null }),
    }),
    insert: () => Promise.resolve({ data: null, error: null }),
    update: () => ({
      eq: () => Promise.resolve({ data: null, error: null }),
    }),
    delete: () => ({
      eq: () => Promise.resolve({ data: null, error: null }),
    }),
  }),
} as unknown as SupabaseClient;

export const supabase = new Proxy({} as SupabaseClient, {
  get: (target, prop, receiver) => {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim();
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();

    if (!supabaseUrl || !supabaseAnonKey || !isValidUrl(supabaseUrl)) {
      return Reflect.get(mockSupabase, prop, receiver);
    }

    if (!supabaseInstance) {
      supabaseInstance = createClient(supabaseUrl, supabaseAnonKey);
    }
    
    return Reflect.get(supabaseInstance, prop, receiver);
  }
});
