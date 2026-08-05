import { describe, expect, it, vi } from "vitest";
import { Children, isValidElement } from "react";
import type { ReactElement, ReactNode } from "react";
import type { ConfigTienda, Producto } from "@/types";
import { separarProductosHome } from "@/lib/storefront/home";

const homeMocks = vi.hoisted(() => ({
  listarProductosActivos: vi.fn(),
  obtenerConfigTiendaServidor: vi.fn(),
  Hero: vi.fn(() => null),
  MarcasSection: vi.fn(() => null),
  OfertasSection: vi.fn(() => null),
  NuevosProductosSection: vi.fn(() => null),
  BeneficiosSection: vi.fn(() => null),
  JsonLd: vi.fn(() => null),
}));

vi.mock("@/lib/firestore/public", () => ({
  listarProductosActivos: homeMocks.listarProductosActivos,
  obtenerConfigTiendaServidor: homeMocks.obtenerConfigTiendaServidor,
}));
vi.mock("@/components/storefront/Hero", () => ({ Hero: homeMocks.Hero }));
vi.mock("@/components/storefront/MarcasSection", () => ({ MarcasSection: homeMocks.MarcasSection }));
vi.mock("@/components/storefront/OfertasSection", () => ({ OfertasSection: homeMocks.OfertasSection }));
vi.mock("@/components/storefront/NuevosProductosSection", () => ({ NuevosProductosSection: homeMocks.NuevosProductosSection }));
vi.mock("@/components/storefront/BeneficiosSection", () => ({ BeneficiosSection: homeMocks.BeneficiosSection }));
vi.mock("@/components/seo/JsonLd", () => ({ JsonLd: homeMocks.JsonLd }));

import Home from "@/app/page";

function producto(overrides: Partial<Producto> = {}): Producto {
  return {
    id: "p1",
    nombre: "Producto de prueba",
    slug: "producto-de-prueba",
    descripcion: "",
    precio: 100000,
    stock: 1,
    categoriaId: "celulares",
    marca: "Apple",
    specs: {},
    imagenes: [],
    activo: true,
    destacado: false,
    ...overrides,
  };
}

const config: ConfigTienda = {
  nombre: "Mundo Celular",
  whatsapp: "573147757223",
  direccion: "",
  ciudad: "Medellín",
  departamento: "Antioquia",
  pais: "CO",
  horario: "",
  redes: { instagram: "", facebook: "", tiktok: "" },
};

type TraversableProps = { children?: ReactNode; role?: string };

function propsOf(node: ReactElement): TraversableProps {
  return node.props as TraversableProps;
}

function findByType(node: ReactNode, type: unknown): ReactElement<Record<string, unknown>> | undefined {
  if (!isValidElement(node)) return undefined;
  if (node.type === type) return node as ReactElement<Record<string, unknown>>;

  for (const child of Children.toArray(propsOf(node).children)) {
    const match = findByType(child, type);
    if (match) return match;
  }

  return undefined;
}

function findByRole(node: ReactNode, role: string): ReactElement<Record<string, unknown>> | undefined {
  if (!isValidElement(node)) return undefined;
  if (propsOf(node).role === role) return node as ReactElement<Record<string, unknown>>;

  for (const child of Children.toArray(propsOf(node).children)) {
    const match = findByRole(child, role);
    if (match) return match;
  }

  return undefined;
}

function textContent(node: ReactNode): string {
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (!isValidElement(node)) return "";
  return Children.toArray(propsOf(node).children).map(textContent).join("");
}

describe("separarProductosHome", () => {
  it("separa destacados y nuevos desde productos activos", () => {
    const productos = [
      producto({ id: "p1", destacado: true }),
      producto({ id: "p2", destacado: false }),
    ];

    expect(separarProductosHome(productos)).toEqual({
      destacados: [productos[0]],
      nuevos: [productos[1]],
    });
  });

  it("limita destacados a 6 y nuevos a 8 sin cambiar su orden", () => {
    const destacados = Array.from({ length: 7 }, (_, index) =>
      producto({ id: `destacado-${index}`, destacado: true }),
    );
    const nuevos = Array.from({ length: 9 }, (_, index) =>
      producto({ id: `nuevo-${index}`, destacado: false }),
    );

    expect(separarProductosHome([...destacados, ...nuevos])).toEqual({
      destacados: destacados.slice(0, 6),
      nuevos: nuevos.slice(0, 8),
    });
  });
});

describe("Home e inventario", () => {
  it("pasa a marcas solo el resumen del inventario activo", async () => {
    const productos = [
      producto({ id: "apple", marca: "Apple", activo: true, stock: 0 }),
      producto({ id: "samsung", marca: "Samsung", activo: false }),
    ];
    homeMocks.listarProductosActivos.mockResolvedValue(productos);
    homeMocks.obtenerConfigTiendaServidor.mockResolvedValue(config);

    const page = await Home();
    const marcasSection = findByType(page, homeMocks.MarcasSection);

    expect(marcasSection?.props.marcas).toEqual([
      { nombre: "Apple", slug: "apple", cantidad: 1 },
    ]);
  });

  it("muestra un estado no interactivo cuando falla la lectura del inventario", async () => {
    homeMocks.listarProductosActivos.mockRejectedValue(new Error("Firestore no disponible"));
    homeMocks.obtenerConfigTiendaServidor.mockResolvedValue(config);

    const page = await Home();
    const status = findByRole(page, "status");

    expect(status).toBeDefined();
    expect(textContent(status)).toBe("El catalogo no esta disponible temporalmente.");
    expect(findByRole(status, "link")).toBeUndefined();
  });

  it("mantiene vacias las secciones de inventario cuando la consulta no devuelve productos", async () => {
    homeMocks.listarProductosActivos.mockResolvedValue([]);
    homeMocks.obtenerConfigTiendaServidor.mockResolvedValue(config);

    const page = await Home();

    expect(findByType(page, homeMocks.MarcasSection)?.props.marcas).toEqual([]);
    expect(findByType(page, homeMocks.OfertasSection)?.props.productos).toEqual([]);
    expect(findByType(page, homeMocks.NuevosProductosSection)?.props.productos).toEqual([]);
    expect(findByRole(page, "status")).toBeUndefined();
  });
});
