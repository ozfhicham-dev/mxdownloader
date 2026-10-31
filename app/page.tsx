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
