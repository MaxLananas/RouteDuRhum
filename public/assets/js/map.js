/* ============================================================================
   Map — Leaflet, satellite basemaps, real tracks, trimaran pictograms,
   speed-coloured trail, replay.
   ========================================================================== */
(function () {
  'use strict';

  const BASES = {
    sat: {
      url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      attr: 'Imagerie © Esri, Maxar, Earthstar Geographics, USDA FSA, USGS, Aerogrid, IGN, IGP',
      max: 17,
    },
    dark: {
      url: 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}',
      attr: 'Fond sombre © Esri, HERE, Garmin, © OpenStreetMap contributors',
      max: 16,
    },
    relief: {
      url: 'https://server.arcgisonline.com/ArcGIS/rest/services/Ocean/World_Ocean_Base/MapServer/tile/{z}/{y}/{x}',
      attr: 'Océan © Esri, GEBCO, NOAA, National Geographic, DeLorme, HERE, Geonames.org',
      max: 13,
    },
  };

  const CLASS_COLORS = {
    Ultim: '#8fa9c4',
    'Ocean Fifty': '#3ee6b0',
    IMOCA: '#ffc24b',
    Class40: '#b98cff',
    'Vintage Mono': '#ff9d7a',
    'Vintage Multi': '#7fd8ff',
  };

  const M = {
    map: null,
    baseLayer: null,
    baseKey: 'sat',
    boatMarkers: new Map(), // id -> {marker, rot, el}
    trackLayers: new Map(), // id -> L.Polyline
    laurentTrail: null,
    routeLayer: null,
    routeGhostLayer: null,
    startMarker: null,
    arrivalMarker: null,
    ghost: null,
    replay: { active: false, t: 0, playing: false, speed: 120, start: 0, end: 0 },
    trailCanvas: null,
    trailCtx: null,
    visibleClasses: new Set(['Ocean Fifty']),
    showAllFleet: false,
    focused: null,
  };

  /* ------------------------------------------------------------ pictogram */
  function trimaranSvg(color, opts = {}) {
    const s = opts.size || 34;
    const glow = opts.glow || color;
    return `
<svg width="${s}" height="${s}" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
  <g filter="url(#f)">
    <path d="M20 3.5c1.6 0 2.6 1.2 2.9 3l1.7 19.2c.15 1.9-.5 3-2.2 3h-4.8c-1.7 0-2.35-1.1-2.2-3L17.1 6.5c.3-1.8 1.3-3 2.9-3Z" fill="${color}"/>
    <path d="M7.6 15.2c1.2 0 1.9.9 2.1 2.2l1.2 13.4c.1 1.4-.4 2.2-1.6 2.2H6.1c-1.2 0-1.7-.8-1.6-2.2L5.7 17.4c.2-1.3.8-2.2 1.9-2.2Z" fill="${color}" opacity=".82"/>
    <path d="M32.4 15.2c1.1 0 1.7.9 1.9 2.2l1.2 13.4c.1 1.4-.4 2.2-1.6 2.2h-3.2c-1.2 0-1.7-.8-1.6-2.2l1.2-13.4c.2-1.3.9-2.2 2.1-2.2Z" fill="${color}" opacity=".82"/>
    <path d="M8.4 24.6h23.2" stroke="${color}" stroke-width="2.4" stroke-linecap="round" opacity=".95"/>
    <path d="M9.6 29.5h20.8" stroke="${color}" stroke-width="2" stroke-linecap="round" opacity=".75"/>
  </g>
  <defs><filter id="f" x="-50%" y="-50%" width="200%" height="200%"><feDropShadow dx="0" dy="1.2" stdDeviation="1.1" flood-color="${glow}" flood-opacity=".55"/></filter></defs>
</svg>`;
  }

  function boatIcon(boat, opts = {}) {
    const color = opts.color || CLASS_COLORS[boat.cls] || '#cbd6e2';
    const zoom = M.map ? M.map.getZoom() : 5;
    const scale = util.isMobile() ? 0.82 : 1;
    const size = (opts.size || (opts.lead ? 32 : 24)) * scale * (zoom < 4 ? 0.82 : 1);
    const html = `
      <div class="boat-marker ${opts.lead ? 'boat-marker--lead' : ''} ${opts.me ? 'boat-marker--laurent' : ''}" style="position:relative;width:${size}px;height:${size}px">
        ${opts.me ? '<span class="pulse-ring"></span>' : ''}
        <div class="boat-marker__rot" style="width:${size}px;height:${size}px;transform:rotate(${boat.heading || 0}deg)">
          ${trimaranSvg(color, { size, glow: color })}
        </div>
        ${opts.label ? `<span class="boat-marker__label" style="${opts.me ? '' : 'font-size:8px;opacity:.72'}">${util.esc(opts.label)}</span>` : ''}
      </div>`;
    return L.divIcon({
      html,
      className: '',
      iconSize: [size, size],
      iconAnchor: [size / 2, size / 2],
    });
  }

  /* ----------------------------------------------------------------- init */
  M.init = function () {
    const map = L.map('map', {
      zoomControl: false,
      attributionControl: true,
      worldCopyJump: true,
      zoomSnap: 0.25,
      zoomDelta: 0.75,
      wheelPxPerZoomLevel: 110,
      minZoom: 2,
      maxZoom: 12,
      preferCanvas: false,
      tap: false,
    });
    M.map = map;
    M.setBase('sat', true);
    map.setView([38, -38], 4);
    map.attributionControl.setPrefix(false);

    M.trailCanvas = document.getElementById('trailCanvas');
    M.trailCtx = M.trailCanvas.getContext('2d');

    map.on('move zoom resize viewreset', () => M.scheduleTrail());
    map.on('zoomend', () => {
      if (dataStore.core) M.updateFleet(dataStore.core, { showOthers: true });
    });
    // stop the browser's context menu so the map feels like a native app
    map.on('contextmenu', (e) => L.DomEvent.preventDefault(e));
    window.addEventListener('resize', () => M.scheduleTrail());

    // click on empty map: dismiss focus
    map.on('click', () => {
      if (M.focused) M.clearFocus();
    });

    return map;
  };

  M.setBase = function (key, silent) {
    const conf = BASES[key];
    if (!conf) return;
    if (M.baseLayer) M.map.removeLayer(M.baseLayer);
    M.baseLayer = L.tileLayer(conf.url, {
      attribution: conf.attr,
      maxZoom: 18,
      maxNativeZoom: conf.max,
      crossOrigin: true,
      detectRetina: false,
      keepBuffer: 3,
      updateWhenIdle: false,
    }).addTo(M.map);
    M.baseKey = key;
    if (!silent) M.emitBase();
  };

  M.emitBase = function () {
    util.$$('#baseSeg button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.base === M.baseKey)));
  };

  /* -------------------------------------------------------------- routes */
  M.drawRoute = function (core) {
    const leg = core.route && core.route.leg;
    if (!leg || !leg.route || !leg.route.length) return;
    const coords = leg.route.map(([lat, lon]) => [lat, lon]);
    if (M.routeGhostLayer) M.map.removeLayer(M.routeGhostLayer);
    M.routeGhostLayer = L.polyline(coords, {
      color: '#ffffff',
      weight: 1.6,
      opacity: 0.55,
      dashArray: '1 7',
      lineCap: 'round',
      interactive: false,
    }).addTo(M.map);

    const start = coords[0];
    const arrival = coords[coords.length - 1];
    if (M.startMarker) M.map.removeLayer(M.startMarker);
    if (M.arrivalMarker) M.map.removeLayer(M.arrivalMarker);
    M.startMarker = L.marker(start, {
      icon: L.divIcon({
        className: '',
        html: `<div style="display:flex;align-items:center;gap:6px;transform:translate(-4px,-50%)">
          <span style="width:9px;height:9px;border-radius:50%;background:#fff;box-shadow:0 0 0 3px rgba(255,255,255,.22)"></span>
          <span class="mono" style="font-size:9px;letter-spacing:.1em;background:rgba(4,9,16,.75);padding:2px 6px;border-radius:4px;border:1px solid rgba(255,255,255,.14)">SAINT-MALO</span></div>`,
        iconSize: [0, 0],
      }),
      interactive: false,
    }).addTo(M.map);
    M.arrivalMarker = L.marker(arrival, {
      icon: L.divIcon({
        className: '',
        html: `<div style="display:flex;align-items:center;gap:6px;transform:translate(-100%,-50%)">
          <span class="mono" style="font-size:9px;letter-spacing:.1em;background:rgba(255,194,75,.16);color:#ffd98a;padding:2px 6px;border-radius:4px;border:1px solid rgba(255,194,75,.4)">POINTE-À-PITRE</span>
          <span style="width:9px;height:9px;border-radius:2px;background:#ffc24b;box-shadow:0 0 0 3px rgba(255,194,75,.22)"></span></div>`,
        iconSize: [0, 0],
      }),
      interactive: false,
    }).addTo(M.map);
  };

  /* ------------------------------------------------------- Laurent trail */
  /** The trail itself is painted on the overlay canvas (speed coloured).
   *  Here we only add a wide invisible polyline that acts as a click target so a
   *  click on any point of the trace can show the data recorded at that time. */
  M.drawLaurentTrail = function (track) {
    if (M.trailHit) {
      M.map.removeLayer(M.trailHit);
      M.trailHit = null;
    }
    if (!track || track.t.length < 2) return;
    const pts = track.t.map((t, i) => [track.lat[i], track.lon[i]]);
    M.trailHit = L.polyline(pts, {
      color: '#000',
      weight: 16,
      opacity: 0,
      interactive: true,
      lineCap: 'round',
    }).addTo(M.map);
    M.trailHit.on('click', (e) => {
      L.DomEvent.stopPropagation(e);
      const p = nearestTrackPoint(e.latlng.lat, e.latlng.lng);
      if (p) M.showTrackPoint(p);
      else M.map.openPopup(L.popup().setLatLng(e.latlng).setContent('<div style="font-size:11.5px">Point hors de la trace de La French Fab.</div>'));
    });
    M.trailHit.on('mouseover', () => M.map.getContainer().style.cursor = 'crosshair');
    M.trailHit.on('mouseout', () => M.map.getContainer().style.cursor = '');
  };

  /** Nearest real track sample to a clicked position (never interpolated). */
  function nearestTrackPoint(lat, lon) {
    const tr = dataStore.track;
    if (!tr) return null;
    let best = null;
    let bestD = Infinity;
    for (let i = 0; i < tr.t.length; i++) {
      const d = util.haversine(lat, lon, tr.lat[i], tr.lon[i]);
      if (d < bestD) {
        bestD = d;
        best = { i, t: tr.t[i], lat: tr.lat[i], lon: tr.lon[i], d: bestD };
      }
    }
    if (!best || bestD > 40) return null;
    return best;
  }

  M.showTrackPoint = function (p) {
    const h = dataStore.history;
    let speed = null;
    let heading = null;
    let dtf = null;
    if (h && h.dates && h.dates.length) {
      const times = h.dates.map((d) => Date.parse(d) / 1000);
      const idx = util.idxAt(times, p.t);
      speed = h.speed[idx];
      heading = h.heading[idx];
      dtf = h.dtf[idx];
    }
    const rows = [
      ['Date', util.fmtFull(p.t * 1000)],
      ['Position', `${p.lat.toFixed(4)}°, ${p.lon.toFixed(4)}°`],
      ['Vitesse fond', Number.isFinite(speed) ? `${util.one(speed)} nd` : 'non publiée à cet instant'],
      ['Cap', Number.isFinite(heading) ? `${Math.round(heading)}° ${util.cardinal(heading)}` : '—'],
      ['Distance à l\'arrivée', Number.isFinite(dtf) ? `${util.int(dtf)} mi` : '—'],
    ];
    const html = `<div class="eyebrow">Trace officielle · point ${p.i + 1}</div>
      <div style="font-weight:700;font-size:12.5px;margin:3px 0 8px">La French Fab</div>
      ${rows.map(([k, v]) => `<div class="kv"><span class="kv__k">${k}</span><span class="kv__v">${v}</span></div>`).join('')}
      <div style="font-family:var(--mono);font-size:8.5px;color:var(--ink-faint);margin-top:7px">position officielle · vitesse du pointage horaire le plus proche</div>`;
    L.popup({ maxWidth: 280 }).setLatLng([p.lat, p.lon]).setContent(html).openOn(M.map);
  };

  /* --------------------------------------------------------- fleet layer */
  M.updateFleet = function (core, opts = {}) {
    const me = String(core.laurent.trackerId);
    const showOthers = opts.showOthers !== false;
    const wanted = new Set();
    const cls = core.standings.find((c) => /ocean/i.test(c.cle || c.nom || ''));
    if (cls && showOthers) {
      let rivals = cls.etat.filter((b) => Number.isFinite(b.lat) && Number.isFinite(b.lon));
      if (util.isMobile()) {
        // phones: Laurent + the three closest boats keeps the map readable
        const me = core.laurent;
        rivals = rivals
          .filter((b) => !dataStore.isLaurentName(b.n))
          .map((b) => ({ b, d: util.haversine(me.lat, me.lon, b.lat, b.lon) }))
          .sort((x, y) => x.d - y.d)
          .slice(0, 3)
          .map((x) => x.b);
      }
      for (const b of rivals) wanted.add(String(b.id));
    }
    // Laurent always
    wanted.add(me);

    // remove stale
    for (const [id, rec] of M.boatMarkers) {
      if (!wanted.has(id)) {
        M.map.removeLayer(rec.marker);
        M.boatMarkers.delete(id);
      }
    }

    const byTrackerId = {};
    if (cls) for (const b of cls.etat) byTrackerId[String(b.id)] = b;
    // map classement id -> tracker id is not shared, so use position/lat matching
    for (const id of wanted) {
      const isMe = id === me;
      let boat = { heading: 0 };
      let label = '';
      let rank = null;
      if (isMe) {
        boat = { heading: core.laurent.heading, cls: 'Ocean Fifty' };
        label = 'LA FRENCH FAB';
        rank = core.laurent.rank;
      } else {
        const b = cls.etat.find((x) => String(x.id) === id);
        if (!b || !Number.isFinite(b.lat)) continue;
        boat = { heading: b.cap, cls: 'Ocean Fifty' };
        label = b.n.replace(/\s+/g, ' ').split(' ').slice(-1)[0];
        rank = b.r;
      }
      const lat = isMe ? core.laurent.lat : cls.etat.find((x) => String(x.id) === id).lat;
      const lon = isMe ? core.laurent.lon : cls.etat.find((x) => String(x.id) === id).lon;
      if (!Number.isFinite(lat) || !Number.isFinite(lon)) continue;
      const lead = rank === 1 && !isMe;
      const showLabel = isMe || lead;
      const icon = boatIcon(boat, { me: isMe, lead, label: showLabel ? label : '', size: isMe ? 38 : 24 });
      const existing = M.boatMarkers.get(id);
      if (existing) {
        existing.marker.setLatLng([lat, lon]);
        existing.marker.setIcon(icon);
        existing.rot = boat.heading;
      } else {
        const marker = L.marker([lat, lon], { icon, zIndexOffset: isMe ? 1000 : lead ? 500 : 0, riseOnHover: true });
        marker.on('click', (e) => {
          L.DomEvent.stopPropagation(e);
          M.focusBoat(id, core);
        });
        marker.addTo(M.map);
        M.boatMarkers.set(id, { marker, rot: boat.heading });
      }
    }
  };

  /** Smoothly rotate + move the Laurent pictogram to a new position. */
  M.moveLaurent = function (lat, lon, heading) {
    const core = dataStore.core;
    const id = String(core.laurent.trackerId);
    const rec = M.boatMarkers.get(id);
    if (!rec) return;
    rec.marker.setLatLng([lat, lon]);
    const rotEl = rec.marker.getElement()?.querySelector('.boat-marker__rot');
    if (rotEl && Number.isFinite(heading)) rotEl.style.transform = `rotate(${heading}deg)`;
  };

  /* ------------------------------------------------------------- focus */
  M.focusBoat = function (id, core) {
    const me = String(core.laurent.trackerId);
    if (id === me) {
      M.map.flyTo([core.laurent.lat, core.laurent.lon], Math.max(M.map.getZoom(), 7), { duration: 0.8 });
      return;
    }
    const cls = core.standings.find((c) => /ocean/i.test(c.cle || c.nom || ''));
    const b = cls?.etat.find((x) => String(x.id) === id);
    if (b) {
      M.map.flyTo([b.lat, b.lon], Math.max(M.map.getZoom(), 7), { duration: 0.8 });
      M.showBoatCard(b);
    }
  };

  M.showBoatCard = function (b) {
    const html = `
      <div class="eyebrow">Ocean Fifty</div>
      <div style="font-weight:700;font-size:14px;margin:2px 0 8px">${util.esc(b.n)}</div>
      <div class="kv"><span class="kv__k">Bateau</span><span class="kv__v">${util.esc(b.b || '—')}</span></div>
      <div class="kv"><span class="kv__k">Classement</span><span class="kv__v">${b.r ?? '—'}</span></div>
      <div class="kv"><span class="kv__k">Vitesse</span><span class="kv__v">${util.kn(b.v)} nd</span></div>
      <div class="kv"><span class="kv__k">Cap</span><span class="kv__v">${b.cap ?? '—'}° ${util.cardinal(b.cap)}</span></div>
      <div class="kv"><span class="kv__k">À l'arrivée</span><span class="kv__v">${util.nm(b.dtf)} mi</span></div>
      <div class="kv"><span class="kv__k">Écart leader</span><span class="kv__v">${util.nm(b.dtl)} mi</span></div>`;
    L.popup({ closeButton: true, className: 'boatpop', maxWidth: 260 })
      .setLatLng([b.lat, b.lon])
      .setContent(html)
      .openOn(M.map);
  };

  M.clearFocus = function () {
    M.focused = null;
    M.map.closePopup();
  };

  M.centerOnLaurent = function () {
    const core = dataStore.core;
    if (!core || !Number.isFinite(core.laurent.lat)) return;
    M.map.flyTo([core.laurent.lat, core.laurent.lon], Math.max(M.map.getZoom(), 6.5), { duration: 1.1 });
  };

  /* ------------------------------------------------------------- replay */
  M.startReplay = function (core) {
    const tr = dataStore.track;
    if (!tr || tr.t.length < 2) {
      util.toast('Trace indisponible : replay impossible.', 'bad');
      return false;
    }
    M.replay.active = true;
    M.replay.start = tr.t[0];
    M.replay.end = tr.t[tr.t.length - 1];
    M.replay.t = M.replay.start;
    M.replay.playing = true;
    if (!M.ghost) {
      M.ghost = L.marker([tr.lat[0], tr.lon[0]], {
        icon: boatIcon({ heading: 0, cls: 'Ocean Fifty' }, { color: '#ffc24b', size: 38, label: 'REPLAY' }),
        zIndexOffset: 2000,
        interactive: false,
      }).addTo(M.map);
    }
    // dim the live pictogram
    const me = String(core.laurent.trackerId);
    const rec = M.boatMarkers.get(me);
    if (rec) {
      const el = rec.marker.getElement();
      if (el) el.style.opacity = '0.35';
    }
    return true;
  };

  M.stopReplay = function (core) {
    M.replay.active = false;
    M.replay.playing = false;
    if (M.ghost) {
      M.map.removeLayer(M.ghost);
      M.ghost = null;
    }
    const me = String(core.laurent.trackerId);
    const rec = M.boatMarkers.get(me);
    if (rec) {
      const el = rec.marker.getElement();
      if (el) el.style.opacity = '1';
    }
    M.scheduleTrail();
  };

  M.replayStep = function (dtMs) {
    const R = M.replay;
    if (!R.active || !R.playing) return;
    R.t += (dtMs / 1000) * R.speed;
    if (R.t >= R.end) {
      R.t = R.end;
      R.playing = false;
    }
    const p = util.trackAt(dataStore.track, R.t);
    if (p && M.ghost) {
      M.ghost.setLatLng([p[1], p[2]]);
      const tr = dataStore.track;
      const i = util.idxAt(tr.t, R.t);
      const i0 = Math.max(0, i - 1);
      const brg = util.bearing(tr.lat[i0], tr.lon[i0], tr.lat[Math.min(i, tr.t.length - 1)], tr.lon[Math.min(i, tr.t.length - 1)]);
      if (Number.isFinite(brg)) M.ghost.setIcon(boatIcon({ heading: brg, cls: 'Ocean Fifty' }, { color: '#ffc24b', size: 38, label: 'REPLAY' }));
    }
    M.scheduleTrail();
    M.emitReplay();
  };

  M.emitReplay = function () {
    if (M.onReplay) M.onReplay(M.replay);
  };

  /* ---------------------------------------------------- trail overlay canvas */
  M.scheduleTrail = (function () {
    let raf = null;
    return function () {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = null;
        M.paintTrail();
      });
    };
  })();

  M.paintTrail = function () {
    const cv = M.trailCanvas;
    if (!cv || !M.map) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const rect = cv.getBoundingClientRect();
    const w = Math.max(1, Math.round(rect.width * dpr));
    const h = Math.max(1, Math.round(rect.height * dpr));
    if (cv.width !== w || cv.height !== h) {
      cv.width = w;
      cv.height = h;
    }
    const ctx = M.trailCtx;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, rect.width, rect.height);
    M.trailScreen = null;

    const tr = dataStore.track;
    if (!tr || tr.t.length < 2) return;
    const map = M.map;
    const limitT = M.replay.active ? M.replay.t : Infinity;
    const reveal = M.replay.active && M.replay.end > M.replay.start ? (M.replay.t - M.replay.start) / (M.replay.end - M.replay.start) : 1;

    const pts = [];
    for (let i = 0; i < tr.t.length; i++) {
      if (tr.t[i] > limitT) break;
      pts.push(map.latLngToContainerPoint([tr.lat[i], tr.lon[i]]));
    }
    if (pts.length < 2) return;
    M.trailScreen = { pts, count: pts.length, reveal };

    const h2 = dataStore.history;
    const times = h2 && h2.dates ? h2.dates.map((d) => Date.parse(d) / 1000) : null;

    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // 1. soft ocean-blue underlay for legibility on satellite imagery
    ctx.strokeStyle = 'rgba(8,22,40,0.55)';
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
    ctx.stroke();

    // 2. speed-graded segments (official hourly speed when available)
    ctx.lineWidth = 3;
    for (let i = 1; i < pts.length; i++) {
      if (i / pts.length > reveal) break;
      let v = null;
      if (times && times.length) {
        const idx = util.idxAt(times, tr.t[i]);
        if (Number.isFinite(h2.speed[idx])) v = h2.speed[idx];
      }
      if (v === null) {
        const dtH = (tr.t[i] - tr.t[i - 1]) / 3600;
        const d = util.haversine(tr.lat[i - 1], tr.lon[i - 1], tr.lat[i], tr.lon[i]);
        v = dtH > 0 ? d / dtH : null;
      }
      ctx.strokeStyle = util.speedColor(v);
      ctx.beginPath();
      ctx.moveTo(pts[i - 1].x, pts[i - 1].y);
      ctx.lineTo(pts[i].x, pts[i].y);
      ctx.stroke();
    }

    // 3. hour markers, thinning out when zoomed out, kept away from the boats
    const stepH = map.getZoom() < 5 ? 6 : map.getZoom() < 7 ? 3 : 1;
    const boatPts = [];
    if (dataStore.core) {
      for (const rec of M.boatMarkers.values()) {
        const ll = rec.marker.getLatLng();
        boatPts.push(map.latLngToContainerPoint(ll));
      }
    }
    let lastT = -Infinity;
    for (let i = 0; i < tr.t.length && i < pts.length; i++) {
      if (tr.t[i] - lastT < stepH * 3600) continue;
      const p = pts[i];
      let clash = false;
      for (const b of boatPts) {
        if ((b.x - p.x) ** 2 + (b.y - p.y) ** 2 < 26 * 26) { clash = true; break; }
      }
      if (clash) continue;
      lastT = tr.t[i];
      if (i / pts.length > reveal) break;
      ctx.beginPath();
      ctx.arc(pts[i].x, pts[i].y, 2.4, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(6,16,28,.85)';
      ctx.fill();
      ctx.lineWidth = 1.2;
      ctx.strokeStyle = 'rgba(226,240,255,.9)';
      ctx.stroke();
    }

    // 4. live head glow
    if (!M.replay.active) {
      const last = pts[pts.length - 1];
      const g = ctx.createRadialGradient(last.x, last.y, 0, last.x, last.y, 26);
      g.addColorStop(0, 'rgba(47,123,255,.42)');
      g.addColorStop(1, 'rgba(47,123,255,0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(last.x, last.y, 26, 0, Math.PI * 2);
      ctx.fill();
    }
  };

  /** Hover readout over the trace (called from the stage mousemove handler). */
  M.hoverTrail = function (clientX, clientY) {
    const out = document.getElementById('trailHover');
    const tr = dataStore.track;
    if (!out || !tr || !M.trailScreen) {
      if (out) out.classList.add('hide');
      return;
    }
    const cv = M.trailCanvas;
    const r = cv.getBoundingClientRect();
    const x = clientX - r.left;
    const y = clientY - r.top;
    let best = -1;
    let bestD = 18 * 18;
    for (let i = 0; i < M.trailScreen.count; i++) {
      const p = M.trailScreen.pts[i];
      const d = (p.x - x) ** 2 + (p.y - y) ** 2;
      if (d < bestD) {
        bestD = d;
        best = i;
      }
    }
    if (best < 0) {
      out.classList.add('hide');
      return;
    }
    const ts = tr.t[best];
    const h2 = dataStore.history;
    let v = null;
    let dtf = null;
    if (h2 && h2.dates) {
      const idx = util.idxAt(h2.dates.map((d) => Date.parse(d) / 1000), ts);
      v = h2.speed[idx];
      dtf = h2.dtf[idx];
    }
    out.innerHTML = `<b>${util.fmtFull(ts * 1000)}</b><span>${util.esc(tr.lat[best].toFixed(3))}°, ${util.esc(tr.lon[best].toFixed(3))}°</span>` +
      (Number.isFinite(v) ? `<span>${util.one(v)} nd</span>` : '') +
      (Number.isFinite(dtf) ? `<span>${util.int(dtf)} mi de l'arrivée</span>` : '');
    out.style.left = Math.min(x + 16, r.width - 220) + 'px';
    out.style.top = Math.max(4, y - 54) + 'px';
    out.classList.remove('hide');
  };

  /* --------------------------------------------------------------- misc */
  M.fitRace = function (core) {
    const tr = dataStore.track;
    if (!tr || !tr.t.length) {
      M.map.setView([38, -38], 4);
      return;
    }
    // frame the fleet and the course, keeping Laurent's trail in view
    const b = L.latLngBounds(tr.t.map((t, i) => [tr.lat[i], tr.lon[i]]));
    const cls = core.standings.find((c) => /ocean/i.test(c.cle || c.nom || ''));
    const me = core.laurent;
    if (Number.isFinite(me.lat)) b.extend([me.lat, me.lon]);
    if (cls) {
      cls.etat.forEach((x) => {
        if (Number.isFinite(x.lat) && Number.isFinite(x.lon)) b.extend([x.lat, x.lon]);
      });
    }
    const leg = core.route?.leg;
    if (leg?.route) {
      b.extend([leg.route[0][0], leg.route[0][1]]);
      b.extend([leg.route[leg.route.length - 1][0], leg.route[leg.route.length - 1][1]]);
    }
    M.map.fitBounds(b, { padding: util.isMobile() ? [26, 26] : [70, 70], maxZoom: 6.5 });
  };

  M.zoom = function (d) {
    M.map.setZoom(M.map.getZoom() + d);
  };

  window.mapCtl = M;
  window.trimaranSvg = trimaranSvg;
  window.CLASS_COLORS = CLASS_COLORS;
})();
