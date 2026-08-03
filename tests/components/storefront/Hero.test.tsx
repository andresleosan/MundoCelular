import { describe, expect, it, vi } from "vitest";
import { render, waitFor } from "@testing-library/react";
import { Hero } from "@/components/storefront/Hero";
import type { ConfigTienda } from "@/types";

const config: ConfigTienda = {
  nombre: "Mundo Celular",
  whatsapp: "573113554021",
  direccion: "",
  ciudad: "Medellín",
  departamento: "Antioquia",
  pais: "CO",
  horario: "",
  redes: { instagram: "", facebook: "", tiktok: "" },
};

describe("Hero", () => {
  it("mantiene el celular desmontándose como fondo durante el scroll", async () => {
    vi.stubGlobal(
      "IntersectionObserver",
      class {
        observe() {}
        disconnect() {}
      },
    );
    Object.defineProperty(window, "matchMedia", {
      configurable: true,
      value: () => ({ matches: false }),
    });

    render(<Hero config={config} />);

    await waitFor(() => {
      expect(document.querySelector('img[src="/Armado1.png"]')).not.toBeNull();
      expect(document.querySelector('img[src="/Desarmadom1.png"]')).not.toBeNull();
      expect(document.querySelector('img[src="/Desarmado1.png"]')).not.toBeNull();
    });
  });
});
