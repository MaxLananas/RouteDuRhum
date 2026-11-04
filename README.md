# Route du Rhum 2026 — suivi de Laurent Bourguès · La French Fab

Centre de suivi dédié au skipper **Laurent Bourguès** et à son Ocean Fifty
**La French Fab** (FRA 3) sur la Route du Rhum — Destination Guadeloupe 2026.

Le site n'affiche **que des données réelles**. Chaque chiffre est étiqueté
`OFF.` (officiel), `CALC.` (calculé par nos soins) ou « modèle » (météo
Open-Meteo), avec sa source et son horodatage. Quand une donnée n'est pas
publiée, le site l'écrit « non publiée » : il ne l'estime jamais.

## Ce que contient le site

- **Carte plein écran** — fond satellite (ou nuit / relief), trace réelle depuis
  le départ (325 pointages), replay complet avec curseur et vitesses de lecture,
  fantôme de position, zoom tactile/molette/boutons, plein écran, recentrage.
- **Flotte** — les 115 inscrits, focus Ocean Fifty (10 bateaux), écarts calculés
  par rapport à Laurent, classement officiel par classe.
- **Analyses** — vitesse, cap, rang, distance à l'arrivée, conditions météo, et
  comparaison avec les concurrents directs. Graphiques issus de l'historique réel.
- **Météo** — vent animé, vagues, isobares, **couverture nuageuse**, barbules,
  prévision 48 h. Modèle Open-Meteo (ECMWF IFS / GFS, WAM-MeteoFrance pour
  l'océan), interpolé à la position officielle du bateau.
- **Bateau & course** — fiche Laurent / La French Fab / Ocean Fifty, historique
  du bateau, informations de course.
- **Sources** — la liste complète des sources, leur fréquence, ce qu'elles
  publient et ce qu'elles ne publient pas.

## Démarrage local

```bash
npm run collect      # récupère les données officielles (réseau ouvert requis)
npm run build:data   # normalise les données pour le navigateur
npm run dev          # http://localhost:8080 — sert public/ + /api/classement
```

`npm run dev` utilise `tools/serve.mjs`, un serveur sans dépendance qui émule
Cloudflare Pages : fichiers statiques de `public/`, fonctions de `functions/`
exposées sous `/api/*`, en-têtes de `public/_headers`. Sans réseau, `/api/classement`
répond honnêtement `502 upstream_unavailable`.

## Données et publication

| Élément | Source | Fréquence réelle |
| --- | --- | --- |
| Classement, cap, vitesse, écarts | `routedurhum.com/_functions/classement` (CORS ouvert) | republié toutes les heures |
| Trace et pointages | `carto.routedurhum.com/data/tracker_*.hwx` (Geovoile) | pointages 5 min → 60 min |
| Météo | Open-Meteo (atmosphère + marine) | 3 h de pas horaire, rechargée toutes les 30 min |

Le workflow GitHub Actions `collect.yml` interroge les sources toutes les
5 minutes, met à jour `public/data/*.json` et pousse sur la branche de données :
Cloudflare Pages redéploie automatiquement, sans action manuelle.

> **Avant mise en ligne** : GitHub n'exécute un cron que depuis la **branche par
> défaut**. Tant que `main` ne contient que le README initial, aucune exécution
> planifiée ne part (vérifié : 0 run `schedule` sur 129). Après fusion de la PR,
> vérifier avec `gh run list --workflow=collect.yml --event=schedule`. Le site signale
> de lui-même un collecteur muet : bandeau « Instantané figé — collecte il y a X »,
> pastille ambre, aucun chiffre extrapolé. Détails et quotas (dont les 500 déploiements
> Pages/mois) dans [`docs/DEPLOY.md`](docs/DEPLOY.md).

## Tests

`scripts/visual-test.mjs` (**51 vérifications**) pilote un vrai Chrome : données,
carte, replay, couches météo, quatre largeurs d'écran, mobile, pannes de source.
Les captures sont dans `data/diagnostics/visual/`. Détail dans
[`docs/TESTING.md`](docs/TESTING.md).

## Structure

```
public/               site statique (Cloudflare Pages)
  index.html
  assets/css, assets/js, assets/fonts, assets/img
  data/               instantanés JSON générés
  vendor/             Leaflet, Chart.js (licences conservées)
  _headers, _redirects
functions/            Pages Functions (proxy / cache du classement)
tools/                collecteur, décodeur Geovoile, build des données, serveur de dev
scripts/              tests visuels et fonctionnels
data/                 snapshots bruts + diagnostics (non servis)
docs/                 documentation : sources, architecture, déploiement, tests
```

## Documentation

- [`docs/SOURCES.md`](docs/SOURCES.md) — chaque source : URL, format `.hwx`, colonnes,
  cadence observée, limites, droits. Ce qui n'existe pas y est écrit noir sur blanc.
- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — flux de données, contrats des
  modules, résilience, performance.
- [`docs/DEPLOY.md`](docs/DEPLOY.md) — mise en ligne Cloudflare, quota, variantes.
- [`docs/TESTING.md`](docs/TESTING.md) — ce qui est testé, comment, et ce qui ne l'est pas.

## Mentions

Projet non officiel, réalisé par un tiers. « Route du Rhum », « La French Fab » et
les marques associées appartiennent à leurs détenteurs ; les données de course
restent la propriété d'OC Sport Pen Duick / Geovoile. Les visuels tiers (photo du
skipper, tuiles satellite, polices) sont utilisés dans les limites de leurs
conditions d'utilisation, avec attribution.
