import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { ProductCard } from "@/components/storefront/ProductCard";
import type { Producto } from "@/types";

const producto: Producto = {
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
};

describe("ProductCard", () => {
  it("enlaza al producto sin anteponer la categoría", () => {
    render(<ProductCard producto={producto} categoriaSlug="celulares" />);

    expect(screen.getByRole("link")).toHaveAttribute(
      "href",
      "/producto/iphone-17-pro-max",
    );
  });
});
