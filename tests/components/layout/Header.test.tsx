import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const { useAuth, cerrarSesion, push, replace } = vi.hoisted(() => ({
  useAuth: vi.fn(),
  cerrarSesion: vi.fn(),
  push: vi.fn(),
  replace: vi.fn(),
}));

vi.mock("@/hooks/useAuth", () => ({ useAuth }));
vi.mock("@/lib/auth-client", () => ({ cerrarSesion }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push, replace }) }));
vi.mock("@/components/storefront/SearchInput", () => ({ SearchInput: () => <div /> }));
vi.mock("@/components/carrito/CarritoContador", () => ({ CarritoContador: () => <div /> }));
vi.mock("@/components/layout/AuthModal", () => ({ AuthModal: () => null }));

import { Header } from "@/components/layout/Header";

describe("Header", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuth.mockReturnValue({
      usuario: { displayName: "Cliente", email: "cliente@example.com" },
      esAdmin: false,
    });
  });

  it("enlaza Mis pedidos desde el menu de una sesion activa", async () => {
    const user = userEvent.setup();
    render(<Header />);

    await user.click(screen.getByRole("button", { name: "Menú de usuario" }));

    expect(screen.getByRole("menuitem", { name: "Mis pedidos" }).getAttribute("href")).toBe("/cuenta/pedidos");
  });

  it("no muestra Mis pedidos sin sesion", () => {
    useAuth.mockReturnValue({ usuario: null, esAdmin: false });
    render(<Header />);

    expect(screen.queryByRole("menuitem", { name: "Mis pedidos" })).toBeNull();
  });
});
