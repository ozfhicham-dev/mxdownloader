import adapter from '@sveltejs/adapter-node';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
  preprocess: vitePreprocess(),
  onwarn: (warning, handler) => {
    // Ignore a11y accessibility warnings so they don't block production builds
    if (warning.code.startsWith('a11y_') || warning.code.startsWith('a11y-')) return;
    handler(warning);
  },
  kit: {
    adapter: adapter({ out: 'build', precompress: true }),
    alias: { $lib: './src/lib' }
  }
};

export default config;