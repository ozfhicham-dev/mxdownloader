import { NextResponse } from 'next/server';
import { generateSitemapIndexXML } from '@/lib/seo/sitemap-generator';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const baseUrl = `${url.protocol}//${url.host}`;
  const xml = generateSitemapIndexXML(baseUrl);

  return new NextResponse(xml, {
    status: 200,
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=86400, s-maxage=86400',
    },
  });
}
