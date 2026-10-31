import { TOTAL_SITEMAP_CHUNKS, getChunkUrls } from './pseo-data';

const DOMAIN = process.env.NEXT_PUBLIC_APP_URL || 'https://mxdownloader.com';

/**
 * Builds the master sitemap index XML linking to all chunked sitemaps
 * (<sitemapindex> -> <sitemap><loc>https://mxdownloader.com/sitemap_1.xml</loc>...</sitemap></sitemapindex>)
 */
export function generateSitemapIndexXML(baseUrl: string = DOMAIN): string {
  const lastmod = new Date().toISOString().split('T')[0];

  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
  xml += `<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

  for (let i = 1; i <= TOTAL_SITEMAP_CHUNKS; i++) {
    xml += `  <sitemap>\n`;
    xml += `    <loc>${baseUrl}/sitemap_${i}.xml</loc>\n`;
    xml += `    <lastmod>${lastmod}</lastmod>\n`;
    xml += `  </sitemap>\n`;
  }

  xml += `</sitemapindex>`;
  return xml;
}

/**
 * Builds a chunked URL set XML (<urlset> -> <url><loc>...</loc>...</url></urlset>)
 */
export function generateSitemapChunkXML(chunkIndex: number, baseUrl: string = DOMAIN): string {
  const urls = getChunkUrls(chunkIndex, baseUrl);
  const lastmod = new Date().toISOString().split('T')[0];

  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
  xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

  // Include root homepage in first chunk
  if (chunkIndex === 1) {
    xml += `  <url>\n`;
    xml += `    <loc>${baseUrl}</loc>\n`;
    xml += `    <lastmod>${lastmod}</lastmod>\n`;
    xml += `    <changefreq>daily</changefreq>\n`;
    xml += `    <priority>1.0</priority>\n`;
    xml += `  </url>\n`;
  }

  for (const url of urls) {
    xml += `  <url>\n`;
    xml += `    <loc>${url}</loc>\n`;
    xml += `    <lastmod>${lastmod}</lastmod>\n`;
    xml += `    <changefreq>weekly</changefreq>\n`;
    xml += `    <priority>0.8</priority>\n`;
    xml += `  </url>\n`;
  }

  xml += `</urlset>`;
  return xml;
}
