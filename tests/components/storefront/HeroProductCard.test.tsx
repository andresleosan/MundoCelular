import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { HeroProductCard } from "@/components/storefront/HeroProductCard";
import type { Producto } from "@/types";

const mockProducto: Producto = {
  id: "1",
  nombre: "iPhone 15 Pro",
  slug: "iphone-15-pro",
  precio: 4200000,
  imagenes: [{ url: "/test.jpg", alt: "iPhone 15 Pro", thumb: "/test-thumb.jpg" }],
  categoriaId: "cat1",
  marca: "Apple",
  descripcion: "Último modelo",
  specs: {},
  destacado: true,
  stock: 5,
  activo: true,
};

describe("HeroProductCard", () => {
  it("renderiza nombre del producto", () => {
    render(<HeroProductCard producto={mockProducto} categoriaSlug="celulares" />);
    expect(screen.getByText("iPhone 15 Pro")).toBeDefined();
  });

  it("renderiza precio formateado", () => {
    render(<HeroProductCard producto={mockProducto} categoriaSlug="celulares" />);
    expect(screen.getByText(/\$ 4\.200\.000/)).toBeDefined();
  });

  it("renderiza link al producto", () => {
    render(<HeroProductCard producto={mockProducto} categoriaSlug="celulares" />);
    const link = screen.getByRole("link");
    expect(link.getAttribute("href")).toBe("/producto/iphone-15-pro");
  });

  it("renderiza imagen con alt correcto", () => {
    render(<HeroProductCard producto={mockProducto} categoriaSlug="celulares" />);
    const img = screen.getByRole("img");
    expect(img.getAttribute("alt")).toBe("iPhone 15 Pro");
  });
});
