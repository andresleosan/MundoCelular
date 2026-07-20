import { describe, it, expect } from "vitest";
import { generarSlug, esSlugReservado, asegurarSlugUnico, SLUGS_RESERVADOS } from "@/lib/slug";

describe("generarSlug", () => {
  it("convierte nombre a slug", () => {
    expect(generarSlug("iPhone 13 Pro Max")).toBe("iphone-13-pro-max");
  });
  it("elimina tildes y caracteres especiales", () => {
    expect(generarSlug("Electrodomésticos & Más!")).toBe("electrodomesticos-mas");
  });
  it("colapsa guiones y espacios múltiples", () => {
    expect(generarSlug("  Bafle   JBL -- Go ")).toBe("bafle-jbl-go");
  });
  it("retorna vacío si no hay caracteres válidos", () => {
    expect(generarSlug("!!!")).toBe("");
  });
});

describe("esSlugReservado", () => {
  it("detecta slugs reservados", () => {
    expect(esSlugReservado("admin")).toBe(true);
    expect(esSlugReservado("reparaciones")).toBe(true);
    expect(esSlugReservado("celulares")).toBe(false);
  });
  it("la lista incluye todas las rutas del sistema", () => {
    for (const s of ["admin", "carrito", "checkout", "cuenta", "contacto", "reparaciones", "preguntas", "api"]) {
      expect(SLUGS_RESERVADOS).toContain(s);
    }
  });
});

describe("asegurarSlugUnico", () => {
  it("devuelve el base si no existe", () => {
    expect(asegurarSlugUnico("celulares", ["accesorios"])).toBe("celulares");
  });
  it("agrega sufijo numérico en colisión", () => {
    expect(asegurarSlugUnico("celulares", ["celulares", "celulares-2"])).toBe("celulares-3");
  });
});
