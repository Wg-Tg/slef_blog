// @ts-check
import { defineConfig } from 'astro/config';
import vue from '@astrojs/vue';
import unocss from '@unocss/astro';

import cloudflare from '@astrojs/cloudflare';

// https://astro.build/config
export default defineConfig({
  integrations: [vue(), unocss()],
  output: 'static',

  build: {
    assets: 'assets',
  },

  adapter: cloudflare(),
});