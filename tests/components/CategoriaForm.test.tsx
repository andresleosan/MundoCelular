import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { CategoriaForm } from "@/components/admin/CategoriaForm";

vi.mock("@/lib/firestore/categorias", () => ({
  crearCategoria: vi.fn(),
  actualizarCategoria: vi.fn(),
}));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
}));

describe("CategoriaForm", () => {
  it("muestra error si el nombre está vacío", async () => {
    render(<CategoriaForm />);
    fireEvent.click(screen.getByRole("button", { name: /guardar/i }));
    expect(await screen.findByText("El nombre es obligatorio")).toBeInTheDocument();
  });

  it("muestra vista previa del slug mientras se escribe", () => {
    render(<CategoriaForm />);
    fireEvent.change(screen.getByLabelText(/nombre/i), { target: { value: "Electrodomésticos" } });
    expect(screen.getByText(/electrodomesticos/)).toBeInTheDocument();
  });
});
