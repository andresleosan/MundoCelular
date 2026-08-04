import { cert, getApps, initializeApp, type App } from "firebase-admin/app";
import { getFirestore, type Firestore } from "firebase-admin/firestore";
import {
  FirebaseAdminConfigError,
  getFirebaseAdminConfig,
  getFirebaseAdminConfigStatus,
} from "./firebase-admin-config";

export function getAdminApp(): App {
  if (getApps().length === 0) {
    let config;

    try {
      config = getFirebaseAdminConfig();
    } catch (error) {
      if (error instanceof FirebaseAdminConfigError) {
        console.error("[firebase-admin:config]", getFirebaseAdminConfigStatus());
      }
      throw error;
    }

    initializeApp({ credential: cert(config) });
  }
  return getApps()[0];
}

export function getAdminDb(): Firestore {
  return getFirestore(getAdminApp());
}
