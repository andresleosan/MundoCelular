import { describe, expect, it, vi } from "vitest";

vi.mock("firebase/app", () => ({
  getApps: vi.fn(() => []),
  initializeApp: vi.fn(() => ({})),
}));
vi.mock("firebase/auth", () => ({
  getAuth: vi.fn(() => null),
  GoogleAuthProvider: vi.fn(),
}));
vi.mock("firebase/firestore", () => ({ getFirestore: vi.fn(() => ({})) }));

describe("configuracion Firebase del cliente", () => {
  it("mapea las variables publicas Firebase al config del cliente", async () => {
    vi.stubEnv("NEXT_PUBLIC_FIREBASE_API_KEY", "public-key");
    vi.stubEnv("NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN", "mundocelular-id.firebaseapp.com");
    vi.stubEnv("NEXT_PUBLIC_FIREBASE_PROJECT_ID", "mundocelular-id");
    vi.stubEnv("NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET", "mundocelular-id.firebasestorage.app");
    vi.stubEnv("NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID", "123");
    vi.stubEnv("NEXT_PUBLIC_FIREBASE_APP_ID", "app-id");
    vi.stubEnv("NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID", "G-TEST");

    const { firebaseConfig } = await import("@/lib/firebase");

    expect(firebaseConfig).toMatchObject({
      apiKey: "public-key",
      authDomain: "mundocelular-id.firebaseapp.com",
      projectId: "mundocelular-id",
      storageBucket: "mundocelular-id.firebasestorage.app",
      messagingSenderId: "123",
      appId: "app-id",
      measurementId: "G-TEST",
    });
  });
});
