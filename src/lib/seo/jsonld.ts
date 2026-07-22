import type { Categoria, Producto, ConfigTienda } from "@/types";

type JsonLdObject = Record<string, unknown>;

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
const url = (path: string) => `${BASE_URL}${path}`;

export function jsonldInicio(config: ConfigTienda): JsonLdObject {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "LocalBusiness",
        name: config.nombre,
        url: url("/"),
        telephone: `+${config.whatsapp}`,
        address: {
          "@type": "PostalAddress",
          streetAddress: config.direccion,
          addressLocality: config.ciudad,
          addressRegion: config.departamento,
          addressCountry: config.pais,
        },
        sameAs: [config.redes.instagram, config.redes.facebook, config.redes.tiktok].filter(Boolean),
      },
      {
        "@type": "WebSite",
        name: config.nombre,
        url: url("/"),
        potentialAction: {
          "@type": "SearchAction",
          target: `${url("/buscar")}?q={search_term_string}`,
          "query-input": "required name=search_term_string",
        },
      },
    ],
  };
}

export function jsonldCategoria(cat: Categoria, productos: Producto[]): JsonLdObject {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: cat.nombre,
    description: cat.descripcion ?? undefined,
    numberOfItems: productos.length,
    itemListElement: productos.map((p, i) => ({
      "@type": "ListItem",
      position: i + 1,
      item: {
        "@type": "Product",
        name: p.nombre,
        url: url(`/${cat.slug}/${p.slug}`),
        image: p.imagenes[0]?.url,
        offers: {
          "@type": "Offer",
          price: String(p.precio),
          priceCurrency: "COP",
          availability: p.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
        },
      },
    })),
  };
}

export function jsonldProducto(prod: Producto, cat: Categoria): JsonLdObject {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: prod.nombre,
    description: prod.descripcion,
    brand: { "@type": "Brand", name: prod.marca || undefined },
    image: prod.imagenes.map((im) => im.url),
    offers: [
      {
        "@type": "Offer",
        price: String(prod.precio),
        priceCurrency: "COP",
        availability: prod.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
        url: url(`/${cat.slug}/${prod.slug}`),
        seller: {
          "@type": "Organization",
          name: "Mundo Celular",
        },
      },
    ],
  };
}

export function jsonldReparaciones(config: ConfigTienda): JsonLdObject {
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    serviceType: "Reparación de celulares",
    provider: {
      "@type": "LocalBusiness",
      name: config.nombre,
      telephone: `+${config.whatsapp}`,
      address: {
        "@type": "PostalAddress",
        streetAddress: config.direccion,
        addressLocality: config.ciudad,
        addressRegion: config.departamento,
        addressCountry: config.pais,
      },
    },
    areaServed: {
      "@type": "City",
      name: config.ciudad,
    },
    description: `Servicio técnico de celulares en ${config.ciudad}. Pantallas, baterías, software y más.`,
  };
}

export function jsonldContacto(config: ConfigTienda): JsonLdObject {
  return {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: config.nombre,
    url: url("/contacto"),
    telephone: `+${config.whatsapp}`,
    address: {
      "@type": "PostalAddress",
      streetAddress: config.direccion,
      addressLocality: config.ciudad,
      addressRegion: config.departamento,
      addressCountry: config.pais,
    },
    contactPoint: {
      "@type": "ContactPoint",
      telephone: `+${config.whatsapp}`,
      contactType: "customer service",
      availableLanguage: "Spanish",
    },
    sameAs: [config.redes.instagram, config.redes.facebook, config.redes.tiktok].filter(Boolean),
  };
}

interface PreguntaFrecuente {
  pregunta: string;
  respuesta: string;
}

export function jsonldPreguntas(preguntas: PreguntaFrecuente[]): JsonLdObject {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: preguntas.map((p) => ({
      "@type": "Question",
      name: p.pregunta,
      acceptedAnswer: {
        "@type": "Answer",
        text: p.respuesta,
      },
    })),
  };
}
