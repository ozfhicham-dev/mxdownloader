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
    setDownloadProgress(20);

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

      // Pass real target URL to the file streaming endpoint
      const targetUrl = (option as unknown as { url?: string }).url || (media as unknown as { sourceUrl?: string }).sourceUrl || '';
      const downloadUrl = `/api/download/file?url=${encodeURIComponent(targetUrl)}&format=${option.format.toLowerCase()}&quality=${encodeURIComponent(
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
    }, 800);
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
          <div className="relative w-full md:w-56 h-36 bg-slate-900 rounded-xl overflow-hidden shrink-0 group shadow-inner">
            <Image
              src={media.thumbnail}
              alt={media.title}
              fill
              loading="lazy"
              referrerPolicy="no-referrer"
              className="object-cover group-hover:scale-105 transition-transform duration-300"
            />
            <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
              <div className="w-10 h-10 rounded-full bg-white/90 text-slate-900 flex items-center justify-center shadow-md">
                <Play className="w-5 h-5 ml-0.5 fill-current" />
              </div>
            </div>
            <div className="absolute bottom-2 right-2 px-2 py-0.5 bg-black/80 text-white text-[11px] font-mono rounded font-medium">
              {media.duration}
            </div>
          </div>

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

                    <td className="py-3.5 px-3">
                      <span className="font-semibold text-slate-700 text-xs px-2 py-1 bg-slate-100 rounded">
                        {option.format}
                      </span>
                    </td>

                    <td className="py-3.5 px-3 text-slate-600 font-mono text-xs tabular-nums">
                      {option.fileSize}
                    </td>

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

          <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Direct download saves to your default browser Downloads folder</span>
            <span className="hidden sm:inline">No watermarks · 100% Virus-Free</span>
          </div>
        </div>
      </div>
    </div>
  );
}