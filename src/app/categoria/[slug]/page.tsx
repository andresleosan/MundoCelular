import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getCategoriaPorSlug,
  listarProductosCategoria,
  listarCategoriasPublic,
  obtenerConfigTiendaServidor,
} from "@/lib/firestore/public";
import { metadataCategoria } from "@/lib/seo/metadata";
import { jsonldCategoria } from "@/lib/seo/jsonld";
import { JsonLd } from "@/components/seo/JsonLd";
import { CategoryHeader } from "@/components/storefront/CategoryHeader";
import { ProductGrid } from "@/components/storefront/ProductGrid";

export const revalidate = 3600;

export async function generateStaticParams() {
  try {
    const cats = await listarCategoriasPublic();
    return cats.map((c) => ({ slug: c.slug }));
  } catch {
    return [];
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const [cat, config] = await Promise.all([
    getCategoriaPorSlug(slug),
    obtenerConfigTiendaServidor(),
  ]);
  if (!cat) return { title: "Categoría no encontrada" };
  return metadataCategoria(cat, config);
}

export default async function PaginaCategoria({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const cat = await getCategoriaPorSlug(slug);
  if (!cat) notFound();

  const productos = await listarProductosCategoria(cat.id);

  return (
    <main className="mx-auto max-w-[1200px] px-4 py-10">
      <JsonLd data={jsonldCategoria(cat, productos)} />

      <nav className="text-[12px] text-fog-white/60">
        <Link href="/" className="hover:text-glow-cyan">
          Inicio
        </Link>{" "}
        / {cat.nombre}
      </nav>

      <div className="mt-4">
        <CategoryHeader nombre={cat.nombre} descripcion={cat.descripcion} />
      </div>

      <div className="mt-8">
        {productos.length === 0 ? (
          <p className="text-[14px] text-steel-blue-gray">
            No hay productos en esta categoría todavía.
          </p>
        ) : (
          <ProductGrid
            productos={productos}
            categoriaNombre={cat.nombre}
            categoriaSlug={cat.slug}
          />
        )}
      </div>
    </main>
  );
}
