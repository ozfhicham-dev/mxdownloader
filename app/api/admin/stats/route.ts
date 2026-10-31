import { NextRequest, NextResponse } from 'next/server';
import { authService } from '@/lib/auth/auth-service';
import { TOTAL_PSEO_PAGES, TOTAL_SITEMAP_CHUNKS, URLS_PER_SITEMAP } from '@/lib/seo/pseo-data';

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await authService.validateSession(token);
    if (!user || user.role !== 'superadmin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const auditLogs = await authService.getAuditLogs(20);

    return NextResponse.json({
      success: true,
      data: {
        seo: {
          totalProgrammaticPages: TOTAL_PSEO_PAGES,
          sitemapChunksCount: TOTAL_SITEMAP_CHUNKS,
          urlsPerChunk: URLS_PER_SITEMAP,
          sitemapIndexUrl: '/sitemap.xml',
          sampleChunks: Array.from({ length: TOTAL_SITEMAP_CHUNKS }, (_, i) => `/sitemap_${i + 1}.xml`),
        },
        auth: {
          currentProvider: authService.getProviderName(),
          isPostgresConnected: authService.getProviderName() === 'postgresql-adapter',
          activeUser: user.username,
        },
        system: {
          uptimeSeconds: Math.floor(process.uptime()),
          nodeVersion: process.version,
          time: new Date().toISOString(),
          status: 'healthy',
        },
        auditLogs,
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Admin stats error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
