/* ============================================================================
   Panels — renders every pane of the right rail from real data.
   ========================================================================== */
(function () {
  'use strict';

  const P = {};

  const fmtRank = (r) => (Number.isFinite(r) ? r : '—');

  /* ------------------------------------------------------------ header */
  P.updateHeader = function () {
    const core = dataStore.core;
    if (!core) return;
    const L = core.laurent;
    const set = (id, html) => {
      const el = document.getElementById(id);
      if (el) el.innerHTML = html;
    };
    set('tRank', `${fmtRank(L.rank)}<small>/${L.partants || '—'}</small>`);
    set('tSpeed', `${util.kn(L.speed)}<small>nd</small>`);
    set('tDtf', `${util.int(L.dtf)}<small>mi</small>`);
    set('tDtl', `${util.nm(L.dtl)}<small>mi</small>`);
    set('tPos', L.lat && L.lon ? util.dms(L.lat, L.lon) : '—');
    const when = core.freshness.officialStandings;
    set('tAge', `${util.ago(when, false)}`);
    document.getElementById('tAge')?.setAttribute('title', when ? `Classement officiel : ${util.fmtDate(when)}` : '');

    // live card
    set('lcSpeed', `${util.kn(L.speed)}<small>nd</small>`);
    set('lcCap', `${Number.isFinite(L.heading) ? Math.round(L.heading) : '—'}<small>°</small>`);
    set('lcVmg', `${util.kn(L.vmg)}<small>nd</small>`);
    set('lcRank', `${fmtRank(L.rank)}`);
    set('lcPos', L.lat ? util.dms(L.lat, L.lon) : '—');
    set('lcTime', when ? util.fmtTime(when) : '—');
    const st = document.getElementById('boatState');
    if (st) {
      st.textContent = L.status || '—';
      st.className = 'badge ' + (L.status === 'RAC' ? 'badge--official' : L.status === 'RET' ? 'badge--off' : 'badge--calc');
    }

    // mobile bar
    set('mbRank', `${fmtRank(L.rank)}${L.partants ? '/' + L.partants : ''}`);
    set('mbSpeed', util.kn(L.speed));
    set('mbDtf', util.int(L.dtf));
    set('mbTime', when ? util.ago(when) : '—');

    // boat pane static data
    set('raceStart', core.race.start ? util.fmtDate(core.race.start) : '—');
    set('raceDist', `${util.int(core.race.distance)} milles nautiques`);
    set('raceFleet', `${core.boats ? Object.keys(core.boats).length : '—'} bateaux`);
    const fiche = document.getElementById('ficheLink');
    if (fiche && L.fiche) fiche.href = L.fiche;
  };

  /* --------------------------------------------------------- live pane */
  P.renderLive = function () {
    const core = dataStore.core;
    if (!core) return;
    const L = core.laurent;
    const set = (id, html) => {
      const el = document.getElementById(id);
      if (el) el.innerHTML = html;
    };

    set('sRank', `${fmtRank(L.rank)}<small>${L.partants ? ' / ' + L.partants : ''}</small>`);
    const t = util.delta(L.rankBefore - L.rank, false);
    const trend = L.rankBefore && L.rank !== L.rankBefore ? `${t.txt} place${Math.abs(L.rankBefore - L.rank) > 1 ? 's' : ''} depuis le pointage précédent` : 'stable depuis le pointage précédent';
    set('sRankTrend', `<span class="${t.cls}">${trend}</span>`);
    set('sSpeed', `${util.kn(L.speed)}<small>nd</small>`);
    set('sSpeedMs', util.ms(L.speed));
    set('sDtf', `${util.int(L.dtf)}<small>mi</small>`);
    const eta = P.etaLine();
    set('sEta', eta);
    set('sDtl', `${util.nm(L.dtl)}<small>mi</small>`);
    set('sDtlKm', util.km(L.dtl));
    set('liveTimeNote', core.freshness.officialStandings ? `pointage ${util.fmtDate(core.freshness.officialStandings)}` : '—');

    set('kCap', `${Number.isFinite(L.heading) ? Math.round(L.heading) + '° ' + util.cardinal(L.heading) : '—'}`);
    set('kVmg', `${util.kn(L.vmg)} nd`);
    const h = dataStore.history;
    const lastIdx = h ? h.dates.length - 1 : -1;
    const dog = h && lastIdx >= 0 ? h.dog[lastIdx] : null;
    const dogNote = document.getElementById('kDogNote');
    if (dogNote) dogNote.textContent = 'officiel';
    const computed = dataStore.computed();
    set('kAvg', computed && computed.avgSinceStart ? `${util.one(computed.avgSinceStart)} nd` : h && lastIdx >= 0 ? `${util.one(h.vit_moy_depart[lastIdx])} nd` : '—');
    set('kPos', L.lat ? `${L.lat.toFixed(4)}° / ${L.lon.toFixed(4)}°` : '—');

    // performance table — official tracker fields
    const body = document.getElementById('perfBody');
    if (body) {
      if (!h || lastIdx < 0) {
        body.innerHTML = '<tr><td colspan="4" class="faint" style="font-size:11px">Historique indisponible</td></tr>';
      } else {
        const g = (k) => (Array.isArray(h[k]) ? h[k][lastIdx] : null);
        const row = (label, dist, vmg, vmax) =>
          `<tr><td>${label}</td><td class="num">${dist != null ? util.nm(dist) + ' mi' : '—'}</td><td class="num">${vmg != null ? util.one(vmg) + ' nd' : '—'}</td><td class="num">${vmax != null ? util.one(vmax) + ' nd' : '—'}</td></tr>`;
        body.innerHTML =
          row('4 heures', g('dist1'), g('vmg1'), g('vitmax4')) +
          row('24 heures', g('dist2'), g('vmg2'), g('vitmax24')) +
          row('48 heures', null, g('vitmoy48'), g('vitmax48')) +
          row('Depuis le départ', g('dog'), g('vit_moy_depart'), g('vitmaxd'));
      }
    }

    // gaps to rivals
    const rivals = dataStore.rivals();
    const gbody = document.getElementById('gapBody');
    if (gbody) {
      if (!rivals.length) {
        gbody.innerHTML = '<tr><td colspan="3" class="faint" style="font-size:11px">Flotte indisponible</td></tr>';
      } else {
        const me = L;
        const sorted = rivals
          .map((r) => ({ ...r, dd: Number.isFinite(r.dtf) && Number.isFinite(me.dtf) ? r.dtf - me.dtf : null }))
          .sort((a, b) => Math.abs(a.dd ?? 1e9) - Math.abs(b.dd ?? 1e9))
          .slice(0, 5);
        gbody.innerHTML = sorted
          .map(
            (r) => `<tr data-boat="${util.esc(r.id)}"><td><div class="who"><span class="who__n">${util.esc(r.n)}</span></div></td>
            <td class="num ${r.dd < 0 ? 'down' : 'up'}">${r.dd != null ? (r.dd > 0 ? '+' : '−') + util.one(Math.abs(r.dd)) + ' mi' : '—'}</td>
            <td class="num">${util.one(r.vmg)}</td></tr>`
          )
          .join('');
        gbody.querySelectorAll('tr[data-boat]').forEach((tr) =>
          tr.addEventListener('click', () => mapCtl.focusBoat(tr.dataset.boat, core))
        );
      }
    }
    const gt = document.getElementById('gapTime');
    if (gt) gt.textContent = core.freshness.officialStandings ? util.ago(core.freshness.officialStandings, false) : '—';
  };

  /** Honest ETA: only from the boat's own official average since the start. */
  P.etaLine = function () {
    const core = dataStore.core;
    const h = dataStore.history;
    if (!h || !h.dates.length) return 'vitesse moyenne indisponible';
    const avg = h.vit_moy_depart[h.dates.length - 1];
    const dtf = core.laurent.dtf;
    if (!Number.isFinite(avg) || avg < 1 || !Number.isFinite(dtf)) return '—';
    const hours = dtf / avg;
    const eta = new Date(Date.now() + hours * 3600 * 1000);
    return `à ${util.one(avg)} nd de moyenne → ${eta.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', timeZone: 'Europe/Paris' })} (indicatif)`;
  };

  /* -------------------------------------------------------- fleet pane */
  P.renderFleet = function () {
    const core = dataStore.core;
    if (!core) return;
    const cls = core.standings.find((c) => /ocean/i.test(c.cle || c.nom || ''));
    const tb = document.querySelector('#fleetTable tbody');
    const head = document.querySelector('#fleetTable thead');
    if (tb && cls) {
      if (head) head.innerHTML = '<tr><th>#</th><th>Skipper / bateau</th><th class="num">DTF</th><th class="num">Vit.</th></tr>';
      tb.innerHTML = cls.etat
        .slice()
        .sort((a, b) => (a.r ?? 99) - (b.r ?? 99))
        .map((b) => {
          const me = dataStore.isLaurentName(b.n);
          const rankCls = b.r === 1 ? 'rank-pill--1' : me ? 'rank-pill--me' : '';
          const retired = b.st && b.st !== 'RAC';
          return `<tr class="${me ? 'is-me' : ''}" data-boat="${util.esc(b.id)}">
            <td><span class="rank-pill ${rankCls}">${retired ? '—' : b.r ?? '—'}</span></td>
            <td>
              <div class="who"><div style="min-width:0">
                <div class="who__n">${util.esc(b.n)}${b.st && b.st !== 'RAC' ? ` <span class="badge badge--off">${util.esc(b.st)}</span>` : ''}</div>
                <div class="who__b">${util.esc(b.b || '')}</div>
              </div></div>
            </td>
            <td class="num">${retired ? '—' : util.int(b.dtf)}</td>
            <td class="num">${retired ? '—' : util.one(b.v)}</td>
          </tr>`;
        })
        .join('');
      tb.querySelectorAll('tr[data-boat]').forEach((tr) =>
        tr.addEventListener('click', () => mapCtl.focusBoat(tr.dataset.boat, core))
      );
    }
    const ft = document.getElementById('fleetTime');
    if (ft) ft.textContent = core.freshness.officialStandings ? `MAJ ${util.fmtDate(core.freshness.officialStandings)}` : '—';

    // all classes
    const box = document.getElementById('allClasses');
    if (box) {
      box.innerHTML = core.standings
        .map((c) => {
          const leader = c.etat.find((b) => b.r === 1);
          const racing = c.etat.filter((b) => !b.st || b.st === 'RAC').length;
          return `<div class="kv"><span class="kv__k" style="display:flex;align-items:center;gap:7px">
              <span style="width:7px;height:7px;border-radius:50%;background:${c.couleur || '#666'}"></span>${util.esc(c.nom)}
              <span class="faint mono" style="font-size:9px">${racing}/${c.partants}</span></span>
            <span class="kv__v" style="font-size:11.5px">${leader ? util.esc(leader.n) : '—'}<br><span class="faint" style="font-size:10px">${leader ? util.int(leader.dtf) + ' mi' : ''}</span></span></div>`;
        })
        .join('');
    }
  };

  /* ------------------------------------------------------- charts pane */
  P.renderCharts = function () {
    const h = dataStore.history;
    if (h) charts.laurentHistory(h);
    const note = document.getElementById('chTimeNote');
    if (note && h && h.dates.length) note.textContent = `${h.dates.length} pointages officiels`;
    const c = dataStore.computed();
    const set = (id, v) => {
      const el = document.getElementById(id);
      if (el) el.textContent = v;
    };
    if (c) {
      set('calcMax1h', `${util.one(c.w1h.vmax)} nd`);
      set('calcAvg12', `${util.one(c.w12h.avg)} nd`);
      set('calcCog24', c.cog24 != null ? `${Math.round(c.cog24)}° ${util.cardinal(c.cog24)}` : '—');
      set('calcDist', `${util.int(c.dist)} mi (${util.km(c.dist)})`);
    }
  };

  /* -------------------------------------------------------- weather pane */
  P.renderWeather = function () {
    const w = wxCtl;
    const core = dataStore.core;
    const box = document.getElementById('wxGrid');
    const warn = document.getElementById('wxWarn');
    if (!box) return;
    if (!core) return;
    const L = core.laurent;
    if (!w.ready) {
      box.innerHTML = `<div class="stat" style="grid-column:1/-1"><div class="stat__k">Modèle</div><div class="stat__v" style="font-size:14px;font-weight:500">${w.loading ? 'Chargement du modèle…' : 'Indisponible'}</div><div class="stat__d">${util.esc(w.error || '')}</div></div>`;
      if (warn) {
        warn.style.display = w.error && !w.loading ? '' : 'none';
        warn.innerHTML = `<strong>Couches météo indisponibles.</strong> ${util.esc(w.error || '')} — la carte continue de fonctionner avec les données officielles.`;
      }
      return;
    }
    if (warn && w.warn) {
      warn.style.display = '';
      warn.innerHTML = util.esc(w.warn);
    } else if (warn) warn.style.display = 'none';

    const cond = w.at(L.lat, L.lon, core.freshness.officialStandings);
    const tEl = document.getElementById('wxTime');
    if (tEl) tEl.textContent = cond?.time ? `${cond.time.replace('T', ' ')} UTC` : '';
    const card = (k, v, d, cls) =>
      `<div class="stat ${cls || ''}"><div class="stat__k">${k}</div><div class="stat__v" style="font-size:21px">${v}</div><div class="stat__d">${d}</div></div>`;
    if (!cond) {
      box.innerHTML = card('Modèle', '—', 'hors couverture de la grille Atlantique');
    } else {
      box.innerHTML =
        card('Vent modèle', `${util.one(cond.wind)}<small>nd</small>`, `${Math.round(cond.windDir || 0)}° ${util.cardinal(cond.windDir)}`) +
        card('Rafales', `${util.one(cond.gust)}<small>nd</small>`, 'modèle') +
        card('Vagues', `${util.one(cond.waves)}<small>m</small>`, cond.wavePeriod ? `période ${util.one(cond.wavePeriod)} s · ${util.cardinal(cond.waveDir)}` : '—') +
        card('Pression', `${util.int(cond.pressure)}<small>hPa</small>`, `${util.int(cond.cloud)} % nuages`) +
        card('Air', `${util.one(cond.temp)}<small>°C</small>`, 'à 2 m') +
        card('Mer', `${util.one(cond.sst)}<small>°C</small>`, 'température de surface');
    }

    // live card weather (2 stats)
    const wn = document.getElementById('wxNow');
    if (wn) {
      wn.innerHTML =
        `<div class="stat"><div class="stat__k">Vent</div><div class="stat__v" style="font-size:21px">${cond ? util.one(cond.wind) : '—'}<small>nd</small></div><div class="stat__d">${cond ? util.cardinal(cond.windDir) + ' · rafales ' + util.one(cond.gust) : 'modèle indisponible'}</div></div>` +
        `<div class="stat"><div class="stat__k">Vagues</div><div class="stat__v" style="font-size:21px">${cond && Number.isFinite(cond.waves) ? util.one(cond.waves) : '—'}<small>m</small></div><div class="stat__d">${cond ? 'hauteur significative' : '—'}</div></div>`;
    }

    if (cond) {
      const s = w.seriesAt(L.lat, L.lon, core.freshness.officialStandings, 48);
      if (s) charts.forecast(s);
    }
  };

  /* -------------------------------------------------------- sources pane */
  P.renderSources = function () {
    const core = dataStore.core;
    if (!core) return;
    const st = core.sources || {};
    const list = document.getElementById('srcList');
    const srcTime = document.getElementById('srcTime');
    if (srcTime) srcTime.textContent = core.freshness.lastRun ? `collecte ${util.ago(core.freshness.lastRun)}` : '';

    const nameMap = {
      'carto.versions': ['Index du tracker (versions)', 'carto.routedurhum.com/data/versions.txt'],
      'carto.config': ['Configuration de course', 'tracker_config.hwx'],
      'carto.tracks': ['Traces depuis le départ', 'tracker_tracks.hwx'],
      'carto.reports': ['Historique des pointages', 'tracker_reports.hwx'],
      'carto.live': ['Dernier pointage', 'tracker_live.hwx'],
      'rdr.classement': ['Classement officiel', 'routedurhum.com/_functions/classement'],
      'open-meteo': ['Météo modèle', 'api.open-meteo.com'],
    };
    if (list) {
      list.innerHTML = Object.entries(nameMap)
        .map(([key, [label, url]]) => {
          const s = st[key];
          const ok = s && s.ok;
          const dot = ok ? 'dot--ok' : s ? 'dot--bad' : 'dot--warn';
          const info = s?.lastSuccess ? `dernier succès ${util.ago(s.lastSuccess)}` : s ? 'aucun succès' : 'non tenté';
          const err = !ok && s?.lastError ? `<div class="srcrow__d" style="color:#ffb3b3">${util.esc(s.lastError)}</div>` : '';
          return `<div class="srcrow">
            <div><div class="srcrow__n">${util.esc(label)}</div><div class="srcrow__u">${util.esc(url)}</div></div>
            <div style="text-align:right"><span class="dot ${dot}" style="display:inline-block"></span>
              <div class="mono" style="font-size:9px;color:var(--ink-faint)">${info}</div></div>
            ${err}</div>`;
        })
        .join('');
      // browser-side official API status
      const o = document.createElement('div');
      o.className = 'srcrow';
      const ok = dataStore.officialOk;
      o.innerHTML = `<div><div class="srcrow__n">API classement — appel navigateur</div><div class="srcrow__u">CORS autorisé par l'organisateur</div></div>
        <div style="text-align:right"><span class="dot ${ok ? 'dot--ok' : ok === false ? 'dot--bad' : 'dot--warn'}" style="display:inline-block"></span>
        <div class="mono" style="font-size:9px;color:var(--ink-faint)">${ok ? 'actif · ' + util.ago(dataStore.officialAt) : ok === false ? 'bloqué, snapshot utilisé' : 'test en cours'}</div></div>
        ${ok === false ? `<div class="srcrow__d" style="color:#ffb3b3">${util.esc(dataStore.officialError || '')} — les chiffres affichés proviennent du dernier instantané du collecteur.</div>` : ''}`;
      list.appendChild(o);
    }

    const detail = document.getElementById('srcDetail');
    if (detail) {
      detail.innerHTML = `
        <div class="kv"><span class="kv__k">Positions & traces</span><span class="kv__v">Geovoile / YB Tracking</span></div>
        <div class="kv"><span class="kv__k">Fréquence des pointages</span><span class="kv__v">5 min au départ, puis horaire</span></div>
        <div class="kv"><span class="kv__k">Fréquence des traces</span><span class="kv__v">5 à 15 min</span></div>
        <div class="kv"><span class="kv__k">Classement</span><span class="kv__v">API JSON officielle</span></div>
        <div class="kv"><span class="kv__k">Météo modèle</span><span class="kv__v">Open-Meteo (ECMWF/GFS/WAM)</span></div>
        <div class="kv"><span class="kv__k">Fond satellite</span><span class="kv__v">Esri World Imagery</span></div>
        <div class="kv"><span class="kv__k">Archivage</span><span class="kv__v">GitHub Actions → snapshots</span></div>
        <div class="note" style="margin-top:12px">
          Les fichiers <code class="mono">tracker_*.hwx</code> sont des fichiers statiques obfusqués servis par la
          cartographie officielle. Ils sont décodés côté collecteur (algorithme vérifié sur les octets réels et
          recoupé avec l'analyse publique <a class="link" href="https://github.com/jguiban/srdata" target="_blank" rel="noopener">jguiban/srdata</a>),
          normalisés en JSON et republiés ici. Aucune donnée n'est fabriquée : une source absente reste absente.
        </div>
        <div class="note" style="margin-top:8px">
          Les positions affichées sont celles publiées par l'organisation. Elles peuvent être volontairement
          décalées (mode « position masquée ») ; le collecteur conserve la trace telle quelle et les micro-sauts
          sont filtrés à l'affichage, jamais réécrits.
        </div>`;
    }
  };

  /* ---------------------------------------------------------- boat modal */
  P.showBoatModal = function (b) {
    const body = document.getElementById('modalBody');
    if (!body) return;
    body.innerHTML = `
      <div class="eyebrow">Ocean Fifty · fiche concurrent</div>
      <h2 id="modalTitle" style="font-size:26px;margin:4px 0 2px">${util.esc(b.n)}</h2>
      <div class="dim" style="margin-bottom:16px">${util.esc(b.b || '')}</div>
      <div class="kv"><span class="kv__k">Classement</span><span class="kv__v">${b.r ?? '—'} / ${dataStore.core.laurent.partants || '—'}</span></div>
      <div class="kv"><span class="kv__k">Vitesse fond</span><span class="kv__v">${util.one(b.v)} nd</span></div>
      <div class="kv"><span class="kv__k">VMG</span><span class="kv__v">${util.one(b.vmg)} nd</span></div>
      <div class="kv"><span class="kv__k">Cap</span><span class="kv__v">${b.cap ?? '—'}° ${util.cardinal(b.cap)}</span></div>
      <div class="kv"><span class="kv__k">Distance à l'arrivée</span><span class="kv__v">${util.int(b.dtf)} mi</span></div>
      <div class="kv"><span class="kv__k">Écart au leader</span><span class="kv__v">${util.nm(b.dtl)} mi</span></div>
      <div class="kv"><span class="kv__k">Écart à La French Fab</span><span class="kv__v">${util.nm(b.gapToMe)} mi</span></div>
      <div class="kv"><span class="kv__k">Statut</span><span class="kv__v">${util.esc(b.st || '—')}</span></div>
      ${b.fiche ? `<div class="divider"></div><a class="pill" href="${b.fiche}" target="_blank" rel="noopener">Fiche officielle ↗</a>` : ''}
    `;
    const m = document.getElementById('modal');
    m.classList.add('is-open');
  };

  window.panels = P;
})();
