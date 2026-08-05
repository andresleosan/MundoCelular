# Prioridad posterior al cierre operativo

## Backlog priorizado

| Feature | Alcance | Impacto | Confianza | Esfuerzo | Puntaje | Decision |
| --- | --- | --- | --- | --- | --- | --- |
| FUT-01 Historial de compras | 4 | 4 | 5 | 4 | 4.25 | Siguiente iteracion. Da visibilidad al cliente sobre pedidos ya existentes sin proveedor nuevo. |
| FUT-03 Metricas comerciales | 1 | 3 | 3 | 3 | 2.50 | Posterior. Afecta solo al administrador y requiere definir eventos y privacidad. |
| FUT-02 Notificaciones y promociones | 2 | 3 | 2 | 1 | 2.00 | Posterior. Requiere consentimiento, proveedor, costos y limites de envio. |

## Alcance confirmado para FUT-01

- Ruta `/cuenta/pedidos`, enlazada desde el menu de usuario.
- Todos los estados: pendiente, contactado, cerrado y cancelado.
- Lista de 10 pedidos, con boton "Cargar mas".
- Lista: fecha, productos, total y estado; detalle al seleccionar un pedido.
- Detalle: productos, entrega y boton de WhatsApp con referencia corta del pedido.
- Actualizar el numero activo de WhatsApp a `573147757223` en configuracion, defaults, seed y pruebas; no reescribir documentos historicos.
