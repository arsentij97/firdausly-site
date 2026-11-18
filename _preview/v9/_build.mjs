/*
  Сайт v9: node site/_preview/v9/_build.mjs            превью → site/_preview/v9/(…)/index.html
           node site/_preview/v9/_build.mjs --live     боевые страницы → site/index.html, site/partners.html,
                                                       site/en/index.html, site/en/partners.html + общие файлы в site/s/
  Источники: src.html, partners/src.html, en/src.html, en/partners/src.html + _base.css + _v9.css + _main.js.
  Экраны приложения берутся ТОЛЬКО из media/media.json (слот → файл). Метка в разметке:
    <!--M:слот|запасной-слот w=ширина eager cls=класс-->
  На английской странице сначала ищется слот «слот.en» (снимок английского приложения), потом русский.
  Ролик (kind: video) — <video> с постером, грузится, когда виден. Нативные снимки (temp:false) берутся так же.
  Значки: p-* Phosphor (_ph.json), t-* вкладки (mobile/src/components/nav/tabGlyphs.ts).
*/
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(here, '../../..');
const site = path.join(repo, 'site');
const LIVE = process.argv.includes('--live');
const rd = (p) => fs.readFileSync(path.join(here, p), 'utf8');
const css = rd('_base.css') + rd('_v9.css');
const js = rd('_main.js');
const media = JSON.parse(rd('media/media.json'));

const sym = new Map();
const ph = JSON.parse(rd('_ph.json'));
for (const [k, v] of Object.entries(ph.icons)) sym.set(`p-${k}`, `<symbol id="p-${k}" viewBox="0 0 ${ph.width} ${ph.height}">${v.body.replace(/fill="currentColor"/g, '')}</symbol>`);
const tg = fs.readFileSync(path.join(repo, 'mobile/src/components/nav/tabGlyphs.ts'), 'utf8');
for (const m of tg.matchAll(/(\w+): \{\s*viewBox: (\d+),\s*scale: ([\d.]+),\s*outline:\s*'([^']+)',\s*fill: '([^']+)'/g)) {
  const [, name, vb, sc, o, f] = m, pad = (+vb * (1 / +sc - 1)) / 2, box = `${-pad} ${-pad} ${+vb + 2 * pad} ${+vb + 2 * pad}`;
  sym.set(`t-${name}`, `<symbol id="t-${name}" viewBox="${box}"><path d="${o}"/></symbol>`);
  sym.set(`t-${name}-f`, `<symbol id="t-${name}-f" viewBox="${box}"><path d="${f}"/></symbol>`);
}

const missing = [];
const dev = (spec, base, lang) => {
  const [slots, ...opts] = spec.trim().split(/\s+/);
  const o = Object.fromEntries(opts.map((x) => (x.includes('=') ? x.split('=') : [x, true])));
  const list = slots.split('|').flatMap((s) => (lang === 'en' ? [s + '.en', s] : [s]));
  const slot = list.find((s) => media[s]);
  if (!slot) { missing.push(slots); return `<!-- нет снимка: ${slots} -->`; }
  const m = media[slot], w = +(o.w || 360), lazy = o.eager ? '' : ' loading="lazy"';
  const src = (f) => base + 'media/' + f;
  const alt = lang === 'en' ? 'Firdausly screen' : 'Экран Firdausly';
  const inner = m.kind === 'video'
    ? `<video data-src="${src(m.file)}" poster="${src(m.poster)}" muted loop playsinline preload="none" aria-label="${lang === 'en' ? 'Firdausly screen recording' : 'Запись экрана Firdausly'}"></video>`
    : `<img src="${src(m.file)}" srcset="${m.small ? src(m.small) + ' 603w, ' : ''}${src(m.file)} 1206w" sizes="${w}px" alt="${alt}"${lazy} decoding="async">`;
  return `<div class="dev${o.cls ? ' ' + o.cls : ''}" style="--w:${w}px" data-slot="${slot}"${m.temp ? ' data-temp' : ''}><div class="sb"><span>9:41</span><i><s></s><b></b></i></div><div class="isl"></div>${inner}</div>`;
};

/* Голова страницы: адрес, языковые пары, карточка, значки, переход на английский по языку телефона. */
const SITE = 'https://firdausly.com';
const head = (url, alt, lang, title, desc, assets) => `
<link rel="canonical" href="${SITE}${url}">
<link rel="alternate" hreflang="${lang}" href="${SITE}${url}"><link rel="alternate" hreflang="${lang === 'ru' ? 'en' : 'ru'}" href="${SITE}${alt}"><link rel="alternate" hreflang="x-default" href="${SITE}${lang === 'ru' ? url : alt}">
<link rel="apple-touch-icon" href="${assets}i/apple-touch-icon.png"><link rel="icon" type="image/png" sizes="32x32" href="${assets}i/favicon-32.png">
<meta property="og:type" content="website"><meta property="og:url" content="${SITE}${url}"><meta property="og:site_name" content="Firdausly"><meta property="og:locale" content="${lang === 'ru' ? 'ru_RU' : 'en_US'}">
<meta property="og:image" content="${SITE}/s/og-${lang}.jpg"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image"><meta name="twitter:image" content="${SITE}/s/og-${lang}.jpg">
<meta name="apple-itunes-app" content="app-id=6806738733">
<script>(function(){try{var p=location.pathname,en=/^\\/en(\\/|$)/.test(p);if(en||localStorage.getItem('lang')||/bot|crawl|spider|slurp|preview|facebookexternalhit/i.test(navigator.userAgent))return;var L=navigator.languages&&navigator.languages.length?navigator.languages:[navigator.language||'ru'];for(var i=0;i<L.length;i++)if(/^(ru|kk|uk|be|uz|ky|tg|tt|az|hy|ka|mo|ba|ce)\\b/i.test(L[i]))return;${LIVE ? "location.replace('" + alt + "'+location.search+location.hash);" : ''}}catch(e){}})();</script>`;

const PAGES = [
  { src: 'src.html', prev: 'index.html', live: 'index.html', base: '', lang: 'ru', url: '/', alt: '/en/', partners: LIVE ? '/partners' : 'partners/', home: '/' },
  { src: 'partners/src.html', prev: 'partners/index.html', live: 'partners.html', base: '../', lang: 'ru', url: '/partners', alt: '/en/partners', home: LIVE ? '/' : '../' },
  { src: 'en/src.html', prev: 'en/index.html', live: 'en/index.html', base: '../', lang: 'en', url: '/en/', alt: '/', partners: LIVE ? '/en/partners' : 'partners/', home: '/en/' },
  { src: 'en/partners/src.html', prev: 'en/partners/index.html', live: 'en/partners.html', base: '../../', lang: 'en', url: '/en/partners', alt: '/partners', home: LIVE ? '/en/' : '../' },
];

function page(p) {
  if (!fs.existsSync(path.join(here, p.src))) return null;
  const assets = LIVE ? '/s/' : p.base;
  let src = rd(p.src).replace(/<!--M:([^>]*?)-->/g, (_, spec) => dev(spec, assets, p.lang));
  /* пути к общим файлам: в превью относительные, на боевом — /s/ */
  if (LIVE) {
    src = src.replace(/((?:src|href|srcset|poster|data-src|data-amb)="|, |url\()(?:\.\.\/)*(i|f|media)\//g, '$1/s/$2/');
    src = src.replace(/href="(?:\.\.\/)*partners\/(#[a-z]+)?"/g, (_, h) => `href="${p.lang === 'en' ? '/en/partners' : '/partners'}${h || ''}"`);
    src = src.replace(/href="(?:\.\.\/)+"/g, `href="${p.home}"`);
    src = src.replace('<meta name="robots" content="noindex">\n', '');
  }
  const title = (/<title>([^<]+)/.exec(src) || [])[1] || 'Firdausly';
  const desc = (/<meta name="description" content="([^"]+)/.exec(src) || [])[1] || '';
  src = src.replace('</title>', () => '</title>' + head(p.url, p.alt, p.lang, title, desc, assets));
  /* переключатель языка в шапке */
  src = src.replace('<a class="btn btn-p"', () => `<a class="lng" href="${LIVE ? p.alt : '/_preview/v9' + (p.alt.endsWith('/') ? p.alt : p.alt + '/')}" data-lang="${p.lang === 'ru' ? 'en' : 'ru'}" onclick="try{localStorage.setItem('lang',this.dataset.lang)}catch(e){}">${p.lang === 'ru' ? 'EN' : 'RU'}</a><a class="btn btn-p"`);
  const pageJs = p.src.includes('partners') ? '' : js;
  const all = src + css + pageJs, used = new Set();
  for (const m of all.matchAll(/\b([pt]-[a-z]+(?:-[a-z0-9]+)*)\b/g)) if (sym.has(m[1])) used.add(m[1]);
  const sprite = `<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs>${[...used].sort().map((k) => sym.get(k)).join('')}</defs></svg>`;
  const html = src.replace('<!--CSS-->', () => css).replace('<!--JS-->', () => pageJs).replace('<!--SPRITE-->', () => sprite).replace(/\r\n/g, '\n');
  const out = LIVE ? path.join(site, p.live) : path.join(here, p.prev);
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, html);
  return `${path.relative(repo, out)} ${(Buffer.byteLength(html) / 1024).toFixed(0)} КБ`;
}
const out = PAGES.map(page).filter(Boolean);

if (LIVE) {
  /* общие файлы боевых страниц: site/s/{i,f,media} + карточки og-*.jpg */
  const S = path.join(site, 's');
  for (const d of ['i', 'f', 'media']) {
    fs.rmSync(path.join(S, d), { recursive: true, force: true });
    fs.mkdirSync(path.join(S, d), { recursive: true });
    for (const f of fs.readdirSync(path.join(here, d))) if (!/\.(json|md)$/.test(f) || d !== 'media') fs.copyFileSync(path.join(here, d, f), path.join(S, d, f));
  }
  for (const f of ['og-ru.jpg', 'og-en.jpg']) if (fs.existsSync(path.join(here, f))) fs.copyFileSync(path.join(here, f), path.join(S, f));
}
const temp = Object.entries(media).filter(([, m]) => m.temp).length;
console.log(`v9${LIVE ? ' (боевой)' : ''}: ${out.join(' · ')} · снимков ${Object.keys(media).length} (временных из веба ${temp})${missing.length ? ' · НЕТ: ' + [...new Set(missing)].join(', ') : ''}`);
