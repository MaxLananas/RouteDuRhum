/**
 * Visual + functional test of the site with a real browser.
 * Captures desktop & mobile screenshots of every tab, exercises replay,
 * weather layers and error handling, and records console/network problems.
 *
 * Runs in CI (system Chrome) or locally (CHROME_PATH env var).
 */
import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import puppeteer from 'puppeteer-core';

const PORT = 8099;
const BASE = `http://127.0.0.1:${PORT}/`;
const OUT = 'data/diagnostics/visual';
const CHROME = process.env.CHROME_PATH || '/usr/bin/google-chrome';

rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });

const server = spawn('python3', ['-m', 'http.server', String(PORT), '--bind', '127.0.0.1'], {
  cwd: 'public',
  stdio: 'ignore',
});
await new Promise((r) => setTimeout(r, 900));

const report = { startedAt: new Date().toISOString(), shots: [], console: [], network: [], checks: [], errors: [] };

function check(name, ok, detail) {
  report.checks.push({ name, ok, detail });
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? ' — ' + detail : ''}`);
}

const browser = await puppeteer.launch({
  executablePath: CHROME,
  args: ['--no-sandbox', '--disable-dev-shm-usage', '--force-color-profile=srgb', '--font-render-hinting=none'],
  headless: true,
});

async function newPage(width, height, mobile) {
  const page = await browser.newPage();
  await page.setViewport({ width, height, deviceScaleFactor: mobile ? 2 : 1, isMobile: !!mobile, hasTouch: !!mobile });
  page.on('console', (m) => {
    if (m.type() === 'error' || m.type() === 'warning') report.console.push(`[${m.type()}] ${m.text().slice(0, 300)}`);
  });
  page.on('pageerror', (e) => report.console.push(`[pageerror] ${e.message}`));
  page.on('requestfailed', (r) => {
    const u = r.url();
    if (/favicon/.test(u)) return;
    report.network.push(`FAILED ${u.slice(0, 140)} — ${r.failure()?.errorText}`);
  });
  page.on('response', (r) => {
    if (r.status() >= 400) report.network.push(`HTTP ${r.status()} ${r.url().slice(0, 140)}`);
  });
  return page;
}

async function shot(page, name, opts = {}) {
  const path = join(OUT, `${name}.png`);
  await page.screenshot({ path, fullPage: !!opts.full, clip: opts.clip });
  report.shots.push(name);
  return path;
}

/* ------------------------------------------------------------- desktop */
const page = await newPage(1600, 1000, false);
await page.goto(BASE, { waitUntil: 'networkidle2', timeout: 90000 });
await new Promise((r) => setTimeout(r, 5000));

const info = await page.evaluate(() => ({
  core: !!window.dataStore?.core,
  laurent: window.dataStore?.core?.laurent
    ? {
        rank: window.dataStore.core.laurent.rank,
        speed: window.dataStore.core.laurent.speed,
        lat: window.dataStore.core.laurent.lat,
        lon: window.dataStore.core.laurent.lon,
        name: window.dataStore.core.laurent.lastName,
        trackerId: window.dataStore.core.laurent.trackerId,
      }
    : null,
  trackPoints: window.dataStore?.track?.t?.length || 0,
  boats: window.dataStore?.core ? Object.keys(window.dataStore.core.boats).length : 0,
  standings: window.dataStore?.core?.standings?.length || 0,
  markers: document.querySelectorAll('.boat-marker').length,
  wxReady: window.wxCtl?.ready,
  wxError: window.wxCtl?.error || null,
  wxUrls: window.wxCtl?.urls,
  perfRows: Array.from(document.querySelectorAll('#perfBody tr')).map((tr) => tr.textContent.trim().replace(/\s+/g, ' ')),
  gapRows: Array.from(document.querySelectorAll('#gapBody tr')).map((tr) => tr.textContent.trim().replace(/\s+/g, ' ')),
  officialOk: window.dataStore?.officialOk,
  officialError: window.dataStore?.officialError || null,
  status: document.getElementById('mapStatusTxt')?.textContent,
  rankTxt: document.getElementById('sRank')?.textContent?.trim(),
  speedTxt: document.getElementById('sSpeed')?.textContent?.trim(),
  charts: Object.keys(window.charts?.instances || {}),
  trailCanvasPainted: (() => {
    const c = document.getElementById('trailCanvas');
    if (!c) return false;
    const ctx = c.getContext('2d');
    const d = ctx.getImageData(0, 0, Math.min(c.width, 800), Math.min(c.height, 600)).data;
    for (let i = 3; i < d.length; i += 4) if (d[i] > 0) return true;
    return false;
  })(),
  mapZoom: window.mapCtl?.map?.getZoom(),
  mapCenter: window.mapCtl?.map?.getCenter?.(),
}));

check('core chargé', info.core);
check('identifier Laurent', /BOURG/i.test(info.laurent?.name || ''), `${info.laurent?.name} (tracker ${info.laurent?.trackerId})`);
check('trace Laurent décodée', info.trackPoints > 100, `${info.trackPoints} points`);
check('flotte configurée', info.boats > 50, `${info.boats} bateaux`);
check('classements chargés', info.standings === 6, `${info.standings} classes`);
check('pictogrammes sur la carte', info.markers >= 2, `${info.markers} marqueurs`);
check('trace dessinée sur le canvas', info.trailCanvasPainted);
check('météo modèle chargée', info.wxReady === true, info.wxError || '');
check('performances officielles non nulles', (info.perfRows || []).some((r) => /[1-9]/.test(r)), JSON.stringify(info.perfRows || []).slice(0, 160));
check('écarts flotte sans doublon Laurent', (info.gapRows || []).every((r) => !/BOURG/i.test(r)), JSON.stringify(info.gapRows || []).slice(0, 160));
check('API officielle live', info.officialOk === true, info.officialError || '');
check('rang affiché', /\d/.test(info.rankTxt || ''), info.rankTxt);
check('vitesse affichée', /\d/.test(info.speedTxt || ''), info.speedTxt);
check('aucune erreur JS', report.console.filter((c) => c.startsWith('[pageerror]')).length === 0);

await shot(page, '01-desktop-direct');

/* tabs */
for (const [tab, name] of [
  ['fleet', '02-desktop-flotte'],
  ['charts', '03-desktop-analyses'],
  ['meteo', '04-desktop-meteo'],
  ['boat', '05-desktop-bateau'],
  ['sources', '06-desktop-sources'],
]) {
  await page.click(`#tabs .tab[data-pane="${tab}"]`);
  await new Promise((r) => setTimeout(r, 1400));
  await shot(page, name);
}
const chartsInfo = await page.evaluate(() => {
  const keys = Object.keys(window.charts?.instances || {});
  return keys.map((k) => {
    const c = window.charts.instances[k];
    return { key: k, points: c.data?.datasets?.[0]?.data?.length || 0, w: c.width, h: c.height, visible: c.canvas.offsetParent !== null };
  });
});
check('graphiques rendus', chartsInfo.length >= 4, JSON.stringify(chartsInfo));

/* weather layers */
await page.click('#tabs .tab[data-pane="meteo"]');
await page.click('#tglWind');
await new Promise((r) => setTimeout(r, 2500));
await shot(page, '07-desktop-couche-vent');
const windPainted = await page.evaluate(() => {
  const c = document.getElementById('windCanvas');
  const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data;
  let n = 0;
  for (let i = 3; i < d.length; i += 4) if (d[i] > 0) n++;
  return n;
});
check('particules de vent dessinées', windPainted > 1000, `${windPainted} pixels opaques`);
// hover the wind layer to capture the model readout chip
const box = await page.$eval('#map', (el) => {
  const r = el.getBoundingClientRect();
  return { x: r.x + r.width * 0.45, y: r.y + r.height * 0.5 };
});
await page.mouse.move(box.x, box.y);
await new Promise((r) => setTimeout(r, 900));
const readout = await page.$eval('#wxReadout', (el) => (el.classList.contains('hide') ? null : el.textContent.trim()));
check('lecteur météo au survol', !!readout, readout || 'absent');
await shot(page, '07b-desktop-lecteur-vent');
await page.click('#tglWaves');
await new Promise((r) => setTimeout(r, 1800));
await page.mouse.move(box.x + 40, box.y + 30);
await new Promise((r) => setTimeout(r, 700));
await shot(page, '08-desktop-couche-vagues');
await page.click('#tglPressure');
await new Promise((r) => setTimeout(r, 1800));
await page.click('#tglBarbs');
await new Promise((r) => setTimeout(r, 1500));
await shot(page, '09-desktop-couche-pression');

/* replay */
await page.click('#tabs .tab[data-pane="live"]');
await page.click('#btnReplay');
await new Promise((r) => setTimeout(r, 2500));
const replayState = await page.evaluate(() => ({
  active: window.mapCtl.replay.active,
  playing: window.mapCtl.replay.playing,
  t: window.mapCtl.replay.t,
  timelineOpen: document.getElementById('timeline')?.classList.contains('is-open'),
  ghost: !!window.mapCtl.ghost,
}));
check('replay actif', replayState.active && replayState.timelineOpen && replayState.ghost, JSON.stringify(replayState));
await shot(page, '10-desktop-replay');
// scrub
await page.evaluate(() => {
  const r = document.getElementById('tlRange');
  r.value = '350';
  r.dispatchEvent(new Event('input', { bubbles: true }));
});
await new Promise((r) => setTimeout(r, 900));
await shot(page, '11-desktop-replay-curseur');

/* basemaps */
await page.click('#tlLive');
await new Promise((r) => setTimeout(r, 600));
await page.click('#baseSeg button[data-base="dark"]');
await new Promise((r) => setTimeout(r, 2200));
await shot(page, '12-desktop-fond-nuit');
await page.click('#baseSeg button[data-base="sat"]');
await new Promise((r) => setTimeout(r, 1500));

/* click a rival in the fleet table */
await page.click('#tabs .tab[data-pane="fleet"]');
await new Promise((r) => setTimeout(r, 600));
const rows = await page.$$('#fleetTable tbody tr');
if (rows.length > 3) {
  await rows[2].click();
  await new Promise((r) => setTimeout(r, 1600));
}
await shot(page, '13-desktop-flotte-focus');

/* -------------------------------------------------------------- mobile */
const m = await newPage(390, 844, true);
await m.goto(BASE, { waitUntil: 'networkidle2', timeout: 90000 });
await new Promise((r) => setTimeout(r, 5000));
await shot(m, '20-mobile-carte');
const mobileInfo = await m.evaluate(() => ({
  railOpen: document.getElementById('rail')?.classList.contains('is-open'),
  markers: document.querySelectorAll('.boat-marker').length,
  topbarH: document.querySelector('.topbar')?.getBoundingClientRect().height,
  overflow: document.documentElement.scrollWidth > window.innerWidth + 2,
  scrollWidth: document.documentElement.scrollWidth,
  innerWidth: window.innerWidth,
}));
check('mobile : pas de débordement horizontal', !mobileInfo.overflow, `${mobileInfo.scrollWidth}px / ${mobileInfo.innerWidth}px`);
check('mobile : marqueurs présents', mobileInfo.markers >= 2, String(mobileInfo.markers));
await m.evaluate(() => document.getElementById('rail')?.classList.add('is-open'));
await new Promise((r) => setTimeout(r, 900));
await shot(m, '21-mobile-panneau');
await m.click('#tabs .tab[data-pane="charts"]');
await new Promise((r) => setTimeout(r, 1500));
await shot(m, '22-mobile-analyses');
await m.click('#tabs .tab[data-pane="meteo"]');
await new Promise((r) => setTimeout(r, 1200));
await shot(m, '23-mobile-meteo');

/* ------------------------------------------------- source failure test */
const f = await newPage(1280, 800, false);
await f.setRequestInterception(true);
f.on('request', (req) => {
  const u = req.url();
  if (/\/data\/core\.json/.test(u)) return req.respond({ status: 503, contentType: 'text/plain', body: 'unavailable' });
  if (/open-meteo/.test(u)) return req.abort();
  if (/classement/.test(u)) return req.abort();
  req.continue();
});
await f.goto(BASE, { waitUntil: 'domcontentloaded', timeout: 60000 });
await new Promise((r) => setTimeout(r, 4500));
const failInfo = await f.evaluate(() => ({
  hasErrorBox: !!document.querySelector('.errbox'),
  text: document.querySelector('.errbox')?.textContent?.slice(0, 200) || '',
  markers: document.querySelectorAll('.boat-marker').length,
  status: document.getElementById('mapStatusTxt')?.textContent,
}));
check('panne de source : message explicite', failInfo.hasErrorBox && /indisponibles/i.test(failInfo.text), failInfo.text.slice(0, 90));
check('panne de source : aucune fausse position', failInfo.markers === 0, `${failInfo.markers} marqueurs`);
await shot(f, '30-panne-source');

/* partial failure: core ok, live API + weather down */
const p2 = await newPage(1280, 800, false);
await p2.setRequestInterception(true);
p2.on('request', (req) => {
  const u = req.url();
  if (/open-meteo|marine-api/.test(u)) return req.abort();
  if (/_functions\/classement/.test(u)) return req.abort();
  req.continue();
});
await p2.goto(BASE, { waitUntil: 'domcontentloaded', timeout: 60000 });
await new Promise((r) => setTimeout(r, 5000));
const partial = await p2.evaluate(() => ({
  markers: document.querySelectorAll('.boat-marker').length,
  status: document.getElementById('mapStatusTxt')?.textContent,
  wxUrls: window.wxCtl?.urls,
  perfRows: Array.from(document.querySelectorAll('#perfBody tr')).map((tr) => tr.textContent.trim().replace(/\s+/g, ' ')),
  gapRows: Array.from(document.querySelectorAll('#gapBody tr')).map((tr) => tr.textContent.trim().replace(/\s+/g, ' ')),
  officialOk: window.dataStore?.officialOk,
  wxReady: window.wxCtl?.ready,
  rank: document.getElementById('sRank')?.textContent?.trim(),
}));
check('API live bloquée : snapshot conservé', partial.markers > 0 && /\d/.test(partial.rank || ''), JSON.stringify(partial));
await shot(p2, '31-panne-api-live');
await p2.click('#tabs .tab[data-pane="meteo"]');
await new Promise((r) => setTimeout(r, 1200));
await shot(p2, '32-panne-meteo');

/* ----------------------------------------------------------------- done */
report.info = info;
report.mobileInfo = mobileInfo;
report.charts = chartsInfo;
report.finishedAt = new Date().toISOString();
report.passed = report.checks.filter((c) => c.ok).length;
report.failed = report.checks.filter((c) => !c.ok).length;

writeFileSync(join(OUT, 'report.json'), JSON.stringify(report, null, 1));
writeFileSync(
  join(OUT, 'report.md'),
  [
    `# Rapport de test — ${report.startedAt}`,
    '',
    `**${report.passed} tests OK / ${report.failed} en échec**`,
    '',
    '| Test | Résultat | Détail |',
    '| --- | --- | --- |',
    ...report.checks.map((c) => `| ${c.name} | ${c.ok ? '✅' : '❌'} | ${String(c.detail || '').replace(/\|/g, '/').slice(0, 160)} |`),
    '',
    '## Console',
    '```',
    ...report.console.slice(0, 60),
    '```',
    '',
    '## Réseau (erreurs)',
    '```',
    ...report.network.slice(0, 60),
    '```',
  ].join('\n')
);

await browser.close();
server.kill();
console.log(`\n${report.passed} OK / ${report.failed} FAIL — screenshots in ${OUT}`);
process.exit(report.failed > 0 ? 1 : 0);
