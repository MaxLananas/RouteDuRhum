# Rapport de test — 2026-11-04T14:16:52.599Z

**2 tests OK / 18 en échec**

| Test | Résultat | Détail |
| --- | --- | --- |
| core chargé | ❌ |  |
| identifier Laurent | ❌ | undefined (tracker undefined) |
| trace Laurent décodée | ❌ | 0 points |
| flotte configurée | ❌ | 0 bateaux |
| classements chargés | ❌ | 0 classes |
| pictogrammes sur la carte | ❌ | 0 marqueurs |
| trace dessinée sur le canvas | ❌ |  |
| météo modèle chargée | ❌ |  |
| API officielle live | ❌ |  |
| rang affiché | ❌ | — |
| vitesse affichée | ❌ | —nd |
| aucune erreur JS | ❌ |  |
| graphiques rendus | ❌ | [] |
| particules de vent dessinées | ❌ | 0 pixels opaques |
| replay actif | ❌ | {"active":false,"playing":false,"t":0,"timelineOpen":false,"ghost":false} |
| mobile : pas de débordement horizontal | ✅ | 463px / 463px |
| mobile : marqueurs présents | ❌ | 0 |
| panne de source : message explicite | ❌ |  |
| panne de source : aucune fausse position | ✅ | 0 marqueurs |
| API live bloquée : snapshot conservé | ❌ | {"markers":0,"status":"Chargement du tracker…","officialOk":null,"rank":"—"} |

## Console
```
[error] Failed to load resource: the server responded with a status of 404 (File not found)
[error] Failed to load resource: the server responded with a status of 404 (File not found)
[error] Failed to load resource: the server responded with a status of 404 (File not found)
[pageerror] L is not defined
[pageerror] L is not defined
[pageerror] L is not defined
[error] Failed to load resource: the server responded with a status of 404 (File not found)
[error] Failed to load resource: the server responded with a status of 404 (File not found)
[error] Failed to load resource: the server responded with a status of 404 (File not found)
[pageerror] L is not defined
[error] Failed to load resource: the server responded with a status of 404 (File not found)
[error] Failed to load resource: the server responded with a status of 404 (File not found)
[error] Failed to load resource: the server responded with a status of 404 (File not found)
[pageerror] L is not defined
[error] Failed to load resource: the server responded with a status of 404 (File not found)
[error] Failed to load resource: the server responded with a status of 404 (File not found)
[error] Failed to load resource: the server responded with a status of 404 (File not found)
[pageerror] L is not defined
```

## Réseau (erreurs)
```
HTTP 404 http://127.0.0.1:8099/vendor/leaflet/leaflet.css
FAILED http://127.0.0.1:8099/vendor/leaflet/leaflet.css — net::ERR_ABORTED
HTTP 404 http://127.0.0.1:8099/vendor/leaflet/leaflet.js
FAILED http://127.0.0.1:8099/vendor/leaflet/leaflet.js — net::ERR_ABORTED
HTTP 404 http://127.0.0.1:8099/vendor/chartjs/chart.umd.js
FAILED http://127.0.0.1:8099/vendor/chartjs/chart.umd.js — net::ERR_ABORTED
HTTP 404 http://127.0.0.1:8099/vendor/leaflet/leaflet.css
FAILED http://127.0.0.1:8099/vendor/leaflet/leaflet.css — net::ERR_ABORTED
HTTP 404 http://127.0.0.1:8099/vendor/chartjs/chart.umd.js
FAILED http://127.0.0.1:8099/vendor/chartjs/chart.umd.js — net::ERR_ABORTED
HTTP 404 http://127.0.0.1:8099/vendor/leaflet/leaflet.js
FAILED http://127.0.0.1:8099/vendor/leaflet/leaflet.js — net::ERR_ABORTED
HTTP 404 http://127.0.0.1:8099/vendor/leaflet/leaflet.css
FAILED http://127.0.0.1:8099/vendor/leaflet/leaflet.css — net::ERR_ABORTED
HTTP 404 http://127.0.0.1:8099/vendor/leaflet/leaflet.js
FAILED http://127.0.0.1:8099/vendor/leaflet/leaflet.js — net::ERR_ABORTED
HTTP 404 http://127.0.0.1:8099/vendor/chartjs/chart.umd.js
FAILED http://127.0.0.1:8099/vendor/chartjs/chart.umd.js — net::ERR_ABORTED
HTTP 404 http://127.0.0.1:8099/vendor/leaflet/leaflet.css
FAILED http://127.0.0.1:8099/vendor/leaflet/leaflet.css — net::ERR_ABORTED
HTTP 404 http://127.0.0.1:8099/vendor/leaflet/leaflet.js
FAILED http://127.0.0.1:8099/vendor/leaflet/leaflet.js — net::ERR_ABORTED
HTTP 404 http://127.0.0.1:8099/vendor/chartjs/chart.umd.js
FAILED http://127.0.0.1:8099/vendor/chartjs/chart.umd.js — net::ERR_ABORTED
```