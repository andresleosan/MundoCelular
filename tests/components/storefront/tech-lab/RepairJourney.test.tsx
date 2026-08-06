import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { RepairJourney } from "@/components/storefront/tech-lab/RepairJourney";

describe("RepairJourney", () => {
  it("muestra las cinco etapas en orden y un CTA existente", () => {
    render(<RepairJourney />);

    const region = screen.getByRole("region", { name: "Proceso de reparación" });
    const content = region.textContent ?? "";
    const steps = ["Recepción", "Diagnóstico", "Presupuesto", "Reparación", "Entrega"];
    steps.reduce((previousIndex, step) => {
      const currentIndex = content.indexOf(step);
      expect(currentIndex).toBeGreaterThan(previousIndex);
      return currentIndex;
    }, -1);
    expect(screen.getByRole("link", { name: /ver servicios/i })).toHaveAttribute("href", "/reparaciones");
  });
});
