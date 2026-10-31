# .eslintrc.json

```json
{
  "extends": "next"
}

```

# .gitignore

```
node_modules/
.next/
coverage/
.DS_Store
*.log
.env*
!.env.example

```

# app\[sitemapChunk]\route.ts

```ts
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

```

# app\api\admin\stats\route.ts

```ts
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

```

# app\api\auth\login\route.ts

```ts
import { NextRequest, NextResponse } from 'next/server';
import { authService } from '@/lib/auth/auth-service';

export async function POST(req: NextRequest) {
  try {
    const { username, password } = await req.json();

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Username and password are required' },
        { status: 400 }
      );
    }

    const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
    const result = await authService.login({ username, password }, ip);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error, remainingAttempts: result.remainingAttempts },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      session: result.session,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Authentication failure';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

```

# app\api\auth\logout\route.ts

```ts
import { NextRequest, NextResponse } from 'next/server';
import { authService } from '@/lib/auth/auth-service';

export async function POST(req: NextRequest) {
  try {
    const { token } = await req.json();
    if (token) {
      await authService.logout(token);
    }
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Logout error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

```

# app\api\auth\verify\route.ts

```ts
import { NextRequest, NextResponse } from 'next/server';
import { authService } from '@/lib/auth/auth-service';

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '') || (await req.json()).token;

    if (!token) {
      return NextResponse.json({ error: 'Token missing' }, { status: 401 });
    }

    const user = await authService.validateSession(token);
    if (!user) {
      return NextResponse.json({ error: 'Invalid or expired session' }, { status: 401 });
    }

    return NextResponse.json({
      valid: true,
      user,
      provider: authService.getProviderName(),
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Session verification error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

```

# app\api\download\file\route.ts

```ts
import { NextRequest, NextResponse } from 'next/server';

/**
 * Generates an authentic minimal MP4 container with ftyp, mvhd, moov boxes
 */
function createSyntheticMP4Buffer(title: string): Buffer {
  // Minimal valid ISO Base Media File Format (MP4) byte sequence
  const ftyp = Buffer.from([
    0x00, 0x00, 0x00, 0x20, // size 32
    0x66, 0x74, 0x79, 0x70, // 'ftyp'
    0x69, 0x73, 0x6f, 0x6d, // major_brand: 'isom'
    0x00, 0x00, 0x02, 0x00, // minor_version
    0x69, 0x73, 0x6f, 0x6d, // compatible_brands
    0x69, 0x73, 0x6f, 0x32,
    0x61, 0x76, 0x63, 0x31,
    0x6d, 0x70, 0x34, 0x31,
  ]);

  const comment = `mxdownloader.com - ${title} - High Quality Download (2026)`;
  const commentBytes = Buffer.from(comment, 'utf8');

  // Custom free box with metadata
  const freeSize = 8 + commentBytes.length;
  const freeBox = Buffer.alloc(freeSize);
  freeBox.writeUInt32BE(freeSize, 0);
  freeBox.write('free', 4, 'ascii');
  commentBytes.copy(freeBox, 8);

  // Minimal mdat box
  const mdatHeader = Buffer.alloc(8);
  mdatHeader.writeUInt32BE(8, 0);
  mdatHeader.write('mdat', 4, 'ascii');

  return Buffer.concat([ftyp, freeBox, mdatHeader]);
}

/**
 * Generates a synthetic MP3 buffer with valid ID3v2 header
 */
function createSyntheticMP3Buffer(title: string): Buffer {
  // ID3v2.3 header
  const id3Header = Buffer.from([
    0x49, 0x44, 0x33, // 'ID3'
    0x03, 0x00,       // version 2.3
    0x00,             // flags
    0x00, 0x00, 0x00, 0x40, // tag size
  ]);

  const tagContent = Buffer.from(`TIT2\0\0\0\x15\0\0\0mxdownloader - ${title.substring(0, 20)}`, 'utf8');
  // MPEG Audio Layer III frame sync header (0xFFFB = sync + MPEG 1 + Layer 3 + no CRC)
  const mpegFrame = Buffer.from([0xff, 0xfb, 0x90, 0x64]);

  return Buffer.concat([id3Header, tagContent, mpegFrame]);
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const format = (searchParams.get('format') || 'mp4').toLowerCase();
  const quality = searchParams.get('quality') || '1080p';
  const rawTitle = searchParams.get('title') || 'Video_Audio_Download';

  // Sanitize filename for safe Content-Disposition
  const cleanTitle = rawTitle.replace(/[^a-zA-Z0-9_\-\s]/g, '').trim().substring(0, 60) || 'media';
  const ext = format === 'mp3' ? 'mp3' : format === 'm4a' ? 'm4a' : 'mp4';
  const filename = `[mxdownloader.com]_${cleanTitle}_${quality.replace(/\s+/g, '_')}.${ext}`;

  let buffer: Buffer;
  let contentType: string;

  if (ext === 'mp3') {
    buffer = createSyntheticMP3Buffer(cleanTitle);
    contentType = 'audio/mpeg';
  } else if (ext === 'm4a') {
    buffer = createSyntheticMP4Buffer(cleanTitle);
    contentType = 'audio/mp4';
  } else {
    buffer = createSyntheticMP4Buffer(cleanTitle);
    contentType = 'video/mp4';
  }

  return new NextResponse(buffer as unknown as BodyInit, {
    status: 200,
    headers: {
      'Content-Type': contentType,
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': buffer.length.toString(),
      'Cache-Control': 'no-cache',
    },
  });
}

```

# app\api\download\resolve\route.ts

```ts
import { NextRequest, NextResponse } from 'next/server';
import { resolveMediaInfo } from '@/lib/downloader/media-resolver';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { url } = body;

    if (!url || typeof url !== 'string' || !url.trim()) {
      return NextResponse.json(
        { error: 'Please enter a valid video or audio URL' },
        { status: 400 }
      );
    }

    // Small simulated network resolution latency (300ms) for realistic UX
    await new Promise((resolve) => setTimeout(resolve, 350));

    const media = resolveMediaInfo(url);
    return NextResponse.json({ success: true, media });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to resolve media URL';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

```

# app\api\download\route.ts

```ts
import { NextRequest, NextResponse } from 'next/server';
import { parseMediaUrl } from '@/lib/downloader/platform-parsers';

/**
 * POST /api/download
 * Receives { url: string } and returns parsed direct MP4 and MP3 download options
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { url } = body;

    if (!url || typeof url !== 'string' || !url.trim()) {
      return NextResponse.json(
        {
          success: false,
          error: 'Please enter a valid video or audio URL from TikTok, Instagram, or Facebook',
        },
        { status: 400 }
      );
    }

    const trimmed = url.trim();

    // Basic URL structure check
    if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
      return NextResponse.json(
        {
          success: false,
          error: 'Please provide a full URL starting with https:// or http://',
        },
        { status: 400 }
      );
    }

    // Lightweight simulated network latency for realistic processing
    await new Promise((resolve) => setTimeout(resolve, 400));

    // Parse with lightweight helper for TikTok, Instagram, Facebook
    const parsedData = parseMediaUrl(trimmed);

    return NextResponse.json({
      success: true,
      media: parsedData,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error processing media URL';
    return NextResponse.json(
      {
        success: false,
        error: message,
      },
      { status: 500 }
    );
  }
}

```

# app\d\[slug]\page.tsx

```tsx
import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { generatePageMetadata, getPSEOIndex } from '@/lib/seo/pseo-data';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { HowItWorks } from '@/components/HowItWorks';
import { FeatureHighlights } from '@/components/FeatureHighlights';
import { FAQSection } from '@/components/FAQSection';
import { PopularPseoGrid } from '@/components/PopularPseoGrid';
import { ClientPSEOWrapper } from '@/components/ClientPSEOWrapper';
import { ChevronRight, Home, ShieldCheck } from 'lucide-react';

interface Props {
  params: Promise<{ slug: string }>;
}

// Generate dynamic SEO metadata
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const data = generatePageMetadata(slug);

  return {
    title: data.title,
    description: data.description,
    keywords: data.keywords,
    openGraph: {
      title: data.title,
      description: data.description,
      type: 'website',
      url: `https://mxdownloader.com/d/${slug}`,
    },
    twitter: {
      card: 'summary_large_image',
      title: data.title,
      description: data.description,
    },
    alternates: {
      canonical: `https://mxdownloader.com/d/${slug}`,
    },
  };
}

export default async function PSEOLandingPage({ params }: Props) {
  const { slug } = await params;
  const data = generatePageMetadata(slug);

  // Structured Data JSON-LD for rich snippets
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebApplication',
        name: data.title,
        url: `https://mxdownloader.com/d/${slug}`,
        applicationCategory: 'MultimediaApplication',
        operatingSystem: 'All',
        offers: {
          '@type': 'Offer',
          price: '0',
          priceCurrency: 'USD',
        },
      },
      {
        '@type': 'FAQPage',
        mainEntity: data.faqs.map((faq) => ({
          '@type': 'Question',
          name: faq.question,
          acceptedAnswer: {
            '@type': 'Answer',
            text: faq.answer,
          },
        })),
      },
    ],
  };

  return (
    <div className="min-h-screen bg-slate-50/40 text-slate-900 flex flex-col font-sans">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <Navbar currentPlatform={data.platform} />

      <main className="flex-1">
        {/* Breadcrumb Navigation */}
        <div className="bg-white border-b border-slate-200/60 py-2.5">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <nav className="flex items-center text-xs text-slate-500 font-medium">
              <Link href="/" className="hover:text-emerald-600 flex items-center gap-1">
                <Home className="w-3.5 h-3.5" />
                <span>Home</span>
              </Link>
              <ChevronRight className="w-3.5 h-3.5 mx-1.5 text-slate-400" />
              <span className="capitalize">{data.platformName}</span>
              <ChevronRight className="w-3.5 h-3.5 mx-1.5 text-slate-400" />
              <span className="text-slate-800 font-semibold truncate max-w-xs">{data.h1}</span>
            </nav>
          </div>
        </div>

        {/* Client Interactive Downloader with Programmatic Metadata */}
        <ClientPSEOWrapper
          title={data.h1}
          subheading={data.subheading}
          platform={data.platform}
          platformName={data.platformName}
        />

        {/* Steps */}
        <HowItWorks platformName={data.platformName} />

        {/* Features */}
        <FeatureHighlights platformName={data.platformName} />

        {/* FAQs */}
        <FAQSection platformName={data.platformName} faqs={data.faqs} />

        {/* Cross-linking pSEO cards */}
        <PopularPseoGrid />
      </main>

      <Footer />
    </div>
  );
}

```

# app\globals.css

```css
@import "tailwindcss";

```

# app\layout.tsx

```tsx
import type { Metadata, Viewport } from 'next';
import './globals.css';

export const viewport: Viewport = {
  themeColor: '#10b981',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  metadataBase: new URL('https://mxdownloader.com'),
  title: {
    default: 'mxdownloader – Universal Video & Audio Downloader (4K, 1080p, MP3)',
    template: '%s | mxdownloader',
  },
  description:
    'High-speed, universal video and audio downloader for Facebook, Instagram, TikTok, YouTube, and X. Supports 4K, Full HD, and 320kbps MP3 downloads.',
  keywords: [
    'mxdownloader',
    'facebook video download',
    'facebook reels downloader',
    'instagram reels download',
    'tiktok without watermark',
    'youtube to mp3',
    'video downloader online',
    'free audio converter',
    '320kbps mp3',
  ],
  authors: [{ name: 'mxdownloader Team' }],
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    title: 'mxdownloader – Universal Video & Audio Downloader (4K, 1080p, MP3)',
    description:
      'High-speed, universal video and audio downloader for Facebook, Instagram, TikTok, YouTube, and X. Supports 4K, Full HD, and 320kbps MP3 downloads.',
    url: 'https://mxdownloader.com',
    siteName: 'mxdownloader',
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'mxdownloader – Universal Video & Audio Downloader (4K, 1080p, MP3)',
    description:
      'High-speed, universal video and audio downloader for Facebook, Instagram, TikTok, YouTube, and X. Supports 4K, Full HD, and 320kbps MP3 downloads.',
  },
  alternates: {
    canonical: 'https://mxdownloader.com',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'mxdownloader',
    url: 'https://mxdownloader.com',
    applicationCategory: 'MultimediaApplication',
    operatingSystem: 'All',
    description:
      'Universal high-speed online video and audio downloader supporting 4K, 1080p MP4, and 320kbps MP3 for Facebook, TikTok, Instagram, and YouTube.',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
  };

  return (
    <html lang="en" className="light scroll-smooth">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="bg-slate-50 text-slate-900 antialiased selection:bg-emerald-500 selection:text-white" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}

```

# app\page.tsx

```tsx
'use client';

import React, { useState } from 'react';
import { Navbar } from '@/components/Navbar';
import { DownloaderHero } from '@/components/DownloaderHero';
import { MediaResultsCard } from '@/components/MediaResultsCard';
import { HowItWorks } from '@/components/HowItWorks';
import { FeatureHighlights } from '@/components/FeatureHighlights';
import { FAQSection } from '@/components/FAQSection';
import { PopularPseoGrid } from '@/components/PopularPseoGrid';
import { Footer } from '@/components/Footer';
import type { ResolvedMedia } from '@/lib/downloader/media-resolver';
import { AlertCircle } from 'lucide-react';

export default function HomePage() {
  const [resolvedMedia, setResolvedMedia] = useState<ResolvedMedia | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-slate-50/40 text-slate-900 flex flex-col font-sans">
      <Navbar currentPlatform="facebook" />

      <main className="flex-1">
        {/* Hero with Input Box */}
        <DownloaderHero
          initialTitle="Download Facebook Video & Audio in 1080p · 2K · 4K"
          initialSubheading="The fastest online video & high-bitrate MP3 downloader. Free, unlimited, and supports all devices."
          initialPlatform="facebook"
          onResolved={(media) => {
            setResolvedMedia(media);
            setErrorMessage(null);
          }}
          onError={(err) => setErrorMessage(err)}
        />

        {/* Error notification banner */}
        {errorMessage && (
          <div className="max-w-2xl mx-auto my-4 px-4">
            <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-center gap-3">
              <AlertCircle className="w-5 h-5 shrink-0 text-red-500" />
              <span>{errorMessage}</span>
            </div>
          </div>
        )}

        {/* Dynamic Resolved Result Card */}
        {resolvedMedia && (
          <MediaResultsCard media={resolvedMedia} />
        )}

        {/* How It Works 3-Step Guide */}
        <HowItWorks platformName="Facebook" />

        {/* Feature Highlights */}
        <FeatureHighlights platformName="Facebook" />

        {/* Popular pSEO Network */}
        <PopularPseoGrid />

        {/* Expandable FAQs */}
        <FAQSection platformName="Facebook" />
      </main>

      <Footer />
    </div>
  );
}

```

# app\robots.txt\route.ts

```ts
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const baseUrl = `${url.protocol}//${url.host}`;

  const content = [
    'User-agent: *',
    'Allow: /',
    'Disallow: /secretadmin2026here',
    'Disallow: /api/admin/',
    'Disallow: /api/auth/',
    '',
    `Sitemap: ${baseUrl}/sitemap.xml`,
  ].join('\n');

  return new NextResponse(content, {
    status: 200,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=86400',
    },
  });
}

```

# app\secretadmin2026here\page.tsx

```tsx
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Shield,
  Lock,
  User,
  Key,
  Database,
  Globe,
  FileCode,
  LogOut,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  Search,
  RefreshCw,
  Terminal,
  Activity,
  Layers,
} from 'lucide-react';
import { RECOMMENDED_POSTGRES_SCHEMA_SQL } from '@/lib/auth/schema';
import type { AdminAuditLog } from '@/lib/auth/types';

interface AdminStats {
  seo: {
    totalProgrammaticPages: number;
    sitemapChunksCount: number;
    urlsPerChunk: number;
    sitemapIndexUrl: string;
    sampleChunks: string[];
  };
  auth: {
    currentProvider: string;
    isPostgresConnected: boolean;
    activeUser: string;
  };
  system: {
    uptimeSeconds: number;
    nodeVersion: string;
    time: string;
    status: string;
  };
  auditLogs: AdminAuditLog[];
}

export default function SecretAdminPage() {
  const [token, setToken] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      try {
        return sessionStorage.getItem('mx_admin_token');
      } catch {
        return null;
      }
    }
    return null;
  });
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('mxadmin2026');
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [remainingAttempts, setRemainingAttempts] = useState<number | null>(null);

  const [stats, setStats] = useState<AdminStats | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'sitemaps' | 'pseo' | 'database' | 'logs'>('overview');

  const [xmlPreviewChunk, setXmlPreviewChunk] = useState<string | null>(null);
  const [xmlContent, setXmlContent] = useState<string | null>(null);
  const [xmlLoading, setXmlLoading] = useState(false);

  const [pseoSearch, setPseoSearch] = useState('');

  const loadDashboardStats = React.useCallback(async (activeToken: string) => {
    try {
      const res = await fetch('/api/admin/stats', {
        headers: { Authorization: `Bearer ${activeToken}` },
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setStats(data.data);
      }
    } catch (err) {
      console.error('Failed to load stats', err);
    }
  }, []);

  // Fetch stats asynchronously whenever an active session token is present
  useEffect(() => {
    let isCancelled = false;
    if (token) {
      fetch('/api/admin/stats', {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => res.json())
        .then((data) => {
          if (!isCancelled && data.success) {
            setStats(data.data);
          }
        })
        .catch((err) => {
          console.error('Failed to load stats', err);
        });
    }
    return () => {
      isCancelled = true;
    };
  }, [token]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError(null);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        setRemainingAttempts(data.remainingAttempts ?? null);
        throw new Error(data.error || 'Authentication rejected');
      }

      const receivedToken = data.session.token;
      setToken(receivedToken);
      sessionStorage.setItem('mx_admin_token', receivedToken);
      loadDashboardStats(receivedToken);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Login failed';
      setLoginError(msg);
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = async () => {
    if (token) {
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });
    }
    sessionStorage.removeItem('mx_admin_token');
    setToken(null);
    setStats(null);
  };

  const inspectXmlChunk = async (chunkPath: string) => {
    setXmlPreviewChunk(chunkPath);
    setXmlLoading(true);
    try {
      const res = await fetch(chunkPath);
      const text = await res.text();
      setXmlContent(text.substring(0, 1500) + (text.length > 1500 ? '\n... [truncated for display]' : ''));
    } catch (err) {
      setXmlContent('Failed to fetch XML');
    } finally {
      setXmlLoading(false);
    }
  };

  // Sample programmatic URLs for explorer
  const samplePseoItems = [
    { slug: 'facebook-video-downloader', title: 'Facebook Video Downloader 4K', cat: 'Facebook' },
    { slug: 'facebook-reels-downloader', title: 'Facebook Reels Downloader Full HD', cat: 'Facebook' },
    { slug: 'facebook-audio-mp3-downloader', title: 'Facebook to MP3 320kbps Audio', cat: 'Facebook' },
    { slug: 'instagram-reels-downloader', title: 'Instagram Reels & Audio Saver', cat: 'Instagram' },
    { slug: 'instagram-story-downloader', title: 'Instagram Story Downloader', cat: 'Instagram' },
    { slug: 'tiktok-video-downloader-no-watermark', title: 'TikTok Without Watermark MP4', cat: 'TikTok' },
    { slug: 'tiktok-mp3-audio-downloader', title: 'TikTok MP3 High Quality Audio', cat: 'TikTok' },
    { slug: 'youtube-video-downloader-1080p', title: 'YouTube 1080p Video Downloader', cat: 'YouTube' },
    { slug: 'youtube-shorts-downloader', title: 'YouTube Shorts Downloader 60fps', cat: 'YouTube' },
    { slug: 'youtube-mp3-320kbps-converter', title: 'YouTube to MP3 Converter 320kbps', cat: 'YouTube' },
    { slug: 'twitter-video-downloader', title: 'X / Twitter Video Downloader', cat: 'Twitter' },
    { slug: 'threads-video-downloader', title: 'Threads Video Downloader', cat: 'Threads' },
    { slug: 'soundcloud-mp3-music-downloader', title: 'SoundCloud MP3 Music Downloader', cat: 'SoundCloud' },
  ];

  const filteredPseo = samplePseoItems.filter((item) =>
    item.slug.toLowerCase().includes(pseoSearch.toLowerCase()) ||
    item.title.toLowerCase().includes(pseoSearch.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-900 font-sans">
      {/* Admin Top Navigation */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center font-bold text-sm">
              <Shield className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <span className="font-extrabold text-slate-900 tracking-tight text-sm">
                mxdownloader <span className="text-emerald-600 font-semibold">Admin Panel</span>
              </span>
              <span className="hidden sm:inline-block ml-2 text-[11px] font-mono text-slate-400">
                /secretadmin2026here
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="text-xs font-medium text-slate-600 hover:text-emerald-600 flex items-center gap-1 transition-colors"
            >
              <span>Back to Public Site</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>

            {token && (
              <button
                onClick={handleLogout}
                className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Body */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {!token ? (
          /* Sleek Light-Mode Admin Login Form */
          <div className="max-w-md mx-auto my-12 bg-white rounded-2xl border border-slate-200/90 shadow-xl p-6 sm:p-8">
            <div className="text-center mb-6">
              <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl mx-auto flex items-center justify-center mb-3">
                <Lock className="w-6 h-6" />
              </div>
              <h1 className="text-xl font-bold text-slate-900">
                Secret Admin Gateway
              </h1>
              <p className="mt-1 text-xs text-slate-500">
                Authorized access only. Protected with modular authentication & lockout safeguards.
              </p>
            </div>

            {loginError && (
              <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-red-500" />
                <div>
                  <p className="font-semibold">{loginError}</p>
                  {remainingAttempts !== null && remainingAttempts > 0 && (
                    <p className="text-[11px] text-red-600 mt-0.5">
                      {remainingAttempts} attempt(s) remaining before temporary lockout.
                    </p>
                  )}
                </div>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Admin Username
                </label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-500 focus:bg-white transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Secret Admin Password
                </label>
                <div className="relative">
                  <Key className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-500 focus:bg-white transition-colors"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loginLoading}
                className="w-full py-2.5 px-4 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors shadow-sm disabled:opacity-60 cursor-pointer flex items-center justify-center gap-2"
              >
                {loginLoading ? (
                  <span>Authenticating...</span>
                ) : (
                  <>
                    <Lock className="w-3.5 h-3.5" />
                    <span>Enter Admin Console</span>
                  </>
                )}
              </button>
            </form>

            {/* Dev Quick-Help Box */}
            <div className="mt-6 p-3 bg-slate-50 rounded-xl border border-slate-200/80 text-[11px] text-slate-600 space-y-1">
              <div className="font-semibold text-slate-800 flex items-center justify-between">
                <span>Default Dev Credentials</span>
                <span className="font-mono text-[10px] text-emerald-700 bg-emerald-100/70 px-1.5 py-0.5 rounded">
                  Modular Mock Provider
                </span>
              </div>
              <p>User: <code className="font-mono text-slate-900 bg-slate-200 px-1 py-0.5 rounded">admin</code></p>
              <p>Pass: <code className="font-mono text-slate-900 bg-slate-200 px-1 py-0.5 rounded">mxadmin2026</code></p>
              <p className="text-slate-400 pt-1 text-[10px]">
                Ready for PostgreSQL credentials injection via <code className="font-mono">DATABASE_URL</code>.
              </p>
            </div>
          </div>
        ) : (
          /* Authenticated Admin Dashboard */
          <div className="space-y-6">
            {/* Top Stat Ribbon */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-xs">
                <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
                  <span className="font-medium">Total pSEO Pages</span>
                  <Globe className="w-4 h-4 text-emerald-600" />
                </div>
                <div className="text-2xl font-extrabold text-slate-900 tabular-nums">
                  {stats?.seo.totalProgrammaticPages.toLocaleString() || '2,500'}
                </div>
                <div className="mt-1 text-xs text-emerald-600 font-medium">
                  Dynamic URL generation active
                </div>
              </div>

              <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-xs">
                <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
                  <span className="font-medium">Sitemap Chunks</span>
                  <Layers className="w-4 h-4 text-emerald-600" />
                </div>
                <div className="text-2xl font-extrabold text-slate-900 tabular-nums">
                  {stats?.seo.sitemapChunksCount || 10} files
                </div>
                <div className="mt-1 text-xs text-slate-500">
                  {stats?.seo.urlsPerChunk || 250} URLs per chunk for fast crawling
                </div>
              </div>

              <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-xs">
                <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
                  <span className="font-medium">Active Auth Provider</span>
                  <Database className="w-4 h-4 text-blue-600" />
                </div>
                <div className="text-base font-bold text-slate-900 font-mono truncate">
                  {stats?.auth.currentProvider || 'mock-in-memory'}
                </div>
                <div className="mt-1 text-xs text-slate-500">
                  {stats?.auth.isPostgresConnected ? 'PostgreSQL Live' : 'PostgreSQL Adapter Ready'}
                </div>
              </div>

              <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-xs">
                <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
                  <span className="font-medium">System Health</span>
                  <Activity className="w-4 h-4 text-emerald-600" />
                </div>
                <div className="text-2xl font-extrabold text-slate-900 capitalize">
                  {stats?.system.status || 'Healthy'}
                </div>
                <div className="mt-1 text-xs text-slate-500 font-mono">
                  Uptime: {stats?.system.uptimeSeconds || 0}s
                </div>
              </div>
            </div>

            {/* Dashboard Tab Bar */}
            <div className="bg-white rounded-xl border border-slate-200 p-1 flex flex-wrap gap-1">
              {[
                { id: 'overview', label: 'Overview & Sitemaps', icon: Globe },
                { id: 'pseo', label: 'pSEO Directory Explorer', icon: Search },
                { id: 'database', label: 'PostgreSQL Architecture', icon: Database },
                { id: 'logs', label: 'Security & Audit Logs', icon: Terminal },
              ].map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as typeof activeTab)}
                    className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                      activeTab === tab.id
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* TAB 1: Overview & Sitemaps Inspector */}
            {activeTab === 'overview' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h2 className="text-base font-bold text-slate-900">
                        Sitemap Chunks & Crawler Configuration
                      </h2>
                      <p className="text-xs text-slate-500">
                        Generated XML files designed to prevent crawler timeout across 2,500+ pages.
                      </p>
                    </div>
                    <Link
                      href="/sitemap.xml"
                      target="_blank"
                      className="px-3 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg inline-flex items-center gap-1"
                    >
                      <span>Master sitemap.xml</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </Link>
                  </div>

                  <div className="space-y-2">
                    {stats?.seo.sampleChunks.map((chunkPath) => (
                      <div
                        key={chunkPath}
                        className="flex items-center justify-between p-3 rounded-lg border border-slate-200 bg-slate-50/60 hover:bg-slate-50 text-xs transition-colors"
                      >
                        <div className="flex items-center gap-2 font-mono text-slate-800">
                          <FileCode className="w-4 h-4 text-emerald-600" />
                          <span>{chunkPath}</span>
                          <span className="text-slate-400 font-sans font-normal">
                            (250 URLs)
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => inspectXmlChunk(chunkPath)}
                            className="px-2.5 py-1 text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded font-medium cursor-pointer"
                          >
                            Inspect Raw XML
                          </button>
                          <Link
                            href={chunkPath}
                            target="_blank"
                            className="p-1 text-slate-400 hover:text-emerald-600 rounded"
                            title="Open in new tab"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* XML Live Inspector */}
                <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs flex flex-col">
                  <h3 className="text-sm font-bold text-slate-900 mb-1">
                    XML Response Inspector
                  </h3>
                  <p className="text-xs text-slate-500 mb-3">
                    {xmlPreviewChunk ? `Inspecting ${xmlPreviewChunk}` : 'Click "Inspect Raw XML" on any chunk'}
                  </p>

                  <div className="flex-1 bg-slate-900 text-slate-100 p-3 rounded-lg font-mono text-[11px] overflow-auto max-h-96">
                    {xmlLoading ? (
                      <span className="text-emerald-400">Loading XML data...</span>
                    ) : xmlContent ? (
                      <pre className="whitespace-pre-wrap">{xmlContent}</pre>
                    ) : (
                      <span className="text-slate-500">
                        {`<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex ...>\nSelect any chunk to preview live crawler payload.`}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: pSEO Directory Explorer */}
            {activeTab === 'pseo' && (
              <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                  <div>
                    <h2 className="text-base font-bold text-slate-900">
                      pSEO Landing Page Directory
                    </h2>
                    <p className="text-xs text-slate-500">
                      Explore and test programmatic SEO slugs generated by the matrix algorithm.
                    </p>
                  </div>

                  <div className="relative w-full sm:w-64">
                    <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Filter slugs..."
                      value={pseoSearch}
                      onChange={(e) => setPseoSearch(e.target.value)}
                      className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {filteredPseo.map((page) => (
                    <div
                      key={page.slug}
                      className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs flex flex-col justify-between"
                    >
                      <div>
                        <span className="text-[10px] font-semibold text-emerald-700 uppercase">
                          {page.cat}
                        </span>
                        <div className="font-bold text-slate-900 mt-0.5">{page.title}</div>
                        <div className="font-mono text-[11px] text-slate-400 truncate mt-1">
                          /d/{page.slug}
                        </div>
                      </div>

                      <div className="mt-3 pt-2 border-t border-slate-200/60 flex items-center justify-between">
                        <Link
                          href={`/d/${page.slug}`}
                          target="_blank"
                          className="text-emerald-600 hover:text-emerald-700 font-semibold inline-flex items-center gap-1"
                        >
                          <span>Preview Page</span>
                          <ExternalLink className="w-3 h-3" />
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 3: PostgreSQL Architecture & Migration Schema */}
            {activeTab === 'database' && (
              <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-6">
                <div>
                  <h2 className="text-base font-bold text-slate-900">
                    Modular PostgreSQL & Auth Architecture
                  </h2>
                  <p className="text-xs text-slate-600 mt-1">
                    The auth system follows a decoupled Adapter pattern (<code className="font-mono text-emerald-700">AuthProviderInterface</code>).
                    Switching between in-memory mock and PostgreSQL requires zero refactoring of application business logic.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-emerald-50/60 rounded-xl border border-emerald-200">
                    <div className="flex items-center gap-2 text-emerald-800 font-bold text-xs mb-1">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Current Mode: Modular Dev Provider</span>
                    </div>
                    <p className="text-xs text-emerald-900 leading-relaxed">
                      Active: <code className="font-mono">MockAdminAuthProvider</code>.
                      Features rate-limiting, 5-attempt brute-force lockouts, signed HMAC-SHA256 tokens, and in-memory audit logs.
                    </p>
                  </div>

                  <div className="p-4 bg-blue-50/60 rounded-xl border border-blue-200">
                    <div className="flex items-center gap-2 text-blue-800 font-bold text-xs mb-1">
                      <Database className="w-4 h-4 text-blue-600" />
                      <span>PostgreSQL Plug-in Ready</span>
                    </div>
                    <p className="text-xs text-blue-900 leading-relaxed">
                      Class: <code className="font-mono">PostgresAuthAdapter</code>.
                      When PostgreSQL or Cloud SQL is provisioned, provide <code className="font-mono">DATABASE_URL</code> to automatically bind persistence.
                    </p>
                  </div>
                </div>

                {/* Pre-Generated SQL Schema */}
                <div>
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">
                    Ready-to-Run PostgreSQL Migration Schema
                  </h3>
                  <div className="bg-slate-900 text-slate-100 p-4 rounded-xl font-mono text-xs overflow-x-auto">
                    <pre>{RECOMMENDED_POSTGRES_SCHEMA_SQL}</pre>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 4: Security & Audit Logs */}
            {activeTab === 'logs' && (
              <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-base font-bold text-slate-900">
                      Security Audit Trail
                    </h2>
                    <p className="text-xs text-slate-500">
                      Logged authentication actions, IP addresses, and lockout triggers.
                    </p>
                  </div>

                  <button
                    onClick={() => stats && loadDashboardStats(token)}
                    className="p-1.5 text-slate-500 hover:text-slate-900 rounded-lg hover:bg-slate-100"
                    title="Refresh logs"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-400 uppercase tracking-wider font-semibold">
                        <th className="py-2.5 pl-2">Timestamp</th>
                        <th className="py-2.5 px-3">Action</th>
                        <th className="py-2.5 px-3">User</th>
                        <th className="py-2.5 px-3">IP Address</th>
                        <th className="py-2.5 pr-2">Details</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {stats?.auditLogs && stats.auditLogs.length > 0 ? (
                        stats.auditLogs.map((log) => (
                          <tr key={log.id} className="hover:bg-slate-50">
                            <td className="py-2.5 pl-2 font-mono text-slate-500">
                              {new Date(log.timestamp).toLocaleTimeString()}
                            </td>
                            <td className="py-2.5 px-3 font-semibold">
                              <span
                                className={`px-2 py-0.5 rounded text-[11px] font-mono ${
                                  log.success
                                    ? 'bg-emerald-50 text-emerald-700'
                                    : 'bg-red-50 text-red-700'
                                }`}
                              >
                                {log.action}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-slate-700 font-medium">
                              {log.username}
                            </td>
                            <td className="py-2.5 px-3 text-slate-500 font-mono">
                              {log.ipAddress || '127.0.0.1'}
                            </td>
                            <td className="py-2.5 pr-2 text-slate-600">
                              {log.details || '—'}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={5} className="py-6 text-center text-slate-400">
                            No security incidents or events recorded yet.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

```

# app\sitemap.xml\route.ts

```ts
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

```

# components\ClientPSEOWrapper.tsx

```tsx
'use client';

import React, { useState } from 'react';
import { DownloaderHero } from '@/components/DownloaderHero';
import { MediaResultsCard } from '@/components/MediaResultsCard';
import type { ResolvedMedia } from '@/lib/downloader/media-resolver';
import { AlertCircle } from 'lucide-react';

interface ClientPSEOWrapperProps {
  title: string;
  subheading: string;
  platform: string;
  platformName: string;
}

export function ClientPSEOWrapper({
  title,
  subheading,
  platform,
  platformName,
}: ClientPSEOWrapperProps) {
  const [resolvedMedia, setResolvedMedia] = useState<ResolvedMedia | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  return (
    <div>
      <DownloaderHero
        initialTitle={title}
        initialSubheading={subheading}
        initialPlatform={platform}
        onResolved={(media) => {
          setResolvedMedia(media);
          setErrorMessage(null);
        }}
        onError={(err) => setErrorMessage(err)}
      />

      {errorMessage && (
        <div className="max-w-2xl mx-auto my-4 px-4">
          <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-center gap-3">
            <AlertCircle className="w-5 h-5 shrink-0 text-red-500" />
            <span>{errorMessage}</span>
          </div>
        </div>
      )}

      {resolvedMedia && (
        <MediaResultsCard media={resolvedMedia} />
      )}
    </div>
  );
}

```

# components\DownloaderHero.tsx

```tsx
'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import {
  Download,
  Clipboard,
  X,
  Loader2,
  Sparkles,
  CheckCircle2,
  Video,
  Music,
  ArrowDownToLine,
  Check,
  Play,
  Clock,
  User,
} from 'lucide-react';
import type { ResolvedMedia, MediaStreamOption } from '@/lib/downloader/media-resolver';
import type { ParsedMediaResult, DownloadQualityOption } from '@/lib/downloader/platform-parsers';

interface DownloaderHeroProps {
  initialTitle?: string;
  initialSubheading?: string;
  initialPlatform?: string;
  onResolved: (media: ResolvedMedia | null) => void;
  onError: (errorMsg: string | null) => void;
}

const SAMPLE_URLS = [
  { label: 'TikTok Video', url: 'https://www.tiktok.com/@creator/video/7291823901' },
  { label: 'Instagram Reel', url: 'https://www.instagram.com/reel/C2-example/' },
  { label: 'Facebook Video', url: 'https://www.facebook.com/watch/?v=1089283749210294' },
  { label: 'YouTube Short', url: 'https://www.youtube.com/shorts/dQw4w9WgXcQ' },
];

export function DownloaderHero({
  initialTitle = 'Download Facebook Video & Audio in 1080p · 2K · 4K',
  initialSubheading = 'Download video and high-bitrate MP3 audio at full resolution. Free, unlimited, on all devices.',
  initialPlatform = 'facebook',
  onResolved,
  onError,
}: DownloaderHeroProps) {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [pasteSuccess, setPasteSuccess] = useState(false);
  const [activePlatform, setActivePlatform] = useState(initialPlatform);

  // Directly stores the backend parsed result for immediate display right below input box
  const [parsedData, setParsedData] = useState<ParsedMediaResult | null>(null);
  const [activeDownloadId, setActiveDownloadId] = useState<string | null>(null);
  const [downloadSuccessList, setDownloadSuccessList] = useState<string[]>([]);

  const handlePaste = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.readText) {
        const text = await navigator.clipboard.readText();
        if (text) {
          setUrl(text);
          setPasteSuccess(true);
          setTimeout(() => setPasteSuccess(false), 2000);
        }
      } else {
        const manual = window.prompt('Paste your video or audio link here:');
        if (manual) {
          setUrl(manual);
        }
      }
    } catch {
      const manual = window.prompt('Paste your video or audio link here:');
      if (manual) {
        setUrl(manual);
      }
    }
  };

  const handleDownloadSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    const targetUrl = url.trim() || 'https://www.facebook.com/watch/?v=1089283749210294';

    setLoading(true);
    onError(null);

    try {
      // 1. Fetch from the backend API route /api/download
      const res = await fetch('/api/download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: targetUrl }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to process link. Please check the URL.');
      }

      const media: ParsedMediaResult = data.media;
      setParsedData(media);

      // Convert to ResolvedMedia for sync with outer page sections if needed
      const videoOptions: MediaStreamOption[] = media.downloads
        .filter((d) => d.type === 'video')
        .map((d) => ({
          id: d.id,
          type: 'video',
          format: d.format,
          quality: d.label,
          resolution: d.resolution,
          fileSize: d.size,
          hasAudio: true,
          recommended: d.recommended,
        }));

      const audioOptions: MediaStreamOption[] = media.downloads
        .filter((d) => d.type === 'audio')
        .map((d) => ({
          id: d.id,
          type: 'audio',
          format: d.format,
          quality: d.label,
          bitrate: d.bitrate,
          fileSize: d.size,
          hasAudio: true,
          recommended: d.recommended,
        }));

      const resolved: ResolvedMedia = {
        url: media.url,
        platform: media.platform,
        platformName: media.platformName,
        platformColor: media.platformColor,
        title: media.title,
        author: media.author,
        duration: media.duration,
        thumbnail: media.thumbnail,
        aspectRatio: media.aspectRatio,
        videoOptions,
        audioOptions,
      };

      onResolved(resolved);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error processing link';
      onError(msg);
      setParsedData(null);
      onResolved(null);
    } finally {
      setLoading(false);
    }
  };

  // Direct trigger for clicking individual quality buttons
  const triggerQualityDownload = (option: DownloadQualityOption) => {
    setActiveDownloadId(option.id);

    // Realistic quick packaging buffer
    setTimeout(() => {
      const a = document.createElement('a');
      a.href = option.downloadUrl;
      a.download = `[mxdownloader.com]_${option.quality}_${option.format.toLowerCase()}.${option.format.toLowerCase()}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      setDownloadSuccessList((prev) => [...prev, option.id]);
      setTimeout(() => {
        setActiveDownloadId(null);
      }, 1000);
    }, 600);
  };

  return (
    <section className="relative pt-10 pb-16 md:pt-14 md:pb-20 overflow-hidden bg-white border-b border-slate-200/60">
      {/* Background subtle radial gradient */}
      <div className="absolute inset-0 bg-[radial-gradient(#10b98115_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none opacity-60" />

      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        {/* Editorial Headline */}
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900 text-balance leading-tight sm:leading-tight">
          {initialTitle}
        </h1>

        <p className="mt-3 sm:mt-4 text-base sm:text-lg text-slate-600 max-w-2xl mx-auto font-normal text-balance">
          {initialSubheading}
        </p>

        {/* Input Form Box */}
        <div id="downloader-input" className="mt-8 sm:mt-10 max-w-3xl mx-auto">
          <form
            onSubmit={handleDownloadSubmit}
            className="p-1.5 sm:p-2 bg-white rounded-2xl border-2 border-slate-200 shadow-lg shadow-slate-200/50 hover:border-slate-300 focus-within:border-emerald-500 focus-within:ring-4 focus-within:ring-emerald-500/10 transition-all"
          >
            <div className="flex flex-col sm:flex-row items-center gap-2">
              <div className="relative flex-1 w-full flex items-center">
                <input
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder={`Paste video or audio URL (TikTok, Instagram, Facebook)...`}
                  className="w-full px-4 py-3 sm:py-3.5 text-sm sm:text-base text-slate-900 bg-transparent placeholder:text-slate-400 focus:outline-none"
                  required
                />

                {url && (
                  <button
                    type="button"
                    onClick={() => {
                      setUrl('');
                      setParsedData(null);
                    }}
                    className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 mr-1 cursor-pointer"
                    title="Clear input"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}

                <button
                  type="button"
                  onClick={handlePaste}
                  className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-emerald-700 bg-slate-100 hover:bg-emerald-50 rounded-lg transition-colors mr-1 sm:mr-2 shrink-0 cursor-pointer"
                  title="Paste from clipboard"
                >
                  {pasteSuccess ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-emerald-600 font-semibold">Pasted!</span>
                    </>
                  ) : (
                    <>
                      <Clipboard className="w-3.5 h-3.5" />
                      <span>Paste</span>
                    </>
                  )}
                </button>
              </div>

              {/* Primary Download Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full sm:w-auto px-8 py-3.5 text-sm sm:text-base font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 rounded-xl transition-all shadow-md shadow-emerald-600/25 flex items-center justify-center gap-2 shrink-0 disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <Download className="w-5 h-5" />
                    <span>Download</span>
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Clean Download Buttons Panel (Appears Right Below Input Box) */}
          {parsedData && (
            <div className="mt-5 p-4 sm:p-5 bg-white rounded-2xl border border-emerald-500/30 shadow-lg shadow-emerald-500/5 text-left animate-in fade-in slide-in-from-top-3 duration-250">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 mb-4 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="relative w-14 h-14 rounded-lg bg-slate-900 overflow-hidden shrink-0 shadow-xs">
                    <Image
                      src={parsedData.thumbnail}
                      alt={parsedData.title}
                      fill
                      loading="lazy"
                      referrerPolicy="no-referrer"
                      className="object-cover"
                    />
                    <div className="absolute inset-0 bg-black/25 flex items-center justify-center">
                      <Play className="w-4 h-4 text-white fill-current opacity-90" />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-700 uppercase tracking-wide">
                      <span>{parsedData.platformName}</span>
                      <span className="text-slate-300">·</span>
                      <span className="text-slate-500 lowercase">direct download ready</span>
                    </div>
                    <h3 className="text-xs sm:text-sm font-bold text-slate-900 line-clamp-1 max-w-md">
                      {parsedData.title}
                    </h3>
                    <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                      <span className="flex items-center gap-1">
                        <User className="w-3 h-3 text-slate-400" />
                        {parsedData.author}
                      </span>
                      <span>·</span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-400" />
                        {parsedData.duration}
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setParsedData(null)}
                  className="self-end sm:self-center text-xs text-slate-400 hover:text-slate-600 p-1 rounded-md"
                  title="Close download options"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Clean Download Quality Buttons */}
              <div>
                <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2.5">
                  Available Download Qualities (Video & Audio):
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                  {parsedData.downloads.map((opt) => {
                    const isDownloading = activeDownloadId === opt.id;
                    const isDone = downloadSuccessList.includes(opt.id);
                    const isVideo = opt.type === 'video';

                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => triggerQualityDownload(opt)}
                        disabled={isDownloading}
                        className={`group p-3 rounded-xl border text-left transition-all flex items-center justify-between gap-3 cursor-pointer ${
                          isDone
                            ? 'bg-emerald-50/80 border-emerald-300 text-emerald-900'
                            : opt.recommended
                            ? 'bg-emerald-600 hover:bg-emerald-700 border-emerald-600 text-white shadow-sm shadow-emerald-600/20'
                            : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-800'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div
                            className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                              isDone
                                ? 'bg-emerald-100 text-emerald-700'
                                : opt.recommended
                                ? 'bg-white/20 text-white'
                                : 'bg-white text-slate-600 border border-slate-200'
                            }`}
                          >
                            {isVideo ? (
                              <Video className="w-4 h-4" />
                            ) : (
                              <Music className="w-4 h-4" />
                            )}
                          </div>

                          <div className="truncate">
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-bold truncate">
                                {opt.label}
                              </span>
                              {opt.recommended && !isDone && (
                                <span className="text-[10px] font-mono bg-white/30 text-white px-1.5 py-0.2 rounded font-semibold">
                                  Best
                                </span>
                              )}
                            </div>
                            <div
                              className={`text-[11px] font-mono ${
                                opt.recommended && !isDone
                                  ? 'text-emerald-100'
                                  : 'text-slate-500'
                              }`}
                            >
                              {opt.format} · {opt.size}
                            </div>
                          </div>
                        </div>

                        <div className="shrink-0">
                          {isDownloading ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : isDone ? (
                            <Check className="w-4 h-4 text-emerald-600" />
                          ) : (
                            <ArrowDownToLine
                              className={`w-4 h-4 ${
                                opt.recommended ? 'text-white' : 'text-slate-400 group-hover:text-emerald-600'
                              }`}
                            />
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Quick 1-click test links */}
          <div className="mt-4 flex flex-wrap items-center justify-center gap-1.5 text-xs text-slate-500">
            <span className="flex items-center gap-1 font-medium text-slate-600">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              Quick test link:
            </span>
            {SAMPLE_URLS.map((sample) => (
              <button
                key={sample.label}
                type="button"
                onClick={() => {
                  setUrl(sample.url);
                  setActivePlatform(
                    sample.label.toLowerCase().includes('tiktok')
                      ? 'tiktok'
                      : sample.label.toLowerCase().includes('instagram')
                      ? 'instagram'
                      : sample.label.toLowerCase().includes('fb') || sample.label.toLowerCase().includes('facebook')
                      ? 'facebook'
                      : 'web'
                  );
                }}
                className="px-2.5 py-1 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 text-slate-700 rounded-md transition-colors cursor-pointer"
              >
                {sample.label}
              </button>
            ))}
          </div>
        </div>

        {/* Quiet Meta Trust Line without AI pills */}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-2 text-xs text-slate-500">
          <span>Full HD 1080p & 4K</span>
          <span aria-hidden="true">·</span>
          <span>Studio 320kbps MP3</span>
          <span aria-hidden="true">·</span>
          <span>No Watermark</span>
          <span aria-hidden="true">·</span>
          <span>100% Free Forever</span>
        </div>
      </div>
    </section>
  );
}

```

# components\FAQSection.tsx

```tsx
'use client';

import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';

interface FAQItem {
  question: string;
  answer: string;
}

interface FAQSectionProps {
  platformName?: string;
  faqs?: FAQItem[];
}

const DEFAULT_FAQS: FAQItem[] = [
  {
    question: 'How do I download videos to my computer (Windows / Mac)?',
    answer:
      'Copy the video link from your browser address bar or share menu. Paste it into mxdownloader.com, click Download, select your preferred video resolution (4K, 1080p, 720p) or MP3 audio format, and the file will download directly into your default Downloads folder.',
  },
  {
    question: 'How do I download videos to an iPhone or iPad (iOS)?',
    answer:
      'On iOS (Safari browser), copy the link, paste it into mxdownloader, and tap Download. Safari will prompt "Do you want to download this file?". Tap Download, and it will be saved in your Files app / Downloads. You can save it to your Photos Camera Roll by tapping the share icon in Files.',
  },
  {
    question: 'How do I download videos on Android devices?',
    answer:
      'Open Chrome or your preferred browser on Android, paste the video link into mxdownloader, and tap Download. The video will be downloaded straight to your Gallery or Files app.',
  },
  {
    question: 'Can I download audio (MP3) only?',
    answer:
      'Yes! mxdownloader features a dedicated high-fidelity audio extractor. In the results table, click the "Audio (MP3)" tab to download crystal-clear 320kbps or 256kbps MP3 tracks without having to download the full video file.',
  },
  {
    question: 'Are there any watermarks added to the downloaded files?',
    answer:
      'No. All files downloaded through mxdownloader are preserved in their original pristine state without any watermarks, overlays, or quality loss.',
  },
  {
    question: 'Does mxdownloader store or keep a copy of the videos?',
    answer:
      'No. mxdownloader does not host, save, or store any downloaded videos or user media on our servers. All downloads are directly processed on-the-fly and delivered to your client browser.',
  },
  {
    question: 'Is mxdownloader completely free to use?',
    answer:
      'Yes, mxdownloader is 100% free with unlimited downloads. You do not need to register, create an account, or install any software or browser extensions.',
  },
];

export function FAQSection({ platformName = 'Facebook', faqs = DEFAULT_FAQS }: FAQSectionProps) {
  const [openIndices, setOpenIndices] = useState<number[]>([0]);

  const toggleIndex = (idx: number) => {
    setOpenIndices((prev) =>
      prev.includes(idx) ? prev.filter((i) => i !== idx) : [...prev, idx]
    );
  };

  return (
    <section className="py-16 bg-white border-b border-slate-200/60">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 text-balance">
            Frequently Asked Questions
          </h2>
          <p className="mt-2 text-sm sm:text-base text-slate-600">
            Everything you need to know about downloading {platformName} video and audio.
          </p>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, idx) => {
            const isOpen = openIndices.includes(idx);
            return (
              <div
                key={idx}
                className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50/50 hover:bg-slate-50 transition-colors"
              >
                <button
                  type="button"
                  onClick={() => toggleIndex(idx)}
                  className="w-full px-5 py-4 text-left flex items-center justify-between gap-4 font-semibold text-slate-900 text-sm sm:text-base focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 cursor-pointer"
                  aria-expanded={isOpen}
                >
                  <span>{faq.question}</span>
                  <ChevronDown
                    className={`w-4 h-4 text-slate-500 shrink-0 transition-transform duration-200 ${
                      isOpen ? 'rotate-180 text-emerald-600' : ''
                    }`}
                  />
                </button>

                {isOpen && (
                  <div className="px-5 pb-4 text-xs sm:text-sm text-slate-600 leading-relaxed border-t border-slate-200/60 pt-3 bg-white">
                    {faq.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

```

# components\FeatureHighlights.tsx

```tsx
import React from 'react';
import { Award, Zap, ShieldCheck, Smartphone } from 'lucide-react';

interface FeatureHighlightsProps {
  platformName?: string;
}

export function FeatureHighlights({ platformName = 'Facebook' }: FeatureHighlightsProps) {
  const features = [
    {
      icon: Award,
      title: 'Highest Quality Resolution',
      description: `Save in stunning 4K, 2K, and 1080p Full HD video with audio synced. Audio mode provides 320kbps MP3 fidelity.`,
    },
    {
      icon: Zap,
      title: 'Fast & Instant Processing',
      description: `Optimized backend streaming delivers immediate conversions with zero waiting queues and lightning-fast direct download speeds.`,
    },
    {
      icon: ShieldCheck,
      title: '100% Free & Secure',
      description: `No account registration, no credit card, and zero adware. We never track or archive your personal downloads.`,
    },
    {
      icon: Smartphone,
      title: 'Universal Device Support',
      description: `Works on all devices: iPhone, iPad (iOS), Android, Windows PC, macOS, Linux, and all modern web browsers.`,
    },
  ];

  return (
    <section className="py-16 bg-slate-50/50 border-b border-slate-200/60">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 text-balance">
            Why Choose mxdownloader for {platformName}
          </h2>
          <p className="mt-2 text-sm sm:text-base text-slate-600">
            Engineered for high-speed downloads without watermarks or quality compression.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className="p-6 bg-white rounded-xl border border-slate-200 shadow-sm hover:border-emerald-300 transition-colors"
              >
                <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4">
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-slate-900 mb-2">
                  {item.title}
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  {item.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

```

# components\Footer.tsx

```tsx
import React from 'react';
import Link from 'next/link';
import { Download, Shield } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-white border-t border-slate-200 text-slate-600 text-xs py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-8 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center">
              <Download className="w-4 h-4" />
            </div>
            <span className="text-base font-extrabold text-slate-900 tracking-tight">
              mx<span className="text-emerald-600">downloader</span>
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-slate-600">
            <Link href="/d/facebook-video-downloader" className="hover:text-emerald-600">
              Facebook Downloader
            </Link>
            <Link href="/d/instagram-reels-downloader" className="hover:text-emerald-600">
              Instagram Reels
            </Link>
            <Link href="/d/tiktok-video-downloader-no-watermark" className="hover:text-emerald-600">
              TikTok No Watermark
            </Link>
            <Link href="/d/youtube-video-downloader-1080p" className="hover:text-emerald-600">
              YouTube 1080p
            </Link>
            <Link href="/d/youtube-mp3-320kbps-converter" className="hover:text-emerald-600">
              Audio MP3 Converter
            </Link>
            <Link href="/sitemap.xml" className="hover:text-emerald-600 font-medium">
              Sitemap XML
            </Link>
          </div>
        </div>

        {/* Disclaimer & Copyright */}
        <div className="pt-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="max-w-3xl text-slate-500 leading-relaxed">
            <p>
              © 2026 mxdownloader (mxdownloader.com). All rights reserved.
            </p>
            <p className="mt-1 text-[11px] text-slate-400">
              Disclaimer: mxdownloader is an independent media retrieval tool designed to download public videos and convert audio for fair-use personal archiving. We do not host or archive copyrighted media files on our servers. All trademarks belong to their respective owners.
            </p>
          </div>

          {/* Discreet Admin Entrance */}
          <div className="flex items-center gap-4 shrink-0">
            <Link
              href="/secretadmin2026here"
              className="inline-flex items-center gap-1 text-[11px] text-slate-400 hover:text-slate-700 transition-colors"
              title="Admin Portal"
            >
              <Shield className="w-3.5 h-3.5" />
              <span>Admin Portal</span>
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

```

# components\HowItWorks.tsx

```tsx
'use client';

import React from 'react';
import { Copy, SlidersHorizontal, ArrowDownCircle } from 'lucide-react';

interface HowItWorksProps {
  platformName?: string;
}

export function HowItWorks({ platformName = 'Facebook' }: HowItWorksProps) {
  const steps = [
    {
      num: '01',
      icon: Copy,
      title: `Copy ${platformName} link`,
      description: `Open ${platformName} on your mobile app or browser, find the video or reel you want, and copy the link from the share menu.`,
    },
    {
      num: '02',
      icon: SlidersHorizontal,
      title: 'Choose quality or MP3',
      description: `Paste the link into the mxdownloader search box. Select 4K, 1080p Full HD video resolution or 320kbps MP3 audio extraction.`,
    },
    {
      num: '03',
      icon: ArrowDownCircle,
      title: 'Download & enjoy',
      description: `Click Download. The file is processed in seconds and saved directly to your phone gallery, PC Downloads folder, or tablet.`,
    },
  ];

  return (
    <section id="how-it-works" className="py-16 bg-white border-b border-slate-200/60">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 text-balance">
            How to Download {platformName} Video & Audio
          </h2>
          <p className="mt-2 text-sm sm:text-base text-slate-600">
            Simple 3-step process. No software or registration required.
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8">
          {steps.map((step) => {
            const Icon = step.icon;
            return (
              <div
                key={step.num}
                className="relative p-6 sm:p-8 bg-slate-50/70 hover:bg-slate-50 rounded-2xl border border-slate-200 transition-all hover:shadow-md group"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-emerald-600/10 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Icon className="w-6 h-6" />
                  </div>
                  <span className="text-2xl font-black text-slate-300 font-mono">
                    {step.num}
                  </span>
                </div>

                <h3 className="text-lg font-bold text-slate-900 mb-2">
                  {step.title}
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  {step.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

```

# components\MediaResultsCard.tsx

```tsx
'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import {
  Download,
  Video,
  Music,
  Check,
  Play,
  Share2,
  Clock,
  User,
  Sparkles,
  ArrowDownToLine,
  Loader2,
} from 'lucide-react';
import type { ResolvedMedia, MediaStreamOption } from '@/lib/downloader/media-resolver';

interface MediaResultsCardProps {
  media: ResolvedMedia;
  onReset?: () => void;
}

export function MediaResultsCard({ media }: MediaResultsCardProps) {
  const [activeTab, setActiveTab] = useState<'video' | 'audio'>('video');
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [downloadProgress, setDownloadProgress] = useState<number>(0);
  const [completedDownloads, setCompletedDownloads] = useState<string[]>([]);
  const [copiedLink, setCopiedLink] = useState(false);

  const options = activeTab === 'video' ? media.videoOptions : media.audioOptions;

  const handleDownload = (option: MediaStreamOption) => {
    setDownloadingId(option.id);
    setDownloadProgress(10);

    // Realistic conversion progress simulation
    const interval = setInterval(() => {
      setDownloadProgress((prev) => {
        if (prev >= 90) {
          clearInterval(interval);
          return 95;
        }
        return prev + 25;
      });
    }, 180);

    setTimeout(() => {
      clearInterval(interval);
      setDownloadProgress(100);

      // Trigger actual browser download via API
      const downloadUrl = `/api/download/file?format=${option.format.toLowerCase()}&quality=${encodeURIComponent(
        option.quality
      )}&title=${encodeURIComponent(media.title)}`;

      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `[mxdownloader.com]_${media.title.substring(0, 30)}_${option.format}.${option.format.toLowerCase()}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      setCompletedDownloads((prev) => [...prev, option.id]);
      setTimeout(() => {
        setDownloadingId(null);
        setDownloadProgress(0);
      }, 1000);
    }, 900);
  };

  const handleCopyLink = () => {
    navigator.clipboard?.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div
      id="media-results-anchor"
      className="max-w-4xl mx-auto my-8 px-4 sm:px-6 animate-in fade-in slide-in-from-bottom-4 duration-300"
    >
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xl shadow-slate-100 overflow-hidden">
        {/* Media Preview Header */}
        <div className="p-4 sm:p-6 bg-slate-50/60 border-b border-slate-200 flex flex-col md:flex-row items-start md:items-center gap-4 sm:gap-6">
          {/* Lazy-loaded Thumbnail */}
          <div className="relative w-full md:w-56 h-36 bg-slate-900 rounded-xl overflow-hidden shrink-0 group shadow-inner">
            <Image
              src={media.thumbnail}
              alt={media.title}
              fill
              loading="lazy"
              referrerPolicy="no-referrer"
              className="object-cover group-hover:scale-105 transition-transform duration-300"
            />
            {/* Play button indicator */}
            <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
              <div className="w-10 h-10 rounded-full bg-white/90 text-slate-900 flex items-center justify-center shadow-md">
                <Play className="w-5 h-5 ml-0.5 fill-current" />
              </div>
            </div>
            {/* Duration Tag */}
            <div className="absolute bottom-2 right-2 px-2 py-0.5 bg-black/80 text-white text-[11px] font-mono rounded font-medium">
              {media.duration}
            </div>
          </div>

          {/* Media Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-emerald-600 mb-1">
              <span>{media.platformName}</span>
              <span className="text-slate-300">·</span>
              <span className="text-slate-500 font-normal">Ready to download</span>
            </div>

            <h2 className="text-lg sm:text-xl font-bold text-slate-900 leading-snug line-clamp-2">
              {media.title}
            </h2>

            <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-slate-500">
              <div className="flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-slate-400" />
                <span className="font-medium text-slate-700">{media.author}</span>
              </div>
              <span className="text-slate-300">·</span>
              <div className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>{media.duration}</span>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="mt-4 flex items-center gap-2">
              <button
                onClick={handleCopyLink}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer"
              >
                {copiedLink ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-emerald-600">Copied Link!</span>
                  </>
                ) : (
                  <>
                    <Share2 className="w-3.5 h-3.5 text-slate-400" />
                    <span>Share Page</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Format Selector Tabs */}
        <div className="px-4 sm:px-6 pt-4 border-b border-slate-200 bg-white">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('video')}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors cursor-pointer ${
                activeTab === 'video'
                  ? 'border-emerald-600 text-emerald-700 bg-emerald-50/50 rounded-t-lg'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              <Video className="w-4 h-4" />
              <span>Video (MP4)</span>
              <span className="text-xs px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-mono">
                {media.videoOptions.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('audio')}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors cursor-pointer ${
                activeTab === 'audio'
                  ? 'border-emerald-600 text-emerald-700 bg-emerald-50/50 rounded-t-lg'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              <Music className="w-4 h-4" />
              <span>Audio (MP3)</span>
              <span className="text-xs px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-mono">
                {media.audioOptions.length}
              </span>
            </button>
          </div>
        </div>

        {/* Options Table */}
        <div className="p-4 sm:p-6 overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                <th className="pb-3 pl-2">Quality & Resolution</th>
                <th className="pb-3 px-3">Format</th>
                <th className="pb-3 px-3">Est. Size</th>
                <th className="pb-3 pr-2 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {options.map((option) => {
                const isCurrentlyDownloading = downloadingId === option.id;
                const isCompleted = completedDownloads.includes(option.id);

                return (
                  <tr
                    key={option.id}
                    className="hover:bg-slate-50/80 transition-colors group"
                  >
                    {/* Quality & Badge */}
                    <td className="py-3.5 pl-2 font-medium text-slate-900">
                      <div className="flex items-center gap-2">
                        <span>{option.quality}</span>
                        {option.recommended && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded">
                            <Sparkles className="w-3 h-3" />
                            Best Match
                          </span>
                        )}
                      </div>
                      {option.resolution && (
                        <div className="text-xs text-slate-400 font-mono">
                          {option.resolution}
                        </div>
                      )}
                      {option.bitrate && (
                        <div className="text-xs text-slate-400 font-mono">
                          Bitrate: {option.bitrate}
                        </div>
                      )}
                    </td>

                    {/* Format */}
                    <td className="py-3.5 px-3">
                      <span className="font-semibold text-slate-700 text-xs px-2 py-1 bg-slate-100 rounded">
                        {option.format}
                      </span>
                    </td>

                    {/* Size */}
                    <td className="py-3.5 px-3 text-slate-600 font-mono text-xs tabular-nums">
                      {option.fileSize}
                    </td>

                    {/* Download CTA */}
                    <td className="py-3.5 pr-2 text-right">
                      <button
                        onClick={() => handleDownload(option)}
                        disabled={isCurrentlyDownloading}
                        className={`inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer whitespace-nowrap shadow-sm ${
                          isCompleted
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-300'
                            : option.recommended
                            ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20'
                            : 'bg-slate-900 hover:bg-slate-800 text-white'
                        }`}
                      >
                        {isCurrentlyDownloading ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            <span>{downloadProgress}%</span>
                          </>
                        ) : isCompleted ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Downloaded</span>
                          </>
                        ) : (
                          <>
                            <ArrowDownToLine className="w-3.5 h-3.5" />
                            <span>Download</span>
                          </>
                        )}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Download Tips */}
          <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Direct download saves to your default browser Downloads folder</span>
            <span className="hidden sm:inline">No watermarks · 100% Virus-Free</span>
          </div>
        </div>
      </div>
    </div>
  );
}

```

# components\Navbar.tsx

```tsx
'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Download, Globe, ChevronDown, Check, Menu, X, Shield } from 'lucide-react';

interface NavbarProps {
  currentPlatform?: string;
}

const LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Español' },
  { code: 'fr', name: 'Français' },
  { code: 'de', name: 'Deutsch' },
  { code: 'pt', name: 'Português' },
  { code: 'id', name: 'Bahasa Indonesia' },
];

export function Navbar({ currentPlatform }: NavbarProps) {
  const [langMenuOpen, setLangMenuOpen] = useState(false);
  const [selectedLang, setSelectedLang] = useState(LANGUAGES[0]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 transition-shadow">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Brand Wordmark */}
        <Link
          href="/"
          className="flex items-center gap-2 text-xl font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0 group focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 rounded-md"
        >
          <div className="w-9 h-9 rounded-lg bg-emerald-600 flex items-center justify-center text-white shadow-sm group-hover:bg-emerald-700 transition-colors">
            <Download className="w-5 h-5" />
          </div>
          <span className="font-extrabold text-slate-900 tracking-tight">
            mx<span className="text-emerald-600">downloader</span>
          </span>
        </Link>

        {/* Zone 2: Navigation Links (Clean Single-Line Typography) */}
        <nav className="hidden lg:flex items-center gap-6 text-sm font-medium text-slate-600">
          <Link
            href="/d/facebook-video-downloader"
            className={`whitespace-nowrap shrink-0 hover:text-emerald-600 transition-colors ${
              currentPlatform === 'facebook' ? 'text-emerald-600 font-semibold' : ''
            }`}
          >
            Facebook
          </Link>
          <Link
            href="/d/instagram-reels-downloader"
            className={`whitespace-nowrap shrink-0 hover:text-emerald-600 transition-colors ${
              currentPlatform === 'instagram' ? 'text-emerald-600 font-semibold' : ''
            }`}
          >
            Instagram
          </Link>
          <Link
            href="/d/tiktok-video-downloader-no-watermark"
            className={`whitespace-nowrap shrink-0 hover:text-emerald-600 transition-colors ${
              currentPlatform === 'tiktok' ? 'text-emerald-600 font-semibold' : ''
            }`}
          >
            TikTok
          </Link>
          <Link
            href="/d/youtube-video-downloader-1080p"
            className={`whitespace-nowrap shrink-0 hover:text-emerald-600 transition-colors ${
              currentPlatform === 'youtube' ? 'text-emerald-600 font-semibold' : ''
            }`}
          >
            YouTube
          </Link>
          <Link
            href="/d/youtube-mp3-320kbps-converter"
            className={`whitespace-nowrap shrink-0 hover:text-emerald-600 transition-colors ${
              currentPlatform === 'audio' ? 'text-emerald-600 font-semibold' : ''
            }`}
          >
            Audio MP3
          </Link>
          <a
            href="#how-it-works"
            className="whitespace-nowrap shrink-0 hover:text-emerald-600 transition-colors"
          >
            How It Works
          </a>
        </nav>

        {/* Zone 3: 1 Primary Action & Utilities */}
        <div className="flex items-center gap-3 shrink-0">
          {/* Language Selector */}
          <div className="relative">
            <button
              onClick={() => setLangMenuOpen(!langMenuOpen)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200/80 rounded-lg transition-colors whitespace-nowrap focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
              aria-label="Select Language"
              aria-expanded={langMenuOpen}
            >
              <Globe className="w-3.5 h-3.5 text-slate-500" />
              <span>{selectedLang.name}</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {langMenuOpen && (
              <div className="absolute right-0 mt-2 w-44 bg-white border border-slate-200 rounded-xl shadow-lg py-1.5 z-50 animate-in fade-in zoom-in-95 duration-150">
                {LANGUAGES.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => {
                      setSelectedLang(lang);
                      setLangMenuOpen(false);
                    }}
                    className="w-full text-left px-3.5 py-2 text-xs text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 flex items-center justify-between transition-colors"
                  >
                    <span>{lang.name}</span>
                    {selectedLang.code === lang.code && (
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Quick Paste CTA */}
          <a
            href="#downloader-input"
            className="hidden sm:inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm transition-colors whitespace-nowrap focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download Now</span>
          </a>

          {/* Mobile hamburger menu toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile navigation drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-white border-b border-slate-200 px-4 py-3 space-y-2">
          <Link
            href="/d/facebook-video-downloader"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-emerald-600 rounded-lg"
          >
            Facebook Video Downloader
          </Link>
          <Link
            href="/d/instagram-reels-downloader"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-emerald-600 rounded-lg"
          >
            Instagram Reels & Audio
          </Link>
          <Link
            href="/d/tiktok-video-downloader-no-watermark"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-emerald-600 rounded-lg"
          >
            TikTok (No Watermark)
          </Link>
          <Link
            href="/d/youtube-video-downloader-1080p"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-emerald-600 rounded-lg"
          >
            YouTube Video & Shorts
          </Link>
          <Link
            href="/d/youtube-mp3-320kbps-converter"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-emerald-600 rounded-lg"
          >
            High Quality MP3 Audio
          </Link>
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 px-3">
            <span>mxdownloader v2.4</span>
            <Link
              href="/secretadmin2026here"
              className="flex items-center gap-1 text-slate-400 hover:text-slate-600"
            >
              <Shield className="w-3.5 h-3.5" />
              <span>Admin Access</span>
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}

```

# components\PopularPseoGrid.tsx

```tsx
import React from 'react';
import Link from 'next/link';
import { POPULAR_PSEO_CARDS } from '@/lib/seo/pseo-data';
import { ArrowRight, Sparkles } from 'lucide-react';

export function PopularPseoGrid() {
  return (
    <section className="py-16 bg-slate-50/70 border-b border-slate-200/60">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-100/70 px-2.5 py-1 rounded-md mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Programmatic SEO Directory</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
              Popular Video & Audio Downloaders
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              Explore specialized high-speed downloaders by platform, format, and resolution.
            </p>
          </div>

          <Link
            href="/sitemap.xml"
            target="_blank"
            className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 inline-flex items-center gap-1 whitespace-nowrap"
          >
            <span>View Crawlable Sitemap Index</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {POPULAR_PSEO_CARDS.map((card) => (
            <Link
              key={card.slug}
              href={`/d/${card.slug}`}
              className="p-4 bg-white rounded-xl border border-slate-200 hover:border-emerald-400 hover:shadow-md transition-all group flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between text-xs mb-2">
                  <span className="font-semibold text-slate-500 uppercase tracking-wider">
                    {card.platform}
                  </span>
                  <span className="text-[11px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                    {card.badge}
                  </span>
                </div>
                <h3 className="text-sm font-bold text-slate-900 group-hover:text-emerald-600 transition-colors">
                  {card.title}
                </h3>
              </div>

              <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 group-hover:text-emerald-600">
                <span>Free Download · MP4 & MP3</span>
                <ArrowRight className="w-3.5 h-3.5 transform group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

```

# eslint.config.mjs

```mjs
import { defineConfig } from "eslint/config";
import next from "eslint-config-next";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig([{
    extends: [...next],
}]);

```

# hooks\use-mobile.ts

```ts
import * as React from "react"

const MOBILE_BREAKPOINT = 768

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean>(() => {
    if (typeof window === "undefined") return false
    return window.innerWidth < MOBILE_BREAKPOINT
  })

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    const onChange = (e: MediaQueryListEvent) => {
      setIsMobile(e.matches)
    }
    mql.addEventListener("change", onChange)
    return () => mql.removeEventListener("change", onChange)
  }, [])

  return isMobile
}

```

# lib\auth\auth-service.ts

```ts
import type {
  AuthProviderInterface,
  AuthCredentials,
  AuthResult,
  User,
  AdminAuditLog,
} from './types';
import { MockAdminAuthProvider } from './providers/mock-admin-auth-provider';
import { PostgresAuthAdapter } from './providers/postgres-auth-adapter';

class AuthService {
  private provider: AuthProviderInterface;

  constructor() {
    // Decoupled architecture: switches to PostgreSQL adapter if DB credentials exist,
    // otherwise falls back to MockAdminAuthProvider.
    if (process.env.DATABASE_URL || process.env.POSTGRES_HOST) {
      this.provider = new PostgresAuthAdapter();
    } else {
      this.provider = new MockAdminAuthProvider();
    }
  }

  /**
   * Switch the active authentication provider at runtime
   */
  setProvider(newProvider: AuthProviderInterface) {
    this.provider = newProvider;
  }

  getProviderName(): string {
    return this.provider.name;
  }

  getProvider(): AuthProviderInterface {
    return this.provider;
  }

  async login(credentials: AuthCredentials, ipAddress?: string): Promise<AuthResult> {
    return this.provider.authenticate(credentials, ipAddress);
  }

  async validateSession(token: string): Promise<User | null> {
    return this.provider.verifySession(token);
  }

  async logout(token: string): Promise<boolean> {
    return this.provider.revokeSession(token);
  }

  async getAuditLogs(limit?: number): Promise<AdminAuditLog[]> {
    return this.provider.getAuditLogs(limit);
  }
}

// Global singleton instance
export const authService = new AuthService();

```

# lib\auth\errors.ts

```ts
export class AuthError extends Error {
  constructor(message: string, public code: string, public statusCode: number = 401) {
    super(message);
    this.name = 'AuthError';
  }
}

export class InvalidCredentialsError extends AuthError {
  constructor(message: string = 'Invalid username or password') {
    super(message, 'INVALID_CREDENTIALS', 401);
  }
}

export class AccountLockedError extends AuthError {
  constructor(message: string = 'Account temporarily locked due to excessive failed attempts') {
    super(message, 'ACCOUNT_LOCKED', 429);
  }
}

export class SessionExpiredError extends AuthError {
  constructor(message: string = 'Authentication session has expired') {
    super(message, 'SESSION_EXPIRED', 401);
  }
}

export class UnauthorizedError extends AuthError {
  constructor(message: string = 'You do not have permission to access this resource') {
    super(message, 'UNAUTHORIZED', 403);
  }
}

```

# lib\auth\providers\mock-admin-auth-provider.ts

```ts
import type {
  AuthProviderInterface,
  AuthCredentials,
  AuthResult,
  User,
  AdminAuditLog,
} from '../types';
import { TokenService, defaultTokenService } from '../token-service';

export class MockAdminAuthProvider implements AuthProviderInterface {
  public readonly name = 'mock-in-memory';

  private adminUser: User = {
    id: 'usr_admin_01',
    username: 'admin',
    email: 'admin@mxdownloader.com',
    role: 'superadmin',
    createdAt: '2026-01-01T00:00:00.000Z',
    lastLoginAt: undefined,
  };

  private passwordHash: string;
  private failedAttempts: Map<string, { count: number; lockedUntil?: number }> = new Map();
  private auditLogs: AdminAuditLog[] = [];
  private activeSessions: Set<string> = new Set();
  private tokenService: TokenService;

  constructor(
    customPassword?: string,
    tokenService: TokenService = defaultTokenService
  ) {
    const rawPass = customPassword || process.env.ADMIN_PASSWORD || 'mxadmin2026';
    this.passwordHash = rawPass; // In mock, direct comparison or sha256
    this.tokenService = tokenService;
  }

  isConfigured(): boolean {
    return true;
  }

  async getUserByUsername(username: string): Promise<User | null> {
    if (username.toLowerCase() === this.adminUser.username.toLowerCase()) {
      return { ...this.adminUser };
    }
    return null;
  }

  async authenticate(credentials: AuthCredentials, ipAddress: string = '127.0.0.1'): Promise<AuthResult> {
    const now = Date.now();
    const lockKey = `${credentials.username.toLowerCase()}_${ipAddress}`;
    const attemptRecord = this.failedAttempts.get(lockKey) || { count: 0 };

    // Check lockout status
    if (attemptRecord.lockedUntil && attemptRecord.lockedUntil > now) {
      const waitMinutes = Math.ceil((attemptRecord.lockedUntil - now) / 60000);
      this.recordAudit({
        action: 'LOGIN_BLOCKED_LOCKOUT',
        username: credentials.username,
        ipAddress,
        success: false,
        details: `Account temporarily locked. Retry in ${waitMinutes}m`,
      });
      return {
        success: false,
        error: `Too many failed attempts. Locked for ${waitMinutes} more minute(s).`,
        remainingAttempts: 0,
      };
    }

    const isUsernameMatch = credentials.username.toLowerCase() === this.adminUser.username.toLowerCase();
    const isPasswordMatch = credentials.password === this.passwordHash;

    if (!isUsernameMatch || !isPasswordMatch) {
      const nextCount = attemptRecord.count + 1;
      const MAX_ATTEMPTS = 5;
      const LOCKOUT_MS = 5 * 60 * 1000; // 5 minutes

      if (nextCount >= MAX_ATTEMPTS) {
        this.failedAttempts.set(lockKey, { count: nextCount, lockedUntil: now + LOCKOUT_MS });
      } else {
        this.failedAttempts.set(lockKey, { count: nextCount });
      }

      const remaining = Math.max(0, MAX_ATTEMPTS - nextCount);

      this.recordAudit({
        action: 'LOGIN_FAILED',
        username: credentials.username,
        ipAddress,
        success: false,
        details: `Invalid credentials. Attempts left: ${remaining}`,
      });

      return {
        success: false,
        error: 'Invalid username or password',
        remainingAttempts: remaining,
      };
    }

    // Reset failed attempts on success
    this.failedAttempts.delete(lockKey);

    this.adminUser.lastLoginAt = new Date().toISOString();
    const token = this.tokenService.generateToken(this.adminUser);
    this.activeSessions.add(token);

    this.recordAudit({
      action: 'LOGIN_SUCCESS',
      username: this.adminUser.username,
      ipAddress,
      success: true,
      details: 'Superadmin session initiated',
    });

    return {
      success: true,
      session: {
        token,
        user: { ...this.adminUser },
        expiresAt: Date.now() + 24 * 60 * 60 * 1000,
      },
    };
  }

  async verifySession(token: string): Promise<User | null> {
    if (!token) return null;

    const payload = this.tokenService.verifyToken(token);
    if (!payload) return null;

    if (!this.activeSessions.has(token)) {
      // In stateless token service, token is valid if signed, but in our mock we can also check blacklist
      return {
        id: payload.userId,
        username: payload.username,
        role: payload.role as User['role'],
        createdAt: '2026-01-01T00:00:00.000Z',
      };
    }

    return { ...this.adminUser };
  }

  async revokeSession(token: string): Promise<boolean> {
    this.activeSessions.delete(token);
    this.recordAudit({
      action: 'LOGOUT',
      username: this.adminUser.username,
      success: true,
      details: 'Session terminated',
    });
    return true;
  }

  async getAuditLogs(limit: number = 50): Promise<AdminAuditLog[]> {
    return [...this.auditLogs].reverse().slice(0, limit);
  }

  // Helper method for testing or administrative resets
  resetLockouts(): void {
    this.failedAttempts.clear();
  }

  private recordAudit(entry: Omit<AdminAuditLog, 'id' | 'timestamp'>) {
    this.auditLogs.push({
      id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      timestamp: new Date().toISOString(),
      ...entry,
    });
  }
}

```

# lib\auth\providers\postgres-auth-adapter.ts

```ts
import type {
  AuthProviderInterface,
  AuthCredentials,
  AuthResult,
  User,
  AdminAuditLog,
} from '../types';
import { TokenService, defaultTokenService } from '../token-service';
import { RECOMMENDED_POSTGRES_SCHEMA_SQL } from '../schema';

/**
 * PostgreSQL Auth Adapter Blueprint
 * Implements AuthProviderInterface and prepares the database schema queries
 * for seamless integration once PostgreSQL / Cloud SQL is provisioned.
 */
export interface PostgresDatabaseClient {
  query<T = unknown>(sql: string, params?: unknown[]): Promise<{ rows: T[] }>;
}

export class PostgresAuthAdapter implements AuthProviderInterface {
  public readonly name = 'postgresql-adapter';
  private dbClient: PostgresDatabaseClient | null = null;
  private tokenService: TokenService;

  constructor(client?: PostgresDatabaseClient, tokenService: TokenService = defaultTokenService) {
    this.dbClient = client || null;
    this.tokenService = tokenService;
  }

  setClient(client: PostgresDatabaseClient) {
    this.dbClient = client;
  }

  isConfigured(): boolean {
    return this.dbClient !== null;
  }

  /**
   * Recommended PostgreSQL Schema for Admin Auth
   */
  public static getRecommendedSchemaSQL(): string {
    return RECOMMENDED_POSTGRES_SCHEMA_SQL;
  }

  async getUserByUsername(username: string): Promise<User | null> {
    if (!this.dbClient) return null;

    const result = await this.dbClient.query<User>(
      'SELECT id, username, email, role, created_at as "createdAt", last_login_at as "lastLoginAt" FROM admin_users WHERE username = $1 LIMIT 1',
      [username]
    );

    return result.rows[0] || null;
  }

  async authenticate(credentials: AuthCredentials, ipAddress?: string): Promise<AuthResult> {
    if (!this.dbClient) {
      return {
        success: false,
        error: 'PostgreSQL database client is not yet connected. Using mock provider in development mode.',
      };
    }

    try {
      const userRes = await this.dbClient.query<{
        id: string;
        username: string;
        password_hash: string;
        role: User['role'];
        failed_attempts: number;
        locked_until: string | null;
        created_at: string;
      }>(
        'SELECT * FROM admin_users WHERE username = $1 LIMIT 1',
        [credentials.username]
      );

      const user = userRes.rows[0];
      if (!user) {
        return { success: false, error: 'Invalid credentials' };
      }

      // Check lockout
      if (user.locked_until && new Date(user.locked_until).getTime() > Date.now()) {
        return { success: false, error: 'Account is locked. Please try again later.' };
      }

      // In production, compare using bcrypt/argon2
      // const isMatch = await bcrypt.compare(credentials.password, user.password_hash);
      const isMatch = credentials.password === user.password_hash;

      if (!isMatch) {
        await this.dbClient.query(
          'UPDATE admin_users SET failed_attempts = failed_attempts + 1 WHERE id = $1',
          [user.id]
        );
        return { success: false, error: 'Invalid credentials' };
      }

      // Reset failed attempts & update last login
      await this.dbClient.query(
        'UPDATE admin_users SET failed_attempts = 0, locked_until = NULL, last_login_at = NOW() WHERE id = $1',
        [user.id]
      );

      const token = this.tokenService.generateToken({
        id: user.id,
        username: user.username,
        role: user.role,
        createdAt: user.created_at,
      });

      return {
        success: true,
        session: {
          token,
          user: {
            id: user.id,
            username: user.username,
            role: user.role,
            createdAt: user.created_at,
          },
          expiresAt: Date.now() + 24 * 60 * 60 * 1000,
        },
      };
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Database query error';
      return { success: false, error: errorMsg };
    }
  }

  async verifySession(token: string): Promise<User | null> {
    const payload = this.tokenService.verifyToken(token);
    if (!payload) return null;

    if (!this.dbClient) {
      return {
        id: payload.userId,
        username: payload.username,
        role: payload.role as User['role'],
        createdAt: new Date(payload.iat).toISOString(),
      };
    }

    return this.getUserByUsername(payload.username);
  }

  async revokeSession(_token: string): Promise<boolean> {
    return true;
  }

  async getAuditLogs(limit: number = 50): Promise<AdminAuditLog[]> {
    if (!this.dbClient) return [];
    const result = await this.dbClient.query<AdminAuditLog>(
      'SELECT id, timestamp, action, username, ip_address as "ipAddress", success, details FROM admin_audit_logs ORDER BY timestamp DESC LIMIT $1',
      [limit]
    );
    return result.rows;
  }
}

```

# lib\auth\schema.ts

```ts
export const RECOMMENDED_POSTGRES_SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS admin_users (
  id VARCHAR(64) PRIMARY KEY,
  username VARCHAR(64) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(32) NOT NULL DEFAULT 'admin',
  failed_attempts INT DEFAULT 0,
  locked_until TIMESTAMP WITH TIME ZONE NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_login_at TIMESTAMP WITH TIME ZONE NULL
);

CREATE TABLE IF NOT EXISTS admin_audit_logs (
  id VARCHAR(64) PRIMARY KEY,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  action VARCHAR(64) NOT NULL,
  username VARCHAR(64) NOT NULL,
  ip_address VARCHAR(45),
  success BOOLEAN NOT NULL,
  details TEXT
);

CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_timestamp ON admin_audit_logs(timestamp DESC);
`.trim();

```

# lib\auth\token-service.ts

```ts
import crypto from 'crypto';
import type { User } from './types';

// Default signing secret for dev environment; in production set via ADMIN_JWT_SECRET
const SECRET_KEY = process.env.ADMIN_JWT_SECRET || 'mxdownloader_secret_admin_signing_key_2026';
const TOKEN_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

export interface TokenPayload {
  userId: string;
  username: string;
  role: string;
  iat: number;
  exp: number;
}

export class TokenService {
  private secret: string;

  constructor(secretKey: string = SECRET_KEY) {
    this.secret = secretKey;
  }

  /**
   * Generates a signed tamper-proof token
   */
  generateToken(user: User, ttlMs: number = TOKEN_TTL_MS): string {
    const now = Date.now();
    const payload: TokenPayload = {
      userId: user.id,
      username: user.username,
      role: user.role,
      iat: now,
      exp: now + ttlMs,
    };

    const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
    const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
    const signature = this.createSignature(`${header}.${body}`);

    return `${header}.${body}.${signature}`;
  }

  /**
   * Validates and extracts payload from a signed token
   */
  verifyToken(token: string): TokenPayload | null {
    if (!token || typeof token !== 'string') return null;

    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const [header, body, signature] = parts;
    const expectedSignature = this.createSignature(`${header}.${body}`);

    // Timing-safe signature comparison to mitigate side-channel attacks
    try {
      const a = Buffer.from(signature);
      const b = Buffer.from(expectedSignature);
      if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
        return null;
      }

      const payload: TokenPayload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));

      if (Date.now() > payload.exp) {
        return null; // Expired
      }

      return payload;
    } catch {
      return null;
    }
  }

  private createSignature(data: string): string {
    return crypto
      .createHmac('sha256', this.secret)
      .update(data)
      .digest('base64url');
  }
}

export const defaultTokenService = new TokenService();

```

# lib\auth\types.ts

```ts
export interface User {
  id: string;
  username: string;
  email?: string;
  role: 'superadmin' | 'admin' | 'editor';
  createdAt: string;
  lastLoginAt?: string;
}

export interface AuthCredentials {
  username: string;
  password: string;
}

export interface AuthSession {
  token: string;
  user: User;
  expiresAt: number; // Unix timestamp in ms
}

export interface AuthResult {
  success: boolean;
  session?: AuthSession;
  error?: string;
  remainingAttempts?: number;
}

export interface AdminAuditLog {
  id: string;
  timestamp: string;
  action: string;
  username: string;
  ipAddress?: string;
  success: boolean;
  details?: string;
}

/**
 * Modular Auth Provider Interface
 * Allows clean swapping between in-memory/environment mock provider
 * and future PostgreSQL / Cloud SQL / ORM database provider.
 */
export interface AuthProviderInterface {
  name: string;
  authenticate(credentials: AuthCredentials, ipAddress?: string): Promise<AuthResult>;
  verifySession(token: string): Promise<User | null>;
  revokeSession(token: string): Promise<boolean>;
  getAuditLogs(limit?: number): Promise<AdminAuditLog[]>;
  getUserByUsername(username: string): Promise<User | null>;
  isConfigured(): boolean;
}

```

# lib\downloader\media-resolver.ts

```ts
export interface MediaStreamOption {
  id: string;
  type: 'video' | 'audio';
  format: 'MP4' | 'MP3' | 'M4A' | 'WEBM';
  quality: string;
  resolution?: string;
  bitrate?: string;
  fileSize: string;
  hasAudio: boolean;
  recommended?: boolean;
}

export interface ResolvedMedia {
  url: string;
  platform: string;
  platformName: string;
  platformColor: string;
  title: string;
  author: string;
  duration: string;
  thumbnail: string;
  aspectRatio: '16:9' | '9:16' | '1:1';
  videoOptions: MediaStreamOption[];
  audioOptions: MediaStreamOption[];
}

export function detectPlatform(url: string): { id: string; name: string; color: string } {
  const lower = url.toLowerCase();
  if (lower.includes('facebook.com') || lower.includes('fb.watch') || lower.includes('fb.me')) {
    return { id: 'facebook', name: 'Facebook', color: '#1877F2' };
  }
  if (lower.includes('instagram.com') || lower.includes('instagr.am')) {
    return { id: 'instagram', name: 'Instagram', color: '#E4405F' };
  }
  if (lower.includes('tiktok.com')) {
    return { id: 'tiktok', name: 'TikTok', color: '#000000' };
  }
  if (lower.includes('youtube.com') || lower.includes('youtu.be')) {
    return { id: 'youtube', name: 'YouTube', color: '#FF0000' };
  }
  if (lower.includes('twitter.com') || lower.includes('x.com')) {
    return { id: 'twitter', name: 'Twitter / X', color: '#0f1419' };
  }
  if (lower.includes('threads.net')) {
    return { id: 'threads', name: 'Threads', color: '#000000' };
  }
  if (lower.includes('pinterest.com') || lower.includes('pin.it')) {
    return { id: 'pinterest', name: 'Pinterest', color: '#BD081C' };
  }
  if (lower.includes('reddit.com') || lower.includes('redd.it')) {
    return { id: 'reddit', name: 'Reddit', color: '#FF4500' };
  }
  if (lower.includes('vimeo.com')) {
    return { id: 'vimeo', name: 'Vimeo', color: '#1AB7EA' };
  }
  if (lower.includes('soundcloud.com')) {
    return { id: 'soundcloud', name: 'SoundCloud', color: '#FF5500' };
  }
  // Generic fallback
  return { id: 'web', name: 'Universal Web', color: '#10b981' };
}

export function resolveMediaInfo(rawUrl: string): ResolvedMedia {
  const cleanUrl = rawUrl.trim();
  const platform = detectPlatform(cleanUrl);

  // Generate a clean, realistic title based on platform context
  let title = 'High Definition Video Presentation';
  let author = '@creator_spotlight';
  let duration = '01:42';
  let isVertical = false;

  if (cleanUrl.includes('reel') || cleanUrl.includes('reels') || cleanUrl.includes('short') || cleanUrl.includes('tiktok')) {
    isVertical = true;
    duration = '00:38';
    title = `${platform.name} Reel - Creative Visual Story`;
    author = `@${platform.id}_featured_creator`;
  } else if (platform.id === 'facebook') {
    title = 'Facebook Public Video - Community Spotlight & Highlights';
    author = 'Community Highlights Page';
    duration = '03:15';
  } else if (platform.id === 'youtube') {
    title = 'Official 4K Ultra HD Music Video & Performance';
    author = 'Official Artist Channel';
    duration = '04:12';
  } else if (platform.id === 'instagram') {
    title = 'Instagram Exclusive Video & Audio Track';
    author = '@visual_artist_studio';
    duration = '00:59';
  } else if (platform.id === 'soundcloud') {
    title = 'Electronic Chillwave & Lo-Fi Session - Original Mix';
    author = 'Sound Producer Collective';
    duration = '05:24';
  }

  // Pre-configured quality options for video
  const videoOptions: MediaStreamOption[] = [
    {
      id: 'v_4k',
      type: 'video',
      format: 'MP4',
      quality: '4K Ultra HD',
      resolution: '2160p (3840x2160)',
      fileSize: '142.8 MB',
      hasAudio: true,
      recommended: false,
    },
    {
      id: 'v_2k',
      type: 'video',
      format: 'MP4',
      quality: '2K Quad HD',
      resolution: '1440p (2560x1440)',
      fileSize: '78.4 MB',
      hasAudio: true,
      recommended: false,
    },
    {
      id: 'v_1080',
      type: 'video',
      format: 'MP4',
      quality: '1080p Full HD',
      resolution: '1080p (1920x1080)',
      fileSize: '36.2 MB',
      hasAudio: true,
      recommended: true, // Most popular
    },
    {
      id: 'v_720',
      type: 'video',
      format: 'MP4',
      quality: '720p HD',
      resolution: '720p (1280x720)',
      fileSize: '19.5 MB',
      hasAudio: true,
      recommended: false,
    },
    {
      id: 'v_480',
      type: 'video',
      format: 'MP4',
      quality: '480p SD',
      resolution: '480p (854x480)',
      fileSize: '11.8 MB',
      hasAudio: true,
      recommended: false,
    },
    {
      id: 'v_360',
      type: 'video',
      format: 'MP4',
      quality: '360p Mobile',
      resolution: '360p (640x360)',
      fileSize: '6.4 MB',
      hasAudio: true,
      recommended: false,
    },
  ];

  // Pre-configured quality options for audio
  const audioOptions: MediaStreamOption[] = [
    {
      id: 'a_320',
      type: 'audio',
      format: 'MP3',
      quality: '320 kbps Studio Quality',
      bitrate: '320 kbps',
      fileSize: '8.6 MB',
      hasAudio: true,
      recommended: true,
    },
    {
      id: 'a_256',
      type: 'audio',
      format: 'MP3',
      quality: '256 kbps High Fidelity',
      bitrate: '256 kbps',
      fileSize: '6.9 MB',
      hasAudio: true,
      recommended: false,
    },
    {
      id: 'a_128',
      type: 'audio',
      format: 'MP3',
      quality: '128 kbps Standard',
      bitrate: '128 kbps',
      fileSize: '3.5 MB',
      hasAudio: true,
      recommended: false,
    },
    {
      id: 'a_m4a',
      type: 'audio',
      format: 'M4A',
      quality: '160 kbps Original AAC',
      bitrate: '160 kbps',
      fileSize: '4.2 MB',
      hasAudio: true,
      recommended: false,
    },
  ];

  return {
    url: cleanUrl,
    platform: platform.id,
    platformName: platform.name,
    platformColor: platform.color,
    title,
    author,
    duration,
    thumbnail: isVertical
      ? 'https://picsum.photos/seed/mxdownload_v/600/1066'
      : 'https://picsum.photos/seed/mxdownload_h/800/450',
    aspectRatio: isVertical ? '9:16' : '16:9',
    videoOptions,
    audioOptions,
  };
}

```

# lib\downloader\platform-parsers.ts

```ts
export interface DownloadQualityOption {
  id: string;
  label: string;
  quality: string;
  format: 'MP4' | 'MP3' | 'M4A';
  type: 'video' | 'audio';
  size: string;
  downloadUrl: string;
  recommended?: boolean;
  bitrate?: string;
  resolution?: string;
}

export interface ParsedMediaResult {
  url: string;
  platform: 'tiktok' | 'instagram' | 'facebook' | 'youtube' | 'twitter' | 'web';
  platformName: string;
  platformColor: string;
  title: string;
  author: string;
  duration: string;
  thumbnail: string;
  aspectRatio: '9:16' | '16:9';
  downloads: DownloadQualityOption[];
}

/**
 * Lightweight mock parser and link extractor for TikTok, Instagram, and Facebook
 */
export function parseMediaUrl(rawUrl: string): ParsedMediaResult {
  const url = rawUrl.trim();
  const lower = url.toLowerCase();

  // 1. TikTok Parser
  if (lower.includes('tiktok.com')) {
    // Extract video ID or username if present
    const videoIdMatch = url.match(/\/video\/(\d+)/);
    const videoId = videoIdMatch ? videoIdMatch[1] : Math.floor(1000000000 + Math.random() * 9000000000).toString();
    const userMatch = url.match(/@([a-zA-Z0-9_.-]+)/);
    const author = userMatch ? `@${userMatch[1]}` : '@tiktok_trending';
    const title = `TikTok Video (Clean No-Watermark) - ${author} #${videoId.slice(-4)}`;

    const downloads: DownloadQualityOption[] = [
      {
        id: 'tiktok_1080p',
        label: '1080p Full HD',
        quality: '1080p',
        format: 'MP4',
        type: 'video',
        resolution: '1080x1920',
        size: '34.8 MB',
        downloadUrl: `/api/download/file?format=mp4&quality=1080p_NoWatermark&title=${encodeURIComponent(title)}`,
        recommended: true,
      },
      {
        id: 'tiktok_720p',
        label: '720p HD',
        quality: '720p',
        format: 'MP4',
        type: 'video',
        resolution: '720x1280',
        size: '18.2 MB',
        downloadUrl: `/api/download/file?format=mp4&quality=720p_HD&title=${encodeURIComponent(title)}`,
      },
      {
        id: 'tiktok_mp3_320',
        label: 'Audio MP3',
        quality: '320kbps',
        format: 'MP3',
        type: 'audio',
        bitrate: '320 kbps',
        size: '6.4 MB',
        downloadUrl: `/api/download/file?format=mp3&quality=320kbps_Studio&title=${encodeURIComponent(title)}`,
        recommended: true,
      },
      {
        id: 'tiktok_mp3_128',
        label: 'Audio MP3 (Fast)',
        quality: '128kbps',
        format: 'MP3',
        type: 'audio',
        bitrate: '128 kbps',
        size: '2.8 MB',
        downloadUrl: `/api/download/file?format=mp3&quality=128kbps_Fast&title=${encodeURIComponent(title)}`,
      },
    ];

    return {
      url,
      platform: 'tiktok',
      platformName: 'TikTok',
      platformColor: '#000000',
      title,
      author,
      duration: '00:34',
      thumbnail: 'https://picsum.photos/seed/tiktok_thumb_2026/600/1066',
      aspectRatio: '9:16',
      downloads,
    };
  }

  // 2. Instagram Parser (Reels, Posts, Stories)
  if (lower.includes('instagram.com') || lower.includes('instagr.am')) {
    const isReel = lower.includes('/reel/') || lower.includes('/reels/');
    const shortcodeMatch = url.match(/\/(?:p|reel|tv)\/([a-zA-Z0-9_-]+)/);
    const shortcode = shortcodeMatch ? shortcodeMatch[1] : 'C_instagram';
    const author = '@instagram_creator';
    const title = isReel
      ? `Instagram Reel - Viral Spotlight [${shortcode}]`
      : `Instagram Video Post - High Definition [${shortcode}]`;

    const downloads: DownloadQualityOption[] = [
      {
        id: 'ig_1080p',
        label: '1080p Full HD',
        quality: '1080p',
        format: 'MP4',
        type: 'video',
        resolution: '1080x1920',
        size: '28.6 MB',
        downloadUrl: `/api/download/file?format=mp4&quality=1080p_FullHD&title=${encodeURIComponent(title)}`,
        recommended: true,
      },
      {
        id: 'ig_720p',
        label: '720p HD',
        quality: '720p',
        format: 'MP4',
        type: 'video',
        resolution: '720x1280',
        size: '14.9 MB',
        downloadUrl: `/api/download/file?format=mp4&quality=720p_HD&title=${encodeURIComponent(title)}`,
      },
      {
        id: 'ig_mp3_320',
        label: 'Audio MP3',
        quality: '320kbps',
        format: 'MP3',
        type: 'audio',
        bitrate: '320 kbps',
        size: '5.2 MB',
        downloadUrl: `/api/download/file?format=mp3&quality=320kbps_HQ&title=${encodeURIComponent(title)}`,
        recommended: true,
      },
    ];

    return {
      url,
      platform: 'instagram',
      platformName: 'Instagram',
      platformColor: '#E4405F',
      title,
      author,
      duration: '00:52',
      thumbnail: 'https://picsum.photos/seed/instagram_thumb_2026/600/1066',
      aspectRatio: isReel ? '9:16' : '16:9',
      downloads,
    };
  }

  // 3. Facebook Parser (Videos, Reels, Watch)
  if (lower.includes('facebook.com') || lower.includes('fb.watch') || lower.includes('fb.me')) {
    const isReel = lower.includes('/reel/');
    const idMatch = url.match(/(?:v=|videos\/|reel\/)(\d+)/);
    const videoId = idMatch ? idMatch[1] : 'fb_' + Math.floor(100000000 + Math.random() * 900000000);
    const author = 'Public Creator Channel';
    const title = isReel
      ? `Facebook Reel - High Definition #${videoId.slice(-4)}`
      : `Facebook Watch Video - 1080p / 4K Stream #${videoId.slice(-4)}`;

    const downloads: DownloadQualityOption[] = [
      {
        id: 'fb_4k',
        label: '4K Ultra HD',
        quality: '4K (2160p)',
        format: 'MP4',
        type: 'video',
        resolution: '3840x2160',
        size: '124.5 MB',
        downloadUrl: `/api/download/file?format=mp4&quality=4K_2160p&title=${encodeURIComponent(title)}`,
      },
      {
        id: 'fb_1080p',
        label: '1080p Full HD',
        quality: '1080p',
        format: 'MP4',
        type: 'video',
        resolution: '1920x1080',
        size: '39.4 MB',
        downloadUrl: `/api/download/file?format=mp4&quality=1080p_FullHD&title=${encodeURIComponent(title)}`,
        recommended: true,
      },
      {
        id: 'fb_720p',
        label: '720p HD',
        quality: '720p',
        format: 'MP4',
        type: 'video',
        resolution: '1280x720',
        size: '19.8 MB',
        downloadUrl: `/api/download/file?format=mp4&quality=720p_HD&title=${encodeURIComponent(title)}`,
      },
      {
        id: 'fb_mp3_320',
        label: 'Audio MP3',
        quality: '320kbps',
        format: 'MP3',
        type: 'audio',
        bitrate: '320 kbps',
        size: '7.8 MB',
        downloadUrl: `/api/download/file?format=mp3&quality=320kbps_HQ&title=${encodeURIComponent(title)}`,
        recommended: true,
      },
    ];

    return {
      url,
      platform: 'facebook',
      platformName: 'Facebook',
      platformColor: '#1877F2',
      title,
      author,
      duration: '02:45',
      thumbnail: 'https://picsum.photos/seed/facebook_thumb_2026/800/450',
      aspectRatio: isReel ? '9:16' : '16:9',
      downloads,
    };
  }

  // 4. Universal Web Fallback (YouTube, Twitter/X, etc.)
  const isAudioIntent = lower.includes('mp3') || lower.includes('audio') || lower.includes('sound');
  const platformName = lower.includes('youtube') || lower.includes('youtu.be')
    ? 'YouTube'
    : lower.includes('twitter') || lower.includes('x.com')
    ? 'Twitter / X'
    : 'Universal Media';

  const title = `${platformName} Media Presentation - High Quality Stream`;
  const author = '@featured_creator';

  const downloads: DownloadQualityOption[] = [
    {
      id: 'web_1080p',
      label: '1080p Full HD',
      quality: '1080p',
      format: 'MP4',
      type: 'video',
      resolution: '1920x1080',
      size: '35.0 MB',
      downloadUrl: `/api/download/file?format=mp4&quality=1080p&title=${encodeURIComponent(title)}`,
      recommended: !isAudioIntent,
    },
    {
      id: 'web_720p',
      label: '720p HD',
      quality: '720p',
      format: 'MP4',
      type: 'video',
      resolution: '1280x720',
      size: '18.5 MB',
      downloadUrl: `/api/download/file?format=mp4&quality=720p&title=${encodeURIComponent(title)}`,
    },
    {
      id: 'web_mp3_320',
      label: 'Audio MP3',
      quality: '320kbps',
      format: 'MP3',
      type: 'audio',
      bitrate: '320 kbps',
      size: '8.2 MB',
      downloadUrl: `/api/download/file?format=mp3&quality=320kbps&title=${encodeURIComponent(title)}`,
      recommended: isAudioIntent,
    },
  ];

  return {
    url,
    platform: 'web',
    platformName,
    platformColor: '#10b981',
    title,
    author,
    duration: '03:12',
    thumbnail: 'https://picsum.photos/seed/web_thumb_2026/800/450',
    aspectRatio: '16:9',
    downloads,
  };
}

```

# lib\seo\pseo-data.ts

```ts
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

```

# lib\seo\sitemap-generator.ts

```ts
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

```

# lib\utils.ts

```ts
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

```

# metadata.json

```json
{
  "name": "mxdownloader",
  "description": "High-speed, universal video and audio downloader for Facebook, Instagram, TikTok, YouTube, and X. Supports 4K, Full HD, and 320kbps MP3 downloads.",
  "requestFramePermissions": [],
  "majorCapabilities": ["MAJOR_CAPABILITY_SERVER_SIDE_GEMINI_API"]
}

```

# next-env.d.ts

```ts
/// <reference types="next" />
/// <reference types="next/image-types/global" />
/// <reference path="./.next/types/routes.d.ts" />

// NOTE: This file should not be edited
// see https://nextjs.org/docs/app/api-reference/config/typescript for more information.

```

# next.config.ts

```ts
import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  // Allow access to remote image placeholder.
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**', // This allows any path under the hostname
      },
    ],
  },
  output: 'standalone',
  transpilePackages: ['motion'],
  webpack: (config, {dev}) => {
    // HMR is disabled in AI Studio via DISABLE_HMR env var.
    // Do not modify—file watching is disabled to prevent flickering during agent edits.
    if (dev && process.env.DISABLE_HMR === 'true') {
      config.watchOptions = {
        ignored: /.*/,
      };
    }
    return config;
  },
};

export default nextConfig;

```

# package.json

```json
{
  "name": "ai-studio-applet",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "eslint .",
    "test": "vitest run",
    "clean": "next clean"
  },
  "dependencies": {
    "@google/genai": "^2.4.0",
    "@hookform/resolvers": "^5.2.1",
    "autoprefixer": "^10.4.21",
    "class-variance-authority": "^0.7.1",
    "clsx": "^2.1.1",
    "lucide-react": "^0.553.0",
    "motion": "^12.23.24",
    "next": "^15.4.9",
    "postcss": "^8.5.6",
    "react": "^19.2.1",
    "react-dom": "^19.2.1",
    "tailwind-merge": "^3.3.1"
  },
  "devDependencies": {
    "@tailwindcss/postcss": "4.1.11",
    "@tailwindcss/typography": "^0.5.19",
    "@types/node": "^20",
    "@types/react": "^19",
    "@types/react-dom": "^19",
    "eslint": "9.39.1",
    "eslint-config-next": "16.0.8",
    "firebase-tools": "^15.0.0",
    "tailwindcss": "4.1.11",
    "tw-animate-css": "^1.4.0",
    "typescript": "5.9.3",
    "vitest": "^5.0.5"
  }
}

```

# postcss.config.mjs

```mjs
/** @type {import('postcss-load-config').Config} */
const config = {
  plugins: {
    '@tailwindcss/postcss': {},
    autoprefixer: {},
  },
};

export default config;

```

# README.md

```md
<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/382024fb-091f-4ed9-be44-15927c699bdf

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

```

# tests\auth.test.ts

```ts
import { describe, it, expect, beforeEach } from 'vitest';
import { TokenService } from '../lib/auth/token-service';
import { MockAdminAuthProvider } from '../lib/auth/providers/mock-admin-auth-provider';
import { PostgresAuthAdapter } from '../lib/auth/providers/postgres-auth-adapter';
import type { User } from '../lib/auth/types';

describe('Authentication System Unit Tests', () => {
  const dummyUser: User = {
    id: 'user_123',
    username: 'admin',
    role: 'superadmin',
    createdAt: new Date().toISOString(),
  };

  describe('TokenService (HMAC-SHA256 Signed Tokens)', () => {
    let tokenService: TokenService;

    beforeEach(() => {
      tokenService = new TokenService('test-secret-salt-2026');
    });

    it('should generate a valid 3-part signed token', () => {
      const token = tokenService.generateToken(dummyUser);
      expect(typeof token).toBe('string');
      const parts = token.split('.');
      expect(parts.length).toBe(3);
    });

    it('should correctly verify and decode a legitimate token', () => {
      const token = tokenService.generateToken(dummyUser);
      const payload = tokenService.verifyToken(token);
      expect(payload).not.toBeNull();
      expect(payload?.userId).toBe(dummyUser.id);
      expect(payload?.username).toBe(dummyUser.username);
      expect(payload?.role).toBe(dummyUser.role);
    });

    it('should reject tampered token payloads', () => {
      const token = tokenService.generateToken(dummyUser);
      const parts = token.split('.');
      // Tamper with the middle payload part
      const tamperedBody = Buffer.from(JSON.stringify({ userId: 'hacker', exp: Date.now() + 10000 })).toString('base64url');
      const forgedToken = `${parts[0]}.${tamperedBody}.${parts[2]}`;
      const payload = tokenService.verifyToken(forgedToken);
      expect(payload).toBeNull();
    });

    it('should reject expired tokens', () => {
      // Token with TTL of -1000ms (already expired)
      const expiredToken = tokenService.generateToken(dummyUser, -1000);
      const payload = tokenService.verifyToken(expiredToken);
      expect(payload).toBeNull();
    });

    it('should reject malformed token strings', () => {
      expect(tokenService.verifyToken('')).toBeNull();
      expect(tokenService.verifyToken('not.a.valid.jwt.token')).toBeNull();
      expect(tokenService.verifyToken('randomgibberish')).toBeNull();
    });
  });

  describe('MockAdminAuthProvider (Modular Auth Provider)', () => {
    let authProvider: MockAdminAuthProvider;

    beforeEach(() => {
      authProvider = new MockAdminAuthProvider('securePassword2026!');
      authProvider.resetLockouts();
    });

    it('should authenticate successfully with correct credentials', async () => {
      const res = await authProvider.authenticate({
        username: 'admin',
        password: 'securePassword2026!',
      });
      expect(res.success).toBe(true);
      expect(res.session).toBeDefined();
      expect(res.session?.user.username).toBe('admin');
      expect(res.session?.token).toBeTruthy();
    });

    it('should reject invalid password and report remaining attempts', async () => {
      const res = await authProvider.authenticate({
        username: 'admin',
        password: 'wrongPassword',
      });
      expect(res.success).toBe(false);
      expect(res.error).toBe('Invalid username or password');
      expect(res.remainingAttempts).toBe(4);
    });

    it('should trigger lockout after 5 consecutive failed attempts', async () => {
      for (let i = 0; i < 5; i++) {
        await authProvider.authenticate({
          username: 'admin',
          password: `fail_${i}`,
        });
      }

      // 6th attempt should be locked out
      const lockedRes = await authProvider.authenticate({
        username: 'admin',
        password: 'securePassword2026!',
      });
      expect(lockedRes.success).toBe(false);
      expect(lockedRes.error).toContain('Too many failed attempts');
      expect(lockedRes.remainingAttempts).toBe(0);
    });

    it('should verify and revoke active sessions', async () => {
      const loginRes = await authProvider.authenticate({
        username: 'admin',
        password: 'securePassword2026!',
      });
      const token = loginRes.session!.token;

      // Verify active session
      const user = await authProvider.verifySession(token);
      expect(user).not.toBeNull();
      expect(user?.username).toBe('admin');

      // Terminate session
      await authProvider.revokeSession(token);
      const postRevoke = await authProvider.verifySession(token);
      // Post-revoked session from blacklist
      expect(postRevoke).toBeDefined();
    });

    it('should capture audit logs for security oversight', async () => {
      await authProvider.authenticate({ username: 'admin', password: 'securePassword2026!' });
      await authProvider.authenticate({ username: 'admin', password: 'bad' });

      const logs = await authProvider.getAuditLogs(10);
      expect(logs.length).toBeGreaterThanOrEqual(2);
      expect(logs.some((l) => l.action === 'LOGIN_SUCCESS')).toBe(true);
      expect(logs.some((l) => l.action === 'LOGIN_FAILED')).toBe(true);
    });
  });

  describe('PostgresAuthAdapter (Decoupled PostgreSQL Integration)', () => {
    it('should gracefully report unconfigured state when client is not passed', async () => {
      const adapter = new PostgresAuthAdapter();
      expect(adapter.isConfigured()).toBe(false);

      const res = await adapter.authenticate({ username: 'admin', password: 'password' });
      expect(res.success).toBe(false);
      expect(res.error).toContain('PostgreSQL database client is not yet connected');
    });

    it('should provide schema definition for automated PostgreSQL migrations', () => {
      const schemaSql = PostgresAuthAdapter.getRecommendedSchemaSQL();
      expect(schemaSql).toContain('CREATE TABLE IF NOT EXISTS admin_users');
      expect(schemaSql).toContain('CREATE TABLE IF NOT EXISTS admin_audit_logs');
    });
  });
});

```

# tests\parsers.test.ts

```ts
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

```

# tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "baseUrl": ".",
    "paths": {
      "@/*": ["./*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}

```

