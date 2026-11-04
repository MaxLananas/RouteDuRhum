# Visual test run 18 — 2026-11-04T15:14:43Z

```
PASS  core chargé
PASS  identifier Laurent — BOURGUES (tracker 11)
PASS  trace Laurent décodée — 325 points
PASS  flotte configurée — 115 bateaux
PASS  classements chargés — 6 classes
PASS  pictogrammes sur la carte — 11 marqueurs
PASS  trace dessinée sur le canvas
PASS  météo modèle chargée
PASS  performances officielles non nulles — ["4 heures37,2 mi8,7 nd12,6 nd","24 heures259 mi8,9 nd20,2 nd","48 heures—14,8 nd25,4 nd","Depuis le départ1 284 mi15,0 nd25,4 nd"]
PASS  écarts flotte sans doublon Laurent — ["Anne-Claire LE BERRE +17,9 mi 13,4","Erwan LE DRAOULEC −80,6 mi 12,3","Luke BERRY −116,0 mi 16,3","Thibaut VAUCHEL-CAMUS −176,2 mi 19,2","Baptiste HULIN −269,
PASS  API officielle live
PASS  rang affiché — 8 / 10
PASS  vitesse affichée — 12,6nd
PASS  aucune erreur JS
PASS  comparaison avec la flotte — 10 courbes
PASS  graphiques rendus — [{"key":"chartSpeed","points":109,"w":379,"h":176,"visible":true},{"key":"chartRank","points":109,"w":379,"h":132,"visible":true},{"key":"chartDtf","points":109,"w":379,"h":132,"visible":true},{"key":"chartWind","points":109,"w":379,"h":132,"visible":true},{"key":"chartRivals","points":109,"w":379,"h":176,"visible":true},{"key":"chartForecast","points":48,"w":379,"h":176,"visible":false}]
PASS  particules de vent visibles — 45584 pixels visibles
PASS  lecteur météo au survol — 15.7 nd 287° ONO
PASS  replay actif — {"active":true,"playing":true,"t":1793516699.988,"timelineOpen":true,"ghost":true}
PASS  replay : direct mis en retrait — {"card":true,"op":"0.28"}
PASS  mobile : pas de débordement horizontal — 390px / 390px [{"tag":"img","cls":"leaflet-tile leaflet-tile-loaded","right":562,"w":215},{"tag":"img","cls":"leaflet-tile leaflet-tile-loaded","right":562,"w":215},{"tag":"img","cls":"leaflet-tile leaflet-tile-loaded","right":562,"w":215},{"tag":"img","cls":"leaflet-tile leaflet-tile-loaded","right":562,"w":215},{"tag":"svg","cls":"[object SVGAnimatedString]","right":429,"w":468},{"tag":"span","cls":"mono","right":392,"w":52},{"tag":"button","cls":"tab","right":418,"w":71}]
PASS  mobile : marqueurs présents — 4
PASS  mobile : bouton d’ouverture du panneau — {"b":true,"t":true}
PASS  photo officielle du skipper — {"src":"https://static.wixstatic.com/media/547c0f_875ec65a36e246a7a69418d05054dadb~mv2.avif","ok":true,"hidden":false}
MOBILE DEBUG {"innerWidth":390,"clientWidth":390,"scrollWidth":390,"bodyScroll":390,"visual":390,"mq900":true,"topbar":{"w":390,"l":0,"r":390},"stage":{"w":390,"l":0,"r":390},"rail":{"w":390,"l":0,"r":390},"main":{"w":390,"l":0,"r":390},"huds":{"w":222,"l":158,"r":380},"tabs":{"w":390,"l":0,"r":390},"tabStyle":"fixed","widest":[{"t":"svg","c":"[object SVGAnimatedString]","w":468},{"t":"div","c":"app","w":390},{"t":"header","c":"topbar","w":390},{"t":"main","c":"main","w":390},{"t":"section","c":"stage","w":390},{"t":"div","c":"leaflet-container leaflet-touc","w":390}]}
PASS  panne de source : message explicite — 
          Les données sont momentanément indisponibles.
          HTTP 503 sur /data/core
PASS  panne de source : aucune fausse position — 0 marqueurs
PASS  API live bloquée : snapshot conservé — {"markers":11,"status":"Direct · pointage officiel il y a 1 h 14","wxUrls":{"atmo":"https://api.open-meteo.com/v1/forecast?latitude=52,52,52,52,52,52,52,52,52,52,52,52,52,52,48,48,48,48,48,48,48,48,48,48,48,48,48,48,44,44,44,44,44,44,44,44,44,44,44,44,44,44,40,40,40,40,40,40,40,40,40,40,40,40,40,40,36,36,36,36,36,36,36,36,36,36,36,36,36,36,32,32,32,32,32,32,32,32,32,32,32,32,32,32,28,28,28,28,28,28,28,28,28,28,28,28,28,28,24,24,24,24,24,24,24,24,24,24,24,24,24,24,20,20,20,20,20,20,20,20,20,20,20,20,20,20,16,16,16,16,16,16,16,16,16,16,16,16,16,16&longitude=-68,-64,-60,-56,-52,-48,-44,-40,-36,-32,-28,-24,-20,-16,-68,-64,-60,-56,-52,-48,-44,-40,-36,-32,-28,-24,-20,-16,-68,-64,-60,-56,-52,-48,-44,-40,-36,-32,-28,-24,-20,-16,-68,-64,-60,-56,-52,-48,-44,-40,-36,-32,-28,-24,-20,-16,-68,-64,-60,-56,-52,-48,-44,-40,-36,-32,-28,-24,-20,-16,-68,-64,-60,-56,-52,-48,-44,-40,-36,-32,-28,-24,-20,-16,-68,-64,-60,-56,-52,-48,-44,-40,-36,-32,-28,-24,-20,-16,-68,-64,-60,-56,-52,-48,-44,-40,-36,-32,-28,-24,-20,-16,-68,-64,-60,-56,-52,-48,-44,-40,-36,-32,-28,-24,-20,-16,-68,-64,-60,-56,-52,-48,-44,-40,-36,-32,-28,-24,-20,-16&timezone=UTC&forecast_days=3&hourly=wind_speed_10m,wind_direction_10m,wind_gusts_10m,pressure_msl,cloud_cover,temperature_2m&wind_speed_unit=kn","marine":"https://marine-api.open-meteo.com/v1/marine?latitude=52,52,52,52,52,52,52,52,52,52,52,52,52,52,48,48,48,48,48,48,48,48,48,48,48,48,48,48,44,44,44,44,44,44,44,44,44,44,44,44,44,44,40,40,40,40,40,40,40,40,40,40,40,40,40,40,36,36,36,36,36,36,36,36,36,36,36,36,36,36,32,32,32,32,32,32,32,32,32,32,32,32,32,32,28,28,28,28,28,28,28,28,28,28,28,28,28,28,24,24,24,24,24,24,24,24,24,24,24,24,24,24,20,20,20,20,20,20,20,20,20,20,20,20,20,20,16,16,16,16,16,16,16,16,16,16,16,16,16,16&longitude=-68,-64,-60,-56,-52,-48,-44,-40,-36,-32,-28,-24,-20,-16,-68,-64,-60,-56,-52,-48,-44,-40,-36,-32,-28,-24,-20,-16,-68,-64,-60,-56,-52,-48,-44,-40,-36,-32,-28,-24,-20,-16,-68,-64,-60,-56,-52,-48,-44,-40,-36,-32,-28,-24,-20,-16,-68,-64,-60,-56,-52,-48,-44,-40,-36,-32,-28,-24,-20,-16,-68,-64,-60,-56,-52,-48,-44,-40,-36,-32,-28,-24,-20,-16,-68,-64,-60,-56,-52,-48,-44,-40,-36,-32,-28,-24,-20,-16,-68,-64,-60,-56,-52,-48,-44,-40,-36,-32,-28,-24,-20,-16,-68,-64,-60,-56,-52,-48,-44,-40,-36,-32,-28,-24,-20,-16,-68,-64,-60,-56,-52,-48,-44,-40,-36,-32,-28,-24,-20,-16&timezone=UTC&forecast_days=3&hourly=wave_height,wave_direction,wave_period,sea_surface_temperature"},"perfRows":["4 heures37,2 mi8,7 nd12,6 nd","24 heures259 mi8,9 nd20,2 nd","48 heures—14,8 nd25,4 nd","Depuis le départ1 284 mi15,0 nd25,4 nd"],"gapRows":["Anne-Claire LE BERRE +19,5 mi 13,0","Erwan LE DRAOULEC −75,0 mi 12,7","Luke BERRY −104,8 mi 14,2","Thibaut VAUCHEL-CAMUS −162,4 mi 16,9","Baptiste HULIN −262,7 mi 17,6"],"officialOk":false,"wxReady":false,"rank":"8 / 10"}

27 OK / 0 FAIL — screenshots in data/diagnostics/visual
```
