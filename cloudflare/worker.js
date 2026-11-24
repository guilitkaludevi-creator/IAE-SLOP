/**
 * Cloudflare Worker : Passerelle Stripe ↔ Firebase Firestore pour Mosaïque Santé
 * 
 * Permet de gérer la création de sessions Stripe Checkout et la réception des webhooks
 * Stripe pour débloquer automatiquement l'accès Premium dans Firebase Firestore,
 * SANS avoir besoin du plan payant Firebase Blaze (Cloud Functions).
 * 
 * Variables secrètes à configurer via `wrangler secret put <NOM>` :
 * - STRIPE_SECRET_KEY : Clé secrète Stripe (sk_live_... ou sk_test_...)
 * - STRIPE_WEBHOOK_SECRET : Secret de signature du webhook (whsec_...)
 * - FIREBASE_PROJECT_ID : Identifiant de votre projet Firebase (ex: iae-slop-3f7be)
 * - FIREBASE_CLIENT_EMAIL : Email du compte de service Firebase (optionnel si rules ouvertes en write authenticated)
 * - FIREBASE_PRIVATE_KEY : Clé privée RSA du compte de service (optionnel)
 */

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const origin = request.headers.get("Origin") || "*";

    // En-têtes CORS pour autoriser l'application Web PWA Mosaïque Santé
    const corsHeaders = {
      "Access-Control-Allow-Origin": origin,
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Access-Control-Max-Age": "86400"
    };

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    try {
      // 1. ROUTE : CRÉATION D'UNE SESSION DE PAIEMENT STRIPE CHECKOUT
      if (url.pathname === "/create-checkout-session" && request.method === "POST") {
        return await handleCreateCheckoutSession(request, env, corsHeaders);
      }

      // 2. ROUTE : WEBHOOK STRIPE (CONFIRMATION DU PAIEMENT & ABONNEMENT)
      if ((url.pathname === "/webhook" || url.pathname === "/") && request.method === "POST") {
        return await handleStripeWebhook(request, env, corsHeaders);
      }

      // 3. ROUTE DE SANTÉ / DIAGNOSTIC
      if (request.method === "GET") {
        return new Response(JSON.stringify({
          status: "online",
          service: "Mosaique Sante Stripe-Firebase Bridge",
          version: "2.1.0",
          timestamp: new Date().toISOString()
        }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }

      return new Response("Not Found", { status: 404, headers: corsHeaders });
    } catch (err) {
      console.error("[Worker Error]", err);
      return new Response(JSON.stringify({ error: err.message || "Erreur interne du serveur" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }
  }
};

/**
 * Gestionnaire pour /create-checkout-session
 */
async function handleCreateCheckoutSession(request, env, corsHeaders) {
  if (!env.STRIPE_SECRET_KEY) {
    return new Response(JSON.stringify({ error: "La clé secrète STRIPE_SECRET_KEY n'est pas configurée dans Cloudflare." }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }

  const body = await request.json();
  const { priceId, uid, email, returnUrl } = body;

  if (!priceId || !uid) {
    return new Response(JSON.stringify({ error: "priceId et uid sont obligatoires." }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }

  const baseReturn = returnUrl || "https://iae-slop-3f7be.web.app";
  const successUrl = `${baseReturn}#abonnement?session_id={CHECKOUT_SESSION_ID}&checkout=success`;
  const cancelUrl = `${baseReturn}#abonnement?checkout=canceled`;

  // Préparation des paramètres Stripe Form URL Encoded
  const params = new URLSearchParams();
  params.append("mode", "subscription");
  params.append("line_items[0][price]", priceId);
  params.append("line_items[0][quantity]", "1");
  params.append("client_reference_id", uid);
  params.append("metadata[firebaseUID]", uid);
  params.append("metadata[appName]", "MosaiqueSante");
  if (email) {
    params.append("customer_email", email);
  }
  params.append("success_url", successUrl);
  params.append("cancel_url", cancelUrl);

  const stripeRes = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${env.STRIPE_SECRET_KEY}`,
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: params.toString()
  });

  const session = await stripeRes.json();
  if (!stripeRes.ok) {
    console.error("[Stripe Session Error]", session);
    return new Response(JSON.stringify({ error: session.error?.message || "Erreur lors de la création de la session Stripe" }), {
      status: stripeRes.status,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }

  return new Response(JSON.stringify({ url: session.url, sessionId: session.id }), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" }
  });
}

/**
 * Gestionnaire pour /webhook (Réception des événements Stripe)
 */
async function handleStripeWebhook(request, env, corsHeaders) {
  const signature = request.headers.get("stripe-signature");
  if (!signature || !env.STRIPE_WEBHOOK_SECRET) {
    return new Response(JSON.stringify({ error: "Signature manquante ou STRIPE_WEBHOOK_SECRET non défini." }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }

  const rawBody = await request.text();

  // Vérification de la signature HMAC-SHA256
  const isValid = await verifyStripeSignature(rawBody, signature, env.STRIPE_WEBHOOK_SECRET);
  if (!isValid) {
    console.warn("[Stripe Webhook] Signature invalide rejetée.");
    return new Response(JSON.stringify({ error: "Signature de webhook invalide." }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }

  const event = JSON.parse(rawBody);
  console.log(`[Stripe Webhook] Événement reçu : ${event.type}`);

  // 1. Session de paiement terminée avec succès
  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const uid = session.client_reference_id || session.metadata?.firebaseUID;
    const plan = session.metadata?.plan || "Pass Annuel Pro";
    const subscriptionId = session.subscription || "";
    const customerId = session.customer || "";

    if (uid) {
      console.log(`[Stripe Webhook] Activation Premium pour l'utilisateur UID: ${uid}`);
      await updateFirestoreUserPremium(uid, {
        premium: true,
        verifiedPaid: true,
        plan: plan,
        subscriptionId: subscriptionId,
        stripeCustomerId: customerId,
        unlockedAt: new Date().toISOString()
      }, env);
    } else {
      console.warn("[Stripe Webhook] checkout.session.completed sans UID associé.");
    }
  }

  // 2. Abonnement résilié ou impayé
  if (event.type === "customer.subscription.deleted") {
    const sub = event.data.object;
    const uid = sub.metadata?.firebaseUID;
    if (uid) {
      console.log(`[Stripe Webhook] Résiliation Premium pour UID: ${uid}`);
      await updateFirestoreUserPremium(uid, {
        premium: false,
        verifiedPaid: false,
        plan: "freemium",
        subscriptionId: "",
        canceledAt: new Date().toISOString()
      }, env);
    }
  }

  return new Response(JSON.stringify({ received: true }), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" }
  });
}

/**
 * Vérification cryptographique de la signature Stripe HMAC-SHA256 avec Web Crypto API
 */
async function verifyStripeSignature(payload, header, secret) {
  try {
    const parts = header.split(",");
    let timestamp = "";
    let signature = "";

    for (const part of parts) {
      const [key, value] = part.trim().split("=");
      if (key === "t") timestamp = value;
      if (key === "v1") signature = value;
    }

    if (!timestamp || !signature) return false;

    // Tolérance d'horodatage : 5 minutes (300 secondes)
    const now = Math.floor(Date.now() / 1000);
    if (Math.abs(now - parseInt(timestamp, 10)) > 300) {
      console.warn("[Stripe Signature] Timestamp trop ancien ou désynchronisé.");
      return false;
    }

    const signedPayload = `${timestamp}.${payload}`;
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );

    const signatureBytes = await crypto.subtle.sign("HMAC", key, encoder.encode(signedPayload));
    const computedSignature = Array.from(new Uint8Array(signatureBytes))
      .map(b => b.toString(16).padStart(2, "0"))
      .join("");

    return computedSignature === signature;
  } catch (err) {
    console.error("[verifyStripeSignature Error]", err);
    return false;
  }
}

/**
 * Mise à jour du document Firestore /users/{uid} via l'API REST Google Cloud Firestore
 */
async function updateFirestoreUserPremium(uid, fieldsToUpdate, env) {
  const projectId = env.FIREBASE_PROJECT_ID || "iae-slop-3f7be";
  const firestoreBaseUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/users/${uid}`;

  // Conversion des valeurs en format Firestore REST API
  const firestoreFields = {};
  const updateMask = [];

  for (const [key, val] of Object.entries(fieldsToUpdate)) {
    updateMask.push(`updateMask.fieldPaths=${key}`);
    if (typeof val === "boolean") {
      firestoreFields[key] = { booleanValue: val };
    } else if (typeof val === "number") {
      firestoreFields[key] = { integerValue: String(val) };
    } else {
      firestoreFields[key] = { stringValue: String(val) };
    }
  }

  const patchUrl = `${firestoreBaseUrl}?${updateMask.join("&")}`;
  
  // Headers d'authentification Firestore REST
  const headers = { "Content-Type": "application/json" };
  
  // Si un token ou clé de service account Google OAuth est fourni
  if (env.FIREBASE_API_KEY) {
    headers["X-Goog-Api-Key"] = env.FIREBASE_API_KEY;
  }

  try {
    const res = await fetch(patchUrl, {
      method: "PATCH",
      headers,
      body: JSON.stringify({ fields: firestoreFields })
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error(`[Firestore REST Error] Status: ${res.status}`, errText);
    } else {
      console.log(`[Firestore REST] Profil utilisateur ${uid} mis à jour avec succès.`);
    }
  } catch (e) {
    console.error("[Firestore REST Exception]", e);
  }
}
