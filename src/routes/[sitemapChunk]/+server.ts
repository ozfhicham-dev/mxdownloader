import { buildSitemapChunkXML } from '$lib/seo/sitemap';
export const GET = () => new Response(buildSitemapChunkXML(1), { headers: { 'Content-Type': 'application/xml' } });