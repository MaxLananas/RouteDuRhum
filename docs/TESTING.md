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

## Tests automatisés (44 vérifications, `scripts/visual-test.mjs`)

Lancés à chaque modification de `public/` et de `tools/build-app-data.mjs`, ils
produisent `data/diagnostics/visual/report.md` + captures PNG. Les tests de largeur
tournent en boucle sur quatre tailles d'écran, d'où le nombre total plus élevé que
le nombre de lignes ci-dessous.

| # | Test | Ce qu'il prouve |
| --- | --- | --- |
| 1 | core chargé | `core.json` valide et parsé |
| 2 | identification de Laurent | on trouve bien Laurent Bourguès (et pas un homonyme : le bug « Bourgnon » est couvert) |
| 3 | trace décodée | > 100 points décodés depuis le delta-encoding |
| 4 | flotte | 115 bateaux présents dans la config |
| 5 | classements | 6 classes |
| 6 | pictogrammes | marqueurs réellement posés sur la carte |
| 7 | trace peinte | le canvas de trace contient des pixels non transparents |
| 8 | météo modèle | la grille Open-Meteo est chargée (paires lat/lon valides) |
| 9 | performances officielles | les colonnes 4 h / 24 h / course ne sont pas nulles (couvre le bug d'ordre des pointages) |
| 10 | écarts flotte | Laurent n'apparaît pas dans sa propre liste de concurrents |
| 11 | API officielle | l'appel navigateur au classement fonctionne (direct ou via le proxy `/api/classement`) |
| 12-13 | rang / vitesse | les valeurs sont affichées |
| 14 | aucune erreur JS | pas d'exception pendant le chargement et les interactions |
| 15 | graphiques | 5 graphiques rendus avec des données |
| 16 | particules de vent | le canvas météo contient > 20 000 pixels visibles |
| 17 | lecteur météo | le survol d'une couche affiche valeur + direction |
| 18 | **couche nuages** | le voile de couverture nuageuse est réellement peint (pixels non transparents) |
| 19 | **calque météo plein cadre** | la taille interne du canvas = celle de la scène (couvre un vrai bug : calque limité à une partie de la carte) |
| 20 | **légende et lecteur nuages** | la bonne légende est affichée, les autres masquées, le lecteur donne un pourcentage |
| 21 | replay | lecture active, curseur ouvert, bateau fantôme présent |
| 22 | **replay : direct en retrait** | en replay, les marqueurs du direct passent à `opacity ≤ 0.5` et la carte live est marquée `is-replay` |
| 23-25 | **desktop 1024 / 1280 / 1440 / 1920 px** | trois contrôles par largeur : le rail tient entièrement dans la fenêtre, aucun élément du panneau ou du bandeau ne dépasse, les indicateurs du bandeau sont soit complets soit masqués (jamais tronqués) |
| 26 | mobile sans débordement | `scrollWidth == viewport` (couvre un vrai bug : 463 px au lieu de 390 px) |
| 27 | mobile marqueurs | la carte mobile affiche des bateaux |
| 28 | **bouton mobile** | le bouton d'ouverture du panneau et l'onglet Carte existent et sont visibles |
| 29 | **photo du skipper** | la photo officielle (CDN du site de la course) est chargée et visible |
| 30-31 | panne totale de source | message explicite, **zéro marqueur** (aucune fausse position) |
| 32 | API live bloquée | le snapshot reste affiché, le rang reste correct |
| 33 | météo indisponible | gérée sans casser la page |
| 34-35 | **sans tuiles** | après 6 échecs de tuiles sans succès, le mode schématique est annoncé et la trace + les bateaux restent lisibles |

Les tests 18 à 25 et 28 à 29, 34 à 35 sont ceux ajoutés après la première version
du site ; le test 19 a été écrit parce que la couche météo ne couvrait qu'une partie
de la carte — un défaut invisible dans les captures précédentes, où le calque
s'arrêtait pile sur une côte.

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
