# Architecture

```
                          ┌──────────────────────────── GitHub Actions (toutes les 5 min) ──────────────────────────┐
  carto.routedurhum.com   │  tools/collect.mjs                                                                     │
  tracker_*.hwx  ────────▶│  • lit versions.txt, ne retélécharge que si la version change                          │
  _functions/classement ─▶│  • décode le .hwx (XOR/xorshift + LZ), parse XML/JSON                                  │
  api.open-meteo.com ────▶│  • écrit data/*.json (snapshot brut) + data/meta.json (état des sources)               │
                          │  • erreurs isolées par source : une source en panne n'efface pas les autres            │
                          │                                                                                        │
                          │  tools/build-app-data.mjs                                                              │
                          │  • traces delta-encodées, séries horaires, fusion avec les instantanés publiés         │
                          │  • refuse de publier des classements vides (garde le dernier état valide)              │
                          │  • commit + push  →  data/ et public/data/                                             │
                          └────────────────────────────────────────────────────────────────────────────────────────┘
                                                     │
                                                     ▼
                              Git (branche main)  ──▶  Cloudflare Pages (build statique)
                                                     │      public/  servi tel quel
                                                     │      functions/api/classement.js  (proxy de secours)
                                                     ▼
                                     Navigateur  ──▶  core.json, track-11.json, history-*.json
                                                  ──▶  API officielle (CORS *) ou /api/classement
                                                  ──▶  Open-Meteo (grille 140 points, cache 30 min)
```

## Pourquoi GitHub Actions plutôt qu'un cron Cloudflare

Le site doit rester **statique et sans redéploiement** pour se mettre à jour. Deux
options existaient :

1. **Cloudflare Cron Trigger + KV/D1** : il faudrait un Worker planifié qui télécharge
   le tracker, décode le `.hwx` (algorithme binaire) et écrive dans un KV, puis un
   Worker qui serve les données. C'est possible, mais cela introduit un stockage à
   gérer, des limites d'écriture KV et un second environnement à maintenir.
2. **GitHub Actions + fichiers statiques** (retenu) : un cron de 5 minutes (le minimum
   autorisé) télécharge, décode et **commite** les JSON. Cloudflare Pages sert le
   dépôt ; chaque commit est publié automatiquement par Pages, sans configuration.
   L'historique des commits constitue en plus une archive horodatée gratuite.

GitHub Actions sert aussi de **sonde réseau** : le sandbox de développement n'a pas
accès aux domaines de la course, donc c'est l'exécuteur qui a validé chaque source
(voir `data/diagnostics/`). Les logs de chaque exécution sont conservés dans
`data/diagnostics/collect-latest.md`.

**Coût** : un job de ~40 s par tranche de 5 min ≈ 290 h/mois d'exécution, sous le
quota gratuit de 2 000 min/mois d'un dépôt privé — et gratuit pour un dépôt public.

Si le dépôt doit rester privé ou si l'on veut descendre plus bas en latence, la
variante KV décrite dans `DEPLOY.md` (§5) est prête à être implémentée.

## Rôle de chaque fichier

| Fichier | Rôle |
| --- | --- |
| `tools/geo/hwx.mjs` | décodeur `.hwx` + parseurs config / traces / pointages |
| `tools/collect.mjs` | collecte, normalisation, météo modèle, état des sources |
| `tools/build-app-data.mjs` | fabrication du payload navigateur (léger, delta-encodé) |
| `tools/probe-*.mjs` | sondes de sources (tiles, API, bundles, Open-Meteo, `pred`) |
| `scripts/visual-test.mjs` | tests fonctionnels + captures d'écran dans un vrai Chrome |
| `functions/api/classement.js` | proxy Pages + cache edge du classement officiel |
| `public/assets/js/data.js` | chargement, fusion API live, calculs dérivés |
| `public/assets/js/map.js` | Leaflet, traces, replay, pictogrammes |
| `public/assets/js/weather.js` | grille Open-Meteo, flux de particules, isobares, vagues, couverture nuageuse |
| `public/assets/js/charts.js` | graphiques Chart.js |
| `public/assets/js/panels.js` | rendu des onglets du panneau latéral |
| `public/assets/js/app.js` | orchestration, rafraîchissement, résilience |

## Chaîne de décodage

```
.hwx (binaire)
  └─ decodeHwx()        XOR/xorshift + LZ77-ish  ──▶  XML (config) ou JSON (tracks/reports/live)
        ├─ parseConfig()   ──▶ bateaux, classes, parcours officiel
        ├─ parseTracks()   ──▶ { t, lat, lon } par bateau (deltas décodés)
        ├─ parseReports()  ──▶ 108 pointages × 38 colonnes
        └─ parseLive()     ──▶ dernier pointage + points frais
```

## Fraîcheur : deux horloges distinctes

Le site distingue explicitement deux choses que l'on confond vite :

| Horloge | Champ | Signification |
| --- | --- | --- |
| Pipeline | `freshness.lastRun` | date de la dernière collecte réussie (le snapshot servi) |
| Source | `freshness.officialStandings` | date de publication du classement officiel |

Une API de classement joignable ne doit **jamais** faire passer un instantané figé
pour du direct : c'est exactement ce qui s'est produit le 4 novembre (collecte
muette depuis 7 h, badge « Direct » toujours vert). Désormais :

- `lastRun` > 40 min → bandeau « Instantané figé — collecte il y a X », pastille
  ambre, point rouge, infobulle explicite ;
- `lastRun` > 2 h → message d'avertissement, en précisant qu'aucune position n'est
  extrapolée ;
- `officialStandings` > 2 h 30 → « pas de pointage plus récent » + avertissement.

Le cas est couvert par un test dédié (`instantané figé`, 6 h simulées).

## Résilience

| Panne | Comportement |
| --- | --- |
| Une ressource du tracker échoue | les autres continuent ; `meta.sources[x].ok = false` et l'erreur sont publiés ; le snapshot précédent est conservé |
| `versions.txt` indisponible | les ressources restent téléchargeables sans version (`?v=timestamp`) |
| Le collecteur n'a pas de classement (runner neuf) | `build-app-data` conserve les classements et l'index de traces déjà publiés |
| L'API live est bloquée (CORS ou réseau) | bascule automatique sur `/api/classement`, puis sur le snapshot ; mention explicite dans l'onglet Sources |
| Open-Meteo indisponible | la carte et les données officielles continuent ; l'onglet Météo affiche l'erreur et un avertissement sur la carte |
| `core.json` inaccessible | message d'erreur explicite, **aucune position affichée**, bouton Réessayer |
| Pointage ancien (> 2 h 30) | bandeau d'état « dernière image », toast d'avertissement, aucune extrapolation |

## Performance

- `core.json` ≈ 70 Ko, trace de Laurent ≈ 5 Ko (325 points), historique ≈ 15 Ko.
- Le calque météo est un seul canvas redimensionné sur la boîte de la scène
  (`ResizeObserver` sur `#stage`), pas une pile de tuiles : le coût d'un changement
  de couche est un seul `putImageData`, et le bord de grille est fondu sur 2,5°
  pour ne pas dessiner une ligne droite au milieu de l'océan.
- Trace peinte sur un canvas 2D (pas de milliers de polygones Leaflet).
- Chaque bateau est un `L.marker` (pictogramme SVG inline, rotation par CSS).
- Les traces des autres classes ne sont pas téléchargées : seuls les marqueurs
  suffisent.
- Images et polices auto-hébergées, aucune requête bloquante hors carte et météo.
