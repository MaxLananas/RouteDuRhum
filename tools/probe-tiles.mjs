/**
 * Probe third-party resources the frontend depends on (tiles, weather, fonts).
 * Run from GitHub Actions (open internet). Prints status, content-type, bytes, CORS header.
 */
const UA = 'RouteDuRhumTracker/1.0 (+https://github.com/MaxLananas/RouteDuRhum)';

const targets = [
  ['esri-world-imagery', 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/3/3/4'],
  ['esri-ocean', 'https://server.arcgisonline.com/ArcGIS/rest/services/Ocean/World_Ocean_Base/MapServer/tile/3/3/4'],
  ['esri-dark-gray', 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/3/3/4'],
  ['gibs-blue-marble-bathy', 'https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/BlueMarble_ShadedRelief_Bathymetry/default/500m/3/3/4.jpeg'],
  ['gibs-viirs-truecolor', 'https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/VIIRS_SNPP_CorrectedReflectance_TrueColor/default/2026-11-03/GoogleMapsCompatible_Level9/3/3/4.jpg'],
  ['carto-dark', 'https://a.basemaps.cartocdn.com/dark_all/3/4/3.png'],
  ['carto-voyager', 'https://a.basemaps.cartocdn.com/rastertiles/voyager/3/4/3.png'],
  ['osm', 'https://tile.openstreetmap.org/3/4/3.png'],
  ['opentopomap', 'https://a.tile.opentopomap.org/3/4/3.png'],
  ['esri-attribution', 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/attribution'],
  ['open-meteo-grid', 'https://api.open-meteo.com/v1/forecast?latitude=40,-20&longitude=-40,-30&hourly=wind_speed_10m,wind_direction_10m,wind_gusts_10m&wind_speed_unit=kn&forecast_days=3&timezone=UTC'],
  ['open-meteo-marine-grid', 'https://marine-api.open-meteo.com/v1/marine?latitude=40,-20&longitude=-40,-30&hourly=wave_height,wave_direction,wave_period&forecast_days=3&timezone=UTC'],
  ['open-meteo-archive', 'https://archive-api.open-meteo.com/v1/archive?latitude=45&longitude=-30&start_date=2026-11-01&end_date=2026-11-03&hourly=wind_speed_10m&wind_speed_unit=kn'],
  ['rdr-carto-index', 'https://carto.routedurhum.com/'],
  ['rdr-carto-fr', 'https://carto.routedurhum.com/fr/index.html'],
  ['rdr-home', 'https://www.routedurhum.com/'],
  ['rdr-classement', 'https://www.routedurhum.com/_functions/classement?lang=fr'],
  ['rdr-live-api', 'https://www.routedurhum.com/_functions/live?lang=fr'],
  ['rdr-geoblog', 'https://carto.routedurhum.com/data/geoblog.json'],
  ['rdr-json-manifest', 'https://carto.routedurhum.com/data/manifest.json'],
  ['rdr-classement-en', 'https://www.routedurhum.com/_functions/classement?lang=en'],
];

const results = [];
for (const [name, url] of targets) {
  const t0 = Date.now();
  try {
    const ctl = new AbortController();
    const timer = setTimeout(() => ctl.abort(), 20000);
    const res = await fetch(url, { headers: { 'User-Agent': UA }, signal: ctl.signal, redirect: 'follow' });
    clearTimeout(timer);
    const buf = new Uint8Array(await res.arrayBuffer());
    const head = new TextDecoder('latin1').decode(buf.subarray(0, 160)).replace(/\s+/g, ' ');
    results.push({
      name,
      url,
      status: res.status,
      type: res.headers.get('content-type'),
      bytes: buf.length,
      cors: res.headers.get('access-control-allow-origin'),
      cache: res.headers.get('cache-control'),
      server: res.headers.get('server'),
      ms: Date.now() - t0,
      head: /json|text|xml|javascript/.test(res.headers.get('content-type') || '') ? head.slice(0, 140) : '',
    });
  } catch (e) {
    results.push({ name, url, error: String(e.message || e), ms: Date.now() - t0 });
  }
}

for (const r of results) console.log(JSON.stringify(r));
const fs = await import('node:fs');
fs.writeFileSync('tiles-probe.json', JSON.stringify(results, null, 1));
