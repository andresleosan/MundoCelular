import { describe, it, expect, vi, beforeEach } from "vitest";
import type { ReactElement } from "react";
import type { ConfigTienda, Producto } from "@/types";

const { listarProductosActivos, obtenerConfigTiendaServidor } = vi.hoisted(() => ({
  listarProductosActivos: vi.fn(),
  obtenerConfigTiendaServidor: vi.fn(),
}));

const { resumirMarcas } = vi.hoisted(() => ({
  resumirMarcas: vi.fn(),
}));

const { notFound } = vi.hoisted(() => ({
  notFound: vi.fn((): never => {
    throw new Error("NEXT_NOT_FOUND");
  }),
}));

vi.mock("@/lib/firestore/public", () => ({
  listarProductosActivos,
  obtenerConfigTiendaServidor,
}));

vi.mock("@/lib/storefront/brands", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/storefront/brands")>()),
  resumirMarcas,
}));

vi.mock("next/navigation", () => ({ notFound }));

import PaginaMarca, {
  generateMetadata,
  generateStaticParams,
} from "@/app/marca/[slug]/page";

const config: ConfigTienda = {
  nombre: "Mundo Celular",
  whatsapp: "573113554021",
  direccion: "Calle 1",
  ciudad: "Medellín",
  departamento: "Antioquia",
  pais: "Colombia",
  horario: "L-V",
  redes: { instagram: "", facebook: "", tiktok: "" },
};

function producto(overrides: Partial<Producto> = {}): Producto {
  return {
    id: "p1",
    nombre: "iPhone 13",
    slug: "iphone-13",
    descripcion: "Equipo activo",
    precio: 1850000,
    stock: 3,
    categoriaId: "c1",
    marca: "Apple",
    specs: {},
    imagenes: [],
    activo: true,
    destacado: false,
    ...overrides,
  };
}

const appleActivo = producto({ id: "apple-activo" });
const appleInactivo = producto({ id: "apple-inactivo", activo: false });
const samsungActivo = producto({ id: "samsung-activo", marca: "Samsung" });
const productos = [appleActivo, appleInactivo, samsungActivo];
const marcas = [
  { nombre: "Apple", slug: "apple", cantidad: 1 },
  { nombre: "Samsung", slug: "samsung", cantidad: 1 },
];

type ProductGridProps = {
  productos: Producto[];
  categoriaSlug: string;
};

type GridWrapperProps = {
  children: ReactElement<ProductGridProps>;
};

describe("/marca/[slug]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    listarProductosActivos.mockResolvedValue(productos);
    obtenerConfigTiendaServidor.mockResolvedValue(config);
    resumirMarcas.mockReturnValue(marcas);
  });

  it("genera parámetros estáticos desde las marcas resumidas", async () => {
    await expect(generateStaticParams()).resolves.toEqual([
      { slug: "apple" },
      { slug: "samsung" },
    ]);
    expect(listarProductosActivos).toHaveBeenCalledOnce();
    expect(resumirMarcas).toHaveBeenCalledWith(productos);
  });

  it("genera metadata con el nombre, cantidad y canonical de la marca", async () => {
    const metadata = await generateMetadata({ params: Promise.resolve({ slug: "apple" }) });

    expect(metadata.title).toContain("Apple");
    expect(metadata.description).toContain("1");
    expect(metadata.alternates?.canonical).toBe("/marca/apple");
    expect(obtenerConfigTiendaServidor).toHaveBeenCalledOnce();
  });

  it("pasa al ProductGrid solo los productos activos de la marca", async () => {
    const page = await PaginaMarca({ params: Promise.resolve({ slug: "apple" }) });
    const pageElement = page as ReactElement<{ children: ReactElement[] }>;
    const gridWrapper = pageElement.props.children[2] as ReactElement<GridWrapperProps>;
    const grid = gridWrapper.props.children;

    expect(grid.props.productos).toEqual([appleActivo]);
    expect(grid.props.productos).not.toContain(appleInactivo);
    expect(grid.props.categoriaSlug).toBe("producto");
  });

  it("llama notFound cuando el slug de marca no existe", async () => {
    await expect(
      PaginaMarca({ params: Promise.resolve({ slug: "marca-inexistente" }) }),
    ).rejects.toThrow("NEXT_NOT_FOUND");

    expect(notFound).toHaveBeenCalledOnce();
  });
});
