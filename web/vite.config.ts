import { readFileSync } from 'node:fs';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// The app's name, version and company come from the Expo app.json, so a rename there reaches every screen.
const expo = JSON.parse(readFileSync(new URL('../app.json', import.meta.url), 'utf8')).expo;
const APP = { name: String(expo.name), version: String(expo.version), company: String(expo.extra?.company ?? '') };

export default defineConfig({
  base: './',
  plugins: [react(), { name: 'app-name', transformIndexHtml: (html: string) => html.replace('%APP_NAME%', APP.name) }],
  define: { __APP__: JSON.stringify(APP) },
  build: { target: 'es2020', sourcemap: false, chunkSizeWarningLimit: 1800, assetsInlineLimit: 0 },
  esbuild: { drop: ['console', 'debugger'] },
  test: { environment: 'node' },
} as never);
