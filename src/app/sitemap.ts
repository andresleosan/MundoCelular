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
    const { listarCategoriasPublic, listarTodosLosSlugsProducto, listarProductosActivos } = await import("@/lib/firestore/public");
    const { resumirMarcas } = await import("@/lib/storefront/brands");
    const [catsResult, prodsResult, productosActivosResult] = await Promise.allSettled([
      listarCategoriasPublic(),
      listarTodosLosSlugsProducto(),
      listarProductosActivos(),
    ]);
    const cats = catsResult.status === "fulfilled" ? catsResult.value : [];
    const prods = prodsResult.status === "fulfilled" ? prodsResult.value : [];
    const marcas = productosActivosResult.status === "fulfilled"
      ? resumirMarcas(productosActivosResult.value)
      : [];

    const catEntries: MetadataRoute.Sitemap = cats.map((c) => ({
      url: `${base}/categoria/${c.slug}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    }));

    const prodEntries: MetadataRoute.Sitemap = prods.map((p) => ({
      url: `${base}/producto/${p.producto}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.9,
    }));

    const marcaEntries: MetadataRoute.Sitemap = marcas.map((m) => ({
      url: `${base}/marca/${m.slug}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    }));

    return [...staticEntries, ...catEntries, ...prodEntries, ...marcaEntries];
  } catch {
    return staticEntries;
  }
}
