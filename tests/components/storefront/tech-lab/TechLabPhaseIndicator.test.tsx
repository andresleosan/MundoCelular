import { act, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { TechLabPhaseIndicator } from "@/components/storefront/tech-lab/TechLabPhaseIndicator";

describe("TechLabPhaseIndicator", () => {
  it("marca la fase inicial y responde a cambios publicados por la narrativa", () => {
    const { container } = render(
      <div data-tech-lab-narrative data-tech-phase="assembly">
        <TechLabPhaseIndicator />
      </div>,
    );
    const root = container.firstElementChild as HTMLElement;

    expect(screen.getByText("Sistema ensamblado")).toHaveAttribute("aria-current", "step");

    act(() => {
      root.dataset.techPhase = "camera";
      root.dispatchEvent(
        new CustomEvent("techlabphasechange", {
          detail: { phase: "camera" },
        }),
      );
    });

    expect(screen.getByText("Sistema de cámaras")).toHaveAttribute("aria-current", "step");
    expect(screen.getByText("Sistema ensamblado")).not.toHaveAttribute("aria-current", "step");

  });
});
