import type { Metadata } from "next";
import type { Categoria, Producto, ConfigTienda } from "@/types";
import { formatearCOP } from "@/lib/format";

const siteName = (config: ConfigTienda) => config.nombre;

export function metadataInicio(config: ConfigTienda): Metadata {
  return {
    title: `${siteName(config)} | Tecnología y celulares en ${config.ciudad}`,
    description: `Tienda de celulares, accesorios, consolas y tecnología en ${config.ciudad}. Compra por WhatsApp. También reparamos celulares.`,
    alternates: { canonical: "/" },
    openGraph: { type: "website", siteName: siteName(config), title: `${siteName(config)} en ${config.ciudad}` },
    twitter: { card: "summary_large_image" },
  };
}

export function metadataCategoria(cat: Categoria, config: ConfigTienda): Metadata {
  return {
    title: `${cat.nombre} en ${config.ciudad} | ${siteName(config)}`,
    description: cat.descripcion || `Comprar ${cat.nombre.toLowerCase()} en ${config.ciudad}. ${siteName(config)}`,
    alternates: { canonical: `/${cat.slug}` },
    openGraph: { type: "website", title: `${cat.nombre} en ${config.ciudad}` },
  };
}

export function metadataProducto(prod: Producto, cat: Categoria | null, config: ConfigTienda): Metadata {
  const title = cat
    ? `${prod.nombre} | ${cat.nombre} en ${config.ciudad} | ${siteName(config)}`
    : `${prod.nombre} | ${siteName(config)}`;
  const description = prod.metaDescription?.trim()
    || `${prod.nombre} ${prod.marca ? `de ${prod.marca} ` : ""}por ${formatearCOP(prod.precio)} en ${config.ciudad}. Stock: ${prod.stock}.`;
  return {
    title: prod.metaTitle?.trim() || title,
    description,
    alternates: { canonical: cat ? `/${cat.slug}/${prod.slug}` : `/producto/${prod.slug}` },
    openGraph: {
      type: "website",
      title,
      description,
      images: prod.imagenes.length ? [{ url: prod.imagenes[0].url, alt: prod.imagenes[0].alt }] : undefined,
    },
    twitter: { card: "summary_large_image" },
  };
}

export function metadataReparaciones(config: ConfigTienda): Metadata {
  return {
    title: `Reparación de celulares en ${config.ciudad} | ${siteName(config)}`,
    description: `Servicio técnico de celulares en ${config.ciudad}. ${siteName(config)}. Reparamos pantallas, baterías, software y más.`,
    alternates: { canonical: "/reparaciones" },
    openGraph: { type: "website", title: `Reparación de celulares en ${config.ciudad}` },
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
