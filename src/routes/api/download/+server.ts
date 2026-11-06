import type { RequestHandler } from '@sveltejs/kit';

const STREAM_MP4 = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4';
const STREAM_MP3 = 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3';

export const GET: RequestHandler = async ({ url }) => {
  const format = (url.searchParams.get('format') || 'mp4').toLowerCase();
  const quality = url.searchParams.get('quality') || '1080p';
  const rawTitle = url.searchParams.get('title') || 'media';
  const cleanTitle = rawTitle.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 40);

  const isMp3 = format === 'mp3';
  const ext = isMp3 ? 'mp3' : 'mp4';
  const filename = `[mxdownloader.com]_${cleanTitle}_${quality}.${ext}`;
  const targetStream = isMp3 ? STREAM_MP3 : STREAM_MP4;

  try {
    const response = await fetch(targetStream);
    const mediaBuffer = await response.arrayBuffer();

    return new Response(mediaBuffer, {
      status: 200,
      headers: {
        'Content-Type': isMp3 ? 'audio/mpeg' : 'video/mp4',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': mediaBuffer.byteLength.toString(),
        'Accept-Ranges': 'bytes',
        'Cache-Control': 'public, max-age=3600'
      }
    });
  } catch {
    return new Response('Media streaming error', { status: 500 });
  }
};