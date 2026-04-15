import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = (process.env.REACT_APP_SUPABASE_URL ?? '').trim();
const supabaseAnonKey = (process.env.REACT_APP_SUPABASE_ANON_KEY ?? '').trim();

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

// NOTE: Supabase client must not be created when env vars are missing,
// otherwise supabase-js throws at import time and crashes the entire app.
export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// Database types
export type Song = {
  id?: number;
  section: string;
  song: string;
  artist: string;
  order_index: number;
  master_order?: number;
  created_at?: string;
  updated_at?: string;
};

export type SetlistSection = {
  id?: number;
  title: string;
  order_index: number;
  created_at?: string;
  updated_at?: string;
};

export type Note = {
  id?: number;
  user_name: 'Collin' | 'Leif' | 'Ryland';
  message: string;
  created_at?: string;
};

export type CustomSetlist = {
  id?: number;
  name: string;
  created_at?: string;
  updated_at?: string;
};

export type CustomSetlistSong = {
  id?: number;
  setlist_id: number;
  section: string;
  song: string;
  artist: string;
  order_index: number;
  created_at?: string;
};

