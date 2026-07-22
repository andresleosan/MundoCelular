# Fase 3 — Checkout WhatsApp + Worker /pedidos — Design Spec

**Fecha:** 2026-07-21
**Estado:** Aprobado por el operador
**Spec de referencia:** `docs/superpowers/specs/2026-07-19-mundocelular-mvp-design.md` (secciones 5, 9)

---

## 1. Objetivo

Implementar el flujo completo de pedido: cuando un cliente confirma su carrito, se registra el pedido en Firestore **antes** de abrir WhatsApp. El backend (Cloudflare Worker) valida el token, recalcula precios/stock del servidor, y devuelve el mensaje armado.

## 2. Alcance

### INCLUIDO
- Cloudflare Worker: `POST /pedidos` + `POST /pedidos/:id/cancelar`
- Checkout page `/checkout` con formulario retiro/domicilio
- Integración carrito → Worker → WhatsApp
- Panel admin `/admin/pedidos` con estados
- Persistencia del carrito en Firestore (requiere sesión)

### NO INCLUIDO (Fase 4+)
- Imágenes R2 / presign URLs
- Pasarela de pago
- Notificaciones
- Historial de compras del cliente

## 3. Arquitectura

```
CLIENTE (Next.js)
├── /carrito          resumen + botón "Proceder al checkout"
├── /checkout         formulario retiro/domicilio + confirmar
│   └── POST <WORKER>/pedidos  → Worker crea pedido → responde { pedidoId, mensaje }
│   └── window.open(wa.me/<whatsapp>?text=<mensaje>)
│
WORKER (Cloudflare)
├── POST /pedidos         verifica token, recalcula, descuenta stock, crea pedido
├── POST /pedidos/:id/cancelar  repone stock (solo admin)
│
FIRESTORE
├── pedidos/{id}          pedido con items, total recalculado, estado
├── productos/{id}        stock descontado en transacción
```

## 4. Modelo de datos — `pedidos`

```ts
{
  id: string;
  clienteUid: string;
  clienteNombre: string;
  clienteEmail: string;
  items: Array<{
    productoId: string;
    nombre: string;
    precioUnitario: number;  // precio congelado al momento del pedido
    cantidad: number;
    subtotal: number;
  }>;
  total: number;             // recalculado en servidor
  entrega: {
    tipo: "retiro" | "domicilio";
    direccion?: string;
    barrio?: string;
  };
  estado: "pendiente" | "contactado" | "cerrado" | "cancelado";
  creadoEn: Timestamp;
  actualizadoEn: Timestamp;
}
```

## 5. Flujo de pedido (regla de oro: el servidor valida)

1. Cliente llena formulario en `/checkout` (retiro o domicilio)
2. Frontend envía `POST <WORKER>/pedidos`:
   - Header: `Authorization: Bearer <idToken>`
   - Body: `{ items: [{productoId, cantidad}], entrega: {tipo, direccion?, barrio?} }`
3. Worker:
   a. Verifica idToken (Firebase Auth REST API)
   b. Lee productos desde Firestore (REST API + service account)
   c. Recalcula precios y total; verifica stock suficiente
   d. Transacción: descuenta stock + crea pedido
   e. Responde `{ pedidoId, mensaje }`
4. Frontend abre `https://wa.me/<whatsapp>?text=<encodeURIComponent(mensaje)>`
5. Admin gestiona estados en `/admin/pedidos`

## 6. Mensaje WhatsApp

```
Hola Mundo Celular, quiero comprar:
• iPhone 13 128GB — x1 — $1.850.000
• Case iPhone 13 — x2 — $80.000
Total: $1.930.000
Entrega: Domicilio — Cra 45 #12-30, El Poblado
Pedido #ABC123 — Juan Pérez
```

## 7. Seguridad

- Worker verifica idToken en todos los endpoints
- `/pedidos/:id/cancelar` exige claim `admin: true`
- CORS restringido al dominio de la app
- Precio/stock nunca se confían del cliente
- Transacción atómica para stock + pedido

## 8. Worker — implementación

El Worker se implementa como un **endpoint API route de Next.js** (`/api/pedidos`) en lugar de un Cloudflare Worker separado, para mantener todo en un solo deploy (Vercel). Si en el futuro se necesita Cloudflare Worker, se migra.

### `POST /api/pedidos`
- Verifica idToken vía `firebase-admin/auth`
- Lee productos de Firestore
- Recalcula precios y stock
- Transacción: descuenta stock + crea pedido
- Responde `{ pedidoId, mensaje }`

### `POST /api/pedidos/[id]/cancelar`
- Requiere claim `admin: true`
- Repone stock en transacción
- Actualiza estado a `cancelado`

## 9. Panel admin — `/admin/pedidos`

- Lista de pedidos ordenada por fecha (más recientes primero)
- Filtro por estado
- Botones para cambiar estado (pendiente → contactado → cerrado)
- Botón "Cancelar y devolver stock" (solo para pedidos pendientes/contactados)
- Vista detallada del pedido (items, total, entrega, cliente)
