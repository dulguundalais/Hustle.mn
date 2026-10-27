import { NextResponse } from 'next/server';
import { getApprovedBetaUser } from '../../../../lib/auth/require-beta-user';

export async function GET() {
  try {
    const user = await getApprovedBetaUser();
    if (!user) return NextResponse.json({ error: 'Not authorized for closed beta' }, { status: 403 });
    return NextResponse.json({ id: user.id, email: user.email });
  } catch {
    return NextResponse.json({ error: 'Authentication service unavailable' }, { status: 503 });
  }
}
