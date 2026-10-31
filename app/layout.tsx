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
