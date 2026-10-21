/* =====================================================================
   ແຜງ "ສີສັນ ແລະໜ້າຕາ" — ແບບດຽວກັບລະບົບປ້ອນຄະແນນ (scoreM2)
   ເລືອກໄດ້: ສີຫຼັກ · ໂໝດ ສະຫວ່າງ/ມືດ/ອັດຕະໂນມັດ · ລາຍພື້ນຫຼັງ · ກັບຄືນຄ່າເລີ່ມຕົ້ນ
   ໃຊ້ໄດ້ທັງ ໜ້າຫຼັກ, ໜ້າ Login ແລະໜ້າພາຍໃນລະບົບ (ປຸ່ມ 🎨 ຫຼື ກົດຄ້າງທີ່ຫົວ Login)
   ໂຫຼດໃນ <head> ເພື່ອໃຫ້ສີຖືກໃສ່ກ່ອນສະແດງໜ້າ (ບໍ່ກະພິບ)
   ===================================================================== */
(function () {
  'use strict';
  var KEY = 'kct:theme2', OLD_KEY = 'kct_theme';
  var BASE = {
    light: { bg: '#f4f5f7', card: '#ffffff', ink: '#1d2330', mute: '#667085', line: '#e3e6ec', ok: '#157f3b', bad: '#c62828' },
    dark: { bg: '#14171c', card: '#1d2229', ink: '#e8ebf0', mute: '#9aa4b2', line: '#2c333d', ok: '#4cc27a', bad: '#ff7b7b' }
  };
  /* f = ສີໜ້າຫຼັກ (ໂໝດສະຫວ່າງ); kl/kd = [ສີຫຼັກ, ສີອ່ອນ, ສີໂຕໜັງສືເທິງສີຫຼັກ] */
  var ACC = {
    old: { n: 'ຄລາສສິກ', sw: '#168b83', f: null, kl: ['#1d6470', '#e0f0f1', '#ffffff'], kd: ['#4fb3bf', '#183a40', '#04201d'], lg: ['#2E5E5A', '#B8603F'], lgd: ['#1f4a47', '#8c4a31'], app: { clay: '#B8603F', teal: '#2E5E5A', gold: '#C9A24B' }, appd: { clay: '#e39a78', teal: '#6cc2b8', gold: '#C9A24B' } },
    blue: { n: 'ຟ້າ', sw: '#1f6feb', f: { n950: '#102a56', n900: '#1e40af', t700: '#2563eb', g500: '#60a5fa', g300: '#bfdbfe', paper: '#f4f8ff', ink: '#172554', muted: '#526581', line: '#cbdaf5' }, kl: ['#1f6feb', '#e8f0fe', '#ffffff'], kd: ['#5b9dff', '#26334a', '#0b1220'] },
    green: { n: 'ຂຽວ', sw: '#15803d', f: { n950: '#123b2a', n900: '#166534', t700: '#16a34a', g500: '#4ade80', g300: '#bbf7d0', paper: '#f3fbf5', ink: '#163326', muted: '#587164', line: '#cce8d3' }, kl: ['#15803d', '#e6f4ea', '#ffffff'], kd: ['#4ade80', '#1f3a2a', '#052e16'] },
    purple: { n: 'ມ່ວງ', sw: '#7c3aed', f: { n950: '#29134f', n900: '#581c87', t700: '#7c3aed', g500: '#a78bfa', g300: '#ddd6fe', paper: '#faf7ff', ink: '#2e1853', muted: '#6c5c82', line: '#e1d5f5' }, kl: ['#7c3aed', '#f0e9fe', '#ffffff'], kd: ['#a78bfa', '#2e2750', '#1a1033'] },
    orange: { n: 'ສົ້ມ', sw: '#ea580c', f: { n950: '#54200d', n900: '#9a3412', t700: '#ea580c', g500: '#fb923c', g300: '#fed7aa', paper: '#fff8f2', ink: '#4a2113', muted: '#806657', line: '#f2d5c2' }, kl: ['#ea580c', '#fdeedd', '#ffffff'], kd: ['#fb923c', '#3d2a1a', '#2a1204'] },
    pink: { n: 'ບົວ', sw: '#db2777', f: { n950: '#571338', n900: '#9d174d', t700: '#db2777', g500: '#f472b6', g300: '#fbcfe8', paper: '#fff6fb', ink: '#501634', muted: '#805d70', line: '#f3d0e1' }, kl: ['#db2777', '#fde7f1', '#ffffff'], kd: ['#f472b6', '#3d1f31', '#2a0a18'] },
    teal: { n: 'ຟ້າຂຽວ', sw: '#0f766e', f: { n950: '#0b3b38', n900: '#0f5c57', t700: '#0f766e', g500: '#2dd4bf', g300: '#ccfbf1', paper: '#f2fbf9', ink: '#123432', muted: '#55736f', line: '#c9e5e0' }, kl: ['#0f766e', '#e0f5f2', '#ffffff'], kd: ['#2dd4bf', '#183a37', '#04201d'] }
  };
  var MODES = [['auto', 'ອັດຕະໂນມັດ'], ['light', 'ສະຫວ່າງ'], ['dark', 'ມືດ']];
  var BGS = [['none', 'ເຣຽບ'], ['dots', 'ຈຸດ'], ['lines', 'ເສັ້ນ']];
  var FRONT_VARS = { n950: '--navy-950', n900: '--navy-900', t700: '--teal-700', g500: '--gold-500', g300: '--gold-300', paper: '--paper', ink: '--ink', muted: '--muted', line: '--line' };

  var mq = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;
  function get() {
    var t = {};
    try { t = JSON.parse(localStorage.getItem(KEY) || '{}') || {}; } catch (e) {}
    if (!t.accent) { /* ຍ້າຍຄ່າເກົ່າ (kct_theme: old/blue/green...) */
      try { var o = localStorage.getItem(OLD_KEY); if (o && ACC[o]) t.accent = o; } catch (e) {}
    }
    return t;
  }
  function save(t) { try { localStorage.setItem(KEY, JSON.stringify(t)); } catch (e) {} }
  function hexToRgb(h) { h = h.replace('#', ''); return [parseInt(h.substr(0, 2), 16), parseInt(h.substr(2, 2), 16), parseInt(h.substr(4, 2), 16)]; }

  function styleEl() {
    var el = document.getElementById('kctThemeVars');
    if (!el) { el = document.createElement('style'); el.id = 'kctThemeVars'; (document.head || document.documentElement).appendChild(el); }
    return el;
  }

  function apply() {
    var t = get(), key = ACC[t.accent] ? t.accent : 'old', mode = t.mode || 'auto', bg = t.bg || 'none';
    var dark = mode === 'dark' || (mode === 'auto' && mq && mq.matches);
    var A = ACC[key], base = dark ? BASE.dark : BASE.light, p = dark ? A.kd : A.kl;
    var root = document.documentElement, st = root.style;
    var custom = !(key === 'old' && !dark && bg === 'none');

    /* ຕົວແປສຳລັບຕາຕະລາງຄະແນນ/ແຜງ/ໜ້າ Login (--kv-*) */
    for (var k in base) st.setProperty('--kv-' + k, base[k]);
    st.setProperty('--kv-acc', p[0]); st.setProperty('--kv-hi', p[1]); st.setProperty('--kv-acc-ink', p[2]);
    var rgb = hexToRgb(base.card);
    st.setProperty('--kv-card-a', 'rgba(' + rgb[0] + ',' + rgb[1] + ',' + rgb[2] + ',.96)');
    var lg = A.lg ? (dark ? A.lgd : A.lg) : (dark ? [A.f.n900, A.f.t700] : [A.f.n900, A.f.t700]);
    st.setProperty('--lg-a', lg[0]); st.setProperty('--lg-b', lg[1]);

    /* ຕົວແປໜ້າຫຼັກ (--navy-950 ...) */
    root.removeAttribute('data-theme');
    var f = A.f ? A.f : null, keys = Object.keys(FRONT_VARS);
    keys.forEach(function (fk) { st.removeProperty(FRONT_VARS[fk]); });
    if (f) keys.forEach(function (fk) { st.setProperty(FRONT_VARS[fk], f[fk]); });
    if (dark) { st.setProperty('--paper', base.bg); st.setProperty('--ink', base.ink); st.setProperty('--muted', base.mute); st.setProperty('--line', base.line); }

    /* ຕົວແປພາຍໃນລະບົບ (#appSection) */
    var app;
    if (!custom) app = '';
    else {
      var cl, te, go;
      if (A.app) { var s = dark ? A.appd : A.app; cl = s.clay; te = s.teal; go = s.gold; }
      else { cl = dark ? p[0] : f.n900; te = dark ? p[0] : f.t700; go = dark ? f.g500 : f.g500; }
      app = 'html #appSection{--cream:' + (dark ? base.bg : (A.f ? A.f.paper : '#FAF6EC')) + ';--ink:' + (dark ? base.ink : (A.f ? A.f.ink : '#2A2420')) + ';--line:' + (dark ? base.line : (A.f ? A.f.line : '#D8CEBB')) +
        ';--clay:' + cl + ';--teal:' + te + ';--gold:' + go + ';--app-tab:' + (dark ? p[1] : (A.f ? p[1] : '#F0EBDD')) + ';--app-mute:' + (dark ? base.mute : '#6b6259') + '}';
    }
    styleEl().textContent = app;

    if (custom) root.setAttribute('data-kct-custom', '1'); else root.removeAttribute('data-kct-custom');
    root.setAttribute('data-kct-mode', dark ? 'dark' : 'light');
    root.setAttribute('data-kct-bg', bg);
    st.setProperty('color-scheme', dark ? 'dark' : 'light');
    var m = document.querySelector('meta[name="theme-color"]'); if (m) m.setAttribute('content', f ? f.n950 : '#16352C');
  }
  function set(o) { var t = get(); for (var k in o) t[k] = o[k]; save(t); apply(); draw(); }
  function reset() { try { localStorage.removeItem(KEY); localStorage.removeItem(OLD_KEY); } catch (e) {} apply(); draw(); }

  /* ---------- ແຜງຄວບຄຸມ ---------- */
  var panel = null;
  function draw() {
    if (!panel) return;
    var t = get(), a = ACC[t.accent] ? t.accent : 'old', m = t.mode || 'auto', b = t.bg || 'none';
    panel.querySelector('.kct-th-body').innerHTML =
      '<div class="thl">ສີຫຼັກ</div><div class="thsw">' + Object.keys(ACC).map(function (k) {
        return '<button type="button" data-acc="' + k + '" title="' + ACC[k].n + '" aria-label="' + ACC[k].n + '" class="' + (a === k ? 'on' : '') + '" style="background:' + ACC[k].sw + '"></button>';
      }).join('') + '</div>' +
      '<div class="thl">ໂໝດສະຫວ່າງ / ມືດ</div><div class="thseg">' + MODES.map(function (x) { return '<button type="button" data-mode="' + x[0] + '" class="' + (m === x[0] ? 'on' : '') + '">' + x[1] + '</button>'; }).join('') + '</div>' +
      '<div class="thl">ລາຍພື້ນຫຼັງ</div><div class="thseg">' + BGS.map(function (x) { return '<button type="button" data-bg="' + x[0] + '" class="' + (b === x[0] ? 'on' : '') + '">' + x[1] + '</button>'; }).join('') + '</div>' +
      '<button type="button" class="threset" data-reset="1">ກັບຄືນຄ່າເລີ່ມຕົ້ນ</button>';
  }
  function ensurePanel() {
    if (panel) return panel;
    panel = document.createElement('div');
    panel.id = 'kctThemePanel'; panel.hidden = true; panel.setAttribute('role', 'dialog'); panel.setAttribute('aria-label', 'ສີສັນ ແລະໜ້າຕາ');
    panel.innerHTML = '<div class="kct-th-box"><div class="kct-th-head"><b>🎨 ສີສັນ ແລະໜ້າຕາ</b><button type="button" class="kct-th-x" data-close="1" aria-label="ປິດ">✕</button></div><div class="kct-th-body"></div></div>';
    panel.addEventListener('click', function (e) {
      if (e.target === panel) { close(); return; }
      var b = e.target.closest('button'); if (!b) return; var d = b.dataset;
      if (d.close) close(); else if (d.acc) set({ accent: d.acc }); else if (d.mode) set({ mode: d.mode }); else if (d.bg) set({ bg: d.bg }); else if (d.reset) reset();
    });
    document.body.appendChild(panel); draw();
    return panel;
  }
  function open() { ensurePanel(); draw(); panel.hidden = false; }
  function close() { if (panel) panel.hidden = true; }
  function toggle() { ensurePanel(); if (panel.hidden) open(); else close(); }

  /* ກົດຄ້າງ (≈0.6 ວິ) ເພື່ອເປີດແຜງສີ */
  function bindLongPress(el, ms) {
    if (!el || el._kctLP) return; el._kctLP = true; ms = ms || 600;
    var timer = null, sx = 0, sy = 0, fired = false;
    function start(e) { var pt = e.touches ? e.touches[0] : e; sx = pt.clientX; sy = pt.clientY; fired = false; clearTimeout(timer); timer = setTimeout(function () { fired = true; open(); if (navigator.vibrate) { try { navigator.vibrate(15); } catch (x) {} } }, ms); }
    function move(e) { var pt = e.touches ? e.touches[0] : e; if (Math.abs(pt.clientX - sx) + Math.abs(pt.clientY - sy) > 12) clearTimeout(timer); }
    function end() { clearTimeout(timer); }
    el.addEventListener('touchstart', start, { passive: true }); el.addEventListener('touchmove', move, { passive: true }); el.addEventListener('touchend', end); el.addEventListener('touchcancel', end);
    el.addEventListener('mousedown', start); el.addEventListener('mousemove', move); el.addEventListener('mouseup', end); el.addEventListener('mouseleave', end);
    el.addEventListener('contextmenu', function (e) { if (fired) e.preventDefault(); });
  }

  window.kctTheme = { get: get, set: set, reset: reset, apply: apply, open: open, close: close, toggle: toggle, bindLongPress: bindLongPress };
  /* ຮັກສາຊື່ຟັງຊັນເກົ່າໄວ້ (index.html ເດີມເອີ້ນ toggleThemePicker / applyTheme) */
  window.toggleThemePicker = toggle;
  window.applyTheme = function (name) { if (ACC[name]) set({ accent: name }); };
  window.restoreTheme = apply;

  apply();
  if (mq && mq.addEventListener) mq.addEventListener('change', function () { apply(); });
  window.addEventListener('storage', function (e) { if (e.key === KEY) { apply(); draw(); } });
  window.addEventListener('beforeprint', function () { document.documentElement.setAttribute('data-kct-mode', 'light'); document.documentElement.style.setProperty('color-scheme', 'light'); });
  window.addEventListener('afterprint', apply);
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') close(); });

  function wire() {
    /* ປຸ່ມ 🎨 ເທິງໜ້າຫຼັກ */
    var tg = document.getElementById('themeToggle'); if (tg) { tg.onclick = function (e) { e.stopPropagation(); toggle(); }; }
    /* ປຸ່ມ 🎨 ລອຍ: ສະແດງເມື່ອເປີດລະບົບນັກຮຽນ (ໜ້າ Login ແລະໜ້າພາຍໃນ) */
    var app = document.getElementById('appSection');
    if (app && !document.getElementById('kctThemeFab')) {
      var fab = document.createElement('button'); fab.id = 'kctThemeFab'; fab.type = 'button'; fab.textContent = '🎨'; fab.setAttribute('aria-label', 'ເລືອກສີສັນ');
      fab.addEventListener('click', toggle); app.appendChild(fab);
    }
    /* ກົດຄ້າງທີ່ຫົວໜ້າ Login ເພື່ອເປີດແຜງສີ */
    bindLongPress(document.getElementById('loginHead'));
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', wire); else wire();
})();
