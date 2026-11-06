import { buildSitemapIndexXML } from '$lib/seo/sitemap';
export const GET = () => new Response(buildSitemapIndexXML(), { headers: { 'Content-Type': 'application/xml' } });