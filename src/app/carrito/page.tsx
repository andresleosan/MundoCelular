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
    <main className="mx-auto max-w-[1280px] px-4 py-8 sm:py-12">
      <h1 className="mb-8 font-inter-tight text-[28px] font-bold tracking-[-0.03em] text-text sm:text-[32px]">
        Carrito
      </h1>
      <CarritoResumen />
    </main>
  );
}