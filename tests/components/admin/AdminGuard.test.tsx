import { render } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { useAuth, activarAuth, replace } = vi.hoisted(() => ({
  useAuth: vi.fn(),
  activarAuth: vi.fn(),
  replace: vi.fn(),
}));

vi.mock("@/hooks/useAuth", () => ({ useAuth }));
vi.mock("next/navigation", () => ({
  usePathname: () => "/admin",
  useRouter: () => ({ replace }),
}));
vi.mock("@/lib/auth-client", () => ({ cerrarSesion: vi.fn() }));

import { AdminGuard } from "@/components/admin/AdminGuard";

describe("AdminGuard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuth.mockReturnValue({ usuario: null, esAdmin: false, cargando: true, authActiva: false, activarAuth });
  });

  it("activa Auth al entrar a una ruta protegida", () => {
    render(
      <AdminGuard>
        <div>panel</div>
      </AdminGuard>,
    );

    expect(activarAuth).toHaveBeenCalledOnce();
  });

  it("no redirige antes de resolver la sesión activada", () => {
    useAuth.mockReturnValue({ usuario: null, esAdmin: false, cargando: false, authActiva: false, activarAuth });
    render(
      <AdminGuard>
        <div>panel</div>
      </AdminGuard>,
    );

    expect(replace).not.toHaveBeenCalled();
  });
});
