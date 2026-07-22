# Fase 4 — Imágenes R2 + Worker presign — Design Spec

**Fecha:** 2026-07-21
**Estado:** Aprobado por el operador
**Spec de referencia:** `docs/superpowers/specs/2026-07-19-mundocelular-mvp-design.md` (secciones 2, 5, 9)

---

## 1. Objetivo

Permitir al admin subir imágenes de productos a Cloudflare R2, con compresión WebP del lado del cliente, generación automática de thumb (600px), y galería de hasta 5 imágenes por producto en la página pública.

## 2. Alcance

### INCLUIDO
- API presigned URL (`POST /api/imagenes/presign`) — genera URL firmada para subir a R2
- Compresión WebP en el cliente antes de subir (max 5MB, resize a 1600px wide)
- Generación de thumb (600px wide) en el cliente
- Admin form actualizado con drag/drop, preview, reordenamiento, alt text
- Galería de imágenes en detalle de producto (máx 5)
- Imágenes en ProductCard y HeroProductCard (usar thumb)
- Eliminación de imágenes de R2 (`DELETE /api/imagenes/[key]`)

### NO INCLUIDO
- Procesamiento server-side de imágenes (resize se hace en cliente)
- Watermarks
- Cropping manual

## 3. Arquitectura

```
ADMIN (Next.js client)
├── Compresión WebP + resize (canvas/sharp-like lib)
├── POST /api/imagenes/presign  → recibe { url, key }
├── PUT <presigned-url>         → sube directo a R2
├── Guarda { url, thumb, alt } en Firestore (via ProductoForm)
│
API (Next.js server)
├── POST /api/imagenes/presign  → genera URL firmada (R2 S3 API)
├── DELETE /api/imagenes/[key]  → elimina imagen de R2
│
R2 (Cloudflare)
├── Bucket: mundocelular-images
├── Servido por: img.mundocelular.com o r2.dev
```

## 4. Modelo de datos — `imagenes` en `productos`

Ya definido en el tipo `ImagenProducto`:
```ts
{
  url: string;    // URL completa de la imagen full (1600px)
  thumb: string;  // URL completa de la thumb (600px)
  alt: string;    // Texto alternativo SEO
}
```

## 5. Flujo de subida

1. Admin arrastra/selecciona imagen en el form
2. Cliente comprime a WebP, redimensiona a 1600px (full) y 600px (thumb)
3. Cliente → `POST /api/imagenes/presign` con `{ filename, contentType }`
4. API genera presigned URL para R2 (key: `productos/{slug}/{timestamp}-{n}.webp`)
5. Cliente → `PUT <presigned-url>` con el archivo comprimido
6. Cliente guarda `{ url, thumb, alt }` en el array `imagenes` del producto
7. Al guardar el producto, las URLs se persisten en Firestore

## 6. Seguridad

- `POST /api/imagenes/presign` requiere claim `admin: true`
- `DELETE /api/imagenes/[key]` requiere claim `admin: true`
- Validación de tipo: solo jpeg/png/webp
- Validación de tamaño: máximo 5MB original (antes de compresión)
- CORS restringido al dominio de la app
- Key de R2 nunca en el cliente — solo el presigned URL

## 7. Configuración R2 necesaria

```env
# .env.local
R2_ACCOUNT_ID=xxx
R2_ACCESS_KEY_ID=xxx
R2_SECRET_ACCESS_KEY=xxx
R2_BUCKET_NAME=mundocelular-images
R2_PUBLIC_URL=https://img.mundocelular.com  # o r2.dev
```
