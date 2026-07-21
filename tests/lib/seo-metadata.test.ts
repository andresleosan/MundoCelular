import { describe, it, expect } from "vitest";
import { metadataInicio, metadataCategoria, metadataProducto, metadataReparaciones, metadataBusqueda, metadataCarrito, metadataAdmin } from "@/lib/seo/metadata";
import type { Categoria, Producto, ConfigTienda } from "@/types";

const config: ConfigTienda = {
  nombre: "Mundo Celular", whatsapp: "573113554021",
  direccion: "Cra 36 # 38 - 33, Barrio El Salvador", ciudad: "Medellín",
  departamento: "Antioquia", pais: "Colombia", horario: "",
  redes: { instagram: "i", facebook: "f", tiktok: "t" },
};

describe("metadataInicio", () => {
  it("title contiene nombre y ciudad", () => {
    const m = metadataInicio(config);
    expect(m.title).toContain("Mundo Celular");
    expect(m.title).toContain("Medellín");
  });
  it("canonical en /", () => {
    expect(metadataInicio(config).alternates?.canonical).toBe("/");
  });
});

describe("metadataCategoria", () => {
  const cat: Categoria = { id: "c1", nombre: "Celulares", slug: "celulares", descripcion: "Smartphones", orden: 1, activa: true };
  it("title = 'Celulares en Medellín | Mundo Celular'", () => {
    expect(metadataCategoria(cat, config).title).toBe("Celulares en Medellín | Mundo Celular");
  });
  it("canonical en /celulares", () => {
    expect(metadataCategoria(cat, config).alternates?.canonical).toBe("/celulares");
  });
});

describe("metadataProducto", () => {
  const cat: Categoria = { id: "c1", nombre: "Celulares", slug: "celulares", descripcion: "", orden: 1, activa: true };
  const prod: Producto = {
    id: "p1", nombre: "iPhone 13 128GB", slug: "iphone-13", descripcion: "Excelente estado",
    precio: 1850000, stock: 3, categoriaId: "c1", marca: "Apple",
    specs: {}, imagenes: [], activo: true, destacado: false,
  };
  it("title incluye producto, categoría y marca", () => {
    const m = metadataProducto(prod, cat, config);
    expect(m.title).toContain("iPhone 13 128GB");
    expect(m.title).toContain("Medellín");
  });
  it("canonical en /celulares/iphone-13", () => {
    expect(metadataProducto(prod, cat, config).alternates?.canonical).toBe("/celulares/iphone-13");
  });
  it("description menciona precio en COP", () => {
    const m = metadataProducto(prod, cat, config);
    expect(m.description).toContain("1.850.000");
  });
});

describe("metadataReparaciones", () => {
  it("title contiene Reparación y ciudad", () => {
    const m = metadataReparaciones(config);
    expect(m.title).toContain("Reparación de celulares");
    expect(m.title).toContain("Medellín");
  });
  it("canonical en /reparaciones", () => {
    expect(metadataReparaciones(config).alternates?.canonical).toBe("/reparaciones");
  });
});

describe("metadataBusqueda", () => {
  it("title contiene query", () => {
    const m = metadataBusqueda("iphone", config);
    expect(m.title).toContain("iphone");
  });
  it("robots index false", () => {
    const robots = metadataBusqueda("test", config).robots as Record<string, boolean>;
    expect(robots.index).toBe(false);
  });
});

describe("metadataCarrito", () => {
  it("title contiene Carrito", () => {
    expect(metadataCarrito(config).title).toContain("Carrito");
  });
  it("robots index false", () => {
    const robots = metadataCarrito(config).robots as Record<string, boolean>;
    expect(robots.index).toBe(false);
  });
});

describe("metadataAdmin", () => {
  it("robots index y follow false", () => {
    const robots = metadataAdmin().robots as Record<string, boolean>;
    expect(robots.index).toBe(false);
    expect(robots.follow).toBe(false);
  });
});
