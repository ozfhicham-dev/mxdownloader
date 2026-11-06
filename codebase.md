# .gitignore

```
node_modules/
.next/
coverage/
.DS_Store
*.log
.env*
!.env.example

```

# package.json

```json
{
  "name": "mxdownloader",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite dev",
    "build": "vite build",
    "preview": "vite preview",
    "check": "svelte-kit sync && svelte-check --tsconfig ./tsconfig.json"
  },
  "dependencies": {
    "@sveltejs/adapter-node": "^5.2.11",
    "bcryptjs": "^3.0.2",
    "clsx": "^2.1.1",
    "lucide-svelte": "^0.475.0",
    "pg": "^8.13.3",
    "tailwind-merge": "^3.0.2"
  },
  "devDependencies": {
    "@sveltejs/kit": "^2.17.2",
    "@sveltejs/vite-plugin-svelte": "^5.0.3",
    "@types/bcryptjs": "^2.4.6",
    "@types/node": "^22.13.4",
    "@types/pg": "^8.11.11",
    "autoprefixer": "^10.4.20",
    "postcss": "^8.5.2",
    "svelte": "^5.19.9",
    "svelte-check": "^4.1.4",
    "tailwindcss": "^3.4.17",
    "typescript": "^5.7.3",
    "vite": "^6.1.0"
  }
}
```

# postcss.config.js

```js
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {}
  }
};
```

# README.md

```md
<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/382024fb-091f-4ed9-be44-15927c699bdf

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

```

# src\app.css

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

# src\app.d.ts

```ts
declare global {
  namespace App {
    interface Locals {
      adminUser?: {
        id: string;
        username: string;
        role: string;
      } | null;
    }
  }
}
export {};
```

# src\app.html

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5" />
    <meta name="theme-color" content="#10b981" />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=Amiri:ital,wght@0,400;0,700;1,400&family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
    %sveltekit.head%
  </head>
  <body class="bg-slate-50 text-slate-900 antialiased selection:bg-emerald-500 selection:text-white">
    <div style="display: contents">%sveltekit.body%</div>
  </body>
</html>
```

# src\hooks.server.ts

```ts
import type { Handle } from '@sveltejs/kit';
import { verifyAuthToken } from '$lib/auth/token';

export const handle: Handle = async ({ event, resolve }) => {
  const sessionToken = event.cookies.get('mx_admin_session');
  event.locals.adminUser = sessionToken ? verifyAuthToken(sessionToken) : null;

  if (event.url.pathname.startsWith('/api/admin') && !event.locals.adminUser) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  const response = await resolve(event);
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  return response;
};
```

# src\lib\auth\index.ts

```ts
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { query } from '$lib/db';
import { createAuthToken } from './token';

export async function loginAdmin(username: string, passwordPlain: string, ip: string) {
  const users = await query('SELECT * FROM admin_users WHERE username = $1 LIMIT 1', [username]);

  if (users.length === 0 && username === (process.env.ADMIN_DEFAULT_USER || 'admin')) {
    if (passwordPlain === (process.env.ADMIN_DEFAULT_PASSWORD || 'mxadmin2026')) {
      const hash = await bcrypt.hash(passwordPlain, 10);
      const id = 'usr_' + crypto.randomBytes(4).toString('hex');
      await query('INSERT INTO admin_users (id, username, password_hash) VALUES ($1, $2, $3)', [id, username, hash]);
      const token = createAuthToken({ id, username, role: 'superadmin' });
      return { success: true, token };
    }
  }

  const user = users[0];
  if (!user) return { success: false, error: 'Invalid credentials' };

  const isMatch = await bcrypt.compare(passwordPlain, user.password_hash);
  if (!isMatch) return { success: false, error: 'Invalid credentials' };

  const token = createAuthToken({ id: user.id, username: user.username, role: user.role });
  return { success: true, token };
}

export async function recordAudit(action: string, username: string, ip: string, success: boolean, details: string) {
  const id = 'log_' + crypto.randomBytes(6).toString('hex');
  await query('INSERT INTO admin_audit_logs (id, action, username, ip_address, success, details) VALUES ($1, $2, $3, $4, $5, $6)', [id, action, username, ip, success, details]);
}
```

# src\lib\auth\token.ts

```ts
import crypto from 'crypto';
const SECRET = process.env.ADMIN_JWT_SECRET || 'mxdownloader_secret_key_2026';

export function createAuthToken(user: { id: string; username: string; role: string }): string {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const payload = Buffer.from(JSON.stringify({ ...user, exp: Date.now() + 86400000 })).toString('base64url');
  const signature = crypto.createHmac('sha256', SECRET).update(`${header}.${payload}`).digest('base64url');
  return `${header}.${payload}.${signature}`;
}

export function verifyAuthToken(token: string) {
  try {
    const [h, p, s] = token.split('.');
    const expected = crypto.createHmac('sha256', SECRET).update(`${h}.${p}`).digest('base64url');
    if (s !== expected) return null;
    const data = JSON.parse(Buffer.from(p, 'base64url').toString('utf8'));
    return Date.now() > data.exp ? null : data;
  } catch {
    return null;
  }
}
```

# src\lib\db\index.ts

```ts
import pg from 'pg';
const { Pool } = pg;

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/mxdownloader',
  max: 10
});

export async function query<T = any>(text: string, params?: any[]): Promise<T[]> {
  try {
    const res = await pool.query(text, params);
    return res.rows;
  } catch (e) {
    return [];
  }
}
```

# src\lib\db\schema.sql

```sql
CREATE TABLE IF NOT EXISTS admin_users (
  id VARCHAR(64) PRIMARY KEY,
  username VARCHAR(64) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(32) NOT NULL DEFAULT 'superadmin',
  failed_attempts INT DEFAULT 0,
  locked_until TIMESTAMP WITH TIME ZONE NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_login_at TIMESTAMP WITH TIME ZONE NULL
);

CREATE TABLE IF NOT EXISTS admin_audit_logs (
  id VARCHAR(64) PRIMARY KEY,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  action VARCHAR(64) NOT NULL,
  username VARCHAR(64) NOT NULL,
  ip_address VARCHAR(45),
  success BOOLEAN NOT NULL,
  details TEXT
);

CREATE TABLE IF NOT EXISTS pseo_pages (
  slug VARCHAR(255) PRIMARY KEY,
  platform VARCHAR(64) NOT NULL,
  title VARCHAR(255) NOT NULL,
  h1 VARCHAR(255) NOT NULL,
  subheading TEXT NOT NULL,
  description TEXT NOT NULL,
  media_type VARCHAR(32) NOT NULL DEFAULT 'both',
  format VARCHAR(16) NOT NULL DEFAULT 'MP4',
  quality VARCHAR(64) NOT NULL DEFAULT '1080p Full HD',
  keywords TEXT[] DEFAULT '{}',
  faqs JSONB DEFAULT '[]',
  is_indexed BOOLEAN NOT NULL DEFAULT true,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

# src\lib\downloader\parsers.ts

```ts
export function parseLink(rawUrl: string) {
  const url = rawUrl.trim();
  const lower = url.toLowerCase();

  let platformName = 'Facebook';
  let title = 'Facebook HD Video';
  let isVertical = false;

  if (lower.includes('tiktok.com')) {
    platformName = 'TikTok';
    title = 'TikTok Video (No Watermark)';
    isVertical = true;
  } else if (lower.includes('instagram.com')) {
    platformName = 'Instagram';
    title = 'Instagram Reel & Audio';
    isVertical = true;
  } else if (lower.includes('youtube.com') || lower.includes('youtu.be')) {
    platformName = 'YouTube';
    title = 'YouTube 1080p Stream';
  }

  return {
    url,
    platformName,
    title,
    author: '@featured_creator',
    duration: isVertical ? '00:38' : '03:15',
    thumbnail: isVertical ? 'https://picsum.photos/seed/vert/600/1066' : 'https://picsum.photos/seed/horiz/800/450',
    downloads: [
      { id: '1080', label: '1080p Full HD', format: 'MP4', size: '28.4 MB', downloadUrl: `/api/download/file?format=mp4&quality=1080p&title=${encodeURIComponent(title)}`, recommended: true },
      { id: '720', label: '720p HD', format: 'MP4', size: '14.2 MB', downloadUrl: `/api/download/file?format=mp4&quality=720p&title=${encodeURIComponent(title)}` },
      { id: 'mp3', label: 'Audio MP3 (320kbps)', format: 'MP3', size: '6.8 MB', downloadUrl: `/api/download/file?format=mp3&quality=320kbps&title=${encodeURIComponent(title)}`, recommended: true }
    ]
  };
}
```

# src\lib\i18n\admin.ts

```ts
export type AdminLocale = 'en' | 'es' | 'fr' | 'pt' | 'ar';

export const ADMIN_I18N = {
  en: {
    dir: 'ltr',
    font: 'font-sans',
    portalTitle: 'Secret Admin Gateway',
    portalSubtitle: 'Authorized administrative access only. Protected with bcrypt.',
    usernameLabel: 'Admin Username',
    passwordLabel: 'Admin Password',
    loginButton: 'Enter Admin Console',
    logoutButton: 'Sign Out',
    tabOverview: 'Overview & Sitemaps',
    tabPseo: 'pSEO Directory Editor',
    tabLogs: 'Security Audit Logs',
    totalPseoPages: 'Total Programmatic Pages',
    sitemapChunks: 'Sitemap Chunks',
    backToSite: 'Back to Site'
  },
  es: {
    dir: 'ltr',
    font: 'font-sans',
    portalTitle: 'Portal Secreto de Administración',
    portalSubtitle: 'Acceso autorizado únicamente. Protegido con bcrypt.',
    usernameLabel: 'Usuario Administrador',
    passwordLabel: 'Contraseña',
    loginButton: 'Acceder al Panel',
    logoutButton: 'Cerrar Sesión',
    tabOverview: 'Visión General y Sitemaps',
    tabPseo: 'Editor de Páginas pSEO',
    tabLogs: 'Registro de Seguridad',
    totalPseoPages: 'Total de Páginas pSEO',
    sitemapChunks: 'Fragmentos de Sitemap',
    backToSite: 'Volver al Sitio'
  },
  fr: {
    dir: 'ltr',
    font: 'font-sans',
    portalTitle: "Passerelle d'Administration Secrète",
    portalSubtitle: 'Accès réservé. Protection active par hachage bcrypt.',
    usernameLabel: 'Nom d’utilisateur',
    passwordLabel: 'Mot de passe',
    loginButton: 'Ouvrir la Console',
    logoutButton: 'Déconnexion',
    tabOverview: 'Aperçu & Sitemaps',
    tabPseo: 'Éditeur de Pages pSEO',
    tabLogs: 'Journal de Sécurité',
    totalPseoPages: 'Pages Programmatiques',
    sitemapChunks: 'Lots de Sitemaps',
    backToSite: 'Retour au Site'
  },
  pt: {
    dir: 'ltr',
    font: 'font-sans',
    portalTitle: 'Portal Secreto de Administração',
    portalSubtitle: 'Acesso restrito. Protegido com bcrypt.',
    usernameLabel: 'Nome de Usuário',
    passwordLabel: 'Senha',
    loginButton: 'Acessar Painel',
    logoutButton: 'Encerrar Sessão',
    tabOverview: 'Visão Geral e Sitemaps',
    tabPseo: 'Editor de Páginas pSEO',
    tabLogs: 'Logs de Auditoria',
    totalPseoPages: 'Páginas Programáticas',
    sitemapChunks: 'Arquivos de Sitemap',
    backToSite: 'Volver ao Site'
  },
  ar: {
    dir: 'rtl',
    font: 'font-amiri',
    portalTitle: 'بوابة الإدارة السرية',
    portalSubtitle: 'وصول مصرح به فقط. محمي بتقنية تشفير bcrypt وأنظمة الحماية.',
    usernameLabel: 'اسم مسؤول النظام',
    passwordLabel: 'كلمة المرور',
    loginButton: 'دخول لوحة التحكم',
    logoutButton: 'تسجيل الخروج',
    tabOverview: 'نظرة عامة والخرائط (Sitemaps)',
    tabPseo: 'محرر صفحات السيو البرمجي (pSEO)',
    tabLogs: 'سجلات الأمان والتدقيق',
    totalPseoPages: 'إجمالي الصفحات البرمجية',
    sitemapChunks: 'أجزاء خريطة الموقع',
    backToSite: 'العودة للموقع الرئيسي'
  }
};
```

# src\lib\seo\pseo.ts

```ts
import { query } from '$lib/db';

export const TOTAL_PSEO_PAGES = 2500;
export const URLS_PER_SITEMAP = 250;
export const TOTAL_SITEMAP_CHUNKS = Math.ceil(TOTAL_PSEO_PAGES / URLS_PER_SITEMAP);

export async function getPageMetadata(slug: string) {
  const rows = await query('SELECT * FROM pseo_pages WHERE slug = $1 LIMIT 1', [slug]);
  if (rows.length > 0) return rows[0];

  const platform = slug.includes('tiktok') ? 'TikTok' : slug.includes('instagram') ? 'Instagram' : 'Facebook';
  return {
    slug,
    platformName: platform,
    title: `Download ${platform} Video (1080p Full HD) - mxdownloader`,
    h1: `Download ${platform} Video in High Quality`,
    subheading: `The fastest online ${platform} video downloader. 100% free and without watermark.`,
    description: `Save ${platform} videos directly in 1080p MP4 or 320kbps MP3 audio.`,
    keywords: [`${platform.toLowerCase()} downloader`, 'free video downloader', 'download mp3']
  };
}

export function getAllPseoSlugs() {
  const platforms = ['facebook', 'tiktok', 'instagram', 'youtube'];
  const types = ['video-downloader', 'reels-downloader', 'mp3-downloader'];
  const qualities = ['1080p', '4k', 'hd', '320kbps'];

  const list = [];
  for (const p of platforms) {
    for (const t of types) {
      for (const q of qualities) {
        list.push(`${p}-${t}-${q}`);
      }
    }
  }
  return list;
}
```

# src\lib\seo\sitemap.ts

```ts
import { getAllPseoSlugs, TOTAL_SITEMAP_CHUNKS } from './pseo';
const BASE = process.env.PUBLIC_APP_URL || 'https://mxdownloader.com';

export function buildSitemapIndexXML(): string {
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
  for (let i = 1; i <= TOTAL_SITEMAP_CHUNKS; i++) {
    xml += `  <sitemap><loc>${BASE}/sitemap_${i}.xml</loc></sitemap>\n`;
  }
  return xml + '</sitemapindex>';
}

export function buildSitemapChunkXML(chunk: number): string {
  const slugs = getAllPseoSlugs();
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
  for (const s of slugs) {
    xml += `  <url><loc>${BASE}/d/${s}</loc><priority>0.8</priority></url>\n`;
  }
  return xml + '</urlset>';
}
```

# src\routes\[sitemapChunk]\+server.ts

```ts
import { buildSitemapChunkXML } from '$lib/seo/sitemap';
export const GET = () => new Response(buildSitemapChunkXML(1), { headers: { 'Content-Type': 'application/xml' } });
```

# src\routes\+layout.svelte

```svelte
<script lang="ts">
  import '../app.css';
  import { Download, Shield } from 'lucide-svelte';
</script>

<div class="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900">
  <header class="bg-white border-b border-slate-200">
    <div class="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
      <a href="/" class="flex items-center gap-2 font-black text-xl text-slate-900">
        <div class="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center">
          <Download class="w-5 h-5" />
        </div>
        <span>mx<span class="text-emerald-600">downloader</span></span>
      </a>
      <a href="/sitemap.xml" class="text-xs text-slate-500 hover:text-emerald-600">Sitemap XML</a>
    </div>
  </header>
  <main class="flex-1"><slot /></main>
  <footer class="bg-white border-t border-slate-200 text-xs text-slate-500 py-6 text-center">
    © 2026 mxdownloader.com · All rights reserved.
  </footer>
</div>
```

# src\routes\+page.svelte

```svelte
<script lang="ts">
  import { Download, Loader2, ArrowDownToLine } from 'lucide-svelte';

  let inputUrl = '';
  let loading = false;
  let resolved: any = null;

  async function handleDownload() {
    if (!inputUrl) return;
    loading = true;
    try {
      const res = await fetch('/api/download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: inputUrl })
      });
      const data = await res.json();
      if (data.success) resolved = data.media;
    } finally {
      loading = false;
    }
  }
</script>

<svelte:head>
  <title>mxdownloader – Universal Video & MP3 Audio Downloader</title>
</svelte:head>

<section class="max-w-3xl mx-auto px-4 py-16 text-center">
  <h1 class="text-4xl sm:text-5xl font-black text-slate-900">Download Video & MP3 Audio in Full HD</h1>
  <p class="mt-3 text-slate-600">Fast, free online downloader for Facebook, TikTok, Instagram & YouTube.</p>

  <form on:submit|preventDefault={handleDownload} class="mt-8 flex flex-col sm:flex-row gap-2">
    <input type="url" bind:value={inputUrl} placeholder="Paste video link here..." required class="flex-1 px-4 py-3 bg-white border-2 border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500 text-sm" />
    <button type="submit" disabled={loading} class="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 font-bold text-white rounded-xl shadow-md flex items-center justify-center gap-2 cursor-pointer">
      {#if loading}<Loader2 class="w-4 h-4 animate-spin" />{:else}<Download class="w-4 h-4" />{/if}
      <span>Download</span>
    </button>
  </form>

  {#if resolved}
    <div class="mt-8 p-4 bg-white border border-slate-200 rounded-2xl shadow-sm text-left">
      <h3 class="font-bold text-slate-900 text-sm">{resolved.title}</h3>
      <div class="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-2">
        {#each resolved.downloads as opt}
          <a href={opt.downloadUrl} class="p-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl flex items-center justify-between text-xs font-bold text-slate-800">
            <div><div>{opt.label}</div><div class="text-[10px] text-slate-400 font-normal">{opt.size}</div></div>
            <ArrowDownToLine class="w-4 h-4 text-emerald-600" />
          </a>
        {/each}
      </div>
    </div>
  {/if}
</section>
```

# src\routes\api\download\+server.ts

```ts
import { json } from '@sveltejs/kit';
import { parseLink } from '$lib/downloader/parsers';

export const POST = async ({ request }) => {
  const { url } = await request.json();
  return json({ success: true, media: parseLink(url || '') });
};
```

# src\routes\api\download\file\+server.ts

```ts
export const GET = async ({ url }) => {
  const format = url.searchParams.get('format') || 'mp4';
  const buffer = Buffer.from([0x00, 0x00, 0x00, 0x20, 0x66, 0x74, 0x79, 0x70]);
  return new Response(buffer, {
    headers: {
      'Content-Type': format === 'mp3' ? 'audio/mpeg' : 'video/mp4',
      'Content-Disposition': `attachment; filename="download.${format}"`
    }
  });
};
```

# src\routes\d\[slug]\+page.server.ts

```ts
import { getPageMetadata } from '$lib/seo/pseo';
export const load = async ({ params }) => {
  return { meta: await getPageMetadata(params.slug) };
};
```

# src\routes\d\[slug]\+page.svelte

```svelte
<script lang="ts">
  export let data: any;
  $: meta = data.meta;
</script>

<svelte:head>
  <title>{meta.title}</title>
  <meta name="description" content={meta.description} />
</svelte:head>

<div class="max-w-3xl mx-auto px-4 py-16 text-center">
  <span class="text-xs font-bold text-emerald-600 uppercase">{meta.platformName} Downloader</span>
  <h1 class="text-3xl sm:text-4xl font-extrabold text-slate-900 mt-2">{meta.h1}</h1>
  <p class="mt-3 text-slate-600">{meta.subheading}</p>
  <div class="mt-8"><a href="/" class="px-6 py-3 bg-emerald-600 text-white font-bold rounded-xl">Go to Downloader</a></div>
</div>
```

# src\routes\robots.txt\+server.ts

```ts
export const GET = () => new Response('User-agent: *\nAllow: /\nSitemap: https://mxdownloader.com/sitemap.xml', { headers: { 'Content-Type': 'text/plain' } });
```

# src\routes\secretadmin2026here\+page.server.ts

```ts
import { fail, redirect } from '@sveltejs/kit';
import { loginAdmin } from '$lib/auth';

export const load = async ({ locals, cookies }) => {
  return {
    authenticated: !!locals.adminUser,
    currentLocale: cookies.get('mx_admin_locale') || 'en'
  };
};

export const actions = {
  login: async ({ request, cookies, getClientAddress }) => {
    const data = await request.formData();
    const res = await loginAdmin(data.get('username') as string, data.get('password') as string, getClientAddress());
    if (!res.success) return fail(400, { error: res.error });
    cookies.set('mx_admin_session', res.token!, { path: '/', httpOnly: true });
    return { success: true };
  },
  logout: async ({ cookies }) => {
    cookies.delete('mx_admin_session', { path: '/' });
    throw redirect(303, '/secretadmin2026here');
  },
  setLocale: async ({ request, cookies }) => {
    const data = await request.formData();
    cookies.set('mx_admin_locale', data.get('locale') as string, { path: '/' });
    return { success: true };
  }
};
```

# src\routes\secretadmin2026here\+page.svelte

```svelte
<script lang="ts">
  import { Shield, Lock } from 'lucide-svelte';
  import { ADMIN_I18N, type AdminLocale } from '$lib/i18n/admin';

  export let data: any;
  export let form: any;
  let selectedLocale: AdminLocale = data.currentLocale || 'en';
  $: t = ADMIN_I18N[selectedLocale] || ADMIN_I18N.en;
</script>

<div dir={t.dir} class="min-h-screen bg-slate-100 {t.font} p-6">
  <div class="max-w-xl mx-auto bg-white p-6 rounded-2xl border border-slate-200 shadow-md">
    <div class="flex items-center justify-between pb-4 mb-4 border-b">
      <div class="flex items-center gap-2 font-bold text-sm">
        <Shield class="w-4 h-4 text-emerald-600" />
        <span>mxdownloader Admin</span>
      </div>
      <form method="POST" action="?/setLocale">
        <select name="locale" bind:value={selectedLocale} on:change={(e) => e.currentTarget.form?.requestSubmit()} class="text-xs border p-1 rounded">
          <option value="en">English (EN)</option>
          <option value="es">Español (ES)</option>
          <option value="fr">Français (FR)</option>
          <option value="pt">Português (PT)</option>
          <option value="ar">العربية (AR - Amiri)</option>
        </select>
      </form>
    </div>

    {#if !data.authenticated}
      <h2 class="text-base font-bold text-slate-900">{t.portalTitle}</h2>
      <p class="text-xs text-slate-500 mb-4">{t.portalSubtitle}</p>

      {#if form?.error}
        <div class="p-2 mb-3 bg-red-50 text-red-700 text-xs rounded">{form.error}</div>
      {/if}

      <form method="POST" action="?/login" class="space-y-3">
        <div>
          <label class="block text-xs font-semibold mb-1">{t.usernameLabel}</label>
          <input type="text" name="username" required class="w-full p-2 border rounded text-xs" />
        </div>
        <div>
          <label class="block text-xs font-semibold mb-1">{t.passwordLabel}</label>
          <input type="password" name="password" required class="w-full p-2 border rounded text-xs" />
        </div>
        <button type="submit" class="w-full py-2 bg-emerald-600 text-white font-bold text-xs rounded cursor-pointer">{t.loginButton}</button>
      </form>
    {:else}
      <div class="text-center py-6">
        <div class="text-emerald-600 font-bold text-sm mb-2">Authenticated as Superadmin</div>
        <form method="POST" action="?/logout">
          <button type="submit" class="px-4 py-1.5 bg-red-50 text-red-600 text-xs font-bold rounded cursor-pointer">{t.logoutButton}</button>
        </form>
      </div>
    {/if}
  </div>
</div>
```

# src\routes\sitemap.xml\+server.ts

```ts
import { buildSitemapIndexXML } from '$lib/seo/sitemap';
export const GET = () => new Response(buildSitemapIndexXML(), { headers: { 'Content-Type': 'application/xml' } });
```

# svelte.config.js

```js
import adapter from '@sveltejs/adapter-node';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
  preprocess: vitePreprocess(),
  kit: {
    adapter: adapter({ out: 'build', precompress: true }),
    alias: { $lib: './src/lib' }
  }
};
export default config;
```

# tailwind.config.js

```js
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{html,js,svelte,ts}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        amiri: ['Amiri', 'serif']
      }
    }
  },
  plugins: []
};
```

# tsconfig.json

```json
{
  "extends": "./.svelte-kit/tsconfig.json",
  "compilerOptions": {
    "allowJs": true,
    "checkJs": true,
    "esModuleInterop": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "skipLibCheck": true,
    "sourceMap": true,
    "strict": true,
    "moduleResolution": "bundler"
  }
}
```

# vite.config.ts

```ts
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [sveltekit()],
  server: { port: 3000 }
});
```

