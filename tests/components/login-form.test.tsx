import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { AuthProvider, useAuthContext } from "@/components/auth/AuthProvider";
import { LoginForm } from "@/components/layout/LoginForm";

const { useAuth, loginConGoogle, loginConEmail, cerrarSesion, routerPush, onIdTokenChanged, firebaseAuth } = vi.hoisted(() => ({
  useAuth: vi.fn(),
  loginConGoogle: vi.fn(),
  loginConEmail: vi.fn(),
  cerrarSesion: vi.fn(),
  routerPush: vi.fn(),
  onIdTokenChanged: vi.fn(),
  firebaseAuth: {},
}));

vi.mock("firebase/auth", () => ({ onIdTokenChanged }));
vi.mock("@/lib/firebase", () => ({ auth: firebaseAuth }));
vi.mock("@/hooks/useAuth", () => ({ useAuth }));
vi.mock("@/lib/auth-client", () => ({
  loginConGoogle,
  loginConEmail,
  cerrarSesion,
  traducirErrorAuth: vi.fn(() => "Error de autenticación"),
}));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: routerPush }) }));

const usuario = {
  uid: "usuario-1",
  getIdToken: vi.fn().mockResolvedValue("id-token"),
  getIdTokenResult: vi.fn().mockResolvedValue({ claims: { admin: false } }),
};

type AuthState = {
  usuario: typeof usuario | null;
  esAdmin: boolean;
  cargando: boolean;
};

let authState: AuthState;
let integrationMode = false;
let authListener: ((user: typeof usuario | null) => Promise<void>) | null = null;

describe("LoginForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    integrationMode = false;
    authListener = null;
    authState = { usuario: null, esAdmin: false, cargando: false };
    useAuth.mockImplementation(() => integrationMode ? useAuthContext() : authState);
    loginConGoogle.mockImplementation(async () => {
      authState = { usuario, esAdmin: false, cargando: true };
    });
    loginConEmail.mockResolvedValue(undefined);
    cerrarSesion.mockImplementation(async () => {
      authState = { usuario: null, esAdmin: false, cargando: false };
    });
    onIdTokenChanged.mockImplementation((_auth: unknown, listener: typeof authListener) => {
      authListener = listener;
      return vi.fn();
    });
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ status: 200 } as Response));
  });

  function seleccionarAdministrador() {
    fireEvent.click(screen.getByRole("button", { name: /administrador/i }));
    fireEvent.click(screen.getByRole("button", { name: /iniciar sesión con google/i }));
  }

  function completarTransicionAuth(view: { rerender: (ui: ReactNode) => void }, esAdmin = false) {
    authState = { usuario, esAdmin, cargando: false };
    view.rerender(<LoginForm />);
  }

  async function emitirAuth(user: typeof usuario | null) {
    await act(async () => {
      await authListener?.(user);
    });
  }

  it("exige seleccionar el tipo de acceso antes de iniciar sesión con Google", async () => {
    render(<LoginForm />);

    fireEvent.click(screen.getByRole("button", { name: /iniciar sesión con google/i }));

    expect(screen.getByText("Selecciona Cliente o Administrador")).toBeInTheDocument();
    expect(loginConGoogle).not.toHaveBeenCalled();
  });

  it("envía la solicitud de administrador y muestra confirmación", async () => {
    vi.mocked(fetch).mockResolvedValue({ status: 201 } as Response);
    const view = render(<LoginForm />);

    seleccionarAdministrador();
    await waitFor(() => expect(authState.cargando).toBe(true));
    expect(fetch).not.toHaveBeenCalled();
    completarTransicionAuth(view);

    await waitFor(() => expect(screen.getByText(/Solicitud enviada/i)).toBeInTheDocument());
    expect(usuario.getIdToken).toHaveBeenCalledOnce();
    expect(fetch).toHaveBeenCalledWith("/api/auth/admin-request", {
      method: "POST",
      headers: { Authorization: "Bearer id-token" },
    });
    expect(cerrarSesion).toHaveBeenCalledOnce();
    expect(routerPush).not.toHaveBeenCalledWith("/admin");
  });

  it("muestra el error de la API cuando la solicitud ya está pendiente", async () => {
    vi.mocked(fetch).mockResolvedValue({
      status: 409,
      json: vi.fn().mockResolvedValue({ error: "Solicitud duplicada" }),
    } as unknown as Response);
    const view = render(<LoginForm />);

    seleccionarAdministrador();
    completarTransicionAuth(view);

    expect(await screen.findByText("Solicitud duplicada")).toBeInTheDocument();
    expect(cerrarSesion).toHaveBeenCalledOnce();
  });

  it("usa el fallback cuando un 409 no trae un error JSON", async () => {
    vi.mocked(fetch).mockResolvedValue({
      status: 409,
      json: vi.fn().mockRejectedValue(new Error("respuesta invalida")),
    } as unknown as Response);
    const view = render(<LoginForm />);

    seleccionarAdministrador();
    completarTransicionAuth(view);

    expect(await screen.findByText("Tu solicitud de administrador ya esta pendiente.")).toBeInTheDocument();
    expect(cerrarSesion).toHaveBeenCalledOnce();
  });

  it("muestra el error generico si falla la red", async () => {
    vi.mocked(fetch).mockRejectedValue(new Error("token-secreto"));
    const view = render(<LoginForm />);

    seleccionarAdministrador();
    completarTransicionAuth(view);

    expect(await screen.findByText("No se pudo enviar la solicitud. Intenta de nuevo.")).toBeInTheDocument();
    expect(cerrarSesion).toHaveBeenCalledOnce();
  });

  it("muestra el error generico ante un status inesperado", async () => {
    vi.mocked(fetch).mockResolvedValue({ status: 500 } as Response);
    const view = render(<LoginForm />);

    seleccionarAdministrador();
    completarTransicionAuth(view);

    expect(await screen.findByText("No se pudo enviar la solicitud. Intenta de nuevo.")).toBeInTheDocument();
    expect(cerrarSesion).toHaveBeenCalledOnce();
  });

  it("no duplica la solicitud para el mismo UID tras una re-renderización", async () => {
    vi.mocked(fetch).mockResolvedValue({ status: 201 } as Response);
    const view = render(<LoginForm />);

    seleccionarAdministrador();
    completarTransicionAuth(view);
    await screen.findByText(/Solicitud enviada/i);

    view.rerender(<LoginForm />);
    await waitFor(() => expect(fetch).toHaveBeenCalledOnce());
  });

  it("permite reintentar con el mismo UID despues de cerrar sesion", async () => {
    vi.mocked(fetch).mockResolvedValue({ status: 201 } as Response);
    const view = render(<LoginForm />);

    seleccionarAdministrador();
    completarTransicionAuth(view);
    await screen.findByText(/Solicitud enviada/i);
    await waitFor(() => expect(cerrarSesion).toHaveBeenCalledOnce());

    view.rerender(<LoginForm />);
    seleccionarAdministrador();
    completarTransicionAuth(view);

    await waitFor(() => expect(fetch).toHaveBeenCalledTimes(2));
    expect(usuario.getIdToken).toHaveBeenCalledTimes(2);
  });

  it("redirige a admin cuando la cuenta autorizada completa la transicion de auth", async () => {
    loginConGoogle.mockImplementation(async () => {
      authState = { usuario, esAdmin: true, cargando: true };
    });
    const view = render(<LoginForm />);

    seleccionarAdministrador();
    completarTransicionAuth(view, true);

    await waitFor(() => expect(routerPush).toHaveBeenCalledWith("/admin"));
    expect(fetch).not.toHaveBeenCalled();
  });

  it("integra AuthProvider y no duplica la solicitud en eventos de auth del mismo UID", async () => {
    integrationMode = true;
    let resolver!: (response: Response) => void;
    const respuestaAdmin = new Promise<Response>((resolve) => { resolver = resolve; });
    vi.mocked(fetch).mockImplementation((input) => {
      if (input === "/api/auth/sync") return Promise.resolve({ status: 200 } as Response);
      return respuestaAdmin;
    });
    loginConGoogle.mockImplementation(async () => {
      authListener?.(usuario);
    });
    const view = render(
      <AuthProvider>
        <LoginForm />
      </AuthProvider>,
    );

    await waitFor(() => expect(onIdTokenChanged).toHaveBeenCalledOnce());
    await emitirAuth(null);
    fireEvent.click(screen.getByRole("button", { name: /administrador/i }));
    fireEvent.click(screen.getByRole("button", { name: /iniciar sesión con google/i }));
    await waitFor(() => expect(fetch).toHaveBeenCalledWith("/api/auth/admin-request", expect.anything()));

    await emitirAuth(usuario);
    resolver({ status: 201 } as Response);
    await waitFor(() => expect(screen.getByText(/Solicitud enviada/i)).toBeInTheDocument());
    view.rerender(
      <AuthProvider>
        <LoginForm />
      </AuthProvider>,
    );

    const adminRequests = vi.mocked(fetch).mock.calls.filter(([input]) => input === "/api/auth/admin-request");
    expect(adminRequests).toHaveLength(1);
    expect(adminRequests[0][1]).toEqual({
      method: "POST",
      headers: { Authorization: "Bearer id-token" },
    });
  });

  it("mantiene el flujo de cliente y redirige a la tienda", async () => {
    const view = render(<LoginForm />);

    fireEvent.click(screen.getByRole("button", { name: /cliente/i }));
    fireEvent.click(screen.getByRole("button", { name: /iniciar sesión con google/i }));
    completarTransicionAuth(view);

    await waitFor(() => expect(routerPush).toHaveBeenCalledWith("/"));
    expect(fetch).not.toHaveBeenCalled();
  });
});
