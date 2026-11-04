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

## Tests automatisés (24 vérifications, `scripts/visual-test.mjs`)

Lancés à chaque modification de `public/` et de `tools/build-app-data.mjs`, ils
produisent `data/diagnostics/visual/report.md` + captures PNG.

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
| 11 | API officielle | l'appel navigateur au classement fonctionne |
| 12-13 | rang / vitesse | les valeurs sont affichées |
| 14 | aucune erreur JS | pas d'exception pendant le chargement et les interactions |
| 15 | graphiques | 5 graphiques rendus avec des données |
| 16 | particules de vent | le canvas météo contient > 20 000 pixels visibles |
| 17 | lecteur météo | le survol d'une couche affiche valeur + direction |
| 18 | replay | lecture active, curseur ouvert, bateau fantôme présent |
| 19 | comparaison flotte | 10 courbes (Laurent + 9 concurrents) |
| 20 | mobile sans débordement | `scrollWidth == viewport` (couvre un vrai bug : 463 px au lieu de 390 px) |
| 21 | mobile marqueurs | la carte mobile affiche des bateaux |
| 22 | panne totale de source | message explicite, **zéro marqueur** (aucune fausse position) |
| 23 | API live bloquée | le snapshot reste affiché, le rang reste correct |
| 24 | météo indisponible | gérée sans casser la page |

### Tests manuels complémentaires (visuels)

Les captures de `data/diagnostics/visual/` couvrent : carte par défaut, onglets
Direct / Flotte / Analyses / Météo / Bateau / Sources, couche vent (avec lecteur),
couche vagues, pression + barbules + isobares, replay + curseur, fond nuit, focus sur
un concurrent, panne de source, mobile (carte, panneau ouvert, analyses, météo).

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
