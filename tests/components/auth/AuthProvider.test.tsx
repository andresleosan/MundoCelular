import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AuthProvider, useAuthContext } from "@/components/auth/AuthProvider";

const { onIdTokenChanged, getAuthClient } = vi.hoisted(() => ({
  onIdTokenChanged: vi.fn(() => vi.fn()),
  getAuthClient: vi.fn(() => ({})),
}));

vi.mock("firebase/auth", () => ({ onIdTokenChanged }));
vi.mock("@/lib/firebase", () => ({ getAuthClient }));

describe("AuthProvider", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("no inicializa Auth hasta que un flujo protegido lo activa", async () => {
    render(
      <AuthProvider>
        <AuthActivator />
      </AuthProvider>,
    );

    expect(getAuthClient).not.toHaveBeenCalled();
    expect(onIdTokenChanged).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "Activar auth" }));

    await waitFor(() => {
      expect(getAuthClient).toHaveBeenCalledOnce();
      expect(onIdTokenChanged).toHaveBeenCalledOnce();
    });
  });
});

function AuthActivator() {
  const { activarAuth } = useAuthContext();
  return <button onClick={activarAuth}>Activar auth</button>;
}
