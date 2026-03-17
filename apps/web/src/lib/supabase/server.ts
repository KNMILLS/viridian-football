import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

function ensureEnv(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(`Missing required env var ${name}`);
  }
  return value;
}

export function createSupabaseClient(): SupabaseClient {
  const url = ensureEnv('SUPABASE_URL', supabaseUrl);
  const key = ensureEnv('SUPABASE_ANON_KEY', supabaseAnonKey);
  return createClient(url, key, {
    auth: { persistSession: false },
  });
}

export function createServiceSupabaseClient(): SupabaseClient {
  const url = ensureEnv('SUPABASE_URL', supabaseUrl);
  const key = ensureEnv('SUPABASE_SERVICE_ROLE_KEY', supabaseServiceRoleKey);
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
