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
