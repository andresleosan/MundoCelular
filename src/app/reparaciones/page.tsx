import type { Metadata } from "next";
import Link from "next/link";
import { obtenerConfigTiendaServidor } from "@/lib/firestore/public";
import { WHATSAPP_TIENDA } from "@/lib/config-tienda";
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

const SERVICIOS = [
  { nombre: "Cambio de pantalla", precio: "Desde $80.000", descripcion: "Pantallas originales y compatibles para todas las marcas." },
  { nombre: "Cambio de batería", precio: "Desde $50.000", descripcion: "Baterías de alta capacidad con garantía de 6 meses." },
  { nombre: "Reparación de software", precio: "Desde $30.000", descripcion: "Formateo, actualización, eliminación de virus y recuperación de datos." },
  { nombre: "Cambio de puerto de carga", precio: "Desde $60.000", descripcion: "Reparación de puertos USB-C, Lightning y micro-USB." },
  { nombre: "Desbloqueo de celular", precio: "Desde $40.000", descripcion: "Desbloqueo de operadores y patrones de seguridad." },
  { nombre: "Diagnóstico", precio: "GRATIS", descripcion: "Evaluación completa del estado de tu dispositivo sin compromiso." },
];

export default async function ReparacionesPage() {
  let config;
  try {
    config = await obtenerConfigTiendaServidor();
  } catch {
    config = null;
  }

  const whatsapp = config?.whatsapp ?? WHATSAPP_TIENDA;
  const direccion = config?.direccion ?? "Cra 36 # 38 - 33, Barrio El Salvador";
  const ciudad = config?.ciudad ?? "Medellín";
  const horario = config?.horario ?? "Lun-Sáb 9:00 AM - 7:00 PM";

  const whatsappMsg = encodeURIComponent("Hola Mundo Celular, necesito reparar mi celular");
  const whatsappLink = `https://wa.me/${whatsapp}?text=${whatsappMsg}`;

  return (
    <>
      {config && <JsonLd data={jsonldReparaciones(config)} />}
      <main className="mx-auto max-w-[800px] px-4 py-14">
        <h1 className="text-[28px] font-semibold tracking-[-0.03em] text-fog-white">
          Reparación de celulares en {ciudad}
        </h1>
        <p className="mt-4 text-[16px] text-fog-white/70">
          Reparamos celulares, tablets y consolas. Diagnóstico gratis y sin compromiso.
        </p>

        <section className="mt-8">
          <h2 className="text-[18px] font-semibold text-fog-white">Servicios</h2>
          <div className="mt-4 space-y-3">
            {SERVICIOS.map((s) => (
              <div key={s.nombre} className="flex items-start justify-between rounded-2xl bg-navy-surface/40 p-4 shadow-sm-2">
                <div>
                  <h3 className="text-[14px] font-semibold text-fog-white">{s.nombre}</h3>
                  <p className="mt-1 text-[13px] text-fog-white/70">{s.descripcion}</p>
                </div>
                <span className="ml-4 shrink-0 rounded-chips bg-glow-cyan/10 px-3 py-1 text-[12px] font-semibold text-glow-cyan">
                  {s.precio}
                </span>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-8 rounded-2xl bg-navy-surface/40 p-6 text-center">
          <p className="text-[14px] text-fog-white/70">{direccion}</p>
          <p className="mt-1 text-[14px] text-fog-white/70">{horario}</p>
        </section>

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <a
            href={whatsappLink}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-full bg-mundo-blue px-6 py-3 text-[14px] font-semibold text-white shadow-lg-2"
          >
            Consultar por WhatsApp
          </a>
          <Link
            href="/"
            className="rounded-full border border-fog-white/15 bg-navy-surface/40 px-6 py-3 text-[14px] font-semibold text-fog-white shadow-sm-2"
          >
            Ver productos
          </Link>
        </div>
      </main>
    </>
  );
}
