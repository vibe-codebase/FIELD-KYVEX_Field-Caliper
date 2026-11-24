// Usage: node brand/render.mjs <assetsDir>: bundles brand.ts and paints the store art in headless Chromium.
// Writes assets/icons/*, assets/key-art/splash.png, and Delivery/app-icon-512.png + feature-graphic.png next to the app.
import { build } from 'esbuild'; import { chromium } from 'playwright-core'; import fs from 'node:fs'; import path from 'node:path';
const here = import.meta.dirname;
const out = path.resolve(process.argv[2] || path.join(here, '../../assets'));
const delivery = path.join(out, '../Delivery');
// the app's name and company come from app.json, so the art follows a rename
const expo = JSON.parse(fs.readFileSync(path.join(here, '../../app.json'), 'utf8')).expo;
const APP = { name: expo.name, company: expo.extra?.company ?? '' };
const js = (await build({ entryPoints: [path.join(here, 'brand.ts')], bundle: true, write: false, format: 'iife' })).outputFiles[0].text;
const FONTS = JSON.parse(fs.readFileSync(path.join(here, 'fonts.json'), 'utf8'));
const faces = FONTS.map(([family, pkg, file, weight]) => {
  const b64 = fs.readFileSync(path.join(here, '../node_modules', pkg, 'files', file)).toString('base64');
  return `@font-face{font-family:"${family}";font-weight:${weight};src:url(data:font/woff2;base64,${b64})}`;
}).join('');
const probes = FONTS.map(([family, , , weight]) => `<div style="font-family:'${family}';font-weight:${weight}">.</div>`).join('');
const exe = process.env.CHROME || ['/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', '/Applications/Brave Browser.app/Contents/MacOS/Brave Browser', '/opt/pw-browsers/chromium'].find((p) => fs.existsSync(p));
const b = await chromium.launch({ executablePath: exe });
const p = await b.newPage();
await p.setContent(`<style>${faces}</style>${probes}`);
await p.evaluate(() => document.fonts.ready);
await p.addScriptTag({ content: `window.APP = ${JSON.stringify(APP)};` });
await p.addScriptTag({ content: js });
const jobs = [['icon', path.join(out, 'icons/app-icon.png')], ['adaptive', path.join(out, 'icons/adaptive-foreground.png')],
  ['adaptiveBg', path.join(out, 'icons/adaptive-background.png')], ['splash', path.join(out, 'key-art/splash.png')],
  ['feature', path.join(delivery, 'feature-graphic.png')], ['icon512', path.join(delivery, 'app-icon-512.png')]];
for (const [name, file] of jobs) {
  const data = await p.evaluate(async (n) => {
    const w = window.brand;
    if (n !== 'icon512') return (await w[n]()).toDataURL('image/png');
    const big = await w.icon(); const c = document.createElement('canvas'); c.width = c.height = 512;
    const g = c.getContext('2d'); g.imageSmoothingQuality = 'high'; g.drawImage(big, 0, 0, 512, 512); return c.toDataURL('image/png');
  }, name);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, Buffer.from(data.split(',')[1], 'base64')); console.log('wrote', path.relative(path.join(out, '..'), file));
}
await b.close();
