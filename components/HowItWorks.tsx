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
