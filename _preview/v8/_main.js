document.addEventListener('DOMContentLoaded', () => {
'use strict';
const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
const buzz = (n = 10) => { try { if (navigator.vibrate && navigator.userActivation && navigator.userActivation.hasBeenActive) navigator.vibrate(n); } catch (e) {} };
const store = { get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }, set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} } };
const use = (id, cls = '') => `<svg class="${cls}"><use href="#${id}"/></svg>`;
const once = (el, fn, th = .35) => { if (!el) return; if (!('IntersectionObserver' in window)) return fn(); const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { io.disconnect(); fn(); } }), { threshold: th }); io.observe(el); };
const pad = n => String(n).padStart(2, '0');
const nf = n => Math.round(n).toLocaleString('ru-RU').replace(/ /g, ' ');

/* ── шапка: стекло после первого экрана (наблюдатель, без scroll-слушателя) ── */
(() => { const top = $('#top'), s = document.createElement('div'); s.style.cssText = 'position:absolute;top:0;height:80px;width:1px'; document.body.prepend(s);
  new IntersectionObserver(([e]) => top.classList.toggle('on', !e.isIntersecting)).observe(s); })();

/* ═════════ ВРЕМЯ НАМАЗА (site/assets/namaz.js — тот же расчёт, что в приложении) ═════════ */
const CITIES = '__CITIES__'.map(([slug, ru, cc, tz, lat, lon, hanafi, country]) => ({ slug, ru, cc, tz, lat, lon, hanafi: hanafi === null ? undefined : hanafi, country }));
const TZ = { 'Asia/Almaty': 'almaty', 'Asia/Qyzylorda': 'kyzylorda', 'Asia/Aqtobe': 'aktobe', 'Asia/Aqtau': 'aktau', 'Asia/Atyrau': 'atyrau', 'Asia/Oral': 'uralsk', 'Asia/Qostanay': 'kostanay', 'Asia/Bishkek': 'bishkek', 'Asia/Tashkent': 'tashkent', 'Asia/Samarkand': 'samarkand', 'Asia/Dushanbe': 'dushanbe', 'Europe/Moscow': 'moscow', 'Asia/Yekaterinburg': 'ufa', 'Asia/Baku': 'baku', 'Europe/Istanbul': 'istanbul', 'Asia/Dubai': 'dubai', 'Europe/London': 'london', 'America/New_York': 'new-york' };
const NAMES = { fajr: 'Фаджр', sunrise: 'Восход', dhuhr: 'Зухр', asr: 'Аср', maghrib: 'Магриб', isha: 'Иша' };
const ACC = { fajr: 'Фаджр', dhuhr: 'Зухр', asr: 'Аср', maghrib: 'Магриб', isha: 'Ишу' };
const MONTHS = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
const WD = ['Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'];
const NZ = window.FirdausNamaz;
const bySlug = s => CITIES.find(c => c.slug === s);
let city = bySlug(store.get('v8city')) || (() => { let tz = ''; try { tz = Intl.DateTimeFormat().resolvedOptions().timeZone || ''; } catch (e) {} return bySlug(TZ[tz]) || bySlug('almaty') || CITIES[0]; })();
function ymd(tz, add = 0) { const d = new Date(Date.now() + add * 864e5); return new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit' }).format(d).split('-').map(Number); }
const hm = d => (NZ ? NZ.hm(d, city.tz) : d.toTimeString().slice(0, 5));
let P = null;
function compute() {
  if (!NZ || !city) return null;
  const [y, m, d] = ymd(city.tz), t = NZ.day(city, y, m, d), [y2, m2, d2] = ymd(city.tz, 1), tm = NZ.day(city, y2, m2, d2), [y0, m0, d0] = ymd(city.tz, -1), ty = NZ.day(city, y0, m0, d0);
  const now = Date.now(); let cur, start, end, next, nextAt;
  if (now < t.fajr) { cur = 'isha'; start = ty.isha; end = t.fajr; next = 'fajr'; nextAt = t.fajr; }
  else if (now < t.sunrise) { cur = 'fajr'; start = t.fajr; end = t.sunrise; next = 'dhuhr'; nextAt = t.dhuhr; }
  else if (now < t.dhuhr) { cur = null; start = t.sunrise; end = t.dhuhr; next = 'dhuhr'; nextAt = t.dhuhr; }
  else if (now < t.asr) { cur = 'dhuhr'; start = t.dhuhr; end = t.asr; next = 'asr'; nextAt = t.asr; }
  else if (now < t.maghrib) { cur = 'asr'; start = t.asr; end = t.maghrib; next = 'maghrib'; nextAt = t.maghrib; }
  else if (now < t.isha) { cur = 'maghrib'; start = t.maghrib; end = t.isha; next = 'isha'; nextAt = t.isha; }
  else { cur = 'isha'; start = t.isha; end = tm.fajr; next = 'fajr'; nextAt = tm.fajr; }
  return { t, tm, cur, start, end, next, nextAt, y, m, d, focus: cur || next };
}
const fmtLeft = ms => { const s = Math.max(0, Math.floor(ms / 1000)); return pad(Math.floor(s / 3600)) + ':' + pad(Math.floor(s / 60) % 60) + ':' + pad(s % 60); };
const fmtIsl = ms => { const s = Math.max(0, Math.floor(ms / 1000)); const h = Math.floor(s / 3600); return (h ? h + ':' + pad(Math.floor(s / 60) % 60) : Math.floor(s / 60)) + ':' + pad(s % 60); };
const inWords = ms => { const mm = Math.max(1, Math.round(ms / 60000)), h = Math.floor(mm / 60), r = mm % 60; return (h ? h + ' ч ' : '') + (r ? r + ' мин' : ''); };
const K5 = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];
function render() {
  P = compute();
  if (!P) return;
  $('#cityName').textContent = city.ru; $('#cityDate').textContent = ' · ' + P.d + ' ' + MONTHS[P.m - 1];
  try { const hj = NZ.hijri('ru', P.y, P.m, P.d); if (hj) $('#hijri').textContent = hj; } catch (e) {}
  $$('#times div').forEach(el => { const k = el.dataset.k; el.querySelector('span').textContent = hm(P.t[k]); el.classList.toggle('now', k === P.focus); });
  $('#cdLb').textContent = P.cur ? NAMES[P.cur] + ' закрывается через' : 'До Зухра';
  $('#cdSub').textContent = P.next === 'fajr' ? `Фаджр в ${hm(P.nextAt)}` : `${NAMES[P.next]} в ${hm(P.nextAt)}`;
  if (!marked) { $('#holdT').textContent = 'Прочитал ' + ACC[P.focus]; }
  $('#fhold span').lastChild.textContent = 'Удерживайте: прочитал ' + ACC[P.focus];
  /* бенто: список времени */
  $('#tl').innerHTML = K5.map(k => `<div class="${k === P.focus ? 'now' : ''}"><b>${NAMES[k]}</b><span>${hm(P.t[k])}</span></div>`).join('');
  /* экран блокировки */
  const nk = P.next, nAt = P.nextAt;
  $('#wN').textContent = NAMES[nk]; $('#wT').textContent = hm(nAt);
  $('#w2').innerHTML = K5.map(k => `<span>${NAMES[k]}</span><b style="font-size:inherit;display:inline">${hm(P.t[k])}</b>`).join('');
  $('#iName').textContent = $('#iName2').textContent = NAMES[P.focus];
  $('#laN').textContent = P.cur ? NAMES[P.cur] + ' закрывается через' : 'До Зухра'; $('#laF').textContent = hm(P.start); $('#laT').textContent = hm(P.end);
  $('#iFrom').textContent = hm(P.start); $('#iTo').textContent = (P.cur ? NAMES[P.next] + ' ' : '') + hm(P.end);
  /* кибла */
  const toR = x => x * Math.PI / 180, la1 = toR(city.lat), la2 = toR(21.4225), dl = toR(39.8262 - city.lon);
  const br = (Math.atan2(Math.sin(dl) * Math.cos(la2), Math.cos(la1) * Math.sin(la2) - Math.sin(la1) * Math.cos(la2) * Math.cos(dl)) * 180 / Math.PI + 360) % 360;
  $('#qdeg').textContent = Math.round(br) + '°'; $('#needle').style.transform = `rotate(${br}deg)`;
}
function tick() {
  const d = new Date(); $('#clock').textContent = d.getHours() + ':' + pad(d.getMinutes());
  if (!P) return;
  let ms = P.end - Date.now(); if (ms < 0) { render(); ms = P.end - Date.now(); }
  $('#cdNum').textContent = fmtLeft(ms);
  $('#iCd').textContent = $('#iCd2').textContent = fmtIsl(ms);
  $('#iPg').style.width = $('#laPg').style.width = Math.min(100, Math.max(2, (Date.now() - P.start) / (P.end - P.start) * 100)) + '%';
  $('#laCd').textContent = fmtIsl(ms);
  $('#wIn').textContent = 'через ' + inWords(P.nextAt - Date.now());
  const tzNow = new Date(new Date().toLocaleString('en-US', { timeZone: city.tz }));
  $('#lclock').textContent = tzNow.getHours() + ':' + pad(tzNow.getMinutes());
  $('#ldate').textContent = WD[tzNow.getDay()] + ', ' + tzNow.getDate() + ' ' + MONTHS[tzNow.getMonth()];
}
const sel = $('#citySel');
const groups = {}; CITIES.forEach(c => (groups[c.country] = groups[c.country] || []).push(c));
sel.innerHTML = Object.keys(groups).map(g => `<optgroup label="${g}">${groups[g].map(c => `<option value="${c.slug}"${c.slug === city.slug ? ' selected' : ''}>${c.ru}</option>`).join('')}</optgroup>`).join('');
sel.addEventListener('change', () => { city = bySlug(sel.value); store.set('v8city', city.slug); render(); tick(); });
let marked = false;
render(); tick(); setInterval(tick, 1000);

/* ═════════ 1. ПЕРВЫЙ ЭКРАН: «Напомнить» и «Прочитал» ═════════ */
const toastp = $('#toastp'); let tT;
const toast = h => { toastp.innerHTML = h; toastp.classList.add('on'); clearTimeout(tT); tT = setTimeout(() => toastp.classList.remove('on'), 2600); };
const push = $('#push'), remind = $('#remind'), rs = $$('#ppl [data-r]');
let playing = false, played = 0;
function playRemind(auto) {
  if (playing) return; playing = true; played++;
  if (!auto) buzz(12);
  rs.forEach((p, i) => setTimeout(() => p.classList.add('sent'), i * 140));
  remind.classList.add('done'); remind.querySelector('span').textContent = 'Отправлено';
  const k = P ? P.focus : 'asr', left = P ? inWords(P.end - Date.now()) : '1 ч 12 мин';
  $('#pushT').textContent = P && P.cur ? `Брат напомнил: вас ждут на ${ACC[k]}. Осталось ${left}. Мама и Али уже прочитали.` : `Брат напомнил: скоро ${NAMES[k]}. Встанем вместе?`;
  setTimeout(() => { push.classList.add('on'); $('#dim').classList.add('on'); $('#hintT').textContent = 'Так напоминание видит Юсуф'; $('#hint').style.opacity = 1; }, 350);
  setTimeout(() => { rs[0].classList.remove('sent'); rs[0].classList.add('ok'); toast(use('p-check-circle-fill') + 'Юсуф прочитал ' + ACC[k]); $('#closeCount').textContent = 'Прочитали 3 из 4'; }, 4100);
  setTimeout(() => { push.classList.remove('on'); $('#dim').classList.remove('on'); $('#hintT').textContent = 'Юсуф встал на намаз'; }, 3700);
  setTimeout(() => { rs.forEach(p => p.classList.remove('sent', 'ok')); remind.classList.remove('done'); remind.querySelector('span').textContent = 'Напомнить · 2'; $('#closeCount').textContent = 'Прочитали 2 из 4'; $('#hintT').textContent = 'Нажмите «Напомнить» в телефоне сами'; playing = false; }, 8600);
}
remind.addEventListener('click', () => playRemind(false));
if (!RM) setTimeout(() => { if (!played && scrollY < innerHeight * .5) playRemind(true); }, 1700);
(() => {
  const h = $('#hold'), p = h.querySelector('.p'); let raf, t0;
  const stop = () => { cancelAnimationFrame(raf); if (!marked) p.style.strokeDashoffset = 113; };
  const step = () => { const k = Math.min(1, (performance.now() - t0) / 900); p.style.strokeDashoffset = 113 * (1 - k); if (k < 1) raf = requestAnimationFrame(step); else done(); };
  const done = () => { marked = true; buzz([10, 40, 18]); h.classList.add('ok'); $('#holdT').textContent = 'Отмечено · ' + NAMES[P ? P.focus : 'asr']; $('#holdS').textContent = 'близкие видят'; $('[data-me]').classList.add('ok'); toast(use('t-prayer-f') + 'Близкие увидят: вы прочитали'); };
  const go = e => { if (marked) return; e.preventDefault(); t0 = performance.now(); raf = requestAnimationFrame(step); };
  h.addEventListener('pointerdown', go); ['pointerup', 'pointerleave', 'pointercancel'].forEach(ev => h.addEventListener(ev, stop));
  h.addEventListener('keydown', e => { if ((e.key === ' ' || e.key === 'Enter') && !e.repeat) go(e); }); h.addEventListener('keyup', stop);
})();

/* ═════════ 2. БУРЯ УВЕДОМЛЕНИЙ ═════════ */
const NOTES = [
  ['#e1306c', 'p-heart-fill', 'Соцсеть', 'Вашу историю посмотрели 48 человек'],
  ['#ff7a00', 'p-storefront', 'Магазин', 'Скидки до 70%. Только сегодня до полуночи'],
  ['#111', 'p-film-strip', 'Ролики', 'Вы пропустили 12 новых видео'],
  ['#5865f2', 'p-game-controller', 'Игра', 'Ваша энергия восстановилась. Играть?'],
  ['#2f80ed', 'p-globe-hemisphere-east', 'Новости', 'Скандал дня: все обсуждают это'],
  ['#3d6', 'p-chat-circle-dots', 'Чат', '38 непрочитанных в «Работа и всё такое»'],
  ['#e5484d', 'p-youtube-logo', 'Видео', 'Новая серия уже доступна'],
];
const ns = $('#nstack');
function storm() {
  ns.innerHTML = '';
  const els = NOTES.map(([c, ic, a, t], i) => { const d = document.createElement('div'); d.className = 'nt'; d.innerHTML = `<i style="background:${c}">${use(ic)}</i><b>${a}<small>${i ? i * 3 + ' мин' : 'сейчас'}</small></b><p>${t}</p>`; d.style.opacity = 0; d.style.transform = 'translateY(-30px) scale(.95)'; ns.appendChild(d); return d; });
  const g = document.createElement('div'); g.className = 'nt gold'; g.innerHTML = `<i><img src="i/s-brat.webp" alt=""></i><b>Юсуф · Firdausly<small>сейчас</small></b><p>Аср через 20 минут. Я уже прочитал, ты как? Встанем вместе.</p>`; g.style.opacity = 0; g.style.transform = 'translateY(40px) scale(.9)'; ns.appendChild(g);
  const place = () => els.forEach((d, i) => { const j = els.length - 1 - i; d.style.top = 0; d.style.zIndex = 10 + i; d.style.opacity = j > 3 ? 0 : 1; d.style.transform = `translateY(${j * 66}px) scale(${1 - j * .03})`; });
  if (RM) { place(); els.forEach(d => { d.style.opacity = .25; d.style.filter = 'blur(1px)'; }); g.style.cssText += ';opacity:1;transform:none;top:160px;z-index:40'; return; }
  els.forEach((d, i) => setTimeout(() => { d.style.top = 0; d.style.zIndex = 10 + i; const shown = els.slice(0, i + 1); shown.forEach((x, k) => { const j = i - k; x.style.opacity = j > 3 ? 0 : 1 - j * .12; x.style.transform = `translateY(${j * (innerWidth < 600 ? 74 : 66)}px) scale(${1 - j * .03})`; }); }, 260 * i));
  const T = 260 * els.length + 700;
  setTimeout(() => els.forEach((d, i) => { d.style.opacity = i > 3 ? .14 : .1; d.style.filter = 'blur(3px) saturate(0)'; d.style.transform = `translateY(${250 + (els.length - i) * 20}px) scale(.86)`; }), T);
  setTimeout(() => { g.style.top = '120px'; g.style.zIndex = 40; g.style.opacity = 1; g.style.transform = 'none'; buzz(15); }, T + 350);
}
once(ns, storm, .45);
$('#replay').addEventListener('click', storm);

/* ═════════ 3. БЛИЗКИЕ: день ═════════ */
const PPL = [['Мама', 'mama'], ['Папа', 'papa'], ['Али', 'ali'], ['Юсуф', 'brat'], ['Марьям', 'sestra2'], ['Дядя Ахмад', 'dyadya']];
const READ = [[0, 1, 2, 4], [0, 1, 2, 3, 4, 5], [0, 2, 4], [0, 1, 2, 3, 4, 5], [0, 1, 3]];
const peopleEl = $('#people'), dayR = $('#dayR'), sentTo = new Set();
function drawDay() {
  const i = +dayR.value, k = K5[i], read = READ[i];
  dayR.style.setProperty('--p', i * 25 + '%'); $('#blizkie').dataset.k = i;
  $$('#dmarks span').forEach((s, j) => s.classList.toggle('on', j === i));
  $('#prNm').firstChild.textContent = NAMES[k];
  $('#prSub').textContent = `Прочитали ${read.length} из ${PPL.length}. ` + (read.length < PPL.length ? 'Кто не успел, тому можно напомнить.' : 'Все свои успели. Альхамдулиллях.');
  peopleEl.innerHTML = PPL.map(([n, s], j) => { const ok = read.includes(j) || sentTo.has(i + ':' + j + ':ok'), sent = sentTo.has(i + ':' + j); return `<div class="pe${ok ? ' ok' : ''}${sent && !ok ? ' sent' : ''}"><div class="a"><img src="i/s-${s}.webp" alt="" loading="lazy"></div>${n}<small>${ok ? (sent ? 'прочитал после напоминания' : 'прочитал ' + hm(new Date((P ? +P.t[k] : Date.now()) + (j * 7 + 4) * 60000))) : sent ? 'открытка отправлена' : `<button type="button" data-j="${j}">Напомнить</button>`}</small></div>`; }).join('');
}
dayR.addEventListener('input', () => { drawDay(); buzz(6); });
peopleEl.addEventListener('click', e => { const b = e.target.closest('button[data-j]'); if (!b) return; const i = +dayR.value, j = +b.dataset.j; sentTo.add(i + ':' + j); buzz(10); drawDay(); setTimeout(() => { sentTo.add(i + ':' + j + ':ok'); if (+dayR.value === i) drawDay(); }, 1800); });
drawDay();
once(dayR, () => { if (RM) return; let v = 0; dayR.value = 0; drawDay(); const s = setInterval(() => { v++; dayR.value = v; drawDay(); if (v >= 2) clearInterval(s); }, 650); }, .8);

/* ═════════ 4. ФАДЖР: потянуть «Стоп» ═════════ */
(() => {
  const sec = $('#fajr'), sl = $('#slide'), k = sl.querySelector('.k'); let x0 = null, max = 0, cur = 0, fin = false;
  const set = p => { cur = Math.max(0, Math.min(1, p)); k.style.transform = `translateX(${cur * max}px)`; sec.style.setProperty('--d', cur); k.setAttribute('aria-valuenow', Math.round(cur * 100)); };
  const finish = () => { fin = true; set(1); buzz([12, 50, 12]); sec.classList.add('up'); sl.querySelector('span').textContent = 'Доброе утро'; $('#alS').textContent = 'Будильник выключен · вы встали'; $$('#who div').forEach((d, i) => setTimeout(() => d.classList.add('on'), 250 + i * 420)); };
  k.addEventListener('pointerdown', e => { if (fin) return; max = sl.clientWidth - k.offsetWidth - 2 * k.offsetLeft; x0 = e.clientX - cur * max; k.setPointerCapture(e.pointerId); });
  k.addEventListener('pointermove', e => { if (x0 === null) return; set((e.clientX - x0) / max); });
  const up = () => { if (x0 === null) return; x0 = null; if (cur > .82) finish(); else { k.style.transition = 'transform .4s var(--e)'; set(0); setTimeout(() => k.style.transition = '', 400); } };
  k.addEventListener('pointerup', up); k.addEventListener('pointercancel', up);
  k.addEventListener('keydown', e => { if (fin) return; max = sl.clientWidth - k.offsetWidth - 2 * k.offsetLeft; if (e.key === 'ArrowRight') { set(cur + .2); if (cur > .82) finish(); } if (e.key === 'ArrowLeft') set(cur - .2); if (e.key === 'Enter' || e.key === ' ') finish(); });
  if (P) $('#alS').textContent = 'Фаджр в ' + hm(P.next === 'fajr' ? P.nextAt : P.tm.fajr) + ' · вставайте';
})();

/* ═════════ 5. ФОКУС ═════════ */
(() => {
  const sec = $('#focus'), sw = $('#fsw'), fh = $('#fhold'), st = $('#fstate'); let raf, t0;
  const on = v => { sec.classList.toggle('on', v); sw.setAttribute('aria-checked', v); fh.disabled = !v; buzz(8);
    st.innerHTML = v ? `Закрыто. Идёт <b>${NAMES[P ? P.focus : 'asr']}</b>. Отметьте намаз, и всё откроется.` : 'Включите Фокус: так выглядит телефон, когда приходит время намаза.'; };
  sw.addEventListener('click', () => on(sw.getAttribute('aria-checked') !== 'true'));
  const stop = () => { cancelAnimationFrame(raf); fh.style.setProperty('--h', 0); };
  const step = () => { const p = Math.min(1, (performance.now() - t0) / 1000); fh.style.setProperty('--h', p); if (p < 1) raf = requestAnimationFrame(step); else { stop(); on(false); buzz([10, 40, 20]); st.innerHTML = '<b>Намаз отмечен.</b> Приложения открылись. Пусть Аллах примет.'; } };
  fh.addEventListener('pointerdown', e => { e.preventDefault(); t0 = performance.now(); raf = requestAnimationFrame(step); });
  ['pointerup', 'pointerleave', 'pointercancel'].forEach(ev => fh.addEventListener(ev, stop));
  fh.addEventListener('keydown', e => { if ((e.key === ' ' || e.key === 'Enter') && !e.repeat) { e.preventDefault(); t0 = performance.now(); raf = requestAnimationFrame(step); } }); fh.addEventListener('keyup', stop);
  once(sec.querySelector('.apps'), () => { if (!RM) setTimeout(() => { if (sw.getAttribute('aria-checked') !== 'true') on(true); }, 900); }, .6);
})();

/* ═════════ 6. REMINDERS: настоящие ролики @firdausly ═════════ */
const REELS = '__REELS__';
(() => {
  const rail = $('#rail'); let soundOn = false, active = null, inView = false;
  const card = (r, i) => `<article class="rl" data-i="${i}" data-bg="v/${r.id}.webp" aria-label="Ролик ${i + 1}">
    <div class="rtop"><span>Reminders</span><span>Подписки</span></div>
    <button class="snd" type="button" aria-label="Звук">${use('p-speaker-slash')}</button>
    <div class="side"><span class="lk">${use('r-like')}</span><span>${use('r-comment')}</span><span>${use('r-repost')}</span><span>${use('r-share')}</span><span>${use('r-save')}</span></div>
    <div class="cap"><b><img src="i/icon.webp" alt="">firdausly<em>Подписаться</em></b><p>${r.cap}</p></div>
    <svg class="heart"><use href="#r-like-fill"/></svg><div class="bar"><i></i></div></article>`;
  const wait = `<article class="rl wait" data-i="w">${use('p-hands-praying')}<b>Время Магриба</b><p>Лента подождёт. Вернётесь после намаза, ролик будет здесь.</p><span class="btn btn-p">Отметить намаз</span></article>`;
  rail.innerHTML = REELS.map((r, i) => card(r, i) + (i === 4 ? wait : '')).join('');
  const cards = $$('.rl', rail);
  once(rail, () => cards.forEach(c => { if (c.dataset.bg) c.style.backgroundImage = `url(${c.dataset.bg})`; }), 0);
  const vid = c => { let v = c.querySelector('video'); if (!v && c.dataset.i !== 'w') { const r = REELS[+c.dataset.i]; v = document.createElement('video'); v.muted = !soundOn; v.loop = true; v.playsInline = true; v.setAttribute('playsinline', ''); v.preload = 'auto'; v.poster = `v/${r.id}.webp`; v.src = `v/${r.id}.mp4`; c.prepend(v); const bar = c.querySelector('.bar i'); v.addEventListener('timeupdate', () => { if (v.duration) bar.style.width = (v.currentTime / v.duration * 100) + '%'; }); } return v; };
  const activate = c => {
    if (active === c) { return; } active = c;
    cards.forEach(x => { x.classList.toggle('on', x === c); if (x !== c) { const v = x.querySelector('video'); if (v) { v.pause(); const far = Math.abs((+x.dataset.i || 0) - (+c.dataset.i || 0)) > 2; if (far) { v.removeAttribute('src'); v.load(); v.remove(); } } } });
    if (inView && !RM) { const v = vid(c); if (v) { v.muted = !soundOn; v.play().catch(() => {}); } }
  };
  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) activate(e.target); }), { root: rail, rootMargin: '0px -49% 0px -49%', threshold: 0 });
  cards.forEach(c => io.observe(c));
  new IntersectionObserver(([e]) => { inView = e.isIntersecting; const v = active && active.querySelector('video'); if (!inView && v) v.pause(); else if (inView && active && !RM) { const vv = vid(active); vv && vv.play().catch(() => {}); } }, { threshold: .35 }).observe(rail);
  let lastTap = 0;
  rail.addEventListener('click', e => {
    const c = e.target.closest('.rl'); if (!c || c.dataset.i === 'w') return;
    if (c !== active) { c.scrollIntoView({ behavior: RM ? 'auto' : 'smooth', block: 'nearest', inline: 'center' }); return; }
    const now = Date.now();
    if (now - lastTap < 300) { const h = c.querySelector('.heart'); h.classList.remove('go'); void h.getBoundingClientRect(); h.classList.add('go'); const lk = c.querySelector('.lk'); lk.classList.add('liked'); lk.innerHTML = use('r-like-fill'); buzz(12); lastTap = 0; return; }
    lastTap = now;
    setTimeout(() => { if (lastTap !== now) return; const v = vid(c); soundOn = !soundOn; $$('.rl .snd').forEach(b => b.innerHTML = use(soundOn ? 'p-speaker-high' : 'p-speaker-slash')); if (v) { v.muted = !soundOn; v.play().catch(() => {}); } }, 300);
  });
  const by = d => { const w = cards[0].offsetWidth + 18; rail.scrollBy({ left: d * w, behavior: RM ? 'auto' : 'smooth' }); };
  $('#rPrev').addEventListener('click', () => by(-1)); $('#rNext').addEventListener('click', () => by(1));
  /* стартуем со второго ролика, чтобы слева было видно, что лента листается */
  requestAnimationFrame(() => { const off = c => c.offsetLeft - (rail.clientWidth - c.offsetWidth) / 2; const c = cards.find((x, i) => i >= 1 && off(x) >= 0) || cards[1]; rail.scrollLeft = off(c); });
})();

/* ═════════ 7. УММА: перевод и «Амин» ═════════ */
(() => {
  const pt = $('#pt'), b = $('#trB'); let tr = false;
  const TXT = ['Sabah namazına kalkmak zor geliyordu. Kardeşimle birbirimizi uyandırmaya başladık. Üç haftadır kaçırmadık, elhamdülillah.', 'Вставать на Фаджр было тяжело. Мы с братом начали будить друг друга. Три недели не пропускаем, альхамдулиллях.'];
  b.addEventListener('click', () => { tr = !tr; pt.classList.add('fade'); buzz(6); setTimeout(() => { pt.textContent = TXT[+tr]; pt.lang = tr ? 'ru' : 'tr'; pt.classList.remove('fade'); }, 220); b.querySelector('span').textContent = tr ? 'Показать оригинал' : 'Показать перевод'; $('#trF').textContent = tr ? 'переведено с турецкого' : 'турецкий'; });
  const st = $('#stage'), a = $('#amin'); let n = 0;
  a.addEventListener('click', e => {
    n++; buzz(8); $('#aminN').textContent = n === 1 ? 'Вы сказали «Амин». Ведущий это видит' : `«Амин» × ${n}`;
    if (RM) return;
    const r = st.getBoundingClientRect(), br = a.getBoundingClientRect();
    for (let i = 0; i < 5; i++) { const s = document.createElementNS('http://www.w3.org/2000/svg', 'svg'); s.setAttribute('class', 'fly'); s.innerHTML = '<use href="#p-moon-stars"/>'; s.style.left = (br.left - r.left + br.width / 2 - 13 + (Math.random() * 40 - 20)) + 'px'; s.style.top = (br.top - r.top) + 'px'; s.style.setProperty('--x', (Math.random() * 120 - 60) + 'px'); s.style.setProperty('--r', (Math.random() * 60 - 30) + 'deg'); s.style.animationDelay = i * 90 + 'ms'; st.appendChild(s); setTimeout(() => s.remove(), 1900); }
  });
})();

/* ═════════ 8. МОМЕНТЫ: смахнуть ═════════ */
(() => {
  const box = $('#moments');
  const M = [['c-guremir', 'ali', 'Али', 'после Асра · Самарканд'], ['c-fountain', 'sestra1', 'Амина', 'после Зухра'], ['c-nile', 'papa', 'Папа', 'после Магриба'], ['c-samarkand', 'brat', 'Юсуф', 'после Фаджра']];
  box.innerHTML = M.map(([img, s, n, t]) => `<div class="mo" style="background-image:url(i/${img}-480.webp)"><div><b><img src="i/s-${s}.webp" alt="">${n}</b><small>${t}</small></div></div>`).join('');
  let cards = $$('.mo', box);
  const lay = () => cards.forEach((c, i) => { c.style.zIndex = 10 - i; c.style.transform = `translate(${i * 10}px,${i * -8}px) rotate(${i * 3}deg) scale(${1 - i * .04})`; c.style.opacity = i > 2 ? 0 : 1; });
  lay();
  let x0 = null, dx = 0;
  const top = () => cards[0];
  box.addEventListener('pointerdown', e => { x0 = e.clientX; dx = 0; top().style.transition = 'none'; box.setPointerCapture(e.pointerId); });
  box.addEventListener('pointermove', e => { if (x0 === null) return; dx = e.clientX - x0; top().style.transform = `translateX(${dx}px) rotate(${dx / 14}deg)`; });
  const end = () => { if (x0 === null) return; x0 = null; const c = top(); c.style.transition = ''; if (Math.abs(dx) > 60 || Math.abs(dx) < 4) { c.style.transform = `translateX(${(dx < 0 ? -1 : 1) * 320}px) rotate(${dx < 0 ? -20 : 20}deg)`; c.style.opacity = 0; buzz(8); setTimeout(() => { cards.push(cards.shift()); lay(); }, 280); } else lay(); };
  box.addEventListener('pointerup', end); box.addEventListener('pointercancel', end);
})();

/* ═════════ 9. СЁСТРАМ ═════════ */
$('#seg').addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; $$('#seg button').forEach(x => x.setAttribute('aria-pressed', x === b)); buzz(6); });
$$('#sisters .sw').forEach(s => s.addEventListener('click', () => { const v = s.getAttribute('aria-checked') !== 'true'; s.setAttribute('aria-checked', v); buzz(6);
  if (s.id === 'wali') { const r = $('#req'); r.style.transform = v ? 'translateX(14px) scale(.97)' : 'none'; $('#reqTo').innerHTML = v ? `<span style="display:inline-flex;gap:6px;align-items:center"><img src="i/s-papa.webp" alt="" style="width:22px;height:22px">ушёл к вали</span>` : 'запрос к вам'; } }));

/* ═════════ 10. БЕНТО: азан и тасбих ═════════ */
(() => {
  const w = $('#wave'), a = $('#adhanA'), b = $('#adhanB');
  const H = [30, 52, 40, 70, 46, 88, 60, 74, 96, 64, 80, 58, 90, 72, 50, 66, 84, 44, 62, 36, 48, 28];
  w.innerHTML = H.map(h => `<i style="--h:${h}"></i>`).join('');
  const bars = $$('i', w);
  b.addEventListener('click', () => { if (a.paused) { a.play().catch(() => {}); b.innerHTML = use('p-pause-fill'); } else { a.pause(); b.innerHTML = use('p-play-fill'); } });
  a.addEventListener('timeupdate', () => { const k = a.duration ? a.currentTime / a.duration : 0; bars.forEach((x, i) => x.classList.toggle('on', i / bars.length < k)); });
  a.addEventListener('ended', () => { b.innerHTML = use('p-play-fill'); bars.forEach(x => x.classList.remove('on')); });
  const t = $('#tas'), p = $('#tasP'), n = $('#tasN'), wd = $('#tasW'); let c = 0; const W = ['СубханАллах', 'Альхамдулиллях', 'Аллаху акбар'];
  const hit = () => { c = (c + 1) % 100; const r = c % 33 || (c ? 33 : 0); n.textContent = r; p.style.strokeDashoffset = 440 * (1 - r / 33); wd.textContent = W[Math.min(2, Math.floor((c - 1) / 33))] || W[0]; buzz(r === 33 ? [20, 40, 20] : 6); };
  t.addEventListener('click', hit); t.addEventListener('keydown', e => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); hit(); } });
})();

/* ═════════ 11. ОСТРОВ ═════════ */
(() => { const i = $('#island'); const t = () => { i.classList.toggle('open'); i.parentElement.classList.toggle('iso', i.classList.contains('open')); buzz(8); }; i.addEventListener('click', t); i.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); t(); } });
  once(i, () => { if (!RM) setTimeout(() => { if (!i.classList.contains('open')) t(); }, 700); }, .9); })();

/* ═════════ 12. КАРТИНЫ ═════════ */
(() => {
  const A = [['lions', 'Львы', 'Смелость, которая не боится'], ['plus', 'Вместе', 'Свои идут рядом'], ['gate', 'Врата', 'Хайбар'], ['road', 'Путь', 'Дорога домой'], ['sujud', 'Суджуд', 'Ближе всего к Нему'], ['storm', 'Буря', 'Зульфикар']];
  const acc = $('#acc');
  acc.innerHTML = A.map(([k, n, s], i) => `<button class="ac${i === 1 ? ' on' : ''}${i === 1 ? ' first' : ''}" type="button" data-k="${k}" aria-label="Картина «${n}»"><picture><source type="image/avif" srcset="i/${k}-${k === 'lions' ? 640 : 860}.avif"><img src="i/${k}-${k === 'lions' ? 640 : 860}.webp" alt="" loading="lazy"></picture><span>${n}<small>${s}</small></span>${i === 1 ? '<em class="tapme">Нажмите на картину</em>' : ''}</button>`).join('');
  const pick = b => { const t = $('.tapme', acc); if (t && b.dataset.k !== 'plus') t.remove(); $$('.ac', acc).forEach(x => x.classList.toggle('on', x === b)); const k = b.dataset.k, art = $('#homeArt'); art.removeAttribute('srcset'); art.parentElement.querySelector('source').srcset = `i/${k}-${k === 'lions' ? 640 : 480}.avif`; art.src = `i/${k}-${k === 'lions' ? 640 : 480}.webp`; buzz(6); };
  acc.addEventListener('click', e => { const b = e.target.closest('.ac'); if (b) pick(b); });
  if (matchMedia('(hover:hover)').matches) acc.addEventListener('mouseover', e => { const b = e.target.closest('.ac'); if (b && !b.classList.contains('on')) $$('.ac', acc).forEach(x => x.classList.toggle('on', x === b)); });
  $('#classic').innerHTML = ['guremir', 'cairo', 'fountain', 'samarkand', 'nile', 'mutawalli', 'caravan', 'terrace'].map(k => `<img src="i/c-${k}-480.webp" alt="" loading="lazy" height="120">`).join('');
})();

/* ═════════ 13. АВТОРАМ ═════════ */
(() => {
  const F = [['p-hand-waving', 'Пранк в метро'], ['p-music-notes', 'Танец под трендовый звук'], ['p-shopping-bag', 'Распаковка за 7 секунд'], ['p-coins', 'Реклама ставок'], ['you', 'Ваш аят'], ['p-sparkle', 'Чужая свадьба'], ['p-megaphone', 'Скандал дня'], ['p-game-controller', 'Стрим до трёх ночи']];
  const html = F.map(([i, t]) => i === 'you' ? `<div class="fi you">${use('t-reminders-f')}${t}</div>` : `<div class="fi">${use(i)}${t}</div>`).join('');
  $('#mq').innerHTML = html + html;
  const r = $('#flw'), v = $('#flwV'), out = $('#inc');
  const upd = () => { const f = +r.value; v.textContent = nf(f); const pay = Math.round(Math.round(f * .02) * .1); out.textContent = nf(pay * 533) + ' ₸'; r.style.setProperty('--p', ((f - 1000) / 4990) + '%'); };
  r.addEventListener('input', upd); upd();
})();

/* ═════════ ПАНЕЛЬ ВКЛАДОК ═════════ */
(() => {
  const dock = $('#dock'), links = $$('a', dock), hero = $('.hero'), fin = $('.fin'), foot = $('.foot');
  const vis = new Map();
  const io = new IntersectionObserver(es => { es.forEach(e => vis.set(e.target, e.isIntersecting)); dock.classList.toggle('on', !vis.get(hero) && !vis.get(fin) && !vis.get(foot) && !vis.get(stop)); }, { threshold: 0.02 });
  const stop = $('#authors');
  [hero, fin, foot].forEach(x => io.observe(x));
  const io3 = new IntersectionObserver(([e]) => { vis.set(stop, e.boundingClientRect.top < innerHeight); dock.classList.toggle('on', !vis.get(hero) && !vis.get(stop)); }, { threshold: 0 }); io3.observe(stop);
  const map = {}; links.forEach(a => a.dataset.s.split(' ').forEach(id => map[id] = a));
  const io2 = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) links.forEach(a => a.classList.toggle('on', a === map[e.target.id])); }), { rootMargin: '-45% 0px -50% 0px' });
  $$('main > section').forEach(el => io2.observe(el));
  links.forEach(a => a.addEventListener('click', () => buzz(6)));
})();

/* ═════════ 15. ЦЕНА ═════════ */
(() => {
  const TIERS = { KZ: ['3 790 ₸', '22 990 ₸', '1 916 ₸', 3790, 22990], MID: ['$4.99', '$29.99', '$2.50', 4.99, 29.99], GULF: ['$12.99', '$79.99', '$6.67', 12.99, 79.99], WEST: ['$9.99', '$59.99', '$5.00', 9.99, 59.99], EUR: ['€9.99', '€59.99', '€5.00', 9.99, 59.99], GBP: ['£8.99', '£54.99', '£4.58', 8.99, 54.99] };
  let tz = ''; try { tz = Intl.DateTimeFormat().resolvedOptions().timeZone || ''; } catch (e) {}
  const byCc = { KZ: 'KZ', KG: 'MID', UZ: 'MID', TJ: 'MID', RU: 'MID', AZ: 'MID', TR: 'MID', AE: 'GULF', GB: 'GBP', US: 'WEST' };
  const known = TZ[tz] && bySlug(TZ[tz]);
  const tier = known ? (byCc[known.cc] || 'WEST') : /^Europe\//.test(tz) ? 'EUR' : /^Asia\/(Riyadh|Qatar|Kuwait|Bahrain|Muscat|Dubai)/.test(tz) ? 'GULF' : 'WEST';
  const T = TIERS[tier];
  $('#save').textContent = '−' + Math.round((1 - T[4] / (T[3] * 12)) * 100) + '%';
  if (tier !== 'KZ') $('#fine').textContent = 'Цены для вашего региона. Точную цену в вашей валюте App Store покажет до оплаты.';
  const show = y => { $('#pAmt').textContent = y ? T[1] : T[0]; $('#pPer').textContent = y ? `в год · ${T[2]} в месяц` : 'в месяц'; $('#pAlt').textContent = y ? `или ${T[0]} помесячно` : `или ${T[1]} за год, выгоднее`; };
  $('#per').addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; $$('#per button').forEach(x => x.setAttribute('aria-pressed', x === b)); show(b.dataset.p === 'y'); buzz(6); });
  show(true);
})();

/* ═════════ ФИНАЛ: дней до Рамадана ═════════ */
(() => { const d = Math.ceil((Date.UTC(2027, 1, 8) - Date.now()) / 864e5); const el = $('#finD'); const pl = n => { const a = n % 10, b = n % 100; return a === 1 && b !== 11 ? 'день' : a >= 2 && a <= 4 && (b < 12 || b > 14) ? 'дня' : 'дней'; }; if (d > 1 && d < 200) el.textContent = `До Рамадана примерно ${d} ${pl(d)}`; else el.remove(); })();

/* ═════════ ЛИСТ ОЖИДАНИЯ ═════════ */
/* ВЫХОД В APP STORE: одна строка. false — кнопки ведут в лист ожидания, true — прямо в App Store. */
const LAUNCHED = false, STORE = 'https://apps.apple.com/app/id6806738733';
const SB = 'https://axpoadzhfvxzywotbvug.supabase.co', SBK = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF4cG9hZHpoZnZ4enl3b3RidnVnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc4NzQxMzksImV4cCI6MjEwMzQ1MDEzOX0.9Fjf93Ev1a0Yybol90CjKhmC5gQZt6QiTKK-6Xj91T8';
const dlg = $('#waitlist');
if (LAUNCHED) {
  $$('[data-store]').forEach(a => { a.href = STORE; a.rel = 'noopener'; });
  $$('[data-sl]').forEach(e => e.textContent = e.dataset.sl); $$('[data-pre]').forEach(e => e.textContent = 'для iPhone · в App Store');
} else if (dlg && dlg.showModal) {
  const open = e => { e.preventDefault(); dlg.showModal(); if (matchMedia('(hover:hover)').matches) setTimeout(() => $('#wl-in').focus(), 60); };
  $$('[data-store]').forEach(a => a.addEventListener('click', open));
  dlg.addEventListener('click', e => { if (e.target.closest('[data-close]')) return dlg.close(); if (e.target !== dlg) return; const r = dlg.getBoundingClientRect(); if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) dlg.close(); });
  const f = $('[data-wlf]'), inp = $('#wl-in'), btn = $('[data-wlb]'), msg = $('[data-wlm]');
  const say = (t, err) => { msg.textContent = t; msg.classList.toggle('err', !!err); inp.setAttribute('aria-invalid', err ? 'true' : 'false'); };
  if (store.get('wl6')) { dlg.classList.add('done'); say('Вы уже в списке. Напишем в день выхода.'); }
  f.addEventListener('submit', e => {
    e.preventDefault(); let v = inp.value.trim();
    if (!v) return say('Впишите почту или Telegram, например name@mail.ru или @username.', 1);
    if (/^[A-Za-z0-9_]{5,32}$/.test(v)) v = '@' + v;
    if (v.indexOf('@') < 0 && !/t(elegram)?\.me\//i.test(v)) return say('Не похоже на почту или Telegram. Проверьте, нет ли опечатки.', 1);
    btn.disabled = true; btn.textContent = 'Записываем…'; say('');
    fetch(SB + '/rest/v1/rpc/join_waitlist', { method: 'POST', headers: { apikey: SBK, Authorization: 'Bearer ' + SBK, 'Content-Type': 'application/json' }, body: JSON.stringify({ contact: v, lang: 'ru', source: location.pathname.slice(0, 120) }) })
      .then(r => r.ok ? r.json() : { ok: false, reason: 'net' })
      .then(r => {
        if (r && r.ok) { store.set('wl6', '1'); dlg.classList.add('done'); say('Записали. Напишем в день выхода.'); }
        else say(r && r.reason === 'format' ? 'Не похоже на почту или Telegram. Проверьте, нет ли опечатки.' : r && r.reason === 'busy' ? 'Сейчас записывается много людей. Попробуйте через минуту.' : 'Не получилось отправить. Проверьте интернет или напишите нам: support@firdausly.com', 1);
      })
      .catch(() => say('Не получилось отправить. Проверьте интернет или напишите нам: support@firdausly.com', 1))
      .then(() => { btn.disabled = false; btn.textContent = 'Напомнить в день выхода'; });
  });
}
});
