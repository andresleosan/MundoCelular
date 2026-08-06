import { act, render } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ScrollReveal } from "@/components/storefront/ScrollReveal";

let observar: ((entries: Array<{ isIntersecting: boolean }>) => void) | undefined;

describe("ScrollReveal", () => {
  beforeEach(() => {
    observar = undefined;
    vi.stubGlobal(
      "IntersectionObserver",
      class {
        constructor(callback: typeof observar) {
          observar = callback as typeof observar;
        }
        observe() {}
        disconnect() {}
      },
    );
  });

  it("oculta el contenido hasta entrar en el viewport", () => {
    const { container } = render(
      <ScrollReveal>
        <span>contenido</span>
      </ScrollReveal>,
    );

    const reveal = container.firstElementChild;
    expect(reveal).toHaveAttribute("data-scroll-reveal", "true");
    expect(reveal).toHaveAttribute("data-visible", "false");

    act(() => observar?.([{ isIntersecting: true }]));

    expect(reveal).toHaveAttribute("data-visible", "true");
  });
});
