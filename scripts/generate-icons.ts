import sharp from "sharp";
import { writeFileSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";

const BLUE = "#143b98";

function svgIcon(size: number): string {
  const fontSize = Math.round(size / 2.2);
  return `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
  <rect width="100%" height="100%" fill="${BLUE}"/>
  <text x="50%" y="55%" font-family="Arial, sans-serif" font-size="${fontSize}" font-weight="bold" text-anchor="middle" fill="#ffffff">MC</text>
</svg>`;
}

function svgMaskable(size: number): string {
  return svgIcon(size);
}

function svgOgDefault(): string {
  return `<svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
  <rect width="100%" height="100%" fill="${BLUE}"/>
  <text x="50%" y="42%" font-family="Arial, sans-serif" font-size="72" font-weight="bold" text-anchor="middle" fill="#ffffff">Mundo Celular</text>
  <text x="50%" y="60%" font-family="Arial, sans-serif" font-size="32" text-anchor="middle" fill="#ffffff" opacity="0.85">Tecnología en Medellín</text>
</svg>`;
}

async function main() {
  mkdirSync(resolve("public/icons"), { recursive: true });

  const targets = [
    { file: "public/icons/icon-192.png", size: 192, svg: svgIcon(192) },
    { file: "public/icons/icon-512.png", size: 512, svg: svgIcon(512) },
    { file: "public/icons/icon-512-maskable.png", size: 512, svg: svgMaskable(512) },
    { file: "public/icons/favicon-32.png", size: 32, svg: svgIcon(32) },
    { file: "public/icons/apple-touch-icon-180.png", size: 180, svg: svgIcon(180) },
    { file: "public/og-default.png", size: null, svg: svgOgDefault() },
  ];

  for (const t of targets) {
    const png = await sharp(Buffer.from(t.svg)).png().toBuffer();
    writeFileSync(t.file, png);
    console.log(`OK: ${t.file}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
