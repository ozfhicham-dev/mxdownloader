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