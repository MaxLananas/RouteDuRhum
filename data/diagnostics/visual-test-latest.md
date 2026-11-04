# Visual test run 98 — 2026-11-04T22:57:34Z

```
PASS  core chargé
PASS  identifier Laurent — BOURGUES (tracker 11)
PASS  trace Laurent décodée — 353 points
PASS  flotte configurée — 115 bateaux
PASS  classements chargés — 6 classes
PASS  pictogrammes sur la carte — 11 marqueurs
PASS  trace dessinée sur le canvas
PASS  météo modèle chargée
PASS  performances officielles non nulles — ["4 heures48,0 mi11,6 nd20,6 nd","24 heures293 mi10,6 nd21,3 nd","48 heures—13,5 nd22,7 nd","Depuis le départ1 380 mi14,9 nd25,4 nd"]
PASS  écarts flotte sans doublon Laurent — ["Anne-Claire LE BERRE +25,7 mi 14,0","Erwan LE DRAOULEC −116,8 mi 20,2","Luke BERRY −173,3 mi 21,9","Thibaut VAUCHEL-CAMUS −216,4 mi 18,6","Baptiste HULIN −268
PASS  écarts flotte : couleur cohérente avec la position — [{"dd":26,"cls":"behind"},{"dd":-117,"cls":"ahead"},{"dd":-173,"cls":"ahead"},{"dd":-216,"cls":"ahead"},{"dd":-269,"cls":"ahead"}]
PASS  API officielle live
PASS  rang affiché — 8 / 10
PASS  vitesse affichée — 14,3nd
PASS  aucune erreur JS
PASS  conditions à sa position : jamais une valeur vide — {"text":"Vent10,5nd 122° ESE · rafales 14,8Vagues2,1m hauteur significative","dashesOnly":false,"explains":true,"cards":2}
PASS  communiqués de course affichés — {"count":7,"first":"Matthieu PERRAUT · ELVEST RET · Abandon Chavirage le 3 novembre au soir, à 400 milles au n","links":7,"empty":false}
PASS  comparaison avec la flotte — 10 courbes
PASS  graphiques rendus — [{"key":"chartSpeed","points":116,"w":379,"h":176,"visible":true},{"key":"chartRank","points":116,"w":379,"h":132,"visible":true},{"key":"chartDtf","points":116,"w":379,"h":132,"visible":true},{"key":"chartWind","points":116,"w":379,"h":132,"visible":true},{"key":"chartRivals","points":116,"w":379,"h":176,"visible":true},{"key":"chartForecast","points":48,"w":379,"h":176,"visible":false}]
PASS  graphiques : axe de temps réel — {"type":"linear","points":116,"uniform":true,"early":1,"late":7,"tick":"03 nov. 11:00","firstTick":"01 nov. 12:12","lastTick":"04 nov. 23:49","bounds":{"leadH":0.82,"tailH":0.82}}
PASS  particules de vent visibles — 34871 pixels visibles
PASS  lecteur météo au survol — 16.4 nd 253° OSO
PASS  couche nuages : voile dessiné — {"layer":"clouds","painted":16483,"legend":true,"otherLegends":[],"readout":"28 % partiellement couvert","hasValue":true}
PASS  calque météo : couvre toute la carte — {"stage":[1188,938],"css":[1188,938],"backing":[1188,938],"internal":[1188,938],"dpr":1}
PASS  couche nuages : légende et lecteur dédiés — 28 % partiellement couvert
PASS  replay actif — {"active":true,"playing":true,"t":1793516701.992,"timelineOpen":true,"ghost":true}
PASS  replay : direct mis en retrait — {"card":true,"op":"0.28"}
PASS  desktop 1024px : rail entièrement visible — {"iw":1024,"rail":360,"railRight":1024,"barRight":1024,"stage":664,"outside":0,"chipsOn":3,"chipsClipped":[],"markers":11}
PASS  desktop 1024px : aucun élément hors écran — 0 éléments
PASS  desktop 1024px : indicateurs du bandeau lisibles — 3 indicateurs, tronqués: [] | fit {"room":319,"shown":["tRank","tSpeed","tDtf"],"hidden":["tDtl","tPos","tAge"],"need":290}
PASS  desktop 1280px : rail entièrement visible — {"iw":1280,"rail":412,"railRight":1280,"barRight":1280,"stage":868,"outside":0,"chipsOn":5,"chipsClipped":[],"markers":11}
PASS  desktop 1280px : aucun élément hors écran — 0 éléments
PASS  desktop 1280px : indicateurs du bandeau lisibles — 5 indicateurs, tronqués: [] | fit {"room":575,"shown":["tRank","tSpeed","tDtf","tDtl","tAge"],"hidden":["tPos"],"need":543}
PASS  desktop 1440px : rail entièrement visible — {"iw":1440,"rail":412,"railRight":1440,"barRight":1440,"stage":1028,"outside":0,"chipsOn":6,"chipsClipped":[],"markers":11}
PASS  desktop 1440px : aucun élément hors écran — 0 éléments
PASS  desktop 1440px : indicateurs du bandeau lisibles — 6 indicateurs, tronqués: [] | fit {"room":735,"shown":["tRank","tSpeed","tDtf","tDtl","tPos","tAge"],"hidden":[],"need":712}
PASS  desktop 1920px : rail entièrement visible — {"iw":1920,"rail":412,"railRight":1920,"barRight":1920,"stage":1508,"outside":0,"chipsOn":6,"chipsClipped":[],"markers":11}
PASS  desktop 1920px : aucun élément hors écran — 0 éléments
PASS  desktop 1920px : indicateurs du bandeau lisibles — 6 indicateurs, tronqués: [] | fit {"room":1215,"shown":["tRank","tSpeed","tDtf","tDtl","tPos","tAge"],"hidden":[],"need":712}
PASS  mobile : pas de débordement horizontal — 390px / 390px [{"tag":"img","cls":"leaflet-tile leaflet-tile-loaded","right":562,"w":215},{"tag":"img","cls":"leaflet-tile leaflet-tile-loaded","right":562,"w":215},{"tag":"img","cls":"leaflet-tile leaflet-tile-loaded","right":562,"w":215},{"tag":"img","cls":"leaflet-tile leaflet-tile-loaded","right":562,"w":215},{"tag":"svg","cls":"[object SVGAnimatedString]","right":429,"w":468},{"tag":"span","cls":"mono","right":392,"w":52},{"tag":"button","cls":"tab","right":418,"w":71}]
PASS  mobile : marqueurs présents — 4
PASS  mobile : boutons carte ⇄ panneau — {"sheet":true,"carte":true}
PASS  mobile : titre lisible et boutons décrits — {"title":"La French Fab · Route du Rhum 2026","titleClipped":false,"liveLabel":"Revenir au direct","refreshLabel":"Actualiser les données"}
PASS  mobile : onglet Carte visible et cliquable — {"found":true,"shown":true,"inside":true,"box":[311,380,69,390],"clickable":true,"at":"tab tab--map tab--float","label":"Carte ↑"}
PASS  mobile : l’onglet Carte ne recouvre rien — {"tab":[311,380,69,390],"hits":[]}
PASS  mobile : Carte replie le panneau — {"open":false,"pane":"live"}
PASS  photo officielle du skipper — {"src":"https://static.wixstatic.com/media/547c0f_875ec65a36e246a7a69418d05054dadb~mv2.avif","ok":true,"hidden":false}
MOBILE DEBUG {"innerWidth":390,"clientWidth":390,"scrollWidth":390,"bodyScroll":390,"visual":390,"mq900":true,"topbar":{"w":390,"l":0,"r":390},"stage":{"w":390,"l":0,"r":390},"rail":{"w":390,"l":0,"r":390},"main":{"w":390,"l":0,"r":390},"huds":{"w":222,"l":158,"r":380},"tabs":{"w":390,"l":0,"r":390},"tabStyle":"fixed","widest":[{"t":"svg","c":"[object SVGAnimatedString]","w":468},{"t":"div","c":"app","w":390},{"t":"header","c":"topbar","w":390},{"t":"main","c":"main","w":390},{"t":"section","c":"stage","w":390},{"t":"div","c":"leaflet-container leaflet-touc","w":390}]}
PASS  panne de source : message explicite — 
          Les données sont momentanément indisponibles.
          HTTP 503 sur /data/core
PASS  panne de source : aucune fausse position — 0 marqueurs
PASS  API live bloquée : snapshot conservé — {"markers":11,"status":"Direct · pointage officiel il y a 57 min","wxUrls":{"atmo":"https://api.open-meteo.com/v1/forecast?latitude=52,52,52,52,52,52,52,52,52,52,52,52,52,52,48,48,48,48,48,48,48,48,48,48,48,48,48,48,44,44,44,44,44,44,44,44,44,44,44,44,44,44,40,40,40,40,40,40,40,40,40,40,40,40,40,40,36,36,36,36,36,36,36,36,36,36,36,36,36,36,32,32,32,32,32,32,32,32,32,32,32,32,32,32,28,28,28,28,28,28,28,28,28,28,28,28,28,28,24,24,24,24,24,24,24,24,24,24,24,24,24,24,20,20,20,20,20,20,20,20,20,20,20,20,20,20,16,16,16,16,16,16,16,16,16,16,16,16,16,16&longitude=-68,-64,-60,-56,-52,-48,-44,-40,-36,-32,-28,-24,-20,-16,-68,-64,-60,-56,-52,-48,-44,-40,-36,-32,-28,-24,-20,-16,-68,-64,-60,-56,-52,-48,-44,-40,-36,-32,-28,-24,-20,-16,-68,-64,-60,-56,-52,-48,-44,-40,-36,-32,-28,-24,-20,-16,-68,-64,-60,-56,-52,-48,-44,-40,-36,-32,-28,-24,-20,-16,-68,-64,-60,-56,-52,-48,-44,-40,-36,-32,-28,-24,-20,-16,-68,-64,-60,-56,-52,-48,-44,-40,-36,-32,-28,-24,-20,-16,-68,-64,-60,-56,-52,-48,-44,-40,-36,-32,-28,-24,-20,-16,-68,-64,-60,-56,-52,-48,-44,-40,-36,-32,-28,-24,-20,-16,-68,-64,-60,-56,-52,-48,-44,-40,-36,-32,-28,-24,-20,-16&timezone=UTC&forecast_days=3&hourly=wind_speed_10m,wind_direction_10m,wind_gusts_10m,pressure_msl,cloud_cover,temperature_2m&wind_speed_unit=kn","marine":"https://marine-api.open-meteo.com/v1/marine?latitude=52,52,52,52,52,52,52,52,52,52,52,52,52,52,48,48,48,48,48,48,48,48,48,48,48,48,48,48,44,44,44,44,44,44,44,44,44,44,44,44,44,44,40,40,40,40,40,40,40,40,40,40,40,40,40,40,36,36,36,36,36,36,36,36,36,36,36,36,36,36,32,32,32,32,32,32,32,32,32,32,32,32,32,32,28,28,28,28,28,28,28,28,28,28,28,28,28,28,24,24,24,24,24,24,24,24,24,24,24,24,24,24,20,20,20,20,20,20,20,20,20,20,20,20,20,20,16,16,16,16,16,16,16,16,16,16,16,16,16,16&longitude=-68,-64,-60,-56,-52,-48,-44,-40,-36,-32,-28,-24,-20,-16,-68,-64,-60,-56,-52,-48,-44,-40,-36,-32,-28,-24,-20,-16,-68,-64,-60,-56,-52,-48,-44,-40,-36,-32,-28,-24,-20,-16,-68,-64,-60,-56,-52,-48,-44,-40,-36,-32,-28,-24,-20,-16,-68,-64,-60,-56,-52,-48,-44,-40,-36,-32,-28,-24,-20,-16,-68,-64,-60,-56,-52,-48,-44,-40,-36,-32,-28,-24,-20,-16,-68,-64,-60,-56,-52,-48,-44,-40,-36,-32,-28,-24,-20,-16,-68,-64,-60,-56,-52,-48,-44,-40,-36,-32,-28,-24,-20,-16,-68,-64,-60,-56,-52,-48,-44,-40,-36,-32,-28,-24,-20,-16,-68,-64,-60,-56,-52,-48,-44,-40,-36,-32,-28,-24,-20,-16&timezone=UTC&forecast_days=3&hourly=wave_height,wave_direction,wave_period,sea_surface_temperature"},"perfRows":["4 heures48,0 mi11,6 nd20,6 nd","24 heures293 mi10,6 nd21,3 nd","48 heures—13,5 nd22,7 nd","Depuis le départ1 380 mi14,9 nd25,4 nd"],"gapRows":["Anne-Claire LE BERRE +25,7 mi 14,0","Erwan LE DRAOULEC −116,8 mi 20,2","Luke BERRY −173,3 mi 21,9","Thibaut VAUCHEL-CAMUS −216,4 mi 18,6","Baptiste HULIN −268,9 mi 15,4"],"officialOk":false,"wxReady":false,"rank":"8 / 10"}
PASS  instantané figé : la page cesse de dire « direct » — {"status":"Instantané figé — collecte 6 h · dernières données officielles publiées","dotBad":true,"pillStale":true,"markers":11,"toast":"Le collecteur n'a rien publié depuis 6 h. Les positions et la trace affichées sont les dernières réellement publiées, rien n'est extrapolé."}
PASS  sans tuiles : mode schématique annoncé — {"cls":true,"badge":true,"markers":11,"trail":3770}
PASS  sans tuiles : trace et bateaux toujours lisibles — {"cls":true,"badge":true,"markers":11,"trail":3770}

53 OK / 0 FAIL — screenshots in data/diagnostics/visual
```
