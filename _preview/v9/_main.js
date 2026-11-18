document.addEventListener('DOMContentLoaded', () => {
'use strict';
const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
const buzz = (n = 10) => { try { if (navigator.vibrate && navigator.userActivation && navigator.userActivation.hasBeenActive) navigator.vibrate(n); } catch (e) {} };
const store = { get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }, set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} } };
const EN = document.documentElement.lang === 'en', tr = (ru, en) => (EN ? en : ru);
const BASE = (document.querySelector('.logo img') || { getAttribute: () => 'i/icon.webp' }).getAttribute('src').replace(/i\/icon\.webp$/, '');
const use = (id, cls = '') => `<svg class="${cls}"><use href="#${id}"/></svg>`;
const once = (el, fn, th = .35) => { if (!el) return; if (!('IntersectionObserver' in window)) return fn(); const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { io.disconnect(); fn(); } }), { threshold: th }); io.observe(el); };
const pad = n => String(n).padStart(2, '0');
const nf = n => Math.round(n).toLocaleString('ru-RU').replace(/ /g, ' ');

/* ── шапка: стекло после первого экрана (наблюдатель, без scroll-слушателя) ── */
(() => { const top = $('#top'), s = document.createElement('div'); s.style.cssText = 'position:absolute;top:0;height:80px;width:1px'; document.body.prepend(s);
  new IntersectionObserver(([e]) => top.classList.toggle('on', !e.isIntersecting)).observe(s); })();

/* ═════════ 2. БУРЯ УВЕДОМЛЕНИЙ ═════════ */
const NOTES = [
  ['#e1306c', 'p-heart-fill', tr('Соцсеть', 'Social'), tr('Вашу историю посмотрели 48 человек', '48 people viewed your story')],
  ['#ff7a00', 'p-storefront', tr('Магазин', 'Shop'), tr('Скидки до 70%. Только сегодня до полуночи', 'Up to 70% off. Today only, until midnight')],
  ['#111', 'p-film-strip', tr('Ролики', 'Shorts'), tr('Вы пропустили 12 новых видео', 'You missed 12 new videos')],
  ['#5865f2', 'p-game-controller', tr('Игра', 'Game'), tr('Ваша энергия восстановилась. Играть?', 'Your energy is full. Play now?')],
  ['#2f80ed', 'p-globe-hemisphere-east', tr('Новости', 'News'), tr('Скандал дня: все обсуждают это', 'Everyone is talking about this')],
  ['#3d6', 'p-chat-circle-dots', tr('Чат', 'Chat'), tr('38 непрочитанных в «Работа и всё такое»', '38 unread in “Work and stuff”')],
  ['#e5484d', 'p-youtube-logo', tr('Видео', 'Video'), tr('Новая серия уже доступна', 'New episode is out')],
];
const ns = $('#nstack');
function storm() {
  ns.innerHTML = '';
  const els = NOTES.map(([c, ic, a, t], i) => { const d = document.createElement('div'); d.className = 'nt'; d.innerHTML = `<i style="background:${c}">${use(ic)}</i><b>${a}<small>${i ? i * 3 + tr(' мин', 'm') : tr('сейчас', 'now')}</small></b><p>${t}</p>`; d.style.opacity = 0; d.style.transform = 'translateY(-30px) scale(.95)'; ns.appendChild(d); return d; });
  const g = document.createElement('div'); g.className = 'nt gold'; g.innerHTML = `<i><img src="${BASE}i/s-brat.webp" alt=""></i><b>${tr('Юсуф', 'Yusuf')} · Firdausly<small>${tr('сейчас', 'now')}</small></b><p>${tr('Аср через 20 минут. Я уже прочитал, ты как? Встанем вместе.', 'Asr in 20 minutes. I have prayed, how about you? Let’s stand together.')}</p>`; g.style.opacity = 0; g.style.transform = 'translateY(40px) scale(.9)'; ns.appendChild(g);
  const place = () => els.forEach((d, i) => { const j = els.length - 1 - i; d.style.top = 0; d.style.zIndex = 10 + i; d.style.opacity = j > 3 ? 0 : 1; d.style.transform = `translateY(${j * 66}px) scale(${1 - j * .03})`; });
  if (RM) { place(); els.forEach(d => { d.style.opacity = .25; d.style.filter = 'blur(1px)'; }); g.style.cssText += ';opacity:1;transform:none;top:160px;z-index:40'; return; }
  els.forEach((d, i) => setTimeout(() => { d.style.top = 0; d.style.zIndex = 10 + i; const shown = els.slice(0, i + 1); shown.forEach((x, k) => { const j = i - k; x.style.opacity = j > 3 ? 0 : 1 - j * .12; x.style.transform = `translateY(${j * (innerWidth < 600 ? 74 : 66)}px) scale(${1 - j * .03})`; }); }, 260 * i));
  const T = 260 * els.length + 700;
  setTimeout(() => els.forEach((d, i) => { d.style.opacity = i > 3 ? .14 : .1; d.style.filter = 'blur(3px) saturate(0)'; d.style.transform = `translateY(${250 + (els.length - i) * 20}px) scale(.86)`; }), T);
  setTimeout(() => { g.style.top = '120px'; g.style.zIndex = 40; g.style.opacity = 1; g.style.transform = 'none'; buzz(15); }, T + 350);
}
once(ns, storm, .45);
$('#replay').addEventListener('click', storm);

/* ═════════ НАСТОЯЩИЕ ЭКРАНЫ: ролики играют, только когда видны ═════════ */
(() => {
  const vids = $$('video[data-src]');
  const io = new IntersectionObserver(es => es.forEach(e => { const v = e.target;
    if (e.isIntersecting) { if (!v.src) { v.src = v.dataset.src; } if (!RM) v.play().catch(() => {}); } else v.pause(); }), { threshold: .4, rootMargin: '200px 0px' });
  vids.forEach(v => io.observe(v));
  const amb = $('.stage-amb'); if (amb && !RM) once(amb.parentElement, () => { amb.src = amb.dataset.amb; amb.play().then(() => amb.classList.add('on')).catch(() => {}); }, .1);
})();

/* ═════════ ПЕРЕКЛЮЧАТЕЛИ ЭКРАНОВ (близкие, Фокус) ═════════ */
const showIn = (stack, i) => $$(':scope > .dev', stack).forEach((d, k) => { d.classList.toggle('on', k === i); const v = d.querySelector('video'); if (v && k === i && !RM) v.play().catch(() => {}); });
$$('[data-tabs]').forEach(tl => { const st = document.getElementById(tl.dataset.tabs); showIn(st, 0);
  let auto = setInterval(() => { const cur = +$('[aria-selected="true"]', tl).dataset.t; pick((cur + 1) % 3); }, 4200);
  const pick = i => { $$('button', tl).forEach(b => b.setAttribute('aria-selected', +b.dataset.t === i)); showIn(st, i); buzz(6); };
  tl.addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; clearInterval(auto); pick(+b.dataset.t); });
  if (RM) clearInterval(auto);
});
(() => { const sw = $('#fsw'), st = $('#focusTabs'); if (!sw || !st) return; showIn(st, 0);
  sw.addEventListener('click', () => { const on = sw.getAttribute('aria-checked') !== 'true'; sw.setAttribute('aria-checked', on); sw.firstChild.textContent = on ? tr('Время Асра', 'Asr time') : tr('Аср отмечен', 'Asr prayed'); showIn(st, on ? 0 : 1); buzz(8); }); })();

/* ═════════ 12. КАРТИНЫ ═════════ */
(() => {
  const A = [['lions', tr('Львы', 'Lions'), tr('Смелость, которая не боится', 'Courage without fear')], ['plus', tr('Вместе', 'Together'), tr('Свои идут рядом', 'Your people walk with you')], ['gate', tr('Врата', 'The Gate'), tr('Хайбар', 'Khaybar')], ['road', tr('Путь', 'The Road'), tr('Дорога домой', 'The way home')], ['sujud', tr('Суджуд', 'Sujud'), tr('Ближе всего к Нему', 'Closest to Him')], ['storm', tr('Буря', 'The Storm'), tr('Зульфикар', 'Zulfiqar')]];
  const acc = $('#acc');
  acc.innerHTML = A.map(([k, n, s], i) => `<button class="ac${i === 1 ? ' on' : ''}${i === 1 ? ' first' : ''}" type="button" data-k="${k}" aria-label="${tr("Картина", "Painting")} «${n}»"><picture><source type="image/avif" srcset="${BASE}i/${k}-${k === 'lions' ? 640 : 860}.avif"><img src="${BASE}i/${k}-${k === 'lions' ? 640 : 860}.webp" alt="" loading="lazy"></picture><span>${n}<small>${s}</small></span></button>`).join('');
  const pick = b => { $$('.ac', acc).forEach(x => x.classList.toggle('on', x === b)); buzz(6); };
  acc.addEventListener('click', e => { const b = e.target.closest('.ac'); if (b) pick(b); });
  if (matchMedia('(hover:hover)').matches) acc.addEventListener('mouseover', e => { const b = e.target.closest('.ac'); if (b && !b.classList.contains('on')) $$('.ac', acc).forEach(x => x.classList.toggle('on', x === b)); });
  $('#classic').innerHTML = ['guremir', 'cairo', 'fountain', 'samarkand', 'nile', 'mutawalli', 'caravan', 'terrace'].map(k => `<img src="${BASE}i/c-${k}-480.webp" alt="" loading="lazy" height="120">`).join('');
})();

/* ═════════ 13. АВТОРАМ ═════════ */
(() => {
  const F = [['p-hand-waving', tr('Пранк в метро', 'Subway prank')], ['p-music-notes', tr('Танец под трендовый звук', 'Dance to a trending sound')], ['p-shopping-bag', tr('Распаковка за 7 секунд', '7-second unboxing')], ['p-coins', tr('Реклама ставок', 'Betting ad')], ['you', tr('Ваш аят', 'Your ayah')], ['p-sparkle', tr('Чужая свадьба', 'A stranger’s wedding')], ['p-megaphone', tr('Скандал дня', 'Drama of the day')], ['p-game-controller', tr('Стрим до трёх ночи', 'Stream until 3 am')]];
  const html = F.map(([i, t]) => i === 'you' ? `<div class="fi you">${use('t-reminders-f')}${t}</div>` : `<div class="fi">${use(i)}${t}</div>`).join('');
  $('#mq').innerHTML = html + html;
})();

/* ═════════ 15. ЦЕНА ═════════ */
(() => {
  const TIERS = { KZ: ['3 790 ₸', '22 990 ₸', '1 916 ₸', 3790, 22990], MID: ['$4.99', '$29.99', '$2.50', 4.99, 29.99], GULF: ['$12.99', '$79.99', '$6.67', 12.99, 79.99], WEST: ['$9.99', '$59.99', '$5.00', 9.99, 59.99], EUR: ['€9.99', '€59.99', '€5.00', 9.99, 59.99], GBP: ['£8.99', '£54.99', '£4.58', 8.99, 54.99] };
  let tz = ''; try { tz = Intl.DateTimeFormat().resolvedOptions().timeZone || ''; } catch (e) {}
  const byCc = { KZ: 'KZ', KG: 'MID', UZ: 'MID', TJ: 'MID', RU: 'MID', AZ: 'MID', TR: 'MID', AE: 'GULF', GB: 'GBP', US: 'WEST' };
  const tzCc = { 'Asia/Almaty': 'KZ', 'Asia/Qyzylorda': 'KZ', 'Asia/Aqtobe': 'KZ', 'Asia/Aqtau': 'KZ', 'Asia/Atyrau': 'KZ', 'Asia/Oral': 'KZ', 'Asia/Qostanay': 'KZ', 'Asia/Bishkek': 'KG', 'Asia/Tashkent': 'UZ', 'Asia/Samarkand': 'UZ', 'Asia/Dushanbe': 'TJ', 'Europe/Moscow': 'RU', 'Asia/Yekaterinburg': 'RU', 'Asia/Baku': 'AZ', 'Europe/Istanbul': 'TR', 'Asia/Dubai': 'AE', 'Europe/London': 'GB', 'America/New_York': 'US' }[tz];
  const tier = tzCc ? (byCc[tzCc] || 'WEST') : /^Europe\//.test(tz) ? 'EUR' : /^Asia\/(Riyadh|Qatar|Kuwait|Bahrain|Muscat|Dubai)/.test(tz) ? 'GULF' : 'WEST';
  const T = TIERS[tier];
  $('#save').textContent = '−' + Math.round((1 - T[4] / (T[3] * 12)) * 100) + '%';
  if (tier !== 'KZ' || EN) $('#fine').textContent = tr('Цены для вашего региона. Точную цену в вашей валюте App Store покажет до оплаты.', 'Prices for your region. The App Store shows the exact price in your currency before you pay.');
  const show = y => { $('#pAmt').textContent = y ? T[1] : T[0]; $('#pPer').textContent = y ? tr(`в год · ${T[2]} в месяц`, `a year · ${T[2]} a month`) : tr('в месяц', 'a month'); const alt = $('#pAlt'); if (alt) alt.textContent = y ? tr(`или ${T[0]} помесячно`, `or ${T[0]} monthly`) : tr(`или ${T[1]} за год, выгоднее`, `or ${T[1]} a year, better value`); };
  $('#per').addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; $$('#per button').forEach(x => x.setAttribute('aria-pressed', x === b)); show(b.dataset.p === 'y'); buzz(6); });
  show(true);
})();

/* ═════════ ФИНАЛ: дней до Рамадана ═════════ */
(() => { const d = Math.ceil((Date.UTC(2027, 1, 8) - Date.now()) / 864e5); const el = $('#finD'); const pl = n => { const a = n % 10, b = n % 100; return a === 1 && b !== 11 ? 'день' : a >= 2 && a <= 4 && (b < 12 || b > 14) ? 'дня' : 'дней'; }; if (d > 1 && d < 200) el.textContent = EN ? `About ${d} days to Ramadan` : `До Рамадана примерно ${d} ${pl(d)}`; else el.remove(); })();

/* ═════════ APP STORE ═════════ */
/* ВЫХОД В APP STORE: одна строка. Листа ожидания нет: до выхода кнопки «Скоро в App Store» ведут на страницу приложения. */
const LAUNCHED = false, STORE = 'https://apps.apple.com/app/id6806738733';
$$('[data-store]').forEach(a => { a.href = STORE; a.target = '_blank'; a.rel = 'noopener'; if (LAUNCHED) { const l = a.querySelector('[data-sl]'); if (l) l.textContent = l.dataset.sl; } });
});
