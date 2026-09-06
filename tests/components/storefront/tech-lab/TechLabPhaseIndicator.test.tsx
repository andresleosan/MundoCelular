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
    const pasoActual = () => container.querySelectorAll('[aria-current="step"]');

    expect(pasoActual()).toHaveLength(1);
    expect(pasoActual()[0]).toHaveTextContent("Sistema ensamblado");

    act(() => {
      root.dataset.techPhase = "camera";
      root.dispatchEvent(
        new CustomEvent("techlabphasechange", {
          detail: { phase: "camera" },
        }),
      );
    });

    expect(pasoActual()).toHaveLength(1);
    expect(pasoActual()[0]).toHaveTextContent("Sistema de cámaras");
    expect(screen.getByText("Sistema de cámaras", { selector: "p" })).toBeInTheDocument();
  });
});
