import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  FirebaseAdminConfigError,
  getFirebaseAdminConfig,
  getFirebaseAdminConfigStatus,
} from "@/lib/firebase-admin-config";

describe("configuracion Firebase Admin", () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
  });

  it("expone las variables faltantes sin incluir valores secretos", () => {
    vi.stubEnv("FIREBASE_PROJECT_ID", "");
    vi.stubEnv("FIREBASE_CLIENT_EMAIL", "admin@test.invalid");
    vi.stubEnv("FIREBASE_PRIVATE_KEY", "-----BEGIN PRIVATE KEY-----secreto");

    const status = getFirebaseAdminConfigStatus();

    expect(status).toEqual({
      projectId: null,
      clientEmailConfigured: true,
      privateKeyConfigured: true,
      missing: ["FIREBASE_PROJECT_ID"],
    });
    expect(JSON.stringify(status)).not.toContain("secreto");
    expect(() => getFirebaseAdminConfig()).toThrow(FirebaseAdminConfigError);
  });

  it("normaliza los saltos escapados de la llave cuando el contrato es valido", () => {
    vi.stubEnv("FIREBASE_PROJECT_ID", "mundocelular-id");
    vi.stubEnv("FIREBASE_CLIENT_EMAIL", "firebase-adminsdk@test.invalid");
    vi.stubEnv("FIREBASE_PRIVATE_KEY", "linea-1\\nlinea-2");

    expect(getFirebaseAdminConfig()).toEqual({
      projectId: "mundocelular-id",
      clientEmail: "firebase-adminsdk@test.invalid",
      privateKey: "linea-1\nlinea-2",
    });
  });
});
