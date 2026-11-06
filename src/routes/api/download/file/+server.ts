export const GET = async ({ url }) => {
  const format = url.searchParams.get('format') || 'mp4';
  const buffer = Buffer.from([0x00, 0x00, 0x00, 0x20, 0x66, 0x74, 0x79, 0x70]);
  return new Response(buffer, {
    headers: {
      'Content-Type': format === 'mp3' ? 'audio/mpeg' : 'video/mp4',
      'Content-Disposition': `attachment; filename="download.${format}"`
    }
  });
};