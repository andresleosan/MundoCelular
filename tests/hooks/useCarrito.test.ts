import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useCarrito } from "@/hooks/useCarrito";

const mockProducto = {
  id: "prod-1",
  nombre: "iPhone 15 Pro",
  slug: "iphone-15-pro",
  descripcion: "Último modelo",
  precio: 4200000,
  stock: 5,
  categoriaId: "cat-1",
  marca: "Apple",
  specs: {},
  imagenes: [],
  activo: true,
  destacado: true,
};

const STORAGE_KEY = "mundocelular-carrito";

describe("useCarrito", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("inicia vacío", () => {
    const { result } = renderHook(() => useCarrito());
    expect(result.current.items).toEqual([]);
    expect(result.current.total).toBe(0);
  });

  it("agregar añade un producto", () => {
    const { result } = renderHook(() => useCarrito());
    act(() => {
      result.current.agregar(mockProducto);
    });
    expect(result.current.items).toHaveLength(1);
    expect(result.current.items[0].productoId).toBe("prod-1");
    expect(result.current.items[0].nombre).toBe("iPhone 15 Pro");
    expect(result.current.items[0].precio).toBe(4200000);
    expect(result.current.items[0].cantidad).toBe(1);
  });

  it("agregar del mismo producto incrementa cantidad", () => {
    const { result } = renderHook(() => useCarrito());
    act(() => {
      result.current.agregar(mockProducto);
    });
    act(() => {
      result.current.agregar(mockProducto);
    });
    expect(result.current.items).toHaveLength(1);
    expect(result.current.items[0].cantidad).toBe(2);
  });

  it("quitar elimina el producto", () => {
    const { result } = renderHook(() => useCarrito());
    act(() => {
      result.current.agregar(mockProducto);
    });
    act(() => {
      result.current.quitar("prod-1");
    });
    expect(result.current.items).toHaveLength(0);
  });

  it("cambiarCantidad actualiza cantidad", () => {
    const { result } = renderHook(() => useCarrito());
    act(() => {
      result.current.agregar(mockProducto);
    });
    act(() => {
      result.current.cambiarCantidad("prod-1", 5);
    });
    expect(result.current.items[0].cantidad).toBe(5);
  });

  it("cambiarCantidad a 0 elimina el producto", () => {
    const { result } = renderHook(() => useCarrito());
    act(() => {
      result.current.agregar(mockProducto);
    });
    act(() => {
      result.current.cambiarCantidad("prod-1", 0);
    });
    expect(result.current.items).toHaveLength(0);
  });

  it("vaciar limpia todos los items", () => {
    const { result } = renderHook(() => useCarrito());
    act(() => {
      result.current.agregar(mockProducto);
    });
    act(() => {
      result.current.agregar({
        ...mockProducto,
        id: "prod-2",
        nombre: "Samsung S24",
      });
    });
    act(() => {
      result.current.vaciar();
    });
    expect(result.current.items).toHaveLength(0);
  });

  it("total calcula la suma correcta", () => {
    const { result } = renderHook(() => useCarrito());
    act(() => {
      result.current.agregar(mockProducto, 2);
    });
    expect(result.current.total).toBe(8400000);
  });

  it("persiste en localStorage al agregar", () => {
    const { result, rerender } = renderHook(() => useCarrito());
    act(() => {
      result.current.agregar(mockProducto);
    });
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
    expect(stored).toHaveLength(1);
    expect(stored[0].productoId).toBe("prod-1");
  });

  it("carga desde localStorage al montar", () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify([
        {
          productoId: "prod-3",
          nombre: "Xiaomi 14",
          precio: 1200000,
          cantidad: 1,
        },
      ])
    );
    const { result } = renderHook(() => useCarrito());
    expect(result.current.items).toHaveLength(1);
    expect(result.current.items[0].nombre).toBe("Xiaomi 14");
  });
});