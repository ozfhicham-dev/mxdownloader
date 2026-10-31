'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Shield,
  Lock,
  User,
  Key,
  Database,
  Globe,
  FileCode,
  LogOut,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  Search,
  RefreshCw,
  Terminal,
  Activity,
  Layers,
} from 'lucide-react';
import { RECOMMENDED_POSTGRES_SCHEMA_SQL } from '@/lib/auth/schema';
import type { AdminAuditLog } from '@/lib/auth/types';

interface AdminStats {
  seo: {
    totalProgrammaticPages: number;
    sitemapChunksCount: number;
    urlsPerChunk: number;
    sitemapIndexUrl: string;
    sampleChunks: string[];
  };
  auth: {
    currentProvider: string;
    isPostgresConnected: boolean;
    activeUser: string;
  };
  system: {
    uptimeSeconds: number;
    nodeVersion: string;
    time: string;
    status: string;
  };
  auditLogs: AdminAuditLog[];
}

export default function SecretAdminPage() {
  const [token, setToken] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      try {
        return sessionStorage.getItem('mx_admin_token');
      } catch {
        return null;
      }
    }
    return null;
  });
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('mxadmin2026');
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [remainingAttempts, setRemainingAttempts] = useState<number | null>(null);

  const [stats, setStats] = useState<AdminStats | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'sitemaps' | 'pseo' | 'database' | 'logs'>('overview');

  const [xmlPreviewChunk, setXmlPreviewChunk] = useState<string | null>(null);
  const [xmlContent, setXmlContent] = useState<string | null>(null);
  const [xmlLoading, setXmlLoading] = useState(false);

  const [pseoSearch, setPseoSearch] = useState('');

  const loadDashboardStats = React.useCallback(async (activeToken: string) => {
    try {
      const res = await fetch('/api/admin/stats', {
        headers: { Authorization: `Bearer ${activeToken}` },
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setStats(data.data);
      }
    } catch (err) {
      console.error('Failed to load stats', err);
    }
  }, []);

  // Fetch stats asynchronously whenever an active session token is present
  useEffect(() => {
    let isCancelled = false;
    if (token) {
      fetch('/api/admin/stats', {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => res.json())
        .then((data) => {
          if (!isCancelled && data.success) {
            setStats(data.data);
          }
        })
        .catch((err) => {
          console.error('Failed to load stats', err);
        });
    }
    return () => {
      isCancelled = true;
    };
  }, [token]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError(null);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        setRemainingAttempts(data.remainingAttempts ?? null);
        throw new Error(data.error || 'Authentication rejected');
      }

      const receivedToken = data.session.token;
      setToken(receivedToken);
      sessionStorage.setItem('mx_admin_token', receivedToken);
      loadDashboardStats(receivedToken);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Login failed';
      setLoginError(msg);
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = async () => {
    if (token) {
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });
    }
    sessionStorage.removeItem('mx_admin_token');
    setToken(null);
    setStats(null);
  };

  const inspectXmlChunk = async (chunkPath: string) => {
    setXmlPreviewChunk(chunkPath);
    setXmlLoading(true);
    try {
      const res = await fetch(chunkPath);
      const text = await res.text();
      setXmlContent(text.substring(0, 1500) + (text.length > 1500 ? '\n... [truncated for display]' : ''));
    } catch (err) {
      setXmlContent('Failed to fetch XML');
    } finally {
      setXmlLoading(false);
    }
  };

  // Sample programmatic URLs for explorer
  const samplePseoItems = [
    { slug: 'facebook-video-downloader', title: 'Facebook Video Downloader 4K', cat: 'Facebook' },
    { slug: 'facebook-reels-downloader', title: 'Facebook Reels Downloader Full HD', cat: 'Facebook' },
    { slug: 'facebook-audio-mp3-downloader', title: 'Facebook to MP3 320kbps Audio', cat: 'Facebook' },
    { slug: 'instagram-reels-downloader', title: 'Instagram Reels & Audio Saver', cat: 'Instagram' },
    { slug: 'instagram-story-downloader', title: 'Instagram Story Downloader', cat: 'Instagram' },
    { slug: 'tiktok-video-downloader-no-watermark', title: 'TikTok Without Watermark MP4', cat: 'TikTok' },
    { slug: 'tiktok-mp3-audio-downloader', title: 'TikTok MP3 High Quality Audio', cat: 'TikTok' },
    { slug: 'youtube-video-downloader-1080p', title: 'YouTube 1080p Video Downloader', cat: 'YouTube' },
    { slug: 'youtube-shorts-downloader', title: 'YouTube Shorts Downloader 60fps', cat: 'YouTube' },
    { slug: 'youtube-mp3-320kbps-converter', title: 'YouTube to MP3 Converter 320kbps', cat: 'YouTube' },
    { slug: 'twitter-video-downloader', title: 'X / Twitter Video Downloader', cat: 'Twitter' },
    { slug: 'threads-video-downloader', title: 'Threads Video Downloader', cat: 'Threads' },
    { slug: 'soundcloud-mp3-music-downloader', title: 'SoundCloud MP3 Music Downloader', cat: 'SoundCloud' },
  ];

  const filteredPseo = samplePseoItems.filter((item) =>
    item.slug.toLowerCase().includes(pseoSearch.toLowerCase()) ||
    item.title.toLowerCase().includes(pseoSearch.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-900 font-sans">
      {/* Admin Top Navigation */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center font-bold text-sm">
              <Shield className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <span className="font-extrabold text-slate-900 tracking-tight text-sm">
                mxdownloader <span className="text-emerald-600 font-semibold">Admin Panel</span>
              </span>
              <span className="hidden sm:inline-block ml-2 text-[11px] font-mono text-slate-400">
                /secretadmin2026here
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="text-xs font-medium text-slate-600 hover:text-emerald-600 flex items-center gap-1 transition-colors"
            >
              <span>Back to Public Site</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>

            {token && (
              <button
                onClick={handleLogout}
                className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Body */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {!token ? (
          /* Sleek Light-Mode Admin Login Form */
          <div className="max-w-md mx-auto my-12 bg-white rounded-2xl border border-slate-200/90 shadow-xl p-6 sm:p-8">
            <div className="text-center mb-6">
              <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl mx-auto flex items-center justify-center mb-3">
                <Lock className="w-6 h-6" />
              </div>
              <h1 className="text-xl font-bold text-slate-900">
                Secret Admin Gateway
              </h1>
              <p className="mt-1 text-xs text-slate-500">
                Authorized access only. Protected with modular authentication & lockout safeguards.
              </p>
            </div>

            {loginError && (
              <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-red-500" />
                <div>
                  <p className="font-semibold">{loginError}</p>
                  {remainingAttempts !== null && remainingAttempts > 0 && (
                    <p className="text-[11px] text-red-600 mt-0.5">
                      {remainingAttempts} attempt(s) remaining before temporary lockout.
                    </p>
                  )}
                </div>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Admin Username
                </label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-500 focus:bg-white transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Secret Admin Password
                </label>
                <div className="relative">
                  <Key className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-500 focus:bg-white transition-colors"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loginLoading}
                className="w-full py-2.5 px-4 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors shadow-sm disabled:opacity-60 cursor-pointer flex items-center justify-center gap-2"
              >
                {loginLoading ? (
                  <span>Authenticating...</span>
                ) : (
                  <>
                    <Lock className="w-3.5 h-3.5" />
                    <span>Enter Admin Console</span>
                  </>
                )}
              </button>
            </form>

            {/* Dev Quick-Help Box */}
            <div className="mt-6 p-3 bg-slate-50 rounded-xl border border-slate-200/80 text-[11px] text-slate-600 space-y-1">
              <div className="font-semibold text-slate-800 flex items-center justify-between">
                <span>Default Dev Credentials</span>
                <span className="font-mono text-[10px] text-emerald-700 bg-emerald-100/70 px-1.5 py-0.5 rounded">
                  Modular Mock Provider
                </span>
              </div>
              <p>User: <code className="font-mono text-slate-900 bg-slate-200 px-1 py-0.5 rounded">admin</code></p>
              <p>Pass: <code className="font-mono text-slate-900 bg-slate-200 px-1 py-0.5 rounded">mxadmin2026</code></p>
              <p className="text-slate-400 pt-1 text-[10px]">
                Ready for PostgreSQL credentials injection via <code className="font-mono">DATABASE_URL</code>.
              </p>
            </div>
          </div>
        ) : (
          /* Authenticated Admin Dashboard */
          <div className="space-y-6">
            {/* Top Stat Ribbon */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-xs">
                <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
                  <span className="font-medium">Total pSEO Pages</span>
                  <Globe className="w-4 h-4 text-emerald-600" />
                </div>
                <div className="text-2xl font-extrabold text-slate-900 tabular-nums">
                  {stats?.seo.totalProgrammaticPages.toLocaleString() || '2,500'}
                </div>
                <div className="mt-1 text-xs text-emerald-600 font-medium">
                  Dynamic URL generation active
                </div>
              </div>

              <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-xs">
                <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
                  <span className="font-medium">Sitemap Chunks</span>
                  <Layers className="w-4 h-4 text-emerald-600" />
                </div>
                <div className="text-2xl font-extrabold text-slate-900 tabular-nums">
                  {stats?.seo.sitemapChunksCount || 10} files
                </div>
                <div className="mt-1 text-xs text-slate-500">
                  {stats?.seo.urlsPerChunk || 250} URLs per chunk for fast crawling
                </div>
              </div>

              <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-xs">
                <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
                  <span className="font-medium">Active Auth Provider</span>
                  <Database className="w-4 h-4 text-blue-600" />
                </div>
                <div className="text-base font-bold text-slate-900 font-mono truncate">
                  {stats?.auth.currentProvider || 'mock-in-memory'}
                </div>
                <div className="mt-1 text-xs text-slate-500">
                  {stats?.auth.isPostgresConnected ? 'PostgreSQL Live' : 'PostgreSQL Adapter Ready'}
                </div>
              </div>

              <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-xs">
                <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
                  <span className="font-medium">System Health</span>
                  <Activity className="w-4 h-4 text-emerald-600" />
                </div>
                <div className="text-2xl font-extrabold text-slate-900 capitalize">
                  {stats?.system.status || 'Healthy'}
                </div>
                <div className="mt-1 text-xs text-slate-500 font-mono">
                  Uptime: {stats?.system.uptimeSeconds || 0}s
                </div>
              </div>
            </div>

            {/* Dashboard Tab Bar */}
            <div className="bg-white rounded-xl border border-slate-200 p-1 flex flex-wrap gap-1">
              {[
                { id: 'overview', label: 'Overview & Sitemaps', icon: Globe },
                { id: 'pseo', label: 'pSEO Directory Explorer', icon: Search },
                { id: 'database', label: 'PostgreSQL Architecture', icon: Database },
                { id: 'logs', label: 'Security & Audit Logs', icon: Terminal },
              ].map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as typeof activeTab)}
                    className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                      activeTab === tab.id
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* TAB 1: Overview & Sitemaps Inspector */}
            {activeTab === 'overview' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h2 className="text-base font-bold text-slate-900">
                        Sitemap Chunks & Crawler Configuration
                      </h2>
                      <p className="text-xs text-slate-500">
                        Generated XML files designed to prevent crawler timeout across 2,500+ pages.
                      </p>
                    </div>
                    <Link
                      href="/sitemap.xml"
                      target="_blank"
                      className="px-3 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg inline-flex items-center gap-1"
                    >
                      <span>Master sitemap.xml</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </Link>
                  </div>

                  <div className="space-y-2">
                    {stats?.seo.sampleChunks.map((chunkPath) => (
                      <div
                        key={chunkPath}
                        className="flex items-center justify-between p-3 rounded-lg border border-slate-200 bg-slate-50/60 hover:bg-slate-50 text-xs transition-colors"
                      >
                        <div className="flex items-center gap-2 font-mono text-slate-800">
                          <FileCode className="w-4 h-4 text-emerald-600" />
                          <span>{chunkPath}</span>
                          <span className="text-slate-400 font-sans font-normal">
                            (250 URLs)
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => inspectXmlChunk(chunkPath)}
                            className="px-2.5 py-1 text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded font-medium cursor-pointer"
                          >
                            Inspect Raw XML
                          </button>
                          <Link
                            href={chunkPath}
                            target="_blank"
                            className="p-1 text-slate-400 hover:text-emerald-600 rounded"
                            title="Open in new tab"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* XML Live Inspector */}
                <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs flex flex-col">
                  <h3 className="text-sm font-bold text-slate-900 mb-1">
                    XML Response Inspector
                  </h3>
                  <p className="text-xs text-slate-500 mb-3">
                    {xmlPreviewChunk ? `Inspecting ${xmlPreviewChunk}` : 'Click "Inspect Raw XML" on any chunk'}
                  </p>

                  <div className="flex-1 bg-slate-900 text-slate-100 p-3 rounded-lg font-mono text-[11px] overflow-auto max-h-96">
                    {xmlLoading ? (
                      <span className="text-emerald-400">Loading XML data...</span>
                    ) : xmlContent ? (
                      <pre className="whitespace-pre-wrap">{xmlContent}</pre>
                    ) : (
                      <span className="text-slate-500">
                        {`<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex ...>\nSelect any chunk to preview live crawler payload.`}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: pSEO Directory Explorer */}
            {activeTab === 'pseo' && (
              <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                  <div>
                    <h2 className="text-base font-bold text-slate-900">
                      pSEO Landing Page Directory
                    </h2>
                    <p className="text-xs text-slate-500">
                      Explore and test programmatic SEO slugs generated by the matrix algorithm.
                    </p>
                  </div>

                  <div className="relative w-full sm:w-64">
                    <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Filter slugs..."
                      value={pseoSearch}
                      onChange={(e) => setPseoSearch(e.target.value)}
                      className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {filteredPseo.map((page) => (
                    <div
                      key={page.slug}
                      className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs flex flex-col justify-between"
                    >
                      <div>
                        <span className="text-[10px] font-semibold text-emerald-700 uppercase">
                          {page.cat}
                        </span>
                        <div className="font-bold text-slate-900 mt-0.5">{page.title}</div>
                        <div className="font-mono text-[11px] text-slate-400 truncate mt-1">
                          /d/{page.slug}
                        </div>
                      </div>

                      <div className="mt-3 pt-2 border-t border-slate-200/60 flex items-center justify-between">
                        <Link
                          href={`/d/${page.slug}`}
                          target="_blank"
                          className="text-emerald-600 hover:text-emerald-700 font-semibold inline-flex items-center gap-1"
                        >
                          <span>Preview Page</span>
                          <ExternalLink className="w-3 h-3" />
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 3: PostgreSQL Architecture & Migration Schema */}
            {activeTab === 'database' && (
              <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-6">
                <div>
                  <h2 className="text-base font-bold text-slate-900">
                    Modular PostgreSQL & Auth Architecture
                  </h2>
                  <p className="text-xs text-slate-600 mt-1">
                    The auth system follows a decoupled Adapter pattern (<code className="font-mono text-emerald-700">AuthProviderInterface</code>).
                    Switching between in-memory mock and PostgreSQL requires zero refactoring of application business logic.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-emerald-50/60 rounded-xl border border-emerald-200">
                    <div className="flex items-center gap-2 text-emerald-800 font-bold text-xs mb-1">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Current Mode: Modular Dev Provider</span>
                    </div>
                    <p className="text-xs text-emerald-900 leading-relaxed">
                      Active: <code className="font-mono">MockAdminAuthProvider</code>.
                      Features rate-limiting, 5-attempt brute-force lockouts, signed HMAC-SHA256 tokens, and in-memory audit logs.
                    </p>
                  </div>

                  <div className="p-4 bg-blue-50/60 rounded-xl border border-blue-200">
                    <div className="flex items-center gap-2 text-blue-800 font-bold text-xs mb-1">
                      <Database className="w-4 h-4 text-blue-600" />
                      <span>PostgreSQL Plug-in Ready</span>
                    </div>
                    <p className="text-xs text-blue-900 leading-relaxed">
                      Class: <code className="font-mono">PostgresAuthAdapter</code>.
                      When PostgreSQL or Cloud SQL is provisioned, provide <code className="font-mono">DATABASE_URL</code> to automatically bind persistence.
                    </p>
                  </div>
                </div>

                {/* Pre-Generated SQL Schema */}
                <div>
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">
                    Ready-to-Run PostgreSQL Migration Schema
                  </h3>
                  <div className="bg-slate-900 text-slate-100 p-4 rounded-xl font-mono text-xs overflow-x-auto">
                    <pre>{RECOMMENDED_POSTGRES_SCHEMA_SQL}</pre>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 4: Security & Audit Logs */}
            {activeTab === 'logs' && (
              <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-base font-bold text-slate-900">
                      Security Audit Trail
                    </h2>
                    <p className="text-xs text-slate-500">
                      Logged authentication actions, IP addresses, and lockout triggers.
                    </p>
                  </div>

                  <button
                    onClick={() => stats && loadDashboardStats(token)}
                    className="p-1.5 text-slate-500 hover:text-slate-900 rounded-lg hover:bg-slate-100"
                    title="Refresh logs"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-400 uppercase tracking-wider font-semibold">
                        <th className="py-2.5 pl-2">Timestamp</th>
                        <th className="py-2.5 px-3">Action</th>
                        <th className="py-2.5 px-3">User</th>
                        <th className="py-2.5 px-3">IP Address</th>
                        <th className="py-2.5 pr-2">Details</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {stats?.auditLogs && stats.auditLogs.length > 0 ? (
                        stats.auditLogs.map((log) => (
                          <tr key={log.id} className="hover:bg-slate-50">
                            <td className="py-2.5 pl-2 font-mono text-slate-500">
                              {new Date(log.timestamp).toLocaleTimeString()}
                            </td>
                            <td className="py-2.5 px-3 font-semibold">
                              <span
                                className={`px-2 py-0.5 rounded text-[11px] font-mono ${
                                  log.success
                                    ? 'bg-emerald-50 text-emerald-700'
                                    : 'bg-red-50 text-red-700'
                                }`}
                              >
                                {log.action}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-slate-700 font-medium">
                              {log.username}
                            </td>
                            <td className="py-2.5 px-3 text-slate-500 font-mono">
                              {log.ipAddress || '127.0.0.1'}
                            </td>
                            <td className="py-2.5 pr-2 text-slate-600">
                              {log.details || '—'}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={5} className="py-6 text-center text-slate-400">
                            No security incidents or events recorded yet.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
