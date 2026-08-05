import { beforeEach, describe, expect, it, vi } from "vitest";

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

function snap(id: string) {
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
  };
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
    const ultimo = snap("pedido-1");
    firestore.getDocs.mockResolvedValue({ docs: [snap("pedido-2"), ultimo] });

    const result = await listarPedidosCliente("cliente-1");

    expect(firestore.where).toHaveBeenCalledWith("clienteUid", "==", "cliente-1");
    expect(firestore.orderBy).toHaveBeenCalledWith("creadoEn", "desc");
    expect(firestore.limit).toHaveBeenCalledWith(10);
    expect(result.pedidos.map((pedido) => pedido.id)).toEqual(["pedido-2", "pedido-1"]);
    expect(result.cursor).toBe(ultimo);
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
