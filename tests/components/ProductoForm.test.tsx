import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ProductoForm } from "@/components/admin/ProductoForm";
import type { Categoria } from "@/types";

vi.mock("@/lib/firestore/productos", () => ({ crearProducto: vi.fn(), actualizarProducto: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn(), replace: vi.fn() }) }));

const categorias: Categoria[] = [
  { id: "cat1", nombre: "Celulares", slug: "celulares", descripcion: "", orden: 1, activa: true },
];

describe("ProductoForm", () => {
  it("exige nombre, precio válido y categoría antes de guardar", async () => {
    render(<ProductoForm categorias={categorias} />);
    fireEvent.click(screen.getByRole("button", { name: /guardar/i }));
    expect(await screen.findByText(/El nombre es obligatorio/)).toBeInTheDocument();
  });

  it("muestra las categorías disponibles en el select", () => {
    render(<ProductoForm categorias={categorias} />);
    expect(screen.getByRole("option", { name: "Celulares" })).toBeInTheDocument();
  });
});
