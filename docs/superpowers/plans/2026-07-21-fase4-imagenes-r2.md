# Fase 4 — Imágenes R2 + Worker presign — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implementar subida de imágenes a Cloudflare R2 con compresión WebP del lado del cliente, presigned URLs, galería de hasta 5 imágenes por producto, y visualización optimizada en tienda.

**Architecture:** API routes Next.js para presigned URLs (usa SDK S3-compatible de AWS para R2). Compresión/resize en cliente con canvas API. Admin form con drag/drop. Galería en detalle de producto.

**Tech Stack:** Next.js 15, React 19, TypeScript 5, Tailwind v4, @aws-sdk/s3-request-presigner, @aws-sdk/client-s3, browser-image-compression (o canvas nativo).

## Global Constraints

- **Spec de referencia:** `docs/superpowers/specs/2026-07-21-fase4-imagenes-r2-design.md`
- **Máximo 5 imágenes por producto**
- **Formato de salida:** WebP (full 1600px, thumb 600px)
- **Sin Firebase Storage** — todo va a R2
- **Commits:** Conventional Commits en español

---

### Task 1: Dependencias + configuración R2

**Files:**
- Modify: `package.json` (añadir @aws-sdk/client-s3, @aws-sdk/s3-request-presigner, browser-image-compression)
- Modify: `.env.local.example` (añadir vars R2)
- Create: `src/lib/r2.ts` (cliente R2)

- [ ] **Step 1: Instalar dependencias**

```bash
npm i @aws-sdk/client-s3 @aws-sdk/s3-request-presigner
```

Nota: `browser-image-compression` se instala si se usa compresión via lib; alternativa es canvas nativo (sin dependencia extra).

- [ ] **Step 2: Variables de entorno**

`.env.local.example` — añadir:
```bash
# Cloudflare R2
R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET_NAME=mundocelular-images
R2_PUBLIC_URL=https://img.mundocelular.com
```

- [ ] **Step 3: Cliente R2 `src/lib/r2.ts`**

```ts
import { S3Client } from "@aws-sdk/client-s3";

export function getR2Client(): S3Client {
  return new S3Client({
    region: "auto",
    endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID ?? "",
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY ?? "",
    },
  });
}

export const R2_BUCKET = process.env.R2_BUCKET_NAME ?? "";
export const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL ?? "";
```

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json src/lib/r2.ts .env.local.example
git commit -m "chore: instalar SDK R2 y configurar cliente"
```

---

### Task 2: API Route `POST /api/imagenes/presign`

**Files:**
- Create: `src/app/api/imagenes/presign/route.ts`

- [ ] **Step 1: Implementar `src/app/api/imagenes/presign/route.ts`**

```ts
import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "firebase-admin/auth";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { getR2Client, R2_BUCKET } from "@/lib/r2";

const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_SIZE = 5 * 1024 * 1024; // 5MB

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  let decoded;
  try {
    decoded = await getAuth().verifyIdToken(authHeader.slice(7));
  } catch {
    return NextResponse.json({ error: "Token inv\u00e1lido" }, { status: 401 });
  }

  if (decoded.admin !== true) {
    return NextResponse.json({ error: "Solo administradores" }, { status: 403 });
  }

  const body = (await req.json()) as { filename?: string; contentType?: string; size?: number };

  if (!body.filename || !body.contentType) {
    return NextResponse.json({ error: "filename y contentType requeridos" }, { status: 400 });
  }

  if (!ALLOWED_TYPES.has(body.contentType)) {
    return NextResponse.json({ error: "Tipo no permitido. Usa jpeg, png o webp" }, { status: 400 });
  }

  if (body.size && body.size > MAX_SIZE) {
    return NextResponse.json({ error: "Archivo demasiado grande (m\u00e1ximo 5MB)" }, { status: 400 });
  }

  const ext = body.contentType === "image/png" ? "png" : "webp";
  const key = `productos/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

  const command = new PutObjectCommand({
    Bucket: R2_BUCKET,
    Key: key,
    ContentType: body.contentType,
  });

  const client = getR2Client();
  const url = await getSignedUrl(client, command, { expiresIn: 600 }); // 10 min

  return NextResponse.json({ url, key });
}
```

- [ ] **Step 2: Verificar build**

```bash
npx tsc --noEmit
npm run lint
```

- [ ] **Step 3: Commit**

```bash
git add src/app/api/imagenes
git commit -m "feat: endpoint POST /api/imagenes/presign para R2"
```

---

### Task 3: API Route `DELETE /api/imagenes/[key]`

**Files:**
- Create: `src/app/api/imagenes/[key]/route.ts`

- [ ] **Step 1: Implementar eliminación**

```ts
import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "firebase-admin/auth";
import { DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getR2Client, R2_BUCKET } from "@/lib/r2";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ key: string }> }
) {
  const { key } = await params;

  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  let decoded;
  try {
    decoded = await getAuth().verifyIdToken(authHeader.slice(7));
  } catch {
    return NextResponse.json({ error: "Token inv\u00e1lido" }, { status: 401 });
  }

  if (decoded.admin !== true) {
    return NextResponse.json({ error: "Solo administradores" }, { status: 403 });
  }

  const decodedKey = decodeURIComponent(key);

  const client = getR2Client();
  await client.send(new DeleteObjectCommand({ Bucket: R2_BUCKET, Key: decodedKey }));

  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 2: Verificar build**

```bash
npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add src/app/api/imagenes/[key]
git commit -m "feat: endpoint DELETE /api/imagenes/[key] para R2"
```

---

### Task 4: Utilidad de compresión de imágenes (cliente)

**Files:**
- Create: `src/lib/image-compress.ts`

- [ ] **Step 1: Implementar compresión con canvas nativo**

```ts
interface CompressedImage {
  blob: Blob;
  width: number;
  height: number;
}

async function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function resizeCanvas(
  img: HTMLImageElement,
  maxWidth: number
): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  const ratio = Math.min(maxWidth / img.naturalWidth, 1);
  canvas.width = img.naturalWidth * ratio;
  canvas.height = img.naturalHeight * ratio;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  return canvas;
}

export async function comprimirImagen(
  file: File,
  maxWidth: number,
  quality = 0.85
): Promise<CompressedImage> {
  const dataUrl = await new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.readAsDataURL(file);
  });

  const img = await loadImage(dataUrl);
  const canvas = resizeCanvas(img, maxWidth);

  return new Promise((resolve) => {
    canvas.toBlob(
      (blob) => resolve({ blob: blob!, width: canvas.width, height: canvas.height }),
      "image/webp",
      quality
    );
  });
}

export async function prepararImagenes(
  file: File
): Promise<{ full: CompressedImage; thumb: CompressedImage }> {
  const full = await comprimirImagen(file, 1600);
  const thumb = await comprimirImagen(file, 600);
  return { full, thumb };
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/image-compress.ts
git commit -m "feat: utilidad de compresion WebP con canvas nativo"
```

---

### Task 5: Hook `useImageUpload` — subida completa

**Files:**
- Create: `src/hooks/useImageUpload.ts`

- [ ] **Step 1: Implementar hook**

```ts
import { useState } from "react";
import { prepararImagenes } from "@/lib/image-compress";
import { useAuth } from "./useAuth";

interface UploadedImage {
  url: string;
  thumb: string;
  alt: string;
}

export function useImageUpload() {
  const { usuario } = useAuth();
  const [subiendo, setSubiendo] = useState(false);
  const [progreso, setProgreso] = useState(0);

  async function subirImagen(file: File, alt?: string): Promise<UploadedImage> {
    if (!usuario) throw new Error("No autenticado");
    setSubiendo(true);
    setProgreso(0);

    try {
      const token = await usuario.getIdToken();
      const { full, thumb } = await prepararImagenes(file);
      setProgreso(30);

      // 1. Pedir presigned URL para full
      const resFull = await fetch("/api/imagenes/presign", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ filename: `${file.name}-full`, contentType: "image/webp", size: full.blob.size }),
      });
      const { url: fullUrl, key: fullKey } = await resFull.json();
      if (!resFull.ok) throw new Error("Error al generar URL de subida");

      // 2. Subir full a R2
      await fetch(fullUrl, { method: "PUT", body: full.blob, headers: { "Content-Type": "image/webp" } });
      setProgreso(60);

      // 3. Pedir presigned URL para thumb
      const resThumb = await fetch("/api/imagenes/presign", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ filename: `${file.name}-thumb`, contentType: "image/webp", size: thumb.blob.size }),
      });
      const { url: thumbUrl } = await resThumb.json();
      if (!resThumb.ok) throw new Error("Error al generar URL de subida thumb");

      // 4. Subir thumb a R2
      await fetch(thumbUrl, { method: "PUT", body: thumb.blob, headers: { "Content-Type": "image/webp" } });
      setProgreso(100);

      const publicBase = process.env.NEXT_PUBLIC_R2_PUBLIC_URL ?? "";
      const fullUrlPublic = `${publicBase}/${fullKey}`;
      const thumbKey = thumbUrl.split("?")[0].split("/").pop();
      const thumbUrlPublic = `${publicBase}/${thumbKey}`;

      return { url: fullUrlPublic, thumb: thumbUrlPublic, alt: alt || file.name };
    } finally {
      setSubiendo(false);
      setProgreso(0);
    }
  }

  async function eliminarImagen(key: string): Promise<void> {
    if (!usuario) throw new Error("No autenticado");
    const token = await usuario.getIdToken();
    await fetch(`/api/imagenes/${encodeURIComponent(key)}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
  }

  return { subirImagen, eliminarImagen, subiendo, progreso };
}
```

- [ ] **Step 2: Commit**

```bash
git add src/hooks/useImageUpload.ts
git commit -m "feat: hook useImageUpload para subida a R2 con progreso"
```

`

---

### Task 6: Componente `ImageUploader` (drag/drop + preview)

**Files:**
- Create: `src/components/admin/ImageUploader.tsx`

- [ ] **Step 1: Implementar componente**

Componente client-side con:
- Dropzone para drag/drop o click para seleccionar
- Preview de imágenes existentes (con botón eliminar)
- Reordenamiento (drag para mover)
- Campo alt text por imagen
- Indicador de progreso durante subida
- Máximo 5 imágenes

- [ ] **Step 2: Commit**

```bash
git add src/components/admin/ImageUploader.tsx
git commit -m "feat: componente ImageUploader con drag/drop, preview y alt text"
```

---

### Task 7: Actualizar `ProductoForm` + `validacion.ts`

**Files:**
- Modify: `src/components/admin/ProductoForm.tsx`
- Modify: `src/lib/validacion.ts`
- Modify: `src/lib/firestore/productos.ts`

- [ ] **Step 1: Añadir `imagenes` a `ProductoInput` en `validacion.ts`**

- [ ] **Step 2: Integrar `ImageUploader` en `ProductoForm`**

- [ ] **Step 3: Guardar `imagenes` al crear/actualizar producto**

- [ ] **Step 4: Verificar build**

```bash
npx tsc --noEmit
npm run lint
```

- [ ] **Step 5: Commit**

```bash
git add src/components/admin/ProductoForm.tsx src/lib/validacion.ts src/lib/firestore/productos.ts
git commit -m "feat: ProductoForm con ImageUploader y guardado de imagenes en Firestore"
```

---

### Task 8: Galería en `ProductDetail` + actualizar cards

**Files:**
- Modify: `src/components/producto/ProductDetail.tsx`
- Modify: `src/components/storefront/HeroProductCard.tsx`
- Modify: `src/components/storefront/ProductCard.tsx`

- [ ] **Step 1: Galería en `ProductDetail`**

Mostrar thumbnails como miniaturas clickeables, imagen full grande.
Si no hay imágenes, mostrar placeholder.

- [ ] **Step 2: Actualizar `HeroProductCard` y `ProductCard`**

Usar `producto.imagenes[0]?.thumb` en lugar de `url` para mejor performance.
Si no hay imágenes, mantener placeholder "Sin imagen".

- [ ] **Step 3: Verificar build**

```bash
npx tsc --noEmit
npm run lint
```

- [ ] **Step 4: Commit**

```bash
git add src/components/producto src/components/storefront
git commit -m "feat: galeria en ProductDetail y cards usan thumb para performance"
```

---

### Task 9: Verificación final

- [ ] **Step 1: Full typecheck + lint**

```bash
npx tsc --noEmit
npm run lint
```

- [ ] **Step 2: Resumen de archivos**

Creados:
- `src/lib/r2.ts`
- `src/app/api/imagenes/presign/route.ts`
- `src/app/api/imagenes/[key]/route.ts`
- `src/lib/image-compress.ts`
- `src/hooks/useImageUpload.ts`
- `src/components/admin/ImageUploader.tsx`

Modificados:
- `package.json` (SDKs R2)
- `.env.local.example` (vars R2)
- `src/components/admin/ProductoForm.tsx`
- `src/lib/validacion.ts`
- `src/lib/firestore/productos.ts`
- `src/components/producto/ProductDetail.tsx`
- `src/components/storefront/HeroProductCard.tsx`
- `src/components/storefront/ProductCard.tsx`
