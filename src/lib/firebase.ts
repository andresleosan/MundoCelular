import { initializeApp, getApps } from "firebase/app";
import type { Auth } from "firebase/auth";
import type { Firestore } from "firebase/firestore";

export const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

export const app = getApps().length > 0 ? getApps()[0] : initializeApp(firebaseConfig);
// Auth se inicializa bajo demanda para no cargar el iframe de Google durante el
// primer render. Los consumidores lo solicitan al suscribirse o iniciar sesión.
export let auth: Auth | null = null;
export async function getAuthClient(): Promise<Auth | null> {
  if (!auth && firebaseConfig.apiKey) {
    const { getAuth } = await import("firebase/auth");
    auth = getAuth(app);
  }
  return auth;
}
// getFirestore lanza "Service firestore is not available" durante SSR si se evalúa
// en contexto servidor sin apiKey válida. Se exporta como getter perezoso `getDb()`
// para que los módulos cliente (categorias/productos/pedidos/config) solo lo llamen
// dentro de funciones que se ejecutan en el navegador, evitando la evaluación eager
// al importarse desde un Server Component (AuthProvider -> firebase.ts).
export async function getDb(): Promise<Firestore> {
  if (!firebaseConfig.apiKey) {
    throw new Error("Firebase no inicializado: falta NEXT_PUBLIC_FIREBASE_API_KEY");
  }
  const { getFirestore } = await import("firebase/firestore");
  return getFirestore(app);
}

export async function getGoogleProvider() {
  const { GoogleAuthProvider } = await import("firebase/auth");
  return new GoogleAuthProvider();
}
