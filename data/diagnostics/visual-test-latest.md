# Visual test run 12 — 2026-11-04T14:44:31Z

```
PASS  core chargé
PASS  identifier Laurent — BOURGUES (tracker 11)
PASS  trace Laurent décodée — 321 points
PASS  flotte configurée — 115 bateaux
PASS  classements chargés — 6 classes
PASS  pictogrammes sur la carte — 11 marqueurs
PASS  trace dessinée sur le canvas
PASS  météo modèle chargée
PASS  performances officielles non nulles — ["4 heures39,6 mi8,8 nd13,1 nd","24 heures257 mi8,8 nd20,2 nd","48 heures—15,0 nd25,4 nd","Depuis le départ1 271 mi15,1 nd25,4 nd"]
PASS  écarts flotte sans doublon Laurent — ["Anne-Claire LE BERRE +19,5 mi 13,0","Erwan LE DRAOULEC −75,0 mi 12,7","Luke BERRY −104,8 mi 14,2","Thibaut VAUCHEL-CAMUS −162,4 mi 16,9","Baptiste HULIN −262,
PASS  API officielle live
PASS  rang affiché — 8 / 10
PASS  vitesse affichée — 9,2nd
PASS  aucune erreur JS
PASS  graphiques rendus — [{"key":"chartSpeed","points":108,"w":379,"h":176,"visible":false},{"key":"chartRank","points":108,"w":379,"h":132,"visible":false},{"key":"chartDtf","points":108,"w":379,"h":132,"visible":false},{"key":"chartWind","points":108,"w":379,"h":132,"visible":false},{"key":"chartForecast","points":48,"w":379,"h":176,"visible":false}]
PASS  particules de vent visibles — 35962 pixels visibles
PASS  lecteur météo au survol — 15.7 nd 287° ONO
PASS  replay actif — {"active":true,"playing":true,"t":1793516697.9960005,"timelineOpen":true,"ghost":true}
PASS  mobile : pas de débordement horizontal — 463px / 463px [{"tag":"img","cls":"leaflet-tile leaflet-tile-loaded","right":750,"w":304},{"tag":"img","cls":"leaflet-tile leaflet-tile-loaded","right":750,"w":304},{"tag":"img","cls":"leaflet-tile leaflet-tile-loaded","right":750,"w":304},{"tag":"img","cls":"leaflet-tile leaflet-tile-loaded","right":750,"w":304},{"tag":"svg","cls":"[object SVGAnimatedString]","right":510,"w":556},{"tag":"span","cls":"mono","right":487,"w":52}]
PASS  mobile : marqueurs présents — 11
MOBILE DEBUG {"innerWidth":463,"clientWidth":390,"scrollWidth":463,"bodyScroll":463,"visual":390,"mq900":true,"topbar":{"w":463,"l":0,"r":463},"stage":{"w":463,"l":0,"r":463},"rail":{"w":463,"l":0,"r":463},"main":{"w":463,"l":0,"r":463},"huds":{"w":184,"l":269,"r":453},"tabs":{"w":463,"l":0,"r":463},"tabStyle":"fixed","widest":[{"t":"svg","c":"[object SVGAnimatedString]","w":556},{"t":"header","c":"topbar","w":463},{"t":"main","c":"main","w":463},{"t":"section","c":"stage","w":463},{"t":"div","c":"leaflet-container leaflet-touc","w":463},{"t":"div","c":"leaflet-control-container","w":463}]}
PASS  panne de source : message explicite — 
          Les données sont momentanément indisponibles.
          HTTP 503 sur /data/core
PASS  panne de source : aucune fausse position — 0 marqueurs
PASS  API live bloquée : snapshot conservé — {"markers":11,"status":"Direct · pointage officiel il y a 44 min","wxUrls":{"atmo":"https://api.open-meteo.com/v1/forecast?latitude=52,52,52,52,52,52,52,52,52,52,52,52,52,52,48,48,48,48,48,48,48,48,48,48,48,48,48,48,44,44,44,44,44,44,44,44,44,44,44,44,44,44,40,40,40,40,40,40,40,40,40,40,40,40,40,40,36,36,36,36,36,36,36,36,36,36,36,36,36,36,32,32,32,32,32,32,32,32,32,32,32,32,32,32,28,28,28,28,28,28,28,28,28,28,28,28,28,28,24,24,24,24,24,24,24,24,24,24,24,24,24,24,20,20,20,20,20,20,20,20,20,20,20,20,20,20,16,16,16,16,16,16,16,16,16,16,16,16,16,16&longitude=-68,-64,-60,-56,-52,-48,-44,-40,-36,-32,-28,-24,-20,-16,-68,-64,-60,-56,-52,-48,-44,-40,-36,-32,-28,-24,-20,-16,-68,-64,-60,-56,-52,-48,-44,-40,-36,-32,-28,-24,-20,-16,-68,-64,-60,-56,-52,-48,-44,-40,-36,-32,-28,-24,-20,-16,-68,-64,-60,-56,-52,-48,-44,-40,-36,-32,-28,-24,-20,-16,-68,-64,-60,-56,-52,-48,-44,-40,-36,-32,-28,-24,-20,-16,-68,-64,-60,-56,-52,-48,-44,-40,-36,-32,-28,-24,-20,-16,-68,-64,-60,-56,-52,-48,-44,-40,-36,-32,-28,-24,-20,-16,-68,-64,-60,-56,-52,-48,-44,-40,-36,-32,-28,-24,-20,-16,-68,-64,-60,-56,-52,-48,-44,-40,-36,-32,-28,-24,-20,-16&timezone=UTC&forecast_days=3&hourly=wind_speed_10m,wind_direction_10m,wind_gusts_10m,pressure_msl,cloud_cover,temperature_2m&wind_speed_unit=kn","marine":"https://marine-api.open-meteo.com/v1/marine?latitude=52,52,52,52,52,52,52,52,52,52,52,52,52,52,48,48,48,48,48,48,48,48,48,48,48,48,48,48,44,44,44,44,44,44,44,44,44,44,44,44,44,44,40,40,40,40,40,40,40,40,40,40,40,40,40,40,36,36,36,36,36,36,36,36,36,36,36,36,36,36,32,32,32,32,32,32,32,32,32,32,32,32,32,32,28,28,28,28,28,28,28,28,28,28,28,28,28,28,24,24,24,24,24,24,24,24,24,24,24,24,24,24,20,20,20,20,20,20,20,20,20,20,20,20,20,20,16,16,16,16,16,16,16,16,16,16,16,16,16,16&longitude=-68,-64,-60,-56,-52,-48,-44,-40,-36,-32,-28,-24,-20,-16,-68,-64,-60,-56,-52,-48,-44,-40,-36,-32,-28,-24,-20,-16,-68,-64,-60,-56,-52,-48,-44,-40,-36,-32,-28,-24,-20,-16,-68,-64,-60,-56,-52,-48,-44,-40,-36,-32,-28,-24,-20,-16,-68,-64,-60,-56,-52,-48,-44,-40,-36,-32,-28,-24,-20,-16,-68,-64,-60,-56,-52,-48,-44,-40,-36,-32,-28,-24,-20,-16,-68,-64,-60,-56,-52,-48,-44,-40,-36,-32,-28,-24,-20,-16,-68,-64,-60,-56,-52,-48,-44,-40,-36,-32,-28,-24,-20,-16,-68,-64,-60,-56,-52,-48,-44,-40,-36,-32,-28,-24,-20,-16,-68,-64,-60,-56,-52,-48,-44,-40,-36,-32,-28,-24,-20,-16&timezone=UTC&forecast_days=3&hourly=wave_height,wave_direction,wave_period,sea_surface_temperature"},"perfRows":["4 heures39,6 mi8,8 nd13,1 nd","24 heures257 mi8,8 nd20,2 nd","48 heures—15,0 nd25,4 nd","Depuis le départ1 271 mi15,1 nd25,4 nd"],"gapRows":["Anne-Claire LE BERRE +19,5 mi 13,0","Erwan LE DRAOULEC −75,0 mi 12,7","Luke BERRY −104,8 mi 14,2","Thibaut VAUCHEL-CAMUS −162,4 mi 16,9","Baptiste HULIN −262,7 mi 17,6"],"officialOk":false,"wxReady":false,"rank":"8 / 10"}

23 OK / 0 FAIL — screenshots in data/diagnostics/visual
```
