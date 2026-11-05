# Tests — ce qui est vérifié, comment, et ce qui ne l'est pas

## Comment les tests tournent

Le sandbox de développement n'a accès qu'à GitHub et aux registres npm/PyPI : les
domaines de la course, les tuiles Esri et Open-Meteo y sont bloqués. Trois
environnements ont donc été utilisés, chacun pour ce qu'il peut faire :

| Environnement | Ce qu'il valide |
| --- | --- |
| GitHub Actions (`collect.yml`, `probe-sources.yml`) | accès réseau réel aux sources, décodage des `.hwx`, formats, CORS, tuiles, Open-Meteo |
| GitHub Actions (`visual-test.yml`) | rendu et comportements dans un vrai Chrome (headless), captures d'écran |
| Local (sandbox) | syntaxe, build des données hors ligne, serveur de dev, proxy Pages |

## Tests automatisés (53 vérifications, `scripts/visual-test.mjs`)

Le script contient **44 assertions**, dont cinq exécutées dans une boucle sur quatre
largeurs d'écran (1024, 1280, 1440, 1920 px) et une sur chaque onglet : d'où
**53 vérifications** au total dans le rapport. Lancé à chaque modification de
`public/`, de `scripts/visual-test.mjs` ou de `tools/build-app-data.mjs`, il produit
`data/diagnostics/visual-test-latest.md` + les captures PNG.

| # | Test | Ce qu'il prouve |
| --- | --- | --- |
| 1 | core chargé | `core.json` valide et parsé |
| 2 | identification de Laurent | on trouve bien Laurent Bourguès (et pas « Bourgnon », ni un homonyme) |
| 3 | trace décodée | > 100 points décodés depuis le delta-encoding |
| 4 | flotte | 115 bateaux présents |
| 5 | classements | 6 classes |
| 6 | pictogrammes | marqueurs réellement posés sur la carte |
| 7 | trace peinte | le canvas de trace contient des pixels non transparents |
| 8 | météo modèle | la grille Open-Meteo est chargée |
| 9 | performances officielles | colonnes 4 h / 24 h / course non nulles (couvre un bug d'ordre des pointages) |
| 10 | écarts flotte | Laurent n'apparaît pas dans sa propre liste de concurrents |
| 11 | API officielle | l'appel navigateur au classement fonctionne (direct ou proxy) |
| 12-13 | rang / vitesse | valeurs affichées |
| 14 | aucune erreur JS | pas d'exception pendant le chargement ni les interactions |
| 15 | **communiqués de course** | les abandons officiels s'affichent avec le texte de la direction de course et le lien vers l'article |
| 16 | comparaison flotte | 10 courbes (Laurent + 9 concurrents) |
| 17 | graphiques rendus | au moins 4 graphiques avec des données |
| 18 | **axe de temps réel** | abscisses linéaires : 1 h occupe la même largeur partout (la cadence 5 min → 60 min n'est plus déformée), et l'axe ne déborde ni avant le départ ni après le dernier pointage |
| 19 | particules de vent | canvas météo > 20 000 pixels visibles |
| 20 | lecteur météo | le survol d'une couche affiche valeur + direction |
| 21-23 | **couche nuages** | voile réellement peint, légende dédiée, lecteur en %, et **calque couvrant toute la carte** (taille interne du canvas = scène : couvre un vrai bug où la couche s'arrêtait à mi-carte) |
| 24 | replay | lecture active, curseur ouvert, bateau fantôme présent |
| 25 | **replay : direct en retrait** | les marqueurs du direct passent à `opacity ≤ 0.5` et la carte est marquée `is-replay` |
| 26-28 | **desktop 1024 / 1280 / 1440 / 1920 px** | trois contrôles par largeur : le rail tient entièrement dans la fenêtre, aucun élément ne dépasse, les indicateurs du bandeau sont soit complets soit masqués (jamais tronqués, jamais sous les boutons) |
| 29 | mobile sans débordement | `scrollWidth == viewport` (couvre un vrai bug : 463 px au lieu de 390 px) |
| 30 | mobile marqueurs | la carte mobile affiche des bateaux |
| 31-35 | **mobile : carte ⇄ panneau** | le bouton du panneau est réellement rendu, le titre tient sur deux lignes, les boutons icônes ont un libellé accessible, l'action « Carte ↑ » est visible, cliquable, ne recouvre rien et **replie effectivement le panneau** |
| 36 | photo du skipper | photo officielle (CDN du site de la course) chargée et visible |
| 37-38 | panne totale de source | message explicite, **zéro marqueur** (aucune fausse position) |
| 39 | API live bloquée | le snapshot reste affiché, le rang reste correct |
| 40 | **instantané figé** | avec un `lastRun` vieux de 6 h et une API de classement toujours joignable, la page cesse de dire « direct » : bandeau « Instantané figé », pastille ambre, point rouge, message explicite. Reproduction exacte de la panne de collecte observée le 4 novembre |
| 41 | **écarts flotte : couleur cohérente** | un rival devant Laurent s'affiche en rouge, un rival derrière en vert (couvre une inversion de signe trouvée en relecture) |
| 42 | **conditions à sa position** | les deux cartes du panneau Direct viennent du modèle réel — jamais un tiret qui ressemble à une mesure ; si le modèle manque, la raison est écrite |
| 43-44 | **sans tuiles** | après 6 échecs de tuiles sans succès, le mode schématique est annoncé et la trace + les bateaux restent lisibles |

## Serveur de dev / aperçu — 16 vérifications (`scripts/serve-test.mjs`)

`tools/serve.mjs` sert l'aperçu et émule Cloudflare Pages. Il avait un défaut qui a
fait tomber l'aperçu de façon répétée : `decodeURIComponent(url.pathname)` lève une
`URIError` sur une séquence d'échappement invalide (`/%E0%A4%A`, `/%zz`…). Dans un
gestionnaire `async`, cela devient un *unhandled rejection*, et Node 22 tue le
processus. Le journal restait vide et l'aperçu disparaissait — le conteneur ne
redémarrait que pour retomber au mauvais URL suivant.

Le correctif : décodage protégé (réponse **400**), gestionnaire enveloppé pour
qu'aucune exception ne quitte la requête, et filets `unhandledRejection` /
`uncaughtException` en dernier recours.

| # | Test | Ce qu'il prouve |
| --- | --- | --- |
| 1-2 | démarrage, PID lisible | le serveur démarre sur un port libre et est identifiable |
| 3-6 | routes normales | `/`, `/data/core.json`, JS et CSS répondent 200 |
| 7-11 | URL malformées (`/%E0%A4%A`, `/%zz`, `/%C0%AF`, `/%ED%A0%80`, `/%`) | réponse propre **400**, jamais une exception |
| 12-13 | processus vivant, même `starttime` | **aucun redémarrage** : c'est la preuve que rien n'a tué le serveur |
| 14 | service toujours opérationnel | une requête normale passe après les requêtes hostiles |
| 15 | traversée de chemin | `/../../etc/passwd` renvoie l'application, jamais un fichier système |
| 16 | sortie d'erreur silencieuse | aucune exception non gérée |

Vérifié dans les deux sens : **OK** sur le serveur corrigé, **9 FAIL** sur l'ancien
version (qui meurt dès la première URL malformée). Le test est exécuté par
`visual-test.yml` avant les tests navigateur, et disponible via `npm run test:serve`.

### Tests manuels complémentaires (visuels)

Les captures de `data/diagnostics/visual/` couvrent : carte par défaut, onglets
Direct / Flotte / Analyses / Météo / Bateau / Sources, couche vent (avec lecteur),
couche vagues, pression + barbules + isobares, **couverture nuageuse**, replay +
curseur, fond nuit, focus sur un concurrent, mise en page 1280 px, panne de source,
sans tuiles, mobile (carte, panneau ouvert, analyses, météo).

## Cas de panne testés

| Scenario simulé | Méthode | Résultat attendu |
| --- | --- | --- |
| `core.json` en 503 | interception réseau + réponse 503 | écran d'erreur honnête, aucun bateau affiché |
| API classement bloquée | requête annulée | bascule proxy puis snapshot, mention dans Sources |
| Open-Meteo bloqué | requêtes annulées | couches météo désactivées avec message, reste du site intact |
| Pointage ancien | seuil > 2 h 30 | statut « dernière image », toast, aucune extrapolation |
| Format `.hwx` inattendu | contrôle de taille/JSON dans le décodeur | source marquée en échec, snapshot conservé |

## Ce qui n'a pas pu être testé ici

- **Safari / Firefox réels** : les tests headless utilisent Chrome. Le CSS n'emploie
  que des propriétés standard ; `backdrop-filter` et les canvas sont supportés partout,
  mais un contrôle visuel sur Safari reste à faire.
- **Appareil physique iOS/Android** : la mise en page mobile est validée par émulation
  (390 × 844, `isMobile`, `hasTouch`), pas sur appareil.
- **Trafic réel Cloudflare** : les Functions ont été exécutées dans un serveur Node
  local (résultat honnête 502 quand le réseau est bloqué) mais pas sur l'edge
  Cloudflare, faute de compte dans cet environnement.
- **Course terminée** : le comportement à l'arrivée (statut `ARR`, classement final)
  est prévu par le code (le champ `statut` est affiché tel quel) mais n'a pas pu être
  observé en conditions réelles.
- **Changement de format en cours de course** : non observé depuis le départ ; le
  mécanisme de détection est en place, mais il n'a pas encore été exercé par un vrai
  changement.
