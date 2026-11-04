/* ============================================================================
   Data — loads the static snapshot produced by GitHub Actions, keeps it fresh,
   and merges the official live standings API when the browser can reach it.
   ========================================================================== */
(function () {
  'use strict';

  const CORE = '/data/core.json';
  const OFFICIAL_API = 'https://www.routedurhum.com/_functions/classement?lang=fr';

  const store = {
    core: null,
    track: null, // decoded Laurent track {t:[],lat:[],lon:[]}
    history: null,
    oce50History: null,
    weather: null,
    official: null, // last official API payload
    officialOk: null, // null unknown, true/false
    officialAt: null,
    lastLoad: null,
    errors: [],
    listeners: [],
  };

  /* ------------------------------------------------------------ helpers */
  async function fetchJson(url, opts = {}) {
    const ctl = new AbortController();
    const to = setTimeout(() => ctl.abort(), opts.timeout || 12000);
    try {
      const res = await fetch(url, {
        signal: ctl.signal,
        cache: opts.cache || 'no-cache',
        headers: { Accept: 'application/json' },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status} sur ${url.replace(/^https?:\/\/[^/]+/, '')}`);
      const txt = await res.text();
      try {
        return JSON.parse(txt);
      } catch {
        throw new Error(`réponse invalide (JSON) sur ${url}`);
      }
    } finally {
      clearTimeout(to);
    }
  }

  function decodeTrack(raw, maxPoints) {
    if (!raw || !raw.n) return { t: [], lat: [], lon: [] };
    let ts = raw.t0;
    let lat = 0;
    let lon = 0;
    const out = { t: [], lat: [], lon: [] };
    const stride = maxPoints && raw.n > maxPoints ? raw.n / maxPoints : 1;
    let acc = 0;
    for (let i = 0; i < raw.n; i++) {
      if (i) {
        ts += raw.dt[i];
        lat += raw.la[i];
        lon += raw.lo[i];
      } else {
        lat = raw.la[0];
        lon = raw.lo[0];
      }
      acc += 1;
      if (i === 0 || i === raw.n - 1 || acc >= stride) {
        out.t.push(ts);
        out.lat.push(lat / 1e5);
        out.lon.push(lon / 1e5);
        acc = 0;
      }
    }
    return out;
  }

  /** The history must read oldest -> newest; detect and fix a reversed payload. */
  function normaliseHistory(h) {
    if (!h || !Array.isArray(h.dates) || h.dates.length < 2) return h;
    const first = Date.parse(h.dates[0]);
    const last = Date.parse(h.dates[h.dates.length - 1]);
    if (first > last) {
      const out = { ...h, dates: [...h.dates].reverse() };
      for (const [k, v] of Object.entries(h)) {
        if (Array.isArray(v) && v.length === h.dates.length) out[k] = [...v].reverse();
      }
      out.reversed = true;
      return out;
    }
    return h;
  }

  /* --------------------------------------------------------- noise filter */
  /** Remove the "hidden position" jitter the tracker publishes for some boats. */
  function denoiseTrack(tr) {
    if (!tr || tr.t.length < 4) return tr;
    const keep = [0];
    for (let i = 1; i < tr.t.length; i++) {
      const j = keep[keep.length - 1];
      const dt = (tr.t[i] - tr.t[j]) / 3600;
      const d = util.haversine(tr.lat[j], tr.lon[j], tr.lat[i], tr.lon[i]);
      // keep if we moved more than 0.35 nm, or if the last kept point is older than 15 min
      if (d > 0.35 || dt > 0.25) keep.push(i);
    }
    if (keep[keep.length - 1] !== tr.t.length - 1) keep.push(tr.t.length - 1);
    if (keep.length === tr.t.length) return tr;
    const out = { t: [], lat: [], lon: [] };
    for (const i of keep) {
      out.t.push(tr.t[i]);
      out.lat.push(tr.lat[i]);
      out.lon.push(tr.lon[i]);
    }
    out.removed = tr.t.length - out.t.length;
    return out;
  }

  /* --------------------------------------------------------------- load */
  store.load = async function (opts = {}) {
    const started = Date.now();
    const core = await fetchJson(`${CORE}?v=${Date.now()}`, { cache: 'no-cache' });
    store.core = core;
    store.lastLoad = new Date().toISOString();

    const fileUrl = (name) => `/data/${name}?v=${Date.now()}`;
    const jobs = [];
    if (core.files.trackLaurent) {
      jobs.push(
        fetchJson(fileUrl(core.files.trackLaurent))
          .then((raw) => {
            store.track = denoiseTrack(decodeTrack(raw));
          })
          .catch((e) => store.errors.push({ what: 'trace', msg: e.message }))
      );
    }
    jobs.push(
      fetchJson(fileUrl(core.files.historyLaurent))
        .then((h) => (store.history = normaliseHistory(h)))
        .catch((e) => store.errors.push({ what: 'historique', msg: e.message }))
    );
    jobs.push(
      fetchJson(fileUrl(core.files.historyOce50))
        .then((h) => (store.oce50History = h))
        .catch((e) => store.errors.push({ what: 'historique flotte', msg: e.message }))
    );
    if (opts.weather !== false) {
      jobs.push(
        fetchJson(fileUrl(core.files.weather))
          .then((w) => (store.weather = w))
          .catch((e) => store.errors.push({ what: 'météo', msg: e.message }))
      );
    }
    await Promise.all(jobs);

    store.lastLoadMs = Date.now() - started;
    store.emit('core');
    // fire and forget: official live standings (CORS enabled by the organiser)
    store.refreshOfficial().catch(() => {});
    return core;
  };

  /* --------------------------------- official live standings (browser) */
  store.refreshOfficial = async function () {
    try {
      const j = await fetchJson(`${OFFICIAL_API}&_=${Date.now()}`, { timeout: 9000, cache: 'no-store' });
      if (!j || !Array.isArray(j.classes)) throw new Error('format inattendu');
      store.official = j;
      store.officialOk = true;
      store.officialAt = new Date().toISOString();
      store.mergeOfficial();
      store.emit('official');
      return true;
    } catch (e) {
      store.officialOk = false;
      store.officialError = e.message;
      store.emit('official');
      return false;
    }
  };

  /** Overlay fresh official numbers on top of the snapshot (never the opposite). */
  /** True only for Laurent Bourguès — never for another skipper such as Bourgnon. */
  function isLaurentName(name) {
    const n = String(name || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toUpperCase();
    return /\bBOURGUES\b/.test(n.replace(/[^A-Z ]/g, ' '));
  }

  store.isLaurentName = isLaurentName;

  store.mergeOfficial = function () {
    const j = store.official;
    const core = store.core;
    if (!j || !core) return;
    const laurentName = (core.laurent.lastName || '').trim().toUpperCase();
    let found = null;
    let cls = null;
    for (const c of j.classes) {
      for (const l of c.lignes || []) {
        const name = `${l.prenom || ''} ${l.nom || ''}`.trim().toUpperCase();
        if (isLaurentName(name)) {
          found = l;
          cls = c;
          break;
        }
      }
      if (found) break;
    }
    if (!found) return;
    const L = core.laurent;
    L.rank = found.rang ?? L.rank;
    L.rankBefore = found.rangAvant ?? L.rankBefore;
    L.dtf = found.dtf ?? L.dtf;
    L.dtl = found.dtl ?? L.dtl;
    L.speed = found.vitesse ?? L.speed;
    L.speed24h = found.vitesse24h ?? L.speed24h;
    L.dist24h = found.dist24h ?? L.dist24h;
    L.heading = found.cap ?? L.heading;
    L.vmg = found.vmg ?? L.vmg;
    L.lat = Number.isFinite(found.lat) ? found.lat : L.lat;
    L.lon = Number.isFinite(found.lon) ? found.lon : L.lon;
    L.status = found.statut || L.status;
    L.rankHistory = (found.hist || []).map((r, i) => ({ i, rank: r }));
    L.officialLive = true;
    core.race.officialUpdate = j.maj || core.race.officialUpdate;
    core.race.distance = j.distance || core.race.distance;

    // refresh every class from the live API
    core.standings = j.classes.map((c) => ({
      cle: c.cle,
      nom: c.nom,
      couleur: c.couleur,
      partants: c.partants,
      etat: (c.lignes || []).map((l) => ({
        id: l.id,
        n: `${l.prenom || ''} ${l.nom || ''}`.trim(),
        b: l.bateau,
        r: l.rang ?? null,
        rb: l.rangAvant ?? null,
        st: l.statut || null,
        dtf: l.dtf ?? null,
        dtl: l.dtl ?? null,
        v: l.vitesse ?? null,
        v24: l.vitesse24h ?? null,
        d24: l.dist24h ?? null,
        cap: l.cap ?? null,
        vmg: l.vmg ?? null,
        lat: l.lat ?? null,
        lon: l.lon ?? null,
        hist: l.hist || null,
        motif: l.motif || null,
        raison: l.raison || null,
        photo: l.photo ? `https://static.wixstatic.com/media/${l.photo}` : null,
        photoBoat: l.photoBoat ? `https://static.wixstatic.com/media/${l.photoBoat}` : null,
        fiche: l.fiche ? `https://www.routedurhum.com${l.fiche}` : null,
      })),
    }));
    core.freshness.officialStandings = j.maj || core.freshness.officialStandings;
    core.freshness.officialLiveAt = store.officialAt;
  };

  /* ------------------------------------------------------------ derived */
  /** Ocean Fifty rivals sorted by official rank; with distance to Laurent. */
  store.rivals = function () {
    const core = store.core;
    if (!core) return [];
    const cls = core.standings.find((c) => /ocean/i.test(c.cle || c.nom || ''));
    if (!cls) return [];
    const me = cls.etat.find((b) => isLaurentName(b.n));
    return cls.etat
      .filter((b) => b !== me)
      .map((b) => ({
        ...b,
        gapToMe:
          me && Number.isFinite(b.lat) && Number.isFinite(me.lat)
            ? util.haversine(me.lat, me.lon, b.lat, b.lon)
            : null,
        ahead: me && Number.isFinite(b.dtf) && Number.isFinite(me.dtf) ? b.dtf < me.dtf : null,
      }))
      .sort((a, b) => (a.r ?? 99) - (b.r ?? 99));
  };

  /** Computed stats from Laurent's real track. */
  store.computed = function () {
    const tr = store.track;
    const core = store.core;
    if (!tr || tr.t.length < 2) return null;
    const n = tr.t.length;
    const last = n - 1;
    const tEnd = tr.t[last];

    const dist = util.pathLength(tr.t.map((t, i) => [tr.lat[i], tr.lon[i]]));
    const elapsedH = (tEnd - tr.t[0]) / 3600;

    function windowStats(hours) {
      const from = tEnd - hours * 3600;
      let i0 = util.idxAt(tr.t, from);
      if (i0 >= last) i0 = Math.max(0, last - 1);
      let d = 0;
      let vmax = 0;
      let vsum = 0;
      let wsum = 0;
      for (let i = i0 + 1; i <= last; i++) {
        const seg = util.haversine(tr.lat[i - 1], tr.lon[i - 1], tr.lat[i], tr.lon[i]);
        const dtH = (tr.t[i] - tr.t[i - 1]) / 3600;
        if (dtH <= 0 || dtH > 3) continue;
        d += seg;
        const v = seg / dtH;
        if (v > vmax) vmax = v;
        vsum += seg;
        wsum += dtH;
      }
      return {
        dist: d,
        vmax,
        avg: wsum > 0 ? vsum / wsum : null,
        hours: (tEnd - tr.t[i0]) / 3600,
      };
    }

    // cap moyen 24 h (circular mean)
    const i24 = util.idxAt(tr.t, tEnd - 24 * 3600);
    let sx = 0;
    let sy = 0;
    for (let i = i24 + 1; i <= last; i++) {
      const b = util.bearing(tr.lat[i - 1], tr.lon[i - 1], tr.lat[i], tr.lon[i]);
      const d = util.haversine(tr.lat[i - 1], tr.lon[i - 1], tr.lat[i], tr.lon[i]);
      sx += Math.cos((b * Math.PI) / 180) * d;
      sy += Math.sin((b * Math.PI) / 180) * d;
    }
    const cog24 = sx || sy ? ((Math.atan2(sy, sx) * 180) / Math.PI + 360) % 360 : null;

    const w1h = windowStats(1);
    const w4h = windowStats(4);
    const w12h = windowStats(12);
    const w24h = windowStats(24);

    return {
      dist,
      elapsedH,
      avgSinceStart: elapsedH > 0 ? dist / elapsedH : null,
      w1h,
      w4h,
      w12h,
      w24h,
      cog24,
      firstPoint: tr.t[0],
      lastPoint: tEnd,
      points: n,
      removedJitter: tr.removed || 0,
    };
  };

  /* --------------------------------------------------------------- events */
  store.on = (evt, cb) => store.listeners.push({ evt, cb });
  store.emit = (evt) => {
    for (const l of store.listeners) if (l.evt === evt) {
      try {
        l.cb(store);
      } catch (e) {
        console.error('[data] listener error', e);
      }
    }
  };

  window.dataStore = store;
})();
