import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";

const { getAdminDb, mockCollection, mockDoc, mockRef, mockRunTransaction, mockTransaction, state } = vi.hoisted(() => {
  const mockRef = {};
  const state = {
    snapshot: { exists: false, data: () => undefined as Record<string, unknown> | undefined },
  };
  const mockTransaction = {
    get: vi.fn(async () => state.snapshot),
    set: vi.fn(),
    update: vi.fn(),
  };
  const mockRunTransaction = vi.fn(async (callback: (transaction: typeof mockTransaction) => unknown) =>
    callback(mockTransaction),
  );
  const mockDoc = vi.fn(() => mockRef);
  const mockCollection = vi.fn(() => ({ doc: mockDoc }));
  const mockDb = { collection: mockCollection, runTransaction: mockRunTransaction };

  return { getAdminDb: vi.fn(() => mockDb), mockCollection, mockDoc, mockRef, mockRunTransaction, mockTransaction, state };
});

const { serverTimestamp, timestampFromMillis } = vi.hoisted(() => ({
  serverTimestamp: Symbol("serverTimestamp"),
  timestampFromMillis: vi.fn((millis: number) => ({ millis })),
}));

vi.mock("@/lib/firebase-admin", () => ({ getAdminDb }));
vi.mock("firebase-admin/firestore", () => ({
  FieldValue: { serverTimestamp: vi.fn(() => serverTimestamp) },
  Timestamp: { fromMillis: timestampFromMillis },
}));

import { consumeAdminRequestRateLimit } from "@/lib/rate-limit/firestore";

describe("consumeAdminRequestRateLimit", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-08-05T12:00:00.000Z"));
    state.snapshot = { exists: false, data: () => undefined };
    vi.clearAllMocks();
    mockRunTransaction.mockImplementation(async (callback: (transaction: typeof mockTransaction) => unknown) =>
      callback(mockTransaction),
    );
    mockTransaction.get.mockImplementation(async () => state.snapshot);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("crea una ventana nueva con una clave derivada del UID", async () => {
    await expect(consumeAdminRequestRateLimit("uid-secreto")).resolves.toEqual({ allowed: true });

    expect(getAdminDb).toHaveBeenCalledOnce();
    expect(mockCollection).toHaveBeenCalledWith("rateLimits");
    expect(mockDoc).toHaveBeenCalledWith(
      "admin-request:46d97a6f8eb4ee98c548a871a26927e87fc491123a027e1200b58e6f3f825fd8",
    );
    const documentId = (mockDoc.mock.calls[0] as unknown[])[0] as string;
    expect(documentId).not.toContain("uid-secreto");
    expect(mockTransaction.set).toHaveBeenCalledWith(
      mockRef,
      {
        count: 1,
        windowStartedAt: Date.parse("2026-08-05T12:00:00.000Z"),
        expiresAt: { millis: Date.parse("2026-08-05T12:01:00.000Z") },
        updatedAt: serverTimestamp,
      },
      { merge: true },
    );
  });

  it("incrementa una ventana vigente mientras count es menor que cinco", async () => {
    vi.setSystemTime(new Date("2026-08-05T12:00:30.000Z"));
    state.snapshot = {
      exists: true,
      data: () => ({ count: 4, windowStartedAt: Date.parse("2026-08-05T12:00:00.000Z") }),
    };

    await expect(consumeAdminRequestRateLimit("uid-secreto")).resolves.toEqual({ allowed: true });

    expect(mockTransaction.update).toHaveBeenCalledWith(mockRef, {
      count: 5,
      expiresAt: { millis: Date.parse("2026-08-05T12:01:00.000Z") },
      updatedAt: serverTimestamp,
    });
  });

  it("bloquea la sexta solicitud y calcula Retry-After", async () => {
    vi.setSystemTime(new Date("2026-08-05T12:00:30.500Z"));
    state.snapshot = {
      exists: true,
      data: () => ({ count: 5, windowStartedAt: Date.parse("2026-08-05T12:00:00.000Z") }),
    };

    await expect(consumeAdminRequestRateLimit("uid-secreto")).resolves.toEqual({ allowed: false, retryAfter: 30 });

    expect(mockTransaction.update).not.toHaveBeenCalled();
    expect(mockTransaction.set).not.toHaveBeenCalled();
  });

  it("reinicia la ventana expirada", async () => {
    vi.setSystemTime(new Date("2026-08-05T12:01:00.000Z"));
    state.snapshot = {
      exists: true,
      data: () => ({ count: 5, windowStartedAt: Date.parse("2026-08-05T12:00:00.000Z") }),
    };

    await expect(consumeAdminRequestRateLimit("uid-secreto")).resolves.toEqual({ allowed: true });
    expect(mockTransaction.set).toHaveBeenCalledWith(
      mockRef,
      expect.objectContaining({ count: 1, windowStartedAt: Date.parse("2026-08-05T12:01:00.000Z") }),
      { merge: true },
    );
  });

  it("propaga el error del store para que la ruta aplique fail-closed", async () => {
    mockRunTransaction.mockRejectedValueOnce(new Error("firestore unavailable"));

    await expect(consumeAdminRequestRateLimit("uid-secreto")).rejects.toThrow("firestore unavailable");
  });

  it("rechaza un documento existente con un contador invalido", async () => {
    state.snapshot = {
      exists: true,
      data: () => ({ count: Number.NaN, windowStartedAt: Date.parse("2026-08-05T12:00:00.000Z") }),
    };

    await expect(consumeAdminRequestRateLimit("uid-secreto")).rejects.toThrow("Invalid rate limit document");
  });

  it("recalcula el reloj cuando Firestore reintenta la transaccion", async () => {
    vi.setSystemTime(new Date("2026-08-05T12:00:59.000Z"));
    let attempt = 0;
    mockRunTransaction.mockImplementation(async (callback: (transaction: typeof mockTransaction) => unknown) => {
      attempt += 1;
      if (attempt === 1) {
        state.snapshot = {
          exists: true,
          data: () => ({ count: 4, windowStartedAt: Date.parse("2026-08-05T12:00:00.000Z") }),
        };
        const firstResult = await callback(mockTransaction);
        vi.setSystemTime(new Date("2026-08-05T12:01:01.000Z"));
        state.snapshot = {
          exists: true,
          data: () => ({ count: 5, windowStartedAt: Date.parse("2026-08-05T12:00:00.000Z") }),
        };
        void firstResult;
        return callback(mockTransaction);
      }
      return callback(mockTransaction);
    });

    await expect(consumeAdminRequestRateLimit("uid-secreto")).resolves.toEqual({ allowed: true });
    expect(mockTransaction.set).toHaveBeenLastCalledWith(
      mockRef,
      expect.objectContaining({ count: 1, windowStartedAt: Date.parse("2026-08-05T12:01:01.000Z") }),
      { merge: true },
    );
  });

  it("serializa consumos concurrentes mediante transacciones", async () => {
    vi.setSystemTime(new Date("2026-08-05T12:00:30.000Z"));
    let stored = { count: 4, windowStartedAt: Date.parse("2026-08-05T12:00:00.000Z") };
    let queue: Promise<unknown> = Promise.resolve();

    mockRunTransaction.mockImplementation((callback: (transaction: typeof mockTransaction) => unknown) => {
      const run = queue.then(async () => {
        const transaction = {
          get: vi.fn(async () => ({ exists: true, data: () => stored })),
          set: vi.fn(),
          update: vi.fn((_ref: unknown, data: { count: number }) => {
            stored = { ...stored, count: data.count };
          }),
        } as typeof mockTransaction;

        return callback(transaction);
      });
      queue = run.then(() => undefined, () => undefined);
      return run;
    });

    const results = await Promise.all([
      consumeAdminRequestRateLimit("uid-secreto"),
      consumeAdminRequestRateLimit("uid-secreto"),
    ]);

    expect(results).toEqual([{ allowed: true }, { allowed: false, retryAfter: 30 }]);
    expect(stored.count).toBe(5);
    expect(mockRunTransaction).toHaveBeenCalledTimes(2);
  });
});
