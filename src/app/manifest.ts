import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Mundo Celular",
    short_name: "Mundo Celular",
    description: "Celulares, accesorios, consolas y tecnología en Medellín. Compra por WhatsApp.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#143b98",
    lang: "es-CO",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icons/icon-512-maskable.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
