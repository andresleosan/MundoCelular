import { act, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ConfigProvider, useConfig } from "@/components/auth/ConfigProvider";

const { getDb, doc, getDoc } = vi.hoisted(() => ({
  getDb: vi.fn(() => ({ name: "db" })),
  doc: vi.fn(() => ({ path: "configuracion/tienda" })),
  getDoc: vi.fn(),
}));

vi.mock("@/lib/firebase", () => ({ getDb }));
vi.mock("firebase/firestore", () => ({ doc, getDoc }));
const { usePathname } = vi.hoisted(() => ({ usePathname: vi.fn(() => "/contacto") }));

vi.mock("next/navigation", () => ({ usePathname }));

function Probe() {
  const config = useConfig();
  return <span>{config.whatsapp}</span>;
}

describe("ConfigProvider", () => {
  let idleCallback: (() => void) | null;

  beforeEach(() => {
    vi.clearAllMocks();
    idleCallback = null;
    getDoc.mockResolvedValue({
      exists: () => true,
      data: () => ({ whatsapp: "573001112233" }),
    });
    vi.stubGlobal("requestIdleCallback", (callback: () => void) => {
      idleCallback = callback;
      return 1;
    });
    vi.stubGlobal("cancelIdleCallback", vi.fn());
  });

  it("usa el fallback durante la carga inicial y difiere Firestore al navegador inactivo", async () => {
    render(
      <ConfigProvider>
        <Probe />
      </ConfigProvider>,
    );

    expect(screen.getByText("573147757223")).toBeInTheDocument();
    expect(getDoc).not.toHaveBeenCalled();

    await act(async () => {
      idleCallback?.();
    });

    await waitFor(() => expect(screen.getByText("573001112233")).toBeInTheDocument());
    expect(getDoc).toHaveBeenCalledOnce();
  });

  it("no abre Firestore en la Home", async () => {
    usePathname.mockReturnValue("/");

    render(
      <ConfigProvider>
        <Probe />
      </ConfigProvider>,
    );

    expect(screen.getByText("573147757223")).toBeInTheDocument();
    expect(getDoc).not.toHaveBeenCalled();
  });
});
