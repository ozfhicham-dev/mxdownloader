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
