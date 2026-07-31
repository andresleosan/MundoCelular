import { useState, useEffect, useCallback } from "react";
import type { Producto } from "@/types";

interface CartItemLocal {
  productoId: string;
  nombre: string;
  precio: number;
  cantidad: number;
  varianteId?: string;
  atributos?: Record<string, string>;
}

interface UseCarritoReturn {
  items: CartItemLocal[];
  agregar: (producto: Producto, cantidad?: number, varianteId?: string, atributos?: Record<string, string>) => void;
  quitar: (productoId: string, varianteId?: string) => void;
  cambiarCantidad: (productoId: string, cantidad: number, varianteId?: string) => void;
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

function claveItem(productoId: string, varianteId?: string): string {
  return `${productoId}__${varianteId ?? ""}`;
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

  const agregar = useCallback(
    (producto: Producto, cantidad = 1, varianteId?: string, atributos?: Record<string, string>) => {
      setItems((prev) => {
        const k = claveItem(producto.id, varianteId);
        const found = prev.find((i) => claveItem(i.productoId, i.varianteId) === k);
        if (found) {
          return prev.map((i) =>
            claveItem(i.productoId, i.varianteId) === k
              ? { ...i, cantidad: i.cantidad + cantidad }
              : i
          );
        }
        return [
          ...prev,
          {
            productoId: producto.id,
            nombre: producto.nombre,
            precio: producto.precio,
            cantidad,
            varianteId,
            atributos,
          },
        ];
      });
    },
    []
  );

  const quitar = useCallback((productoId: string, varianteId?: string) => {
    setItems((prev) =>
      prev.filter((i) => claveItem(i.productoId, i.varianteId) !== claveItem(productoId, varianteId))
    );
  }, []);

  const cambiarCantidad = useCallback(
    (productoId: string, cantidad: number, varianteId?: string) => {
      setItems((prev) =>
        cantidad <= 0
          ? prev.filter((i) => claveItem(i.productoId, i.varianteId) !== claveItem(productoId, varianteId))
          : prev.map((i) =>
              claveItem(i.productoId, i.varianteId) === claveItem(productoId, varianteId)
                ? { ...i, cantidad }
                : i
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