import { describe, it, expect, vi, beforeEach } from "vitest";

const mockDocRef = { get: vi.fn(), set: vi.fn(), update: vi.fn() };
const mockCollection = vi.fn(() => ({ doc: vi.fn(() => mockDocRef), where: vi.fn(() => ({ get: vi.fn(async () => ({ docs: [], empty: true })) })) }));
const mockDb = { collection: mockCollection };
const mockSetCustomUserClaims = vi.fn(async () => {});
const mockGetUser = vi.fn(async () => ({ email: "test@test.com", displayName: "Test", photoURL: "" }));

vi.mock("@/lib/firebase-admin", () => ({
  getAdminDb: vi.fn(() => mockDb),
  getAdminApp: vi.fn(() => ({})),
}));

vi.mock("firebase-admin/auth", () => ({
  getAuth: vi.fn(() => ({
    setCustomUserClaims: mockSetCustomUserClaims,
    getUser: mockGetUser,
  })),
}));

import { asignarAdmin, revocarAdmin } from "@/lib/firestore/usuarios";

describe("asignarAdmin", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDocRef.get.mockResolvedValue({ exists: false });
  });

  it("llama a setCustomUserClaims con admin:true", async () => {
    await asignarAdmin("uid123");
    expect(mockSetCustomUserClaims).toHaveBeenCalledWith("uid123", { admin: true });
  });

  it("crea documento en users/{uid} si no existe", async () => {
    await asignarAdmin("uid123");
    expect(mockDocRef.set).toHaveBeenCalledWith(
      expect.objectContaining({ uid: "uid123", role: "admin" })
    );
  });

  it("actualiza role a admin si el documento ya existe", async () => {
    mockDocRef.get.mockResolvedValue({ exists: true });
    await asignarAdmin("uid123");
    expect(mockDocRef.update).toHaveBeenCalledWith({ role: "admin" });
  });
});

describe("revocarAdmin", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDocRef.get.mockResolvedValue({ exists: true });
  });

  it("llama a setCustomUserClaims con null", async () => {
    await revocarAdmin("uid123");
    expect(mockSetCustomUserClaims).toHaveBeenCalledWith("uid123", null);
  });

  it("actualiza role a customer", async () => {
    await revocarAdmin("uid123");
    expect(mockDocRef.update).toHaveBeenCalledWith({ role: "customer" });
  });
});
