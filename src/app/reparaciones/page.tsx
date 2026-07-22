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

  const whatsapp = config?.whatsapp ?? "573113554021";
  const direccion = config?.direccion ?? "Cra 36 # 38 - 33, Barrio El Salvador";
  const ciudad = config?.ciudad ?? "Medellín";
  const horario = config?.horario ?? "Lun-Sáb 9:00 AM - 7:00 PM";

  const whatsappMsg = encodeURIComponent("Hola Mundo Celular, necesito reparar mi celular");
  const whatsappLink = `https://wa.me/${whatsapp}?text=${whatsappMsg}`;

  return (
    <>
      {config && <JsonLd data={jsonldReparaciones(config)} />}
      <main className="mx-auto max-w-[800px] px-4 py-14">
        <h1 className="text-[28px] font-semibold tracking-[-0.03em] text-gray-900">
          Reparación de celulares en {ciudad}
        </h1>
        <p className="mt-4 text-[16px] text-steel-blue-gray">
          Reparamos celulares, tablets y consolas. Diagnóstico gratis y sin compromiso.
        </p>

        <section className="mt-8">
          <h2 className="text-[18px] font-semibold text-gray-900">Servicios</h2>
          <div className="mt-4 space-y-3">
            {SERVICIOS.map((s) => (
              <div key={s.nombre} className="flex items-start justify-between rounded-2xl bg-white p-4 shadow-sm-2">
                <div>
                  <h3 className="text-[14px] font-semibold text-gray-900">{s.nombre}</h3>
                  <p className="mt-1 text-[13px] text-steel-blue-gray">{s.descripcion}</p>
                </div>
                <span className="ml-4 shrink-0 rounded-chips bg-blue-wash px-3 py-1 text-[12px] font-semibold text-mundo-blue">
                  {s.precio}
                </span>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-8 rounded-2xl bg-canvas-frost p-6 text-center">
          <p className="text-[14px] text-steel-blue-gray">{direccion}</p>
          <p className="mt-1 text-[14px] text-steel-blue-gray">{horario}</p>
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
            className="rounded-full border border-faint-border bg-white px-6 py-3 text-[14px] font-semibold text-gray-900 shadow-sm-2"
          >
            Ver productos
          </Link>
        </div>
      </main>
    </>
  );
}
