import { initializeApp, getApps } from "firebase/app";
import { getAuth, GoogleAuthProvider, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";

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
// getAuth lanza auth/invalid-api-key al evaluar el módulo si falta la API key
// (p. ej. prerender del build sin .env.local). Se degrada a null en ese caso:
// auth solo se usa en el navegador (efectos y handlers), nunca en render servidor.
export const auth = (firebaseConfig.apiKey ? getAuth(app) : null) as Auth;
// getFirestore lanza "Service firestore is not available" durante SSR si se evalúa
// en contexto servidor sin apiKey válida. Se exporta como getter perezoso `getDb()`
// para que los módulos cliente (categorias/productos/pedidos/config) solo lo llamen
// dentro de funciones que se ejecutan en el navegador, evitando la evaluación eager
// al importarse desde un Server Component (AuthProvider -> firebase.ts).
export function getDb(): Firestore {
  if (!firebaseConfig.apiKey) {
    throw new Error("Firebase no inicializado: falta NEXT_PUBLIC_FIREBASE_API_KEY");
  }
  return getFirestore(app);
}
export const googleProvider = new GoogleAuthProvider();
