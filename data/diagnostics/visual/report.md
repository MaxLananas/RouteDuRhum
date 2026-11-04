# Rapport de test — 2026-11-04T22:13:55.476Z

**50 tests OK / 0 en échec**

| Test | Résultat | Détail |
| --- | --- | --- |
| core chargé | ✅ |  |
| identifier Laurent | ✅ | BOURGUES (tracker 11) |
| trace Laurent décodée | ✅ | 325 points |
| flotte configurée | ✅ | 115 bateaux |
| classements chargés | ✅ | 6 classes |
| pictogrammes sur la carte | ✅ | 11 marqueurs |
| trace dessinée sur le canvas | ✅ |  |
| météo modèle chargée | ✅ |  |
| performances officielles non nulles | ✅ | ["4 heures37,2 mi8,7 nd12,6 nd","24 heures259 mi8,9 nd20,2 nd","48 heures—14,8 nd25,4 nd","Depuis le départ1 284 mi15,0 nd25,4 nd"] |
| écarts flotte sans doublon Laurent | ✅ | ["Anne-Claire LE BERRE +25,7 mi 14,0","Erwan LE DRAOULEC −116,8 mi 20,2","Luke BERRY −173,3 mi 21,9","Thibaut VAUCHEL-CAMUS −216,4 mi 18,6","Baptiste HULIN −268 |
| API officielle live | ✅ |  |
| rang affiché | ✅ | 8 / 10 |
| vitesse affichée | ✅ | 14,3nd |
| aucune erreur JS | ✅ |  |
| communiqués de course affichés | ✅ | {"count":7,"first":"Matthieu PERRAUT · ELVEST RET · Abandon Chavirage le 3 novembre au soir, à 400 milles au n","links":7,"empty":false} |
| comparaison avec la flotte | ✅ | 10 courbes |
| graphiques rendus | ✅ | [{"key":"chartSpeed","points":109,"w":379,"h":176,"visible":true},{"key":"chartRank","points":109,"w":379,"h":132,"visible":true},{"key":"chartDtf","points":109 |
| graphiques : axe de temps réel | ✅ | {"type":"linear","points":109,"uniform":true,"early":1,"late":8,"tick":"03 nov. 11:00","geom":{"left":45.80011901855469,"right":337.89974212646484,"width":292.0 |
| particules de vent visibles | ✅ | 33964 pixels visibles |
| lecteur météo au survol | ✅ | 15.8 nd 254° OSO |
| couche nuages : voile dessiné | ✅ | {"layer":"clouds","painted":16486,"legend":true,"otherLegends":[],"readout":"16 % partiellement couvert","hasValue":true} |
| calque météo : couvre toute la carte | ✅ | {"stage":[1188,938],"css":[1188,938],"backing":[1188,938],"internal":[1188,938],"dpr":1} |
| couche nuages : légende et lecteur dédiés | ✅ | 16 % partiellement couvert |
| replay actif | ✅ | {"active":true,"playing":true,"t":1793516700.0000007,"timelineOpen":true,"ghost":true} |
| replay : direct mis en retrait | ✅ | {"card":true,"op":"0.28"} |
| desktop 1024px : rail entièrement visible | ✅ | {"iw":1024,"rail":360,"railRight":1024,"barRight":1024,"stage":664,"outside":0,"chipsOn":3,"chipsClipped":[],"markers":11} |
| desktop 1024px : aucun élément hors écran | ✅ | 0 éléments |
| desktop 1024px : indicateurs du bandeau lisibles | ✅ | 3 indicateurs, tronqués: [] / fit {"room":319,"shown":["tRank","tSpeed","tDtf"],"hidden":["tDtl","tPos","tAge"],"need":290} |
| desktop 1280px : rail entièrement visible | ✅ | {"iw":1280,"rail":412,"railRight":1280,"barRight":1280,"stage":868,"outside":0,"chipsOn":5,"chipsClipped":[],"markers":11} |
| desktop 1280px : aucun élément hors écran | ✅ | 0 éléments |
| desktop 1280px : indicateurs du bandeau lisibles | ✅ | 5 indicateurs, tronqués: [] / fit {"room":575,"shown":["tRank","tSpeed","tDtf","tDtl","tAge"],"hidden":["tPos"],"need":543} |
| desktop 1440px : rail entièrement visible | ✅ | {"iw":1440,"rail":412,"railRight":1440,"barRight":1440,"stage":1028,"outside":0,"chipsOn":6,"chipsClipped":[],"markers":11} |
| desktop 1440px : aucun élément hors écran | ✅ | 0 éléments |
| desktop 1440px : indicateurs du bandeau lisibles | ✅ | 6 indicateurs, tronqués: [] / fit {"room":735,"shown":["tRank","tSpeed","tDtf","tDtl","tPos","tAge"],"hidden":[],"need":712} |
| desktop 1920px : rail entièrement visible | ✅ | {"iw":1920,"rail":412,"railRight":1920,"barRight":1920,"stage":1508,"outside":0,"chipsOn":6,"chipsClipped":[],"markers":11} |
| desktop 1920px : aucun élément hors écran | ✅ | 0 éléments |
| desktop 1920px : indicateurs du bandeau lisibles | ✅ | 6 indicateurs, tronqués: [] / fit {"room":1215,"shown":["tRank","tSpeed","tDtf","tDtl","tPos","tAge"],"hidden":[],"need":712} |
| mobile : pas de débordement horizontal | ✅ | 390px / 390px [{"tag":"img","cls":"leaflet-tile leaflet-tile-loaded","right":562,"w":215},{"tag":"img","cls":"leaflet-tile leaflet-tile-loaded","right":562,"w": |
| mobile : marqueurs présents | ✅ | 4 |
| mobile : boutons carte ⇄ panneau | ✅ | {"sheet":true,"carte":true} |
| mobile : titre lisible et boutons décrits | ✅ | {"title":"La French Fab · Route du Rhum 2026","titleClipped":false,"liveLabel":"Revenir au direct","refreshLabel":"Actualiser les données"} |
| mobile : onglet Carte visible et cliquable | ✅ | {"found":true,"shown":true,"inside":true,"box":[311,380,69,390],"clickable":true,"at":"tab tab--map tab--float","label":"Carte ↑"} |
| mobile : l’onglet Carte ne recouvre rien | ✅ | {"tab":[311,380,69,390],"hits":[]} |
| mobile : Carte replie le panneau | ✅ | {"open":false,"pane":"live"} |
| photo officielle du skipper | ✅ | {"src":"https://static.wixstatic.com/media/547c0f_875ec65a36e246a7a69418d05054dadb~mv2.avif","ok":true,"hidden":false} |
| panne de source : message explicite | ✅ | 
          Les données sont momentanément indisponibles.
          HTTP 503 sur /data/core |
| panne de source : aucune fausse position | ✅ | 0 marqueurs |
| API live bloquée : snapshot conservé | ✅ | {"markers":11,"status":"Direct · pointage officiel il y a 8 h 15","wxUrls":{"atmo":"https://api.open-meteo.com/v1/forecast?latitude=52,52,52,52,52,52,52,52,52,5 |
| sans tuiles : mode schématique annoncé | ✅ | {"cls":true,"badge":true,"markers":11,"trail":3566} |
| sans tuiles : trace et bateaux toujours lisibles | ✅ | {"cls":true,"badge":true,"markers":11,"trail":3566} |

## Console
```
[error] Failed to load resource: net::ERR_FAILED
[error] Failed to load resource: net::ERR_FAILED
[error] Failed to load resource: the server responded with a status of 503 (Service Unavailable)
[error] Failed to load resource: net::ERR_FAILED
[error] Failed to load resource: net::ERR_FAILED
[error] Failed to load resource: net::ERR_FAILED
[error] Failed to load resource: the server responded with a status of 404 (File not found)
[error] Failed to load resource: net::ERR_FAILED
[error] Failed to load resource: net::ERR_FAILED
[error] Failed to load resource: net::ERR_FAILED
[error] Failed to load resource: net::ERR_FAILED
[error] Failed to load resource: net::ERR_FAILED
[error] Failed to load resource: net::ERR_FAILED
[error] Failed to load resource: net::ERR_FAILED
[error] Failed to load resource: net::ERR_FAILED
[error] Failed to load resource: net::ERR_FAILED
[error] Failed to load resource: net::ERR_FAILED
[error] Failed to load resource: net::ERR_FAILED
[error] Failed to load resource: net::ERR_FAILED
[error] Failed to load resource: net::ERR_FAILED
[error] Failed to load resource: net::ERR_FAILED
[error] Failed to load resource: net::ERR_FAILED
[error] Failed to load resource: net::ERR_FAILED
[error] Failed to load resource: net::ERR_FAILED
[error] Failed to load resource: net::ERR_FAILED
[error] Failed to load resource: net::ERR_FAILED
[error] Failed to load resource: net::ERR_FAILED
```

## Réseau (erreurs)
```
FAILED https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/4/5/5 — net::ERR_ABORTED
FAILED https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/4/5/6 — net::ERR_ABORTED
FAILED https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/4/6/5 — net::ERR_ABORTED
FAILED https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/4/6/6 — net::ERR_ABORTED
FAILED https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/4/4/5 — net::ERR_ABORTED
FAILED https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/4/4/6 — net::ERR_ABORTED
FAILED https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/4/5/4 — net::ERR_ABORTED
FAILED https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/4/5/7 — net::ERR_ABORTED
FAILED https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/4/6/4 — net::ERR_ABORTED
FAILED https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/4/6/7 — net::ERR_ABORTED
FAILED https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/4/7/5 — net::ERR_ABORTED
FAILED https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/4/7/6 — net::ERR_ABORTED
FAILED https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/4/4/4 — net::ERR_ABORTED
FAILED https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/4/4/7 — net::ERR_ABORTED
FAILED https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/4/7/4 — net::ERR_ABORTED
FAILED https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/4/7/7 — net::ERR_ABORTED
FAILED https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/4/5/3 — net::ERR_ABORTED
FAILED https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/4/5/8 — net::ERR_ABORTED
FAILED https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/4/6/3 — net::ERR_ABORTED
FAILED https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/4/6/8 — net::ERR_ABORTED
FAILED https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/4/4/3 — net::ERR_ABORTED
FAILED https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/4/4/8 — net::ERR_ABORTED
FAILED https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/4/7/3 — net::ERR_ABORTED
FAILED https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/4/7/8 — net::ERR_ABORTED
FAILED https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/4/5/9 — net::ERR_ABORTED
FAILED https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/4/6/9 — net::ERR_ABORTED
FAILED https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/4/7/9 — net::ERR_ABORTED
FAILED https://api.open-meteo.com/v1/forecast?latitude=52,52,52,52,52,52,52,52,52,52,52,52,52,52,48,48,48,48,48,48,48,48,48,48,48,48,48,48,44,44,44 — net::ERR_FAILED
FAILED https://marine-api.open-meteo.com/v1/marine?latitude=52,52,52,52,52,52,52,52,52,52,52,52,52,52,48,48,48,48,48,48,48,48,48,48,48,48,48,48,44, — net::ERR_FAILED
HTTP 503 http://127.0.0.1:8099/data/core.json?v=1793830518231
FAILED https://api.open-meteo.com/v1/forecast?latitude=52,52,52,52,52,52,52,52,52,52,52,52,52,52,48,48,48,48,48,48,48,48,48,48,48,48,48,48,44,44,44 — net::ERR_FAILED
FAILED https://marine-api.open-meteo.com/v1/marine?latitude=52,52,52,52,52,52,52,52,52,52,52,52,52,52,48,48,48,48,48,48,48,48,48,48,48,48,48,48,44, — net::ERR_FAILED
FAILED https://www.routedurhum.com/_functions/classement?lang=fr&_=1793830523305 — net::ERR_FAILED
HTTP 404 http://127.0.0.1:8099/api/classement?_=1793830523305
FAILED https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/4/5/6 — net::ERR_FAILED
FAILED https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/4/6/6 — net::ERR_FAILED
FAILED https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/4/5/5 — net::ERR_FAILED
FAILED https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/4/5/7 — net::ERR_FAILED
FAILED https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/4/6/5 — net::ERR_FAILED
FAILED https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/4/6/7 — net::ERR_FAILED
FAILED https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/4/4/6 — net::ERR_FAILED
FAILED https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/4/7/6 — net::ERR_FAILED
FAILED https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/4/4/5 — net::ERR_FAILED
FAILED https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/4/4/7 — net::ERR_FAILED
FAILED https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/4/7/5 — net::ERR_FAILED
FAILED https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/4/7/7 — net::ERR_FAILED
FAILED https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/4/5/4 — net::ERR_FAILED
FAILED https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/4/5/8 — net::ERR_FAILED
FAILED https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/4/6/4 — net::ERR_FAILED
FAILED https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/4/6/8 — net::ERR_FAILED
FAILED https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/4/4/4 — net::ERR_FAILED
FAILED https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/4/4/8 — net::ERR_FAILED
FAILED https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/4/7/4 — net::ERR_FAILED
FAILED https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/4/7/8 — net::ERR_FAILED
```