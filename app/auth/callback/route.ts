import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '../../../lib/supabase/server';

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const destination = new URL('/beta', url.origin);
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
