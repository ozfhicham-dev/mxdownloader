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
