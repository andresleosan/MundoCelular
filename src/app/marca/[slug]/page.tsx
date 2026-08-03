import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  listarProductosActivos,
  obtenerConfigTiendaServidor,
} from "@/lib/firestore/public";
import { filtrarProductosPorMarca, resumirMarcas } from "@/lib/storefront/brands";
import { metadataMarca } from "@/lib/seo/metadata";
import { ProductGrid } from "@/components/storefront/ProductGrid";

export const revalidate = 3600;

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  try {
    const marcas = resumirMarcas(await listarProductosActivos());
    return marcas.map((marca) => ({ slug: marca.slug }));
  } catch {
    return [];
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const marcas = resumirMarcas(await listarProductosActivos());
  const marca = marcas.find((item) => item.slug === slug);
  if (!marca) return { title: "Marca no encontrada" };

  const config = await obtenerConfigTiendaServidor();
  return metadataMarca(marca.nombre, marca.slug, marca.cantidad, config);
}

export default async function PaginaMarca({ params }: PageProps) {
  const { slug } = await params;
  const productos = await listarProductosActivos();
  const marca = resumirMarcas(productos).find((item) => item.slug === slug);
  if (!marca) notFound();

  const productosMarca = filtrarProductosPorMarca(productos, marca.slug);

  return (
    <main className="mx-auto max-w-[1200px] px-4 py-10">
      <h1 className="text-[28px] font-semibold tracking-[-0.03em] text-fog-white">
        Productos {marca.nombre}
      </h1>
      <p className="mt-2 text-[14px] text-fog-white/70">
        {marca.cantidad} {marca.cantidad === 1 ? "producto" : "productos"}
      </p>
      <div className="mt-8">
        <ProductGrid
          productos={productosMarca}
          categoriaNombre=""
          categoriaSlug="producto"
        />
      </div>
    </main>
  );
}
