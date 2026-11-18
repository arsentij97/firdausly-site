/* Firdausly v5 — общий скрипт превью: появление при прокрутке и переключатель направлений. */
(function () {
  'use strict';
  var els = document.querySelectorAll('.rv');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    els.forEach(function (el) { io.observe(el); });
  } else els.forEach(function (el) { el.classList.add('in'); });

  /* переключатель A / B / C внизу — только на превью */
  var here = location.pathname.match(/v5-([abc])/);
  var bar = document.createElement('nav');
  bar.className = 'pv-bar glass';
  bar.setAttribute('aria-label', 'Направления');
  ['a', 'b', 'c'].forEach(function (k) {
    var a = document.createElement('a');
    a.href = '/_preview/v5-' + k + '/';
    a.textContent = k.toUpperCase();
    if (here && here[1] === k) a.setAttribute('aria-current', 'page');
    bar.appendChild(a);
  });
  document.body.appendChild(bar);
})();
