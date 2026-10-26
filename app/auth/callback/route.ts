import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '../../../lib/supabase/server';
import { safePostLoginPath } from '../../../lib/marketplace/ux-flows';

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  // V52: return to sign-in (which resumes the saved intent), never to the retired /beta page.
  const next = safePostLoginPath(url.searchParams.get('next'));
  const destination = new URL('/login/?confirmed=1' + (next ? '&next=' + encodeURIComponent(next) : ''), url.origin);
  if (!code) return NextResponse.redirect(new URL('/login?error=missing_code', url.origin));
  try {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) throw error;
    return NextResponse.redirect(destination);
  } catch {
    return NextResponse.redirect(new URL('/login?error=auth_failed', url.origin));
  }
}
