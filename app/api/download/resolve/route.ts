import { NextRequest, NextResponse } from 'next/server';
import { resolveMediaInfo } from '@/lib/downloader/media-resolver';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { url } = body;

    if (!url || typeof url !== 'string' || !url.trim()) {
      return NextResponse.json(
        { error: 'Please enter a valid video or audio URL' },
        { status: 400 }
      );
    }

    // Small simulated network resolution latency (300ms) for realistic UX
    await new Promise((resolve) => setTimeout(resolve, 350));

    const media = resolveMediaInfo(url);
    return NextResponse.json({ success: true, media });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to resolve media URL';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
