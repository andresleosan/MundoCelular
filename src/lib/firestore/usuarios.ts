import { getAdminDb, getAdminApp } from "@/lib/firebase-admin";
import { getAuth } from "firebase-admin/auth";
import type { Usuario } from "@/types";

const COL = "users";

export async function crearOActualizarUsuario(uid: string, data: {
  email: string;
  displayName: string;
  photoURL: string;
}): Promise<void> {
  const db = getAdminDb();
  const ref = db.collection(COL).doc(uid);
  const snap = await ref.get();
  if (snap.exists) {
    await ref.update({
      email: data.email,
      displayName: data.displayName,
      photoURL: data.photoURL,
      lastLogin: new Date(),
    });
  } else {
    await ref.set({
      uid,
      email: data.email,
      displayName: data.displayName,
      photoURL: data.photoURL,
      role: "customer",
      active: true,
      createdAt: new Date(),
      lastLogin: new Date(),
    });
  }
}

export async function obtenerUsuarioPorUid(uid: string): Promise<Usuario | null> {
  const db = getAdminDb();
  const snap = await db.collection(COL).doc(uid).get();
  return snap.exists ? (snap.data() as Usuario) : null;
}

export async function listarAdmins(): Promise<Usuario[]> {
  const db = getAdminDb();
  const snap = await db.collection(COL).where("role", "==", "admin").get();
  return snap.docs.map((d) => d.data() as Usuario);
}

export async function listarClientes(): Promise<Usuario[]> {
  const db = getAdminDb();
  const snap = await db.collection(COL).where("role", "==", "customer").get();
  return snap.docs.map((d) => d.data() as Usuario);
}

export async function asignarAdmin(uid: string): Promise<void> {
  const db = getAdminDb();
  await getAuth(getAdminApp()).setCustomUserClaims(uid, { admin: true });
  const ref = db.collection(COL).doc(uid);
  const snap = await ref.get();
  if (snap.exists) {
    await ref.update({ role: "admin" as const });
  } else {
    const authUser = await getAuth(getAdminApp()).getUser(uid);
    await ref.set({
      uid,
      email: authUser.email ?? "",
      displayName: authUser.displayName ?? "",
      photoURL: authUser.photoURL ?? "",
      role: "admin",
      active: true,
      createdAt: new Date(),
      lastLogin: new Date(),
    });
  }
}

export async function revocarAdmin(uid: string): Promise<void> {
  const db = getAdminDb();
  await getAuth(getAdminApp()).setCustomUserClaims(uid, null);
  const ref = db.collection(COL).doc(uid);
  const snap = await ref.get();
  if (snap.exists) {
    await ref.update({ role: "customer" as const });
  }
}
