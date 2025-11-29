import { createClient } from '@supabase/supabase-js';

// Read from environment variables (Vite uses VITE_ prefix)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Warn if credentials are missing (helpful during development)
if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    'Supabase credentials not found in environment variables.',
    'Authentication features will not work.',
    'Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your .env file.'
  );
}

// Create the Supabase client
// Uses placeholder values to prevent crashes when credentials are missing
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key'
);

export default supabase;