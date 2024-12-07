import { createClient } from '@supabase/supabase-js';
import { env } from '../config/env';

if (!env.SUPABASE_URL) throw new Error('Missing VITE_SUPABASE_URL');
if (!env.SUPABASE_ANON_KEY) throw new Error('Missing VITE_SUPABASE_ANON_KEY');

export const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY);