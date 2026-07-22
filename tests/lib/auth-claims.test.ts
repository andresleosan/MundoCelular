import { describe, it, expect, vi, beforeEach } from "vitest";

const mockSetFn = vi.fn<() => Promise<void>>();
const mockUpdateFn = vi.fn<() => Promise<void>>();
const mockGetFn = vi.fn<() => Promise<{ docs: Array<{ data: () => Record<string, unknown> }>; empty: boolean }>>();

function makeDocRef(): Record<string, unknown> {
  return {
    set: mockSetFn,
    update: mockUpdateFn,
  };
}

function makeChain(): Record<string, unknown> {
  const chain: Record<string, unknown> = {};
  chain.where = vi.fn(() => chain);
  chain.get = mockGetFn;
  chain.doc = vi.fn(() => makeDocRef());
  return chain;
}

vi.mock("@/lib/firebase-admin", () => ({
  getAdminDb: vi.fn(() => ({
    collection: vi.fn(() => makeChain()),
  })),
}));

vi.mock("@/lib/firebase", () => ({
  auth: {},
  googleProvider: {},
}));

import { esClaimAdmin } from "@/lib/auth-claims";
import { asignarAdmin, revocarAdmin, listarAdmins } from "@/lib/auth";

describe("esClaimAdmin", () => {
  it("true solo cuando el claim admin es true", () => {
    expect(esClaimAdmin({ admin: true })).toBe(true);
    expect(esClaimAdmin({ admin: false })).toBe(false);
    expect(esClaimAdmin({})).toBe(false);
    expect(esClaimAdmin({ admin: "true" })).toBe(false);
  });
});

describe("gestión de administradores", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("asignarAdmin crea documento con admin:true", async () => {
    await asignarAdmin("test@example.com");
    expect(mockSetFn).toHaveBeenCalledWith(
      {
        email: "test@example.com",
        admin: true,
        pendiente: true,
        creadoEn: expect.any(Date),
      },
      { merge: true }
    );
  });

  it("asignarAdmin normaliza el email a minúsculas", async () => {
    await asignarAdmin("TEST@EXAMPLE.COM");
    expect(mockSetFn).toHaveBeenCalledWith(
      expect.objectContaining({ email: "test@example.com" }),
      { merge: true }
    );
  });

  it("revocarAdmin pone admin:false", async () => {
    await revocarAdmin("test@example.com");
    expect(mockUpdateFn).toHaveBeenCalledWith({ admin: false });
  });

  it("revocarAdmin normaliza el email a minúsculas", async () => {
    await revocarAdmin("TEST@EXAMPLE.COM");
    expect(mockUpdateFn).toHaveBeenCalledWith({ admin: false });
  });

  it("listarAdmins retorna solo admin:true", async () => {
    mockGetFn.mockResolvedValue({
      docs: [
        { data: () => ({ email: "admin1@example.com", admin: true, pendiente: false }) },
        { data: () => ({ email: "admin2@example.com", admin: true, pendiente: true }) },
      ],
      empty: false,
    });

    const admins = await listarAdmins();
    expect(admins.every((a) => a.admin === true)).toBe(true);
    expect(admins.length).toBe(2);
    expect(admins[0].email).toBe("admin1@example.com");
  });

  it("listarAdmins retorna array vacío cuando no hay admins", async () => {
    mockGetFn.mockResolvedValue({ docs: [], empty: true });
    const admins = await listarAdmins();
    expect(admins).toEqual([]);
  });
});
