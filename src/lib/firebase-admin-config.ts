const REQUIRED = [
  "FIREBASE_PROJECT_ID",
  "FIREBASE_CLIENT_EMAIL",
  "FIREBASE_PRIVATE_KEY",
] as const;

export class FirebaseAdminConfigError extends Error {
  readonly code = "firebase-admin/missing-config";

  constructor(readonly missing: string[]) {
    super(`Faltan variables Firebase Admin: ${missing.join(", ")}`);
    this.name = "FirebaseAdminConfigError";
  }
}

export function getFirebaseAdminConfigStatus() {
  const projectId = process.env.FIREBASE_PROJECT_ID?.trim() || null;
  const clientEmailConfigured = Boolean(process.env.FIREBASE_CLIENT_EMAIL?.trim());
  const privateKeyConfigured = Boolean(process.env.FIREBASE_PRIVATE_KEY?.trim());
  const missing = REQUIRED.filter((name) => {
    if (name === "FIREBASE_PROJECT_ID") return !projectId;
    if (name === "FIREBASE_CLIENT_EMAIL") return !clientEmailConfigured;
    return !privateKeyConfigured;
  });

  return { projectId, clientEmailConfigured, privateKeyConfigured, missing };
}

export function getFirebaseAdminConfig() {
  const status = getFirebaseAdminConfigStatus();

  if (status.missing.length > 0) {
    throw new FirebaseAdminConfigError(status.missing);
  }

  return {
    projectId: status.projectId!,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL!.trim(),
    privateKey: process.env.FIREBASE_PRIVATE_KEY!.replace(/\\n/g, "\n"),
  };
}
