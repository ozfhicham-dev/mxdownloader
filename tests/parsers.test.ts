import { describe, it, expect } from 'vitest';
import { parseMediaUrl } from '../lib/downloader/platform-parsers';

describe('Platform Link Parsers for TikTok, Instagram & Facebook', () => {
  it('should parse TikTok video URLs and extract 1080p, 720p, and MP3 audio', () => {
    const res = parseMediaUrl('https://www.tiktok.com/@trendcreator/video/7291823901123456789');
    expect(res.platform).toBe('tiktok');
    expect(res.platformName).toBe('TikTok');
    expect(res.author).toContain('@trendcreator');
    expect(res.downloads.length).toBeGreaterThanOrEqual(3);

    const video1080 = res.downloads.find((d) => d.quality === '1080p');
    const audioMp3 = res.downloads.find((d) => d.format === 'MP3');

    expect(video1080).toBeDefined();
    expect(video1080?.downloadUrl).toContain('/api/download/file');
    expect(audioMp3).toBeDefined();
    expect(audioMp3?.bitrate).toBe('320 kbps');
  });

  it('should parse Instagram Reel and Post URLs and extract direct downloads', () => {
    const res = parseMediaUrl('https://www.instagram.com/reel/C2-abc123xyz/');
    expect(res.platform).toBe('instagram');
    expect(res.platformName).toBe('Instagram');
    expect(res.downloads.some((d) => d.type === 'video')).toBe(true);
    expect(res.downloads.some((d) => d.type === 'audio')).toBe(true);
  });

  it('should parse Facebook Watch and Reel URLs with 4K and MP3 options', () => {
    const res = parseMediaUrl('https://www.facebook.com/watch/?v=1089283749210294');
    expect(res.platform).toBe('facebook');
    expect(res.platformName).toBe('Facebook');
    expect(res.downloads.some((d) => d.quality.includes('4K'))).toBe(true);
    expect(res.downloads.some((d) => d.format === 'MP3')).toBe(true);
  });
});
