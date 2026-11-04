/* ============================================================================
   Util — formatting, geo, DOM helpers. No dependencies.
   ========================================================================== */
(function () {
  'use strict';

  const RAD = Math.PI / 180;
  const R_EARTH_NM = 3440.065; // nautical miles

  const util = {};

  /* ------------------------------------------------------------------ geo */
  util.haversine = function (lat1, lon1, lat2, lon2) {
    const dLat = (lat2 - lat1) * RAD;
    const dLon = (lon2 - lon1) * RAD;
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(lat1 * RAD) * Math.cos(lat2 * RAD) * Math.sin(dLon / 2) ** 2;
    return 2 * R_EARTH_NM * Math.asin(Math.min(1, Math.sqrt(a)));
  };

  util.bearing = function (lat1, lon1, lat2, lon2) {
    const y = Math.sin((lon2 - lon1) * RAD) * Math.cos(lat2 * RAD);
    const x =
      Math.cos(lat1 * RAD) * Math.sin(lat2 * RAD) -
      Math.sin(lat1 * RAD) * Math.cos(lat2 * RAD) * Math.cos((lon2 - lon1) * RAD);
    return (Math.atan2(y, x) / RAD + 360) % 360;
  };

  /** Total distance of a [lat, lon] path, in nautical miles. */
  util.pathLength = function (pts) {
    let d = 0;
    for (let i = 1; i < pts.length; i++) d += util.haversine(pts[i - 1][0], pts[i - 1][1], pts[i][0], pts[i][1]);
    return d;
  };

  /* ------------------------------------------------------------ formatting */
  const nf = (v, d = 0) =>
    Number.isFinite(v)
      ? v.toLocaleString('fr-FR', { minimumFractionDigits: d, maximumFractionDigits: d })
      : '—';

  util.num = nf;
  util.one = (v) => nf(v, 1);
  util.two = (v) => nf(v, 2);
  util.int = (v) => nf(v, 0);

  util.nm = (v) => (Number.isFinite(v) ? `${nf(v, v < 100 ? 1 : 0)}` : '—');
  util.km = (nm) => (Number.isFinite(nm) ? `${nf(nm * 1.852, 0)} km` : '—');
  util.ms = (kn) => (Number.isFinite(kn) ? `${nf(kn * 0.514444, 1)} m/s` : '—');
  util.kn = (v) => (Number.isFinite(v) ? `${nf(v, 1)}` : '—');

  const CARD16 = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSO', 'SO', 'OSO', 'O', 'ONO', 'NO', 'NNO'];
  util.cardinal = (deg) => (Number.isFinite(deg) ? CARD16[Math.round(((deg % 360) + 360) % 360 / 22.5) % 16] : '—');
  util.cardinal8 = (deg) => (Number.isFinite(deg) ? ['N', 'NE', 'E', 'SE', 'S', 'SO', 'O', 'NO'][Math.round(((deg % 360) + 360) % 360 / 45) % 8] : '—');

  util.dms = function (lat, lon) {
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) return '—';
    const f = (v, pos, neg) => {
      const a = Math.abs(v);
      const d = Math.floor(a);
      const m = Math.floor((a - d) * 60);
      return `${d}°${String(m).padStart(2, '0')}′${pos && v >= 0 ? pos : neg}`;
    };
    return `${f(lat, 'N', 'S')} ${f(lon, 'E', 'O')}`;
  };

  const dtf = new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Paris' });
  const dtfShort = new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: 'short', timeZone: 'Europe/Paris' });
  const dtfTime = new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Paris' });
  const dtfFull = new Intl.DateTimeFormat('fr-FR', { weekday: 'short', day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Paris' });

  util.fmtDate = (iso) => {
    const d = typeof iso === 'number' ? new Date(iso) : new Date(iso);
    return isNaN(d) ? '—' : dtf.format(d).replace(':00', 'h00');
  };
  util.fmtDateShort = (iso) => {
    const d = new Date(iso);
    return isNaN(d) ? '—' : dtfShort.format(d);
  };
  util.fmtTime = (iso) => {
    const d = typeof iso === 'number' ? new Date(iso) : new Date(iso);
    return isNaN(d) ? '—' : dtfTime.format(d);
  };
  util.fmtFull = (iso) => {
    const d = new Date(iso);
    return isNaN(d) ? '—' : dtfFull.format(d);
  };

  /** "il y a 12 min" — honest, always relative to real data time. */
  util.ago = function (iso, withPrefix = true) {
    if (!iso) return '—';
    const d = typeof iso === 'number' ? iso * 1000 : Date.parse(iso);
    if (!Number.isFinite(d)) return '—';
    let s = (Date.now() - d) / 1000;
    const future = s < -60;
    s = Math.abs(s);
    let txt;
    if (s < 60) txt = `${Math.round(s)} s`;
    else if (s < 3600) txt = `${Math.round(s / 60)} min`;
    else if (s < 86400) {
      const h = Math.floor(s / 3600);
      const m = Math.round((s % 3600) / 60);
      txt = m ? `${h} h ${String(m).padStart(2, '0')}` : `${h} h`;
    } else {
      const d2 = Math.floor(s / 86400);
      const h = Math.round((s % 86400) / 3600);
      txt = h ? `${d2} j ${h} h` : `${d2} j`;
    }
    if (future) return `dans ${txt}`;
    return withPrefix ? `il y a ${txt}` : txt;
  };

  /** Duration formatting (h/min) for elapsed times. */
  util.duration = function (seconds) {
    if (!Number.isFinite(seconds)) return '—';
    const s = Math.abs(seconds);
    const d = Math.floor(s / 86400);
    const h = Math.floor((s % 86400) / 3600);
    const m = Math.floor((s % 3600) / 60);
    if (d) return `${d} j ${h} h ${String(m).padStart(2, '0')}`;
    if (h) return `${h} h ${String(m).padStart(2, '0')}`;
    return `${m} min`;
  };

  /** Signed delta with arrow. */
  util.delta = function (v, invert = false, digits = 0) {
    if (!Number.isFinite(v) || v === 0) return { cls: 'flat', txt: '—' };
    const good = invert ? v > 0 : v < 0;
    return { cls: good ? 'up' : 'down', txt: `${v > 0 ? '+' : '−'}${nf(Math.abs(v), digits)}` };
  };

  /** speed colour for the trail (knots) */
  util.speedColor = function (kn) {
    if (!Number.isFinite(kn)) return 'rgba(140,170,200,.55)';
    const stops = [
      [0, [90, 120, 160]],
      [6, [56, 150, 220]],
      [12, [62, 230, 176]],
      [18, [255, 212, 94]],
      [24, [255, 138, 61]],
      [32, [255, 77, 77]],
    ];
    let a = stops[0];
    let b = stops[stops.length - 1];
    for (let i = 1; i < stops.length; i++) {
      if (kn <= stops[i][0]) {
        a = stops[i - 1];
        b = stops[i];
        break;
      }
    }
    const t = Math.max(0, Math.min(1, (kn - a[0]) / (b[0] - a[0] || 1)));
    const c = a[1].map((x, i) => Math.round(x + (b[1][i] - x) * t));
    return `rgb(${c[0]},${c[1]},${c[2]})`;
  };

  util.rgb = (arr) => `rgb(${arr[0]},${arr[1]},${arr[2]})`;

  /* ------------------------------------------------------------------ DOM */
  util.$ = (sel, root = document) => root.querySelector(sel);
  util.$$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  util.el = function (tag, attrs = {}, html) {
    const n = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) {
      if (k === 'class') n.className = v;
      else if (k === 'dataset') Object.assign(n.dataset, v);
      else if (v !== null && v !== undefined) n.setAttribute(k, v);
    }
    if (html !== undefined) n.innerHTML = html;
    return n;
  };

  util.esc = (s) =>
    String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  util.toast = function (msg, kind = '') {
    const box = util.$('#toasts');
    if (!box) return;
    const t = util.el('div', { class: `toast ${kind ? 'toast--' + kind : ''}` }, msg);
    box.appendChild(t);
    setTimeout(() => {
      t.style.opacity = '0';
      t.style.transform = 'translateY(8px)';
      t.style.transition = 'all .3s';
      setTimeout(() => t.remove(), 320);
    }, 5200);
  };

  util.clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  util.debounce = function (fn, ms = 200) {
    let t;
    return function (...a) {
      clearTimeout(t);
      t = setTimeout(() => fn.apply(this, a), ms);
    };
  };

  util.lerp = (a, b, t) => a + (b - a) * t;

  /** index lookup in a sorted array of timestamps */
  util.idxAt = function (arr, t) {
    let lo = 0;
    let hi = arr.length - 1;
    if (t <= arr[0]) return 0;
    if (t >= arr[hi]) return hi;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (arr[mid] < t) lo = mid + 1;
      else hi = mid;
    }
    return lo;
  };

  /** Interpolate [lat,lon] at time t inside a track {t:[],lat:[],lon:[]} */
  util.trackAt = function (track, t) {
    if (!track || !track.t.length) return null;
    const i = util.idxAt(track.t, t);
    if (i === 0) return [track.t[0], track.lat[0], track.lon[0]];
    const t0 = track.t[i - 1];
    const t1 = track.t[i];
    const f = t1 === t0 ? 0 : util.clamp((t - t0) / (t1 - t0), 0, 1);
    return [
      t,
      util.lerp(track.lat[i - 1], track.lat[i], f),
      util.lerp(track.lon[i - 1], track.lon[i], f),
    ];
  };

  util.debounceFrame = function (fn) {
    let raf = null;
    return function () {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = null;
        fn();
      });
    };
  };

  util.isMobile = () => window.matchMedia('(max-width: 900px)').matches;

  window.util = util;
})();
