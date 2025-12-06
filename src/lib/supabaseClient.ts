import { createClient } from '@supabase/supabase-js';

// As variáveis de ambiente devem ser configuradas no seu ambiente (ex: .env.local ou Vercel)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase URL ou Anon Key não foram definidas nas variáveis de ambiente.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
