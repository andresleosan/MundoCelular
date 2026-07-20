# Mundo Celular — Documento Maestro

## 1. Visión y problema

Tienda online de tecnología (celulares tipo iPhone, accesorios, consolas, bafles, electrodomésticos y afines) donde el propio dueño del negocio administra el catálogo sin depender de un desarrollador, y donde el cierre de venta se hace por WhatsApp en vez de una pasarela de pago tradicional.

## 2. Usuarios

**Perfil A — Administrador (dueño del negocio)**
- Crea y edita categorías (celulares, accesorios, consolas, bafles, electrodomésticos, etc.).
- Ingresa productos: nombre, descripción, precio, imágenes, variantes (color, capacidad, etc.), stock.
- Ve los pedidos generados desde el carrito (los que llegaron a WhatsApp).

**Perfil B — Cliente final**
- Se registra/inicia sesión con Google.
- Navega el catálogo por categoría, ve el detalle del producto.
- Arma un carrito y confirma; se genera el mensaje de WhatsApp con su pedido.

## 3. Funcionalidades MVP (propuesta inicial)

1. Autenticación de clientes con Google (Firebase Auth).
2. Panel admin: CRUD de categorías, CRUD de productos (nombre, descripción, precio, imágenes, categoría, stock).
3. Catálogo público con filtro por categoría y búsqueda.
4. Carrito de compras (persistente por usuario mientras está logueado).
5. Botón "Comprar": genera automáticamente el texto del pedido (productos, cantidades, total) y abre WhatsApp hacia el número de la empresa.
6. Registro del pedido en Firestore (estado: pendiente / contactado / cerrado) antes de redirigir a WhatsApp, para no perder el historial.

## 4. Funcionalidades futuras (fuera del MVP)

- Variantes por producto (color, capacidad) con precio diferenciado.
- Roles múltiples de administrador (ej. un vendedor con permisos limitados).
- Historial de compras del cliente.
- Notificaciones de nuevo producto o promoción.
- Panel de métricas básicas (productos más vistos, pedidos por semana).

## 5. Consideraciones técnicas y de seguridad

- **Precios y stock nunca desde el cliente**: el total del carrito se recalcula y valida en el momento de generar el pedido, no se confía en lo que llega del navegador.
- **Reglas de Firestore por rol**: solo el admin puede escribir en `productos` y `categorias`; el cliente solo lee y escribe su propio carrito/pedidos.
- **Imágenes**: comprimir en el cliente antes de subir; generar miniatura para el listado y versión completa para el detalle.
- **Subida a R2**: como R2 no tiene reglas de seguridad tipo Firebase, un Cloudflare Worker valida el token de Firebase Auth (rol admin) y entrega una URL firmada (presigned) para que el cliente suba la imagen directo al bucket.
- **Formato del mensaje de WhatsApp**: texto codificado con `encodeURIComponent`, con productos, cantidades, precio unitario y total — pensado para que el vendedor pueda copiar el pedido fácilmente.

## 6. Stack técnico propuesto

- Frontend: React + TypeScript + Tailwind CSS
- Backend/datos: Firebase (Auth con Google, Firestore) — sin Firebase Storage
- Almacenamiento de imágenes: Cloudflare R2, con subida vía Cloudflare Worker (URLs firmadas)
- Despliegue: Vercel o Cloudflare Pages
- Metodología: Document-Driven Development (documentar → delegar a agentes de código)

## 7. Roadmap por fases

- **Fase 0**: Documentación (este documento + decisiones de modelo de datos).
- **Fase 1**: Panel admin + catálogo público + login Google.
- **Fase 2**: Carrito + checkout por WhatsApp + registro de pedidos.
- **Fase 3**: Variantes, roles múltiples, métricas.

## 8. Marca y redes sociales

- Logo real de la empresa: isotipo circular (globo + smartphone con engranajes) en azul `#143b98` sobre blanco, con wordmark "MUNDO CELULAR" — ver detalle de uso en `DESIGN-mundocelular.md`.
- Instagram: [@mundo_celular_75](https://www.instagram.com/mundo_celular_75/)
- Facebook: [Mundo Celular](https://www.facebook.com/Mundo.Celular.01)
- TikTok: [@mundocelular75](https://www.tiktok.com/@mundocelular75)
- Recomendación: incluir estos enlaces en el footer del sitio y en la sección de contacto, junto al botón de WhatsApp.

## 9. Preguntas abiertas

- ¿Es una sola tienda (un solo número de WhatsApp) o se planea multi-tienda a futuro?
- ¿El stock se descuenta automáticamente al confirmar el pedido, o se maneja manualmente porque el pago no pasa por el sistema?
- ¿Habrá envíos/domicilios o solo retiro en punto físico?
- ¿Los productos manejan una sola imagen o galería de varias?
- ¿Necesitas manejo de moneda distinta a COP o solo pesos colombianos?
