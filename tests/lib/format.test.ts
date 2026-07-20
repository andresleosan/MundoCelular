import { describe, it, expect } from "vitest";
import { formatearCOP } from "@/lib/format";

describe("formatearCOP", () => {
  it("formatea enteros con separador de miles y sin decimales", () => {
    expect(formatearCOP(1850000).replace(/\u00A0/g, " ")).toBe("$ 1.850.000");
  });
  it("formatea cero", () => {
    expect(formatearCOP(0).replace(/\u00A0/g, " ")).toBe("$ 0");
  });
});
