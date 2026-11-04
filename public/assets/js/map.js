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
    const size = opts.size || (opts.lead ? 32 : 27);
    const html = `
      <div class="boat-marker ${opts.lead ? 'boat-marker--lead' : ''} ${opts.me ? 'boat-marker--laurent' : ''}" style="position:relative;width:${size}px;height:${size}px">
        ${opts.me ? '<span class="pulse-ring"></span>' : ''}
        <div class="boat-marker__rot" style="width:${size}px;height:${size}px;transform:rotate(${boat.heading || 0}deg)">
          ${trimaranSvg(color, { size, glow: color })}
        </div>
        ${opts.label ? `<span class="boat-marker__label">${util.esc(opts.label)}</span>` : ''}
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
  /** Real track since the start, gradient-coloured by measured speed. */
  M.drawLaurentTrail = function (track, speedAt) {
    if (M.laurentTrail) {
      M.map.removeLayer(M.laurentTrail);
      M.laurentTrail = null;
    }
    if (!track || track.t.length < 2) return;
    // speed per segment from official reports when available, otherwise computed
    const segs = [];
    const pts = track.t.map((t, i) => [track.lat[i], track.lon[i]]);

    // base line (soft) then coloured segments
    for (let i = 1; i < pts.length; i++) {
      const dt = (track.t[i] - track.t[i - 1]) / 3600;
      const d = util.haversine(pts[i - 1][0], pts[i - 1][1], pts[i][0], pts[i][1]);
      let v = dt > 0 ? d / dt : null;
      if (speedAt) {
        const official = speedAt(track.t[i]);
        if (Number.isFinite(official) && official > 0) v = official;
      }
      segs.push({ a: pts[i - 1], b: pts[i], v });
    }
    const group = L.layerGroup();
    // Decimate: group consecutive segments of similar colour
    let batch = [];
    let curColor = null;
    const flush = () => {
      if (batch.length < 2) return;
      L.polyline(batch, {
        color: curColor,
        weight: 3,
        opacity: 0.95,
        lineJoin: 'round',
        lineCap: 'round',
        interactive: false,
      }).addTo(group);
    };
    for (const s of segs) {
      const c = util.speedColor(s.v);
      if (c !== curColor) {
        flush();
        batch = [s.a, s.b];
        curColor = c;
      } else {
        batch.push(s.b);
      }
    }
    flush();
    // halo underlay
    L.polyline(pts, { color: 'rgba(120,190,255,.16)', weight: 9, opacity: 1, interactive: false, lineCap: 'round' }).addTo(group);
    group.addTo(M.map);
    M.laurentTrail = group;
  };

  /* --------------------------------------------------------- fleet layer */
  M.updateFleet = function (core, opts = {}) {
    const me = String(core.laurent.trackerId);
    const showOthers = opts.showOthers !== false;
    const wanted = new Set();
    const cls = core.standings.find((c) => /ocean/i.test(c.cle || c.nom || ''));
    if (cls && showOthers) {
      for (const b of cls.etat) {
        if (!Number.isFinite(b.lat) || !Number.isFinite(b.lon)) continue;
        wanted.add(String(b.id));
      }
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
      const icon = boatIcon(boat, { me: isMe, lead, label, size: isMe ? 40 : 26 });
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

    const tr = dataStore.track;
    if (!tr || tr.t.length < 2) return;

    const map = M.map;
    const size = map.getSize();
    const limitT = M.replay.active ? M.replay.t : Infinity;

    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const pts = [];
    for (let i = 0; i < tr.t.length; i++) {
      if (tr.t[i] > limitT) break;
      const p = map.latLngToContainerPoint([tr.lat[i], tr.lon[i]]);
      pts.push(p);
    }
    if (pts.length < 2) {
      ctx.restore();
      return;
    }
    // glow line
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = 'rgba(90,170,255,0.10)';
    ctx.lineWidth = 9;
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(160,220,255,0.55)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
    ctx.stroke();

    // position dots every ~1h
    ctx.globalCompositeOperation = 'source-over';
    let lastT = 0;
    for (let i = 0; i < tr.t.length; i++) {
      if (tr.t[i] > limitT) break;
      if (tr.t[i] - lastT < 3600) continue;
      lastT = tr.t[i];
      const p = map.latLngToContainerPoint([tr.lat[i], tr.lon[i]]);
      ctx.beginPath();
      ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(220,240,255,0.85)';
      ctx.fill();
    }
    ctx.restore();
  };

  /* --------------------------------------------------------------- misc */
  M.fitRace = function (core) {
    const tr = dataStore.track;
    if (!tr || !tr.t.length) {
      M.map.setView([38, -38], 4);
      return;
    }
    const b = L.latLngBounds(tr.t.map((t, i) => [tr.lat[i], tr.lon[i]]));
    const leg = core.route?.leg;
    if (leg?.route) leg.route.forEach(([la, lo]) => b.extend([la, lo]));
    M.map.fitBounds(b, { padding: [60, 60], maxZoom: 7 });
  };

  M.zoom = function (d) {
    M.map.setZoom(M.map.getZoom() + d);
  };

  window.mapCtl = M;
  window.trimaranSvg = trimaranSvg;
  window.CLASS_COLORS = CLASS_COLORS;
})();
