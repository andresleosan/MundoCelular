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

  it("mantiene el fondo del hero continuo con la siguiente sección", () => {
    render(<Hero config={config} />);

    const hero = document.querySelector('[aria-label="Bienvenida a Mundo Celular"]');

    expect(hero).toHaveClass("bg-navy-base");
    expect(hero?.querySelector(".bg-gradient-to-br")).toBeNull();
  });

  it("mantiene las transformaciones de fondo con opacidad reducida", () => {
    render(<Hero config={config} />);

    const backgroundLayer = document.querySelector('div[aria-hidden="true"].fixed');

    expect(backgroundLayer).toHaveClass("opacity-30");
  });

  it("usa la misma duración para cada transformación del celular", () => {
    render(<Hero config={config} />);

    const durations = [
      ...timelineTo.mock.calls.map(([, vars]) => vars?.duration),
      ...timelineFromTo.mock.calls.map(([, , vars]) => vars?.duration),
    ].filter((duration): duration is number => duration !== undefined);

    expect(durations).toEqual(Array.from({ length: 8 }, () => 0.2));
  });

  it("completa el desarme y rearma el celular durante el último tramo", async () => {
    render(<Hero config={config} />);

    await waitFor(() => {
      const armadoOutCall = timelineTo.mock.calls.find(
        ([target]) => target?.getAttribute?.("src") === "/Armado1.png",
      );
      const desarmadoOutCall = timelineTo.mock.calls.find(
        ([target, vars, position]) =>
          target?.getAttribute?.("src") === "/Desarmado1.png" &&
          vars?.opacity === 0 &&
          vars?.scale === 1.07 &&
          position === 0.5333333333333333,
      );
      const armadoInCall = timelineTo.mock.calls.find(
        ([target, vars, position]) =>
          target?.getAttribute?.("src") === "/Armado1.png" &&
          vars?.opacity === 1 &&
          vars?.scale === 1 &&
          vars?.duration === 0.2 &&
          position === 0.8,
      );

      expect(armadoOutCall?.[1]).toMatchObject({ opacity: 0 });
      expect(desarmadoOutCall).toBeDefined();
      expect(armadoInCall).toBeDefined();
    });
  });
});
