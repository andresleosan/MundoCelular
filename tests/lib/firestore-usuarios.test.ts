import { describe, it, expect, vi, beforeEach } from "vitest";

type MockProfile = Record<string, unknown>;

let profile: MockProfile | null = null;
let transactionUpdateError: Error | undefined;

const snapshot = () => profile
  ? { exists: true, data: () => ({ ...profile }) }
  : { exists: false, data: () => undefined };

const mockDocRef = {
  get: vi.fn(async () => snapshot()),
  set: vi.fn(async (_data: MockProfile, options?: { merge?: boolean }) => {
    const data = _data;
    profile = options?.merge ? { ...(profile ?? {}), ...data } : data;
  }),
  update: vi.fn(async (data: MockProfile) => {
    if (transactionUpdateError) {
      const error = transactionUpdateError;
      transactionUpdateError = undefined;
      throw error;
    }
    profile = { ...(profile ?? {}), ...data };
  }),
};

const mockTransaction = {
  get: vi.fn(async () => snapshot()),
  set: vi.fn((_ref: unknown, data: MockProfile, options?: { merge?: boolean }) => {
    void _ref;
    profile = options?.merge ? { ...(profile ?? {}), ...data } : data;
  }),
  update: vi.fn((_ref: unknown, data: MockProfile) => {
    void _ref;
    if (transactionUpdateError) {
      const error = transactionUpdateError;
      transactionUpdateError = undefined;
      throw error;
    }
    profile = { ...(profile ?? {}), ...data };
  }),
};
const mockRunTransaction = vi.fn(async (callback: (transaction: typeof mockTransaction) => unknown) => callback(mockTransaction));
const mockWhereGet = vi.fn(async (): Promise<{ docs: Array<{ data: () => unknown }>; empty: boolean }> => ({
  docs: [],
  empty: true,
}));
const mockWhere = vi.fn(() => ({ get: mockWhereGet }));
const mockCollection = vi.fn(() => ({ doc: vi.fn(() => mockDocRef), where: mockWhere }));
const mockDb = { collection: mockCollection, runTransaction: mockRunTransaction };
const mockSetCustomUserClaims = vi.fn(async (uid: string, claims: Record<string, unknown> | null) => {
  void uid;
  void claims;
});
type MockAuthUser = {
  email: string;
  displayName: string;
  photoURL: string;
  customClaims?: Record<string, unknown>;
};
const mockGetUser = vi.fn(async (): Promise<MockAuthUser> => ({
  email: "test@test.com",
  displayName: "Test",
  photoURL: "",
}));

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

import {
  asignarAdmin,
  aprobarSolicitudAdmin,
  listarSolicitudesAdmin,
  rechazarSolicitudAdmin,
  solicitarAdmin,
  revocarAdmin,
} from "@/lib/firestore/usuarios";

const perfilSolicitud = {
  email: "solicitante@test.com",
  displayName: "Solicitante",
  photoURL: "https://example.com/photo.jpg",
};

describe("listarSolicitudesAdmin", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("consulta usuarios con estado pending", async () => {
    mockWhereGet.mockResolvedValueOnce({ docs: [{ data: () => ({ uid: "uid123" }) }], empty: false });

    await listarSolicitudesAdmin();

    expect(mockWhere).toHaveBeenCalledWith("adminRequestStatus", "==", "pending");
  });

  it("devuelve los perfiles de las solicitudes", async () => {
    const solicitud = { uid: "uid123", adminRequestStatus: "pending" as const };
    mockWhereGet.mockResolvedValueOnce({ docs: [{ data: () => solicitud }], empty: false });

    await expect(listarSolicitudesAdmin()).resolves.toEqual([solicitud]);
  });
});

describe("solicitarAdmin", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    profile = null;
  });

  it("crea una solicitud con los datos del perfil y marca temporal", async () => {
    await expect(solicitarAdmin("uid123", perfilSolicitud)).resolves.toBe("created");

    expect(mockTransaction.set).toHaveBeenCalledWith(
      mockDocRef,
      expect.objectContaining({
        uid: "uid123",
        ...perfilSolicitud,
        role: "customer",
        active: true,
        adminRequestStatus: "pending",
        adminRequestedAt: expect.any(Date),
        createdAt: expect.any(Date),
        lastLogin: expect.any(Date),
      }),
      { merge: true },
    );
  });

  it("deduplica una solicitud pendiente sin escribir", async () => {
    profile = { uid: "uid123", role: "customer", adminRequestStatus: "pending" };

    await expect(solicitarAdmin("uid123", perfilSolicitud)).resolves.toBe("already-pending");

    expect(mockTransaction.set).not.toHaveBeenCalled();
    expect(mockDocRef.set).not.toHaveBeenCalled();
  });

  it("actualiza un perfil existente con merge sin cambiar su role", async () => {
    profile = { uid: "uid123", role: "admin", adminRequestStatus: "rejected" };

    await expect(solicitarAdmin("uid123", perfilSolicitud)).resolves.toBe("created");

    expect(mockTransaction.set).toHaveBeenCalledWith(
      mockDocRef,
      expect.objectContaining({
        ...perfilSolicitud,
        active: true,
        adminRequestStatus: "pending",
        adminRequestedAt: expect.any(Date),
      }),
      { merge: true },
    );
    expect(mockTransaction.set.mock.calls[0][1]).not.toHaveProperty("role");
  });
});

describe("asignarAdmin", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    profile = null;
    mockGetUser.mockResolvedValue({ email: "test@test.com", displayName: "Test", photoURL: "" });
    mockSetCustomUserClaims.mockResolvedValue(undefined);
  });

  it("persiste el perfil admin antes de asignar el claim", async () => {
    await asignarAdmin("uid123");

    expect(mockDocRef.set).toHaveBeenCalledWith(
      expect.objectContaining({ uid: "uid123", role: "admin", adminRequestStatus: "approved" }),
    );
    expect(mockDocRef.set.mock.invocationCallOrder[0]).toBeLessThan(
      mockSetCustomUserClaims.mock.invocationCallOrder[0],
    );
  });

  it("preserva custom claims existentes al agregar admin:true", async () => {
    mockGetUser.mockResolvedValue({
      email: "test@test.com",
      displayName: "Test",
      photoURL: "",
      customClaims: { moderator: true, region: "medellin" },
    });

    await asignarAdmin("uid123");

    expect(mockSetCustomUserClaims).toHaveBeenCalledWith("uid123", {
      moderator: true,
      region: "medellin",
      admin: true,
    });
  });

  it("actualiza un perfil existente a admin", async () => {
    profile = { uid: "uid123", role: "customer" };

    await asignarAdmin("uid123");

    expect(mockDocRef.update).toHaveBeenCalledWith({ role: "admin", adminRequestStatus: "approved" });
  });

  it("deja el perfil admin si Auth falla despues de persistirlo", async () => {
    mockSetCustomUserClaims.mockRejectedValueOnce(new Error("fallo de Auth"));

    await expect(asignarAdmin("uid123")).rejects.toThrow("fallo de Auth");

    expect(profile).toEqual(expect.objectContaining({ role: "admin", adminRequestStatus: "approved" }));
    expect(mockSetCustomUserClaims).toHaveBeenCalledOnce();
  });
});

describe("aprobarSolicitudAdmin", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    profile = { uid: "uid123", role: "customer", adminRequestStatus: "pending" };
    transactionUpdateError = undefined;
    mockGetUser.mockResolvedValue({ email: "test@test.com", displayName: "Test", photoURL: "" });
    mockSetCustomUserClaims.mockResolvedValue(undefined);
  });

  it("aprueba la solicitud en la transaccion antes de modificar claims", async () => {
    await aprobarSolicitudAdmin("uid123");

    expect(mockTransaction.update).toHaveBeenCalledWith(mockDocRef, {
      role: "admin",
      adminRequestStatus: "approved",
    });
    expect(mockTransaction.update.mock.invocationCallOrder[0]).toBeLessThan(
      mockSetCustomUserClaims.mock.invocationCallOrder[0],
    );
    expect(mockSetCustomUserClaims).toHaveBeenCalledWith("uid123", { admin: true });
  });

  it("preserva custom claims existentes al aprobar", async () => {
    mockGetUser.mockResolvedValue({
      email: "test@test.com",
      displayName: "Test",
      photoURL: "",
      customClaims: { moderator: true, region: "medellin" },
    });

    await aprobarSolicitudAdmin("uid123");

    expect(mockSetCustomUserClaims).toHaveBeenCalledWith("uid123", {
      moderator: true,
      region: "medellin",
      admin: true,
    });
  });

  it("la segunda aprobacion concurrente no modifica claims despues de aprobarse el perfil", async () => {
    let releaseFirstClaims!: () => void;
    let firstClaimsStarted!: () => void;
    const claimsStarted = new Promise<void>((resolve) => { firstClaimsStarted = resolve; });
    const firstClaims = new Promise<void>((resolve) => { releaseFirstClaims = resolve; });
    mockSetCustomUserClaims.mockImplementationOnce(async () => {
      firstClaimsStarted();
      await firstClaims;
    });

    const firstApproval = aprobarSolicitudAdmin("uid123");
    await claimsStarted;

    await expect(aprobarSolicitudAdmin("uid123")).rejects.toMatchObject({ code: "REQUEST_NOT_PENDING" });
    expect(mockSetCustomUserClaims).toHaveBeenCalledOnce();

    releaseFirstClaims();
    await firstApproval;
  });

  it("rechaza aprobar una solicitud que ya no esta pendiente sin tocar claims", async () => {
    profile = { uid: "uid123", role: "customer", adminRequestStatus: "rejected" };

    await expect(aprobarSolicitudAdmin("uid123")).rejects.toMatchObject({ code: "REQUEST_NOT_PENDING" });
    expect(mockSetCustomUserClaims).not.toHaveBeenCalled();
  });

  it("deja la solicitud aprobada si Auth falla despues de la transaccion", async () => {
    mockSetCustomUserClaims.mockRejectedValueOnce(new Error("fallo de Auth"));

    await expect(aprobarSolicitudAdmin("uid123")).rejects.toThrow("fallo de Auth");

    expect(profile).toEqual(expect.objectContaining({ role: "admin", adminRequestStatus: "approved" }));
    expect(mockSetCustomUserClaims).toHaveBeenCalledOnce();
  });
});

describe("rechazarSolicitudAdmin", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    profile = { uid: "uid123", role: "customer", adminRequestStatus: "pending" };
  });

  it("marca la solicitud como rechazada sin cambiar el rol", async () => {
    await rechazarSolicitudAdmin("uid123");

    expect(mockTransaction.update).toHaveBeenCalledWith(mockDocRef, { adminRequestStatus: "rejected" });
    expect(profile).toEqual(expect.objectContaining({ role: "customer", adminRequestStatus: "rejected" }));
    expect(mockSetCustomUserClaims).not.toHaveBeenCalled();
  });

  it("rechaza resolver una solicitud que ya no esta pendiente", async () => {
    profile = { uid: "uid123", role: "customer", adminRequestStatus: "approved" };

    await expect(rechazarSolicitudAdmin("uid123")).rejects.toMatchObject({ code: "REQUEST_NOT_PENDING" });
    expect(mockTransaction.update).not.toHaveBeenCalled();
  });
});

describe("revocarAdmin", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    profile = { uid: "uid123", role: "admin" };
  });

  it("retira solo el claim admin y conserva claims personalizados", async () => {
    mockGetUser.mockResolvedValue({
      email: "test@test.com",
      displayName: "Test",
      photoURL: "",
      customClaims: { admin: true, moderator: true, region: "medellin" },
    });

    await revocarAdmin("uid123");

    expect(mockSetCustomUserClaims).toHaveBeenCalledWith("uid123", { moderator: true, region: "medellin" });
  });

  it("actualiza role a customer", async () => {
    await revocarAdmin("uid123");

    expect(mockDocRef.update).toHaveBeenCalledWith({ role: "customer" });
  });
});
