import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { TechCenterSection } from "@/components/storefront/tech-lab/TechCenterSection";

describe("TechCenterSection", () => {
  it("presenta los cinco servicios del Centro Tecnológico", () => {
    render(<TechCenterSection />);

    expect(
      screen.getByRole("region", { name: "Centro Tecnológico Mundo Celular" }),
    ).toBeInTheDocument();

    for (const label of [
      "Diagnóstico profesional",
      "Reparación certificada",
      "Garantía real",
      "Repuestos originales",
      "Atención especializada",
    ]) {
      expect(screen.getByRole("heading", { name: label })).toBeInTheDocument();
    }
  });
});
