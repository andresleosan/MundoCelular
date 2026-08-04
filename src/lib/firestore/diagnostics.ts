import { getFirebaseAdminConfigStatus } from "../firebase-admin-config";

export type FirestoreReadMetadata = {
  nombre: string;
  coleccion: string;
  filtros: string[];
};

type FirestoreError = {
  code?: unknown;
};

const NUMERIC_ERROR_CODES: Record<number, string> = {
  7: "permission-denied",
  9: "failed-precondition",
};

const ALLOWED_ERROR_CODES = new Set([
  "permission-denied",
  "failed-precondition",
  "firebase-admin/missing-config",
  "unauthenticated",
  "unavailable",
  "deadline-exceeded",
  "internal",
]);

export function normalizarCodigoFirestore(code: unknown): string {
  const candidate =
    typeof code === "number"
      ? NUMERIC_ERROR_CODES[code]
      : typeof code === "string"
        ? code.trim().toLowerCase()
        : undefined;

  return candidate && ALLOWED_ERROR_CODES.has(candidate) ? candidate : "unknown";
}

function mensajeSeguro(code: string): string {
  switch (code) {
    case "firebase-admin/missing-config":
      return "Firebase Admin configuration missing";
    case "permission-denied":
      return "Firestore permission denied";
    case "failed-precondition":
      return "Firestore query precondition failed";
    case "unavailable":
    case "deadline-exceeded":
      return "Firestore temporarily unavailable";
    case "unauthenticated":
      return "Firebase authentication failed";
    case "internal":
      return "Firestore internal error";
    default:
      return "Firestore read failed";
  }
}

function extraerError(error: unknown) {
  const details = (typeof error === "object" && error !== null ? error : {}) as FirestoreError;
  const code = normalizarCodigoFirestore(details.code);

  return {
    code,
    message: mensajeSeguro(code),
  };
}

export async function ejecutarLecturaFirestore<T extends { docs?: readonly unknown[]; exists?: boolean }>(
  metadata: FirestoreReadMetadata,
  operation: () => Promise<T>,
): Promise<T> {
  const startedAt = Date.now();

  try {
    const snapshot = await operation();
    const status = getFirebaseAdminConfigStatus();

    console.info("[firestore:read]", {
      ...metadata,
      projectId: status.projectId,
      count: Array.isArray(snapshot.docs) ? snapshot.docs.length : snapshot.exists === true ? 1 : 0,
      durationMs: Date.now() - startedAt,
    });

    return snapshot;
  } catch (error) {
    const status = getFirebaseAdminConfigStatus();
    const details = extraerError(error);

    console.error("[firestore:read:error]", {
      ...metadata,
      projectId: status.projectId,
      durationMs: Date.now() - startedAt,
      ...details,
    });

    throw error;
  }
}
