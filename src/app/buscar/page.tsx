import { Suspense } from "react";
import type { Metadata } from "next";
import { obtenerConfigTiendaServidor } from "@/lib/firestore/public";
import { metadataBusqueda } from "@/lib/seo/metadata";
import { Buscador } from "./Buscador";

interface PageProps {
  searchParams: Promise<{ q?: string }>;
}

export async function generateMetadata({ searchParams }: PageProps): Promise<Metadata> {
  const { q } = await searchParams;
  try {
    const config = await obtenerConfigTiendaServidor();
    return metadataBusqueda(q || "", config);
  } catch {
    return {
      title: `Resultados para "${q || ""}" | Mundo Celular`,
      robots: { index: false },
    };
  }
}

export default function PaginaBuscar() {
  return (
    <Suspense fallback={<p className="px-4 py-10 text-steel-blue-gray">Cargando…</p>}>
      <Buscador />
    </Suspense>
  );
}