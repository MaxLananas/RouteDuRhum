# Rapport de test — 2026-11-04T15:16:01.731Z

**29 tests OK / 0 en échec**

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
| écarts flotte sans doublon Laurent | ✅ | ["Anne-Claire LE BERRE +17,9 mi 13,4","Erwan LE DRAOULEC −80,6 mi 12,3","Luke BERRY −116,0 mi 16,3","Thibaut VAUCHEL-CAMUS −176,2 mi 19,2","Baptiste HULIN −269, |
| API officielle live | ✅ |  |
| rang affiché | ✅ | 8 / 10 |
| vitesse affichée | ✅ | 12,6nd |
| aucune erreur JS | ✅ |  |
| comparaison avec la flotte | ✅ | 10 courbes |
| graphiques rendus | ✅ | [{"key":"chartSpeed","points":109,"w":379,"h":176,"visible":true},{"key":"chartRank","points":109,"w":379,"h":132,"visible":true},{"key":"chartDtf","points":109 |
| particules de vent visibles | ✅ | 28690 pixels visibles |
| lecteur météo au survol | ✅ | 15.7 nd 287° ONO |
| replay actif | ✅ | {"active":true,"playing":true,"t":1793516701.992001,"timelineOpen":true,"ghost":true} |
| replay : direct mis en retrait | ✅ | {"card":true,"op":"0.28"} |
| mobile : pas de débordement horizontal | ✅ | 390px / 390px [{"tag":"img","cls":"leaflet-tile leaflet-tile-loaded","right":562,"w":215},{"tag":"img","cls":"leaflet-tile leaflet-tile-loaded","right":562,"w": |
| mobile : marqueurs présents | ✅ | 4 |
| mobile : bouton d’ouverture du panneau | ✅ | {"b":true,"t":true} |
| photo officielle du skipper | ✅ | {"src":"https://static.wixstatic.com/media/547c0f_875ec65a36e246a7a69418d05054dadb~mv2.avif","ok":true,"hidden":false} |
| panne de source : message explicite | ✅ | 
          Les données sont momentanément indisponibles.
          HTTP 503 sur /data/core |
| panne de source : aucune fausse position | ✅ | 0 marqueurs |
| API live bloquée : snapshot conservé | ✅ | {"markers":11,"status":"Direct · pointage officiel il y a 1 h 17","wxUrls":{"atmo":"https://api.open-meteo.com/v1/forecast?latitude=52,52,52,52,52,52,52,52,52,5 |
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
FAILED https://api.open-meteo.com/v1/forecast?latitude=52,52,52,52,52,52,52,52,52,52,52,52,52,52,48,48,48,48,48,48,48,48,48,48,48,48,48,48,44,44,44 — net::ERR_FAILED
FAILED https://marine-api.open-meteo.com/v1/marine?latitude=52,52,52,52,52,52,52,52,52,52,52,52,52,52,48,48,48,48,48,48,48,48,48,48,48,48,48,48,44, — net::ERR_FAILED
HTTP 503 http://127.0.0.1:8099/data/core.json?v=1793805459324
FAILED https://api.open-meteo.com/v1/forecast?latitude=52,52,52,52,52,52,52,52,52,52,52,52,52,52,48,48,48,48,48,48,48,48,48,48,48,48,48,48,44,44,44 — net::ERR_FAILED
FAILED https://marine-api.open-meteo.com/v1/marine?latitude=52,52,52,52,52,52,52,52,52,52,52,52,52,52,48,48,48,48,48,48,48,48,48,48,48,48,48,48,44, — net::ERR_FAILED
FAILED https://www.routedurhum.com/_functions/classement?lang=fr&_=1793805464452 — net::ERR_FAILED
HTTP 404 http://127.0.0.1:8099/api/classement?_=1793805464452
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