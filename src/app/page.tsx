import type { Metadata } from "next";
import Link from "next/link";
import { listarProductosActivos, obtenerConfigTiendaServidor } from "@/lib/firestore/public";
import { resumirMarcas } from "@/lib/storefront/brands";
import { separarProductosHome } from "@/lib/storefront/home";
import { metadataInicio } from "@/lib/seo/metadata";
import { jsonldInicio } from "@/lib/seo/jsonld";
import { CONFIG_TIENDA_DEFAULT } from "@/lib/config-tienda";
import { JsonLd } from "@/components/seo/JsonLd";
import { Hero } from "@/components/storefront/Hero";
import { MarcasSection } from "@/components/storefront/MarcasSection";
import { OfertasSection } from "@/components/storefront/OfertasSection";
import { NuevosProductosSection } from "@/components/storefront/NuevosProductosSection";
import { DiagnosticPanel } from "@/components/storefront/tech-lab/DiagnosticPanel";
import { RepairJourney } from "@/components/storefront/tech-lab/RepairJourney";
import { TechCenterSection } from "@/components/storefront/tech-lab/TechCenterSection";
import { TechLabNarrative } from "@/components/storefront/tech-lab/TechLabNarrative";
import type { Producto, ConfigTienda } from "@/types";

export const revalidate = 3600;

const FALLBACK_CONFIG: ConfigTienda = CONFIG_TIENDA_DEFAULT;

async function safeFetchConfig(): Promise<ConfigTienda> {
  try {
    return await obtenerConfigTiendaServidor();
  } catch {
    return FALLBACK_CONFIG;
  }
}

type ResultadoProductosHome =
  | { productos: Producto[]; error: false }
  | { productos: []; error: true };

async function safeFetchProductos(): Promise<ResultadoProductosHome> {
  try {
    return { productos: await listarProductosActivos(), error: false };
  } catch {
    return { productos: [], error: true };
  }
}

export async function generateMetadata(): Promise<Metadata> {
  const config = await safeFetchConfig();
  return metadataInicio(config);
}

export default async function Home() {
  const [config, resultadoProductos] = await Promise.all([
    safeFetchConfig(),
    safeFetchProductos(),
  ]);
  const { productos, error: errorProductos } = resultadoProductos;
  const { destacados, nuevos } = separarProductosHome(productos);
  const marcas = resumirMarcas(productos);

  return (
    <>
      <JsonLd data={jsonldInicio(config)} />

      <TechLabNarrative>
        <Hero config={config} />

        {errorProductos ? (
          <div
            role="status"
            aria-live="polite"
            className="mx-auto max-w-[1200px] px-4 py-12 text-center text-[15px] text-fog-white/70 sm:py-16"
          >
            El catalogo no esta disponible temporalmente.
          </div>
        ) : (
          <>
            <MarcasSection marcas={marcas} />
            <OfertasSection productos={destacados} />
            <NuevosProductosSection productos={nuevos} />
          </>
        )}

        <TechCenterSection />
        <DiagnosticPanel />
        <RepairJourney />

        <section className="bg-navy-base" aria-label="Reparaciones">
          <div className="mx-auto max-w-[1200px] px-4 py-12 sm:py-16">
            <div className="rounded-cards bg-navy-deep px-6 py-10 text-center text-fog-white sm:px-16">
              <h2 className="font-inter-tight text-[24px] font-semibold tracking-[-0.02em] sm:text-[28px]">
                ¿Necesitas reparar tu celular?
              </h2>
              <p className="mx-auto mt-3 max-w-[500px] text-[15px] text-fog-white/70 sm:text-[16px]">
                Servicio técnico profesional. Diagnóstico gratis y repuestos originales.
              </p>
              <Link
                href="/reparaciones"
                className="mt-6 inline-flex h-11 items-center justify-center rounded-xl bg-glow-cyan px-6 text-[14px] font-semibold text-navy-deep transition-all duration-200 hover:-translate-y-0.5 hover:shadow-cyan-glow focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-glow-cyan/40"
              >
                Ver servicios
              </Link>
            </div>
          </div>
        </section>
      </TechLabNarrative>
    </>
  );
}
