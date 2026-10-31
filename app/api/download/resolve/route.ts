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

    const trimmedUrl = url.trim();

    // Generate base UI structure using the existing helper
    const baseMedia = resolveMediaInfo(trimmedUrl);

    // Fetch real video stream from Cobalt API
    const cobaltRes = await fetch('https://api.cobalt.tools/', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: trimmedUrl,
        videoQuality: '1080',
        downloadMode: 'auto',
      }),
    });

    const cobaltData = await cobaltRes.json();

    if (!cobaltRes.ok || cobaltData.status === 'error' || !cobaltData.url) {
      return NextResponse.json(
        {
          error:
            cobaltData.text ||
            'Could not extract direct video stream from this URL. Make sure the video is public.',
        },
        { status: 400 }
      );
    }

    const realStreamUrl = cobaltData.url;

    // Inject the real stream URL into all video and audio options
    const updatedMedia = {
      ...baseMedia,
      title: cobaltData.filename || baseMedia.title,
      sourceUrl: realStreamUrl,
      videoOptions: baseMedia.videoOptions.map((opt) => ({
        ...opt,
        url: realStreamUrl,
      })),
      audioOptions: baseMedia.audioOptions.map((opt) => ({
        ...opt,
        url: realStreamUrl,
      })),
    };

    return NextResponse.json({ success: true, media: updatedMedia });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to resolve media URL';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}