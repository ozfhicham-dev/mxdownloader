import React from 'react';
import { Award, Zap, ShieldCheck, Smartphone } from 'lucide-react';

interface FeatureHighlightsProps {
  platformName?: string;
}

export function FeatureHighlights({ platformName = 'Facebook' }: FeatureHighlightsProps) {
  const features = [
    {
      icon: Award,
      title: 'Highest Quality Resolution',
      description: `Save in stunning 4K, 2K, and 1080p Full HD video with audio synced. Audio mode provides 320kbps MP3 fidelity.`,
    },
    {
      icon: Zap,
      title: 'Fast & Instant Processing',
      description: `Optimized backend streaming delivers immediate conversions with zero waiting queues and lightning-fast direct download speeds.`,
    },
    {
      icon: ShieldCheck,
      title: '100% Free & Secure',
      description: `No account registration, no credit card, and zero adware. We never track or archive your personal downloads.`,
    },
    {
      icon: Smartphone,
      title: 'Universal Device Support',
      description: `Works on all devices: iPhone, iPad (iOS), Android, Windows PC, macOS, Linux, and all modern web browsers.`,
    },
  ];

  return (
    <section className="py-16 bg-slate-50/50 border-b border-slate-200/60">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 text-balance">
            Why Choose mxdownloader for {platformName}
          </h2>
          <p className="mt-2 text-sm sm:text-base text-slate-600">
            Engineered for high-speed downloads without watermarks or quality compression.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className="p-6 bg-white rounded-xl border border-slate-200 shadow-sm hover:border-emerald-300 transition-colors"
              >
                <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4">
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-slate-900 mb-2">
                  {item.title}
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  {item.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
