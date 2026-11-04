# Route du Rhum 2026 — suivi de Laurent Bourguès · La French Fab

Centre de suivi temps réel du skipper **Laurent Bourguès** et de son Ocean Fifty
**La French Fab** sur la Route du Rhum — Destination Guadeloupe 2026.

- Carte satellite interactive, trace réelle depuis le départ, replay complet
- Classement Ocean Fifty, écarts, statistiques officielles et calculées
- Météo de modèle (Open-Meteo) interpolée à la position du bateau
- Actualisation automatique 24 h/24 depuis les sources officielles
- Déploiement statique (Cloudflare Pages)

Documentation complète : [`docs/`](docs/) — sources, méthodologie, déploiement.

## Démarrage local

```bash
npm run collect      # récupère les données officielles (réseau ouvert requis)
npm run build:data   # normalise les données pour le navigateur
npm run dev          # http://localhost:8080 sert public/
```

Les données publiées dans `public/data/` sont produites par le workflow
GitHub Actions `collect.yml` (toutes les 5 minutes).

## Structure

```
public/               site statique (Cloudflare Pages)
  index.html
  assets/css, assets/js, assets/fonts, assets/img
  data/               instantanés JSON générés
  vendor/             Leaflet, Chart.js (licences conservées)
tools/                collecteur, décodeur Geovoile, build des données
scripts/              tests visuels et fonctionnels
functions/            Pages Functions optionnelles (proxy / cache)
data/                 snapshots bruts + diagnostics (non servis)
docs/                 documentation des sources et du déploiement
```
