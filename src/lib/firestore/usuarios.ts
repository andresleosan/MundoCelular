import { getAdminDb, getAdminApp } from "@/lib/firebase-admin";
import { getAuth } from "firebase-admin/auth";
import type { Usuario } from "@/types";

const COL = "users";

export class SolicitudNoPendienteError extends Error {
  readonly code = "REQUEST_NOT_PENDING";

  constructor() {
    super("La solicitud ya no esta pendiente");
    this.name = "SolicitudNoPendienteError";
  }
}

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

export async function listarSolicitudesAdmin(): Promise<Usuario[]> {
  const db = getAdminDb();
  const snap = await db.collection(COL).where("adminRequestStatus", "==", "pending").get();
  return snap.docs.map((d) => d.data() as Usuario);
}

export async function solicitarAdmin(uid: string, data: {
  email: string;
  displayName: string;
  photoURL: string;
}): Promise<"created" | "already-pending"> {
  const db = getAdminDb();
  const ref = db.collection(COL).doc(uid);
  const requestData = {
    ...data,
    active: true,
    adminRequestStatus: "pending" as const,
    adminRequestedAt: new Date(),
  };

  return db.runTransaction(async (transaction) => {
    const snap = await transaction.get(ref);
    if (snap.exists && (snap.data() as Usuario).adminRequestStatus === "pending") {
      return "already-pending";
    }

    transaction.set(
      ref,
      snap.exists
        ? requestData
        : { uid, ...requestData, role: "customer" as const, createdAt: new Date(), lastLogin: new Date() },
      { merge: true },
    );
    return "created";
  });
}

async function promoverAdmin(uid: string, requiereSolicitudPendiente: boolean): Promise<void> {
  const db = getAdminDb();
  const auth = getAuth(getAdminApp());
  const ref = db.collection(COL).doc(uid);
  let authUser: Awaited<ReturnType<typeof auth.getUser>> | undefined;

  if (requiereSolicitudPendiente) {
    await db.runTransaction(async (transaction) => {
      const snap = await transaction.get(ref);
      if (!snap.exists || (snap.data() as Usuario).adminRequestStatus !== "pending") {
        throw new SolicitudNoPendienteError();
      }
      transaction.update(ref, {
        role: "admin" as const,
        adminRequestStatus: "approved" as const,
      });
    });
  } else {
    const snap = await ref.get();
    if (snap.exists) {
      await ref.update({ role: "admin" as const, adminRequestStatus: "approved" as const });
    } else {
      authUser = await auth.getUser(uid);
      await ref.set({
        uid,
        email: authUser.email ?? "",
        displayName: authUser.displayName ?? "",
        photoURL: authUser.photoURL ?? "",
        role: "admin",
        active: true,
        adminRequestStatus: "approved",
        createdAt: new Date(),
        lastLogin: new Date(),
      });
    }
  }

  authUser ??= await auth.getUser(uid);
  await auth.setCustomUserClaims(uid, {
    ...(authUser.customClaims ?? {}),
    admin: true,
  });
}

export async function asignarAdmin(uid: string): Promise<void> {
  await promoverAdmin(uid, false);
}

export async function aprobarSolicitudAdmin(uid: string): Promise<void> {
  await promoverAdmin(uid, true);
}

export async function rechazarSolicitudAdmin(uid: string): Promise<void> {
  const db = getAdminDb();
  const ref = db.collection(COL).doc(uid);
  await db.runTransaction(async (transaction) => {
    const snap = await transaction.get(ref);
    if (!snap.exists || (snap.data() as Usuario).adminRequestStatus !== "pending") {
      throw new SolicitudNoPendienteError();
    }
    transaction.update(ref, { adminRequestStatus: "rejected" as const });
  });
}

export async function revocarAdmin(uid: string): Promise<void> {
  const db = getAdminDb();
  const auth = getAuth(getAdminApp());
  const authUser = await auth.getUser(uid);
  const customClaims = Object.fromEntries(
    Object.entries(authUser.customClaims ?? {}).filter(([key]) => key !== "admin"),
  );
  await auth.setCustomUserClaims(uid, Object.keys(customClaims).length > 0 ? customClaims : null);
  const ref = db.collection(COL).doc(uid);
  const snap = await ref.get();
  if (snap.exists) {
    await ref.update({ role: "customer" as const });
  }
}
