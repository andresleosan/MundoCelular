import { signInWithPopup, signOut } from "firebase/auth";
import { auth, googleProvider } from "./firebase";
import { getAdminDb } from "./firebase-admin";

export async function loginConGoogle(): Promise<void> {
  await signInWithPopup(auth, googleProvider);
}

export async function cerrarSesion(): Promise<void> {
  await signOut(auth);
}

export async function asignarAdmin(email: string): Promise<void> {
  const db = getAdminDb();
  const normalizedEmail = email.toLowerCase().trim();
  await db.collection("usuarios").doc(normalizedEmail).set(
    {
      email: normalizedEmail,
      admin: true,
      pendiente: true,
      creadoEn: new Date(),
    },
    { merge: true }
  );
}

export async function revocarAdmin(email: string): Promise<void> {
  const db = getAdminDb();
  const normalizedEmail = email.toLowerCase().trim();
  await db.collection("usuarios").doc(normalizedEmail).update({
    admin: false,
  });
}

export async function listarAdmins(): Promise<
  Array<{ email: string; admin: boolean; pendiente: boolean }>
> {
  const db = getAdminDb();
  const snapshot = await db
    .collection("usuarios")
    .where("admin", "==", true)
    .get();
  return snapshot.docs.map(
    (doc) => doc.data() as { email: string; admin: boolean; pendiente: boolean }
  );
}
