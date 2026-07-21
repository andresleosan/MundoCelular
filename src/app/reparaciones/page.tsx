import type { Metadata } from "next";
import Link from "next/link";
import { obtenerConfigTiendaServidor } from "@/lib/firestore/public";
import { metadataReparaciones } from "@/lib/seo/metadata";
import { jsonldReparaciones } from "@/lib/seo/jsonld";
import { JsonLd } from "@/components/seo/JsonLd";

export async function generateMetadata(): Promise<Metadata> {
  try {
    const config = await obtenerConfigTiendaServidor();
    return metadataReparaciones(config);
  } catch {
    return {
      title: "Reparaciones | Mundo Celular",
      description: "Reparación de celulares, tablets y consolas en Medellín.",
    };
  }
}

export default function ReparacionesPage() {
  return (
    <>
      <JsonLd data={jsonldReparaciones({
        nombre: "Mundo Celular",
        whatsapp: "573113554021",
        direccion: "Cra 36 # 38 - 33, Barrio El Salvador",
        ciudad: "Medellín",
        departamento: "Antioquia",
        pais: "Colombia",
        horario: "Lun-Sáb 9:00 AM - 7:00 PM",
        redes: {
          instagram: "https://instagram.com/mundo_celular_75",
          facebook: "https://facebook.com/Mundo.Celular.01",
          tiktok: "https://tiktok.com/@mundocelular75",
        },
      })} />
      <main className="mx-auto max-w-[800px] px-4 py-14 text-center">
      <h1 className="text-[28px] font-semibold tracking-[-0.03em] text-gray-900">
        Reparaciones
      </h1>
      <p className="mt-4 text-[16px] text-steel-blue-gray">
        Reparamos celulares, tablets y consolas. Diagnóstico gratis.
      </p>
      <p className="mt-2 text-[14px] text-steel-blue-gray">
        Visítanos en Cra 36 # 38 - 33, Barrio El Salvador, Medellín
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <a
          href="https://wa.me/573113554021"
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-full bg-mundo-blue px-6 py-3 text-[14px] font-semibold text-white shadow-lg-2"
        >
          Consultar por WhatsApp
        </a>
        <Link
          href="/"
          className="rounded-full border border-faint-border bg-white px-6 py-3 text-[14px] font-semibold text-gray-900 shadow-sm-2"
        >
          Ver productos
        </Link>
      </div>
    </main>
    </>
  );
}