import { describe, expect, it, vi } from "vitest";
import { phaseFromProgress, publishTechLabProgress } from "@/components/storefront/tech-lab/phases";

describe("phaseFromProgress", () => {
  it("mantiene assembly al inicio y reassembly al final", () => {
    expect(phaseFromProgress(0)).toBe("assembly");
    expect(phaseFromProgress(1)).toBe("reassembly");
  });

  it("clampa valores fuera del rango", () => {
    expect(phaseFromProgress(-1)).toBe("assembly");
    expect(phaseFromProgress(2)).toBe("reassembly");
  });

  it("asigna la fase camera al centro de la narrativa", () => {
    expect(phaseFromProgress(0.5)).toBe("camera");
  });
});

describe("publishTechLabProgress", () => {
  it("publica progreso y emite eventos solo al cambiar de fase", () => {
    const root = document.createElement("div");
    const onPhaseChange = vi.fn();
    root.addEventListener("techlabphasechange", onPhaseChange);

    publishTechLabProgress(root, 0.5);
    publishTechLabProgress(root, 0.5);
    publishTechLabProgress(root, 0.6);

    expect(root.dataset.techPhase).toBe("processor");
    expect(root.style.getPropertyValue("--tech-progress")).toBe("0.6");
    expect(onPhaseChange).toHaveBeenCalledTimes(2);
  });
});
