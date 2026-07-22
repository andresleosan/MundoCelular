import { describe, it, expect } from "vitest";
import { armarmensajePedido, urlWhatsApp } from "@/lib/pedido";

describe("armarmensajePedido", () => {
  it("arma texto con items, total COP y datos de entrega", () => {
    const msg = armarmensajePedido({
      items: [
        { productoId: "p1", nombre: "iPhone 13", precioUnitario: 1850000, cantidad: 1, subtotal: 1850000 },
        { productoId: "p2", nombre: "Case iPhone 13", precioUnitario: 40000, cantidad: 2, subtotal: 80000 },
      ],
      total: 1930000,
      entrega: { tipo: "domicilio", direccion: "Cra 45 #12-30, El Poblado" },
      clienteNombre: "Juan P\u00e9rez",
      pedidoId: "PED123",
    });
    expect(msg).toContain("iPhone 13");
    expect(msg).toContain("$ 1.930.000");
    expect(msg).toContain("Domicilio");
    expect(msg).toContain("Juan P\u00e9rez");
    expect(msg).toContain("PED123");
  });

  it("maneja retiro sin direcci\u00f3n", () => {
    const msg = armarmensajePedido({
      items: [{ productoId: "p1", nombre: "X", precioUnitario: 100000, cantidad: 1, subtotal: 100000 }],
      total: 100000,
      entrega: { tipo: "retiro" },
      clienteNombre: "Ana",
      pedidoId: "PED456",
    });
    expect(msg).toContain("Retiro en tienda");
    expect(msg).not.toContain("undefined");
  });
});

describe("urlWhatsApp", () => {
  it("codifica el mensaje con encodeURIComponent", () => {
    const u = urlWhatsApp("573113554021", "Hola, quiero: iPhone 13");
    expect(u).toContain("https://wa.me/573113554021?text=");
    expect(decodeURIComponent(u.split("text=")[1])).toContain("Hola");
  });
});
