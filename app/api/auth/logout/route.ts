import { NextRequest, NextResponse } from 'next/server';
import { authService } from '@/lib/auth/auth-service';

export async function POST(req: NextRequest) {
  try {
    const { token } = await req.json();
    if (token) {
      await authService.logout(token);
    }
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Logout error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
