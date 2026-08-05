import { beforeEach, describe, expect, it, vi } from "vitest";
import type { DocumentData, QueryDocumentSnapshot } from "firebase/firestore";

const firestore = vi.hoisted(() => ({
  collection: vi.fn(),
  doc: vi.fn(),
  getDoc: vi.fn(),
  getDocs: vi.fn(),
  limit: vi.fn(),
  orderBy: vi.fn(),
  query: vi.fn(),
  startAfter: vi.fn(),
  updateDoc: vi.fn(),
  where: vi.fn(),
}));

vi.mock("@/lib/firebase", () => ({ getDb: vi.fn(() => ({ id: "db" })) }));
vi.mock("firebase/firestore", () => firestore);

import { listarPedidosCliente } from "@/lib/firestore/pedidos";

function snap(id: string): QueryDocumentSnapshot<DocumentData> {
  return {
    id,
    data: () => ({
      clienteUid: "cliente-1",
      clienteNombre: "Cliente",
      clienteEmail: "cliente@example.com",
      items: [],
      total: 100000,
      entrega: { tipo: "retiro" },
      estado: "pendiente",
      creadoEn: new Date(),
    }),
  } as unknown as QueryDocumentSnapshot<DocumentData>;
}

describe("listarPedidosCliente", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    firestore.collection.mockReturnValue({ id: "pedidos" });
    firestore.where.mockReturnValue({ type: "where" });
    firestore.orderBy.mockReturnValue({ type: "order" });
    firestore.limit.mockReturnValue({ type: "limit" });
    firestore.query.mockReturnValue({ id: "query" });
  });

  it("consulta la primera pagina solo para el UID del cliente", async () => {
    const docs = Array.from({ length: 10 }, (_, i) => snap(`pedido-${i + 1}`));
    firestore.getDocs.mockResolvedValue({ docs });

    const result = await listarPedidosCliente("cliente-1");

    expect(firestore.where).toHaveBeenCalledWith("clienteUid", "==", "cliente-1");
    expect(firestore.orderBy).toHaveBeenCalledWith("creadoEn", "desc");
    expect(firestore.limit).toHaveBeenCalledWith(10);
    expect(result.pedidos.map((pedido) => pedido.id)).toEqual(Array.from({ length: 10 }, (_, i) => `pedido-${i + 1}`));
    expect(result.cursor).toBe(docs[9]);
  });

  it("devuelve cursor null cuando la pagina trae menos del limite", async () => {
    firestore.getDocs.mockResolvedValue({ docs: [snap("pedido-unico")] });

    const result = await listarPedidosCliente("cliente-1");

    expect(result.pedidos.map((pedido) => pedido.id)).toEqual(["pedido-unico"]);
    expect(result.cursor).toBeNull();
  });

  it("usa el cursor recibido para pedir la siguiente pagina", async () => {
    const cursor = snap("pedido-1");
    firestore.startAfter.mockReturnValue({ type: "cursor" });
    firestore.getDocs.mockResolvedValue({ docs: [] });

    const result = await listarPedidosCliente("cliente-1", cursor);

    expect(firestore.startAfter).toHaveBeenCalledWith(cursor);
    expect(result.pedidos).toEqual([]);
    expect(result.cursor).toBeNull();
  });
});
