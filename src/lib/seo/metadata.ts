import type { Metadata } from "next";
import type { Categoria, Producto, ConfigTienda } from "@/types";
import { formatearCOP } from "@/lib/format";

const OG_LOCALE = "es_CO";
const OG_DEFAULT_IMAGE = "/og-default.png";

function siteName(config: ConfigTienda): string {
  return config.nombre;
}

function baseUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
}

function ogUrl(canonical?: string): string {
  return canonical ? `${baseUrl()}${canonical}` : baseUrl();
}

export function metadataInicio(config: ConfigTienda): Metadata {
  const description = `Tienda de celulares, accesorios, consolas y tecnología en ${config.ciudad}. Compra por WhatsApp. También reparamos celulares.`;
  const title = `${siteName(config)} | Tecnología y celulares en ${config.ciudad}`;
  return {
    title,
    description,
    alternates: { canonical: "/" },
    openGraph: {
      type: "website",
      siteName: siteName(config),
      title,
      description,
      url: ogUrl("/"),
      locale: OG_LOCALE,
      images: [{ url: OG_DEFAULT_IMAGE, width: 1200, height: 630, alt: siteName(config) }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [OG_DEFAULT_IMAGE],
    },
  };
}

export function metadataCategoria(cat: Categoria, config: ConfigTienda): Metadata {
  const description = cat.descripcion || `Comprar ${cat.nombre.toLowerCase()} en ${config.ciudad}. ${siteName(config)}`;
  const title = `${cat.nombre} en ${config.ciudad} | ${siteName(config)}`;
  return {
    title,
    description,
    alternates: { canonical: `/${cat.slug}` },
    openGraph: {
      type: "website",
      title,
      description,
      url: ogUrl(`/${cat.slug}`),
      siteName: siteName(config),
      locale: OG_LOCALE,
      images: [{ url: OG_DEFAULT_IMAGE, width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [OG_DEFAULT_IMAGE],
    },
  };
}

export function metadataProducto(prod: Producto, cat: Categoria | null, config: ConfigTienda): Metadata {
  const title = cat
    ? `${prod.nombre} | ${cat.nombre} en ${config.ciudad} | ${siteName(config)}`
    : `${prod.nombre} | ${siteName(config)}`;
  const description = prod.metaDescription?.trim()
    || `${prod.nombre} ${prod.marca ? `de ${prod.marca} ` : ""}por ${formatearCOP(prod.precio)} en ${config.ciudad}. Stock: ${prod.stock}.`;
  const canonical = cat ? `/${cat.slug}/${prod.slug}` : `/producto/${prod.slug}`;
  const ogImages = prod.imagenes.length
    ? [{ url: prod.imagenes[0].url, width: 1200, height: 1200, alt: prod.imagenes[0].alt }]
    : [{ url: OG_DEFAULT_IMAGE, width: 1200, height: 630, alt: prod.nombre }];
  return {
    title: prod.metaTitle?.trim() || title,
    description,
    alternates: { canonical },
    openGraph: {
      type: "article",
      title,
      description,
      url: ogUrl(canonical),
      siteName: siteName(config),
      locale: OG_LOCALE,
      images: ogImages,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ogImages.map((i) => i.url),
    },
  };
}

export function metadataReparaciones(config: ConfigTienda): Metadata {
  const description = `Servicio técnico de celulares en ${config.ciudad}. ${siteName(config)}. Reparamos pantallas, baterías, software y más.`;
  const title = `Reparación de celulares en ${config.ciudad} | ${siteName(config)}`;
  return {
    title,
    description,
    alternates: { canonical: "/reparaciones" },
    openGraph: {
      type: "website",
      title,
      description,
      url: ogUrl("/reparaciones"),
      siteName: siteName(config),
      locale: OG_LOCALE,
      images: [{ url: OG_DEFAULT_IMAGE, width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [OG_DEFAULT_IMAGE],
    },
  };
}

export function metadataBusqueda(q: string, config: ConfigTienda): Metadata {
  return {
    title: `Resultados para "${q}" | ${siteName(config)}`,
    description: `Resultados de búsqueda para "${q}" en ${siteName(config)}.`,
    robots: { index: false },
  };
}

export function metadataCarrito(config: ConfigTienda): Metadata {
  return {
    title: `Carrito | ${siteName(config)}`,
    description: `Tu carrito de compras en ${siteName(config)}.`,
    robots: { index: false },
  };
}

export function metadataAdmin(): Metadata {
  return {
    title: "Admin | Mundo Celular",
    robots: { index: false, follow: false },
  };
}

export function metadataContacto(config: ConfigTienda): Metadata {
  const description = `Dirección, horario y contacto de ${siteName(config)} en ${config.ciudad}. WhatsApp, redes sociales y mapa.`;
  const title = `Contacto | ${siteName(config)}`;
  return {
    title,
    description,
    alternates: { canonical: "/contacto" },
    openGraph: {
      type: "website",
      title,
      description,
      url: ogUrl("/contacto"),
      siteName: siteName(config),
      locale: OG_LOCALE,
      images: [{ url: OG_DEFAULT_IMAGE, width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [OG_DEFAULT_IMAGE],
    },
  };
}

export function metadataPreguntas(config: ConfigTienda): Metadata {
  const description = `Resolvemos tus dudas sobre compras, envíos, garantía y reparaciones en ${siteName(config)}.`;
  const title = `Preguntas frecuentes | ${siteName(config)}`;
  return {
    title,
    description,
    alternates: { canonical: "/preguntas" },
    openGraph: {
      type: "website",
      title,
      description,
      url: ogUrl("/preguntas"),
      siteName: siteName(config),
      locale: OG_LOCALE,
      images: [{ url: OG_DEFAULT_IMAGE, width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [OG_DEFAULT_IMAGE],
    },
  };
}
