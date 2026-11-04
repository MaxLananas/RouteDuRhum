# Rapport de test — 2026-11-04T14:47:52.845Z

**24 tests OK / 0 en échec**

| Test | Résultat | Détail |
| --- | --- | --- |
| core chargé | ✅ |  |
| identifier Laurent | ✅ | BOURGUES (tracker 11) |
| trace Laurent décodée | ✅ | 321 points |
| flotte configurée | ✅ | 115 bateaux |
| classements chargés | ✅ | 6 classes |
| pictogrammes sur la carte | ✅ | 11 marqueurs |
| trace dessinée sur le canvas | ✅ |  |
| météo modèle chargée | ✅ |  |
| performances officielles non nulles | ✅ | ["4 heures39,6 mi8,8 nd13,1 nd","24 heures257 mi8,8 nd20,2 nd","48 heures—15,0 nd25,4 nd","Depuis le départ1 271 mi15,1 nd25,4 nd"] |
| écarts flotte sans doublon Laurent | ✅ | ["Anne-Claire LE BERRE +19,5 mi 13,0","Erwan LE DRAOULEC −75,0 mi 12,7","Luke BERRY −104,8 mi 14,2","Thibaut VAUCHEL-CAMUS −162,4 mi 16,9","Baptiste HULIN −262, |
| API officielle live | ✅ |  |
| rang affiché | ✅ | 8 / 10 |
| vitesse affichée | ✅ | 9,2nd |
| aucune erreur JS | ✅ |  |
| comparaison avec la flotte | ✅ | 10 courbes |
| graphiques rendus | ✅ | [{"key":"chartSpeed","points":108,"w":379,"h":176,"visible":true},{"key":"chartRank","points":108,"w":379,"h":132,"visible":true},{"key":"chartDtf","points":108 |
| particules de vent visibles | ✅ | 34724 pixels visibles |
| lecteur météo au survol | ✅ | 15.7 nd 287° ONO |
| replay actif | ✅ | {"active":true,"playing":true,"t":1793516699.988,"timelineOpen":true,"ghost":true} |
| mobile : pas de débordement horizontal | ✅ | 390px / 390px [{"tag":"img","cls":"leaflet-tile leaflet-tile-loaded","right":562,"w":215},{"tag":"img","cls":"leaflet-tile leaflet-tile-loaded","right":562,"w": |
| mobile : marqueurs présents | ✅ | 4 |
| panne de source : message explicite | ✅ | 
          Les données sont momentanément indisponibles.
          HTTP 503 sur /data/core |
| panne de source : aucune fausse position | ✅ | 0 marqueurs |
| API live bloquée : snapshot conservé | ✅ | {"markers":11,"status":"Direct · pointage officiel il y a 49 min","wxUrls":{"atmo":"https://api.open-meteo.com/v1/forecast?latitude=52,52,52,52,52,52,52,52,52,5 |

## Console
```
[error] Failed to load resource: net::ERR_FAILED
[error] Failed to load resource: net::ERR_FAILED
[error] Failed to load resource: the server responded with a status of 503 (Service Unavailable)
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
FAILED https://api.open-meteo.com/v1/forecast?latitude=52,52,52,52,52,52,52,52,52,52,52,52,52,52,48,48,48,48,48,48,48,48,48,48,48,48,48,48,44,44,44 — net::ERR_FAILED
FAILED https://marine-api.open-meteo.com/v1/marine?latitude=52,52,52,52,52,52,52,52,52,52,52,52,52,52,48,48,48,48,48,48,48,48,48,48,48,48,48,48,44, — net::ERR_FAILED
HTTP 503 http://127.0.0.1:8099/data/core.json?v=1793803748673
FAILED https://api.open-meteo.com/v1/forecast?latitude=52,52,52,52,52,52,52,52,52,52,52,52,52,52,48,48,48,48,48,48,48,48,48,48,48,48,48,48,44,44,44 — net::ERR_FAILED
FAILED https://marine-api.open-meteo.com/v1/marine?latitude=52,52,52,52,52,52,52,52,52,52,52,52,52,52,48,48,48,48,48,48,48,48,48,48,48,48,48,48,44, — net::ERR_FAILED
FAILED https://www.routedurhum.com/_functions/classement?lang=fr&_=1793803753957 — net::ERR_FAILED
```