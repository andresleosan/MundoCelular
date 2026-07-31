import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ProductoForm } from "@/components/admin/ProductoForm";
import type { Categoria } from "@/types";

vi.mock("@/lib/firestore/productos", () => ({ crearProducto: vi.fn(), actualizarProducto: vi.fn() }));
vi.mock("@/lib/firestore/variantes", () => ({
  crearVariante: vi.fn().mockResolvedValue("v-new"),
  actualizarVariante: vi.fn(),
  eliminarVariante: vi.fn(),
  listarVariantesPorProducto: vi.fn().mockResolvedValue([]),
}));
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

  it("incluye switch de variantes", () => {
    render(<ProductoForm categorias={categorias} />);
    expect(screen.getByLabelText(/tiene variantes/i)).toBeInTheDocument();
  });

  it("muestra input de atributos al activar variantes", () => {
    render(<ProductoForm categorias={categorias} />);
    const switchEl = screen.getByLabelText(/tiene variantes/i);
    expect(screen.queryByLabelText(/atributos disponibles/i)).not.toBeInTheDocument();
    fireEvent.click(switchEl);
    expect(screen.getByLabelText(/atributos disponibles/i)).toBeInTheDocument();
  });
});
