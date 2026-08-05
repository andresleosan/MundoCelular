import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { Pedido } from "@/types";

const { useAuth, useConfig, listarPedidosCliente } = vi.hoisted(() => ({
  useAuth: vi.fn(),
  useConfig: vi.fn(),
  listarPedidosCliente: vi.fn(),
}));

vi.mock("@/hooks/useAuth", () => ({ useAuth }));
vi.mock("@/components/auth/ConfigProvider", () => ({ useConfig }));
vi.mock("@/lib/firestore/pedidos", () => ({ listarPedidosCliente }));

import { HistorialPedidos } from "@/components/cuenta/HistorialPedidos";

const pedido: Pedido = {
  id: "pedido-1",
  clienteUid: "cliente-1",
  clienteNombre: "Cliente Uno",
  clienteEmail: "cliente@example.com",
  clienteTelefono: "3000000000",
  items: [{ productoId: "p1", nombre: "iPhone 17", precioUnitario: 1000000, cantidad: 1, subtotal: 1000000 }],
  total: 1000000,
  entrega: { tipo: "domicilio", direccion: "Calle 1", barrio: "Centro" },
  ciudad: "Medellín",
  observaciones: "No llamar",
  estado: "contactado",
  creadoEn: new Date("2026-08-05T10:00:00Z"),
};

describe("HistorialPedidos", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useConfig.mockReturnValue({ whatsapp: "573147757223" });
    useAuth.mockReturnValue({ usuario: { uid: "cliente-1" }, cargando: false, esAdmin: false });
  });

  it("muestra acceso cuando no hay sesion", () => {
    useAuth.mockReturnValue({ usuario: null, cargando: false, esAdmin: false });

    render(<HistorialPedidos />);

    expect(screen.getByRole("link", { name: "Iniciar sesión" }).getAttribute("href")).toBe("/login");
    expect(listarPedidosCliente).not.toHaveBeenCalled();
  });

  it("muestra pedidos, abre el detalle y protege datos personales", async () => {
    listarPedidosCliente.mockResolvedValue({ pedidos: [pedido], cursor: null });
    const user = userEvent.setup();

    render(<HistorialPedidos />);

    await user.click(await screen.findByRole("button", { name: "Pedido #pedido-1" }));

    expect(screen.getByText("Entrega: Domicilio")).toBeDefined();
    expect(screen.getByText("Calle 1, Centro, Medellín")).toBeDefined();
    expect(screen.queryByText(pedido.clienteEmail)).toBeNull();
    expect(screen.queryByText(pedido.clienteTelefono!)).toBeNull();
    expect(screen.getByRole("link", { name: "Abrir conversación en WhatsApp" }).getAttribute("href"))
      .toContain("https://wa.me/573147757223?text=Hola%20Mundo%20Celular%2C%20necesito%20ayuda%20con%20el%20pedido%20%23pedido-1");
  });

  it("anexa la siguiente pagina al cargar mas", async () => {
    const segundoPedido = { ...pedido, id: "pedido-2", items: [{ ...pedido.items[0], nombre: "iPad" }] };
    listarPedidosCliente
      .mockResolvedValueOnce({ pedidos: [pedido], cursor: { id: "cursor-1" } })
      .mockResolvedValueOnce({ pedidos: [segundoPedido], cursor: null });
    const user = userEvent.setup();

    render(<HistorialPedidos />);

    await user.click(await screen.findByRole("button", { name: "Cargar más" }));

    expect(await screen.findByRole("button", { name: "Pedido #pedido-2" })).toBeDefined();
    expect(screen.getByRole("button", { name: "Pedido #pedido-1" })).toBeDefined();
  });

  it("permite reintentar cuando falla la lectura", async () => {
    listarPedidosCliente
      .mockRejectedValueOnce(new Error("Firestore interno"))
      .mockResolvedValueOnce({ pedidos: [], cursor: null });
    const user = userEvent.setup();

    render(<HistorialPedidos />);

    await user.click(await screen.findByRole("button", { name: "Reintentar" }));

    expect(await screen.findByText("Todavía no tienes pedidos")).toBeDefined();
    expect(screen.queryByText("Firestore interno")).toBeNull();
  });
});
