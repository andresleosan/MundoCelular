export interface Categoria {
  id: string;
  nombre: string;
  slug: string;
  descripcion: string;
  orden: number;
  activa: boolean;
}

export interface ImagenProducto {
  url: string;
  thumb: string;
  alt: string;
}

export interface Producto {
  id: string;
  nombre: string;
  slug: string;
  descripcion: string;
  precio: number;
  stock: number;
  categoriaId: string;
  marca: string;
  specs: Record<string, string>;
  imagenes: ImagenProducto[];
  activo: boolean;
  destacado: boolean;
  metaTitle?: string;
  metaDescription?: string;
  tieneVariantes?: boolean;
  atributosDisponibles?: string[];
}

export interface VarianteProducto {
  id: string;
  productId: string;
  attributes: Record<string, string>;
  precio: number;
  stock: number;
  imagenes: ImagenProducto[];
  activo: boolean;
}

export interface ItemCarrito {
  productoId: string;
  cantidad: number;
  varianteId?: string;
  atributos?: Record<string, string>;
}

export interface Pedido {
  id: string;
  clienteUid: string;
  clienteNombre: string;
  clienteEmail: string;
  items: Array<{
    productoId: string;
    nombre: string;
    precioUnitario: number;
    cantidad: number;
    subtotal: number;
    varianteId?: string;
    atributos?: Record<string, string>;
  }>;
  total: number;
  entrega: { tipo: "retiro" | "domicilio"; direccion?: string; barrio?: string };
  estado: "pendiente" | "contactado" | "cerrado" | "cancelado";
  creadoEn: unknown;
}

export interface ConfigTienda {
  nombre: string;
  whatsapp: string;   // "573113554021"
  direccion: string;
  ciudad: string;
  departamento: string;
  pais: string;
  horario: string;
  redes: { instagram: string; facebook: string; tiktok: string };
}
