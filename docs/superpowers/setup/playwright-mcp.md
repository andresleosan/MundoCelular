# Playwright MCP — Setup

## Estado

**Habilitado en `opencode.json`** (raíz del workspace). El server MCP queda declarado bajo la key `mcp.playwright` con `enabled: true`.

## Versiones instaladas

- `@playwright/mcp@0.0.78` (devDependency local en `package.json`)
- Chromium para Testing 151.0.7922.10 (`chromium-1232`) + Chrome Headless Shell 151.0.7922.10 (`chromium-headless-shell-1232`)
- Binarios cacheados en `C:\Users\USER\AppData\Local\ms-playwright\`

## Configuración

`opencode.json` (resumen):

```json
"mcp": {
  "playwright": {
    "type": "local",
    "command": ["npx", "@playwright/mcp@latest"],
    "enabled": true
  }
}
```

## Verificación

```powershell
# versión del paquete
npx @playwright/mcp@latest --version
# esperado: Version 0.0.78 (o superior)
```

## Cómo auditar la web app

1. Levantar el servidor en otra terminal:
   ```powershell
   npm run dev          # turbopack dev
   # o
   npm run build ; npx next start   # prod build (el usado para Lighthouse)
   ```
2. El server MCP arranca solo cuando opencode lo invoca (stdio). No requiere proceso manual.
3. En opencode, una vez habilitado, las tools `browser_*` de Playwright quedan disponibles para:
   - `browser_navigate` — abrir URL
   - `browser_snapshot` / `browser_take_screenshot`
   - `browser_click`, `browser_type`, `browser_fill`
   - `browser_evaluate` — ejecutar JS arbitrario en la página
   - `browser_resize` — cambiar tamaño viewport (responsive)
   - etc.

## Verificación post-implementación Rediseño Premium v2 (§17 del spec)

Con el MCP activo es posible automatizar los pasos 6-11 que requieren navegador real:

| Paso §17 | Cómo verificarlo |
|---|---|
| 6. Login modal abre desde Header | `browser_navigate /` → `browser_click [aria-label=Cuenta]` → snapshot del modal `role=dialog` |
| 7. Carrito funcional | `browser_evaluate localStorage.setItem(...)` para sembrar ítems, luego reload, `browser_snapshot /carrito` |
| 8. Checkout WhatsApp | Igual que carrito, pero el paso final exige Firebase real (pendiente operatorio F1) |
| 9. Responsive 320/375/390/414/768/1024/1440/1920 | `browser_resize` a cada viewport + `browser_take_screenshot` |
| 10. `prefers-reduced-motion` | `browser_evaluate matchMedia('(prefers-reduced-motion: reduce)').matches` y verificar que elementos animados tengan `opacity-0` activado |
| 11. Lighthouse mobile >90 | Comando separado (`lighthouse http://localhost:3000 --preset=desktop --form-factor=mobile`) |

## Gotchas Windows / PowerShell 5.1

- **PowerShell 5.1 no entiende `&&`**: encadenar comandos con `;` y condicionales `if ($?)`.
- **`Start-Process npx.cmd`** falla con "%1 no es una aplicación Win32 válida". Solución: usar `Start-Process -FilePath <full-path-to-npx.cmd>` o invocar `npx` directamente (no como `FilePath` separado). Aquí no hace falta porque el server MCP lo lanza opencode vía stdio.
- **Chromium descargado** pesa ~300MB combinado (chrome + headless-shell). Se cachea globalmente en `%LOCALAPPDATA%\ms-playwright\`, no por proyecto.
- **Sin WSL:** todo es nativo Windows; no hay problemas de paths con forward-slash.
- **Drive de red lento:** `npm install` puede tardar; los navegadores no están en el drive de red (van a `%LOCALAPPDATA%`), así que la descarga inicial es razonable.

## Pendientes

- Las rutas dinámicas `/producto/[slug]` y `/categoria/[slug]` devuelven 404 sin Firebase configurado (pendiente operatorio F1 de `tasks.md`). Los pasos 6-11 que dependan de datos reales (checkout completo, agregar producto al carrito desde página de producto) no son verificables hasta resolverlo.
