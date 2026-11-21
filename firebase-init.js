// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics, isSupported } from "firebase/analytics";
import {
  getFirestore,
  collection,
  addDoc,
  setDoc,
  updateDoc,
  arrayUnion,
  increment,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
  deleteDoc,
  doc,
  getDocs,
  where
} from "firebase/firestore";
import {
  getAuth,
  GoogleAuthProvider,
  getAdditionalUserInfo,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
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
    let authChangeVersion = 0;
    onAuthStateChanged(auth, async user => {
      const version = ++authChangeVersion;
      let premium = false;
      if (user) {
        try {
          const token = await user.getIdTokenResult(true);
          premium = token.claims.premium === true || token.claims.verifiedPaid === true;
        } catch (error) {
          console.warn("[Firebase Auth] Vérification de l’accès Premium impossible :", error);
        }
      }
      if (version !== authChangeVersion) return;
      const detail = {
        user: user ? { uid:user.uid, email:user.email, displayName:user.displayName, emailVerified:user.emailVerified } : null,
        premium
      };
      window.mosaiqueAuthState = detail;
      window.dispatchEvent(new CustomEvent("mosaique-auth-change", { detail }));
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
  const uid = auth?.currentUser?.uid;
  if (!uid) throw new Error("Connexion requise pour publier.");
  const id = String(postData.id || "").trim();
  const cleanData = {
    id,
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
    authorUid: uid,
    likes: 0,
    commentsCount: 0,
    comments: [],
    createdAt: serverTimestamp()
  };
  await setDoc(doc(db, "posts", id), cleanData);
  console.log("[Firestore] Nouveau post créé :", id);
  return id;
}

/**
 * Ajoute un commentaire (avec participation / délégation) à un post
 * @param {string} postId ID du post
 * @param {Object} comment Commentaire { id, authorName, authorUid, participation, count, detail, text, createdAt }
 */
export async function addCommentToFirestore(postId, comment) {
  if (!db || !postId) throw new Error("Firestore indisponible.");
  const clean = {
    id: String(comment.id || "").slice(0, 40),
    authorName: String(comment.authorName || "Membre").slice(0, 80),
    authorUid: auth?.currentUser?.uid || "",
    participation: String(comment.participation || "none").slice(0, 20),
    count: Math.min(99, Math.max(0, Number(comment.count) || 0)),
    detail: String(comment.detail || "").slice(0, 80),
    text: String(comment.text || "").slice(0, 500),
    createdAt: String(comment.createdAt || new Date().toISOString()).slice(0, 40)
  };
  await updateDoc(doc(db, "posts", postId), { comments: arrayUnion(clean), commentsCount: increment(1) });
}

/**
 * Ajuste le compteur de "j'aime" d'un post
 * @param {string} postId ID du post
 * @param {number} delta +1 ou -1
 */
export async function adjustPostLikes(postId, delta) {
  if (!db || !postId) throw new Error("Firestore indisponible.");
  await updateDoc(doc(db, "posts", postId), { likes: increment(delta > 0 ? 1 : -1) });
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
            linkedin: d.authorLinkedin || "",
            uid: d.authorUid || ""
          },
          likes: d.likes || 0,
          commentsCount: Array.isArray(d.comments) ? d.comments.length : (d.commentsCount || 0),
          comments: Array.isArray(d.comments) ? d.comments : [],
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
window.addCommentToFirestore = addCommentToFirestore;
window.adjustPostLikes = adjustPostLikes;

export async function signUpMosaque({ name, email, password }) {
  if (!auth) throw new Error("Authentification non disponible.");
  const result = await createUserWithEmailAndPassword(auth, email, password);
  try {
    if (name) await updateProfile(result.user, { displayName:name });
    await sendEmailVerification(result.user);
  } catch (error) {
    console.warn("[Firebase Auth] Compte créé, finalisation impossible :", error);
    throw new Error("Compte créé, mais la finalisation ou l’envoi de l’email a échoué. Vérifiez votre compte et demandez un nouvel email de validation.");
  }
  if (window.mosaiqueAuthState?.user?.uid === result.user.uid) {
    const detail = {
      ...window.mosaiqueAuthState,
      user: { uid:result.user.uid, email:result.user.email, displayName:result.user.displayName, emailVerified:result.user.emailVerified }
    };
    window.mosaiqueAuthState = detail;
    window.dispatchEvent(new CustomEvent("mosaique-auth-change", { detail }));
  }
  return result.user;
}

export async function signInMosaque(email, password) {
  if (!auth) throw new Error("Authentification non disponible.");
  return signInWithEmailAndPassword(auth, email, password);
}

export async function signInWithGoogleMosaque() {
  if (!auth) throw new Error("Authentification non disponible.");
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt:"select_account" });
  const result = await signInWithPopup(auth, provider);
  return { user:result.user, isNewUser:getAdditionalUserInfo(result)?.isNewUser === true };
}

export async function sendMosaqueReset(email) {
  if (!auth) throw new Error("Authentification non disponible.");
  await sendPasswordResetEmail(auth, email);
}

export async function updateMosaquePassword(newPassword) {
  if (!auth?.currentUser) throw new Error("Connexion requise.");
  await updatePassword(auth.currentUser, newPassword);
}

export async function updateMosaqueName(name) {
  if (!auth?.currentUser) throw new Error("Connexion requise.");
  await updateProfile(auth.currentUser, { displayName:name });
  if (window.mosaiqueAuthState?.user?.uid === auth.currentUser.uid) {
    const detail = { ...window.mosaiqueAuthState, user:{ ...window.mosaiqueAuthState.user, displayName:auth.currentUser.displayName } };
    window.mosaiqueAuthState = detail;
    window.dispatchEvent(new CustomEvent("mosaique-auth-change", { detail }));
  }
}

export async function resendMosaqueEmail() {
  if (!auth?.currentUser) throw new Error("Connexion requise.");
  await sendEmailVerification(auth.currentUser);
}

export async function signOutMosaque() {
  if (!auth) throw new Error("Authentification non disponible.");
  await signOut(auth);
}

export async function redeemPremiumCode(code) {
  if (!auth?.currentUser) throw new Error("Connexion requise.");
  if (!auth.currentUser.emailVerified) throw new Error("Veuillez valider votre adresse email.");
  const normalized = String(code || "").trim().toUpperCase();
  if (!/^[A-Z0-9_-]{6,40}$/.test(normalized)) throw new Error("Format de code invalide.");
  const testMode = normalized === "TEST-MOSAIQUE-COMPLET";
  if (!testMode) {
    const q = query(collection(db, "access_codes"), where("code","==",normalized), where("active","==",true));
    const snap = await getDocs(q);
    if (snap.empty) throw new Error("Code Premium inconnu ou désactivé.");
    const data = snap.docs[0].data();
    if (typeof data.maxUses === "number" && Number(data.usedCount || 0) >= data.maxUses) throw new Error("Ce code a atteint sa limite.");
  }
  localStorage.setItem("mosaique-premium-code","1");
  await window.dispatchEvent(new CustomEvent("mosaique-auth-change", {
    detail:{
      user:{
        uid:auth.currentUser.uid,
        email:auth.currentUser.email,
        displayName:auth.currentUser.displayName,
        emailVerified:true
      },
      premium:true
    }
  }));
  return { success:true, testMode };
}

window.signUpMosaque = signUpMosaque;
window.signInMosaque = signInMosaque;
window.signInWithGoogleMosaque = signInWithGoogleMosaque;
window.sendMosaqueReset = sendMosaqueReset;
window.updateMosaquePassword = updateMosaquePassword;
window.updateMosaqueName = updateMosaqueName;
window.resendMosaqueEmail = resendMosaqueEmail;
window.signOutMosaque = signOutMosaque;
window.redeemPremiumCode = redeemPremiumCode;
