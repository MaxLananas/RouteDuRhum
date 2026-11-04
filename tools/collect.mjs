/**
 * Collector: official Route du Rhum 2026 sources -> static JSON for the site.
 *
 * Sources
 *   carto.routedurhum.com/data/versions.txt            (Geovoile/YB tracker version index)
 *   carto.routedurhum.com/data/tracker_config.hwx      (race config, boats, route)
 *   carto.routedurhum.com/data/tracker_tracks.hwx      (full tracks since the start)
 *   carto.routedurhum.com/data/tracker_reports.hwx     (every official report, telemetry)
 *   carto.routedurhum.com/data/tracker_live.hwx        (latest report + fresh points)
 *   www.routedurhum.com/_functions/classement?lang=fr  (official standings API)
 *   api.open-meteo.com / marine-api.open-meteo.com      (model weather, NOT measured)
 *
 * Nothing here invents data: if a source fails, the previous payload is kept and the
 * failure is published in data/meta.json -> sources[].ok = false.
 */
import { mkdirSync, existsSync, readFileSync, writeFileSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { decodeHwx, parseConfig, parseTracks, parseReports, parseLive, livePoints } from './geo/hwx.mjs';

const ROOT = new URL('..', import.meta.url).pathname.replace(/\/$/, '');
const DATA = join(ROOT, 'data');
const UA = 'RouteDuRhumTracker/1.0 (+https://github.com/MaxLananas/RouteDuRhum)';
const CARTO = process.env.CARTO_BASE || 'https://carto.routedurhum.com/data/';
const INSPECT = process.argv.includes('--inspect');

mkdirSync(DATA, { recursive: true });
mkdirSync(join(DATA, 'history'), { recursive: true });
mkdirSync(join(DATA, 'diagnostics'), { recursive: true });

const log = (...a) => console.log(...a);
const now = () => new Date().toISOString();

function readJson(path, fallback = null) {
  try {
    return JSON.parse(readFileSync(path, 'utf8'));
  } catch {
    return fallback;
  }
}
function writeJson(path, obj, pretty = false) {
  mkdirSync(dirname(path), { recursive: true });
  const body = pretty ? JSON.stringify(obj, null, 2) : JSON.stringify(obj);
  writeFileSync(path, body + '\n');
  return body.length;
}
function ageHours(path) {
  try {
    return (Date.now() - statSync(path).mtimeMs) / 36e5;
  } catch {
    return Infinity;
  }
}

async function fetchWithRetry(url, { tries = 3, timeoutMs = 25000, headers = {} } = {}) {
  let lastErr;
  for (let i = 0; i < tries; i++) {
    const ctl = new AbortController();
    const timer = setTimeout(() => ctl.abort(), timeoutMs);
    try {
      const res = await fetch(url, {
        signal: ctl.signal,
        redirect: 'follow',
        headers: { 'User-Agent': UA, Accept: '*/*', 'Cache-Control': 'no-cache', ...headers },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const buf = new Uint8Array(await res.arrayBuffer());
      return { buf, res, ms: Date.now() };
    } catch (e) {
      lastErr = e;
      await new Promise((r) => setTimeout(r, 1200 * (i + 1)));
    } finally {
      clearTimeout(timer);
    }
  }
  throw lastErr;
}

const meta = readJson(join(DATA, 'meta.json'), {}) || {};
meta.sources = meta.sources || {};
meta.generatedAt = now();
meta.host = 'github-actions';
meta.runId = process.env.GITHUB_RUN_ID || null;
meta.runNumber = process.env.GITHUB_RUN_NUMBER || null;

function markSource(name, ok, extra = {}) {
  const prev = meta.sources[name] || {};
  meta.sources[name] = {
    ok,
    ...(ok ? { lastSuccess: now() } : { lastError: extra.error || 'unknown', lastFailure: now() }),
    lastAttempt: now(),
    lastSuccessBefore: prev.lastSuccess || prev.lastSuccessBefore || null,
    ...extra,
  };
}

/* ------------------------------------------------------------ 1. versions */
let versions = {};
let versionsOk = false;
try {
  const { buf } = await fetchWithRetry(`${CARTO}versions.txt?nocache=${Date.now()}`, { headers: { Accept: 'text/plain' } });
  const txt = new TextDecoder().decode(buf);
  for (const m of txt.matchAll(/(\w+)\s*:\s*(\d+)/g)) versions[m[1]] = Number(m[2]);
  versionsOk = Object.keys(versions).length > 0;
  log('versions', txt.trim());
  markSource('carto.versions', versionsOk, { versions });
} catch (e) {
  log('versions failed:', e.message);
  markSource('carto.versions', false, { error: e.message });
  versions = meta.sources['carto.versions']?.versions || {};
}

const fetchedAt = Date.now();
const versionCache = meta.versionCache || {};
async function resource(name, { force = false, maxAgeH = 6 } = {}) {
  const v = versions[name];
  const cached = versionCache[name];
  const file = join(DATA, `.cache_${name}`);
  const stale = ageHours(file) > maxAgeH;
  if (!force && cached && v && cached === v && existsSync(file) && !stale) {
    log(`${name}: cache hit v=${v}`);
    return new Uint8Array(readFileSync(file));
  }
  const url = `${CARTO}tracker_${name}.hwx?v=${v ?? Date.now()}`;
  const { buf } = await fetchWithRetry(url, { headers: { Accept: 'application/octet-stream' } });
  const dec = decodeHwx(buf);
  mkdirSync(DATA, { recursive: true });
  writeFileSync(file, dec);
  versionCache[name] = v ?? null;
  meta.versionCache = versionCache;
  log(`${name}: downloaded ${buf.length}B -> ${dec.length}B decoded (v=${v})`);
  return dec;
}

/* -------------------------------------------------------------- 2. config */
let config = readJson(join(DATA, 'config.json'));
try {
  const dec = await resource('config', { maxAgeH: 12 });
  const parsed = parseConfig(dec);
  const xml = new TextDecoder().decode(dec);
  const cfgAttrs = (xml.match(/<config\b([^>]*)>/) || [, ''])[1];
  const attr = (s, n) => (s.match(new RegExp(`${n}="([^"]*)"`)) || [, null])[1];
  const routeStr = (xml.match(/<route>([^<]*)<\/route>/) || [, ''])[1];
  const route = routeStr
    .split(';')
    .map((p) => p.split(',').map(Number))
    .filter((p) => p.length === 2 && p.every(Number.isFinite))
    .map(([lat, lon]) => [lat, lon]);
  const legs = [...xml.matchAll(/<leg\b([^>]*)>([\s\S]*?)<\/leg>/g)].map((m) => {
    const a = m[1];
    const runIds = [...m[2].matchAll(/<run\b[^>]*id="(\d+)"[^>]*length="([\d.]+)"/g)].map((r) => ({ id: r[1], length: Number(r[2]) }));
    return {
      num: attr(a, 'num'),
      start: attr(a, 'start'),
      arrival: attr(a, 'arrival'),
      total: Number(attr(a, 'total')),
      route,
      runs: runIds,
    };
  });
  const waypoints = {};
  for (const kind of ['gate', 'mark', 'iceberg', 'zone', 'tss', 'island', 'wp', 'waypoint', 'point']) {
    const re = new RegExp(`<${kind}\\b([^>]*?)(/>|>([\\s\\S]*?)</${kind}>)`, 'g');
    let m;
    while ((m = re.exec(xml))) {
      const a = m[1];
      const inner = m[3] || '';
      const pts = [...inner.matchAll(/(-?\d+\.\d+)\s*,\s*(-?\d+\.\d+)/g)].map((p) => [Number(p[1]), Number(p[2])]);
      const lat = Number(attr(a, 'lat'));
      const lng = Number(attr(a, 'lng'));
      (waypoints[kind] ||= []).push({
        name: attr(a, 'name'),
        type: kind,
        lat: Number.isFinite(lat) && lat !== 0 ? lat : undefined,
        lon: Number.isFinite(lng) && lng !== 0 ? lng : undefined,
        polygon: pts.length ? pts : undefined,
        raw: Object.fromEntries([...a.matchAll(/(\w+)="([^"]*)"/g)].slice(0, 12).map((x) => [x[1], x[2]])),
      });
    }
  }
  config = {
    race: {
      name: attr(cfgAttrs, 'name'),
      category: attr(cfgAttrs, 'category'),
      state: attr(cfgAttrs, 'state'),
      start: attr(cfgAttrs, 'date'),
    },
    legs,
    classes: parsed.classes.map((c) => ({ name: c.name, boats: c.boats.length })),
    boats: parsed.boats,
    waypoints,
    updatedAt: now(),
    version: versions.config ?? null,
  };
  writeJson(join(DATA, 'config.json'), config);
  writeJson(join(DATA, 'boats.json'), config.boats);
  markSource('carto.config', true, { bytes: dec.length, boats: Object.keys(parsed.boats).length });
  meta.race = config.race;
  meta.classes = config.classes;
} catch (e) {
  log('config failed:', e.message);
  markSource('carto.config', false, { error: e.message });
  if (!config) throw new Error('no config available at all');
}

/* -------------------------------------------------------------- 3. tracks */
let tracks = null;
try {
  const dec = await resource('tracks', { maxAgeH: 2 });
  const raw = parseTracks(dec);
  const boats = {};
  let predPoints = 0;
  for (const [id, t] of Object.entries(raw)) {
    if (!t.t.length) continue;
    boats[id] = t;
    if (t.pred) predPoints += t.pred.t.length;
  }
  if (INSPECT) {
    const j = JSON.parse(new TextDecoder().decode(dec));
    const sample = (j.tracks || []).find((x) => String(x.id) === String(findLaurentId(config.boats)));
    writeFileSync(
      join(DATA, 'diagnostics', 'pred-sample.json'),
      JSON.stringify({ hasPred: !!sample?.pred, head: sample?.pred?.slice(0, 6), count: sample?.pred?.length }, null, 1)
    );
  }
  // pred: predicted route from live/reports if present
  tracks = { updatedAt: now(), version: versions.tracks ?? null, boats };
  writeJson(join(DATA, 'tracks.json'), tracks);
  const laurentId = findLaurentId(config.boats);
  markSource('carto.tracks', true, {
    bytes: dec.length,
    points: Object.values(boats).reduce((s, b) => s + b.t.length, 0),
    predPoints,
    boats: Object.keys(boats).length,
    laurentPoints: laurentId && boats[laurentId] ? boats[laurentId].t.length : 0,
    lastPoint: laurentId && boats[laurentId] ? new Date(boats[laurentId].t.at(-1) * 1000).toISOString() : null,
  });
} catch (e) {
  log('tracks failed:', e.message);
  markSource('carto.tracks', false, { error: e.message });
  tracks = readJson(join(DATA, 'tracks.json'));
}

/* ------------------------------------------------------------- 4. reports */
let reports = null;
try {
  const dec = await resource('reports', { maxAgeH: 2 });
  const parsed = parseReports(dec);
  const columns = Object.keys(parsed[0]?.lines[0] || {});
  const slim = parsed.map((r) => ({
    date: r.date,
    lines: Object.fromEntries(r.lines.map((l) => [String(l.boat), l])),
  }));
  reports = { updatedAt: now(), version: versions.reports ?? null, columns, reports: slim };
  writeJson(join(DATA, 'reports.json'), reports);
  markSource('carto.reports', true, { bytes: dec.length, reports: slim.length, columns: columns.length, latest: slim[0]?.date || null });
  if (INSPECT) {
    const lines = [
      `# Tracker schema inspection — ${now()}`,
      '',
      '## reports columns',
      '',
      columns.join(', '),
      '',
      '## latest reports (first 3, first boats)',
      '',
    ];
    for (const r of slim.slice(0, 3)) {
      lines.push(`### ${r.date}`, '', '```json', JSON.stringify(Object.entries(r.lines).slice(0, 3), null, 1), '```', '');
    }
    lines.push('## a full report line (boat = first)', '```json', JSON.stringify(Object.values(slim[0]?.lines || {})[0], null, 1), '```', '');
    if (slim.length > 1) {
      const prev = Object.values(slim[1].lines)[0];
      const cur = Object.values(slim[0].lines)[0];
      lines.push('## columns seen in report[1] but not report[0]', '```json',
        JSON.stringify(Object.keys(prev).filter((k) => !(k in cur))), '```');
    }
    lines.push('## splittimes', '```json', JSON.stringify(readSplittimes(dec), null, 1).slice(0, 4000), '```');
    writeFileSync(join(DATA, 'diagnostics', 'schema.md'), lines.join('\n'));
  }
} catch (e) {
  log('reports failed:', e.message);
  markSource('carto.reports', false, { error: e.message });
  reports = readJson(join(DATA, 'reports.json'));
}

function readSplittimes(dec) {
  try {
    const j = JSON.parse(new TextDecoder().decode(dec));
    return j.reports?.splittimes || null;
  } catch {
    return null;
  }
}

/* ---------------------------------------------------------------- 5. live */
try {
  const dec = await resource('live', { maxAgeH: 1 });
  const live = parseLive(dec);
  const pts = livePoints(live);
  const state = live?.reports?.state || live?.reports?.state;
  const history = live?.reports?.history || [];
  const latestDate = history[0]?.date || null;
  let fresh = 0;
  if (tracks) {
    for (const [id, points] of Object.entries(pts)) {
      const boat = (tracks.boats[id] ||= { t: [], lat: [], lon: [] });
      const seen = new Set(boat.t);
      for (const [ts, lat, lon] of points) {
        if (seen.has(ts)) continue;
        // keep arrays sorted
        let i = boat.t.length;
        while (i > 0 && boat.t[i - 1] > ts) i--;
        boat.t.splice(i, 0, ts);
        boat.lat.splice(i, 0, Math.round(lat * 1e5) / 1e5);
        boat.lon.splice(i, 0, Math.round(lon * 1e5) / 1e5);
        seen.add(ts);
        fresh++;
      }
    }
    if (fresh > 0) {
      tracks.updatedAt = now();
      writeJson(join(DATA, 'tracks.json'), tracks);
    }
  }
  writeJson(join(DATA, 'live.json'), { updatedAt: now(), state, latestDate, raw: live, freshPoints: fresh });
  markSource('carto.live', true, { bytes: dec.length, bytesDecoded: dec.length, latestReport: latestDate, freshPoints: fresh, state });
} catch (e) {
  log('live failed:', e.message);
  markSource('carto.live', false, { error: e.message });
}

/* ------------------------------------------------- 6. official classement */
function findLaurentLine(classement) {
  for (const c of classement?.classes || []) {
    for (const l of c.lignes || []) {
      const full = `${l.prenom || ''} ${l.nom || ''}`.trim();
      if (LAURENT.lastName.test(full) || LAURENT.boat.test(l.bateau || '')) return { classe: c, ligne: l };
    }
  }
  return null;
}

let classement = readJson(join(DATA, 'classement.json'));
try {
  const { buf } = await fetchWithRetry('https://www.routedurhum.com/_functions/classement?lang=fr', {
    headers: { Accept: 'application/json' },
    tries: 4,
  });
  const j = JSON.parse(new TextDecoder().decode(buf));
  classement = {
    updatedAt: now(),
    phase: j.phase,
    depart: j.depart,
    maj: j.maj,
    distance: j.distance,
    classes: (j.classes || []).map((c) => ({
      cle: c.cle,
      nom: c.nom,
      couleur: c.couleur,
      icone: c.icone,
      partants: c.partants,
      lignes: (c.lignes || []).map((l) => ({
        id: l.id,
        prenom: (l.prenom || '').trim(),
        nom: (l.nom || '').trim(),
        bateau: l.bateau,
        voile: l.voile,
        photo: l.photo,
        photoBateau: l.photoBateau,
        pays: l.pays,
        filtres: l.filtres,
        fiche: l.fiche,
        statut: l.statut,
        statutRene: l.statutRene,
        motif: l.motif,
        raison: l.raison,
        article: l.article,
        rang: l.rang,
        rangAvant: l.rangAvant,
        dtf: l.dtf,
        dtl: l.dtl,
        vitesse: l.vitesse,
        vitesse24h: l.vitesse24h,
        dist24h: l.dist24h,
        cap: l.cap,
        vmg: l.vmg,
        lat: l.lat,
        lon: l.lon,
        hist: l.hist,
      })),
    })),
  };
  writeJson(join(DATA, 'classement.json'), classement);
  const laurent = findLaurentLine(classement);
  if (laurent) {
    writeJson(join(DATA, 'laurent.json'), {
      updatedAt: now(),
      classe: { cle: laurent.classe.cle, nom: laurent.classe.nom, couleur: laurent.classe.couleur, partants: laurent.classe.partants },
      ...laurent.ligne,
      trackerId: findLaurentId(config.boats),
    });
  }
  markSource('rdr.classement', true, {
    bytes: buf.length,
    maj: classement.maj,
    boats: classement.classes.reduce((s, c) => s + c.lignes.length, 0),
    laurentFound: !!laurent,
  });
  meta.race = { ...(meta.race || {}), depart: j.depart, distance: j.distance, phase: j.phase, maj: j.maj };
} catch (e) {
  log('classement failed:', e.message);
  markSource('rdr.classement', false, { error: e.message });
}

/* ------------------------------------------------------------- 7. weather */
/* Model data (Open-Meteo / ECMWF-IFS + NOAA GFS-Wave), explicitly NOT measured on board. */
async function openMeteo(url) {
  const { buf } = await fetchWithRetry(url, { tries: 2, timeoutMs: 20000 });
  return JSON.parse(new TextDecoder().decode(buf));
}

const laurent = readJson(join(DATA, 'laurent.json'));
const laurentTracks = tracks && laurent?.trackerId ? tracks.boats[laurent.trackerId] : null;
const lastPt = laurentTracks?.t?.length
  ? { ts: laurentTracks.t.at(-1), lat: laurentTracks.lat.at(-1), lon: laurentTracks.lon.at(-1) }
  : laurent?.lat && laurent?.lon
    ? { ts: Date.parse(classement?.maj || now()) / 1000, lat: laurent.lat, lon: laurent.lon }
    : null;

try {
  if (!lastPt) throw new Error('no position for Laurent');
  const lat = lastPt.lat.toFixed(3);
  const lon = lastPt.lon.toFixed(3);
  const atmo = await openMeteo(
    `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
      '&hourly=temperature_2m,relative_humidity_2m,precipitation,pressure_msl,cloud_cover,' +
      'wind_speed_10m,wind_direction_10m,wind_gusts_10m,visibility,cape&wind_speed_unit=kn&timezone=UTC&forecast_days=5'
  );
  const marine = await openMeteo(
    `https://marine-api.open-meteo.com/v1/marine?latitude=${lat}&longitude=${lon}` +
      '&hourly=wave_height,wave_direction,wave_period,swell_wave_height,swell_wave_direction,swell_wave_period,' +
      'wind_wave_height,wind_wave_direction,sea_surface_temperature&timezone=UTC&forecast_days=5'
  );
  writeJson(join(DATA, 'weather-boat.json'), {
    updatedAt: now(),
    position: { lat: Number(lat), lon: Number(lon), at: new Date(lastPt.ts * 1000).toISOString(), source: 'trace officielle' },
    models: {
      atmosphere: 'Open-Meteo · ECMWF IFS / GFS (modèle, non mesuré à bord)',
      marine: 'Open-Meteo Marine · MeteoFrance / ECMWF WAM (modèle, non mesuré à bord)',
    },
    atmo,
    marine,
  });
  markSource('open-meteo', true, { position: { lat: Number(lat), lon: Number(lon) } });
} catch (e) {
  log('weather failed:', e.message);
  markSource('open-meteo', false, { error: e.message });
}

/* --------------------------------------------------------------- 8. meta */
meta.laurent = laurent
  ? {
      nom: `${laurent.prenom} ${laurent.nom}`.trim(),
      bateau: laurent.bateau,
      classe: laurent.classe?.nom || laurent.classe,
      trackerId: laurent.trackerId,
      rang: laurent.rang,
      dtf: laurent.dtf,
      statut: laurent.statut,
    }
  : meta.laurent || null;
meta.dataFreshness = {
  live: meta.sources['carto.live']?.latestReport || null,
  reports: meta.sources['carto.reports']?.latest || null,
  trackLast: meta.sources['carto.tracks']?.lastPoint || null,
};
writeJson(join(DATA, 'meta.json'), meta, true);

/* ------------------------------------- 9. sanity: never publish empty core */
const boats = Object.keys(config?.boats || {}).length;
if (!boats) {
  log('FATAL: config has no boats');
  process.exitCode = 1;
}
log(`done in ${((Date.now() - fetchedAt) / 1000).toFixed(1)}s — boats=${boats} laurent=${meta.laurent?.nom || '??'}`);
