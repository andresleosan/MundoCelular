import { describe, it, expect } from "vitest";
import { metadataInicio, metadataCategoria, metadataProducto, metadataMarca, metadataReparaciones, metadataBusqueda, metadataCarrito, metadataAdmin } from "@/lib/seo/metadata";
import type { Categoria, Producto, ConfigTienda } from "@/types";

const config: ConfigTienda = {
  nombre: "Mundo Celular", whatsapp: "573147757223",
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
  it("canonical en /categoria/celulares", () => {
    expect(metadataCategoria(cat, config).alternates?.canonical).toBe("/categoria/celulares");
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
  it("canonical en /producto/iphone-13", () => {
    expect(metadataProducto(prod, cat, config).alternates?.canonical).toBe("/producto/iphone-13");
  });
  it("description menciona precio en COP", () => {
    const m = metadataProducto(prod, cat, config);
    expect(m.description).toContain("1.850.000");
  });
});

describe("metadataMarca", () => {
  it("genera metadata indexable con canonical y cantidad", () => {
    const metadata = metadataMarca("Apple", "apple", 3, config);

    expect(metadata.title).toContain("Apple");
    expect(metadata.description).toContain("3");
    expect(metadata.alternates?.canonical).toBe("/marca/apple");
    expect((metadata.robots as Record<string, boolean>).index).toBe(true);
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

describe("metadataInicio OG/Twitter", () => {
  it("incluye og:locale=es_CO y og:url absoluta", () => {
    const m = metadataInicio(config);
    expect(m.openGraph?.locale).toBe("es_CO");
    expect(m.openGraph?.url).toBeDefined();
    expect(m.openGraph?.siteName).toBe(config.nombre);
  });
  it("incluye twitter:title y twitter:description", () => {
    const m = metadataInicio(config);
    expect(m.twitter?.title).toBeDefined();
    expect(m.twitter?.description).toBeDefined();
  });
});

describe("metadataProducto OG/Twitter", () => {
  const cat: Categoria = { id: "c1", nombre: "Celulares", slug: "celulares", descripcion: "", orden: 1, activa: true };
  const prodConImagen: Producto = {
    id: "p1", nombre: "iPhone 13", slug: "iphone-13", descripcion: "OK",
    precio: 1850000, stock: 3, categoriaId: "c1", marca: "Apple",
    specs: {}, imagenes: [{ url: "https://r2.test/productos/p1.webp", thumb: "https://r2.test/productos/p1-thumb.webp", alt: "iPhone 13" }], activo: true, destacado: false,
  };
  it("incluye twitter:image con la imagen del producto", () => {
    const m = metadataProducto(prodConImagen, cat, config);
    const images = m.twitter?.images;
    expect(images).toBeDefined();
    if (Array.isArray(images)) {
      expect(images[0]).toBe("https://r2.test/productos/p1.webp");
    }
  });
  it("incluye og:url absoluta y og:locale=es_CO", () => {
    const m = metadataProducto(prodConImagen, cat, config);
    expect(m.openGraph?.url).toContain("/producto/iphone-13");
    expect(m.openGraph?.locale).toBe("es_CO");
  });
});

describe("metadataCategoria OG/Twitter", () => {
  const cat: Categoria = { id: "c1", nombre: "Celulares", slug: "celulares", descripcion: "Smartphones", orden: 1, activa: true };
  it("incluye og:url, siteName, locale", () => {
    const m = metadataCategoria(cat, config);
    expect(m.openGraph?.url).toContain("/categoria/celulares");
    expect(m.openGraph?.siteName).toBe(config.nombre);
    expect(m.openGraph?.locale).toBe("es_CO");
  });
});
