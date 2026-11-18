/*
  Превью v8: node site/_preview/v8/_build.mjs
  src.html + _style.css + _main.js → index.html. Вставляет только те значки, что страница зовёт:
   - p-<имя> — Phosphor (MIT) из _ph.json (api.iconify.design/ph.json, тот же источник, что reelGlyphs.ts);
   - t-<вкладка>[-f] — новые значки нижней панели прямо из mobile/src/components/nav/tabGlyphs.ts;
   - r-<имя> — значки плеера Reminders из mobile/src/components/reels/reelGlyphs.ts.
  Ролики — из supabase/seed/reels-firdausly.json (список REELS в _prep.mjs). На сайт едут index.html, i/, v/, f/.
*/
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(here, '../../..');
const rd = (p) => fs.readFileSync(path.join(here, p), 'utf8');
let src = rd('src.html');
const css = rd('_style.css'), js = rd('_main.js');

const sym = new Map();
const ph = JSON.parse(rd('_ph.json'));
for (const [k, v] of Object.entries(ph.icons)) sym.set(`p-${k}`, `<symbol id="p-${k}" viewBox="0 0 ${ph.width} ${ph.height}">${v.body.replace(/fill="currentColor"/g, '')}</symbol>`);
const tg = fs.readFileSync(path.join(repo, 'mobile/src/components/nav/tabGlyphs.ts'), 'utf8');
for (const m of tg.matchAll(/(\w+): \{\s*viewBox: (\d+),\s*scale: ([\d.]+),\s*outline:\s*'([^']+)',\s*fill: '([^']+)'/g)) {
  const [, name, vb, sc, o, f] = m, pad = (+vb * (1 / +sc - 1)) / 2, box = `${-pad} ${-pad} ${+vb + 2 * pad} ${+vb + 2 * pad}`;
  sym.set(`t-${name}`, `<symbol id="t-${name}" viewBox="${box}"><path d="${o}"/></symbol>`);
  sym.set(`t-${name}-f`, `<symbol id="t-${name}-f" viewBox="${box}"><path d="${f}"/></symbol>`);
}
const rg = fs.readFileSync(path.join(repo, 'mobile/src/components/reels/reelGlyphs.ts'), 'utf8');
for (const m of rg.matchAll(/'([a-z-]+)': \{ ph: '[^']+', d: '([^']+)' \}/g)) sym.set(`r-${m[1]}`, `<symbol id="r-${m[1]}" viewBox="0 0 256 256"><path d="${m[2]}"/></symbol>`);

const all = src + css + js, used = new Set(), missing = new Set();
for (const m of all.matchAll(/#?\b([ptr]-[a-z]+(?:-[a-z0-9]+)*)\b/g)) { const id = m[1]; if (sym.has(id)) used.add(id); }
for (const m of all.matchAll(/(?:href="#|use\(')([ptr]-[a-z0-9-]+)/g)) if (!sym.has(m[1])) missing.add(m[1]);
for (const m of js.matchAll(/'(p-[a-z0-9-]+)'/g)) if (!sym.has(m[1])) missing.add(m[1]);
const sprite = `<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs>${[...used].sort().map((k) => sym.get(k)).join('')}</defs></svg>`;

const { CITIES, COUNTRIES } = await import('../../gen/cities.mjs');
const cities = CITIES.map((c) => [c.slug, c.ru, c.cc, c.tz, +c.lat.toFixed(4), +c.lon.toFixed(4), c.hanafi ?? null, COUNTRIES[c.cc]?.ru ?? '']);

const man = JSON.parse(fs.readFileSync(path.join(repo, 'supabase/seed/reels-firdausly.json'), 'utf8')).items;
const LIST = [...rd('_prep.mjs').match(/REELS = \[([^\]]+)\]/)[1].split(',').map(Number)];
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const reels = LIST.map((n) => {
  const x = man.find((r) => r.n === n);
  const lines = x.caption.split('\n').map((l) => l.trim()).filter(Boolean);
  return { id: `r${n}`, cap: esc(lines.slice(0, 2).join(' ')) };
});

let js2 = js.replace("'__CITIES__'", () => JSON.stringify(cities)).replace("'__REELS__'", () => JSON.stringify(reels));
const html = src.replace('<!--CSS-->', () => css).replace('<!--JS-->', () => js2).replace('<!--SPRITE-->', () => sprite).replace(/\r\n/g, '\n');
fs.writeFileSync(path.join(here, 'index.html'), html);
console.log(`v8: значков ${used.size}${missing.size ? ', НЕТ: ' + [...missing].join(' ') : ''}, роликов ${reels.length}, index.html ${(Buffer.byteLength(html) / 1024).toFixed(1)} КБ`);
