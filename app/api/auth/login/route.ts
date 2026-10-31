import { NextRequest, NextResponse } from 'next/server';
import { authService } from '@/lib/auth/auth-service';

export async function POST(req: NextRequest) {
  try {
    const { username, password } = await req.json();

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Username and password are required' },
        { status: 400 }
      );
    }

    const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
    const result = await authService.login({ username, password }, ip);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error, remainingAttempts: result.remainingAttempts },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      session: result.session,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Authentication failure';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
