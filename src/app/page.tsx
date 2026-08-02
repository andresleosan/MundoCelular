import type { Metadata } from "next";
import Link from "next/link";
import { listarCategoriasPublic, listarDestacados, obtenerConfigTiendaServidor } from "@/lib/firestore/public";
import { metadataInicio } from "@/lib/seo/metadata";
import { jsonldInicio } from "@/lib/seo/jsonld";
import { JsonLd } from "@/components/seo/JsonLd";
import { Hero } from "@/components/storefront/Hero";
import { MarcasSection } from "@/components/storefront/MarcasSection";
import { OfertasSection } from "@/components/storefront/OfertasSection";
import { BeneficiosSection } from "@/components/storefront/BeneficiosSection";
import { HeroProductCard } from "@/components/storefront/HeroProductCard";
import { BentoGrid } from "@/components/storefront/BentoGrid";
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

const REPARACIONES_BANNER_GRADIENT = "linear-gradient(135deg, var(--color-abyss-navy), var(--color-primary-dark))";

export default async function Home() {
  const [config, categorias, destacados] = await Promise.all([
    safeFetchConfig(),
    safeFetchCategorias(),
    safeFetchDestacados(),
  ]);

  const ofertas = destacados.slice(0, 3);
  const restantes = destacados.slice(3);
  const destacadoPrincipal = destacados[0] ?? null;

  return (
    <>
      <JsonLd data={jsonldInicio(config)} />

      <Hero config={config} productoDestacado={destacadoPrincipal} />

      <MarcasSection />

      <OfertasSection productos={ofertas} categorias={categorias} />

      <section id="categorias" className="mx-auto max-w-[1280px] px-4 py-16 sm:py-20" aria-label="Categorías">
        <div className="mb-8 text-center">
          <h2 className="font-inter-tight text-[24px] font-semibold tracking-[-0.02em] text-text sm:text-[32px]">
            Compra por categoría
          </h2>
        </div>
        <div className="mx-auto mb-12 max-w-2xl">
          <SearchInput />
        </div>
        <BentoGrid categorias={categorias} />
      </section>

      {restantes.length > 0 && (
        <section id="destacados" className="mx-auto max-w-[1280px] px-4 py-16 sm:py-20" aria-label="Más destacados">
          <div className="mb-10 text-center">
            <h2 className="font-inter-tight text-[24px] font-semibold tracking-[-0.02em] text-text sm:text-[32px]">
              Más productos destacados
            </h2>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {restantes.map((p) => {
              const catSlug = categorias.find((c) => c.id === p.categoriaId)?.slug ?? "";
              return <HeroProductCard key={p.id} producto={p} categoriaSlug={catSlug} />;
            })}
          </div>
        </section>
      )}

      <section className="mx-auto max-w-[1280px] px-4 py-16 sm:py-20" aria-label="Reparaciones">
        <div
          className="relative overflow-hidden rounded-cards px-6 py-12 text-center text-pure-white shadow-lg-2 sm:px-16 sm:py-20"
          style={{ background: REPARACIONES_BANNER_GRADIENT }}
        >
          <div className="relative z-10">
            <h2 className="font-inter-tight text-[24px] font-semibold tracking-[-0.02em] sm:text-[28px]">
              ¿Necesitas reparar tu celular?
            </h2>
            <p className="mx-auto mt-3 max-w-[500px] text-[15px] text-cool-frost sm:text-[16px]">
              Servicio técnico profesional. Diagnóstico gratis y repuestos originales.
            </p>
            <Link
              href="/reparaciones"
              className="mt-6 inline-flex h-11 items-center justify-center rounded-xl bg-pure-white px-6 text-[14px] font-semibold text-text transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-white/40"
            >
              Ver servicios
            </Link>
          </div>
        </div>
      </section>

      <BeneficiosSection />
    </>
  );
}