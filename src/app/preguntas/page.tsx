import type { Metadata } from "next";
import { obtenerConfigTiendaServidor } from "@/lib/firestore/public";
import { metadataPreguntas } from "@/lib/seo/metadata";
import { jsonldPreguntas } from "@/lib/seo/jsonld";
import { JsonLd } from "@/components/seo/JsonLd";

export async function generateMetadata(): Promise<Metadata> {
  try {
    const config = await obtenerConfigTiendaServidor();
    return metadataPreguntas(config);
  } catch {
    return { title: "Preguntas frecuentes | Mundo Celular", description: "Resolvemos tus dudas." };
  }
}

const FAQ_ITEMS = [
  {
    q: "\u00BF C\u00F3mo compro?",
    a: "Elige tus productos, agr\u00E9galos al carrito y presiona \u201CProceder al checkout\u201D. Completa el formulario y ser\u00E1s redirigido a WhatsApp con tu pedido ya armado. Solo confirma con el vendedor y listo.",
  },
  {
    q: "\u00BFAceptan tarjeta de cr\u00E9dito o d\u00E9bito?",
    a: "Aceptamos efectivo, transferencia bancaria, Nequi y Daviplata. Actualmente no aceptamos tarjeta de cr\u00E9dito o d\u00E9bito directamente.",
  },
  {
    q: "\u00BFHacen env\u00EDos a domicilio?",
    a: "S\u00ED, hacemos env\u00EDos a Medell\u00EDn y alrededores. Tambi\u00E9n puedes recoger gratis en nuestra tienda en Cra 36 # 38 - 33, Barrio El Salvador.",
  },
  {
    q: "\u00BFTienen garant\u00EDa?",
    a: "Todos los productos nuevos tienen garant\u00EDa de 12 meses. Los accesorios tienen garant\u00EDa de 3 meses. La garant\u00EDa cubre defectos de fabricaci\u00F3n.",
  },
  {
    q: "\u00BFReparan celulares?",
    a: "S\u00ED, ofrecemos servicio t\u00E9cnico de celulares, tablets y consolas. Visita nuestra p\u00E1gina de Reparaciones para ver servicios y precios.",
  },
  {
    q: "\u00BFPuedo devolver un producto?",
    a: "Si el producto presenta un defecto de fabricaci\u00F3n, lo cambiamos dentro de los primeros 30 d\u00EDas con el empaque original. Los productos sin defecto no tienen devoluci\u00F3n.",
  },
  {
    q: "\u00BFD\u00F3nde est\u00E1n ubicados?",
    a: "Estamos en Cra 36 # 38 - 33, Barrio El Salvador, Medell\u00EDn, Antioquia. Vis\u00EDtanos de lunes a s\u00E1bado de 9:00 AM a 7:00 PM.",
  },
  {
    q: "\u00BFCu\u00E1l es su horario?",
    a: "Atendemos de lunes a s\u00E1bado de 9:00 AM a 7:00 PM. Domingos y festivos cerrado.",
  },
];

export default async function PreguntasPage() {
  let config;
  try {
    config = await obtenerConfigTiendaServidor();
  } catch {
    config = null;
  }

  const direccion = config?.direccion ?? "Cra 36 # 38 - 33, Barrio El Salvador";
  const horario = config?.horario ?? "Lun-S\u00E1b 9:00 AM - 7:00 PM";

  const preguntas = FAQ_ITEMS.map((item) => {
    let respuesta = item.a;
    respuesta = respuesta.replace("Cra 36 # 38 - 33, Barrio El Salvador", direccion);
    respuesta = respuesta.replace("lunes a s\u00E1bado de 9:00 AM a 7:00 PM", horario.toLowerCase());
    return { pregunta: item.q, respuesta };
  });

  return (
    <>
      <JsonLd data={jsonldPreguntas(preguntas)} />
      <main className="mx-auto max-w-[800px] px-4 py-14">
        <h1 className="text-[28px] font-semibold tracking-[-0.03em] text-gray-900">
          Preguntas frecuentes
        </h1>

        <div className="mt-8 space-y-3">
          {preguntas.map((p, i) => (
            <details key={i} className="group rounded-2xl bg-white p-4 shadow-sm-2">
              <summary className="cursor-pointer text-[14px] font-semibold text-gray-900 marker:text-steel-blue-gray">
                {p.pregunta}
              </summary>
              <p className="mt-3 text-[14px] leading-relaxed text-steel-blue-gray">
                {p.respuesta}
              </p>
            </details>
          ))}
        </div>
      </main>
    </>
  );
}
