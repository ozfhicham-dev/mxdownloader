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