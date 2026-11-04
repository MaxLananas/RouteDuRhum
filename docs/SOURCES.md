# Sources de données — Route du Rhum 2026

Document d'enquête : ce qui existe réellement, comment c'est publié, ce qui a été
vérifié sur les octets réels, et ce qui n'existe pas.

Dernière vérification : **4 novembre 2026**, course en cours (départ 1ᵉʳ novembre
2026 à 12:02 UTC).

---

## 1. Vue d'ensemble

| Source | Nature | Fréquence réelle | Format | CORS | Licence / conditions |
| --- | --- | --- | --- | --- | --- |
| `carto.routedurhum.com/data/versions.txt` | index de versions | à chaque publication | texte `{clé:version}` | non | site officiel, accès libre |
| `carto.routedurhum.com/data/tracker_config.hwx` | config course, 115 bateaux, parcours | rare (à chaque changement) | XML obfusqué + LZ | non | idem |
| `…/tracker_tracks.hwx` | traces complètes depuis le départ | ≈ toutes les 5–15 min | JSON obfusqué + LZ | non | idem |
| `…/tracker_reports.hwx` | tous les pointages (38 colonnes) | à chaque pointage | JSON obfusqué + LZ | non | idem |
| `…/tracker_live.hwx` | dernier pointage + points frais | à chaque pointage | JSON obfusqué + LZ | non | idem |
| `www.routedurhum.com/_functions/classement?lang=fr` | classement officiel | ≈ horaire | JSON | **oui (`*`)** | API publique du site |
| `api.open-meteo.com` / `marine-api.open-meteo.com` | météo et océan | heure de modèle | JSON | oui | usage non commercial libre (CC-BY 4.0 pour les données) |
| `server.arcgisonline.com` (World Imagery) | fond satellite | statique | JPEG tuiles | oui | usage Esri, attribution obligatoire |
| Tuiles OSM / CartoDB | fonds alternatifs | statique | PNG | oui | ODbL / attribution |

Aucune de ces sources n'est officiellement documentée comme API publique — à
l'exception du classement, dont l'en-tête CORS montre qu'il est pensé pour être
consommé par des tiers. Les fichiers `tracker_*.hwx` sont des **fichiers statiques
servis par un bucket S3** (`Server: AmazonS3`) derrière la cartographie : ce ne sont
pas des API, il n'y a ni contrat ni SLA. Le site doit donc tolérer leur disparition
ou un changement de format sans jamais afficher de données inventées.

---

## 2. Les fichiers du tracker Geovoile

### 2.1 Index `versions.txt`

```
{config:20261104114533,tracks:20261104132844,reports:20261104132842,live:20261104132842,geoblog:0}
```

Chaque valeur est un horodatage `AAAAMMJJhhmmss`. C'est le mécanisme de cache-busting
du site officiel : on ne retélécharge une ressource que si son numéro a changé.
`geoblog: 0` indique qu'aucun contenu éditorial n'est publié (`/data/geoblog.json`
renvoie `403 AccessDenied` — vérifié).

### 2.2 Format `.hwx`

Les quatre ressources `tracker_*.hwx` sont compressées et obfusquées :

- octet 0 : graine du générateur xorshift ;
- octets 1–3 : taille décompressée (24 bits, via le keystream) ;
- ensuite un flux de blocs : tous les 8 blocs, un octet de drapeaux
  `(brut ^ (i & 0xFF)) ^ 0xA3` ; chaque bit vaut 0 (littéral, XORé au keystream) ou
  1 (référence arrière : `longueur = (b0 >> 4) + 3`,
  `distance = (((b0 & 0xF) << 8) | b1) + 1`).

Le décodeur est implémenté dans `tools/geo/hwx.mjs` (aucune dépendance), et il est
**vérifié sur les octets réels** : `tracker_config.hwx` → 64 274 octets de XML,
`tracker_reports.hwx` → 1 934 870 octets de JSON contenant 108 pointages, etc.

L'analyse publique [jguiban/srdata](https://github.com/jguiban/srdata) décrit le même
algorithme (`collector/geovoile.py`). Elle a servi de recoupement, pas de source : notre
implémentation a été testée et corrigée contre les fichiers live (voir
`data/diagnostics/`). Principales différences constatées :

- l'ordre des pointages dans `tracker_reports.hwx` **n'est pas garanti** : il était
  chronologique (ancien → récent) lors de nos tests, alors qu'il était supposé
  antéchronologique. Le collecteur détecte l'ordre à partir des dates ;
- `tracker_live.hwx` ne contient plus qu'**un seul pointage** (pas « la trace depuis
  le précédent ») : les points frais doivent être lus dans `history[0].lines[*][38]`
  (colonne `track`, `[ts, lat, lon, dtf]` en absolu) ;
- le champ `pred` des traces (route prévue par le routeur) est **publié vide** pour
  les 116 bateaux (`pred: [[]]`) : l'organisation ne diffuse pas de route
  prévisionnelle. Notre site n'en affiche donc aucune (voir §6).

### 2.3 Pointages — 38 colonnes

`boat, racestatus, rank, progress, dtf, dtl, dtlProgress, heading, speed, vmg,
offset, heading1, dist1, vmg1, dog1, heading2, dist2, vmg2, dog2, vitmax4, vitmax24,
vitmax48, vitmoy48, vitmaxd, vit_moy_depart, dog, winddir, windspeed, windgust,
currentdir, currentspeed, wavedir, waveheight, tempair, tempwater, rain, clouds, track`

Unités déduites des valeurs publiées et recoupées avec l'affichage officiel :

| Champ | Sens | Unité |
| --- | --- | --- |
| `dtf` / `dtl` | distance à l'arrivée / retard sur le leader | milles nautiques |
| `speed`, `vmg` | vitesse fond, VMG | nœuds |
| `heading` | cap fond | degrés |
| `dist1` / `vmg1` | distance et VMG sur 4 h | milles / nœuds |
| `dist2` / `vmg2` | distance et VMG sur 24 h | milles / nœuds |
| `vitmax4`, `vitmax24`, `vitmax48`, `vitmaxd` | vitesse max sur 4 h / 24 h / 48 h / course | nœuds |
| `vitmoy48`, `vit_moy_depart` | vitesse moyenne 48 h / depuis le départ | nœuds |
| `dog` | distance parcourue cumulée | milles |
| `windspeed`, `windgust` | vent et rafales **au pointage** | dixièmes de nœud |
| `winddir`, `currentdir`, `wavedir` | direction d'où vient le vent / courant / houle | degrés |
| `currentspeed` | courant | dixièmes de nœud (échelle déduite) |
| `waveheight` | hauteur de vagues | décimètres |
| `tempair`, `tempwater` | air / eau | dixièmes de °C |
| `clouds` | couverture nuageuse | 0–400 (échelle interne) |
| `rain` | précipitation | unité non documentée |

> **Important** : cette météo est fournie par le partenaire météo de l'organisation à
> la position du bateau, **pas mesurée à bord**. Le site la présente comme « météo
> officielle au pointage » et jamais comme une mesure du bord. La vitesse, le cap et
> les distances proviennent en revanche des instruments du bateau relayés par le
> tracker.

### 2.4 Cadence réellement observée

Sur 108 pointages entre le 1ᵉʳ novembre 12:02 UTC et le 4 novembre 14:00 UTC :

| Intervalle | Occurrences |
| --- | --- |
| 5 min | 31 |
| 60 min | 69 |
| autres (1, 3, 4, 15, 56 min) | 8 |

Donc : **5 minutes dans les premières heures, puis horaire**. Les traces sont plus
denses (5 min au départ, puis 15 min : 261 intervalles de 900 s, 29 de 300 s sur la
trace de Laurent). Le classement `_functions/classement` est republié en pratique
toutes les heures (`maj` = 13:00:40 UTC pour un pointage de 13:00:00 UTC).

### 2.5 Historique complet

Oui : `tracker_tracks.hwx` contient **toute la trace depuis le départ** (points
absolus après décodage delta) et `tracker_reports.hwx` **tous les pointages**. Les
deux sont réécrits à chaque publication. Il n'y a donc pas besoin de scraper
l'historique : un seul téléchargement suffit, et un archivage régulier (fait par le
workflow `collect.yml`) protège contre une éventuelle purge en fin de course.

---

## 3. Catographie officielle (Geovoile)

La page `carto.routedurhum.com` charge :

```
assets/jquery.3.7.1.js, hws.js, main.js, sig.js, viewer.js, version_standard_viewer.js
```

L'analyse de `sig.js` et `viewer.js` (voir `data/diagnostics/carto-analysis.md`) montre
que la carte officielle :

- lit `versions.txt` puis les quatre `tracker_*.hwx` ;
- n'utilise **aucun fichier météo propre** : la couche « météo » du site est un lien
  sortant vers `marine.meteoconsult.fr`. Il n'y a ni GRIB, ni champ de vent
  téléchargeable, ni API météo sur la cartographie. **C'est pourquoi notre site
  construit ses couches météo à partir d'Open-Meteo**, explicitement étiquetées
  « modèle ».
- affiche des fonds cartographiques classiques (Leaflet), sans clé d'API publique.

Les conditions d'utilisation du site officiel ne prévoient pas explicitement la reprise
des fichiers du tracker. Ils sont publics, non protégés, et nous les **citons comme
source** partout dans l'interface, sans réhéberger les visuels ni les marques de
l'organisation. Les photos des skippers sont quant à elles chargées **directement
depuis `static.wixstatic.com`** (jamais copiées dans le dépôt) et uniquement pour
identifier les concurrents.

---

## 4. API classement

```
GET https://www.routedurhum.com/_functions/classement?lang=fr
```

- `application/json`, ~76 Ko, `Access-Control-Allow-Origin: *` → **appelable depuis le
  navigateur**.
- Contient : `phase`, `depart`, `maj`, `distance`, puis par classe (`ultim`,
  `ocean-fifty`, `imoca`, `class40`, `vintage-multi`, `vintage-mono`) : identité,
  bateau, voile, photo, filtres, fiche, `statut` (`RAC`, `RET`, `STA`, `NL`), rang,
  `rangAvant`, `dtf`, `dtl`, `vitesse`, `vitesse24h`, `dist24h`, `cap`, `vmg`, `lat`,
  `lon`, et `hist` (12 dernières places).
- Vérifié : 115 bateaux, 6 classes, cohérent avec le tracker.
- Non documenté, non versionné. Le site l'utilise **en complément** du snapshot
  (jamais à la place) et bascule sur son propre proxy `/api/classement` si le CORS
  ou le réseau bloquent.

---

## 5. Météo

La cartographie officielle n'expose pas de champ météo (§3). Deux familles de données
sont utilisées, toujours étiquetées :

1. **Météo officielle au pointage** (dans le tracker) : vent, rafales, direction,
   courant, vagues, températures, nuages — à la position du bateau, une fois par heure.
   Utilisée pour les graphiques « conditions rencontrées ».
2. **Modèle Open-Meteo** (`api.open-meteo.com`, `marine-api.open-meteo.com`) :
   - atmosphère : `wind_speed_10m`, `wind_direction_10m`, `wind_gusts_10m`,
     `pressure_msl`, `cloud_cover`, `temperature_2m`, `relative_humidity_2m`,
     `precipitation`, `visibility`, `cape` ;
   - océan : `wave_height`, `wave_direction`, `wave_period`, `swell_wave_*`,
     `wind_wave_*`, `sea_surface_temperature`.
   Grille Atlantique **140 points** (10 latitudes × 14 longitudes, de 52°N à 16°N et
   68°O à 16°O), pas de 4°, prévision 3 jours.

   > Piège vérifié : l'API multi-points attend des **paires** latitude[i]/longitude[i]
   > de même longueur — ce n'est **pas** un produit cartésien. Envoyer 10 latitudes et
   > 14 longitudes renvoie
   > `{"reason":"Parameter 'latitude' and 'longitude' must have the same number of elements"}`.
   > Le site construit donc la liste appariée (140 valeurs de chaque côté).

Open-Meteo est gratuit pour un usage non commercial, avec attribution (CC-BY 4.0).
Aucune clé n'est nécessaire ; les appels sont limités par minute, d'où le cache de
30 minutes côté client et la grille raisonnable.

---

## 6. Ce qui n'existe pas (et n'est donc pas affiché)

| Donnée | Statut |
| --- | --- |
| Route prévisionnelle du routeur (`pred`) | **publiée vide** par l'organisation pour les 116 bateaux. Aucune route « prévue » n'est dessinée ; seule la route théorique officielle du parcours et la trace réelle le sont. |
| Position intra-pointage temps réel | non publiée : la position officielle ne change qu'au pointage (horaire en croisière). Le site affiche l'âge du pointage plutôt que de simuler un déplacement. |
| Vitesse/bordure « mesurée à bord » en continu | non publiée. |
| Météo embarquée | non publiée (seulement le modèle du partenaire au pointage). |
| Historique des fichiers `versions.txt` | non publié ; notre collecteur archive chaque nouvel état. |
| Flux vidéo / audio à bord | non disponible. |
| API officielle documentée | inexistante. |

---

## 7. Droits et attribution

- **Données de course** : © Route du Rhum — Destination Guadeloupe / OC Sport Pen
  Duick, relayées par le tracker Geovoile / YB Tracking. Reprises à titre
  d'information avec attribution visible dans l'interface et dans ce document.
- **Fonds de carte** : Esri World Imagery (attribution affichée sur la carte), OSM
  (ODbL) pour les fonds alternatifs.
- **Météo** : Open-Meteo (CC-BY 4.0), modèles ECMWF/IFS, GFS/NOAA, WAM.
- **Photos** : chargées à la volée depuis le CDN de l'organisation, non redistribuées.
- **Marques** « La French Fab », « Route du Rhum » : propriétés de leurs détenteurs ;
  usage descriptif uniquement (site de suivi non officiel).
- **Polices** : Bricolage Grotesque (OFL), Instrument Serif (OFL), JetBrains Mono
  (OFL) — fichiers `woff2` auto-hébergés, licences conservées.
- **Bibliothèques** : Leaflet (BSD-2), Chart.js (MIT) — auto-hébergées, licences
  conservées dans `public/vendor/`.
