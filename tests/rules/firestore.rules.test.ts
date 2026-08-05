// @vitest-environment node
import { readFileSync } from "node:fs";
import { beforeAll, afterAll, describe, it } from "vitest";
import { initializeTestEnvironment, assertSucceeds, assertFails, type RulesTestEnvironment } from "@firebase/rules-unit-testing";
import { collection, deleteDoc, doc, getDoc, getDocs, orderBy, query, setDoc, updateDoc, where } from "firebase/firestore";

let testEnv: RulesTestEnvironment;
const firestorePort = Number(process.env.FIRESTORE_EMULATOR_PORT ?? "8085");

beforeAll(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: "demo-mundocelular",
    firestore: { rules: readFileSync("firestore.rules", "utf8"), host: "127.0.0.1", port: firestorePort },
  });
  await testEnv.clearFirestore();
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

describe("variantes", () => {
  it("lectura pública, escritura denegada sin auth", async () => {
    const anon = testEnv.unauthenticatedContext().firestore();
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), "variantes/v1"), { productId: "p1", precio: 100, stock: 5 });
    });
    await assertSucceeds(getDoc(doc(anon, "variantes/v1")));
    await assertFails(setDoc(doc(anon, "variantes/v2"), { productId: "p1", precio: 1 }));
  });

  it("cliente normal NO puede escribir; admin sí", async () => {
    const cliente = testEnv.authenticatedContext("u1").firestore();
    await assertFails(setDoc(doc(cliente, "variantes/v3"), { productId: "p1", precio: 1 }));
    const admin = testEnv.authenticatedContext("a1", { admin: true }).firestore();
    await assertSucceeds(setDoc(doc(admin, "variantes/v3"), { productId: "p1", precio: 1, stock: 5 }));
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

  it("permite consultar solo los pedidos propios y conserva lectura admin", async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), "pedidos/ped-cliente-1"), {
        clienteUid: "u1",
        total: 100,
        estado: "pendiente",
        creadoEn: new Date("2026-08-05T10:00:00Z"),
      });
      await setDoc(doc(ctx.firestore(), "pedidos/ped-cliente-2"), {
        clienteUid: "u2",
        total: 200,
        estado: "contactado",
        creadoEn: new Date("2026-08-05T11:00:00Z"),
      });
    });

    const u1 = testEnv.authenticatedContext("u1").firestore();
    const admin = testEnv.authenticatedContext("a1", { admin: true }).firestore();

    const pedidosPropios = query(
      collection(u1, "pedidos"),
      where("clienteUid", "==", "u1"),
      orderBy("creadoEn", "desc"),
    );
    const pedidosAjenos = query(
      collection(u1, "pedidos"),
      where("clienteUid", "==", "u2"),
      orderBy("creadoEn", "desc"),
    );

    await assertSucceeds(getDocs(pedidosPropios));
    await assertFails(getDocs(pedidosAjenos));
    await assertSucceeds(getDocs(query(collection(admin, "pedidos"), orderBy("creadoEn", "desc"))));
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

describe("users", () => {
  it("permite crear solo el perfil cliente propio con campos permitidos", async () => {
    const cliente = testEnv.authenticatedContext("u-create").firestore();

    await assertSucceeds(setDoc(doc(cliente, "users/u-create"), {
      uid: "u-create",
      email: "cliente@test.com",
      displayName: "Cliente",
      photoURL: "",
      role: "customer",
      active: true,
      createdAt: new Date(),
      lastLogin: new Date(),
    }));
  });

  it("impide crear un perfil admin o campos de solicitud desde el cliente", async () => {
    const cliente = testEnv.authenticatedContext("u-escalation").firestore();
    const base = {
      uid: "u-escalation",
      email: "cliente@test.com",
      displayName: "Cliente",
      photoURL: "",
      active: true,
      createdAt: new Date(),
      lastLogin: new Date(),
    };

    await assertFails(setDoc(doc(cliente, "users/u-escalation"), { ...base, role: "admin" }));
    await assertFails(setDoc(doc(cliente, "users/u-escalation"), {
      ...base,
      role: "customer",
      adminRequestStatus: "pending",
    }));
  });

  it("impide actualizar o borrar el perfil propio; admin si puede", async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), "users/u-existing"), {
        uid: "u-existing",
        role: "customer",
        active: true,
      });
    });

    const cliente = testEnv.authenticatedContext("u-existing").firestore();
    await assertFails(updateDoc(doc(cliente, "users/u-existing"), { role: "admin" }));
    await assertFails(deleteDoc(doc(cliente, "users/u-existing")));

    const admin = testEnv.authenticatedContext("a-users", { admin: true }).firestore();
    await assertSucceeds(updateDoc(doc(admin, "users/u-existing"), { role: "admin" }));
    await assertSucceeds(deleteDoc(doc(admin, "users/u-existing")));
  });
});

describe("rateLimits", () => {
  it("no expone el store a clientes, usuarios autenticados ni admins", async () => {
    const contexts = [
      testEnv.unauthenticatedContext().firestore(),
      testEnv.authenticatedContext("u-rate-limit").firestore(),
      testEnv.authenticatedContext("a-rate-limit", { admin: true }).firestore(),
    ];

    for (const db of contexts) {
      await assertFails(getDoc(doc(db, "rateLimits/admin-request:test")));
      await assertFails(setDoc(doc(db, "rateLimits/admin-request:test"), { count: 1 }));
    }
  });
});
