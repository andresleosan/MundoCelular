import type { ConfigTienda } from "@/types";

export const WHATSAPP_TIENDA = "573147757223";

export const CONFIG_TIENDA_DEFAULT: ConfigTienda = {
  nombre: "Mundo Celular",
  whatsapp: WHATSAPP_TIENDA,
  direccion: "",
  ciudad: "Medellín",
  departamento: "Antioquia",
  pais: "CO",
  horario: "",
  redes: { instagram: "", facebook: "", tiktok: "" },
};

export function formatearWhatsAppTienda(numero: string): string {
  return numero.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})$/, "+$1 $2 $3 $4");
}
