import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { DiagnosticPanel } from "@/components/storefront/tech-lab/DiagnosticPanel";

describe("DiagnosticPanel", () => {
  it("muestra los seis puntos y explica el alcance de la revisión", () => {
    render(<DiagnosticPanel />);

    expect(screen.getByRole("region", { name: "Centro de Diagnóstico" })).toBeInTheDocument();
    for (const label of ["Pantalla", "Cámara", "Batería", "Sensores", "Software", "Puerto de carga"]) {
      expect(screen.getByText(label, { exact: true })).toBeInTheDocument();
    }
    expect(screen.getByText("Revisión inicial", { exact: true })).toBeInTheDocument();
    expect(screen.queryByText(/✅/)).toBeNull();
    expect(screen.getByRole("link", { name: /solicitar revisión/i })).toHaveAttribute("href", "/reparaciones");
  });
});
