# Déploiement Cloudflare Pages

## 1. Prérequis

- Un compte Cloudflare (gratuit suffit).
- Le dépôt GitHub `MaxLananas/RouteDuRhum` (public ou privé).
- Rien à compiler : le site est statique, `public/` est servi tel quel.

## 2. Créer le projet Pages

### Option A — via le tableau de bord (recommandé)

1. Cloudflare → **Workers & Pages** → **Create** → **Pages** → **Connect to Git**.
2. Sélectionner le dépôt, branche `main`.
3. Réglages de build :
   - **Framework preset** : *None*
   - **Build command** : *(vide)*
   - **Build output directory** : `public`
   - **Root directory** : *(vide)*
4. **Save and Deploy**.

Les Pages Functions de `functions/` sont détectées et déployées automatiquement.
`public/_headers` et `public/_redirects` sont également pris en compte.

### Option B — via Wrangler

```bash
npx wrangler login
npx wrangler pages deploy public --project-name la-french-fab
```

`wrangler.toml` déclare déjà `pages_build_output_dir = "public"`.

## 3. Mise à jour des données sans redéploiement

Le workflow `.github/workflows/collect.yml` est prévu pour tourner **toutes les
5 minutes** (voir l'avertissement plus bas : il ne le fait qu'une fois sur `main`) :

1. télécharge et décode les fichiers officiels ;
2. écrit `data/` (snapshot brut) et `public/data/` (payload navigateur) ;
3. commit et push sur la branche de travail.

**Cloudflare Pages redéploie automatiquement à chaque push** : il n'y a donc aucune
action manuelle, et le site n'a pas besoin d'être reconstruit par un build. Le temps de
propagation est celui d'un déploiement Pages (quelques secondes à une minute).

> Après fusion de la pull request : mettre `DATA_BRANCH: main` dans l'en-tête
> `env:` de `.github/workflows/collect.yml` (ligne déjà prévue, il suffit de changer la
> valeur). Sans cela, le collecteur continuerait d'écrire sur la branche de
> développement.

### Vérifier que le cron tourne — et le piège vérifié en conditions réelles

- GitHub → onglet **Actions** → *Collect Route du Rhum data* → filtrer `schedule`.

**Constat du 4 novembre 2026 (à lire avant de mettre en ligne) :** sur les 129 runs du
dépôt, **aucun** n'avait été déclenché par `schedule` ; tous provenaient de `push` ou
de `workflow_dispatch`. Cause : **GitHub n'exécute les crons que depuis la branche par
défaut**, et `main` ne contient à ce stade que le `README.md` initial. Le collecteur
n'a donc jamais tourné tout seul ; les données n'avançaient que parce qu'un `push`
déclenchait le workflow.

Conséquences pratiques :

1. Il faut que `main` contienne le workflow (`collect.yml`) pour que le cron démarre.
   C'est le cas dès que la pull request est fusionnée.
2. Vérifier ensuite avec `gh run list --workflow=collect.yml --event=schedule`.
3. Le site **détecte** ce cas : si la dernière collecte date de plus de 40 minutes, le
   bandeau passe en « Instantané figé — collecte il y a X » (pastille ambre, infobulle
   explicite) et un message précise que rien n'est extrapolé. C'est testé
   (`instantané figé`, 6 h simulées).

> Autres limites du cron GitHub, à connaître : granularité **5 minutes** minimum, démarrages
> parfois retardés de 5 à 15 min aux heures de pointe, et **désactivation automatique
> après 60 jours** sans activité sur le dépôt (ici les commits du collecteur l'évitent).

### Deux pannes réelles trouvées le 4 novembre 2026 (corrigées)

1. **Le collecteur ne publiait rien de neuf.** `collect.yml` committait `data/`
   (snapshots bruts) mais ne lançait **pas** `tools/build-app-data.mjs`, donc
   `public/data/` — ce que Cloudflare Pages sert réellement — n'était jamais
   régénéré. Chaque run affichait « success » alors que le site restait sur le
   build manuel précédent, vieux de 7 h 30. Le workflow construit désormais le
   payload et **échoue** si `lastRun` a plus de 30 minutes.

2. **Un classement frais était jeté au profit de l'ancien.** Dans
   `build-app-data.mjs`, le garde-fou « garder le classement précédent si le
   collecteur n'en a pas » testait si le build **précédent** avait un classement —
   toujours vrai. Résultat : l'API officielle répondait bien à 22:00, mais le
   payload conservait le classement de 14:00 (DTF 2 094,9 au lieu de 1 947,8).
   La condition exige maintenant que le build courant n'ait réellement aucune
   ligne de classement.

Leçon retenue pour la suite : « le job est vert » ne veut pas dire « le site est à
jour ». La vérification utile est cette commande, à lancer avant de se fier au site :

```bash
python3 -c "import json;c=json.load(open('public/data/core.json'));print(c['freshness'])"
```

Elle doit afficher un `lastRun` de quelques minutes et un `officialStandings` de
moins d'une heure en course.

### Quotas à connaître

- GitHub Actions : cron minimum **5 minutes** ; 2 000 min/mois gratuites sur un dépôt
  privé, illimité sur un dépôt public (le job dure ~40 s).
- Cloudflare Pages : 500 déploiements/mois sur le plan gratuit. **C'est la vraie
  limite** : 288 commits/jour dépassent le quota. Trois solutions :

| Solution | Effet | Quand la choisir |
| --- | --- | --- |
| Réduire le cron à `*/15` ou `*/30` | 96 à 48 déploiements/jour ≈ 1 440–2 880/mois… encore trop | jamais seul |
| **Déployer sur une branche dédiée + cron `*/30`** | ~1 440/mois | insuffisant |
| **Servir les données depuis un Worker + KV** (voir §5) | 1 déploiement par changement de code seulement | recommandé si le quota devient bloquant |

En pratique : un premier déploiement gratuit fonctionne plusieurs jours, puis Pages
demande de passer au plan payant (5 $/mois, 5 000 déploiements). Le site lui-même
reste gratuit. La §5 décrit l'alternative sans limite.

## 4. Domaine personnalisé

Pages → projet → **Custom domains** → ajouter `suivi.exemple.fr`, puis créer
l'enregistrement CNAME indiqué. Le certificat est automatique.

## 5. Variante sans limite de déploiements : Worker + KV

Si l'on ne veut pas dépendre du quota de déploiements :

1. Créer un namespace KV :
   `npx wrangler kv namespace create RDR_DATA`
2. Donner au workflow GitHub Actions un token Cloudflare restreint (permission
   *Workers KV Storage: Edit*) dans les secrets du dépôt.
3. À la place du commit, le collecteur envoie les JSON :
   ```bash
   npx wrangler kv key put --namespace-id=<ID> "core.json" --path public/data/core.json
   ```
4. Ajouter un Worker (ou une Function) qui sert `/data/:file` depuis KV avec
   `Cache-Control: public, max-age=60`.
5. Le cron GitHub peut alors descendre à 5 minutes sans aucun redéploiement Pages.

Le site n'a **aucune modification à subir** : il appelle `/data/core.json`, que ce
soit un fichier statique ou une route du Worker.

## 6. Cache et invalidation

| Ressource | Cache |
| --- | --- |
| `/` et `/index.html` | `max-age=0, must-revalidate` → une nouvelle version est vue immédiatement |
| `/data/*.json` | `max-age=60, s-maxage=60, stale-while-revalidate=600` |
| `/assets/*`, `/vendor/*` | 7 jours |
| `/api/classement` | 60 s au edge, `stale-while-revalidate=300` |

Le client ajoute `?v=<timestamp>` sur chaque fichier de données : aucun cache
intermédiaire ne peut servir un état périmé.

## 7. Exploitation

- **Logs de collecte** : `data/diagnostics/collect-latest.md` (versionné).
- **Rapport de tests visuels** : `data/diagnostics/visual-test-latest.md` et les
  captures dans `data/diagnostics/visual/`.
- **État des sources en direct** : onglet *Sources* du site (dernier succès, dernière
  erreur, canal utilisé pour le classement).
- **En cas de changement de format du tracker** : le décodage échoue proprement, le
  snapshot précédent reste servi, l'erreur apparaît dans `meta.sources` et dans
  l'onglet Sources. La sonde `tools/probe.mjs` permet de revalider le format :

  ```bash
  node tools/probe.mjs        # dans un environnement avec accès réseau ouvert
  ```
