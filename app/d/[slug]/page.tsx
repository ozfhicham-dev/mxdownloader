import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { generatePageMetadata, getPSEOIndex } from '@/lib/seo/pseo-data';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { HowItWorks } from '@/components/HowItWorks';
import { FeatureHighlights } from '@/components/FeatureHighlights';
import { FAQSection } from '@/components/FAQSection';
import { PopularPseoGrid } from '@/components/PopularPseoGrid';
import { ClientPSEOWrapper } from '@/components/ClientPSEOWrapper';
import { ChevronRight, Home, ShieldCheck } from 'lucide-react';

interface Props {
  params: Promise<{ slug: string }>;
}

// Generate dynamic SEO metadata
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const data = generatePageMetadata(slug);

  return {
    title: data.title,
    description: data.description,
    keywords: data.keywords,
    openGraph: {
      title: data.title,
      description: data.description,
      type: 'website',
      url: `https://mxdownloader.com/d/${slug}`,
    },
    twitter: {
      card: 'summary_large_image',
      title: data.title,
      description: data.description,
    },
    alternates: {
      canonical: `https://mxdownloader.com/d/${slug}`,
    },
  };
}

export default async function PSEOLandingPage({ params }: Props) {
  const { slug } = await params;
  const data = generatePageMetadata(slug);

  // Structured Data JSON-LD for rich snippets
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebApplication',
        name: data.title,
        url: `https://mxdownloader.com/d/${slug}`,
        applicationCategory: 'MultimediaApplication',
        operatingSystem: 'All',
        offers: {
          '@type': 'Offer',
          price: '0',
          priceCurrency: 'USD',
        },
      },
      {
        '@type': 'FAQPage',
        mainEntity: data.faqs.map((faq) => ({
          '@type': 'Question',
          name: faq.question,
          acceptedAnswer: {
            '@type': 'Answer',
            text: faq.answer,
          },
        })),
      },
    ],
  };

  return (
    <div className="min-h-screen bg-slate-50/40 text-slate-900 flex flex-col font-sans">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <Navbar currentPlatform={data.platform} />

      <main className="flex-1">
        {/* Breadcrumb Navigation */}
        <div className="bg-white border-b border-slate-200/60 py-2.5">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <nav className="flex items-center text-xs text-slate-500 font-medium">
              <Link href="/" className="hover:text-emerald-600 flex items-center gap-1">
                <Home className="w-3.5 h-3.5" />
                <span>Home</span>
              </Link>
              <ChevronRight className="w-3.5 h-3.5 mx-1.5 text-slate-400" />
              <span className="capitalize">{data.platformName}</span>
              <ChevronRight className="w-3.5 h-3.5 mx-1.5 text-slate-400" />
              <span className="text-slate-800 font-semibold truncate max-w-xs">{data.h1}</span>
            </nav>
          </div>
        </div>

        {/* Client Interactive Downloader with Programmatic Metadata */}
        <ClientPSEOWrapper
          title={data.h1}
          subheading={data.subheading}
          platform={data.platform}
          platformName={data.platformName}
        />

        {/* Steps */}
        <HowItWorks platformName={data.platformName} />

        {/* Features */}
        <FeatureHighlights platformName={data.platformName} />

        {/* FAQs */}
        <FAQSection platformName={data.platformName} faqs={data.faqs} />

        {/* Cross-linking pSEO cards */}
        <PopularPseoGrid />
      </main>

      <Footer />
    </div>
  );
}
