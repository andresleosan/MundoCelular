import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getProductoPorId, getCategoriaPorId, getTodosLosProductos, obtenerConfigTiendaServidor } from "@/lib/firestore/public";
import { metadataProducto } from "@/lib/seo/metadata";
import { ProductDetail } from "@/components/producto/ProductDetail";

export const revalidate = 3600;

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  try {
    const productos = await getTodosLosProductos();
    return productos.filter((p) => p.slug).map((p) => ({ slug: p.slug }));
  } catch {
    return [];
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const prod = await getProductoPorId(slug);
  if (!prod) return { title: "Producto no encontrado" };
  const cat = await getCategoriaPorId(prod.categoriaId);
  const config = await obtenerConfigTiendaServidor();
  return metadataProducto(prod, cat ?? undefined, config);
}

export default async function PaginaProducto({ params }: PageProps) {
  const { slug } = await params;
  const prod = await getProductoPorId(slug);
  if (!prod) notFound();
  const cat = await getCategoriaPorId(prod.categoriaId);
  if (!cat) notFound();

  return (
    <main className="mx-auto max-w-[1200px] px-4 py-10">
      <nav className="text-[12px] text-steel-blue-gray">
        <a href="/">Inicio</a> /{" "}
        {cat && <a href={`/categoria/${cat.slug}`}>{cat.nombre}</a>} /{" "}
        {prod.nombre}
      </nav>
      <div className="mt-6 grid gap-8 lg:grid-cols-2">
        <ProductDetail producto={prod} categoria={cat} />
      </div>
    </main>
  );
}