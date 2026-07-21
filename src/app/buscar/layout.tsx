import type { Metadata } from "next";
import { obtenerConfigTiendaServidor } from "@/lib/firestore/public";
import { metadataBusqueda } from "@/lib/seo/metadata";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}): Promise<Metadata> {
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

export default function BuscarLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}