import type { Metadata } from "next";
import { obtenerConfigTiendaServidor } from "@/lib/firestore/public";
import { metadataCarrito } from "@/lib/seo/metadata";
import { CarritoResumen } from "@/components/carrito/CarritoResumen";

export async function generateMetadata(): Promise<Metadata> {
  try {
    const config = await obtenerConfigTiendaServidor();
    return metadataCarrito(config);
  } catch {
    return {
      title: "Carrito | Mundo Celular",
      robots: { index: false },
    };
  }
}

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