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

/* official race communications live in the Flotte pane */
await page.click('#tabs .tab[data-pane="fleet"]');
await new Promise((r) => setTimeout(r, 1200));
const news = await page.evaluate(() => {
  const box = document.getElementById('raceNews');
  const items = [...(box?.querySelectorAll('.news') || [])];
  return {
    count: items.length,
    first: items[0]?.textContent.replace(/\s+/g, ' ').trim().slice(0, 90) || '',
    links: items.filter((n) => n.querySelector('a[href^="http"]')).length,
    empty: /Aucun abandon/.test(box?.textContent || ''),
  };
});
// capture the pane scrolled to the news block, so the section is actually reviewed
await page.evaluate(() => {
  const n = document.getElementById('raceNews');
  n?.scrollIntoView({ block: 'center' });
});
await new Promise((r) => setTimeout(r, 500));
await shot(page, '02b-desktop-communiques');
check('communiqués de course affichés',
  news.count > 0 && news.first.length > 12 && !news.empty,
  JSON.stringify(news));

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
// rival comparison toggle
await page.click('#tabs .tab[data-pane="charts"]');
await new Promise((r) => setTimeout(r, 700));
await page.click('#tglRivals');
await new Promise((r) => setTimeout(r, 1200));
const rivalSeries = await page.evaluate(() => {
  const c = window.charts.instances.chartRivals;
  return c ? c.data.datasets.length : 0;
});
check('comparaison avec la flotte', rivalSeries >= 10, `${rivalSeries} courbes`);
await shot(page, '03b-desktop-flotte-compare');

const chartsInfo = await page.evaluate(() => {
  const keys = Object.keys(window.charts?.instances || {});
  return keys.map((k) => {
    const c = window.charts.instances[k];
    return { key: k, points: c.data?.datasets?.[0]?.data?.length || 0, w: c.width, h: c.height, visible: c.canvas.offsetParent !== null };
  });
});
check('graphiques rendus', chartsInfo.length >= 4, JSON.stringify(chartsInfo));

// the x axis must be a real time axis: the tracker published every 5 min at the
// start and every hour later, so a category axis would distort the whole race
const axis = await page.evaluate(() => {
  const c = window.charts?.instances?.chartSpeed;
  if (!c) return null;
  const sc = c.scales.x;
  const pts = c.data.datasets[0].data;
  const span = pts[pts.length - 1].x - pts[0].x;
  const px = (v) => sc.getPixelForValue(v);
  return {
    type: sc.type,
    points: pts.length,
    uniform: Math.abs(px(pts[0].x + span / 2) - px(pts[0].x) - (px(pts[0].x + span) - px(pts[0].x + span / 2))) < 1.5,
    early: Math.round(px(pts[3].x) - px(pts[1].x)),
    late: Math.round(px(pts[pts.length - 1].x) - px(pts[pts.length - 3].x)),
    tick: String(sc.ticks?.[1]?.label || ''),
  };
});
check('graphiques : axe de temps réel',
  !!axis && axis.type === 'linear' && axis.uniform && axis.late > axis.early + 4,
  JSON.stringify(axis));

/* weather layers */
await page.click('#tabs .tab[data-pane="meteo"]');
await page.click('#tglWind');
await new Promise((r) => setTimeout(r, 2500));
await shot(page, '07-desktop-couche-vent');
const windPainted = await page.evaluate(() => {
  const c = document.getElementById('windCanvas');
  const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data;
  let n = 0;
  for (let i = 3; i < d.length; i += 4) if (d[i] > 40) n++;
  return n;
});
check('particules de vent visibles', windPainted > 20000, `${windPainted} pixels visibles`);
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

/* clouds: model opacity veil + its own legend and hover readout */
await page.click('#layerSeg button[data-layer="clouds"]');
await new Promise((r) => setTimeout(r, 2000));
await page.mouse.move(box.x + 60, box.y + 60);
await new Promise((r) => setTimeout(r, 800));
const clouds = await page.evaluate(() => {
  const cv = document.getElementById('windCanvas');
  const ctx = cv.getContext('2d');
  const d = ctx.getImageData(0, 0, cv.width, cv.height).data;
  let painted = 0;
  for (let i = 3; i < d.length; i += 4 * 37) if (d[i] > 0) painted++;
  return {
    layer: window.wxCtl.layer,
    painted,
    legend: !document.getElementById('legendClouds')?.classList.contains('hide'),
    otherLegends: ['legendWind', 'legendWaves', 'legendPressure']
      .filter((id) => !document.getElementById(id)?.classList.contains('hide')),
    readout: document.getElementById('wxReadout')?.textContent.trim() || '',
    hasValue: window.wxCtl.scalarAt(42, -27, 'cloud') !== null,
  };
});
check('couche nuages : voile dessiné', clouds.layer === 'clouds' && clouds.painted > 40, JSON.stringify(clouds));
const canvasFit = await page.evaluate(() => {
  const st = document.getElementById('stage').getBoundingClientRect();
  const cv = document.getElementById('windCanvas');
  const r = cv.getBoundingClientRect();
  return {
    stage: [Math.round(st.width), Math.round(st.height)],
    css: [Math.round(r.width), Math.round(r.height)],
    backing: [cv.width, cv.height],
    internal: [Math.round(window.wxCtl.w), Math.round(window.wxCtl.h)],
    dpr: window.wxCtl.dpr,
  };
});
check('calque météo : couvre toute la carte',
  canvasFit.internal[0] === canvasFit.stage[0] && canvasFit.internal[1] === canvasFit.stage[1]
  && canvasFit.backing[0] === Math.round(canvasFit.stage[0] * canvasFit.dpr),
  JSON.stringify(canvasFit));

check('couche nuages : légende et lecteur dédiés',
  clouds.legend && clouds.otherLegends.length === 0 && /%/.test(clouds.readout) && clouds.hasValue,
  clouds.readout || 'pas de lecteur');
await shot(page, '09b-desktop-couche-nuages');

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
const dimmed = await page.evaluate(() => {
  const el = document.querySelector('.boat-marker');
  return { card: document.getElementById('liveCard')?.classList.contains('is-replay'), op: el ? getComputedStyle(el).opacity : null };
});
check('replay : direct mis en retrait', dimmed.card === true && Number(dimmed.op) < 0.5, JSON.stringify(dimmed));
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

/* --------------------------------------------- responsive widths on desktop */
for (const w of [1024, 1280, 1440, 1920]) {
  const rp = await newPage(w, 900, false);
  await rp.goto(BASE, { waitUntil: 'networkidle2', timeout: 90000 });
  await new Promise((r) => setTimeout(r, 3200));
  const m = await rp.evaluate(() => {
    const r = (sel) => document.querySelector(sel)?.getBoundingClientRect() || { width: 0, right: 0 };
    const rail = r('.rail');
    const bar = r('.topbar');
    return {
      iw: window.innerWidth,
      rail: Math.round(rail.width),
      railRight: Math.round(rail.right),
      barRight: Math.round(bar.right),
      stage: Math.round(r('.stage').width),
      // real overflow test: getBoundingClientRect ignores the overflow:hidden mask
      outside: [...document.querySelectorAll('.rail__body *, .topbar__right *, .brand *')]
        .filter((el) => el.getBoundingClientRect().right > window.innerWidth + 1).length,
      chipsOn: [...document.querySelectorAll('.topbar__stats .tchip')]
        .filter((el) => getComputedStyle(el).display !== 'none').length,
      // a visible chip must sit fully left of the action buttons and not be squeezed
      chipsClipped: [...document.querySelectorAll('.topbar__stats .tchip')]
        .filter((el) => getComputedStyle(el).display !== 'none')
        .filter((el) => {
          const v = el.querySelector('.tchip__v');
          return el.getBoundingClientRect().right > r('.topbar__right').left + 1
            || (v && v.scrollWidth > v.clientWidth + 1);
        })
        .map((el) => {
          const v = el.querySelector('.tchip__v');
          const b = el.getBoundingClientRect();
          return {
            t: el.textContent.trim(),
            w: Math.round(b.width),
            right: Math.round(b.right),
            limit: Math.round(r('.topbar__right').left),
            vw: v ? `${v.scrollWidth}/${v.clientWidth}` : '',
          };
        }),
      markers: document.querySelectorAll('.boat-marker').length,
    };
  });
  check(`desktop ${w}px : rail entièrement visible`,
    m.railRight <= m.iw + 1 && m.barRight <= m.iw + 1 && Math.abs(m.stage + m.rail - m.iw) <= 1 && m.markers > 0,
    JSON.stringify(m));
  check(`desktop ${w}px : aucun élément hors écran`, m.outside === 0, `${m.outside} éléments`);
  const fit = await rp.evaluate(() => window.__topStatsFit || null);
  check(`desktop ${w}px : indicateurs du bandeau lisibles`,
    m.chipsClipped.length === 0 && m.chipsOn >= 3,
    `${m.chipsOn} indicateurs, tronqués: ${JSON.stringify(m.chipsClipped)} | fit ${JSON.stringify(fit)}`);
  if (w === 1280) await shot(rp, '19-desktop-1280');
  await rp.close();
}

/* -------------------------------------------------------------- mobile */
const m = await newPage(390, 844, true);
await m.goto(BASE, { waitUntil: 'networkidle2', timeout: 90000 });
await new Promise((r) => setTimeout(r, 5000));
await shot(m, '20-mobile-carte');
const mobileInfo = await m.evaluate(() => ({
  railOpen: document.getElementById('rail')?.classList.contains('is-open'),
  sheetBtn: !!document.getElementById('btnSheet'),
  sheetBtnVisible: (() => {
    const b = document.getElementById('btnSheet');
    if (!b) return false;
    const r = b.getBoundingClientRect();
    return getComputedStyle(b).display !== 'none' && r.width > 8 && r.height > 8;
  })(),
  mapTab: !!document.querySelector('.tab--map'),
  markers: document.querySelectorAll('.boat-marker').length,
  topbarH: document.querySelector('.topbar')?.getBoundingClientRect().height,
  overflow: document.documentElement.scrollWidth > window.innerWidth + 2,
  scrollWidth: document.documentElement.scrollWidth,
  innerWidth: window.innerWidth,
  debug: (() => {
    const q = (sel) => {
      const el = document.querySelector(sel);
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return { w: Math.round(r.width), l: Math.round(r.left), r: Math.round(r.right) };
    };
    return {
      innerWidth: window.innerWidth,
      clientWidth: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
      bodyScroll: document.body.scrollWidth,
      visual: window.visualViewport ? Math.round(window.visualViewport.width) : null,
      mq900: window.matchMedia('(max-width: 900px)').matches,
      topbar: q('.topbar'),
      stage: q('.stage'),
      rail: q('.rail'),
      main: q('.main'),
      huds: q('.hud--tr'),
      tabs: q('.tabs'),
      tabStyle: getComputedStyle(document.querySelector('.rail')).position,
      widest: Array.from(document.querySelectorAll('body *'))
        .map((el) => ({ t: el.tagName.toLowerCase(), c: (el.className || '').toString().slice(0, 30), w: Math.round(el.getBoundingClientRect().width) }))
        .sort((a, b) => b.w - a.w)
        .slice(0, 6),
    };
  })(),
  offenders: (() => {
    const vw = window.innerWidth;
    const out = [];
    document.querySelectorAll('body *').forEach((el) => {
      const r = el.getBoundingClientRect();
      if (r.width > 0 && r.right > vw + 1 && r.width < 3000) {
        out.push({ tag: el.tagName.toLowerCase(), cls: (el.className || '').toString().slice(0, 40), right: Math.round(r.right), w: Math.round(r.width) });
      }
    });
    return out.slice(0, 12);
  })(),
}));
check('mobile : pas de débordement horizontal', !mobileInfo.overflow, `${mobileInfo.scrollWidth}px / ${mobileInfo.innerWidth}px ${JSON.stringify(mobileInfo.offenders)}`);
check('mobile : marqueurs présents', mobileInfo.markers >= 2, String(mobileInfo.markers));
check('mobile : boutons carte ⇄ panneau',
  mobileInfo.sheetBtnVisible && mobileInfo.mapTab,
  JSON.stringify({ sheet: mobileInfo.sheetBtnVisible, carte: mobileInfo.mapTab }));

const mobileBar = await page.evaluate(() => {
  const name = document.querySelector('.brand__name');
  const live = document.getElementById('liveBtn');
  return {
    title: name?.textContent.trim(),
    titleClipped: name ? name.scrollHeight > name.clientHeight + 1 || name.scrollWidth > name.clientWidth + 1 : true,
    liveLabel: live?.getAttribute('aria-label') || '',
    refreshLabel: document.getElementById('refreshBtn')?.getAttribute('aria-label') || '',
  };
});
check('mobile : titre lisible et boutons décrits',
  !mobileBar.titleClipped && mobileBar.liveLabel.length > 3 && mobileBar.refreshLabel.length > 3,
  JSON.stringify(mobileBar));
await m.evaluate(() => document.getElementById('rail')?.classList.add('is-open'));
await new Promise((r) => setTimeout(r, 700));
const mapTab = await m.evaluate(() => {
  const t = document.querySelector('.tab--map');
  if (!t) return { found: false };
  const r = t.getBoundingClientRect();
  const mid = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
  return {
    found: true,
    shown: getComputedStyle(t).visibility !== 'hidden' && getComputedStyle(t).display !== 'none',
    inside: r.left >= -0.5 && r.right <= window.innerWidth + 0.5 && r.width > 24,
    box: [Math.round(r.left), Math.round(r.right), Math.round(r.width), window.innerWidth],
    clickable: !!mid && t.contains(mid),
    at: mid ? (mid.id || mid.className || mid.tagName) : null,
    label: t.textContent.trim(),
  };
});
check('mobile : onglet Carte visible et cliquable',
  mapTab.found && mapTab.shown && mapTab.inside && mapTab.clickable,
  JSON.stringify(mapTab));
const noOverlap = await m.evaluate(() => {
  const t = document.querySelector('.tab--map').getBoundingClientRect();
  const hits = [...document.querySelectorAll('#mobileBar span, #tabs .tab, .rail__grab')]
    .map((el) => ({ el, r: el.getBoundingClientRect() }))
    .filter(({ el, r }) => el !== document.querySelector('.tab--map') && r.width > 0 && r.height > 0
      && !el.closest('#railGrab') // the drag handle deliberately sits on top
      && !(r.right <= t.left || r.left >= t.right || r.bottom <= t.top || r.top >= t.bottom))
    .map(({ el, r }) => ({
      html: el.outerHTML.slice(0, 70),
      text: el.textContent.trim().slice(0, 20),
      box: [Math.round(r.left), Math.round(r.top), Math.round(r.width), Math.round(r.height)],
    }));
  return hits;
});
check('mobile : l’onglet Carte ne recouvre rien', noOverlap.length === 0,
  JSON.stringify({ tab: mapTab.box, hits: noOverlap }));
// and it must actually fold the panel back onto the map
await m.click('.tab--map');
await new Promise((r) => setTimeout(r, 700));
const afterMap = await m.evaluate(() => ({
  open: document.getElementById('rail')?.classList.contains('is-open'),
  pane: document.querySelector('.tab[aria-selected="true"]')?.dataset.pane,
}));
check('mobile : Carte replie le panneau', afterMap.open === false && afterMap.pane === 'live', JSON.stringify(afterMap));
await m.evaluate(() => document.getElementById('rail')?.classList.add('is-open'));
await new Promise((r) => setTimeout(r, 700));
// the hero photo must come from the official CDN
const hero = await m.evaluate(() => {
  const img = document.getElementById('heroPhoto');
  return img ? { src: img.getAttribute('src'), ok: img.complete && img.naturalWidth > 0, hidden: img.classList.contains('is-missing') } : null;
});
check('photo officielle du skipper', !!hero && /wixstatic/.test(hero.src || '') && (hero.ok || hero.hidden), JSON.stringify(hero));
console.log('MOBILE DEBUG', JSON.stringify(mobileInfo.debug));
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

/* fallback when tile CDNs are unreachable */
const nb = await newPage(1280, 800, false);
await nb.setRequestInterception(true);
nb.on('request', (req) => {
  if (/arcgisonline|basemaps\.cartocdn|tile\.openstreetmap/.test(req.url())) return req.abort();
  req.continue();
});
await nb.goto(BASE, { waitUntil: 'domcontentloaded', timeout: 60000 });
await new Promise((r) => setTimeout(r, 5000));
const noTiles = await nb.evaluate(() => ({
  cls: document.getElementById('stage')?.classList.contains('no-tiles'),
  badge: !document.getElementById('tileBadge')?.classList.contains('hide'),
  markers: document.querySelectorAll('.boat-marker').length,
  trail: (() => {
    const c = document.getElementById('trailCanvas');
    const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data;
    let n = 0;
    for (let i = 3; i < d.length; i += 4) if (d[i] > 40) n++;
    return n;
  })(),
}));
check('sans tuiles : mode schématique annoncé', noTiles.cls && noTiles.badge, JSON.stringify(noTiles));
check('sans tuiles : trace et bateaux toujours lisibles', noTiles.trail > 1000 && noTiles.markers > 0, JSON.stringify(noTiles));
await shot(nb, '33-sans-tuiles');

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
