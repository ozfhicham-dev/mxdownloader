export function parseLink(rawUrl: string) {
  const url = rawUrl.trim();
  const lower = url.toLowerCase();

  let platformName = 'Facebook';
  let title = 'Facebook HD Video';
  let isVertical = false;

  if (lower.includes('tiktok.com')) {
    platformName = 'TikTok';
    title = 'TikTok Video (No Watermark)';
    isVertical = true;
  } else if (lower.includes('instagram.com')) {
    platformName = 'Instagram';
    title = 'Instagram Reel & Audio';
    isVertical = true;
  } else if (lower.includes('youtube.com') || lower.includes('youtu.be')) {
    platformName = 'YouTube';
    title = 'YouTube 1080p Stream';
  }

  return {
    url,
    platformName,
    title,
    author: '@featured_creator',
    duration: isVertical ? '00:38' : '03:15',
    thumbnail: isVertical ? 'https://picsum.photos/seed/vert/600/1066' : 'https://picsum.photos/seed/horiz/800/450',
    downloads: [
      { id: '1080', label: '1080p Full HD', format: 'MP4', size: '28.4 MB', downloadUrl: `/api/download/file?format=mp4&quality=1080p&title=${encodeURIComponent(title)}`, recommended: true },
      { id: '720', label: '720p HD', format: 'MP4', size: '14.2 MB', downloadUrl: `/api/download/file?format=mp4&quality=720p&title=${encodeURIComponent(title)}` },
      { id: 'mp3', label: 'Audio MP3 (320kbps)', format: 'MP3', size: '6.8 MB', downloadUrl: `/api/download/file?format=mp3&quality=320kbps&title=${encodeURIComponent(title)}`, recommended: true }
    ]
  };
}