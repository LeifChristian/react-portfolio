import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || '';
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database types
export type Song = {
  id?: number;
  section: string;
  song: string;
  artist: string;
  order_index: number;
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

