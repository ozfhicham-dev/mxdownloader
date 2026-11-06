<script lang="ts">
  import { Download, Loader2, ArrowDownToLine, Play } from 'lucide-svelte';
  import { I18N, currentLocale } from '$lib/i18n/public';

  $: t = I18N[$currentLocale];

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
      if (data.success) {
        resolved = data.media;
      }
    } finally {
      loading = false;
    }
  }
</script>

<svelte:head>
  <title>{t.title} – mxdownloader</title>
</svelte:head>

<section class="max-w-3xl mx-auto px-4 py-16 text-center">
  <h1 class="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight leading-tight">
    {t.title}
  </h1>
  <p class="mt-3 text-sm sm:text-base text-slate-600 max-w-xl mx-auto">
    {t.subtitle}
  </p>

  <form on:submit|preventDefault={handleDownload} class="mt-8 flex flex-col sm:flex-row gap-2">
    <input
      type="url"
      bind:value={inputUrl}
      placeholder={t.placeholder}
      required
      class="flex-1 px-4 py-3 bg-white border-2 border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500 text-sm shadow-xs"
    />
    <button
      type="submit"
      disabled={loading}
      class="px-8 py-3 bg-emerald-600 hover:bg-emerald-700 font-bold text-white rounded-xl shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-60"
    >
      {#if loading}
        <Loader2 class="w-4 h-4 animate-spin" />
        <span>{t.processing}</span>
      {:else}
        <Download class="w-4 h-4" />
        <span>{t.downloadBtn}</span>
      {/if}
    </button>
  </form>

  {#if resolved}
    <div class="mt-8 p-5 bg-white border border-emerald-500/30 rounded-2xl shadow-lg text-start animate-in fade-in">
      <div class="flex items-center gap-3 pb-3 border-b border-slate-100">
        <div class="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
          <Play class="w-5 h-5 fill-current" />
        </div>
        <div>
          <span class="text-xs font-bold text-emerald-600 uppercase">{resolved.platformName}</span>
          <h3 class="text-sm font-bold text-slate-900">{resolved.title}</h3>
        </div>
      </div>

      <div class="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-2.5">
        <a
          href="/api/download/file?format=mp4&quality=1080p&title={encodeURIComponent(resolved.title)}"
          download
          class="p-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl flex items-center justify-between text-xs font-bold shadow-sm transition-all"
        >
          <div>
            <div>{t.quality1080}</div>
            <div class="text-[11px] text-emerald-100 font-normal">MP4 · 3.2 MB</div>
          </div>
          <ArrowDownToLine class="w-4 h-4" />
        </a>

        <a
          href="/api/download/file?format=mp4&quality=720p&title={encodeURIComponent(resolved.title)}"
          download
          class="p-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-800 rounded-xl flex items-center justify-between text-xs font-bold transition-all"
        >
          <div>
            <div>{t.quality720}</div>
            <div class="text-[11px] text-slate-500 font-normal">MP4 · 1.8 MB</div>
          </div>
          <ArrowDownToLine class="w-4 h-4 text-emerald-600" />
        </a>

        <a
          href="/api/download/file?format=mp3&quality=320kbps&title={encodeURIComponent(resolved.title)}"
          download
          class="p-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-800 rounded-xl flex items-center justify-between text-xs font-bold transition-all"
        >
          <div>
            <div>{t.qualityMp3}</div>
            <div class="text-[11px] text-slate-500 font-normal">MP3 · 1.2 MB</div>
          </div>
          <ArrowDownToLine class="w-4 h-4 text-emerald-600" />
        </a>
      </div>
    </div>
  {/if}
</section>