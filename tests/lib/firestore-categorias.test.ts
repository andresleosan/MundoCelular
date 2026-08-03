import { describe, it, expect, vi, beforeEach } from "vitest";

const mockGetDocs = vi.fn<(...args: unknown[]) => Promise<unknown>>();
const mockAddDoc = vi.fn<(...args: unknown[]) => Promise<{ id: string }>>(async () => ({ id: "cat-nueva" }));
const mockUpdateDoc = vi.fn<(...args: unknown[]) => Promise<void>>(async () => {});
const mockGetDb = vi.fn(() => ({}));

vi.mock("firebase/firestore", () => ({
  collection: vi.fn(() => ({ path: "categorias" })),
  query: vi.fn(() => ({})),
  orderBy: vi.fn((f: string, dir?: string) => ({ fieldPath: f, directionStr: dir })),
  limit: vi.fn((n: number) => ({ n })),
  getDocs: (...args: unknown[]) => mockGetDocs(...args),
  addDoc: (...args: unknown[]) => mockAddDoc(...args),
  updateDoc: (...args: unknown[]) => mockUpdateDoc(...args),
  deleteDoc: vi.fn(async () => {}),
  doc: vi.fn(() => ({ path: "categorias/x" })),
  where: vi.fn(() => ({})),
}));

vi.mock("@/lib/firebase", () => ({
  getDb: () => mockGetDb(),
  auth: null,
}));

vi.mock("@/lib/revalidate", () => ({
  avisarRevalidacion: vi.fn(async () => {}),
}));

import { crearCategoria, actualizarCategoria } from "@/lib/firestore/categorias";

const input = { nombre: "Accesorios", descripcion: "Todo en accesorios", activa: true };

describe("crearCategoria", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetDocs.mockResolvedValue({ docs: [], empty: true });
  });

  it("asigna orden 1 cuando no hay categorías", async () => {
    await crearCategoria(input);
    expect(mockAddDoc).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ orden: 1 })
    );
  });

  it("asigna max(orden) + 1 cuando existen categorías", async () => {
    mockGetDocs
      .mockResolvedValueOnce({ docs: [], empty: true })
      .mockResolvedValueOnce({ docs: [{ data: () => ({ orden: 5 }) }], empty: false });
    await crearCategoria(input);
    expect(mockAddDoc).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ orden: 6 })
    );
  });
});

describe("actualizarCategoria", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("no incluye orden en el update", async () => {
    await actualizarCategoria("c1", input);
    const payload = mockUpdateDoc.mock.calls[0][1] as Record<string, unknown>;
    expect(payload).not.toHaveProperty("orden");
  });
});
