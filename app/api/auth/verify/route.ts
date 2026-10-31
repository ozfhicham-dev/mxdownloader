import { NextRequest, NextResponse } from 'next/server';
import { authService } from '@/lib/auth/auth-service';

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '') || (await req.json()).token;

    if (!token) {
      return NextResponse.json({ error: 'Token missing' }, { status: 401 });
    }

    const user = await authService.validateSession(token);
    if (!user) {
      return NextResponse.json({ error: 'Invalid or expired session' }, { status: 401 });
    }

    return NextResponse.json({
      valid: true,
      user,
      provider: authService.getProviderName(),
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Session verification error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
