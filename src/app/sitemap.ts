import type { MetadataRoute } from "next";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const now = new Date();

  const staticEntries: MetadataRoute.Sitemap = [
    { url: `${base}/`, lastModified: now, changeFrequency: "daily", priority: 1 },
    { url: `${base}/reparaciones`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${base}/carrito`, lastModified: now, changeFrequency: "monthly", priority: 0.3 },
    { url: `${base}/buscar`, lastModified: now, changeFrequency: "monthly", priority: 0.4 },
  ];

  try {
    const { listarCategoriasPublic, listarTodosLosSlugsProducto } = await import("@/lib/firestore/public");
    const cats = await listarCategoriasPublic();
    const prods = await listarTodosLosSlugsProducto();

    const catEntries: MetadataRoute.Sitemap = cats.map((c) => ({
      url: `${base}/${c.slug}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    }));

    const prodEntries: MetadataRoute.Sitemap = prods.map((p) => ({
      url: `${base}/${p.categoria}/${p.producto}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.9,
    }));

    return [...staticEntries, ...catEntries, ...prodEntries];
  } catch {
    return staticEntries;
  }
}
