import sharp from "sharp";
import toIco from "to-ico";
import { mkdir, writeFile } from "node:fs/promises";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");
const source = resolve(root, "Logo.JPG");
const iconsDir = resolve(root, "public", "icons");
const appDir = resolve(root, "src", "app");

await mkdir(iconsDir, { recursive: true });

const sizes = [
  { size: 32, name: "favicon-32.png" },
  { size: 64, name: "favicon-64.png" },
  { size: 180, name: "apple-touch-icon-180.png" },
  { size: 192, name: "icon-192.png" },
  { size: 256, name: "favicon-256.png" },
  { size: 384, name: "icon-384.png" },
  { size: 512, name: "icon-512.png" },
];

const base = sharp(source).resize({ fit: "contain", background: { r: 255, g: 255, b: 255, alpha: 1 } });

for (const { size, name } of sizes) {
  await base.clone().resize(size, size).png().toFile(resolve(iconsDir, name));
  console.log(`✓ ${name} (${size}x${size})`);
}

await sharp(source)
  .resize(40, 40, { fit: "contain", background: { r: 255, g: 255, b: 255, alpha: 0 } })
  .png()
  .toFile(resolve(iconsDir, "logo-header.png"));
console.log("✓ logo-header.png (40x40)");

await sharp(source)
  .resize(56, 56, { fit: "contain", background: { r: 255, g: 255, b: 255, alpha: 0 } })
  .png()
  .toFile(resolve(iconsDir, "logo-footer.png"));
console.log("✓ logo-footer.png (56x56)");

await sharp({
  create: { width: 512, height: 512, channels: 4, background: { r: 30, g: 79, b: 168, alpha: 1 } },
})
  .composite([{ input: await base.clone().resize(384, 384).png().toBuffer(), gravity: "center" }])
  .png()
  .toFile(resolve(iconsDir, "icon-512-maskable.png"));
console.log("✓ icon-512-maskable.png (512x512 con padding primary)");

const ico16 = await base.clone().resize(16, 16).png().toBuffer();
const ico32 = await base.clone().resize(32, 32).png().toBuffer();
const ico48 = await base.clone().resize(48, 48).png().toBuffer();
const icoBuffer = await toIco([ico16, ico32, ico48]);
await writeFile(resolve(appDir, "favicon.ico"), icoBuffer);
console.log("✓ src/app/favicon.ico (multi-tamaño 16/32/48)");

console.log("\nTodos los iconos regenerados correctamente.");
