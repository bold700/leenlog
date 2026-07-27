import { getApp, getApps, initializeApp } from "firebase/app"
import { getAuth, GoogleAuthProvider } from "firebase/auth"
import { getFirestore } from "firebase/firestore"

// Config uit NEXT_PUBLIC_* env-variabelen (bij statische export worden die
// tijdens de build ingebakken). Firebase-clientconfig is niet geheim: het
// wordt sowieso naar de browser gestuurd. De beveiliging zit in de Firestore-rules.
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

// Zonder ingevulde config draait de app in demo-modus (localStorage, geen login).
export const firebaseEnabled = Boolean(
  firebaseConfig.apiKey && firebaseConfig.projectId
)

export function getFirebase() {
  if (!firebaseEnabled) {
    throw new Error("Firebase is niet geconfigureerd (NEXT_PUBLIC_FIREBASE_* ontbreekt).")
  }
  const app = getApps().length ? getApp() : initializeApp(firebaseConfig)
  const auth = getAuth(app)
  const db = getFirestore(app)
  const googleProvider = new GoogleAuthProvider()
  return { app, auth, db, googleProvider }
}
