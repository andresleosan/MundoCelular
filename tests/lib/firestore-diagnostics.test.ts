import { describe, expect, it, vi } from "vitest";
import { ejecutarLecturaFirestore } from "@/lib/firestore/diagnostics";

describe("diagnostico de lecturas Firestore", () => {
  it("registra consulta y cantidad sin registrar documentos", async () => {
    const info = vi.spyOn(console, "info").mockImplementation(() => {});
    const snapshot = { docs: [{ id: "p1", data: () => ({ nombre: "privado" }) }] };

    await expect(ejecutarLecturaFirestore(
      { nombre: "productos-activos", coleccion: "productos", filtros: ["activo == true"] },
      async () => snapshot,
    )).resolves.toBe(snapshot);

    expect(info).toHaveBeenCalledWith(
      "[firestore:read]",
      expect.objectContaining({
        nombre: "productos-activos",
        coleccion: "productos",
        filtros: ["activo == true"],
        count: 1,
      }),
    );
    expect(info.mock.calls.flat().join(" ")).not.toContain("privado");
    info.mockRestore();
  });

  it("registra codigo de error y vuelve a lanzar la excepcion", async () => {
    const error = Object.assign(new Error("The query requires an index with secret=private-value"), {
      code: "failed-precondition",
    });
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    await expect(ejecutarLecturaFirestore(
      { nombre: "busqueda-productos", coleccion: "productos", filtros: ["activo == true", "orderBy nombre"] },
      async () => { throw error; },
    )).rejects.toBe(error);

    expect(errorSpy).toHaveBeenCalledWith(
      "[firestore:read:error]",
      expect.objectContaining({
        nombre: "busqueda-productos",
        code: "failed-precondition",
        message: "Firestore query precondition failed",
      }),
    );
    expect(errorSpy.mock.calls.flat().join(" ")).not.toContain("private-value");
    errorSpy.mockRestore();
  });

  it.each([
    [7, "permission-denied"],
    [9, "failed-precondition"],
  ])("mapea el codigo gRPC numerico %s a %s", async (numericCode, expectedCode) => {
    const error = Object.assign(new Error("Firestore read failed"), {
      code: numericCode,
    });
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    try {
      await expect(ejecutarLecturaFirestore(
        { nombre: "lectura-con-error-grpc", coleccion: "productos", filtros: [] },
        async () => { throw error; },
      )).rejects.toBe(error);

      expect(errorSpy).toHaveBeenCalledWith(
        "[firestore:read:error]",
        expect.objectContaining({ code: expectedCode }),
      );
    } finally {
      errorSpy.mockRestore();
    }
  });
});
