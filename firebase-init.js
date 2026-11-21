// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics, isSupported } from "firebase/analytics";
import {
  getFirestore,
  collection,
  addDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
  deleteDoc,
  doc
} from "firebase/firestore";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendEmailVerification,
  sendPasswordResetEmail,
  updateProfile,
  updatePassword,
  signOut,
  onAuthStateChanged
} from "firebase/auth";

// Your web app's Firebase configuration
export const firebaseConfig = {
  apiKey: "AIzaSyDiIWR_aFmVq05UBI_PjVfaDObaKEktnWI",
  authDomain: "iae-slop-3f7be.firebaseapp.com",
  projectId: "iae-slop-3f7be",
  storageBucket: "iae-slop-3f7be.firebasestorage.app",
  messagingSenderId: "686562280449",
  appId: "1:686562280449:web:2cb4001774de891bbb6c00",
  measurementId: "G-1Z9WNSGYYT"
};

// Initialize Firebase with fallback protection for offline / local environments
export let app = null;
export let analytics = null;
export let db = null;
export let auth = null;

try {
  app = initializeApp(firebaseConfig);
  window.firebaseApp = app;
  window.firebaseConfig = firebaseConfig;
  console.log("[Firebase] Initialisé avec succès (Projet: " + firebaseConfig.projectId + ")");

  // 1. Initialisation de Cloud Firestore
  try {
    db = getFirestore(app);
    window.firebaseDb = db;
    console.log("[Firebase Firestore] Connecté avec succès à la base");
  } catch (fsErr) {
    console.warn("[Firebase Firestore] Initialisation différée :", fsErr.message);
  }

  try {
    auth = getAuth(app);
    window.firebaseAuth = auth;
    onAuthStateChanged(auth, async user => {
      let premium = false;
      if (user) {
        try {
          const token = await user.getIdTokenResult(true);
          premium = token.claims.premium === true || token.claims.verifiedPaid === true;
        } catch {}
      }
      window.dispatchEvent(new CustomEvent("mosaique-auth-change", {
        detail: {
          user: user ? { uid:user.uid, email:user.email, displayName:user.displayName, emailVerified:user.emailVerified } : null,
          premium
        }
      }));
    });
  } catch (authErr) {
    console.warn("[Firebase Auth] Initialisation différée :", authErr.message);
  }

  // 2. Initialisation d'Analytics (si supporté par le navigateur)
  isSupported().then(supported => {
    if (supported) {
      analytics = getAnalytics(app);
      window.firebaseAnalytics = analytics;
      console.log("[Firebase Analytics] Actif (Mesure ID: " + firebaseConfig.measurementId + ")");
    } else {
      console.info("[Firebase Analytics] Non supporté dans cet environnement (mode local ou hors-ligne)");
    }
  }).catch(err => {
    console.info("[Firebase Analytics] Indisponible temporairement :", err.message);
  });
} catch (error) {
  console.warn("[Firebase] Initialisation reportée (environnement hors-ligne ou CDN restreint) :", error.message);
}

/**
 * Enregistre une fiche alumni dans Cloud Firestore (collection "alumni")
 * @param {Object} alumniData Données de l'alumni
 * @returns {Promise<string>} Identifiant du document créé
 */
export async function saveAlumniToFirestore(alumniData) {
  if (!db) {
    throw new Error("Firestore n'est pas encore initialisé ou inaccessible.");
  }
  const cleanData = {
    name: String(alumniData.name || "").trim().slice(0, 80),
    email: String(alumniData.email || "").trim().slice(0, 120),
    region: String(alumniData.region || "").trim().slice(0, 50),
    sector: String(alumniData.sector || "").trim().slice(0, 50),
    role: String(alumniData.role || "").trim().slice(0, 80),
    experience: String(alumniData.experience || "").trim().slice(0, 600),
    summary: String(alumniData.summary || "").trim().slice(0, 1000),
    consent: true,
    createdAt: serverTimestamp()
  };

  const docRef = await addDoc(collection(db, "alumni"), cleanData);
  console.log("[Firestore] Nouvelle fiche alumni créée :", docRef.id);
  return docRef.id;
}

/**
 * Écoute en temps réel les inscriptions et fiches de la collection "alumni"
 * @param {Function} onUpdate Callback recevant la liste actualisée des fiches alumni
 * @param {Function} onError Callback en cas d'erreur ou permissions insuffisantes
 * @returns {Function} Fonction pour couper l'écouteur temps réel
 */
export function subscribeToAlumni(onUpdate, onError) {
  if (!db) {
    if (onError) onError(new Error("Firestore non disponible"));
    return () => {};
  }
  try {
    const q = query(collection(db, "alumni"), orderBy("createdAt", "desc"));
    return onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map(docSnap => {
        const d = docSnap.data();
        let createdAtIso = new Date().toISOString();
        if (d.createdAt && typeof d.createdAt.toDate === "function") {
          createdAtIso = d.createdAt.toDate().toISOString();
        }
        return {
          id: docSnap.id,
          name: d.name || "",
          email: d.email || "",
          region: d.region || "",
          sector: d.sector || "",
          role: d.role || "",
          experience: d.experience || "",
          summary: d.summary || "",
          consent: d.consent || false,
          createdAt: createdAtIso,
          isRemote: true
        };
      });
      console.log(`[Firestore] ${list.length} fiches alumni synchronisées en temps réel`);
      if (typeof onUpdate === "function") onUpdate(list);
    }, (err) => {
      console.warn("[Firestore] Problème d'écoute alumni (règles de sécurité à publier ?) :", err.message);
      if (typeof onError === "function") onError(err);
    });
  } catch (err) {
    console.warn("[Firestore] Exception abonnement :", err.message);
    if (typeof onError === "function") onError(err);
    return () => {};
  }
}

/**
 * Supprime une fiche de Firestore (réservé à l'administrateur ou auteur)
 * @param {string} id ID du document
 */
export async function deleteAlumniFromFirestore(id) {
  if (!db || !id) return;
  try {
    await deleteDoc(doc(db, "alumni", id));
    console.log("[Firestore] Fiche alumni supprimée :", id);
  } catch (err) {
    console.warn("[Firestore] Impossible de supprimer la fiche à distance :", err.message);
    throw err;
  }
}

// Rendre accessible globalement pour app.js
window.saveAlumniToFirestore = saveAlumniToFirestore;
window.subscribeToAlumni = subscribeToAlumni;
window.deleteAlumniFromFirestore = deleteAlumniFromFirestore;

/**
 * Enregistre un post (annonce/événement) dans Cloud Firestore (collection "posts")
 * @param {Object} postData Données du post
 * @returns {Promise<string>} Identifiant du document créé
 */
export async function savePostToFirestore(postData) {
  if (!db) {
    throw new Error("Firestore n'est pas encore initialisé ou inaccessible.");
  }
  const cleanData = {
    type: String(postData.type || "job_offer").trim(),
    title: String(postData.title || "").trim().slice(0, 120),
    organization: String(postData.organization || "").trim().slice(0, 100),
    location: String(postData.location || "").trim().slice(0, 80),
    content: String(postData.content || "").trim().slice(0, 600),
    contract: String(postData.contract || "").trim().slice(0, 80),
    contact: String(postData.contact || "").trim().slice(0, 120),
    eventDate: String(postData.eventDate || "").trim().slice(0, 80),
    authorName: String(postData.author?.name || "Membre Alumni").trim().slice(0, 80),
    authorRole: String(postData.author?.role || "").trim().slice(0, 100),
    authorAvatar: String(postData.author?.avatar || "MA").trim().slice(0, 4),
    authorLinkedin: String(postData.author?.linkedin || "").trim().slice(0, 200),
    likes: Number(postData.likes) || 0,
    commentsCount: Number(postData.commentsCount) || 0,
    rsvp: postData.rsvp || null,
    createdAt: serverTimestamp()
  };
  const docRef = await addDoc(collection(db, "posts"), cleanData);
  console.log("[Firestore] Nouveau post créé :", docRef.id);
  return docRef.id;
}

/**
 * Écoute en temps réel les posts de la collection "posts"
 * @param {Function} onUpdate Callback recevant la liste actualisée des posts
 * @param {Function} onError Callback en cas d'erreur
 * @returns {Function} Fonction pour couper l'écouteur
 */
export function subscribeToPostsFirestore(onUpdate, onError) {
  if (!db) {
    if (onError) onError(new Error("Firestore non disponible"));
    return () => {};
  }
  try {
    const q = query(collection(db, "posts"), orderBy("createdAt", "desc"));
    return onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map(docSnap => {
        const d = docSnap.data();
        let createdAtIso = new Date().toISOString();
        if (d.createdAt && typeof d.createdAt.toDate === "function") {
          createdAtIso = d.createdAt.toDate().toISOString();
        }
        // Calculate relative date
        const now = new Date();
        const created = new Date(createdAtIso);
        const diffMs = now - created;
        const diffMin = Math.floor(diffMs / 60000);
        const diffH = Math.floor(diffMs / 3600000);
        const diffD = Math.floor(diffMs / 86400000);
        let dateLabel = "À l'instant";
        if (diffD > 0) dateLabel = `Il y a ${diffD} jour${diffD > 1 ? "s" : ""}`;
        else if (diffH > 0) dateLabel = `Il y a ${diffH} heure${diffH > 1 ? "s" : ""}`;
        else if (diffMin > 1) dateLabel = `Il y a ${diffMin} minutes`;

        return {
          id: docSnap.id,
          type: d.type || "job_offer",
          title: d.title || "",
          organization: d.organization || "",
          location: d.location || "",
          content: d.content || "",
          contract: d.contract || "",
          contact: d.contact || "",
          eventDate: d.eventDate || "",
          author: {
            name: d.authorName || "Membre Alumni",
            role: d.authorRole || "",
            avatar: d.authorAvatar || "MA",
            linkedin: d.authorLinkedin || ""
          },
          likes: d.likes || 0,
          commentsCount: d.commentsCount || 0,
          isLiked: false,
          rsvp: d.rsvp || undefined,
          date: dateLabel,
          createdAt: createdAtIso,
          isRemote: true
        };
      });
      console.log(`[Firestore] ${list.length} posts synchronisés en temps réel`);
      if (typeof onUpdate === "function") onUpdate(list);
    }, (err) => {
      console.warn("[Firestore] Problème d'écoute posts :", err.message);
      if (typeof onError === "function") onError(err);
    });
  } catch (err) {
    console.warn("[Firestore] Exception abonnement posts :", err.message);
    if (typeof onError === "function") onError(err);
    return () => {};
  }
}

/**
 * Supprime un post de Firestore
 * @param {string} id ID du document
 */
export async function deletePostFromFirestore(id) {
  if (!db || !id) return;
  try {
    await deleteDoc(doc(db, "posts", id));
    console.log("[Firestore] Post supprimé :", id);
  } catch (err) {
    console.warn("[Firestore] Impossible de supprimer le post :", err.message);
    throw err;
  }
}

window.savePostToFirestore = savePostToFirestore;
window.subscribeToPostsFirestore = subscribeToPostsFirestore;
window.deletePostFromFirestore = deletePostFromFirestore;

export async function signUpMosaque({ name, email, password }) {
  if (!auth) throw new Error("Authentification non disponible.");
  const result = await createUserWithEmailAndPassword(auth, email, password);
  if (name) await updateProfile(result.user, { displayName:name });
  await sendEmailVerification(result.user);
  return result.user;
}

export async function signInMosaque(email, password) {
  if (!auth) throw new Error("Authentification non disponible.");
  return signInWithEmailAndPassword(auth, email, password);
}

export async function sendMosaqueReset(email) {
  if (!auth) throw new Error("Authentification non disponible.");
  await sendPasswordResetEmail(auth, email);
}

export async function updateMosaquePassword(newPassword) {
  if (!auth?.currentUser) throw new Error("Connexion requise.");
  await updatePassword(auth.currentUser, newPassword);
}

export async function resendMosaqueEmail() {
  if (!auth?.currentUser) throw new Error("Connexion requise.");
  await sendEmailVerification(auth.currentUser);
}

export async function signOutMosaque() {
  if (auth) await signOut(auth);
}

export async function redeemPremiumCode(code) {
  const endpoint = window.MOSAQUE_PREMIUM_CODE_URL;
  if (!endpoint) throw new Error("La validation des codes Premium n’est pas encore configurée.");
  if (!auth?.currentUser) throw new Error("Connexion requise.");
  const token = await auth.currentUser.getIdToken();
  const response = await fetch(endpoint, {
    method:"POST",
    headers:{ "Content-Type":"application/json", "Authorization":`Bearer ${token}` },
    body:JSON.stringify({ code:String(code || "").trim().toUpperCase() })
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.error || "Code Premium invalide.");
  await auth.currentUser.getIdToken(true);
  return payload;
}

window.signUpMosaque = signUpMosaque;
window.signInMosaque = signInMosaque;
window.sendMosaqueReset = sendMosaqueReset;
window.updateMosaquePassword = updateMosaquePassword;
window.resendMosaqueEmail = resendMosaqueEmail;
window.signOutMosaque = signOutMosaque;
window.redeemPremiumCode = redeemPremiumCode;
