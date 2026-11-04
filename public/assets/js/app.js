/* ============================================================================
   App — bootstrap, wiring, refresh loop, resilience.
   ========================================================================== */
(function () {
  'use strict';

  const state = {
    refreshTimer: null,
    officialTimer: null,
    lastRepaint: 0,
    liveMode: true,
    retry: 0,
  };

  const REFRESH_MS = 3 * 60 * 1000; // static snapshot
  const OFFICIAL_MS = 60 * 1000; // official API (published hourly)

  /* ------------------------------------------------------------- boot */
  function bootMap() {
    mapCtl.init();
    // smooth rotation of boat pictograms on update
    if (!document.getElementById('map')) return;
  }

  function wireBasemaps() {
    util.$$('#baseSeg button').forEach((btn) => {
      btn.addEventListener('click', () => {
        mapCtl.setBase(btn.dataset.base);
        util.$$('#baseSeg button').forEach((b) => b.setAttribute('aria-pressed', String(b === btn)));
      });
    });
  }

  function wireLayers() {
    const showLegend = () => {
      ['legendWind', 'legendWaves', 'legendPressure', 'legendClouds'].forEach((id) => {
        const el = document.getElementById(id);
        if (!el) return;
        const key = { legendWind: 'wind', legendWaves: 'waves', legendPressure: 'pressure', legendClouds: 'clouds' }[id];
        el.classList.toggle('hide', wxCtl.layer !== key);
      });
    };
    util.$$('#layerSeg button').forEach((btn) => {
      btn.addEventListener('click', () => {
        util.$$('#layerSeg button').forEach((b) => b.setAttribute('aria-pressed', String(b === btn)));
        wxCtl.setLayer(btn.dataset.layer);
        document.getElementById('tglWind')?.setAttribute('aria-pressed', String(btn.dataset.layer === 'wind'));
        document.getElementById('tglWaves')?.setAttribute('aria-pressed', String(btn.dataset.layer === 'waves'));
        document.getElementById('tglPressure')?.setAttribute('aria-pressed', String(btn.dataset.layer === 'pressure'));
        document.getElementById('tglClouds')?.setAttribute('aria-pressed', String(btn.dataset.layer === 'clouds'));
        showLegend();
        if (btn.dataset.layer !== 'none' && !wxCtl.ready) util.toast('Chargement du modèle météo…');
      });
    });
  }

  function wireWeatherToggles() {
    const map = {
      tglWind: 'wind',
      tglWaves: 'waves',
      tglPressure: 'pressure',
      tglClouds: 'clouds',
    };
    Object.entries(map).forEach(([id, layer]) => {
      const el = document.getElementById(id);
      if (!el) return;
      el.addEventListener('click', () => {
        const on = el.getAttribute('aria-pressed') !== 'true';
        util.$$('#layerSeg button').forEach((b) =>
          b.setAttribute('aria-pressed', String(b.dataset.layer === (on ? layer : 'none')))
        );
        wxCtl.setLayer(on ? layer : 'none');
        Object.keys(map).forEach((k) => document.getElementById(k)?.setAttribute('aria-pressed', String(k === id && on)));
        ['legendWind', 'legendWaves', 'legendPressure', 'legendClouds'].forEach((lid) => {
          const key = { legendWind: 'wind', legendWaves: 'waves', legendPressure: 'pressure', legendClouds: 'clouds' }[lid];
          document.getElementById(lid)?.classList.toggle('hide', !(on && key === layer));
        });
      });
    });
    const barbs = document.getElementById('tglBarbs');
    barbs?.addEventListener('click', () => {
      const on = barbs.getAttribute('aria-pressed') !== 'true';
      barbs.setAttribute('aria-pressed', String(on));
      wxCtl.setBarbs(on);
    });
  }

  function wireMapButtons() {
    document.getElementById('btnSheet')?.addEventListener('click', () => {
      document.getElementById('rail')?.classList.toggle('is-open');
    });
    document.getElementById('btnCenter')?.addEventListener('click', () => mapCtl.centerOnLaurent());
    const stage = document.getElementById('stage');
    stage?.addEventListener('mousemove', (e) => {
      const chip = document.getElementById('wxReadout');
      if (wxCtl.layer !== 'none' && mapCtl.map) {
        const rect = mapCtl.map.getContainer().getBoundingClientRect();
        const ll = mapCtl.map.containerPointToLatLng([e.clientX - rect.left, e.clientY - rect.top]);
        const r = wxCtl.readoutAt(ll.lat, ll.lng);
        if (chip) {
          if (r) {
            chip.classList.remove('hide');
            chip.innerHTML = `<span class="wxdot" style="background:${r.color}"></span><span><b>${util.esc(r.value)}</b> ${util.esc(r.sub)}</span>`;
            chip.style.left = Math.min(e.clientX - rect.left + 16, rect.width - 190) + 'px';
            chip.style.top = Math.max(6, e.clientY - rect.top - 46) + 'px';
          } else chip.classList.add('hide');
        }
      } else {
        chip?.classList.add('hide');
      }
      if (e.target.closest('.boat-marker')) {
        document.getElementById('trailHover')?.classList.add('hide');
        return;
      }
      mapCtl.hoverTrail(e.clientX, e.clientY);
    });
    stage?.addEventListener('mouseleave', () => {
      document.getElementById('trailHover')?.classList.add('hide');
      document.getElementById('wxReadout')?.classList.add('hide');
    });
    stage?.addEventListener('mouseleave', () => document.getElementById('trailHover')?.classList.add('hide'));
    document.getElementById('btnZoomIn')?.addEventListener('click', () => mapCtl.zoom(1));
    document.getElementById('btnZoomOut')?.addEventListener('click', () => mapCtl.zoom(-1));
    document.getElementById('btnFs')?.addEventListener('click', toggleFullscreen);
    document.getElementById('btnReplay')?.addEventListener('click', () => {
      if (mapCtl.replay.active) endReplay();
      else startReplay();
    });
    document.getElementById('tlLive')?.addEventListener('click', () => {
      if (mapCtl.replay.active) endReplay();
      document.getElementById('liveBtn')?.click();
    });
    document.getElementById('liveBtn')?.addEventListener('click', () => {
      if (mapCtl.replay.active) endReplay();
      state.liveMode = true;
      mapCtl.centerOnLaurent();
      dataStore.refreshOfficial();
      util.toast('Retour au direct', 'ok');
    });
    document.getElementById('refreshBtn')?.addEventListener('click', () => manualRefresh());
    document.getElementById('infoBtn')?.addEventListener('click', () => switchPane('sources', true));
    const rivals = document.getElementById('tglRivals');
    rivals?.addEventListener('click', () => {
      const on = rivals.getAttribute('aria-pressed') !== 'true';
      rivals.setAttribute('aria-pressed', String(on));
      panels.setRivals(on);
    });
  }

  function wireTimeline() {
    const tl = document.getElementById('timeline');
    const range = document.getElementById('tlRange');
    const play = document.getElementById('tlPlay');
    play?.addEventListener('click', () => {
      const R = mapCtl.replay;
      if (!R.active) return;
      R.playing = !R.playing;
      play.innerHTML = R.playing
        ? '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M7 5h4v14H7zM13 5h4v14h-4z"/></svg>'
        : '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>';
      if (R.t >= R.end) R.t = R.start;
    });
    range?.addEventListener('input', () => {
      const R = mapCtl.replay;
      if (!R.active) return;
      const f = Number(range.value) / 1000;
      R.t = R.start + (R.end - R.start) * f;
      R.playing = false;
      play.innerHTML = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>';
      mapCtl.replayStep(0);
    });
    util.$$('#tlSpeed button').forEach((b) => {
      b.addEventListener('click', () => {
        mapCtl.replay.speed = Number(b.dataset.s);
        util.$$('#tlSpeed button').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
      });
    });
    tl?.setAttribute('aria-hidden', 'true');
  }

  function startReplay() {
    if (!dataStore.track) {
      util.toast('Trace indisponible — replay impossible', 'bad');
      return;
    }
    if (!mapCtl.startReplay(dataStore.core)) return;
    document.getElementById('timeline')?.classList.add('is-open');
    document.getElementById('timeline')?.setAttribute('aria-hidden', 'false');
    document.getElementById('btnReplay')?.setAttribute('aria-pressed', 'true');
    const play = document.getElementById('tlPlay');
    if (play) play.innerHTML = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M7 5h4v14H7zM13 5h4v14h-4z"/></svg>';
    const tr = dataStore.track;
    const set = (id, v) => {
      const el = document.getElementById(id);
      if (el) el.textContent = v;
    };
    set('tlStart', util.fmtDateShort(tr.t[0] * 1000));
    set('tlMid', util.fmtDateShort(tr.t[Math.floor(tr.t.length / 2)] * 1000));
    set('tlEnd', util.fmtDateShort(tr.t[tr.t.length - 1] * 1000));
  }

  function endReplay() {
    mapCtl.stopReplay(dataStore.core);
    document.getElementById('timeline')?.classList.remove('is-open');
    document.getElementById('timeline')?.setAttribute('aria-hidden', 'true');
    document.getElementById('btnReplay')?.setAttribute('aria-pressed', 'false');
  }

  function replayLoop() {
    let last = performance.now();
    const tick = (now) => {
      const dt = now - last;
      last = now;
      if (mapCtl.replay.active) {
        mapCtl.replayStep(dt);
        const range = document.getElementById('tlRange');
        const R = mapCtl.replay;
        if (range) range.value = String(Math.round(((R.t - R.start) / (R.end - R.start || 1)) * 1000));
        const d = document.getElementById('tlDate');
        if (d) d.textContent = util.fmtDate(R.t * 1000);
        const a = document.getElementById('tlAge');
        if (a) a.textContent = R.t >= R.end ? 'fin de trace' : '';
      }
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  function toggleFullscreen() {
    const stage = document.getElementById('stage');
    if (!document.fullscreenElement) {
      stage.requestFullscreen?.().then(() => setTimeout(() => mapCtl.map.invalidateSize(), 260));
    } else {
      document.exitFullscreen?.();
      setTimeout(() => mapCtl.map.invalidateSize(), 260);
    }
  }

  /* -------------------------------------------------------------- tabs */
  function wireTabs() {
    util.$$('#tabs .tab').forEach((tab) => {
      tab.addEventListener('click', () => switchPane(tab.dataset.pane));
    });
  }

  function switchPane(name, openRail) {
    if (name === 'map') {
      document.getElementById('rail')?.classList.remove('is-open');
      util.$$('#tabs .tab').forEach((t) => t.setAttribute('aria-selected', String(t.dataset.pane === 'live')));
      return;
    }
    util.$$('#tabs .tab').forEach((t) => t.setAttribute('aria-selected', String(t.dataset.pane === name)));
    util.$$('.pane').forEach((p) => p.classList.toggle('is-active', p.dataset.pane === name));
    const rail = document.getElementById('rail');
    if (openRail && util.isMobile()) rail?.classList.add('is-open');
    const body = document.getElementById('railBody');
    if (body) body.scrollTop = 0;
    if (name === 'charts') panels.renderCharts();
    if (name === 'meteo') panels.renderWeather();
  }

  function wireMobileRail() {
    const rail = document.getElementById('rail');
    const grab = document.getElementById('railGrab');
    const bar = document.getElementById('mobileBar');
    let open = false;
    const toggle = () => {
      open = !open;
      rail.classList.toggle('is-open', open);
    };
    grab?.addEventListener('click', toggle);
    bar?.addEventListener('click', toggle);
    // swipe down closes
    let y0 = null;
    grab?.addEventListener('touchstart', (e) => (y0 = e.touches[0].clientY), { passive: true });
    grab?.addEventListener('touchmove', (e) => {
      if (y0 == null) return;
      if (e.touches[0].clientY - y0 > 40) {
        rail.classList.remove('is-open');
        open = false;
        y0 = null;
      }
    }, { passive: true });
  }

  /* --------------------------------------------------------- refresh loop */
  async function manualRefresh() {
    const lbl = document.getElementById('refreshLbl');
    if (lbl) lbl.textContent = '…';
    try {
      await dataStore.load();
      state.retry = 0;
      paintAll(true);
      util.toast('Données actualisées', 'ok');
    } catch (e) {
      util.toast(`Actualisation impossible : ${util.esc(e.message)}`, 'bad');
    } finally {
      if (lbl) lbl.textContent = 'Actualiser';
    }
  }

  function scheduleRefresh() {
    clearInterval(state.refreshTimer);
    state.refreshTimer = setInterval(async () => {
      try {
        await dataStore.load({ weather: false });
        paintAll(true);
      } catch (e) {
        state.retry++;
        console.warn('[app] refresh failed', e);
        if (state.retry === 2) util.toast('Source momentanément indisponible — les dernières données restent affichées.', 'bad');
        setStatus(false, `hors ligne — dernière image ${util.fmtTime(dataStore.lastLoad)}`);
      }
    }, REFRESH_MS);
    clearInterval(state.officialTimer);
    state.officialTimer = setInterval(() => {
      dataStore.refreshOfficial();
    }, OFFICIAL_MS);
  }

  function setStatus(ok, txt) {
    const dot = document.querySelector('#mapStatus .dot');
    const t = document.getElementById('mapStatusTxt');
    if (dot) dot.className = 'dot ' + (ok ? 'dot--ok' : 'dot--bad');
    if (t) t.textContent = txt;
  }

  /* ------------------------------------------------------------ painting */
  function paintAll(first) {
    const core = dataStore.core;
    if (!core) return;
    panels.updateHeader();
    panels.renderLive();
    panels.renderFleet();
    panels.renderSources();
    if (document.querySelector('.pane[data-pane="charts"].is-active')) panels.renderCharts();

    if (first) {
      mapCtl.drawRoute(core);
      const speedAt = buildOfficialSpeedLookup();
      mapCtl.drawLaurentTrail(dataStore.track, speedAt);
      mapCtl.updateFleet(core, { showOthers: true });
      if (!mapCtl.restoreView()) mapCtl.fitRace(core);
      setTimeout(() => mapCtl.map.invalidateSize(), 150);
    } else {
      mapCtl.drawLaurentTrail(dataStore.track, buildOfficialSpeedLookup());
      mapCtl.updateFleet(core, { showOthers: true });
    }

    const when = core.freshness.officialStandings;
    const stale = when ? (Date.now() - Date.parse(when)) / 60000 : Infinity;
    setStatus(
      stale < 150,
      stale < 150
        ? `Direct · pointage officiel ${util.ago(when)}`
        : `Données du ${util.fmtDate(when)} — pas de pointage plus récent`
    );
    if (stale >= 150) {
      util.toast(
        `Aucun nouveau pointage officiel depuis ${util.ago(when, false)}. Les positions affichées sont les dernières publiées.`,
        'bad'
      );
    }
    document.getElementById('tAge')?.classList.toggle('warn', stale > 120);
  }

  /** Official speed at a timestamp, from the tracker report history. */
  function buildOfficialSpeedLookup() {
    const h = dataStore.history;
    if (!h || !h.dates || !h.dates.length) return null;
    const times = h.dates.map((d) => Date.parse(d) / 1000);
    return (ts) => {
      const i = util.idxAt(times, ts);
      const v = h.speed[i];
      return Number.isFinite(v) ? v : null;
    };
  }

  /* --------------------------------------------------------------- modal */
  function wireModal() {
    const modal = document.getElementById('modal');
    document.getElementById('modalClose')?.addEventListener('click', () => modal.classList.remove('is-open'));
    modal?.addEventListener('click', (e) => {
      if (e.target === modal) modal.classList.remove('is-open');
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        modal.classList.remove('is-open');
        if (mapCtl.replay.active) endReplay();
      }
      if (e.key === 'r' && !e.metaKey && !e.ctrlKey && document.activeElement?.tagName !== 'INPUT') {
        if (mapCtl.replay.active) endReplay();
        else startReplay();
      }
      if (e.key === 'c' && document.activeElement?.tagName !== 'INPUT') mapCtl.centerOnLaurent();
    });
  }

  /* ---------------------------------------------------------------- boot */
  async function boot() {
    wireBasemaps();
    wireLayers();
    wireWeatherToggles();
    wireMapButtons();
    wireTimeline();
    wireTabs();
    wireMobileRail();
    wireModal();
    replayLoop();

    bootMap();
    wxCtl.init(document.getElementById('windCanvas'));
    wxCtl.onChange.push(() => {
      if (document.querySelector('.pane[data-pane="meteo"].is-active')) panels.renderWeather();
      wxCtl.frame();
    });

    const loadingNote = document.getElementById('mapStatusTxt');
    if (loadingNote) loadingNote.textContent = 'Connexion aux données officielles…';

    try {
      await dataStore.load();
    } catch (e) {
      setStatus(false, 'Données indisponibles');
      util.toast(`Impossible de charger les données : ${util.esc(e.message)}. Aucune position fictive n'est affichée.`, 'bad');
      const rail = document.getElementById('railBody');
      if (rail) {
        rail.innerHTML = `<div class="errbox" style="margin:16px">
          <strong>Les données sont momentanément indisponibles.</strong><br>
          ${util.esc(e.message)}<br><br>
          Cette page ne fabrique aucune position de remplacement. Réessayez dans quelques instants
          ou consultez la <a class="link" href="https://carto.routedurhum.com/" target="_blank" rel="noopener">cartographie officielle</a>.
          <br><br><button class="pill" onclick="location.reload()">Réessayer</button></div>`;
      }
      return;
    }

    paintAll(true);
    fitTopStats();
    setStatus(true, `Direct · pointage officiel ${util.ago(dataStore.core.freshness.officialStandings)}`);
    scheduleRefresh();

    dataStore.on('official', () => {
      panels.updateHeader();
      panels.renderLive();
      panels.renderFleet();
      panels.renderSources();
      mapCtl.updateFleet(dataStore.core, { showOthers: true });
      if (!mapCtl.replay.active) {
        const L = dataStore.core.laurent;
        if (Number.isFinite(L.lat)) mapCtl.moveLaurent(L.lat, L.lon, L.heading);
      }
      if (document.querySelector('.pane[data-pane="meteo"].is-active')) panels.renderWeather();
    });

    // window resize → chart resize handled by Chart.js
    window.addEventListener('resize', util.debounce(() => wxCtl.resize(), 200));
  }

  /* ---------------------------------------------------- topbar stat fitting
     The KPI strip only keeps the chips that physically fit: a squeezed value
     ("42°05′N 27°00′…") reads as broken, and nothing may slide under the action
     buttons. Chips go least-important-first — the exact position is on the map
     and in the live card, whereas freshness ("dernier pointage") is precisely
     what tells the reader whether the numbers can be trusted.

     Deliberately not a ResizeObserver: measuring requires un-hiding the chips,
     which would re-fire the observer and can loop forever (it did — it froze
     the page). A plain schedule is deterministic instead. */
  const CHIP_PRIORITY = ['tRank', 'tSpeed', 'tDtf', 'tAge', 'tDtl', 'tPos'];

  function fitTopStats() {
    const strip = document.getElementById('topStats');
    const right = document.querySelector('.topbar__right');
    if (!strip || !right) return;
    const chips = [...strip.querySelectorAll('.tchip')];
    if (!chips.length) return;

    const prio = (el) => {
      const i = CHIP_PRIORITY.indexOf(el.querySelector('.tchip__v')?.id);
      return i < 0 ? CHIP_PRIORITY.length : i; // unknown chips go last
    };

    // The strip's own box shrinks as chips are hidden, so a single calculation
    // can be wrong by a few pixels. Iterate instead: hide the least important
    // chip, re-read the layout, repeat — this converges in at most 6 steps.
    const visible = new Set(chips);
    const order = [...chips].sort((a, b) => prio(b) - prio(a));
    for (let step = 0; step <= chips.length; step++) {
      chips.forEach((c) => c.classList.toggle('is-cut', !visible.has(c)));
      // real room: the strip's usable width, never past the action buttons
      const edge = right.getBoundingClientRect().left - strip.getBoundingClientRect().left;
      const room = Math.floor(Math.min(strip.clientWidth, edge));
      const need = [...visible].reduce((n, c) => n + Math.ceil(c.getBoundingClientRect().width), 0);
      if (need <= room) break;
      const next = order.find((c) => visible.has(c));
      if (!next) break;
      visible.delete(next);
    }

    // exposed for the visual test / manual diagnosis
    window.__topStatsFit = {
      room: Math.floor(strip.clientWidth),
      shown: chips.filter((c) => visible.has(c)).map((c) => c.querySelector('.tchip__v')?.id),
      hidden: chips.filter((c) => !visible.has(c)).map((c) => c.querySelector('.tchip__v')?.id),
      need: [...visible].reduce((n, c) => n + Math.ceil(c.getBoundingClientRect().width), 0),
    };
  }
  window.addEventListener('load', fitTopStats);
  window.addEventListener('topstats:changed', () => requestAnimationFrame(fitTopStats));
  window.addEventListener('resize', util.debounce(fitTopStats, 120));
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(fitTopStats);
  // values are live ("49 min" one minute, "1 h 26" the next)
  setInterval(fitTopStats, 5000);

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
