# Rapport de test — 2026-11-04T14:18:43.130Z

**14 tests OK / 6 en échec**

| Test | Résultat | Détail |
| --- | --- | --- |
| core chargé | ✅ |  |
| identifier Laurent | ✅ | BOURGUES (tracker 11) |
| trace Laurent décodée | ✅ | 321 points |
| flotte configurée | ✅ | 115 bateaux |
| classements chargés | ✅ | 6 classes |
| pictogrammes sur la carte | ❌ | 0 marqueurs |
| trace dessinée sur le canvas | ❌ |  |
| météo modèle chargée | ❌ | HTTP 400 |
| API officielle live | ✅ |  |
| rang affiché | ✅ | 8 / 10 |
| vitesse affichée | ✅ | 9,2nd |
| aucune erreur JS | ❌ |  |
| graphiques rendus | ✅ | [{"key":"chartSpeed","points":108,"w":379,"h":176,"visible":false},{"key":"chartRank","points":108,"w":379,"h":132,"visible":false},{"key":"chartDtf","points":1 |
| particules de vent dessinées | ✅ | 5616 pixels opaques |
| replay actif | ✅ | {"active":true,"playing":true,"t":1793516697.9959998,"timelineOpen":true,"ghost":true} |
| mobile : pas de débordement horizontal | ✅ | 463px / 463px |
| mobile : marqueurs présents | ❌ | 0 |
| panne de source : message explicite | ✅ | 
          Les données sont momentanément indisponibles.
          HTTP 503 sur /data/core |
| panne de source : aucune fausse position | ✅ | 0 marqueurs |
| API live bloquée : snapshot conservé | ❌ | {"markers":0,"status":"Connexion aux données officielles…","officialOk":false,"wxReady":false,"rank":"8 / 10"} |

## Console
```
[pageerror] Cannot read properties of undefined (reading '107')
[error] Failed to load resource: the server responded with a status of 400 (Bad Request)
[error] Failed to load resource: the server responded with a status of 400 (Bad Request)
[pageerror] Cannot read properties of undefined (reading '107')
[error] Failed to load resource: the server responded with a status of 400 (Bad Request)
[error] Failed to load resource: net::ERR_FAILED
[error] Failed to load resource: net::ERR_FAILED
[error] Failed to load resource: the server responded with a status of 503 (Service Unavailable)
[error] Failed to load resource: net::ERR_FAILED
[error] Failed to load resource: net::ERR_FAILED
[pageerror] Cannot read properties of undefined (reading '107')
[error] Failed to load resource: net::ERR_FAILED
[error] Failed to load resource: the server responded with a status of 400 (Bad Request)
```

## Réseau (erreurs)
```
HTTP 400 https://api.open-meteo.com/v1/forecast?latitude=52,48,44,40,36,32,28,24,20,16,12&longitude=-68,-63,-58,-53,-48,-43,-38,-33,-28,-23,-18,-13,-
HTTP 400 https://marine-api.open-meteo.com/v1/marine?latitude=52,48,44,40,36,32,28,24,20,16,12&longitude=-68,-63,-58,-53,-48,-43,-38,-33,-28,-23,-18,
FAILED https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/5/11/11 — net::ERR_ABORTED
FAILED https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/5/11/14 — net::ERR_ABORTED
FAILED https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/5/12/11 — net::ERR_ABORTED
FAILED https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/5/12/14 — net::ERR_ABORTED
FAILED https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/5/13/12 — net::ERR_ABORTED
FAILED https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/5/13/13 — net::ERR_ABORTED
FAILED https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/5/10/11 — net::ERR_ABORTED
FAILED https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/5/10/14 — net::ERR_ABORTED
FAILED https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/5/13/11 — net::ERR_ABORTED
FAILED https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/5/13/14 — net::ERR_ABORTED
FAILED https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/5/9/12 — net::ERR_ABORTED
FAILED https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/5/9/13 — net::ERR_ABORTED
FAILED https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/5/11/10 — net::ERR_ABORTED
FAILED https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/5/11/15 — net::ERR_ABORTED
FAILED https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/5/12/10 — net::ERR_ABORTED
FAILED https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/5/12/15 — net::ERR_ABORTED
FAILED https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/5/14/13 — net::ERR_ABORTED
FAILED https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/5/9/11 — net::ERR_ABORTED
FAILED https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/5/9/14 — net::ERR_ABORTED
FAILED https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/5/10/10 — net::ERR_ABORTED
FAILED https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/5/13/10 — net::ERR_ABORTED
FAILED https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/5/13/15 — net::ERR_ABORTED
FAILED https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/5/14/11 — net::ERR_ABORTED
FAILED https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/5/14/14 — net::ERR_ABORTED
FAILED https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/5/9/10 — net::ERR_ABORTED
FAILED https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/5/11/16 — net::ERR_ABORTED
FAILED https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/5/12/9 — net::ERR_ABORTED
FAILED https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/5/12/16 — net::ERR_ABORTED
FAILED https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/5/14/10 — net::ERR_ABORTED
FAILED https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/5/10/16 — net::ERR_ABORTED
FAILED https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/5/13/16 — net::ERR_ABORTED
FAILED https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/5/9/9 — net::ERR_ABORTED
FAILED https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/5/9/16 — net::ERR_ABORTED
FAILED https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/5/14/9 — net::ERR_ABORTED
FAILED https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/5/14/16 — net::ERR_ABORTED
FAILED https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/6/23/26 — net::ERR_ABORTED
FAILED https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/6/23/27 — net::ERR_ABORTED
FAILED https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/6/24/27 — net::ERR_ABORTED
FAILED https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/6/22/26 — net::ERR_ABORTED
FAILED https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/6/22/27 — net::ERR_ABORTED
FAILED https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/6/23/25 — net::ERR_ABORTED
FAILED https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/6/23/28 — net::ERR_ABORTED
FAILED https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/6/24/28 — net::ERR_ABORTED
FAILED https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/6/25/26 — net::ERR_ABORTED
FAILED https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/6/22/25 — net::ERR_ABORTED
FAILED https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/6/22/28 — net::ERR_ABORTED
FAILED https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/6/25/25 — net::ERR_ABORTED
FAILED https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/6/25/28 — net::ERR_ABORTED
FAILED https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/6/21/26 — net::ERR_ABORTED
FAILED https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/6/21/27 — net::ERR_ABORTED
FAILED https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/6/23/24 — net::ERR_ABORTED
FAILED https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/6/23/29 — net::ERR_ABORTED
FAILED https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/6/24/24 — net::ERR_ABORTED
FAILED https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/6/24/29 — net::ERR_ABORTED
FAILED https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/6/26/26 — net::ERR_ABORTED
FAILED https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/6/26/27 — net::ERR_ABORTED
FAILED https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/6/21/25 — net::ERR_ABORTED
FAILED https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/6/21/28 — net::ERR_ABORTED
```