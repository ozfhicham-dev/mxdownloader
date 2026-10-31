export interface PSEOMetadata {
  slug: string;
  title: string;
  h1: string;
  subheading: string;
  description: string;
  platform: string;
  platformName: string;
  mediaType: 'video' | 'audio' | 'both';
  format: string;
  quality: string;
  device?: string;
  keywords: string[];
  faqs: { question: string; answer: string }[];
  steps: { title: string; desc: string }[];
}

export const PLATFORMS_CONFIG = [
  { id: 'facebook', name: 'Facebook', color: '#1877F2', icon: 'facebook', defaultExt: 'mp4' },
  { id: 'instagram', name: 'Instagram', color: '#E4405F', icon: 'instagram', defaultExt: 'mp4' },
  { id: 'tiktok', name: 'TikTok', color: '#000000', icon: 'tiktok', defaultExt: 'mp4' },
  { id: 'youtube', name: 'YouTube', color: '#FF0000', icon: 'youtube', defaultExt: 'mp4' },
  { id: 'twitter', name: 'Twitter / X', color: '#0f1419', icon: 'twitter', defaultExt: 'mp4' },
  { id: 'threads', name: 'Threads', color: '#000000', icon: 'threads', defaultExt: 'mp4' },
  { id: 'pinterest', name: 'Pinterest', color: '#BD081C', icon: 'pinterest', defaultExt: 'mp4' },
  { id: 'reddit', name: 'Reddit', color: '#FF4500', icon: 'reddit', defaultExt: 'mp4' },
  { id: 'vimeo', name: 'Vimeo', color: '#1AB7EA', icon: 'vimeo', defaultExt: 'mp4' },
  { id: 'soundcloud', name: 'SoundCloud', color: '#FF5500', icon: 'soundcloud', defaultExt: 'mp3' },
];

const MEDIA_TARGETS = [
  { id: 'video', name: 'Video', format: 'MP4', quality: '1080p - 4K' },
  { id: 'reels', name: 'Reels', format: 'MP4', quality: 'Full HD' },
  { id: 'story', name: 'Story', format: 'MP4', quality: 'Original Quality' },
  { id: 'audio', name: 'Audio MP3', format: 'MP3', quality: '320kbps' },
  { id: 'shorts', name: 'Shorts', format: 'MP4', quality: '1080p 60fps' },
  { id: 'private-video', name: 'Private Video', format: 'MP4', quality: 'Full Resolution' },
  { id: 'live-stream', name: 'Live Stream Recording', format: 'MP4', quality: 'HD' },
  { id: 'music', name: 'Music Track', format: 'MP3', quality: 'Studio 320kbps' },
];

const QUALITIES = [
  { id: '4k', name: '4K Ultra HD', label: '2160p' },
  { id: '1080p', name: '1080p Full HD', label: '1080p' },
  { id: '720p', name: '720p HD', label: '720p' },
  { id: '320kbps', name: '320kbps High Quality', label: '320kbps' },
  { id: 'no-watermark', name: 'No Watermark', label: 'Clean' },
];

const DEVICES = [
  { id: 'all-devices', name: 'All Devices (PC, Mobile, Tablet)' },
  { id: 'iphone', name: 'iPhone & iPad (iOS)' },
  { id: 'android', name: 'Android Phones & Tablets' },
  { id: 'pc', name: 'PC Windows & Mac' },
  { id: 'chrome', name: 'Chrome Browser Online' },
];

export const TOTAL_PSEO_PAGES = 2500;
export const URLS_PER_SITEMAP = 250;
export const TOTAL_SITEMAP_CHUNKS = Math.ceil(TOTAL_PSEO_PAGES / URLS_PER_SITEMAP); // 10 chunks

/**
 * Deterministically synthesizes programmatic page metadata for any given slug
 */
export function generatePageMetadata(slug: string): PSEOMetadata {
  // Normalize slug
  const cleanSlug = slug.toLowerCase().replace(/[^a-z0-9-]/g, '-');
  const parts = cleanSlug.split('-');

  // Find matching platform
  const platform = PLATFORMS_CONFIG.find((p) => cleanSlug.includes(p.id)) || PLATFORMS_CONFIG[0];

  // Determine media type
  const isAudio = cleanSlug.includes('audio') || cleanSlug.includes('mp3') || cleanSlug.includes('music') || cleanSlug.includes('soundcloud');
  const isReels = cleanSlug.includes('reel');
  const isStory = cleanSlug.includes('story');
  const isShorts = cleanSlug.includes('short');

  const mediaLabel = isAudio ? 'Audio MP3' : isReels ? 'Reels' : isStory ? 'Story' : isShorts ? 'Shorts' : 'Video';
  const format = isAudio ? 'MP3' : 'MP4';
  const quality = cleanSlug.includes('4k') ? '4K Ultra HD' : cleanSlug.includes('320kbps') ? '320kbps' : '1080p Full HD';

  const device = cleanSlug.includes('iphone')
    ? 'iPhone & iPad'
    : cleanSlug.includes('android')
    ? 'Android'
    : cleanSlug.includes('pc')
    ? 'PC & Mac'
    : undefined;

  const titlePrefix = `Download ${platform.name} ${mediaLabel}`;
  const titleQuality = cleanSlug.includes('no-watermark') ? 'Without Watermark' : quality;
  const titleDevice = device ? `on ${device}` : 'Online Free';

  const title = `${titlePrefix} (${titleQuality}) ${titleDevice} - mxdownloader`;
  const h1 = `Download ${platform.name} ${mediaLabel} in ${titleQuality}`;
  const subheading = `Fast, free online ${platform.name} ${mediaLabel.toLowerCase()} downloader. Save in high resolution ${format} without watermark or software installation.`;
  const description = `Best online ${platform.name} ${mediaLabel.toLowerCase()} downloader in 2026. Extract ${quality} ${format} videos and 320kbps MP3 audio directly to your device. 100% free and secure.`;

  return {
    slug: cleanSlug,
    title,
    h1,
    subheading,
    description,
    platform: platform.id,
    platformName: platform.name,
    mediaType: isAudio ? 'audio' : 'both',
    format,
    quality,
    device,
    keywords: [
      `${platform.name.toLowerCase()} downloader`,
      `download ${platform.name.toLowerCase()} ${mediaLabel.toLowerCase()}`,
      `${platform.name.toLowerCase()} ${format.toLowerCase()} 1080p`,
      `${platform.name.toLowerCase()} audio converter`,
      'mxdownloader online free',
    ],
    steps: [
      {
        title: `1. Copy ${platform.name} Link`,
        desc: `Open ${platform.name}, navigate to the ${mediaLabel.toLowerCase()} you wish to save, and copy its URL link to your clipboard.`,
      },
      {
        title: `2. Paste URL into mxdownloader`,
        desc: `Paste the link into the mxdownloader search box above and click the green 'Download' button.`,
      },
      {
        title: `3. Choose Quality & Download`,
        desc: `Select your preferred output (${format} ${quality} or high-bitrate MP3) and download starts instantly with zero waiting.`,
      },
    ],
    faqs: [
      {
        question: `How do I download ${platform.name} ${mediaLabel} on my phone or computer?`,
        answer: `Simply copy the ${platform.name} link, paste it into mxdownloader.com input field, click 'Download', and select the desired ${format} resolution or MP3 audio format. It downloads directly into your browser's download folder.`,
      },
      {
        question: `Is downloading from ${platform.name} with mxdownloader completely free?`,
        answer: `Yes! mxdownloader is 100% free and unlimited. You do not need to register an account, download any third-party software, or pay any subscription fees.`,
      },
      {
        question: `Can I download audio only (MP3) from ${platform.name}?`,
        answer: `Yes! Our converter allows you to extract crystal clear audio tracks in MP3 format up to 320kbps bitrate with ID3 tags included.`,
      },
      {
        question: `Are the downloaded ${platform.name} videos watermarked?`,
        answer: `No. All videos downloaded through mxdownloader are saved in their pristine original quality without any superimposed watermarks or branding.`,
      },
      {
        question: `Does mxdownloader store or host copies of downloaded videos?`,
        answer: `mxdownloader does not host, store, or archive any copyrighted videos on its servers. All streams are processed transiently in real-time between ${platform.name} and your local device.`,
      },
    ],
  };
}

/**
 * Pre-computes deterministic slugs for thousands of programmatic pages
 */
export function getPSEOIndex(totalCount: number = TOTAL_PSEO_PAGES): string[] {
  const slugs: string[] = [];

  // Seed with flagship high-volume URLs
  const flagshipUrls = [
    'facebook-video-downloader',
    'facebook-reels-downloader',
    'facebook-story-downloader',
    'facebook-private-video-downloader',
    'facebook-video-download-hd',
    'facebook-video-download-4k',
    'facebook-audio-mp3-downloader',
    'instagram-reels-downloader',
    'instagram-video-downloader',
    'instagram-story-downloader',
    'instagram-audio-mp3-downloader',
    'instagram-igtv-downloader',
    'instagram-photo-downloader',
    'tiktok-video-downloader-no-watermark',
    'tiktok-mp3-audio-downloader',
    'tiktok-hd-video-saver',
    'tiktok-slideshow-downloader',
    'youtube-video-downloader-1080p',
    'youtube-shorts-downloader',
    'youtube-video-downloader-4k',
    'youtube-mp3-320kbps-converter',
    'twitter-video-downloader',
    'x-video-downloader-hd',
    'x-gif-downloader',
    'threads-video-downloader',
    'threads-audio-downloader',
    'pinterest-video-downloader',
    'reddit-video-downloader-with-audio',
    'vimeo-video-downloader-1080p',
    'soundcloud-mp3-music-downloader',
  ];

  for (const f of flagshipUrls) {
    if (!slugs.includes(f)) slugs.push(f);
  }

  // Generate matrix combinations to reach thousands
  for (const platform of PLATFORMS_CONFIG) {
    for (const media of MEDIA_TARGETS) {
      for (const qual of QUALITIES) {
        for (const dev of DEVICES) {
          if (slugs.length >= totalCount) return slugs;

          const slug = `${platform.id}-${media.id}-${qual.id}-${dev.id}`
            .replace(/-all-devices/, '')
            .replace(/-video-video-/, '-video-')
            .replace(/--+/g, '-');

          if (!slugs.includes(slug)) {
            slugs.push(slug);
          }
        }
      }
    }
  }

  return slugs;
}

/**
 * Returns the array of URLs for a specific sitemap chunk (1-indexed: 1, 2, 3...)
 */
export function getChunkUrls(chunkIndex: number, baseUrl: string = 'https://mxdownloader.com'): string[] {
  const allSlugs = getPSEOIndex(TOTAL_PSEO_PAGES);
  const startIndex = (chunkIndex - 1) * URLS_PER_SITEMAP;
  const endIndex = Math.min(startIndex + URLS_PER_SITEMAP, allSlugs.length);

  if (startIndex >= allSlugs.length || startIndex < 0) {
    return [];
  }

  const chunkSlugs = allSlugs.slice(startIndex, endIndex);
  return chunkSlugs.map((slug) => `${baseUrl}/d/${slug}`);
}

/**
 * Featured programmatic landing pages for the homepage grid
 */
export const POPULAR_PSEO_CARDS = [
  { slug: 'facebook-video-downloader', platform: 'Facebook', title: 'Facebook Video Downloader', badge: '1080p & 4K' },
  { slug: 'facebook-reels-downloader', platform: 'Facebook', title: 'Facebook Reels Downloader', badge: 'Full HD' },
  { slug: 'instagram-reels-downloader', platform: 'Instagram', title: 'Instagram Reels Downloader', badge: 'Audio & Video' },
  { slug: 'instagram-story-downloader', platform: 'Instagram', title: 'Instagram Story Saver', badge: 'Anonymous' },
  { slug: 'tiktok-video-downloader-no-watermark', platform: 'TikTok', title: 'TikTok Without Watermark', badge: 'Clean MP4' },
  { slug: 'tiktok-mp3-audio-downloader', platform: 'TikTok', title: 'TikTok Audio to MP3', badge: '320kbps' },
  { slug: 'youtube-shorts-downloader', platform: 'YouTube', title: 'YouTube Shorts Downloader', badge: '60 FPS' },
  { slug: 'youtube-mp3-320kbps-converter', platform: 'YouTube', title: 'YouTube to MP3 Converter', badge: 'High Fidelity' },
  { slug: 'twitter-video-downloader', platform: 'Twitter / X', title: 'X / Twitter Video Downloader', badge: 'Fast MP4' },
  { slug: 'threads-video-downloader', platform: 'Threads', title: 'Threads Video Downloader', badge: 'HD Quality' },
  { slug: 'pinterest-video-downloader', platform: 'Pinterest', title: 'Pinterest Video Downloader', badge: 'Original Res' },
  { slug: 'reddit-video-downloader-with-audio', platform: 'Reddit', title: 'Reddit Video with Sound', badge: 'Synced Audio' },
];
