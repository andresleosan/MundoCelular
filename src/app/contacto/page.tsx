import type { Metadata } from "next";
import { obtenerConfigTiendaServidor } from "@/lib/firestore/public";
import { metadataContacto } from "@/lib/seo/metadata";
import { jsonldContacto } from "@/lib/seo/jsonld";
import { JsonLd } from "@/components/seo/JsonLd";

export async function generateMetadata(): Promise<Metadata> {
  try {
    const config = await obtenerConfigTiendaServidor();
    return metadataContacto(config);
  } catch {
    return { title: "Contacto | Mundo Celular", description: "Contacta a Mundo Celular en Medellín." };
  }
}

export default async function ContactoPage() {
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
  const redes = config?.redes ?? { instagram: "", facebook: "", tiktok: "" };

  return (
    <>
      {config && <JsonLd data={jsonldContacto(config)} />}
      <main className="mx-auto max-w-[800px] px-4 py-14">
        <h1 className="text-[28px] font-semibold tracking-[-0.03em] text-gray-900">
          Contacto
        </h1>

        <div className="mt-8 space-y-6">
          <section>
            <h2 className="text-[16px] font-semibold text-gray-900">Dirección</h2>
            <p className="mt-2 text-[14px] text-steel-blue-gray">{direccion}, {ciudad}</p>
          </section>

          <section>
            <h2 className="text-[16px] font-semibold text-gray-900">Horario</h2>
            <p className="mt-2 text-[14px] text-steel-blue-gray">{horario}</p>
          </section>

          <section>
            <h2 className="text-[16px] font-semibold text-gray-900">WhatsApp</h2>
            <a
              href={`https://wa.me/${whatsapp}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-block rounded-full bg-mundo-blue px-6 py-3 text-[14px] font-semibold text-white shadow-lg-2"
            >
              Escribenos por WhatsApp
            </a>
          </section>

          {Object.values(redes).some(Boolean) && (
            <section>
              <h2 className="text-[16px] font-semibold text-gray-900">Redes sociales</h2>
              <div className="mt-2 flex flex-wrap gap-3">
                {redes.instagram && (
                  <a href={redes.instagram} target="_blank" rel="noopener noreferrer" className="rounded-full border border-faint-border bg-white px-4 py-2 text-[14px] text-ink-navy hover:bg-canvas-frost">
                    Instagram
                  </a>
                )}
                {redes.facebook && (
                  <a href={redes.facebook} target="_blank" rel="noopener noreferrer" className="rounded-full border border-faint-border bg-white px-4 py-2 text-[14px] text-ink-navy hover:bg-canvas-frost">
                    Facebook
                  </a>
                )}
                {redes.tiktok && (
                  <a href={redes.tiktok} target="_blank" rel="noopener noreferrer" className="rounded-full border border-faint-border bg-white px-4 py-2 text-[14px] text-ink-navy hover:bg-canvas-frost">
                    TikTok
                  </a>
                )}
              </div>
            </section>
          )}

          <section>
            <h2 className="text-[16px] font-semibold text-gray-900">Ubicación</h2>
            <div className="mt-2 overflow-hidden rounded-2xl border border-faint-border">
              <iframe
                title="Ubicación de Mundo Celular"
                src={`https://www.openstreetmap.org/export/embed.html?bbox=-75.58,-6.26,-75.54,-6.22&layer=mapnik&marker=-6.24,-75.56`}
                width="100%"
                height="300"
                style={{ border: 0 }}
                loading="lazy"
              />
            </div>
          </section>
        </div>
      </main>
    </>
  );
}
