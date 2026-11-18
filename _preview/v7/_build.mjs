/*
  Превью v7 «Сайт — это приложение»: node site/_preview/v7/_build.mjs
  src.html → index.html: вставляет только те значки, что страница зовёт.
   - i-<имя>[-f] — Phosphor 2.1.1 (MIT), из _sprite.svg (готовит prep.py из пакета);
   - t-<вкладка>[-f] — значки нижней панели прямо из mobile/src/components/nav/tabGlyphs.ts,
     чтобы панель сайта не разошлась с панелью приложения.
  На сайт уезжают index.html, i/, f/; файлы с «_» и src.html — нет.
*/
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(here, '../../..');
const src = fs.readFileSync(path.join(here, 'src.html'), 'utf8');

const sprite = fs.readFileSync(path.join(here, '_sprite.svg'), 'utf8');
const sym = new Map([...sprite.matchAll(/<symbol id="([^"]+)"[\s\S]*?<\/symbol>/g)].map((m) => [m[1], m[0]]));

const tg = fs.readFileSync(path.join(repo, 'mobile/src/components/nav/tabGlyphs.ts'), 'utf8');
for (const m of tg.matchAll(/(\w+): \{\s*viewBox: (\d+),\s*scale: ([\d.]+),\s*outline:\s*'([^']+)',\s*fill: '([^']+)'/g)) {
  const [, name, vb, sc, o, f] = m;
  const pad = (+vb * (1 / +sc - 1)) / 2;
  const box = `${-pad} ${-pad} ${+vb + 2 * pad} ${+vb + 2 * pad}`;
  sym.set(`t-${name}`, `<symbol id="t-${name}" viewBox="${box}"><path d="${o}"/></symbol>`);
  sym.set(`t-${name}-f`, `<symbol id="t-${name}-f" viewBox="${box}"><path d="${f}"/></symbol>`);
}

const used = new Set();
for (const m of src.matchAll(/\b([it]-[a-z]+(?:-[a-z]+)*)/g)) {
  const id = m[1];
  if (sym.has(id)) used.add(id);
  if (id.startsWith('t-') && sym.has(id + '-f')) used.add(id + '-f'); /* панель: выбранный пункт — залитый */
}
const out = `<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs>${[...used].sort().map((k) => sym.get(k)).join('')}</defs></svg>`;
const { CITIES, COUNTRIES } = await import('../../gen/cities.mjs');
const cities = CITIES.map((c) => [c.slug, c.ru, c.cc, c.tz, +c.lat.toFixed(4), +c.lon.toFixed(4), c.hanafi ?? null, COUNTRIES[c.cc]?.ru ?? '']);
const html = src.replace('<!--SPRITE-->', out).replace("'__CITIES__'", JSON.stringify(cities));
fs.writeFileSync(path.join(here, 'index.html'), html.replace(/\r\n/g, '\n'));
console.log(`v7: значков ${used.size}, index.html ${(Buffer.byteLength(html) / 1024).toFixed(1)} КБ`);
