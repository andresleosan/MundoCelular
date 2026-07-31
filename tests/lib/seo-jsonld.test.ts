import { describe, it, expect } from "vitest";
import { jsonldInicio, jsonldCategoria, jsonldProducto, jsonldReparaciones } from "@/lib/seo/jsonld";
import type { Categoria, Producto, ConfigTienda } from "@/types";

const config: ConfigTienda = {
  nombre: "Mundo Celular", whatsapp: "573113554021",
  direccion: "Cra 36 # 38 - 33, Barrio El Salvador", ciudad: "Medellín",
  departamento: "Antioquia", pais: "Colombia", horario: "L-V 9-18",
  redes: { instagram: "https://instagram.com/mundo_celular_75", facebook: "https://facebook.com/Mundo.Celular.01", tiktok: "https://tiktok.com/@mundocelular75" },
};

describe("jsonldInicio", () => {
  it("tiene LocalBusiness y WebSite con SearchAction", () => {
    const j = jsonldInicio(config);
    expect(j["@context"]).toBe("https://schema.org");
    const graph = j["@graph"] as Record<string, unknown>[];
    const localBiz = graph.find((n) => n["@type"] === "LocalBusiness");
    const site = graph.find((n) => n["@type"] === "WebSite");
    expect(localBiz).toBeDefined();
    expect(site).toBeDefined();
    expect((localBiz as Record<string, unknown>).name).toBe("Mundo Celular");
    expect(((localBiz as Record<string, unknown>).sameAs as string[])).toContain("https://instagram.com/mundo_celular_75");
    expect((localBiz as Record<string, unknown>).telephone).toBe("+573113554021");
    expect(((site as Record<string, unknown>).potentialAction as Record<string, unknown>)["@type"]).toBe("SearchAction");
  });
});

describe("jsonldCategoria", () => {
  const cat: Categoria = { id: "c1", nombre: "Celulares", slug: "celulares", descripcion: "", orden: 1, activa: true };
  const prods: Producto[] = [
    { id: "p1", nombre: "iPhone 13", slug: "iphone-13", descripcion: "OK", precio: 1850000, stock: 3, categoriaId: "c1", marca: "Apple", specs: {}, imagenes: [], activo: true, destacado: false },
  ];
  it("tiene ItemList con ListItems", () => {
    const j = jsonldCategoria(cat, prods);
    expect(j["@type"]).toBe("ItemList");
    expect((j as Record<string, unknown>).itemListElement).toHaveLength(1);
  });
});

describe("jsonldProducto", () => {
  const cat: Categoria = { id: "c1", nombre: "Celulares", slug: "celulares", descripcion: "", orden: 1, activa: true };
  const prod: Producto = {
    id: "p1", nombre: "iPhone 13 128GB", slug: "iphone-13", descripcion: "Excelente",
    precio: 1850000, stock: 3, categoriaId: "c1", marca: "Apple",
    specs: { Almacenamiento: "128GB" }, imagenes: [], activo: true, destacado: false,
  };
  it("tiene Product con Offer (price COP, availability)", () => {
    const j = jsonldProducto(prod, cat);
    expect(j["@type"]).toBe("Product");
    const offers = (j as Record<string, unknown>).offers as Record<string, unknown>[];
    expect(offers[0].price).toBe("1850000");
    expect(offers[0].priceCurrency).toBe("COP");
    expect(offers[0].availability).toBe(prod.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock");
  });
  it("incluye sku = prod.id", () => {
    const j = jsonldProducto(prod, cat);
    expect((j as Record<string, unknown>).sku).toBe(prod.id);
  });
});

describe("jsonldReparaciones", () => {
  it("tiene Service con ServiceArea (Medellín)", () => {
    const j = jsonldReparaciones(config);
    expect(j["@type"]).toBe("Service");
    expect(((j as Record<string, unknown>).areaServed as Record<string, unknown>).name).toBe("Medellín");
  });
});
