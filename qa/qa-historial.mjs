// QA autenticada del historial de pedidos (FUT-01) contra producción.
// Usa la cuenta QA de cliente (QA_CLIENT_EMAIL / QA_CLIENT_PASSWORD en .env.local).
// No crea ni altera pedidos; solo lee el historial del propio cliente.
import { chromium } from "playwright";
import { config } from "dotenv";

config({ path: ".env.local" });

const BASE = process.env.QA_BASE_URL || "https://mundocelular.vercel.app";
const TIMEOUT = 60000;

const QA_CLIENT_EMAIL = process.env.QA_CLIENT_EMAIL?.trim();
const QA_CLIENT_PASSWORD = process.env.QA_CLIENT_PASSWORD?.trim();
if (!QA_CLIENT_EMAIL || !QA_CLIENT_PASSWORD) {
  console.error("Faltan QA_CLIENT_EMAIL / QA_CLIENT_PASSWORD en .env.local");
  process.exit(1);
}

const fallos = [];
const consoleErrors = [];

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await context.newPage();
page.on("console", (m) => {
  if (m.type() === "error") consoleErrors.push(m.text());
});
page.on("pageerror", (e) => fallos.push("pageerror: " + e.message));

function check(nombre, condicion) {
  console.log(`${condicion ? "PASS" : "FAIL"} ${nombre}: ${condicion}`);
  if (!condicion) fallos.push(nombre);
}

try {
  // 1. Acceso sin sesión
  await page.goto(`${BASE}/cuenta/pedidos`, { waitUntil: "domcontentloaded", timeout: TIMEOUT });
  await page.waitForTimeout(2000);
  check("acceso-visitante", (await page.getByRole("link", { name: "Iniciar sesión" }).count()) === 1);

  // 2. Enlace a /login guarda el destino
  await page.getByRole("link", { name: "Iniciar sesión" }).click();
  await page.waitForURL("**/login", { timeout: TIMEOUT });
  const destino = await page.evaluate(() => localStorage.getItem("login-destino"));
  check("destino-guardado", destino === "/cuenta/pedidos");

  // 3. Login con la cuenta QA de cliente
  await page.fill('input[type="email"]', QA_CLIENT_EMAIL);
  await page.fill('input[type="password"]', QA_CLIENT_PASSWORD);
  await page.getByRole("button", { name: /cliente/i }).click();
  await page.locator("main").getByRole("button", { name: "Iniciar sesión", exact: true }).click();

  // 4. Redirección al destino guardado
  try {
    await page.waitForURL("**/cuenta/pedidos", { timeout: 30000 });
    check("redirect-destino", true);
  } catch {
    check("redirect-destino", false);
    console.log("URL actual: " + page.url());
    const bodyError = await page.textContent("body");
    const mensaje = bodyError
      ? bodyError.match(/Error de autenticación|usuario deshabilitad[oa]|contraseña incorrecta|correo no encontrado|Too many|auth\/[a-z-]+/gi)
      : null;
    console.log("DIAGNOSTICO login: " + (mensaje ? mensaje.join(" | ") : "(sin mensaje visible)"));
  }
  await page.waitForTimeout(4000);

  // 5. Contenido del historial
  const titulo = await page.locator("h1").first().textContent();
  const body = await page.textContent("body");
  const cantidadPedidos = await page.getByRole("button", { name: /^Pedido #/i }).count();
  const vacio = Boolean(body && body.includes("Todavía no tienes pedidos"));
  console.log(`INFO titulo=${titulo} pedidos=${cantidadPedidos} vacio=${vacio}`);
  check("pagina-visible", titulo === "Mis pedidos");
  check("sin-error-firestore", !(body && body.includes("No pudimos cargar tus pedidos")));

  // 6. Sin overflow horizontal
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
  check("sin-overflow", !overflow);

  // 6b. Cargar mas con datos reales (cursor + pagina siguiente)
  const botonCargarMas = page.getByRole("button", { name: "Cargar más" });
  if ((await botonCargarMas.count()) > 0) {
    const antes = cantidadPedidos;
    await botonCargarMas.click();
    await page.waitForTimeout(2500);
    const despues = await page.getByRole("button", { name: /^Pedido #/i }).count();
    check("cargar-mas", despues > antes);
    console.log(`INFO cargar-mas: ${antes} -> ${despues}`);
    check("cargar-mas-desaparece", (await botonCargarMas.count()) === 0);
  } else {
    console.log("INFO cargar-mas: no hay cursor (menos de 10 pedidos)");
  }

  // 7. Detalle y WhatsApp si hay pedidos
  if (cantidadPedidos > 0) {
    await page.getByRole("button", { name: /^Pedido #/i }).first().click();
    await page.waitForTimeout(1500);
    const detalle = await page.textContent("body");
    const waHref = await page
      .getByRole("link", { name: "Abrir conversación en WhatsApp" })
      .getAttribute("href");
    check("detalle-whatsapp", Boolean(waHref && waHref.includes("wa.me/573147757223")));
    check(
      "detalle-privado",
      !(detalle && detalle.includes(QA_CLIENT_EMAIL) && detalle.includes("@" + "cliente.com"))
    );
    await page.screenshot({ path: "qa/reports/qa-historial-detalle.png" });
  } else {
    await page.screenshot({ path: "qa/reports/qa-historial-vacio.png" });
  }

  // 8. Consola sin errores de aplicación
  check("console-sin-errores", consoleErrors.length === 0);
  if (consoleErrors.length) console.log("ERRORES: " + consoleErrors.join(" | "));
} catch (e) {
  fallos.push("excepcion: " + e.message);
  console.error("FAIL excepcion: " + e.message);
  await page.screenshot({ path: "qa/reports/qa-historial-error.png" }).catch(() => {});
} finally {
  await browser.close();
  if (fallos.length) {
    console.log(`RESULTADO: FALLO (${fallos.length}): ` + fallos.join("; "));
    process.exit(1);
  }
  console.log("RESULTADO: OK");
}
