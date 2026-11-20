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
