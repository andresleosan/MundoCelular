import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, waitFor } from "@testing-library/react";
import type { ConfigTienda } from "@/types";

const { timelineTo, timelineFromTo, timeline } = vi.hoisted(() => {
  const timelineTo = vi.fn();
  const timelineFromTo = vi.fn();
  const timeline = { to: timelineTo, fromTo: timelineFromTo };
  timelineTo.mockReturnValue(timeline);
  timelineFromTo.mockReturnValue(timeline);
  return { timelineTo, timelineFromTo, timeline };
});

vi.mock("gsap", () => ({
  default: {
    registerPlugin: vi.fn(),
    context: (callback: () => void) => {
      callback();
      return { revert: vi.fn() };
    },
    timeline: vi.fn(() => timeline),
  },
}));
vi.mock("gsap/ScrollTrigger", () => ({ ScrollTrigger: {} }));

import { Hero } from "@/components/storefront/Hero";

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
  beforeEach(() => {
    vi.clearAllMocks();
    timelineTo.mockReturnValue(timeline);
    timelineFromTo.mockReturnValue(timeline);
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
  });

  it("mantiene el celular desmontándose como fondo durante el scroll", async () => {

    render(<Hero config={config} />);

    await waitFor(() => {
      expect(document.querySelector('img[src="/Armado1.png"]')).not.toBeNull();
      expect(document.querySelector('img[src="/Desarmadom1.png"]')).not.toBeNull();
      expect(document.querySelector('img[src="/Desarmado1.png"]')).not.toBeNull();
    });
  });

  it("oculta el celular inicial después de la transición y conserva el final al 30%", async () => {
    render(<Hero config={config} />);

    await waitFor(() => {
      const armadoCall = timelineTo.mock.calls.find(
        ([target]) => target?.getAttribute?.("src") === "/Armado1.png",
      );
      const desarmadoCall = timelineTo.mock.calls.find(
        ([target]) => target?.getAttribute?.("src") === "/Desarmado1.png",
      );

      expect(armadoCall?.[1]).toMatchObject({ opacity: 0 });
      expect(desarmadoCall?.[1]).toMatchObject({ opacity: 0.3 });
    });
  });
});
