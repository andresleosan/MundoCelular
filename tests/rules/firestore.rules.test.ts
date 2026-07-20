// @vitest-environment node
import { readFileSync } from "node:fs";
import { beforeAll, afterAll, describe, it } from "vitest";
import { initializeTestEnvironment, assertSucceeds, assertFails, type RulesTestEnvironment } from "@firebase/rules-unit-testing";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";

let testEnv: RulesTestEnvironment;

beforeAll(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: "demo-mundocelular",
    firestore: { rules: readFileSync("firestore.rules", "utf8"), host: "127.0.0.1", port: 8085 },
  });
});

afterAll(async () => { await testEnv.cleanup(); });

describe("productos", () => {
  it("lectura pública, escritura denegada sin auth", async () => {
    const anon = testEnv.unauthenticatedContext().firestore();
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), "productos/p1"), { nombre: "iPhone 13", precio: 100 });
    });
    await assertSucceeds(getDoc(doc(anon, "productos/p1")));
    await assertFails(setDoc(doc(anon, "productos/p2"), { nombre: "X" }));
  });

  it("cliente normal NO puede escribir precio/stock; admin sí", async () => {
    const cliente = testEnv.authenticatedContext("u1").firestore();
    await assertFails(setDoc(doc(cliente, "productos/p3"), { nombre: "X", precio: 1 }));
    const admin = testEnv.authenticatedContext("a1", { admin: true }).firestore();
    await assertSucceeds(setDoc(doc(admin, "productos/p3"), { nombre: "X", precio: 1, stock: 5 }));
  });
});

describe("carritos", () => {
  it("solo el dueño lee/escribe su carrito", async () => {
    const u1 = testEnv.authenticatedContext("u1").firestore();
    const u2 = testEnv.authenticatedContext("u2").firestore();
    await assertSucceeds(setDoc(doc(u1, "carritos/u1"), { items: [] }));
    await assertFails(getDoc(doc(u2, "carritos/u1")));
    await assertFails(setDoc(doc(u2, "carritos/u1"), { items: [] }));
  });
});

describe("pedidos", () => {
  it("ningún cliente puede crear pedidos directamente", async () => {
    const u1 = testEnv.authenticatedContext("u1").firestore();
    await assertFails(setDoc(doc(u1, "pedidos/ped1"), { clienteUid: "u1", total: 100 }));
  });

  it("el dueño lee su pedido; otro cliente no", async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), "pedidos/ped1"), { clienteUid: "u1", total: 100, estado: "pendiente" });
    });
    const u1 = testEnv.authenticatedContext("u1").firestore();
    const u2 = testEnv.authenticatedContext("u2").firestore();
    await assertSucceeds(getDoc(doc(u1, "pedidos/ped1")));
    await assertFails(getDoc(doc(u2, "pedidos/ped1")));
  });

  it("admin solo puede cambiar estado/actualizadoEn, no el total", async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), "pedidos/ped2"), { clienteUid: "u1", total: 100, estado: "pendiente" });
    });
    const admin = testEnv.authenticatedContext("a1", { admin: true }).firestore();
    await assertSucceeds(updateDoc(doc(admin, "pedidos/ped2"), { estado: "contactado" }));
    await assertFails(updateDoc(doc(admin, "pedidos/ped2"), { total: 1 }));
  });
});
