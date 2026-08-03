import { beforeEach, describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { NuevosProductosSection } from "@/components/storefront/NuevosProductosSection";
import type { Producto } from "@/types";

function producto(overrides: Partial<Producto> = {}): Producto {
  return {
    id: "p1",
    nombre: "iPhone 17 Pro Max",
    slug: "iphone-17-pro-max",
    descripcion: "Producto de prueba",
    precio: 5200000,
    stock: 2,
    categoriaId: "celulares",
    marca: "Apple",
    specs: {},
    imagenes: [],
    activo: true,
    destacado: false,
    ...overrides,
  };
}

describe("NuevosProductosSection", () => {
  beforeEach(() => {
    Object.defineProperty(window, "matchMedia", {
      configurable: true,
      value: () => ({ matches: true }),
    });
  });

  it("muestra el título y cada producto recibido", () => {
    render(
      <NuevosProductosSection
        productos={[
          producto(),
          producto({ id: "p2", nombre: "Galaxy S26", slug: "galaxy-s26" }),
        ]}
      />,
    );

    expect(screen.getByRole("heading", { name: "Nuevos productos" })).toBeInTheDocument();
    expect(screen.getByText("iPhone 17 Pro Max")).toBeInTheDocument();
    expect(screen.getByText("Galaxy S26")).toBeInTheDocument();
  });
});
