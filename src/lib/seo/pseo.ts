import { query } from '$lib/db';

export const TOTAL_PSEO_PAGES = 2500;
export const URLS_PER_SITEMAP = 250;
export const TOTAL_SITEMAP_CHUNKS = Math.ceil(TOTAL_PSEO_PAGES / URLS_PER_SITEMAP);

export async function getPageMetadata(slug: string) {
  const rows = await query('SELECT * FROM pseo_pages WHERE slug = $1 LIMIT 1', [slug]);
  if (rows.length > 0) return rows[0];

  const platform = slug.includes('tiktok') ? 'TikTok' : slug.includes('instagram') ? 'Instagram' : 'Facebook';
  return {
    slug,
    platformName: platform,
    title: `Download ${platform} Video (1080p Full HD) - mxdownloader`,
    h1: `Download ${platform} Video in High Quality`,
    subheading: `The fastest online ${platform} video downloader. 100% free and without watermark.`,
    description: `Save ${platform} videos directly in 1080p MP4 or 320kbps MP3 audio.`,
    keywords: [`${platform.toLowerCase()} downloader`, 'free video downloader', 'download mp3']
  };
}

export function getAllPseoSlugs() {
  const platforms = ['facebook', 'tiktok', 'instagram', 'youtube'];
  const types = ['video-downloader', 'reels-downloader', 'mp3-downloader'];
  const qualities = ['1080p', '4k', 'hd', '320kbps'];

  const list = [];
  for (const p of platforms) {
    for (const t of types) {
      for (const q of qualities) {
        list.push(`${p}-${t}-${q}`);
      }
    }
  }
  return list;
}