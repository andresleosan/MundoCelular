import type { Metadata } from "next";
import { CarritoResumen } from "@/components/carrito/CarritoResumen";

export const metadata: Metadata = {
  title: "Carrito | Mundo Celular",
  description: "Tu carrito de compras en Mundo Celular.",
  robots: { index: false },
};

export default function PaginaCarrito() {
  return (
    <main className="mx-auto max-w-[1200px] px-4 py-10">
      <h1 className="text-[24px] font-semibold tracking-[-0.03em] text-gray-900">
        Carrito
      </h1>
      <div className="mt-6">
        <CarritoResumen />
      </div>
    </main>
  );
}