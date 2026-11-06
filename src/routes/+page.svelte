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
    <form method="POST" action="?/login" class="space-y-3">
        <div>
          <label for="admin-username" class="block text-xs font-semibold mb-1">{t.usernameLabel}</label>
          <input id="admin-username" type="text" name="username" required class="w-full p-2 border rounded text-xs" />
        </div>
        <div>
          <label for="admin-password" class="block text-xs font-semibold mb-1">{t.passwordLabel}</label>
          <input id="admin-password" type="password" name="password" required class="w-full p-2 border rounded text-xs" />
        </div>
        <button type="submit" class="w-full py-2 bg-emerald-600 text-white font-bold text-xs rounded cursor-pointer">{t.loginButton}</button>
      </form>
          <a href={opt.downloadUrl} class="p-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl flex items-center justify-between text-xs font-bold text-slate-800">
            <div><div>{opt.label}</div><div class="text-[10px] text-slate-400 font-normal">{opt.size}</div></div>
            <ArrowDownToLine class="w-4 h-4 text-emerald-600" />
          </a>
        {/each}
      </div>
    </div>
  {/if}
</section>