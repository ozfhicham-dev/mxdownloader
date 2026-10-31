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
