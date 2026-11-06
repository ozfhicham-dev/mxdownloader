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