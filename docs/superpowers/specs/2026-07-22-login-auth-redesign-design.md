# Spec: Rediseño de Login y Gestión de Administradores

**Fecha:** 2026-07-22
**Proyecto:** Mundo Celular
**Estado:** Aprobado

---

## Resumen

Rediseñar el flujo de autenticación para agregar un botón de login en el header, una página de login unificada con opciones "Cliente" y "Administrador", y un panel dentro de `/admin` para asignar/quitar permisos de administrador por email.

---

## 1. Header — Botón de Login

### Componente: `Header.tsx`

**Estado no autenticado:**
```
┌─────────────────────────────────────────────────────────┐
│ MUNDO CELULAR   [Buscar...] 🔍  🛒  [👤 Iniciar sesión]│
└─────────────────────────────────────────────────────────┘
```

- Botón "Iniciar sesión" con ícono de usuario
- Click → redirige a `/login`
- En mobile: botón dentro del menú hamburger

**Estado autenticado (cliente):**
```
┌─────────────────────────────────────────────────────────┐
│ MUNDO CELULAR   [Buscar...] 🔍  🛒  [👤 Andrés]  ⌄    │
└─────────────────────────────────────────────────────────┘
```

- Muestra nombre del usuario
- Dropdown: "Cerrar sesión"

**Estado autenticado (admin):**
```
┌─────────────────────────────────────────────────────────┐
│ MUNDO CELULAR   [Buscar...] 🔍  🛒  [👤 Andrés]  ⌄    │
└─────────────────────────────────────────────────────────┘
```

- Dropdown: "Panel admin" + "Cerrar sesión"

### Cambios requeridos:
- Importar `useAuth` en Header
- Agregar botón/dropdown condicional
- Lógica de redirect a `/login` si no autenticado

---

## 2. Página `/login`

### Estructura

```
┌────────────────────────────────────────┐
│         MUNDO CELULAR                  │
│     Iniciar sesión                     │
│                                        │
│  ┌──────────────────┐  ┌──────────────────┐
│  │    👤             │  │    ⚙️             │
│  │   Cliente         │  │  Administrador   │
│  │  (Ir a la tienda) │  │  (Panel admin)   │
│  └──────────────────┘  └──────────────────┘
│                                        │
│  Ambos usan Google Auth                │
└────────────────────────────────────────┘
```

### Lógica

1. Si ya está logueado:
   - Si es admin y destino era "admin" → redirect `/admin`
   - Si no es admin → redirect `/`
2. Si no está logueado:
   - Click "Cliente": `localStorage.setItem('login-destino', 'cliente')` → `signInWithPopup`
   - Click "Administrador": `localStorage.setItem('login-destino', 'admin')` → `signInWithPopup`
3. After popup: AuthProvider detecta usuario → redirige según `login-destino`

### Archivos a crear/modificar:
- `src/app/login/page.tsx` (nueva página)
- `src/components/auth/LoginButtons.tsx` (nuevo componente)
- `src/components/auth/AuthProvider.tsx` (agregar lógica de redirect)

---

## 3. Panel de Administración — Gestión de Usuarios

### Nueva pestaña en AdminNav

Agregar "Usuarios" al `AdminNav.tsx`:
```
[Dashboard] [Categorías] [Productos] [Pedidos] [Config] [Usuarios]
```

### Página `/admin/usuarios`

```
┌─────────────────────────────────────────────────┐
│ Gestionar administradores                        │
│                                                  │
│  ┌─────────────────────────────────────────┐    │
│  │  Email del usuario: [____________]       │    │
│  │                         [Dar permiso]    │    │
│  └─────────────────────────────────────────┘    │
│                                                  │
│  Administradores actuales:                       │
│  ┌─────────────────────────────────────────┐    │
│  │ 🟢 admin@mundocelular.com    [Quitar]   │    │
│  │ 🟢 otro@admin.com            [Quitar]   │    │
│  └─────────────────────────────────────────┘    │
└─────────────────────────────────────────────────┘
```

### Validación de email
- Regex: `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`
- Trim + lowercase antes de buscar

### Comportamiento

| Acción | Resultado |
|--------|-----------|
| Email no registrado | "Usuario no encontrado. Debe registrarse primero con Google." |
| Ya es admin | "Este usuario ya tiene permisos de administrador." |
| Asignar con éxito | "Permiso asignado. El usuario debe cerrar sesión y volver a entrar." |
| Quitar permiso | "Permiso revocado." |
| Admin se quita a sí mismo | Bloqueado: "No puedes quitarte tu propio permiso." |

### Archivos a crear/modificar:
- `src/app/admin/usuarios/page.tsx` (nueva página)
- `src/components/admin/AdminUsuarios.tsx` (nuevo componente)
- `src/components/admin/AdminNav.tsx` (agregar enlace)
- `src/app/api/admin/usuarios/route.ts` (nueva API route)

---

## 4. Firestore — Colección `usuarios`

### Estructura

```
usuarios/{email}
  email: string          // email normalizado (lowercase)
  admin: boolean         // true = tiene permisos de admin
  pendiente: boolean     // true = aún no se ha logueado
  creadoEn: timestamp    // cuándo se asignó el permiso
```

### Reglas Firestore (agregar)

```javascript
match /usuarios/{email} {
  allow read: if request.auth != null && esAdmin();
  allow write: if request.auth != null && esAdmin();
}
```

---

## 5. API Routes

### `POST /api/admin/usuarios`
- Body: `{ email: string }`
- Auth: requiere claim `admin: true`
- Acción: crear/actualizar documento en `usuarios/{email}`
- Retorna: `{ ok: true, mensaje: string }`

### `DELETE /api/admin/usuarios`
- Body: `{ email: string }`
- Auth: requiere claim `admin: true`
- Acción: actualizar `admin: false` en `usuarios/{email}`
- Retorna: `{ ok: true, mensaje: string }`

### `GET /api/admin/usuarios`
- Auth: requiere claim `admin: true`
- Retorna: lista de documentos de `usuarios`

---

## 6. AuthProvider — Cambios

### Nuevo flujo

```typescript
useEffect(() => {
  return onIdTokenChanged(auth, async (user) => {
    setUsuario(user);
    if (user) {
      const token = await user.getIdTokenResult();
      setEsAdmin(esClaimAdmin(token.claims));

      // Redirect logic
      const destino = localStorage.getItem('login-destino');
      if (destino) {
        localStorage.removeItem('login-destino');
        if (destino === 'admin' && esClaimAdmin(token.claims)) {
          router.push('/admin');
        } else if (destino === 'cliente') {
          router.push('/');
        }
      }
    } else {
      setEsAdmin(false);
    }
    setCargando(false);
  });
}, [router]);
```

---

## 7. Eliminar `/admin/login`

- Redirigir `/admin/login` → `/login`
- O eliminar la página y actualizar referencias

---

## 8. Casos Edge

| Caso | Comportamiento |
|------|----------------|
| Google Auth falla | "No se pudo iniciar sesión. Intenta de nuevo." |
| Admin intenta quitarse el propio permiso | Bloqueado con toast/alert |
| Usuario pendiente se loguea como "Cliente" | No pasa nada, queda pendiente |
| Email con mayúsculas | Normalizado a lowercase antes de buscar |
| Sesión expirada | Redirigir a `/login` |

---

## 9. Testing

- Unit tests: `esClaimAdmin`, validación de email
- Integration tests: flujo de login redirect
- Manual: probar login como cliente y admin

---

## 10. Archivos afectados

### Nuevos
- `src/app/login/page.tsx`
- `src/components/auth/LoginButtons.tsx`
- `src/app/admin/usuarios/page.tsx`
- `src/components/admin/AdminUsuarios.tsx`
- `src/app/api/admin/usuarios/route.ts`

### Modificados
- `src/components/layout/Header.tsx`
- `src/components/auth/AuthProvider.tsx`
- `src/components/admin/AdminNav.tsx`
- `src/lib/auth.ts`
- `firestore.rules`

### Eliminados
- `src/app/admin/login/page.tsx` (redirigir a `/login`)

---

## Aprobación

- [x] Diseño aprobado por usuario
- [ ] Implementación completa
- [ ] Tests pasando
- [ ] Deploy a producción
