import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AdminUsuarios } from "@/components/admin/AdminUsuarios";

const { useAuth } = vi.hoisted(() => ({ useAuth: vi.fn() }));

vi.mock("@/hooks/useAuth", () => ({ useAuth }));

const usuario = {
  getIdToken: vi.fn().mockResolvedValue("id-token"),
};

const solicitud = {
  uid: "u1",
  email: "persona@test.com",
  displayName: "Persona Solicitante",
  photoURL: "",
  adminRequestStatus: "pending" as const,
  adminRequestedAt: "2026-08-01T12:00:00.000Z",
};

function respuesta(data: unknown, ok = true) {
  return {
    ok,
    json: vi.fn().mockResolvedValue(data),
  } as unknown as Response;
}

function configurarFetch({ solicitudes = [solicitud], error = false } = {}) {
  const fetchMock = vi.fn().mockImplementation((url: string, init?: RequestInit) => {
    if (init?.method === "POST" || init?.method === "PATCH") return Promise.resolve(respuesta({ success: true }));
    if (url.includes("role=customer")) return Promise.resolve(respuesta({ data: { clientes: [] } }));
    if (error) return Promise.resolve(respuesta({ error: "No se pudieron cargar administradores" }, false));
    return Promise.resolve(respuesta({ data: { admins: [], solicitudes } }));
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

describe("AdminUsuarios - solicitudes pendientes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuth.mockReturnValue({ usuario });
  });

  it("renderiza nombre, email, fecha y mantiene la asignacion manual", async () => {
    configurarFetch();

    render(<AdminUsuarios />);

    expect(await screen.findByText("Solicitudes pendientes")).toBeInTheDocument();
    expect(screen.getByText("Persona Solicitante")).toBeInTheDocument();
    expect(screen.getByText("persona@test.com")).toBeInTheDocument();
    expect(screen.getByText(/2026/)).toBeInTheDocument();
    expect(screen.getByPlaceholderText("UID del usuario a convertir en admin")).toBeInTheDocument();
  });

  it("no muestra Invalid Date cuando la fecha de solicitud no es valida", async () => {
    configurarFetch({ solicitudes: [{ ...solicitud, adminRequestedAt: "fecha-invalida" }] });

    render(<AdminUsuarios />);

    const fila = (await screen.findByText("Persona Solicitante")).closest("tr");
    expect(fila).toHaveTextContent("—");
    expect(fila).not.toHaveTextContent("Invalid Date");
  });

  it("aprueba una solicitud, envia el UID y recarga la lista", async () => {
    const fetchMock = configurarFetch();
    const user = userEvent.setup();

    render(<AdminUsuarios />);
    await user.click(await screen.findByRole("button", { name: "Aprobar" }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith("/api/admin/usuarios", expect.objectContaining({
      method: "POST",
      headers: expect.objectContaining({ Authorization: "Bearer id-token" }),
      body: JSON.stringify({ uid: "u1", action: "approve" }),
    })));
    expect(fetchMock.mock.calls.filter(([url, init]) => url === "/api/admin/usuarios" && !init?.method).length).toBeGreaterThanOrEqual(2);
    expect(await screen.findByText("Administrador agregado correctamente")).toBeInTheDocument();
  });

  it("rechaza una solicitud con PATCH y la accion reject", async () => {
    const fetchMock = configurarFetch();
    const user = userEvent.setup();

    render(<AdminUsuarios />);
    await user.click(await screen.findByRole("button", { name: "Rechazar" }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith("/api/admin/usuarios", expect.objectContaining({
      method: "PATCH",
      headers: expect.objectContaining({ Authorization: "Bearer id-token" }),
      body: JSON.stringify({ uid: "u1", action: "reject" }),
    })));
    expect(await screen.findByText("Solicitud rechazada")).toBeInTheDocument();
  });

  it("muestra el estado vacio sin ocultar el input manual", async () => {
    configurarFetch({ solicitudes: [] });

    render(<AdminUsuarios />);

    expect(await screen.findByText("No hay solicitudes pendientes")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("UID del usuario a convertir en admin")).toBeInTheDocument();
  });

  it("actualiza una solicitud nueva sin recargar la pagina", async () => {
    const estado = { solicitudes: [] as typeof solicitud[] };
    const fetchMock = vi.fn().mockImplementation((url: string, init?: RequestInit) => {
      if (url.includes("role=customer")) return Promise.resolve(respuesta({ data: { clientes: [] } }));
      if (init?.method) return Promise.resolve(respuesta({ success: true }));
      return Promise.resolve(respuesta({ data: { admins: [], solicitudes: estado.solicitudes } }));
    });
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();

    render(<AdminUsuarios />);
    expect(await screen.findByText("No hay solicitudes pendientes")).toBeInTheDocument();

    estado.solicitudes = [solicitud];
    await user.click(screen.getByRole("button", { name: "Actualizar solicitudes" }));

    expect(await screen.findByText("Persona Solicitante")).toBeInTheDocument();
    expect(fetchMock.mock.calls.filter(([url, init]) => url === "/api/admin/usuarios" && !init?.method).length).toBe(2);
  });

  it("muestra el error de carga y mantiene el input manual", async () => {
    configurarFetch({ error: true });

    render(<AdminUsuarios />);

    expect(await screen.findByText("No se pudieron cargar administradores")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("UID del usuario a convertir en admin")).toBeInTheDocument();
  });
});
