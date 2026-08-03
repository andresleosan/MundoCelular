import type { Metadata } from "next";
import Link from "next/link";
import { listarProductosActivos, obtenerConfigTiendaServidor } from "@/lib/firestore/public";
import { completarMarcasParaHome, resumirMarcas } from "@/lib/storefront/brands";
import { separarProductosHome } from "@/lib/storefront/home";
import { metadataInicio } from "@/lib/seo/metadata";
import { jsonldInicio } from "@/lib/seo/jsonld";
import { JsonLd } from "@/components/seo/JsonLd";
import { Hero } from "@/components/storefront/Hero";
import { MarcasSection } from "@/components/storefront/MarcasSection";
import { OfertasSection } from "@/components/storefront/OfertasSection";
import { NuevosProductosSection } from "@/components/storefront/NuevosProductosSection";
import { BeneficiosSection } from "@/components/storefront/BeneficiosSection";
import type { Producto, ConfigTienda } from "@/types";

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

async function safeFetchProductos(): Promise<Producto[]> {
  try {
    return await listarProductosActivos();
  } catch {
    return [];
  }
}

export async function generateMetadata(): Promise<Metadata> {
  const config = await safeFetchConfig();
  return metadataInicio(config);
}

export default async function Home() {
  const [config, productos] = await Promise.all([
    safeFetchConfig(),
    safeFetchProductos(),
  ]);
  const { destacados, nuevos } = separarProductosHome(productos);
  const marcas = completarMarcasParaHome(resumirMarcas(productos));

  return (
    <>
      <JsonLd data={jsonldInicio(config)} />

      <Hero config={config} />

      <MarcasSection marcas={marcas} />

      <OfertasSection productos={destacados} />

      <NuevosProductosSection productos={nuevos} />

      <BeneficiosSection />

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
    </>
  );
}
