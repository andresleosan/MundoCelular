import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ProductDetail } from "@/components/producto/ProductDetail";
import { useCarrito } from "@/hooks/useCarrito";

vi.mock("@/hooks/useCarrito", () => ({
  useCarrito: vi.fn(),
}));

const mockUseCarrito = vi.mocked(useCarrito);

const mockProducto = {
  id: "1",
  nombre: "iPhone 15 Pro",
  slug: "iphone-15-pro",
  descripcion: "El último flagship de Apple.",
  precio: 4200000,
  stock: 5,
  categoriaId: "cat1",
  marca: "Apple",
  specs: { Pantalla: '6.7" OLED', Chip: "A17 Pro", RAM: "8GB" },
  imagenes: [
    { url: "https://example.com/img.jpg", alt: "iPhone 15 Pro", thumb: "https://example.com/thumb.jpg" },
  ],
  activo: true,
  destacado: true,
};

const mockCategoria = {
  id: "cat1",
  nombre: "Celulares",
  slug: "celulares",
  descripcion: "Teléfonos móviles",
  orden: 1,
  activa: true,
};

describe("ProductDetail", () => {
  beforeEach(() => {
    mockUseCarrito.mockReturnValue({
      items: [],
      agregar: vi.fn(),
      quitar: vi.fn(),
      cambiarCantidad: vi.fn(),
      vaciar: vi.fn(),
      total: 0,
    });
  });

  it("renderiza nombre del producto", () => {
    render(
      <ProductDetail producto={mockProducto} categoria={mockCategoria} />
    );
    expect(screen.getByText("iPhone 15 Pro")).toBeDefined();
  });

  it("renderiza precio formateado", () => {
    render(
      <ProductDetail producto={mockProducto} categoria={mockCategoria} />
    );
    expect(screen.getByText(/\$ 4\.200\.000/)).toBeDefined();
  });

  it("renderiza marca", () => {
    render(
      <ProductDetail producto={mockProducto} categoria={mockCategoria} />
    );
    expect(screen.getByText(/Marca: Apple/)).toBeDefined();
  });

  it("renderiza stock disponible", () => {
    render(
      <ProductDetail producto={mockProducto} categoria={mockCategoria} />
    );
    expect(screen.getByText(/Disponible: 5/)).toBeDefined();
  });

  it("renderiza 'Agotado' si stock es 0", () => {
    render(
      <ProductDetail
        producto={{ ...mockProducto, stock: 0 }}
        categoria={mockCategoria}
      />
    );
    expect(screen.getByText("Agotado")).toBeDefined();
  });

  it("renderiza descripción", () => {
    render(
      <ProductDetail producto={mockProducto} categoria={mockCategoria} />
    );
    expect(screen.getByText(mockProducto.descripcion)).toBeDefined();
  });

  it("renderiza especificaciones", () => {
    render(
      <ProductDetail producto={mockProducto} categoria={mockCategoria} />
    );
    expect(screen.getByText('6.7" OLED')).toBeDefined();
    expect(screen.getByText("A17 Pro")).toBeDefined();
    expect(screen.getByText("8GB")).toBeDefined();
  });

  it("renderiza botón WhatsApp con link correcto", () => {
    render(
      <ProductDetail producto={mockProducto} categoria={mockCategoria} />
    );
    const waBtn = screen.getByText("Comprar por WhatsApp");
    expect(waBtn).toBeDefined();
    const link = waBtn.closest("a");
    expect(link?.getAttribute("href")).toContain("https://wa.me/573147757223");
    expect(link?.getAttribute("target")).toBe("_blank");
  });

  it("no muestra botón Agregar si stock es 0", () => {
    render(
      <ProductDetail
        producto={{ ...mockProducto, stock: 0 }}
        categoria={mockCategoria}
      />
    );
    expect(screen.queryByText("Agregar al carrito")).toBeNull();
  });

  it("llama agregar al hacer click en Agregar al carrito", async () => {
    const agregarMock = vi.fn();
    mockUseCarrito.mockReturnValue({
      items: [],
      agregar: agregarMock,
      quitar: vi.fn(),
      cambiarCantidad: vi.fn(),
      vaciar: vi.fn(),
      total: 0,
    });

    const user = userEvent.setup();
    render(
      <ProductDetail producto={mockProducto} categoria={mockCategoria} />
    );
    const btn = screen.getByText("Agregar al carrito");
    await user.click(btn);
    expect(agregarMock).toHaveBeenCalledTimes(1);
    expect(agregarMock).toHaveBeenCalledWith(mockProducto);
  });

  it("renderiza píldora de categoría como link", () => {
    render(
      <ProductDetail producto={mockProducto} categoria={mockCategoria} />
    );
    const pill = screen.getByText("Celulares");
    const link = pill.closest("a");
    expect(link?.getAttribute("href")).toBe("/categoria/celulares");
  });

  describe("con variantes", () => {
    const productoConVariantes = {
      ...mockProducto,
      tieneVariantes: true,
      atributosDisponibles: ["Color", "Capacidad"],
    };

    it("muestra selectores de atributos cuando tiene variantes", () => {
      render(
        <ProductDetail
          producto={productoConVariantes}
          categoria={mockCategoria}
          variantes={[
            {
              id: "v1",
              productId: "1",
              attributes: { Color: "Negro", Capacidad: "128GB" },
              precio: 4200000,
              stock: 5,
              imagenes: [],
              activo: true,
            },
          ]}
        />
      );
      expect(screen.getByText("Color")).toBeDefined();
      expect(screen.getByText("Capacidad")).toBeDefined();
    });

    it("no muestra selectores cuando tieneVariantes es false", () => {
      render(
        <ProductDetail
          producto={mockProducto}
          categoria={mockCategoria}
          variantes={[]}
        />
      );
      expect(screen.queryByText("Color")).toBeNull();
      expect(screen.queryByText("Capacidad")).toBeNull();
    });
  });
});
