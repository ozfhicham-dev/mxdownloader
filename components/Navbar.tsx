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
