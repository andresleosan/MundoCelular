import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const leer = (ruta: string) => readFileSync(resolve(process.cwd(), ruta), "utf8");

const globals = leer("src/app/globals.css");
const adminLayout = leer("src/app/admin/layout.tsx");
const scrollProgress = leer("src/components/layout/ScrollProgress.tsx");

// El acoplamiento entre el CSS y el marcador del layout no lo cubre TypeScript:
// si alguien quita data-admin-shell, el panel pierde la scrollbar nativa en
// silencio. Estas aserciones lo dejan visible.
describe("alcance del ocultamiento de la scrollbar", () => {
  it("marca el shell de /admin con data-admin-shell", () => {
    expect(adminLayout).toContain("data-admin-shell");
  });

  it("oculta la scrollbar solo fuera del panel admin", () => {
    expect(globals).toContain("html:not(:has([data-admin-shell])) {");
    expect(globals).toContain("html:not(:has([data-admin-shell]))::-webkit-scrollbar");
    // El modal de acceso y /login del storefront usan .admin-light-scope y no
    // deben devolver la barra: el selector nunca puede colgar de esa clase.
    expect(globals).not.toMatch(/html:[^{]*\.admin-light-scope/);
  });

  it("retira la barra de progreso dentro del panel admin", () => {
    expect(scrollProgress).toContain("data-scroll-progress");
    expect(globals).toContain("html:has([data-admin-shell]) [data-scroll-progress]");
  });
});
