import { beforeEach, describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { MarcasSection } from "@/components/storefront/MarcasSection";

describe("MarcasSection", () => {
  beforeEach(() => {
    Object.defineProperty(window, "matchMedia", {
      configurable: true,
      value: () => ({ matches: true }),
    });
  });

  it("renderiza solo las marcas recibidas y enlaza al filtro SEO", () => {
    render(
      <MarcasSection marcas={[{ nombre: "Apple", slug: "apple", cantidad: 8 }]} />,
    );

    expect(screen.getByRole("link", { name: /Apple.*8/i })).toHaveAttribute(
      "href",
      "/marca/apple",
    );
    expect(screen.queryByText("Samsung")).not.toBeInTheDocument();
  });
});
