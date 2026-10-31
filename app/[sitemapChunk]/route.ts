import { NextRequest, NextResponse } from 'next/server';
import { generateSitemapChunkXML } from '@/lib/seo/sitemap-generator';
import { TOTAL_SITEMAP_CHUNKS } from '@/lib/seo/pseo-data';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ sitemapChunk: string }> }
) {
  const { sitemapChunk } = await params;

  // Match pattern: sitemap_<number>.xml
  const match = sitemapChunk.match(/^sitemap_(\d+)\.xml$/);
  if (!match) {
    return new NextResponse('Not found', { status: 404 });
  }

  const chunkIndex = parseInt(match[1], 10);
  if (chunkIndex < 1 || chunkIndex > TOTAL_SITEMAP_CHUNKS) {
    return new NextResponse('Sitemap chunk out of bounds', { status: 404 });
  }

  const url = new URL(request.url);
  const baseUrl = `${url.protocol}//${url.host}`;
  const xml = generateSitemapChunkXML(chunkIndex, baseUrl);

  return new NextResponse(xml, {
    status: 200,
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=86400, s-maxage=86400',
    },
  });
}
