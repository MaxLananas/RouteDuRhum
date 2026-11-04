# Rapport de test — 2026-11-04T14:28:54.375Z

**22 tests OK / 0 en échec**

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
| graphiques rendus | ✅ | [{"key":"chartSpeed","points":108,"w":379,"h":176,"visible":false},{"key":"chartRank","points":108,"w":379,"h":132,"visible":false},{"key":"chartDtf","points":1 |
| particules de vent dessinées | ✅ | 6385 pixels opaques |
| replay actif | ✅ | {"active":true,"playing":true,"t":1793516699.9999988,"timelineOpen":true,"ghost":true} |
| mobile : pas de débordement horizontal | ✅ | 463px / 463px |
| mobile : marqueurs présents | ✅ | 11 |
| panne de source : message explicite | ✅ | 
          Les données sont momentanément indisponibles.
          HTTP 503 sur /data/core |
| panne de source : aucune fausse position | ✅ | 0 marqueurs |
| API live bloquée : snapshot conservé | ✅ | {"markers":11,"status":"Direct · pointage officiel il y a 30 min","wxUrls":{"atmo":"https://api.open-meteo.com/v1/forecast?latitude=52,52,52,52,52,52,52,52,52,5 |

## Console
```
[error] Access to image at 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/6/23/28' from origin 'http://127.0.0.1:8099' has been blocked by CORS policy: No 'Access-Control-Allow-Origin' header is present on the requested resource.
[error] Failed to load resource: net::ERR_FAILED
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
FAILED https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/6/23/28 — net::ERR_FAILED
FAILED https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/6/22/27 — net::ERR_ABORTED
FAILED https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/6/25/27 — net::ERR_ABORTED
FAILED https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/6/22/26 — net::ERR_ABORTED
FAILED https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/6/22/28 — net::ERR_ABORTED
FAILED https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/6/25/26 — net::ERR_ABORTED
FAILED https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/6/23/25 — net::ERR_ABORTED
FAILED https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/6/23/29 — net::ERR_ABORTED
FAILED https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/6/24/29 — net::ERR_ABORTED
FAILED https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/6/21/27 — net::ERR_ABORTED
FAILED https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/6/22/25 — net::ERR_ABORTED
FAILED https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/6/22/29 — net::ERR_ABORTED
FAILED https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/6/25/29 — net::ERR_ABORTED
FAILED https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/6/26/27 — net::ERR_ABORTED
FAILED https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/6/21/28 — net::ERR_ABORTED
FAILED https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/6/26/26 — net::ERR_ABORTED
FAILED https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/6/26/28 — net::ERR_ABORTED
FAILED https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/6/23/24 — net::ERR_ABORTED
FAILED https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/6/23/30 — net::ERR_ABORTED
FAILED https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/6/24/24 — net::ERR_ABORTED
FAILED https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/6/24/30 — net::ERR_ABORTED
FAILED https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/6/21/25 — net::ERR_ABORTED
FAILED https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/6/21/29 — net::ERR_ABORTED
FAILED https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/6/26/25 — net::ERR_ABORTED
FAILED https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/6/26/29 — net::ERR_ABORTED
FAILED https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/6/22/24 — net::ERR_ABORTED
FAILED https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/6/22/30 — net::ERR_ABORTED
FAILED https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/6/25/24 — net::ERR_ABORTED
FAILED https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/6/25/30 — net::ERR_ABORTED
FAILED https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/6/21/24 — net::ERR_ABORTED
FAILED https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/6/21/30 — net::ERR_ABORTED
FAILED https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/6/26/30 — net::ERR_ABORTED
FAILED https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/6/21/27 — net::ERR_ABORTED
FAILED https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/4/5/6 — net::ERR_ABORTED
FAILED https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/4/6/6 — net::ERR_ABORTED
FAILED https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/4/5/7 — net::ERR_ABORTED
```