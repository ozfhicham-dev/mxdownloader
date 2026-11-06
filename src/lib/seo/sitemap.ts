import { getAllPseoSlugs, TOTAL_SITEMAP_CHUNKS } from './pseo';
const BASE = process.env.PUBLIC_APP_URL || 'https://mxdownloader.com';

export function buildSitemapIndexXML(): string {
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
  for (let i = 1; i <= TOTAL_SITEMAP_CHUNKS; i++) {
    xml += `  <sitemap><loc>${BASE}/sitemap_${i}.xml</loc></sitemap>\n`;
  }
  return xml + '</sitemapindex>';
}

export function buildSitemapChunkXML(chunk: number): string {
  const slugs = getAllPseoSlugs();
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
  for (const s of slugs) {
    xml += `  <url><loc>${BASE}/d/${s}</loc><priority>0.8</priority></url>\n`;
  }
  return xml + '</urlset>';
}