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
