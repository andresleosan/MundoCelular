export const SLUGS_RESERVADOS = [
  "admin", "carrito", "checkout", "cuenta", "contacto",
  "reparaciones", "preguntas", "api", "sitemap.xml", "robots.txt",
];

export function generarSlug(nombre: string): string {
  return nombre
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export function esSlugReservado(slug: string): boolean {
  return SLUGS_RESERVADOS.includes(slug);
}

export function asegurarSlugUnico(base: string, existentes: string[]): string {
  if (!existentes.includes(base)) return base;
  let i = 2;
  while (existentes.includes(`${base}-${i}`)) i++;
  return `${base}-${i}`;
}
