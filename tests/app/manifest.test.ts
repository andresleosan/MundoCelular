import { describe, it, expect } from "vitest";

describe("PWA manifest", () => {
  it("tiene iconos 192, 512 y 512 maskable", async () => {
    const { default: manifest } = await import("@/app/manifest");
    const m = manifest();
    expect(m.icons?.find((i) => i.sizes === "192x192")).toBeDefined();
    expect(m.icons?.find((i) => i.sizes === "512x512")).toBeDefined();
    expect(m.icons?.find((i) => i.purpose === "maskable")).toBeDefined();
    expect(m.theme_color).toBe("#143b98");
    expect(m.start_url).toBe("/");
    expect(m.display).toBe("standalone");
    expect(m.lang).toBe("es-CO");
  });
});
