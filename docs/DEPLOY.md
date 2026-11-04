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

Le workflow `.github/workflows/collect.yml` tourne **toutes les 5 minutes** :

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

### Vérifier que le cron tourne

- GitHub → onglet **Actions** → *Collect Route du Rhum data*.
- Attention : GitHub désactive les crons d'un dépôt **sans activité depuis 60 jours**.
  Le collecteur commitant toutes les 5 minutes, ce n'est pas un risque en course.

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
