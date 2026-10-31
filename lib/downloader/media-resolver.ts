export interface MediaStreamOption {
  id: string;
  type: 'video' | 'audio';
  format: 'MP4' | 'MP3' | 'M4A' | 'WEBM';
  quality: string;
  resolution?: string;
  bitrate?: string;
  fileSize: string;
  hasAudio: boolean;
  recommended?: boolean;
}

export interface ResolvedMedia {
  url: string;
  platform: string;
  platformName: string;
  platformColor: string;
  title: string;
  author: string;
  duration: string;
  thumbnail: string;
  aspectRatio: '16:9' | '9:16' | '1:1';
  videoOptions: MediaStreamOption[];
  audioOptions: MediaStreamOption[];
}

export function detectPlatform(url: string): { id: string; name: string; color: string } {
  const lower = url.toLowerCase();
  if (lower.includes('facebook.com') || lower.includes('fb.watch') || lower.includes('fb.me')) {
    return { id: 'facebook', name: 'Facebook', color: '#1877F2' };
  }
  if (lower.includes('instagram.com') || lower.includes('instagr.am')) {
    return { id: 'instagram', name: 'Instagram', color: '#E4405F' };
  }
  if (lower.includes('tiktok.com')) {
    return { id: 'tiktok', name: 'TikTok', color: '#000000' };
  }
  if (lower.includes('youtube.com') || lower.includes('youtu.be')) {
    return { id: 'youtube', name: 'YouTube', color: '#FF0000' };
  }
  if (lower.includes('twitter.com') || lower.includes('x.com')) {
    return { id: 'twitter', name: 'Twitter / X', color: '#0f1419' };
  }
  if (lower.includes('threads.net')) {
    return { id: 'threads', name: 'Threads', color: '#000000' };
  }
  if (lower.includes('pinterest.com') || lower.includes('pin.it')) {
    return { id: 'pinterest', name: 'Pinterest', color: '#BD081C' };
  }
  if (lower.includes('reddit.com') || lower.includes('redd.it')) {
    return { id: 'reddit', name: 'Reddit', color: '#FF4500' };
  }
  if (lower.includes('vimeo.com')) {
    return { id: 'vimeo', name: 'Vimeo', color: '#1AB7EA' };
  }
  if (lower.includes('soundcloud.com')) {
    return { id: 'soundcloud', name: 'SoundCloud', color: '#FF5500' };
  }
  // Generic fallback
  return { id: 'web', name: 'Universal Web', color: '#10b981' };
}

export function resolveMediaInfo(rawUrl: string): ResolvedMedia {
  const cleanUrl = rawUrl.trim();
  const platform = detectPlatform(cleanUrl);

  // Generate a clean, realistic title based on platform context
  let title = 'High Definition Video Presentation';
  let author = '@creator_spotlight';
  let duration = '01:42';
  let isVertical = false;

  if (cleanUrl.includes('reel') || cleanUrl.includes('reels') || cleanUrl.includes('short') || cleanUrl.includes('tiktok')) {
    isVertical = true;
    duration = '00:38';
    title = `${platform.name} Reel - Creative Visual Story`;
    author = `@${platform.id}_featured_creator`;
  } else if (platform.id === 'facebook') {
    title = 'Facebook Public Video - Community Spotlight & Highlights';
    author = 'Community Highlights Page';
    duration = '03:15';
  } else if (platform.id === 'youtube') {
    title = 'Official 4K Ultra HD Music Video & Performance';
    author = 'Official Artist Channel';
    duration = '04:12';
  } else if (platform.id === 'instagram') {
    title = 'Instagram Exclusive Video & Audio Track';
    author = '@visual_artist_studio';
    duration = '00:59';
  } else if (platform.id === 'soundcloud') {
    title = 'Electronic Chillwave & Lo-Fi Session - Original Mix';
    author = 'Sound Producer Collective';
    duration = '05:24';
  }

  // Pre-configured quality options for video
  const videoOptions: MediaStreamOption[] = [
    {
      id: 'v_4k',
      type: 'video',
      format: 'MP4',
      quality: '4K Ultra HD',
      resolution: '2160p (3840x2160)',
      fileSize: '142.8 MB',
      hasAudio: true,
      recommended: false,
    },
    {
      id: 'v_2k',
      type: 'video',
      format: 'MP4',
      quality: '2K Quad HD',
      resolution: '1440p (2560x1440)',
      fileSize: '78.4 MB',
      hasAudio: true,
      recommended: false,
    },
    {
      id: 'v_1080',
      type: 'video',
      format: 'MP4',
      quality: '1080p Full HD',
      resolution: '1080p (1920x1080)',
      fileSize: '36.2 MB',
      hasAudio: true,
      recommended: true, // Most popular
    },
    {
      id: 'v_720',
      type: 'video',
      format: 'MP4',
      quality: '720p HD',
      resolution: '720p (1280x720)',
      fileSize: '19.5 MB',
      hasAudio: true,
      recommended: false,
    },
    {
      id: 'v_480',
      type: 'video',
      format: 'MP4',
      quality: '480p SD',
      resolution: '480p (854x480)',
      fileSize: '11.8 MB',
      hasAudio: true,
      recommended: false,
    },
    {
      id: 'v_360',
      type: 'video',
      format: 'MP4',
      quality: '360p Mobile',
      resolution: '360p (640x360)',
      fileSize: '6.4 MB',
      hasAudio: true,
      recommended: false,
    },
  ];

  // Pre-configured quality options for audio
  const audioOptions: MediaStreamOption[] = [
    {
      id: 'a_320',
      type: 'audio',
      format: 'MP3',
      quality: '320 kbps Studio Quality',
      bitrate: '320 kbps',
      fileSize: '8.6 MB',
      hasAudio: true,
      recommended: true,
    },
    {
      id: 'a_256',
      type: 'audio',
      format: 'MP3',
      quality: '256 kbps High Fidelity',
      bitrate: '256 kbps',
      fileSize: '6.9 MB',
      hasAudio: true,
      recommended: false,
    },
    {
      id: 'a_128',
      type: 'audio',
      format: 'MP3',
      quality: '128 kbps Standard',
      bitrate: '128 kbps',
      fileSize: '3.5 MB',
      hasAudio: true,
      recommended: false,
    },
    {
      id: 'a_m4a',
      type: 'audio',
      format: 'M4A',
      quality: '160 kbps Original AAC',
      bitrate: '160 kbps',
      fileSize: '4.2 MB',
      hasAudio: true,
      recommended: false,
    },
  ];

  return {
    url: cleanUrl,
    platform: platform.id,
    platformName: platform.name,
    platformColor: platform.color,
    title,
    author,
    duration,
    thumbnail: isVertical
      ? 'https://picsum.photos/seed/mxdownload_v/600/1066'
      : 'https://picsum.photos/seed/mxdownload_h/800/450',
    aspectRatio: isVertical ? '9:16' : '16:9',
    videoOptions,
    audioOptions,
  };
}
