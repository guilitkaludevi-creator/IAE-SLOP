# Contexte — Mosaïque Santé (IAE-SLOP)

Compilation des deux dernières conversations Copilot sur l'application, dans l'ordre chronologique (21/11/2026).

## 1. Le projet

| Élément | Valeur |
|---|---|
| Dossier local | `C:\Users\g.kalusevi\Desktop\A_DEPLOYER_SUR_GITHUB_MOSAIQUE` |
| Dépôt GitHub | https://github.com/guilitkaludevi-creator/IAE-SLOP (branche `main`) |
| GitHub Pages | https://guilitkaludevi-creator.github.io/IAE-SLOP/ |
| Firebase Hosting | https://iae-slop-3f7be.web.app (projet `iae-slop-3f7be`) |
| Stack | App statique PWA (`index.html`, `app.js`, `app.css`, `data.js`, `firebase-init.js`, `sw.js`), Firebase Auth + Firestore, Stripe (mode test), Cloudflare Worker (webhook de test) |
| Fichiers clés | `app.js`, `firebase-init.js`, `index.html`, `sw.js`, `README.md`, `firestore.rules`, dossier `functions/` |

Application destinée aux professionnels et étudiants de la santé / direction d'établissements : annuaire alumni, réseau et fil d'actualité, fiches métiers, conventions et questions RH, recrutement, calculateurs ETP, audit qualité, sécurité sociale, droit de la santé, avec un modèle **Freemium / Premium**.

---

## 2. Conversation 1 — Analyse, refonte et mise en ligne

### Demandes successives
1. **Analyse et amélioration globale** de l'app, ajout des fonctionnalités manquantes.
2. **Réseau / notifications / paywall** : tri des expériences, notification fantôme, bouton d'accès au fil depuis l'annuaire, contenu Premium réellement caché, animations plus fluides, différence Freemium/Premium plus nette.
3. **Mise en ligne + paiement** : souscription en ligne, système de paiement gratuit et sécurisé, commentaires sur les posts avec boîte de dialogue (envoi d'un salarié / alternant / autre) et notification à l'auteur, correction de la matrice « Qui paie quoi » (Sécurité sociale), métiers Premium totalement invisibles.
4. **Cache + Stripe** : les mises à jour n'apparaissaient pas après déploiement ; création des produits et Price IDs Stripe ; Réseau et Timeline derrière le paywall.
5. **Page « Métiers de direction »** : ne plus afficher les métiers verrouillés (juste un message), bulle/boîte d'abonnement soignée sur toutes les pages Premium ; refonte responsive de la page Audit ; calculateur RH et Recrutement derrière le paywall ; ordre des onglets (Convention → Questions RH → Recrutement) ; nouvelle page **Droit de la santé**.
6. **Comptes et monétisation** : accès Premium par code, page d'identification/inscription avec validation email, mot de passe modifiable/réinitialisable, flashcards PDF (Premium), publicités ultra-discrètes en Freemium, offres d'abonnement limitées à ce qui existe réellement dans l'app.
7. Demandes finales (bouton connexion/inscription, compactage de la conversation) : interrompues par des erreurs, reprises dans la conversation 2.

### Réalisations
- **Sécurité / données** : alignement Firestore ↔ règles de sécurité, emails retirés des données publiques, validation des liens LinkedIn, suppression des codes maîtres et des déverrouillages factices, schéma des posts corrigé, documentation RGPD synchronisée.
- **Réseau / fil** : tri alphabétique des expériences, bouton « Accéder au fil d'actualité », badge de notification masqué à 0, notifications sur publications, likes, participations, commentaires et délégations.
- **Paywall** : contenu Premium absent du DOM en Freemium (métiers, Réseau, Timeline, Sécurité sociale, carte des interactions, recrutement, calculateurs), bulle Premium qui s'ouvre aussi sur accès direct ou via la recherche globale.
- **Nouvelles pages / refontes** : Droit de la santé (droits des usagers, consentement, maltraitance, sanctions, responsabilités, recours), Audit responsive, matrice « Qui paie quoi » (tableau sticky desktop, cartes mobiles), style glass/liquid.
- **Comptes** : inscription, connexion, email de validation, réinitialisation et changement de mot de passe, zone « Mon compte » via l'avatar.
- **Premium par code** : validation via Firestore, collection `access_codes` (champs `code` ex. `CAMPUS-XXXX-XXXX`, `active: true`, `maxUses`), email vérifié requis.
- **Flashcards PDF** (Premium, charte graphique de l'app) et **publicité discrète** (Freemium uniquement).
- **Stripe (mode test)** : 8 produits / Price IDs créés et reliés aux boutons d'abonnement :

| Formule | Price ID |
|---|---|
| Étudiant | `price_1UeF6jCn4c8lYjEAbkhzKi0k` |
| Mensuel | `price_1UeF7dCn4c8lYjEA651sADRZ` |
| Annuel | `price_1UeF8MCn4c8lYjEAcTVuxqSh` |
| Licence perpétuelle | `price_1UeF8UCn4c8lYjEAskxxen3z` |
| Découverte École | `price_1UeF8cCn4c8lYjEA8b2gJwNi` |
| Partenaire École | `price_1UeF8jCn4c8lYjEAcjfT2W8B` |
| Campus Santé | `price_1UeF8qCn4c8lYjEApANanQe5` |
| Équipe Direction | `price_1UeF8yCn4c8lYjEA0k8WKXAI` |

- **Cache PWA** : versions des scripts + Service Worker invalidés, en-têtes renforcés (GitHub Pages peut mettre un peu de temps à propager le CDN).
- **Déploiement** : Firebase Hosting + règles Firestore, push GitHub (`main`), GitHub CLI installé et autorisé, `node_modules` exclu du dépôt.

### Points bloquants rencontrés
- **Cloud Functions** exigent le forfait Firebase **Blaze** (payant) → la validation des codes Premium a été basculée sur Firestore.
- Le paiement Stripe réel via Cloud Functions n'est pas actif : secrets `STRIPE_SECRET_KEY` et `STRIPE_WEBHOOK_SECRET` à configurer. Commande : `npx --yes firebase-tools@latest functions:secrets:set STRIPE_SECRET_KEY --project iae-slop-3f7be --force` (clé à coller **dans le prompt masqué**). Script d'aide : `functions\setup-stripe-secrets.ps1`.
- ⚠️ **Une clé Stripe test a été collée par erreur dans la ligne de commande/le chat** (utilisée comme nom de secret). Elle doit être **révoquée et régénérée** dans Stripe.

---

## 3. Conversation 2 — Connexion, Google, Stripe/Cloudflare, accès test

### Chronologie
1. **Page de connexion/inscription en premier** à l'ouverture de l'app (réutilise Firebase Auth existant, session conservée).
2. **Bouton « Se déconnecter »** dans le menu → retour à la page de connexion.
3. **Push GitHub** (commit `dcc9e9c`) après vérification. Constat : Firebase Authentication n'était pas initialisé ; il a été activé, puis inscription/connexion/déconnexion testées avec un compte de test supprimé ensuite.
4. **Redéploiement Firebase Hosting**. ⚠️ Des fichiers internes Git ont brièvement été exposés (config d'hébergement) ; ils sont maintenant bloqués → **vérifier qu'aucun secret n'est présent dans l'historique Git**.
5. **Connexion Google** (provider Firebase déjà activé) sur connexion et inscription ; déployée sur Firebase, puis poussée sur GitHub (commit `7b363e9`).
6. **Erreur « domaine non autorisé »** : le domaine GitHub Pages a été ajouté aux domaines autorisés de Firebase Authentication.
7. **Section « Les 6 types d'audits »** : cartes élargies et mieux espacées (4 colonnes sans padding sur grand écran étaient la cause) ; publiée sur GitHub Pages puis Firebase.
8. **Question Stripe sans Firebase Functions** : oui, Firebase pour les comptes + un service tiers (Vercel/Cloudflare) pour Stripe (paiement, abonnements, webhooks mettant à jour le Premium).
9. **Tentative de configuration Vercel/Cloudflare ↔ Stripe** : non réalisée par l'assistant (accès sécurisés non disponibles). Aucune modification faite.
10. **Guide fourni** pour déployer un Worker Cloudflare avec l'exemple officiel `stripe-samples/stripe-node-cloudflare-worker-template` : `npm install`, `npx wrangler login`, `npm run deploy` ; secrets `STRIPE_API_KEY` (`sk_test_…`) et `STRIPE_WEBHOOK_SECRET` (`whsec_…`) ; webhook Stripe sur `https://<worker>.workers.dev/webhook`.
11. **Stripe CLI 1.55.14 installée** (`%LOCALAPPDATA%\Microsoft\WinGet\Links\stripe.exe`, redémarrer VS Code pour l'avoir dans le PATH). `stripe login` à faire soi-même.
12. **Test webhook** : `stripe trigger payment_intent.succeeded` échouait (`payment_method_types` obsolète) → contournement avec `--remove "payment_intent:payment_method_types" --add "payment_intent:return_url=https://example.com"`. Résultat : paiement fictif créé, webhook Cloudflare répond **200**.
13. **Vérification de signature** : test avec fausse signature → 400 attendu, mais le message (`Imported HMAC key length (0)`) montre que `STRIPE_WEBHOOK_SECRET` est vide/absent dans le Worker. À corriger (secret de la **destination webhook** Stripe, pas celui de `stripe listen`). L'utilisateur a mis les secrets mais des erreurs persistent → **à reprendre plus tard**.
14. **Liaison paiement ↔ compte utilisateur** (non implémentée) : vérifier le jeton Firebase dans le Worker, créer la session Stripe Checkout avec l'UID, traiter les webhooks d'abonnement (renouvellement, annulation, doublons), l'app lit les droits. Les contenus Premium étant servis côté navigateur, le masquage n'est pas une vraie protection serveur.
15. **Accès complet pour inspecter l'app** : mode test local activé dans le navigateur de l'utilisateur ; puis ajout d'un code de test public `TEST-MOSAIQUE-COMPLET` (testé localement, utilisable par tout utilisateur connecté avec email vérifié **une fois publié**). ⚠️ Sur GitHub Pages, un code intégré au code source est visible de tous.
16. L'assistant n'a pas pu publier ces dernières modifications ; **l'utilisateur doit pusher lui-même** les fichiers modifiés.

### Fichiers modifiés non encore publiés (dossier du Bureau)
`app.js`, `firebase-init.js`, `index.html`, `sw.js`, `README.md` — dans `C:\Users\g.kalusevi\Desktop\A_DEPLOYER_SUR_GITHUB_MOSAIQUE`.

---

## 4. État actuel

| Sujet | État |
|---|---|
| App en ligne (Firebase + GitHub Pages) | ✅ publiée jusqu'à la page de connexion, Google et mise en page Audit |
| Auth email/mot de passe + Google | ✅ opérationnelle |
| Paywall (contenu Premium absent du DOM) | ✅ côté interface (pas de protection serveur) |
| Premium par code (`access_codes` Firestore) | ✅ |
| Code `TEST-MOSAIQUE-COMPLET` | ⚠️ local uniquement, à publier (public) ou à retirer |
| Stripe produits/prix (test) | ✅ créés et reliés aux boutons |
| Paiement réel → activation Premium | ❌ non implémenté (Worker Cloudflare / Functions Blaze) |
| Webhook Cloudflare | ⚠️ répond 200, signature à corriger |
| Dernières modifs locales | ❌ non poussées sur GitHub / Firebase |

## 5. À faire / points d'attention

1. **Révoquer et régénérer la clé Stripe test** exposée, ne plus jamais la coller dans le chat/commande.
2. Vérifier l'absence de secrets dans l'historique Git (fichiers internes brièvement exposés lors du déploiement Firebase).
3. Corriger `STRIPE_WEBHOOK_SECRET` dans le Worker Cloudflare, retester (fausse signature → 400, événement valide → 200).
4. Implémenter la liaison paiement ↔ compte : Checkout avec UID Firebase, webhooks d'abonnement, droits lus par l'app ; envisager une protection serveur du contenu Premium.
5. Décider du sort de `TEST-MOSAIQUE-COMPLET` avant publication publique.
6. Pusher les 5 fichiers modifiés puis redéployer Firebase Hosting.
7. Vérifier le cache PWA/CDN GitHub Pages après chaque publication.
