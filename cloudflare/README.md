# ⚡ Passerelle Cloudflare Worker : Stripe ↔ Firebase Firestore (Mosaïque Santé)

Cette passerelle serverless permet d'encaisser les abonnements Stripe et de débloquer automatiquement le compte Premium dans **Firebase Firestore sans avoir besoin de souscrire au plan payant Blaze de Firebase**.

---

## 🎯 Architecture

```
[ Application Web / PWA ]
          │
          │ 1. startPremiumCheckout(priceId)
          ▼
[ Cloudflare Worker ] ─── 2. Crée Checkout Session ───▶ [ Stripe Checkout ]
          │                                                    │
          │                                         3. Paiement validé
          │                                                    ▼
          ◀──────────── 4. Webhook Stripe ─────────────────────┘
          │
          │ 5. PATCH Firestore /users/{uid} (premium: true)
          ▼
[ Firebase Firestore ] ─── 6. onSnapshot / Écoute en direct ───▶ [ Déblocage VIP ]
```

---

## 🚀 Déploiement en 3 étapes

### Étape 1 : Connexion à Cloudflare
Dans le terminal à la racine ou dans le dossier `cloudflare/` :
```bash
npx wrangler login
```

### Étape 2 : Configuration des secrets
Exécutez les deux commandes suivantes et collez les valeurs lorsqu'elles sont demandées :
```bash
npx wrangler secret put STRIPE_SECRET_KEY
# Collez votre clé secrète Stripe (ex: sk_test_... ou sk_live_...)

npx wrangler secret put STRIPE_WEBHOOK_SECRET
# Collez votre secret de signature webhook (ex: whsec_...)
```

### Étape 3 : Déploiement
```bash
cd cloudflare
npx wrangler deploy
```

Vous obtiendrez votre URL publique du Worker :
`https://mosaique-sante-stripe.<votre-compte>.workers.dev`

---

## 🔗 Configuration dans Stripe Dashboard

1. Rendez-vous sur votre [Dashboard Stripe > Développeurs > Webhooks](https://dashboard.stripe.com/test/webhooks).
2. Cliquez sur **Ajouter un point de terminaison**.
3. **URL du point de terminaison** : `https://mosaique-sante-stripe.<votre-compte>.workers.dev/webhook`
4. **Événements à écouter** :
   - `checkout.session.completed`
   - `customer.subscription.deleted`
5. Récupérez le **Secret de signature** (`whsec_...`) et ajoutez-le avec `npx wrangler secret put STRIPE_WEBHOOK_SECRET`.

---

## 🧪 Test local avec la Stripe CLI

```bash
stripe listen --forward-to https://mosaique-sante-stripe.<votre-compte>.workers.dev/webhook
stripe trigger checkout.session.completed
```
