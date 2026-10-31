export interface DownloadQualityOption {
  id: string;
  label: string;
  quality: string;
  format: 'MP4' | 'MP3' | 'M4A';
  type: 'video' | 'audio';
  size: string;
  downloadUrl: string;
  recommended?: boolean;
  bitrate?: string;
  resolution?: string;
}

export interface ParsedMediaResult {
  url: string;
  platform: 'tiktok' | 'instagram' | 'facebook' | 'youtube' | 'twitter' | 'web';
  platformName: string;
  platformColor: string;
  title: string;
  author: string;
  duration: string;
  thumbnail: string;
  aspectRatio: '9:16' | '16:9';
  downloads: DownloadQualityOption[];
}

/**
 * Lightweight mock parser and link extractor for TikTok, Instagram, and Facebook
 */
export function parseMediaUrl(rawUrl: string): ParsedMediaResult {
  const url = rawUrl.trim();
  const lower = url.toLowerCase();

  // 1. TikTok Parser
  if (lower.includes('tiktok.com')) {
    // Extract video ID or username if present
    const videoIdMatch = url.match(/\/video\/(\d+)/);
    const videoId = videoIdMatch ? videoIdMatch[1] : Math.floor(1000000000 + Math.random() * 9000000000).toString();
    const userMatch = url.match(/@([a-zA-Z0-9_.-]+)/);
    const author = userMatch ? `@${userMatch[1]}` : '@tiktok_trending';
    const title = `TikTok Video (Clean No-Watermark) - ${author} #${videoId.slice(-4)}`;

    const downloads: DownloadQualityOption[] = [
      {
        id: 'tiktok_1080p',
        label: '1080p Full HD',
        quality: '1080p',
        format: 'MP4',
        type: 'video',
        resolution: '1080x1920',
        size: '34.8 MB',
        downloadUrl: `/api/download/file?format=mp4&quality=1080p_NoWatermark&title=${encodeURIComponent(title)}`,
        recommended: true,
      },
      {
        id: 'tiktok_720p',
        label: '720p HD',
        quality: '720p',
        format: 'MP4',
        type: 'video',
        resolution: '720x1280',
        size: '18.2 MB',
        downloadUrl: `/api/download/file?format=mp4&quality=720p_HD&title=${encodeURIComponent(title)}`,
      },
      {
        id: 'tiktok_mp3_320',
        label: 'Audio MP3',
        quality: '320kbps',
        format: 'MP3',
        type: 'audio',
        bitrate: '320 kbps',
        size: '6.4 MB',
        downloadUrl: `/api/download/file?format=mp3&quality=320kbps_Studio&title=${encodeURIComponent(title)}`,
        recommended: true,
      },
      {
        id: 'tiktok_mp3_128',
        label: 'Audio MP3 (Fast)',
        quality: '128kbps',
        format: 'MP3',
        type: 'audio',
        bitrate: '128 kbps',
        size: '2.8 MB',
        downloadUrl: `/api/download/file?format=mp3&quality=128kbps_Fast&title=${encodeURIComponent(title)}`,
      },
    ];

    return {
      url,
      platform: 'tiktok',
      platformName: 'TikTok',
      platformColor: '#000000',
      title,
      author,
      duration: '00:34',
      thumbnail: 'https://picsum.photos/seed/tiktok_thumb_2026/600/1066',
      aspectRatio: '9:16',
      downloads,
    };
  }

  // 2. Instagram Parser (Reels, Posts, Stories)
  if (lower.includes('instagram.com') || lower.includes('instagr.am')) {
    const isReel = lower.includes('/reel/') || lower.includes('/reels/');
    const shortcodeMatch = url.match(/\/(?:p|reel|tv)\/([a-zA-Z0-9_-]+)/);
    const shortcode = shortcodeMatch ? shortcodeMatch[1] : 'C_instagram';
    const author = '@instagram_creator';
    const title = isReel
      ? `Instagram Reel - Viral Spotlight [${shortcode}]`
      : `Instagram Video Post - High Definition [${shortcode}]`;

    const downloads: DownloadQualityOption[] = [
      {
        id: 'ig_1080p',
        label: '1080p Full HD',
        quality: '1080p',
        format: 'MP4',
        type: 'video',
        resolution: '1080x1920',
        size: '28.6 MB',
        downloadUrl: `/api/download/file?format=mp4&quality=1080p_FullHD&title=${encodeURIComponent(title)}`,
        recommended: true,
      },
      {
        id: 'ig_720p',
        label: '720p HD',
        quality: '720p',
        format: 'MP4',
        type: 'video',
        resolution: '720x1280',
        size: '14.9 MB',
        downloadUrl: `/api/download/file?format=mp4&quality=720p_HD&title=${encodeURIComponent(title)}`,
      },
      {
        id: 'ig_mp3_320',
        label: 'Audio MP3',
        quality: '320kbps',
        format: 'MP3',
        type: 'audio',
        bitrate: '320 kbps',
        size: '5.2 MB',
        downloadUrl: `/api/download/file?format=mp3&quality=320kbps_HQ&title=${encodeURIComponent(title)}`,
        recommended: true,
      },
    ];

    return {
      url,
      platform: 'instagram',
      platformName: 'Instagram',
      platformColor: '#E4405F',
      title,
      author,
      duration: '00:52',
      thumbnail: 'https://picsum.photos/seed/instagram_thumb_2026/600/1066',
      aspectRatio: isReel ? '9:16' : '16:9',
      downloads,
    };
  }

  // 3. Facebook Parser (Videos, Reels, Watch)
  if (lower.includes('facebook.com') || lower.includes('fb.watch') || lower.includes('fb.me')) {
    const isReel = lower.includes('/reel/');
    const idMatch = url.match(/(?:v=|videos\/|reel\/)(\d+)/);
    const videoId = idMatch ? idMatch[1] : 'fb_' + Math.floor(100000000 + Math.random() * 900000000);
    const author = 'Public Creator Channel';
    const title = isReel
      ? `Facebook Reel - High Definition #${videoId.slice(-4)}`
      : `Facebook Watch Video - 1080p / 4K Stream #${videoId.slice(-4)}`;

    const downloads: DownloadQualityOption[] = [
      {
        id: 'fb_4k',
        label: '4K Ultra HD',
        quality: '4K (2160p)',
        format: 'MP4',
        type: 'video',
        resolution: '3840x2160',
        size: '124.5 MB',
        downloadUrl: `/api/download/file?format=mp4&quality=4K_2160p&title=${encodeURIComponent(title)}`,
      },
      {
        id: 'fb_1080p',
        label: '1080p Full HD',
        quality: '1080p',
        format: 'MP4',
        type: 'video',
        resolution: '1920x1080',
        size: '39.4 MB',
        downloadUrl: `/api/download/file?format=mp4&quality=1080p_FullHD&title=${encodeURIComponent(title)}`,
        recommended: true,
      },
      {
        id: 'fb_720p',
        label: '720p HD',
        quality: '720p',
        format: 'MP4',
        type: 'video',
        resolution: '1280x720',
        size: '19.8 MB',
        downloadUrl: `/api/download/file?format=mp4&quality=720p_HD&title=${encodeURIComponent(title)}`,
      },
      {
        id: 'fb_mp3_320',
        label: 'Audio MP3',
        quality: '320kbps',
        format: 'MP3',
        type: 'audio',
        bitrate: '320 kbps',
        size: '7.8 MB',
        downloadUrl: `/api/download/file?format=mp3&quality=320kbps_HQ&title=${encodeURIComponent(title)}`,
        recommended: true,
      },
    ];

    return {
      url,
      platform: 'facebook',
      platformName: 'Facebook',
      platformColor: '#1877F2',
      title,
      author,
      duration: '02:45',
      thumbnail: 'https://picsum.photos/seed/facebook_thumb_2026/800/450',
      aspectRatio: isReel ? '9:16' : '16:9',
      downloads,
    };
  }

  // 4. Universal Web Fallback (YouTube, Twitter/X, etc.)
  const isAudioIntent = lower.includes('mp3') || lower.includes('audio') || lower.includes('sound');
  const platformName = lower.includes('youtube') || lower.includes('youtu.be')
    ? 'YouTube'
    : lower.includes('twitter') || lower.includes('x.com')
    ? 'Twitter / X'
    : 'Universal Media';

  const title = `${platformName} Media Presentation - High Quality Stream`;
  const author = '@featured_creator';

  const downloads: DownloadQualityOption[] = [
    {
      id: 'web_1080p',
      label: '1080p Full HD',
      quality: '1080p',
      format: 'MP4',
      type: 'video',
      resolution: '1920x1080',
      size: '35.0 MB',
      downloadUrl: `/api/download/file?format=mp4&quality=1080p&title=${encodeURIComponent(title)}`,
      recommended: !isAudioIntent,
    },
    {
      id: 'web_720p',
      label: '720p HD',
      quality: '720p',
      format: 'MP4',
      type: 'video',
      resolution: '1280x720',
      size: '18.5 MB',
      downloadUrl: `/api/download/file?format=mp4&quality=720p&title=${encodeURIComponent(title)}`,
    },
    {
      id: 'web_mp3_320',
      label: 'Audio MP3',
      quality: '320kbps',
      format: 'MP3',
      type: 'audio',
      bitrate: '320 kbps',
      size: '8.2 MB',
      downloadUrl: `/api/download/file?format=mp3&quality=320kbps&title=${encodeURIComponent(title)}`,
      recommended: isAudioIntent,
    },
  ];

  return {
    url,
    platform: 'web',
    platformName,
    platformColor: '#10b981',
    title,
    author,
    duration: '03:12',
    thumbnail: 'https://picsum.photos/seed/web_thumb_2026/800/450',
    aspectRatio: '16:9',
    downloads,
  };
}
