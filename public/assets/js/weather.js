/* ============================================================================
   Weather — Atlantic model grid (Open-Meteo) + wind particles, wave field,
   isobars and wind barbs rendered on a canvas above the map.
   Data: Open-Meteo (ECMWF/GFS/WAM). Always labelled "modèle".
   ========================================================================== */
(function () {
  'use strict';

  // Open-Meteo multi-coordinate requests pair latitude[i] with longitude[i]: the two
  // lists must have the SAME length (they are points, not a cartesian product).
  // 140 points x 3 days x 6 variables is validated (HTTP 200, ~540 kB).
  const GRID = {
    lat: [52, 48, 44, 40, 36, 32, 28, 24, 20, 16],
    lon: [-68, -64, -60, -56, -52, -48, -44, -40, -36, -32, -28, -24, -20, -16],
  };

  const W = {
    atmo: null, // grid payload
    marine: null,
    timeIdx: 0,
    times: [],
    layer: 'none',
    barbs: false,
    particles: [],
    raf: null,
    lastFrame: 0,
    loadedAt: null,
    loading: false,
    error: null,
    canvas: null,
    ctx: null,
    dpr: 1,
  };

  const API_ATMO = 'https://api.open-meteo.com/v1/forecast';
  const API_MARINE = 'https://marine-api.open-meteo.com/v1/marine';

  function qs(list) {
    return list.join(',');
  }

  /** Expand a {lat[], lon[]} grid into paired coordinate lists (lat-major order). */
  function gridPairs(grid) {
    const lat = [];
    const lon = [];
    for (let y = 0; y < grid.lat.length; y++) {
      for (let x = 0; x < grid.lon.length; x++) {
        lat.push(grid.lat[y]);
        lon.push(grid.lon[x]);
      }
    }
    return { lat, lon, n: lat.length };
  }

  W.load = async function () {
    if (W.loading) return;
    W.loading = true;
    W.error = null;
    W._retried = false;
    W.grid = null;
    const pairs = gridPairs(GRID);
    const lat = pairs.lat.join(',');
    const lon = pairs.lon.join(',');
    const common = `latitude=${lat}&longitude=${lon}&timezone=UTC&forecast_days=3`;
    const atmoUrl = `${API_ATMO}?${common}&hourly=${qs([
      'wind_speed_10m',
      'wind_direction_10m',
      'wind_gusts_10m',
      'pressure_msl',
      'cloud_cover',
      'temperature_2m',
    ])}&wind_speed_unit=kn`;
    const marineUrl = `${API_MARINE}?${common}&hourly=${qs([
      'wave_height',
      'wave_direction',
      'wave_period',
      'sea_surface_temperature',
    ])}`;
    W.urls = { atmo: atmoUrl, marine: marineUrl };
    try {
      const [a, m] = await Promise.all([
        fetch(atmoUrl).then(async (r) => {
          if (!r.ok) throw new Error(`atmo HTTP ${r.status} — ${(await r.text()).slice(0, 160)}`);
          return r.json();
        }),
        fetch(marineUrl)
          .then((r) => {
            if (!r.ok) throw new Error(`HTTP ${r.status}`);
            return r.json();
          })
          .catch((e) => {
            W.warn = `Vagues indisponibles (${e.message})`;
            return null;
          }),
      ]);
      const grid = Array.isArray(a) ? a : [a];
      const mgrid = m ? (Array.isArray(m) ? m : [m]) : [];
      if (!grid.length || !grid[0].hourly) throw new Error('réponse vide');
      const expected = (W.grid || GRID).lat.length * (W.grid || GRID).lon.length;
      if (grid.length !== expected) {
        throw new Error(`grille incomplète (${grid.length}/${expected} points)`);
      }
      W.atmo = grid;
      W.marine = mgrid;
      W.times = grid[0].hourly.time;
      // pick the hour closest to now
      const now = Date.now();
      let best = 0;
      let bestD = Infinity;
      W.times.forEach((t, i) => {
        const d = Math.abs(Date.parse(t + ':00Z') - now);
        if (d < bestD) {
          bestD = d;
          best = i;
        }
      });
      W.timeIdx = best;
      W.loadedAt = new Date().toISOString();
      W.ready = true;
      W.emit();
    } catch (e) {
      W.error = e.message;
      W.ready = false;
      // last resort: coarser grid on a shorter horizon, still real model data
      if (!W._retried && /HTTP 4\d\d/.test(e.message || '')) {
        W._retried = true;
        W.loading = false;
        return W.loadFallback();
      }
      W.emit();
    } finally {
      W.loading = false;
    }
  };

  /** Coarse real grid (every other point, 2 days) used if the full grid is refused. */
  W.loadFallback = async function () {
    const coarse = {
      lat: GRID.lat.filter((_, i) => i % 2 === 0),
      lon: GRID.lon.filter((_, i) => i % 2 === 0),
    };
    W.grid = coarse;
    const pairs = gridPairs(coarse);
    const common = `latitude=${pairs.lat.join(',')}&longitude=${pairs.lon.join(',')}&timezone=UTC&forecast_days=2`;
    const atmoUrl = `${API_ATMO}?${common}&hourly=wind_speed_10m,wind_direction_10m,wind_gusts_10m,pressure_msl,cloud_cover,temperature_2m&wind_speed_unit=kn`;
    const marineUrl = `${API_MARINE}?${common}&hourly=wave_height,wave_direction,wave_period,sea_surface_temperature`;
    try {
      const a = await fetch(atmoUrl).then((r) => {
        if (!r.ok) throw new Error(`atmo HTTP ${r.status}`);
        return r.json();
      });
      const m = await fetch(marineUrl)
        .then((r) => (r.ok ? r.json() : null))
        .catch(() => null);
      const grid = Array.isArray(a) ? a : [a];
      if (!grid.length || !grid[0].hourly) throw new Error('réponse vide');
      W.atmo = grid;
      W.marine = m ? (Array.isArray(m) ? m : [m]) : [];
      W.times = grid[0].hourly.time;
      const now = Date.now();
      let best = 0;
      let bestD = Infinity;
      W.times.forEach((t, i) => {
        const d = Math.abs(Date.parse(t + ':00Z') - now);
        if (d < bestD) {
          bestD = d;
          best = i;
        }
      });
      W.timeIdx = best;
      W.loadedAt = new Date().toISOString();
      W.ready = true;
      W.degraded = true;
      W.error = null;
      W.emit();
    } catch (e) {
      W.error = e.message;
      W.ready = false;
      W.emit();
    }
  };

  W.onChange = [];
  W.emit = function () {
    W.onChange.forEach((f) => {
      try {
        f(W);
      } catch (e) {
        console.error(e);
      }
    });
  };

  /* ------------------------------------------------------------ sampling */
  function activeGrid() {
    return W.grid || GRID;
  }

  function cellValue(grid, varName, gx, gy, idx) {
    const i = gy * activeGrid().lon.length + gx;
    const cell = grid[i];
    if (!cell || !cell.hourly || !cell.hourly[varName]) return null;
    const v = cell.hourly[varName][idx];
    return Number.isFinite(v) ? v : null;
  }

  /** Bilinear-ish sample of a scalar field at a geographic point (grid space). */
  function sampleField(grid, varName, lat, lon, idx) {
    const nLon = activeGrid().lon.length;
    const nLat = activeGrid().lat.length;
    for (let y = 0; y < nLat - 1; y++) {
      for (let x = 0; x < nLon - 1; x++) {
        const la0 = activeGrid().lat[y];
        const la1 = activeGrid().lat[y + 1];
        const lo0 = activeGrid().lon[x];
        const lo1 = activeGrid().lon[x + 1];
        if (lat <= la0 && lat >= la1 && lon >= lo0 && lon <= lo1) {
          const fx = (lon - lo0) / (lo1 - lo0);
          const fy = (la0 - lat) / (la0 - la1);
          const v00 = cellValue(grid, varName, x, y, idx);
          const v10 = cellValue(grid, varName, x + 1, y, idx);
          const v01 = cellValue(grid, varName, x, y + 1, idx);
          const v11 = cellValue(grid, varName, x + 1, y + 1, idx);
          if ([v00, v10, v01, v11].some((v) => v === null)) return v00 ?? v10 ?? v01 ?? v11;
          return (
            v00 * (1 - fx) * (1 - fy) + v10 * fx * (1 - fy) + v01 * (1 - fx) * fy + v11 * fx * fy
          );
        }
      }
    }
    return null;
  }

  /** Wind vector (km/h-ish units for animation) at lat/lon: returns {u,v,speed,dir} */
  W.vectorAt = function (lat, lon) {
    if (!W.atmo) return null;
    const i = W.timeIdx;
    const sp = sampleField(W.atmo, 'wind_speed_10m', lat, lon, i);
    const dir = sampleField(W.atmo, 'wind_direction_10m', lat, lon, i);
    if (sp === null || dir === null) return null;
    // meteorological direction = where the wind comes FROM
    const rad = (dir * Math.PI) / 180;
    return { speed: sp, dir, u: -Math.sin(rad) * sp, v: Math.cos(rad) * sp };
  };

  W.scalarAt = function (lat, lon, which) {
    if (!W.atmo) return null;
    const i = W.timeIdx;
    if (which === 'pressure') return sampleField(W.atmo, 'pressure_msl', lat, lon, i);
    if (which === 'gust') return sampleField(W.atmo, 'wind_gusts_10m', lat, lon, i);
    if (which === 'cloud') return sampleField(W.atmo, 'cloud_cover', lat, lon, i);
    if (which === 'temp') return sampleField(W.atmo, 'temperature_2m', lat, lon, i);
    if (which === 'waves' && W.marine && W.marine.length) return sampleField(W.marine, 'wave_height', lat, lon, i);
    if (which === 'wavedir' && W.marine && W.marine.length) return sampleField(W.marine, 'wave_direction', lat, lon, i);
    if (which === 'waveperiod' && W.marine && W.marine.length) return sampleField(W.marine, 'wave_period', lat, lon, i);
    if (which === 'sst' && W.marine && W.marine.length) return sampleField(W.marine, 'sea_surface_temperature', lat, lon, i);
    return null;
  };

  /* --------------------------------------------------------------- canvas */
  W.init = function (canvas) {
    W.canvas = canvas;
    W.ctx = canvas.getContext('2d');
    W.resize();
    window.addEventListener('resize', () => W.resize());
    if (window.mapCtl && window.mapCtl.map) {
      window.mapCtl.map.on('zoom resize viewreset', () => W.schedule());
      window.mapCtl.map.on('moveend', () => {
        if (W.layer === 'wind') {
          W.seedParticles();
          W.ctx.clearRect(0, 0, W.w, W.h);
        }
        W.schedule();
      });
    }
    W.load();
    // refresh the model every 30 minutes
    setInterval(() => W.load(), 30 * 60 * 1000);
  };

  W.resize = function () {
    if (!W.canvas) return;
    const rect = W.canvas.getBoundingClientRect();
    W.dpr = Math.min(window.devicePixelRatio || 1, 2);
    W.canvas.width = Math.max(1, Math.round(rect.width * W.dpr));
    W.canvas.height = Math.max(1, Math.round(rect.height * W.dpr));
    W.w = rect.width;
    W.h = rect.height;
    W.schedule();
  };

  W.schedule = function () {
    if (W.raf) return;
    W.raf = requestAnimationFrame(() => {
      W.raf = null;
      W.frame();
    });
  };

  W.setLayer = function (layer) {
    W.layer = layer;
    if (layer === 'wind') W.seedParticles();
    W.particlesActive = layer === 'wind';
    W.frame();
    W.loop();
  };

  W.setBarbs = function (on) {
    W.barbs = on;
    W.frame();
  };

  /* ---------------------------------------------------------- particles */
  W.seedParticles = function () {
    const map = window.mapCtl?.map;
    if (!map) return;
    const n = util.isMobile() ? 420 : 1400;
    W.particles = new Array(n).fill(0).map(() => {
      const p = {
        x: Math.random() * (W.w || 800),
        y: Math.random() * (W.h || 600),
        age: Math.random() * 110,
        life: 70 + Math.random() * 90,
      };
      p.px = p.x;
      p.py = p.y;
      return p;
    });
    W.fadeFill = null;
  };

  W.loop = function () {
    if (W.looping) return;
    W.looping = true;
    let last = performance.now();
    const tick = (now) => {
      const dt = Math.min(80, now - last);
      last = now;
      if (W.particlesActive) {
        W.advanceParticles(dt);
        W.frame();
      }
      if (W.particlesActive) W.rafLoop = requestAnimationFrame(tick);
      else {
        W.looping = false;
        W.rafLoop = null;
      }
    };
    W.rafLoop = requestAnimationFrame(tick);
  };

  W.advanceParticles = function (dt) {
    const map = window.mapCtl?.map;
    if (!map || !W.atmo) return;
    for (const p of W.particles) {
      p.px = p.x;
      p.py = p.y;
      const ll = map.containerPointToLatLng([p.x, p.y]);
      const v = W.vectorAt(ll.lat, ll.lng);
      if (!v) {
        p.age = p.life;
        continue;
      }
      // convert speed to pixels/sec on screen (empirical but consistent)
      const scale = 1.05;
      p.x += v.u * scale * (dt / 16.67);
      p.y -= v.v * scale * (dt / 16.67);
      p.age += dt / 16.67;
      if (p.age > p.life || p.x < -20 || p.y < -20 || p.x > W.w + 20 || p.y > W.h + 20) {
        p.x = Math.random() * W.w;
        p.y = Math.random() * W.h;
        p.age = 0;
        p.life = 55 + Math.random() * 70;
      }
    }
  };

  /* ------------------------------------------------------------ painting */
  const PRESSURE_STOPS = [
    [980, [120, 80, 220]],
    [995, [70, 110, 225]],
    [1005, [60, 160, 220]],
    [1012, [80, 210, 200]],
    [1018, [120, 220, 170]],
    [1024, [220, 220, 140]],
    [1030, [250, 170, 110]],
    [1040, [240, 110, 90]],
  ];

  function pressureRGBA(hpa) {
    if (!Number.isFinite(hpa)) return 'rgba(0,0,0,0)';
    let a = PRESSURE_STOPS[0];
    let b = PRESSURE_STOPS[PRESSURE_STOPS.length - 1];
    for (let i = 1; i < PRESSURE_STOPS.length; i++) {
      if (hpa <= PRESSURE_STOPS[i][0]) {
        a = PRESSURE_STOPS[i - 1];
        b = PRESSURE_STOPS[i];
        break;
      }
    }
    const t = util.clamp((hpa - a[0]) / (b[0] - a[0] || 1), 0, 1);
    const c = a[1].map((x, i) => Math.round(x + (b[1][i] - x) * t));
    return [c[0], c[1], c[2], 52];
  }

  function waveRGBA(h) {
    if (!Number.isFinite(h)) return 'rgba(0,0,0,0)';
    const stops = [
      [0, [18, 45, 80]],
      [1, [38, 95, 150]],
      [2, [59, 143, 191]],
      [3, [90, 190, 200]],
      [5, [160, 220, 160]],
      [7, [255, 212, 94]],
      [9, [255, 138, 61]],
    ];
    let a = stops[0];
    let b = stops[stops.length - 1];
    for (let i = 1; i < stops.length; i++) {
      if (h <= stops[i][0]) {
        a = stops[i - 1];
        b = stops[i];
        break;
      }
    }
    const t = util.clamp((h - a[0]) / (b[0] - a[0] || 1), 0, 1);
    const c = a[1].map((x, i) => Math.round(x + (b[1][i] - x) * t));
    return [c[0], c[1], c[2], 66];
  }

  W.frame = function () {
    const cv = W.canvas;
    if (!cv || !W.ctx) return;
    const ctx = W.ctx;
    const map = window.mapCtl?.map;
    ctx.setTransform(W.dpr, 0, 0, W.dpr, 0, 0);

    if (!map || W.layer === 'none' || !W.ready) {
      ctx.clearRect(0, 0, W.w, W.h);
      if (W.layer !== 'none') W.drawStatus(ctx);
      return;
    }

    if (W.layer === 'wind') {
      // Real flowing trails: fade the previous frame instead of clearing it, so each
      // particle leaves a streak whose colour is the local model wind speed.
      ctx.globalCompositeOperation = 'destination-out';
      ctx.fillStyle = 'rgba(0,0,0,0.085)';
      ctx.fillRect(0, 0, W.w, W.h);
      ctx.globalCompositeOperation = 'lighter';
      ctx.lineCap = 'round';
      for (const p of W.particles) {
        const ll = map.containerPointToLatLng([p.x, p.y]);
        const v = W.vectorAt(ll.lat, ll.lng);
        if (!v) continue;
        const alpha = Math.max(0, 1 - p.age / p.life) * 0.9;
        ctx.strokeStyle = `rgba(${windRGB(v.speed).join(',')},${alpha.toFixed(3)})`;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(p.px, p.py);
        ctx.lineTo(p.x, p.y);
        ctx.stroke();
      }
      ctx.globalCompositeOperation = 'source-over';
    } else {
      ctx.clearRect(0, 0, W.w, W.h);
      W.drawScalarField(ctx, map);
    }

    if (W.barbs) W.drawBarbs(ctx, map);
    W.drawStatus(ctx);
  };

  function windRGB(sp) {
    const stops = [
      [0, [90, 140, 220]],
      [8, [70, 200, 220]],
      [15, [62, 230, 176]],
      [22, [255, 212, 94]],
      [30, [255, 138, 61]],
      [38, [255, 77, 77]],
    ];
    let a = stops[0];
    let b = stops[stops.length - 1];
    for (let i = 1; i < stops.length; i++) {
      if (sp <= stops[i][0]) {
        a = stops[i - 1];
        b = stops[i];
        break;
      }
    }
    const t = util.clamp((sp - a[0]) / (b[0] - a[0] || 1), 0, 1);
    return a[1].map((x, i) => Math.round(x + (b[1][i] - x) * t));
  }

  /** Smooth scalar field: sampled small then upscaled with interpolation. */
  W.drawScalarField = function (ctx, map) {
    const isWave = W.layer === 'waves';
    const block = 5;
    const sw = Math.ceil(W.w / block);
    const sh = Math.ceil(W.h / block);
    if (!W.small) W.small = document.createElement('canvas');
    if (W.small.width !== sw || W.small.height !== sh) {
      W.small.width = sw;
      W.small.height = sh;
    }
    const sctx = W.small.getContext('2d');
    const img = sctx.createImageData(sw, sh);
    const data = img.data;
    for (let y = 0; y < sh; y++) {
      for (let x = 0; x < sw; x++) {
        const ll = map.containerPointToLatLng([x * block + block / 2, y * block + block / 2]);
        const v = isWave ? W.scalarAt(ll.lat, ll.lng, 'waves') : W.scalarAt(ll.lat, ll.lng, 'pressure');
        const i = (y * sw + x) * 4;
        if (v === null) {
          data[i + 3] = 0;
          continue;
        }
        const c = isWave ? waveRGBA(v) : pressureRGBA(v);
        data[i] = c[0];
        data[i + 1] = c[1];
        data[i + 2] = c[2];
        data[i + 3] = c[3];
      }
    }
    sctx.putImageData(img, 0, 0);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.globalCompositeOperation = 'source-over';
    ctx.drawImage(W.small, 0, 0, W.w, W.h);
    if (!isWave) W.drawIsobars(ctx, map);
  };

  /** Marching squares: contiguous isobars with interpolated crossings. */
  W.drawIsobars = function (ctx, map) {
    const levels = [984, 992, 1000, 1008, 1016, 1024, 1032, 1040];
    const step = 22;
    const cols = Math.ceil(W.w / step) + 1;
    const rows = Math.ceil(W.h / step) + 1;
    const field = new Float32Array(cols * rows);
    let min = Infinity;
    let max = -Infinity;
    for (let j = 0; j < rows; j++) {
      for (let i = 0; i < cols; i++) {
        const ll = map.containerPointToLatLng([i * step, j * step]);
        const v = W.scalarAt(ll.lat, ll.lng, 'pressure');
        const idx = j * cols + i;
        field[idx] = v === null ? NaN : v;
        if (v !== null) {
          if (v < min) min = v;
          if (v > max) max = v;
        }
      }
    }
    if (!Number.isFinite(min)) return;
    for (const L of levels) {
      if (L < min - 2 || L > max + 2) continue;
      ctx.beginPath();
      for (let j = 0; j < rows - 1; j++) {
        for (let i = 0; i < cols - 1; i++) {
          const a = field[j * cols + i];
          const b = field[j * cols + i + 1];
          const c = field[(j + 1) * cols + i + 1];
          const d = field[(j + 1) * cols + i];
          if ([a, b, c, d].some((v) => Number.isNaN(v))) continue;
          const pts = [];
          const lerp = (v1, v2) => (L - v1) / (v2 - v1);
          if ((a < L) !== (b < L)) pts.push([i * step + lerp(a, b) * step, j * step]);
          if ((b < L) !== (c < L)) pts.push([(i + 1) * step, j * step + lerp(b, c) * step]);
          if ((c < L) !== (d < L)) pts.push([i * step + lerp(d, c) * step, (j + 1) * step]);
          if ((d < L) !== (a < L)) pts.push([i * step, j * step + lerp(a, d) * step]);
          if (pts.length === 2) {
            ctx.moveTo(pts[0][0], pts[0][1]);
            ctx.lineTo(pts[1][0], pts[1][1]);
          } else if (pts.length === 4) {
            ctx.moveTo(pts[0][0], pts[0][1]);
            ctx.lineTo(pts[1][0], pts[1][1]);
            ctx.moveTo(pts[2][0], pts[2][1]);
            ctx.lineTo(pts[3][0], pts[3][1]);
          }
        }
      }
      const major = L % 16 === 0;
      ctx.strokeStyle = major ? 'rgba(255,255,255,0.55)' : 'rgba(255,255,255,0.26)';
      ctx.lineWidth = major ? 1.25 : 0.8;
      ctx.stroke();
      // label one segment per level
      ctx.font = '8.5px "JetBrains Mono", monospace';
      ctx.fillStyle = 'rgba(255,255,255,0.75)';
      let labelled = false;
      for (let j = 0; j < rows - 1 && !labelled; j++) {
        for (let i = 0; i < cols - 1; i++) {
          const a = field[j * cols + i];
          const b = field[j * cols + i + 1];
          if (Number.isNaN(a) || Number.isNaN(b)) continue;
          if ((a < L) !== (b < L)) {
            const x = i * step + ((L - a) / (b - a)) * step;
            const y = j * step;
            if (x > 30 && x < W.w - 60 && y > 20 && y < W.h - 20) {
              ctx.fillText(String(L), x + 3, y - 3);
              labelled = true;
              break;
            }
          }
        }
      }
    }
  };

  W.drawBarbs = function (ctx, map) {
    if (!W.atmo) return;
    const nLat = activeGrid().lat.length;
    const nLon = activeGrid().lon.length;
    for (let y = 0; y < nLat; y++) {
      for (let x = 0; x < nLon; x++) {
        const ll = [activeGrid().lat[y], activeGrid().lon[x]];
        const p = map.latLngToContainerPoint(ll);
        if (p.x < -40 || p.y < -40 || p.x > W.w + 40 || p.y > W.h + 40) continue;
        const v = W.vectorAt(ll[0], ll[1]);
        if (!v) continue;
        const color = windRGB(v.speed);
        ctx.strokeStyle = `rgba(${color.join(',')},0.9)`;
        ctx.fillStyle = `rgba(${color.join(',')},0.9)`;
        ctx.lineWidth = 1.2;
        const len = 16;
        const scale = util.clamp(v.speed / 30, 0.35, 1.4);
        const dx = v.u * 2.2;
        const dy = -v.v * 2.2;
        const norm = Math.hypot(dx, dy) || 1;
        const ex = (dx / norm) * len * scale;
        const ey = (dy / norm) * len * scale;
        ctx.beginPath();
        ctx.moveTo(p.x - ex / 2, p.y - ey / 2);
        ctx.lineTo(p.x + ex / 2, p.y + ey / 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(p.x + ex / 2, p.y + ey / 2, 1.7, 0, Math.PI * 2);
        ctx.fill();
        // speed label every other column
        if ((x + y) % 2 === 0) {
          ctx.font = '8px "JetBrains Mono", monospace';
          ctx.fillText(Math.round(v.speed), p.x + 5, p.y - 4);
        }
      }
    }
  };

  W.drawStatus = function (ctx) {
    if (!W.ready && W.loading) return;
    const msg = !W.ready
      ? `Couche météo indisponible${W.error ? ' — ' + W.error : ''}`
      : `Modèle Open-Meteo · ${W.times[W.timeIdx]?.replace('T', ' ')} UTC`;
    ctx.font = '10px "JetBrains Mono", monospace';
    const pad = 8;
    const w = ctx.measureText(msg).width + pad * 2;
    ctx.fillStyle = 'rgba(5,10,17,0.72)';
    ctx.fillRect(W.w - w - 14, W.h - 34, w, 22);
    ctx.strokeStyle = 'rgba(255,255,255,0.12)';
    ctx.strokeRect(W.w - w - 14, W.h - 34, w, 22);
    ctx.fillStyle = W.ready ? '#9fb3c8' : '#ffb3b3';
    ctx.fillText(msg, W.w - w - 14 + pad, W.h - 19);
  };

  /* --------------------------------------------------- per-boat conditions */
  /** Model conditions at a position for a given ISO time (nearest hour). */
  W.at = function (lat, lon, iso) {
    if (!W.ready) return null;
    let idx = W.timeIdx;
    if (iso) {
      const t = Date.parse(iso);
      let bestD = Infinity;
      W.times.forEach((tt, i) => {
        const d = Math.abs(Date.parse(tt + ':00Z') - t);
        if (d < bestD) {
          bestD = d;
          idx = i;
        }
      });
    }
    const i = idx;
    const out = {
      time: W.times[i],
      wind: sampleField(W.atmo, 'wind_speed_10m', lat, lon, i),
      windDir: sampleField(W.atmo, 'wind_direction_10m', lat, lon, i),
      gust: sampleField(W.atmo, 'wind_gusts_10m', lat, lon, i),
      pressure: sampleField(W.atmo, 'pressure_msl', lat, lon, i),
      cloud: sampleField(W.atmo, 'cloud_cover', lat, lon, i),
      temp: sampleField(W.atmo, 'temperature_2m', lat, lon, i),
      waves: W.marine && W.marine.length ? sampleField(W.marine, 'wave_height', lat, lon, i) : null,
      waveDir: W.marine && W.marine.length ? sampleField(W.marine, 'wave_direction', lat, lon, i) : null,
      wavePeriod: W.marine && W.marine.length ? sampleField(W.marine, 'wave_period', lat, lon, i) : null,
      sst: W.marine && W.marine.length ? sampleField(W.marine, 'sea_surface_temperature', lat, lon, i) : null,
    };
    return out;
  };

  /** Hourly series at a position, for charts. */
  W.seriesAt = function (lat, lon, fromIso, hours) {
    if (!W.ready) return null;
    const start = fromIso ? Math.max(0, util.idxAt(W.times.map((t) => Date.parse(t + ':00Z')), Date.parse(fromIso))) : W.timeIdx;
    const n = Math.min(hours || 48, W.times.length - start);
    const out = { time: [], wind: [], gust: [], waves: [], pressure: [], dir: [] };
    for (let i = start; i < start + n; i++) {
      out.time.push(W.times[i]);
      out.wind.push(sampleField(W.atmo, 'wind_speed_10m', lat, lon, i));
      out.gust.push(sampleField(W.atmo, 'wind_gusts_10m', lat, lon, i));
      out.dir.push(sampleField(W.atmo, 'wind_direction_10m', lat, lon, i));
      out.pressure.push(sampleField(W.atmo, 'pressure_msl', lat, lon, i));
      out.waves.push(W.marine && W.marine.length ? sampleField(W.marine, 'wave_height', lat, lon, i) : null);
    }
    return out;
  };

  window.wxCtl = W;
})();
