const { onRequest } = require("firebase-functions/v2/https");
const { defineSecret } = require("firebase-functions/params");
const { logger } = require("firebase-functions");
const admin = require("firebase-admin");
const crypto = require("crypto");

admin.initializeApp();

const stripeSecret = defineSecret("STRIPE_SECRET_KEY");
const stripeWebhookSecret = defineSecret("STRIPE_WEBHOOK_SECRET");
const allowedOrigin = "https://guilitkaludevi-creator.github.io";

function corsHeaders(origin) {
  return {
    "Access-Control-Allow-Origin": origin === allowedOrigin ? allowedOrigin : "null",
    "Access-Control-Allow-Headers": "Authorization,Content-Type",
    "Access-Control-Allow-Methods": "POST,OPTIONS"
  };
}

exports.createCheckoutSession = onRequest({ cors: false, secrets: [stripeSecret] }, async (req, res) => {
  const headers = corsHeaders(req.headers.origin);
  res.set(headers);
  if (req.method === "OPTIONS") return res.status(204).send("");
  if (req.method !== "POST") return res.status(405).json({ error: "Méthode non autorisée" });

  const stripe = require("stripe")(stripeSecret.value());
  const authHeader = req.headers.authorization || "";
  if (!authHeader.startsWith("Bearer ")) return res.status(401).json({ error: "Authentification requise" });

  let decoded;
  try {
    decoded = await admin.auth().verifyIdToken(authHeader.slice(7));
  } catch (error) {
    return res.status(401).json({ error: "Session Firebase invalide" });
  }

  const priceId = typeof req.body?.priceId === "string" ? req.body.priceId.trim() : "";
  if (!priceId) return res.status(400).json({ error: "Price ID Stripe manquant" });

  const successUrl = `${allowedOrigin}/IAE-SLOP/?checkout=success&session_id={CHECKOUT_SESSION_ID}`;
  const cancelUrl = `${allowedOrigin}/IAE-SLOP/?checkout=cancel`;

  try {
    const customerSearch = await stripe.customers.search({
      query: `metadata["firebase_uid"]:"${decoded.uid}"`
    });
    let customerId = customerSearch.data[0]?.id;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: decoded.email,
        metadata: { firebase_uid: decoded.uid }
      });
      customerId = customer.id;
    }

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: successUrl,
      cancel_url: cancelUrl,
      allow_promotion_codes: true,
      metadata: { firebase_uid: decoded.uid },
      subscription_data: { metadata: { firebase_uid: decoded.uid } }
    });
    return res.status(200).json({ url: session.url });
  } catch (error) {
    logger.error("Erreur création Checkout", error);
    return res.status(500).json({ error: "Impossible d'ouvrir Stripe Checkout" });
  }
});

exports.stripeWebhook = onRequest({ secrets: [stripeSecret, stripeWebhookSecret] }, async (req, res) => {
  const stripe = require("stripe")(stripeSecret.value());
  const signature = req.headers["stripe-signature"];
  let event;
  try {
    event = stripe.webhooks.constructEvent(
      req.rawBody,
      signature,
      stripeWebhookSecret.value()
    );
  } catch (error) {
    logger.warn("Webhook Stripe invalide", error.message);
    return res.status(400).send("Signature invalide");
  }

  try {
    if (["checkout.session.completed", "invoice.paid", "customer.subscription.updated", "customer.subscription.deleted"].includes(event.type)) {
      const object = event.data.object;
      const subscription = event.type === "checkout.session.completed"
        ? await stripe.subscriptions.retrieve(object.subscription)
        : object;
      const uid = subscription.metadata?.firebase_uid ||
        object.metadata?.firebase_uid ||
        object.customer;
      let firebaseUid = subscription.metadata?.firebase_uid || object.metadata?.firebase_uid;

      if (!firebaseUid && object.customer) {
        const customer = await stripe.customers.retrieve(object.customer);
        firebaseUid = customer.metadata?.firebase_uid;
      }
      if (!firebaseUid) return res.status(200).send("Aucun UID associé");

      const active = ["active", "trialing"].includes(subscription.status);
      await admin.auth().setCustomUserClaims(firebaseUid, {
        premium: active,
        premiumUntil: active ? (subscription.current_period_end ? subscription.current_period_end * 1000 : null) : null,
        plan: active ? "premium" : "freemium"
      });

      await admin.firestore().collection("subscriptions").doc(firebaseUid).set({
        status: subscription.status,
        customerId: typeof object.customer === "string" ? object.customer : null,
        subscriptionId: subscription.id,
        priceId: subscription.items?.data?.[0]?.price?.id || null,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      }, { merge: true });
    }
    return res.status(200).send("OK");
  } catch (error) {
    logger.error("Erreur webhook", error);
    return res.status(500).send("Erreur interne");
  }
});
