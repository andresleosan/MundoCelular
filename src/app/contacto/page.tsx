import type { Metadata } from "next";
import { obtenerConfigTiendaServidor } from "@/lib/firestore/public";
import { WHATSAPP_TIENDA } from "@/lib/config-tienda";
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

  const whatsapp = config?.whatsapp ?? WHATSAPP_TIENDA;
  const direccion = config?.direccion ?? "Cra 36 # 38 - 33, Barrio El Salvador";
  const ciudad = config?.ciudad ?? "Medellín";
  const horario = config?.horario ?? "Lun-Sáb 9:00 AM - 7:00 PM";
  const redes = config?.redes ?? { instagram: "", facebook: "", tiktok: "" };

  return (
    <>
      {config && <JsonLd data={jsonldContacto(config)} />}
      <main className="mx-auto max-w-[800px] px-4 py-14">
        <h1 className="text-[28px] font-semibold tracking-[-0.03em] text-fog-white">
          Contacto
        </h1>

        <div className="mt-8 space-y-6">
          <section>
            <h2 className="text-[16px] font-semibold text-fog-white">Dirección</h2>
            <p className="mt-2 text-[14px] text-fog-white/70">{direccion}, {ciudad}</p>
          </section>

          <section>
            <h2 className="text-[16px] font-semibold text-fog-white">Horario</h2>
            <p className="mt-2 text-[14px] text-fog-white/70">{horario}</p>
          </section>

          <section>
            <h2 className="text-[16px] font-semibold text-fog-white">WhatsApp</h2>
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
              <h2 className="text-[16px] font-semibold text-fog-white">Redes sociales</h2>
              <div className="mt-2 flex flex-wrap gap-3">
                {redes.instagram && (
                  <a href={redes.instagram} target="_blank" rel="noopener noreferrer" className="rounded-full border border-fog-white/15 bg-navy-surface/40 px-4 py-2 text-[14px] text-fog-white hover:bg-navy-surface/60">
                    Instagram
                  </a>
                )}
                {redes.facebook && (
                  <a href={redes.facebook} target="_blank" rel="noopener noreferrer" className="rounded-full border border-fog-white/15 bg-navy-surface/40 px-4 py-2 text-[14px] text-fog-white hover:bg-navy-surface/60">
                    Facebook
                  </a>
                )}
                {redes.tiktok && (
                  <a href={redes.tiktok} target="_blank" rel="noopener noreferrer" className="rounded-full border border-fog-white/15 bg-navy-surface/40 px-4 py-2 text-[14px] text-fog-white hover:bg-navy-surface/60">
                    TikTok
                  </a>
                )}
              </div>
            </section>
          )}

          <section>
            <h2 className="text-[16px] font-semibold text-fog-white">Ubicación</h2>
            <div className="mt-2 overflow-hidden rounded-2xl border border-fog-white/15">
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
