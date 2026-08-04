import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const indexes = JSON.parse(
  readFileSync(resolve(process.cwd(), "firestore.indexes.json"), "utf8"),
);

describe("índices de consultas públicas de Firestore", () => {
  it("declara los índices requeridos para productos ordenados", () => {
    const required = [
      [
        { fieldPath: "activo", order: "ASCENDING" },
        { fieldPath: "nombre", order: "ASCENDING" },
      ],
      [
        { fieldPath: "categoriaId", order: "ASCENDING" },
        { fieldPath: "activo", order: "ASCENDING" },
        { fieldPath: "nombre", order: "ASCENDING" },
      ],
      [
        { fieldPath: "activo", order: "ASCENDING" },
        { fieldPath: "destacado", order: "ASCENDING" },
        { fieldPath: "nombre", order: "ASCENDING" },
      ],
    ];

    for (const fields of required) {
      expect(indexes.indexes).toContainEqual({
        collectionGroup: "productos",
        queryScope: "COLLECTION",
        fields,
      });
    }
  });
});
