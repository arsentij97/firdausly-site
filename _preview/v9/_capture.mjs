/*
  САЙТ v9: ВСЕ ЭКРАНЫ — НАСТОЯЩЕЕ ПРИЛОЖЕНИЕ. Снимает экраны и короткие ролики с кода приложения в вебе
  (react-native-web, те же компоненты, что на iPhone) и кладёт их в site/_preview/v9/i/app и v/app.

  ЗАПУСК (одна команда после каждой волны OTA/слияния веток):
    node site/_preview/v9/_capture.mjs --serve          сам поднимет expo web (свой TEMP), снимет всё, закроет
    node site/_preview/v9/_capture.mjs                  если expo web уже поднят на WEB_URL (по умолчанию :8091)
    node site/_preview/v9/_capture.mjs --only home,umma снять выборочно
    node site/_preview/v9/_capture.mjs --probe "/(tabs)/jamaat?demo=feed" plus   разведка: один снимок в scratch
  Потом: node site/_preview/v9/_build.mjs

  ЖИВУЮ БАЗУ НЕ ТРОГАЕМ: ни входа, ни записей, ни эфиров (18.11: тестовые эфиры видели настоящие люди).
  Данные — только смотровые швы приложения (`?demo=…`, components/(раздел)/demo.web.ts) и посевы памяти телефона
  (как mobile/scripts/look-web.mjs). Живых людей нет, вход не нужен.
  Рамка: `web:bare` — экран во всё окно 402×874, без корпуса; корпус и строку состояния рисует сайт.
*/
import { spawn, execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(here, '../../..');
const args = process.argv.slice(2);
const has = (k) => args.includes(k);
const val = (k) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : null; };
const BASE = process.env.WEB_URL || val('--base') || 'http://localhost:8091';
const W = 402, H = 874, DPR = 3;
const MEDIA = path.join(here, 'media'), MANIFEST = path.join(MEDIA, 'media.json');
const OUT_I = MEDIA, OUT_V = MEDIA;
const TMP = path.join(os.tmpdir(), 'firdausly-v9-capture');
fs.mkdirSync(MEDIA, { recursive: true });
/* media.json: слот → файл. Нативные снимки (temp:false, из симулятора iOS) этот скрипт НЕ перезаписывает без --force. */
const manifest = fs.existsSync(MANIFEST) ? JSON.parse(fs.readFileSync(MANIFEST, 'utf8')) : {};
const canWrite = (slot) => has('--force') || !manifest[slot] || manifest[slot].temp !== false;
const note = (slot, rec) => { manifest[slot] = { ...rec, temp: true, source: 'web', at: new Date().toISOString().slice(0, 16) }; fs.writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2) + String.fromCharCode(10)); };
fs.mkdirSync(TMP, { recursive: true });
const FF = execFileSync('python', ['-c', 'import imageio_ffmpeg;print(imageio_ffmpeg.get_ffmpeg_exe())']).toString().trim();
const ff = (a) => execFileSync(FF, ['-loglevel', 'error', '-y', ...a], { stdio: 'inherit' });
const CHROME = ['C:/Program Files/Google/Chrome/Application/chrome.exe', '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'].find((p) => fs.existsSync(p));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/* ── посевы памяти телефона (те же ключи, что в look-web.mjs) ── */
const PR = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];
const dayKey = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const daysAgo = (n) => new Date(Date.now() - n * 864e5);
const marks = (n) => { const o = {}; for (let i = 1; i <= n; i++) for (const p of PR) o[`log:${dayKey(daysAgo(i))}:${p}`] = 'prayed'; return o; };
/* Сегодня отмечены все прошедшие намазы, кроме текущего: на главной нет «восполни», а кнопка «Прочитал …» живая.
   Часы — Астана, ноябрь–декабрь (посев города astana); другой сезон — поправить START. */
const START = { fajr: 6 * 60, dhuhr: 12 * 60 + 5, asr: 14 * 60 + 40, maghrib: 16 * 60 + 28, isha: 18 * 60 };
/* Снимки — всегда в 15:56 по Астане (время Асра): таймеры, «начнётся Магриб», отметки дня правдоподобны в любой час съёмки. */
const SHOT_MIN = 15 * 60 + 56;
const nowMin = SHOT_MIN;
const SHIFT = (() => { const d = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Almaty' })); return (SHOT_MIN * 60 - (d.getHours() * 3600 + d.getMinutes() * 60 + d.getSeconds())) * 1000; })();
const CLOCK = `(()=>{const R=Date,off=${SHIFT};class D extends R{constructor(...a){a.length?super(...a):super(R.now()+off)}static now(){return R.now()+off}}window.Date=D;})();`;
const passed = PR.filter((p) => START[p] <= nowMin);
const TODAY = Object.fromEntries(passed.slice(0, -1).map((p) => [`log:${dayKey(new Date())}:${p}`, 'prayed']));
const BASE_SEED = { 'settings:lang': 'ru', 'onboarding:done': '1', 'install:at': String(Date.now() - 45 * 864e5), 'settings:city': 'astana', ...marks(40), ...TODAY };
const PLUS = { 'access:plus': JSON.stringify({ plus: true, until: Date.now() + 365 * 864e5 }) };
const QUIET = { 'znanie:hints': 'off', 'tip:mark': 'done', 'tip:miss': 'done', 'tip:verify': 'done', 'tip:adhan': 'done' };
/* --lang en: тот же набор на английском; файлы и слоты с хвостом «.en» (home.en.webp → слот home.en) */
const LANG = (process.argv.includes('--lang') ? process.argv[process.argv.indexOf('--lang') + 1] : 'ru') === 'en' ? 'en' : 'ru';
const SUF = LANG === 'en' ? '.en' : '';
BASE_SEED['settings:lang'] = LANG;
const SEEDS = { plus: { ...BASE_SEED, ...PLUS, ...QUIET }, free: { ...BASE_SEED, ...QUIET } };

/* ── что снимаем. route — путь приложения; prep — JS после отрисовки; wait — пауза на картинки ── */
export const SHOTS = [
  { id: 'home', route: '/?remind=two', seed: 'plus' },
  { id: 'home-many', route: '/?remind=many', seed: 'plus' },
  { id: 'home-sheet', route: '/?remind=sheet', seed: 'plus' },
  { id: 'umma', route: '/(tabs)/jamaat?demo=feed&tab=all', seed: 'plus' },
  { id: 'stage', route: '/stage/demo?demo=room', seed: 'plus', wait: 3500 },
  { id: 'stage-home', route: '/?stages=demo', seed: 'plus' },
  { id: 'msgs', route: '/(tabs)/messages?demo=list', seed: 'plus', prep: "document.querySelectorAll('body *').forEach(e=>{const r=e.getBoundingClientRect();if(r.right>innerWidth+2&&r.width<170&&r.height<260&&r.left>innerWidth-130)e.style.visibility='hidden'})", after: 400 },
  { id: 'moments', route: '/instants/sent?demo=1&room=12', seed: 'plus' },
  { id: 'focus', route: '/(tabs)/focus?demo=closed', seed: 'plus' },
  { id: 'focus-open', route: '/(tabs)/focus?demo=open', seed: 'plus' },
  { id: 'reels', route: '/(tabs)/reminders?demo=reels', seed: 'plus', wait: 4000 },
  { id: 'together', route: '/together/demo?demo=all', seed: 'plus' },
  { id: 'qibla', route: '/qibla', seed: 'plus' },
  { id: 'dhikr', route: '/dhikr', seed: 'plus' },
  { id: 'adhan', route: '/adhan-sound', seed: 'plus' },
  { id: 'fajr', route: '/fajr-alarm?demo=on', seed: 'plus' },
  { id: 'widgets', route: '/widgets', seed: 'plus' },
  { id: 'paywall', route: '/paywall?demo=1', seed: 'free' },
  { id: 'zov', route: '/?remind=1&zov=incoming', seed: 'plus' },
  { id: 'requests', route: '/(tabs)/messages?demo=list&tab=requests', seed: 'plus', prep: "document.querySelectorAll('body *').forEach(e=>{const r=e.getBoundingClientRect();if(r.right>innerWidth+2&&r.width<170&&r.height<260&&r.left>innerWidth-130)e.style.visibility='hidden'})", after: 400 },
  { id: 'settings', route: '/settings', seed: 'plus' },
  { id: 'invite', route: '/invite?demo=1', seed: 'plus' },
  { id: 'quran', route: '/quran', seed: 'plus' },
];
/* Ролики: шаги — tap по тексту, swipe, wait. Снимаются кадрами экрана (Page.startScreencast) → MP4. */
const SITE = process.env.SITE_URL || 'http://localhost:4173';
const BRAND = [ /* настоящие ролики @firdausly (supabase/seed/reels-firdausly.json) вместо демо-роликов приложения */
  ['r12', 'Медина вечером. Люди идут на Магриб, птицы — домой. Хочется, чтобы и сердце так же знало дорогу.'],
  ['r18', 'В суре «Милостивый» 31 раз звучит один вопрос: «Какую же из милостей вашего Господа вы считаете ложью?» Сегодня ответь на него благодарностью.'],
  ['r25', '«За добро к каждому живому существу есть награда». Пророк ﷺ, аль-Бухари, 2363. Доброта засчитывается. Даже к котёнку на дереве.'],
  ['r14', 'Этот мир — не твой дом. Мы здесь проездом. Собираем то, что пригодится дома.'],
];
const EN_CAP = {}; /* для английской съёмки подписи ролика остаются оригинальными (русские ролики показываем как есть) */
const DEMO_CAP = [...fs.readFileSync(path.join(repo, 'mobile/src/lib/reels/demo.web.ts'), 'utf8').match(/const CAPTIONS = \[([\s\S]*?)\];/)[1].matchAll(/'([^']*)'/g)].map((m) => m[1]);
const reelsRedirect = BRAND.flatMap(([id], k) => [[`reels/r${k + 1}\.mp4`, `${SITE}/_preview/v8/v/${id}.mp4`], [`reels/r${k + 1}\.jpg`, `${SITE}/_preview/v8/v/${id}.webp`]]);
export const CLIPS = [
  { id: 'clip-remind', poster: 'home', route: '/?remind=two', seed: 'plus', steps: [{ wait: 2800 }, { tap: ['Амина', 'Amina'] }, { wait: 3400 }] },
  { id: 'clip-umma', poster: 'umma', route: '/(tabs)/jamaat?demo=feed&tab=all', seed: 'plus', steps: [{ wait: 1800 }, { wheel: 520 }, { wait: 1600 }, { wheel: 640 }, { wait: 2000 }, { wheel: -1160 }, { wait: 1500 }] } /* кольцо: начинается и кончается верхом ленты (истории, «Для тебя», целый пост) — без прыжка на петле */,
  { id: 'clip-stage', poster: 'stage', route: '/stage/demo?demo=room', seed: 'plus', steps: [{ wait: 900 }, { tap: ['Амин', 'Amin', 'Ameen'] }, { wait: 700 }, { tap: ['Амин', 'Amin', 'Ameen'] }, { wait: 700 }, { tap: ['Амин', 'Amin', 'Ameen'] }, { wait: 1800 }] },
  { id: 'clip-dhikr', poster: 'dhikr', route: '/dhikr', seed: 'plus', steps: [{ wait: 500 }, ...Array.from({ length: 12 }, () => [{ at: [201, 560] }, { wait: 260 }]).flat(), { wait: 900 }] },
  { id: 'clip-reels', route: '/(tabs)/reminders?demo=reels', seed: 'plus', wait: 4000, redirect: reelsRedirect, replace: [['1,2 тыс.', '48'], ['1.2K', '48'], ['210', '9'], ['amina.reads', 'firdausly'], ['yusuf_dawn', 'firdausly'], ['garden.of.ilm', 'firdausly'], ['bilal.sea', 'firdausly'], ...BRAND.flatMap(([, c], k) => { const parts = DEMO_CAP[k].split(/(?<=[.?!»])\s+/); return [[parts[0], c], ...parts.slice(1).map((x) => [x, ''])]; })], steps: [{ js: "document.querySelectorAll('video').forEach(v=>{v.muted=true;v.play().catch(()=>{})})" }, { wait: 3500 }, { swipe: [201, 640, 201, 160] }, { wait: 400 }, { js: "document.querySelectorAll('video').forEach(v=>{v.muted=true;v.play().catch(()=>{})})" }, { wait: 3500 }, { swipe: [201, 640, 201, 160] }, { wait: 3200 }] },
];

/* ── браузер по протоколу DevTools (без лишних пакетов, как look-web.mjs) ── */
async function browser() {
  const port = 9300 + Math.floor(Math.random() * 400), prof = path.join(TMP, 'prof'); /* один профиль: кэш сборки тёплый, память телефона чистит посев */
  const ch = spawn(CHROME, ['--headless=new', `--remote-debugging-port=${port}`, `--user-data-dir=${prof}`, '--no-first-run', '--hide-scrollbars', '--autoplay-policy=no-user-gesture-required', '--force-color-profile=srgb', 'about:blank'], { stdio: 'ignore' });
  let ws; for (let i = 0; i < 60 && !ws; i++) { try { const l = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json(); const pg = l.find((t) => t.type === 'page'); if (pg) ws = new WebSocket(pg.webSocketDebuggerUrl); } catch {} if (!ws) await sleep(250); }
  await new Promise((r) => ws.addEventListener('open', r));
  let id = 0; const pend = new Map(), handlers = [];
  ws.addEventListener('message', (m) => { const d = JSON.parse(m.data); if (d.id && pend.has(d.id)) { pend.get(d.id)(d); pend.delete(d.id); } else if (d.method) handlers.forEach((h) => h(d)); });
  const send = (method, params = {}) => new Promise((r) => { const i = ++id; pend.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
  const ev = async (expression) => (await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true })).result?.result?.value;
  const close = () => { try { ws.close(); } catch {} ch.kill(); };
  return { send, ev, on: (h) => handlers.push(h), close };
}

async function open(b, item, dpr = DPR) {
  await b.send('Page.enable'); await b.send('Runtime.enable');
  await b.send('Emulation.setDeviceMetricsOverride', { width: W, height: H, deviceScaleFactor: dpr, mobile: true });
  await b.send('Emulation.setTouchEmulationEnabled', { enabled: true });
  await b.send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-color-scheme', value: 'dark' }] });
  const data = { ...(SEEDS[item.seed] || {}), ...(item.store || {}), 'web:bare': `${W}x${H}` };
  await b.send('Page.addScriptToEvaluateOnNewDocument', { source: CLOCK });
  /* служебная наклейка стопки Моментов у правого края («3 новых») — в кадр не берём */
  await b.send('Page.addScriptToEvaluateOnNewDocument', { source: `setInterval(()=>{document.querySelectorAll('body *').forEach(e=>{if(e.childElementCount===0&&/(новых|новый|новое|new)$/i.test((e.textContent||'').trim())&&(e.textContent||'').trim().length<14){let p=e,best=null;for(let k=0;k<10&&p&&p!==document.body;k++){const r=p.getBoundingClientRect();if(r.width<170&&r.right>innerWidth-40)best=p;p=p.parentElement}if(best)best.style.visibility='hidden'}})},200)` });
  await b.send('Page.addScriptToEvaluateOnNewDocument', { source: `try{localStorage.clear();${Object.entries(data).map(([k, v]) => `localStorage.setItem(${JSON.stringify(k)},${JSON.stringify(v)});`).join('')}}catch(e){}` });
  if (item.replace) await b.send('Page.addScriptToEvaluateOnNewDocument', { source: `(()=>{const R=${JSON.stringify(item.replace)};const fix=n=>{if(n.nodeType===3){let t=n.nodeValue,o=t;for(const [a,b] of R)t=t.split(a).join(b);if(t!==o)n.nodeValue=t}else n.childNodes&&n.childNodes.forEach(fix)};new MutationObserver(m=>m.forEach(x=>{x.addedNodes.forEach(fix);if(x.type==='characterData')fix(x.target)})).observe(document,{subtree:true,childList:true,characterData:true});})()` });
  if (item.redirect) {
    await b.send('Fetch.enable', { patterns: [{ urlPattern: '*.mp4*' }, { urlPattern: '*.jpg*' }] });
    b.on((d) => { if (d.method !== 'Fetch.requestPaused') return; const u = decodeURIComponent(d.params.request.url); const hit = item.redirect.find(([re]) => new RegExp(re).test(u)); if (hit) console.log('  подмена', u.slice(-40), '→', hit[1].slice(-12)); b.send('Fetch.continueRequest', hit ? { requestId: d.params.requestId, url: hit[1] } : { requestId: d.params.requestId }); });
  }
  await b.send('Page.navigate', { url: BASE + item.route });
  /* ждём настоящую отрисовку (холодная сборка Metro бывает дольше двух минут): без текста — не снимаем */
  let drawn = false;
  for (let i = 0; i < 600 && !drawn; i++) { await sleep(500); drawn = (await b.ev('(document.body&&document.body.innerText||"").trim().length')) > 20; }
  if (!drawn) throw new Error('экран не отрисовался: ' + item.route);
  await b.ev(`document.fonts ? document.fonts.ready.then(()=>1) : 1`);
  await sleep(item.wait ?? 2500);
  if (item.prep) { await b.ev(item.prep); await sleep(item.after ?? 1200); }
}

/* касание по видимому тексту: ближайший нажимаемый предок */
const tapPart = (t) => `(()=>{const w=[...document.querySelectorAll('body *')].filter(e=>e.childElementCount===0&&(e.textContent||'').includes(${JSON.stringify(t)})&&e.getBoundingClientRect().width>0);const e=w[0];if(!e)return 'нет: '+${JSON.stringify(t)};let p=e;while(p&&p!==document.body&&!(p.getAttribute('role')==='button'||p.getAttribute('role')==='link'||p.tagName==='BUTTON'||p.tabIndex>=0))p=p.parentElement;(p||e).click();return 'ok'})()`;
const tapText = (t) => `(()=>{const w=[...document.querySelectorAll('body *')].filter(e=>e.childElementCount===0&&(e.textContent||'').trim()===${JSON.stringify(t)});const e=w.find(x=>x.getBoundingClientRect().width>0);if(!e)return 'нет: '+${JSON.stringify(t)};let p=e;while(p&&p!==document.body&&!(p.getAttribute('role')==='button'||p.tagName==='BUTTON'||p.tabIndex>=0))p=p.parentElement;(p||e).click();return 'ok'})()`;

async function shot(item, outDir) {
  item = { ...item, id: item.id + SUF };
  if (!outDir && !canWrite(item.id)) { console.log('пропуск (нативный снимок):', item.id); return; }
  const b = await browser();
  try {
    await open(b, item);
    await b.ev('new Promise(r=>setTimeout(r,(1000-Date.now()%1000)+520))');
    const r = await b.send('Page.captureScreenshot', { format: 'png' });
    const png = path.join(TMP, item.id + '.png');
    fs.writeFileSync(png, Buffer.from(r.result.data, 'base64'));
    if (outDir) { fs.copyFileSync(png, path.join(outDir, item.id + '.png')); return; }
    ff(['-i', png, '-c:v', 'libwebp', '-quality', '90', path.join(OUT_I, item.id + '.webp')]);
    ff(['-i', png, '-vf', 'scale=603:-2:flags=lanczos', '-c:v', 'libwebp', '-quality', '86', path.join(OUT_I, item.id + '-s.webp')]);
    note(item.id, { kind: 'image', file: item.id + '.webp', small: item.id + '-s.webp', aspect: `${W}/${H}` });
    console.log('снимок', item.id);
  } finally { b.close(); }
}

async function clip(item) {
  item = { ...item, id: item.id + SUF, poster: item.poster && item.poster + SUF };
  if (!canWrite(item.id)) { console.log('пропуск (нативный ролик):', item.id); return; }
  const b = await browser();
  try {
    await open(b, item, 2);
    const dir = path.join(TMP, 'clip-' + item.id); fs.rmSync(dir, { recursive: true, force: true }); fs.mkdirSync(dir);
    const frames = [];
    b.on((d) => { if (d.method === 'Page.screencastFrame') { const f = path.join(dir, String(frames.length).padStart(5, '0') + '.jpg'); fs.writeFileSync(f, Buffer.from(d.params.data, 'base64')); frames.push([f, d.params.metadata.timestamp]); b.send('Page.screencastFrameAck', { sessionId: d.params.sessionId }); } });
    await b.send('Page.startScreencast', { format: 'jpeg', quality: 90, maxWidth: W * 2, maxHeight: H * 2, everyNthFrame: 1 });
    await sleep(600);
    for (const s of item.steps) {
      if (s.wait) await sleep(s.wait);
      if (s.tap) { let r; for (const t of [].concat(s.tap)) { r = await b.ev(tapText(t)); if (r === 'ok') break; } if (r !== 'ok') console.warn(item.id, r); }
      if (s.tapPart) { const r = await b.ev(tapPart(s.tapPart)); if (r !== 'ok') console.warn(item.id, r); }
      if (s.js) await b.ev(s.js);
      if (s.wheel) { for (let k = 0; k < 10; k++) { await b.send('Input.dispatchMouseEvent', { type: 'mouseWheel', x: W / 2, y: H * 0.55, deltaX: 0, deltaY: s.wheel / 10 }); await sleep(30); } }
      if (s.at) { const [x, y] = s.at; await b.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] }); await sleep(60); await b.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); }
      if (s.swipe) { const [x1, y1, x2, y2] = s.swipe; await b.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: x1, y: y1 }] }); for (let k = 1; k <= 12; k++) { await b.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: x1 + (x2 - x1) * k / 12, y: y1 + (y2 - y1) * k / 12 }] }); await sleep(16); } await b.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); }
    }
    await sleep(item.tail ?? 800);
    await b.send('Page.stopScreencast');
    /* кадры приходят неравномерно: собираем по их времени в ровные 30 кадров/с */
    const list = frames.map(([f, t], i) => `file '${f.replace(/\\/g, '/')}'\nduration ${(((frames[i + 1]?.[1] ?? t + 0.04) - t)).toFixed(3)}`).join('\n') + `\nfile '${frames.at(-1)[0].replace(/\\/g, '/')}'`;
    fs.writeFileSync(path.join(dir, 'list.txt'), list);
    ff(['-f', 'concat', '-safe', '0', '-i', path.join(dir, 'list.txt'), '-ss', '0.7', '-vf', 'fps=30,scale=804:-2:flags=lanczos', '-c:v', 'libx264', '-preset', 'slow', '-crf', '20', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', '-an', path.join(OUT_V, item.id + '.mp4')]);
    if (item.poster && fs.existsSync(path.join(OUT_I, item.poster + '.webp'))) ff(['-i', path.join(OUT_I, item.poster + '.webp'), '-vf', 'scale=804:-2', '-c:v', 'libwebp', '-quality', '86', path.join(OUT_V, item.id + '.webp')]); else ff(['-ss', '1.6', '-i', path.join(OUT_V, item.id + '.mp4'), '-frames:v', '1', '-vf', 'scale=804:-2', '-c:v', 'libwebp', '-quality', '86', path.join(OUT_V, item.id + '.webp')]); /* постер — кадр после отрисовки, не пустой первый */
    note(item.id, { kind: 'video', file: item.id + '.mp4', poster: item.id + '.webp', aspect: `${W}/${H}` });
    console.log('ролик', item.id, frames.length, 'кадров');
  } finally { b.close(); }
}

async function serve() {
  const t = path.join(TMP, 'expo-temp'); fs.mkdirSync(t, { recursive: true });
  const p = spawn('npx', ['expo', 'start', '--web', '--port', new URL(BASE).port], { cwd: path.join(repo, 'mobile'), shell: true, env: { ...process.env, CI: '1', TEMP: t, TMP: t, MSYS_NO_PATHCONV: '1' }, stdio: 'ignore' });
  for (let i = 0; i < 240; i++) { try { if ((await fetch(BASE)).ok) break; } catch {} await sleep(1000); }
  return p;
}

if (has('--probe')) {
  const [route, seed] = [val('--probe'), args[args.indexOf('--probe') + 2] || 'plus'];
  const out = val('--out') || TMP;
  await shot({ id: 'probe-' + Date.now(), route, seed, wait: +(val('--wait') || 2500), prep: val('--prep') || undefined }, out);
  console.log('probe →', out);
  process.exit(0);
}
const only = val('--only') ? new Set(val('--only').split(',')) : null;
const srv = has('--serve') ? await serve() : null;
try {
  for (const s of SHOTS) if (!only || only.has(s.id)) await shot(s);
  for (const c of CLIPS) if (!only || only.has(c.id)) await clip(LANG === 'en' && c.replace ? { ...c, replace: c.replace.map(([a, b]) => [a, EN_CAP[b] ?? b]) } : c);
} finally { if (srv) { try { execFileSync('taskkill', ['/pid', String(srv.pid), '/T', '/F']); } catch { srv.kill(); } } }
