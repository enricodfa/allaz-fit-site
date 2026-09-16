// Cliente Supabase compartilhado por todas as telas da área logada.
// A chave abaixo é a chave PÚBLICA (anon). Ela pode ficar no frontend:
// toda a autorização é aplicada pelo banco via RLS, não por este código.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

export const SUPABASE_URL = 'https://denntoorhjfzwywnzqsp.supabase.co';
export const SUPABASE_ANON_KEY = 'sb_publishable_NxEQz6ncgqfXT7FIjQJB6Q_6-GLBwIt';

export const sb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    storageKey: 'allazfit-auth',
  },
});
