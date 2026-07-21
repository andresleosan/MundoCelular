import type { Metadata } from "next";
import { listarCategoriasPublic, listarDestacados, obtenerConfigTiendaServidor } from "@/lib/firestore/public";
import { metadataInicio } from "@/lib/seo/metadata";
import { jsonldInicio } from "@/lib/seo/jsonld";
import { JsonLd } from "@/components/seo/JsonLd";
import { Hero } from "@/components/storefront/Hero";
import { CategoryPill } from "@/components/storefront/CategoryPill";
import { HeroProductCard } from "@/components/storefront/HeroProductCard";
import { CategorySectionHeader } from "@/components/storefront/CategorySectionHeader";
import { SearchInput } from "@/components/storefront/SearchInput";
import type { Categoria, Producto, ConfigTienda } from "@/types";

export const revalidate = 3600;

const FALLBACK_CONFIG: ConfigTienda = {
  nombre: "Mundo Celular",
  whatsapp: "573113554021",
  direccion: "",
  ciudad: "Medellín",
  departamento: "Antioquia",
  pais: "CO",
  horario: "",
  redes: { instagram: "", facebook: "", tiktok: "" },
};

async function safeFetchConfig(): Promise<ConfigTienda> {
  try {
    return await obtenerConfigTiendaServidor();
  } catch {
    return FALLBACK_CONFIG;
  }
}

async function safeFetchCategorias(): Promise<Categoria[]> {
  try {
    return await listarCategoriasPublic();
  } catch {
    return [];
  }
}

async function safeFetchDestacados(): Promise<Producto[]> {
  try {
    return await listarDestacados();
  } catch {
    return [];
  }
}

export async function generateMetadata(): Promise<Metadata> {
  const config = await safeFetchConfig();
  return metadataInicio(config);
}

export default async function Home() {
  const [config, categorias, destacados] = await Promise.all([
    safeFetchConfig(),
    safeFetchCategorias(),
    safeFetchDestacados(),
  ]);
  return (
    <main className="mx-auto max-w-[1200px] px-4 py-10">
      <JsonLd data={jsonldInicio(config)} />

      <Hero config={config} />

      <section className="mt-10">
        <SearchInput />
      </section>

      <section className="mt-10">
        <CategorySectionHeader titulo="Categorías" />
        <div className="flex flex-wrap gap-2">
          {categorias.map((c) => (
            <CategoryPill key={c.id} nombre={c.nombre} slug={c.slug} icono={<span>●</span>} />
          ))}
        </div>
      </section>

      {destacados.length > 0 && (
        <section className="mt-12">
          <CategorySectionHeader titulo="Destacados" />
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {destacados.map((p) => {
              const catSlug = categorias.find((c) => c.id === p.categoriaId)?.slug ?? "";
              return <HeroProductCard key={p.id} producto={p} categoriaSlug={catSlug} />;
            })}
          </div>
        </section>
      )}
    </main>
  );
}
