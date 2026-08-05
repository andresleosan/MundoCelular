import { describe, expect, it } from "vitest";
import {
  CONFIG_TIENDA_DEFAULT,
  WHATSAPP_TIENDA,
  formatearWhatsAppTienda,
} from "@/lib/config-tienda";

describe("configuracion publica de tienda", () => {
  it("expone el WhatsApp de empresa para enlaces y texto humano", () => {
    expect(CONFIG_TIENDA_DEFAULT.whatsapp).toBe("573147757223");
    expect(WHATSAPP_TIENDA).toBe("573147757223");
    expect(formatearWhatsAppTienda(WHATSAPP_TIENDA)).toBe("+57 314 775 7223");
  });
});
