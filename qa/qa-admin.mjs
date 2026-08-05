import { chromium } from "playwright";
import { config } from "dotenv";

config({ path: ".env.local" });

const QA_ADMIN_EMAIL = process.env.QA_ADMIN_EMAIL;
const QA_ADMIN_PASSWORD = process.env.QA_ADMIN_PASSWORD;

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
const errores = [];

page.on("console", (m) => { if (m.type() === "error") errores.push(m.text()); });

await page.goto("https://mundocelular.vercel.app/login", { waitUntil: "domcontentloaded", timeout: 60000 });
await page.waitForTimeout(2500);
await page.fill('input[type="email"]', QA_ADMIN_EMAIL);
await page.fill('input[type="password"]', QA_ADMIN_PASSWORD);
await page.getByRole("button", { name: /administrador/i }).click();
await page.locator("main").getByRole("button", { name: "Iniciar sesión", exact: true }).click();

let ok = false;
try {
  await page.waitForURL("**/admin", { timeout: 30000 });
  ok = true;
} catch {
  console.log("URL final:", page.url());
}

const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
console.log(`PASS login-admin: ${ok}`);
console.log(`PASS sin-overflow: ${!overflow}`);
console.log(`PASS consola-sin-errores: ${errores.length === 0}`);
if (errores.length) console.log("ERRORES: " + errores.join(" | "));
await page.screenshot({ path: "qa/reports/qa-admin-panel.png" }).catch(() => {});
await browser.close();
process.exit(ok && !overflow && errores.length === 0 ? 0 : 1);
