import type { Metadata } from "next";
import Link from "next/link";
import { listarCategoriasPublic, obtenerConfigTiendaServidor } from "@/lib/firestore/public";
import { metadataInicio } from "@/lib/seo/metadata";
import { CategorySectionHeader } from "@/components/storefront/CategorySectionHeader";

export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
  try {
    const config = await obtenerConfigTiendaServidor();
    return { ...metadataInicio(config), title: `Categorías - ${config.nombre ?? "Mundo Celular"}` };
  } catch {
    return { title: "Categorías - Mundo Celular" };
  }
}

export default async function PaginaCategorias() {
  try {
    const categorias = await listarCategoriasPublic();
    return (
      <main className="mx-auto max-w-[1200px] px-4 py-10">
        <h1 className="text-[26px] font-semibold tracking-[-0.03em]">Categorías</h1>
        <div className="mt-6 grid gap-2">
          {categorias.map((c) => (
            <Link
              key={c.id}
              href={`/categoria/${c.slug}`}
              className="flex items-center gap-3 rounded-chips border border-faint-border bg-pure-white px-4 py-3 text-[15px] text-navy-deep shadow-sm hover:shadow-sm-2"
            >
              <span className="text-mundo-blue">●</span>
              {c.nombre}
              {c.descripcion ? (
                <span className="text-[12px] text-steel-blue-gray"> — {c.descripcion}</span>
              ) : null}
            </Link>
          ))}
          {categorias.length === 0 && (
            <p className="text-[14px] text-steel-blue-gray">No hay categorías disponibles todavía.</p>
          )}
        </div>
      </main>
    );
  } catch {
    return (
      <main className="mx-auto max-w-[1200px] px-4 py-10">
        <CategorySectionHeader titulo="Categorías" />
        <p className="mt-4 text-[14px] text-steel-blue-gray">
          No se pudieron cargar las categorías. Intenta de nuevo más tarde.
        </p>
      </main>
    );
  }
}