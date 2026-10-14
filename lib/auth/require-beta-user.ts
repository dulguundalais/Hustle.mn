import 'server-only';
import { createSupabaseServerClient } from '../supabase/server';

export async function getApprovedBetaUser() {
  const supabase = await createSupabaseServerClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user || !user.email) return null;
  const { data, error: allowError } = await supabase
    .from('beta_allowlist').select('email').eq('email', user.email.toLowerCase()).eq('enabled', true).maybeSingle();
  if (allowError || !data) return null;
  return user;
}
