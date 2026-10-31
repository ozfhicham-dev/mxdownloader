import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/download/file
 * Streams the real media file directly to the user's browser as a downloadable MP4 or MP3
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const streamUrl = searchParams.get('url');
  const format = (searchParams.get('format') || 'mp4').toLowerCase();
  const quality = searchParams.get('quality') || '1080p';
  const rawTitle = searchParams.get('title') || 'Video_Audio_Download';

  // Reject requests without a valid target stream URL
  if (!streamUrl || !streamUrl.startsWith('http')) {
    return NextResponse.json(
      { success: false, error: 'No valid media stream URL provided.' },
      { status: 400 }
    );
  }

  // Clean filename for safe Content-Disposition headers across browsers
  const cleanTitle = rawTitle.replace(/[^a-zA-Z0-9_\-\s]/g, '').trim().substring(0, 50) || 'media';
  const ext = format === 'mp3' ? 'mp3' : 'mp4';
  const filename = `[mxdownloader.com]_${cleanTitle}_${quality.replace(/\s+/g, '_')}.${ext}`;
  const contentType = ext === 'mp3' ? 'audio/mpeg' : 'video/mp4';

  try {
    // Fetch the remote media binary stream
    const mediaResponse = await fetch(streamUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
    });

    if (!mediaResponse.ok || !mediaResponse.body) {
      return NextResponse.json(
        { success: false, error: 'Failed to fetch the media stream from source.' },
        { status: 502 }
      );
    }

    // Proxy the stream directly to force browser file download
    return new NextResponse(mediaResponse.body as unknown as BodyInit, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-cache',
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error downloading file';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}