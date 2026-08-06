import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, render, waitFor } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import type { ConfigTienda } from "@/types";

const { timelineTo, timelineFromTo, eventCallback, timeline } = vi.hoisted(() => {
  const timelineTo = vi.fn();
  const timelineFromTo = vi.fn();
  const eventCallback = vi.fn();
  const progress = vi.fn(() => 0.5);
  const timeline = { to: timelineTo, fromTo: timelineFromTo, eventCallback, progress };
  timelineTo.mockReturnValue(timeline);
  timelineFromTo.mockReturnValue(timeline);
  eventCallback.mockReturnValue(timeline);
  return { timelineTo, timelineFromTo, eventCallback, timeline };
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
  whatsapp: "573147757223",
  direccion: "",
  ciudad: "Medellín",
  departamento: "Antioquia",
  pais: "CO",
  horario: "",
  redes: { instagram: "", facebook: "", tiktok: "" },
};

async function hacerScroll() {
  await act(async () => {
    window.dispatchEvent(new Event("scroll"));
  });
}

describe("Hero", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    timelineTo.mockReturnValue(timeline);
    timelineFromTo.mockReturnValue(timeline);
    eventCallback.mockReturnValue(timeline);
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
    await hacerScroll();

    await waitFor(() => {
      expect(document.querySelector('img[src*="Armado1.webp"]')).not.toBeNull();
      expect(document.querySelector('img[src*="Desarmadom1.webp"]')).not.toBeNull();
      expect(document.querySelector('img[src*="Desarmado1.webp"]')).not.toBeNull();
    }, { timeout: 3000 });
  });

  it("incluye el estado ensamblado en el HTML inicial para LCP", () => {
    const html = renderToString(<Hero config={config} />);

    expect(html).toContain("Armado1.webp");
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

  it("sirve los fondos del hero con variantes responsive", () => {
    render(<Hero config={config} />);

    expect(document.querySelector('img[src*="Armado1.webp"]')).toHaveAttribute("src", "/Armado1.webp");
    expect(document.querySelector('img[src*="Armado1.webp"]')).toHaveAttribute("fetchpriority", "high");
    expect(document.querySelector('source[media="(max-width: 1023px)"]')).toHaveAttribute(
      "srcset",
      "/Armado1-mobile.webp",
    );
  });

  it("difiere las capas ocultas hasta preparar la animación", async () => {
    render(<Hero config={config} />);

    expect(document.querySelector('img[src*="Armado1.webp"]')).not.toBeNull();
    expect(document.querySelector('img[src*="Desarmadom1.webp"]')).toBeNull();
    expect(document.querySelector('img[src*="Desarmado1.webp"]')).toBeNull();

    await act(async () => {
      window.dispatchEvent(new Event("scroll"));
    });

    await waitFor(() => {
      expect(document.querySelector('img[src*="Desarmadom1.webp"]')).not.toBeNull();
      expect(document.querySelector('img[src*="Desarmado1.webp"]')).not.toBeNull();
    }, { timeout: 3000 });
  });

  it("difiere GSAP hasta el primer scroll", async () => {
    render(<Hero config={config} />);

    await act(async () => {
      await Promise.resolve();
    });
    expect(timelineTo).not.toHaveBeenCalled();

    await act(async () => {
      window.dispatchEvent(new Event("scroll"));
    });
    await waitFor(() => expect(timelineTo).toHaveBeenCalled());
  });

  it("usa la misma duración para cada transformación del celular", async () => {
    render(<Hero config={config} />);
    await hacerScroll();

    await waitFor(() => {
      const durations = [
        ...timelineTo.mock.calls.map(([, vars]) => vars?.duration),
        ...timelineFromTo.mock.calls.map(([, , vars]) => vars?.duration),
      ].filter((duration): duration is number => duration !== undefined);

      expect(durations).toEqual(Array.from({ length: 8 }, () => 0.2));
    }, { timeout: 3000 });
  });

  it("completa el desarme y rearma el celular durante el último tramo", async () => {
    render(<Hero config={config} />);
    await hacerScroll();

    await waitFor(() => {
      const armadoOutCall = timelineTo.mock.calls.find(
          ([target]) => target?.getAttribute?.("src")?.includes("Armado1.webp"),
      );
      const desarmadoOutCall = timelineTo.mock.calls.find(
        ([target, vars, position]) =>
          target?.getAttribute?.("src")?.includes("Desarmado1.webp") &&
          vars?.opacity === 0 &&
          vars?.scale === 1.07 &&
          position === 0.5333333333333333,
      );
      const armadoInCall = timelineTo.mock.calls.find(
        ([target, vars, position]) =>
          target?.getAttribute?.("src")?.includes("Armado1.webp") &&
          vars?.opacity === 1 &&
          vars?.scale === 1 &&
          vars?.duration === 0.2 &&
          position === 0.8,
      );

      expect(armadoOutCall?.[1]).toMatchObject({ opacity: 0 });
      expect(desarmadoOutCall).toBeDefined();
      expect(armadoInCall).toBeDefined();
    }, { timeout: 3000 });
  });

  it("publica el progreso del hero en el contenedor narrativo", async () => {
    const { container } = render(
      <div data-tech-lab-narrative data-tech-phase="assembly">
        <Hero config={config} />
      </div>,
    );
    const narrativeRoot = container.firstElementChild as HTMLElement;
    await hacerScroll();

    await waitFor(() => {
      const onUpdate = eventCallback.mock.calls.find(([name]) => name === "onUpdate")?.[1];
      onUpdate?.();

      expect(narrativeRoot.dataset.techPhase).toBe("camera");
      expect(narrativeRoot.style.getPropertyValue("--tech-progress")).toBe("0.5");
    }, { timeout: 3000 });
  });
});
