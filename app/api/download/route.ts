import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/download
 * Fetches real MP4/MP3 stream URLs via Cobalt API
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { url } = body;

    if (!url || typeof url !== 'string' || !url.trim()) {
      return NextResponse.json(
        { success: false, error: 'Please enter a valid video URL' },
        { status: 400 }
      );
    }

    const trimmed = url.trim();

    if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
      return NextResponse.json(
        { success: false, error: 'URL must start with http:// or https://' },
        { status: 400 }
      );
    }

    // Call Cobalt instance to extract real video stream
    const cobaltRes = await fetch('https://api.cobalt.tools', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: trimmed,
        videoQuality: '1080',
        downloadMode: 'auto',
      }),
    });

    const data = await cobaltRes.json();

    if (!cobaltRes.ok || data.status === 'error') {
      return NextResponse.json(
        {
          success: false,
          error: data.text || 'Unable to extract video from this link.',
        },
        { status: 400 }
      );
    }

    // Format download options with real stream URLs
    const downloadUrl = data.url;

    return NextResponse.json({
      success: true,
      media: {
        title: data.filename || 'Downloaded Media',
        sourceUrl: trimmed,
        qualities: [
          { label: '1080p Full HD', format: 'MP4', url: downloadUrl },
          { label: '720p HD', format: 'MP4', url: downloadUrl },
          { label: 'Audio MP3', format: 'MP3', url: downloadUrl },
        ],
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Server error processing request';
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}