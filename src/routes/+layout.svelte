<script lang="ts">
  import '../app.css';
  import { Download, Globe } from 'lucide-svelte';
  import { I18N, currentLocale } from '$lib/i18n/public';
  $: t = I18N[$currentLocale];
</script>

<div dir={t.dir} class="min-h-screen bg-slate-50 flex flex-col {t.font} text-slate-900">
  <header class="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-xs">
    <div class="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
      <a href="/" class="flex items-center gap-2 font-black text-xl text-slate-900 tracking-tight">
        <div class="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center">
          <Download class="w-5 h-5" />
        </div>
        <span>mx<span class="text-emerald-600">downloader</span></span>
      </a>

      <div class="flex items-center gap-4">
        <div class="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200/80 px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold">
          <Globe class="w-3.5 h-3.5 text-slate-500" />
          <select bind:value={$currentLocale} class="bg-transparent text-slate-700 focus:outline-none cursor-pointer">
            <option value="en">English (EN)</option>
            <option value="ar">العربية (AR - Amiri)</option>
            <option value="es">Español (ES)</option>
            <option value="fr">Français (FR)</option>
            <option value="pt">Português (PT)</option>
          </select>
        </div>

        <a href="/sitemap.xml" target="_blank" class="text-xs font-medium text-slate-500 hover:text-emerald-600">
          {t.sitemapLink}
        </a>
      </div>
    </div>
  </header>

  <main class="flex-1"><slot /></main>

  <footer class="bg-white border-t border-slate-200 text-xs text-slate-500 py-6 text-center">
    © 2026 mxdownloader.com · {t.allRights}
  </footer>
</div>
