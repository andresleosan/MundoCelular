import { useState, useEffect, useCallback } from "react";
import type { Producto } from "@/types";

interface CartItemLocal {
  productoId: string;
  nombre: string;
  precio: number;
  cantidad: number;
}

interface UseCarritoReturn {
  items: CartItemLocal[];
  agregar: (producto: Producto, cantidad?: number) => void;
  quitar: (productoId: string) => void;
  cambiarCantidad: (productoId: string, cantidad: number) => void;
  vaciar: () => void;
  total: number;
}

const STORAGE_KEY = "mundocelular-carrito";

function cargarDesdeStorage(): CartItemLocal[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as CartItemLocal[]) : [];
  } catch {
    return [];
  }
}

function guardarEnStorage(items: CartItemLocal[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    // cuota llena o storage no disponible
  }
}

export function useCarrito(): UseCarritoReturn {
  const [items, setItems] = useState<CartItemLocal[]>([]);
  const [inicializado, setInicializado] = useState(false);

  useEffect(() => {
    setItems(cargarDesdeStorage());
    setInicializado(true);
  }, []);

  useEffect(() => {
    if (!inicializado) return;
    guardarEnStorage(items);
  }, [items, inicializado]);

  const agregar = useCallback((producto: Producto, cantidad = 1) => {
    setItems((prev) => {
      const found = prev.find((i) => i.productoId === producto.id);
      if (found) {
        return prev.map((i) =>
          i.productoId === producto.id
            ? { ...i, cantidad: i.cantidad + cantidad }
            : i
        );
      }
      return [...prev, { productoId: producto.id, nombre: producto.nombre, precio: producto.precio, cantidad }];
    });
  }, []);

  const quitar = useCallback((productoId: string) => {
    setItems((prev) => prev.filter((i) => i.productoId !== productoId));
  }, []);

  const cambiarCantidad = useCallback(
    (productoId: string, cantidad: number) => {
      setItems((prev) =>
        cantidad <= 0
          ? prev.filter((i) => i.productoId !== productoId)
          : prev.map((i) =>
              i.productoId === productoId ? { ...i, cantidad } : i
            )
      );
    },
    []
  );

  const vaciar = useCallback(() => {
    setItems([]);
  }, []);

  const total = items.reduce((sum, i) => sum + i.precio * i.cantidad, 0);

  return { items, agregar, quitar, cambiarCantidad, vaciar, total };
}