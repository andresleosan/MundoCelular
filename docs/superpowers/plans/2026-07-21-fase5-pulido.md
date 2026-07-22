# Fase 5 — Pulido Mobile + Páginas Estáticas + Auditoría

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add mobile bottom tab bar, /contacto, /preguntas, expand /reparaciones, home reparaciones section, footer links, and WCAG/CWV audit.

**Architecture:** Static pages (SSG/ISR) read from `obtenerConfigTiendaServidor()`. SEO metadata + JSON-LD follow existing patterns. Bottom tab bar is client-only, fixed bottom, hidden on desktop.

**Tech Stack:** Next.js 15 App Router, React 19, TypeScript, Tailwind v4, existing design tokens.

## Global Constraints

- Design tokens: `mundo-blue` `#143b98` ONLY on WhatsApp button, wordmark, search submit
- Currency: COP (integer), locale es-CO
- Bottom bar: hidden `sm:` (640px+), fixed bottom, 64px height, safe-area padding
- All pages: 1 H1 only, metadata unique, JSON-LD schema.org
- UI in español (Colombia)

---

## File Map

| Action | File | Responsibility |
|--------|------|----------------|
| Create | `src/components/layout/BottomTabBar.tsx` | Mobile bottom navigation (4 items) |
| Modify | `src/app/layout.tsx` | Add BottomTabBar + body padding |
| Modify | `src/lib/seo/metadata.ts` | Add `metadataContacto()`, `metadataPreguntas()` |
| Modify | `src/lib/seo/jsonld.ts` | Add `jsonldContacto()`, `jsonldPreguntas()` |
| Create | `src/app/contacto/page.tsx` | Contact page with map + social links |
| Create | `src/app/preguntas/page.tsx` | FAQ page with accordion |
| Modify | `src/app/reparaciones/page.tsx` | Expand with services list + prices |
| Modify | `src/app/page.tsx` | Add reparaciones banner section |
| Modify | `src/components/layout/Footer.tsx` | Add /contacto, /preguntas links |

---

### Task 1: BottomTabBar Component

**Files:**
- Create: `src/components/layout/BottomTabBar.tsx`

**Interfaces:**
- Consumes: `useCarrito()` for badge count, `usePathname()` for active state
- Produces: `<BottomTabBar />` component (client, fixed bottom)

- [ ] **Step 1: Create BottomTabBar component**

```tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCarrito } from "@/hooks/useCarrito";

const WHATSAPP_LINK = "https://wa.me/573113554021";

const items = [
  { href: "/", label: "Inicio", icon: "home" },
  { href: "/#categorias", label: "Categorías", icon: "grid" },
  { href: "/carrito", label: "Carrito", icon: "bag" },
  { href: WHATSAPP_LINK, label: "WhatsApp", icon: "phone", external: true },
] as const;

function IconHome({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? "#143b98" : "#5b6b85"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  );
}

function IconGrid({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? "#143b98" : "#5b6b85"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" />
      <rect x="14" y="3" width="7" height="7" />
      <rect x="14" y="14" width="7" height="7" />
      <rect x="3" y="14" width="7" height="7" />
    </svg>
  );
}

function IconBag({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? "#143b98" : "#5b6b85"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
      <line x1="3" y1="6" x2="21" y2="6" />
      <path d="M16 10a4 4 0 01-8 0" />
    </svg>
  );
}

function IconPhone({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? "#143b98" : "#5b6b85"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z" />
    </svg>
  );
}

const icons = { home: IconHome, grid: IconGrid, bag: IconBag, phone: IconPhone };

export function BottomTabBar() {
  const pathname = usePathname();
  const { carrito } = useCarrito();
  const totalItems = carrito.reduce((sum, item) => sum + item.cantidad, 0);

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-faint-border bg-pure-white sm:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
      aria-label="Navegación principal"
    >
      <div className="flex h-16 items-center justify-around">
        {items.map((item) => {
          const isActive = !item.external && pathname === item.href;
          const Icon = icons[item.icon];
          const showBadge = item.icon === "bag" && totalItems > 0;

          const content = (
            <span className="flex flex-col items-center gap-0.5">
              <span className="relative">
                <Icon active={isActive} />
                {showBadge && (
                  <span className="absolute -right-2 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-mundo-blue text-[9px] font-bold text-pure-white">
                    {totalItems}
                  </span>
                )}
              </span>
              <span className={`text-[10px] ${isActive ? "font-semibold text-mundo-blue" : "text-steel-blue-gray"}`}>
                {item.label}
              </span>
            </span>
          );

          if (item.external) {
            return (
              <a key={item.href} href={item.href} target="_blank" rel="noopener noreferrer" aria-label={item.label}>
                {content}
              </a>
            );
          }

          return (
            <Link key={item.href} href={item.href} aria-label={item.label} aria-current={isActive ? "page" : undefined}>
              {content}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/components/layout/BottomTabBar.tsx
git commit -m "feat(f5-t1): BottomTabBar — navegación mobile con 4 ítems"
```

---

### Task 2: Layout Update + Body Padding

**Files:**
- Modify: `src/app/layout.tsx`

**Interfaces:**
- Consumes: `<BottomTabBar />` from Task 1
- Produces: Updated layout with bottom bar + padding

- [ ] **Step 1: Update layout.tsx**

Add import for BottomTabBar and add it after Footer. Add `pb-20 sm:pb-0` to body.

```tsx
import type { Metadata } from "next";
import { Sora, JetBrains_Mono } from "next/font/google";
import { AuthProvider } from "@/components/auth/AuthProvider";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { BottomTabBar } from "@/components/layout/BottomTabBar";
import "./globals.css";

const sora = Sora({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--font-sora-css" });
const jetbrainsMono = JetBrains_Mono({ subsets: ["latin"], weight: ["400", "500"], variable: "--font-jetbrains-mono-css" });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: { default: "Mundo Celular | Tecnología en Medellín", template: "%s | Mundo Celular" },
  description: "Celulares, accesorios, consolas y tecnología en Medellín. Compra por WhatsApp. También reparamos celulares.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es-CO" className={`${sora.variable} ${jetbrainsMono.variable}`}>
      <body className="pb-20 sm:pb-0">
        <Header />
        <AuthProvider>{children}</AuthProvider>
        <Footer />
        <BottomTabBar />
      </body>
    </html>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/app/layout.tsx
git commit -m "feat(f5-t2): layout — BottomTabBar + body padding mobile"
```

---

### Task 3: SEO Metadata for /contacto and /preguntas

**Files:**
- Modify: `src/lib/seo/metadata.ts`

**Interfaces:**
- Consumes: `ConfigTienda` type (existing)
- Produces: `metadataContacto()`, `metadataPreguntas()`

- [ ] **Step 1: Add metadata functions**

Add at the end of `src/lib/seo/metadata.ts`:

```ts
export function metadataContacto(config: ConfigTienda): Metadata {
  return {
    title: `Contacto | ${siteName(config)}`,
    description: `Dirección, horario y contacto de ${siteName(config)} en ${config.ciudad}. WhatsApp, redes sociales y mapa.`,
    alternates: { canonical: "/contacto" },
    openGraph: { type: "website", title: `Contacto | ${siteName(config)}` },
  };
}

export function metadataPreguntas(config: ConfigTienda): Metadata {
  return {
    title: `Preguntas frecuentes | ${siteName(config)}`,
    description: `Resolvemos tus dudas sobre compras, envíos, garantía y reparaciones en ${siteName(config)}.`,
    alternates: { canonical: "/preguntas" },
    openGraph: { type: "website", title: `Preguntas frecuentes | ${siteName(config)}` },
  };
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/lib/seo/metadata.ts
git commit -m "feat(f5-t3): SEO metadata — /contacto y /preguntas"
```

---

### Task 4: JSON-LD for /contacto and /preguntas

**Files:**
- Modify: `src/lib/seo/jsonld.ts`

**Interfaces:**
- Consumes: `ConfigTienda` type (existing)
- Produces: `jsonldContacto()`, `jsonldPreguntas()`

- [ ] **Step 1: Add JSON-LD functions**

Add at the end of `src/lib/seo/jsonld.ts`:

```ts
export function jsonldContacto(config: ConfigTienda): JsonLdObject {
  return {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: config.nombre,
    url: url("/contacto"),
    telephone: `+${config.whatsapp}`,
    address: {
      "@type": "PostalAddress",
      streetAddress: config.direccion,
      addressLocality: config.ciudad,
      addressRegion: config.departamento,
      addressCountry: config.pais,
    },
    contactPoint: {
      "@type": "ContactPoint",
      telephone: `+${config.whatsapp}`,
      contactType: "customer service",
      availableLanguage: "Spanish",
    },
    sameAs: [config.redes.instagram, config.redes.facebook, config.redes.tiktok].filter(Boolean),
  };
}

interface PreguntaFrecuente {
  pregunta: string;
  respuesta: string;
}

export function jsonldPreguntas(preguntas: PreguntaFrecuente[]): JsonLdObject {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: preguntas.map((p) => ({
      "@type": "Question",
      name: p.pregunta,
      acceptedAnswer: {
        "@type": "Answer",
        text: p.respuesta,
      },
    })),
  };
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/lib/seo/jsonld.ts
git commit -m "feat(f5-t4): JSON-LD — ContactPoint + FAQPage"
```

---

### Task 5: /contacto Page

**Files:**
- Create: `src/app/contacto/page.tsx`

**Interfaces:**
- Consumes: `obtenerConfigTiendaServidor()` (existing), `metadataContacto()`, `jsonldContacto()`
- Produces: `/contacto` page

- [ ] **Step 1: Create contacto page**

```tsx
import type { Metadata } from "next";
import { obtenerConfigTiendaServidor } from "@/lib/firestore/public";
import { metadataContacto } from "@/lib/seo/metadata";
import { jsonldContacto } from "@/lib/seo/jsonld";
import { JsonLd } from "@/components/seo/JsonLd";

export async function generateMetadata(): Promise<Metadata> {
  try {
    const config = await obtenerConfigTiendaServidor();
    return metadataContacto(config);
  } catch {
    return { title: "Contacto | Mundo Celular", description: "Contacta a Mundo Celular en Medellín." };
  }
}

export default async function ContactoPage() {
  let config;
  try {
    config = await obtenerConfigTiendaServidor();
  } catch {
    config = null;
  }

  const whatsapp = config?.whatsapp ?? "573113554021";
  const direccion = config?.direccion ?? "Cra 36 # 38 - 33, Barrio El Salvador";
  const ciudad = config?.ciudad ?? "Medellín";
  const horario = config?.horario ?? "Lun-Sáb 9:00 AM - 7:00 PM";
  const redes = config?.redes ?? { instagram: "", facebook: "", tiktok: "" };

  return (
    <>
      {config && <JsonLd data={jsonldContacto(config)} />}
      <main className="mx-auto max-w-[800px] px-4 py-14">
        <h1 className="text-[28px] font-semibold tracking-[-0.03em] text-gray-900">
          Contacto
        </h1>

        <div className="mt-8 space-y-6">
          <section>
            <h2 className="text-[16px] font-semibold text-gray-900">Dirección</h2>
            <p className="mt-2 text-[14px] text-steel-blue-gray">{direccion}, {ciudad}</p>
          </section>

          <section>
            <h2 className="text-[16px] font-semibold text-gray-900">Horario</h2>
            <p className="mt-2 text-[14px] text-steel-blue-gray">{horario}</p>
          </section>

          <section>
            <h2 className="text-[16px] font-semibold text-gray-900">WhatsApp</h2>
            <a
              href={`https://wa.me/${whatsapp}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-block rounded-full bg-mundo-blue px-6 py-3 text-[14px] font-semibold text-white shadow-lg-2"
            >
              Escribenos por WhatsApp
            </a>
          </section>

          {Object.values(redes).some(Boolean) && (
            <section>
              <h2 className="text-[16px] font-semibold text-gray-900">Redes sociales</h2>
              <div className="mt-2 flex flex-wrap gap-3">
                {redes.instagram && (
                  <a href={redes.instagram} target="_blank" rel="noopener noreferrer" className="rounded-full border border-faint-border bg-white px-4 py-2 text-[14px] text-ink-navy hover:bg-canvas-frost">
                    Instagram
                  </a>
                )}
                {redes.facebook && (
                  <a href={redes.facebook} target="_blank" rel="noopener noreferrer" className="rounded-full border border-faint-border bg-white px-4 py-2 text-[14px] text-ink-navy hover:bg-canvas-frost">
                    Facebook
                  </a>
                )}
                {redes.tiktok && (
                  <a href={redes.tiktok} target="_blank" rel="noopener noreferrer" className="rounded-full border border-faint-border bg-white px-4 py-2 text-[14px] text-ink-navy hover:bg-canvas-frost">
                    TikTok
                  </a>
                )}
              </div>
            </section>
          )}

          <section>
            <h2 className="text-[16px] font-semibold text-gray-900">Ubicación</h2>
            <div className="mt-2 overflow-hidden rounded-2xl border border-faint-border">
              <iframe
                title="Ubicación de Mundo Celular"
                src={`https://www.openstreetmap.org/export/embed.html?bbox=-75.58,-6.26,-75.54,-6.22&layer=mapnik&marker=-6.24,-75.56`}
                width="100%"
                height="300"
                style={{ border: 0 }}
                loading="lazy"
              />
            </div>
          </section>
        </div>
      </main>
    </>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/app/contacto/page.tsx
git commit -m "feat(f5-t5): página /contacto — datos tienda + mapa + CTA WhatsApp"
```

---

### Task 6: /preguntas Page

**Files:**
- Create: `src/app/preguntas/page.tsx`

**Interfaces:**
- Consumes: `obtenerConfigTiendaServidor()` (existing), `metadataPreguntas()`, `jsonldPreguntas()`
- Produces: `/preguntas` page with FAQ accordion

- [ ] **Step 1: Create preguntas page**

```tsx
import type { Metadata } from "next";
import { obtenerConfigTiendaServidor } from "@/lib/firestore/public";
import { metadataPreguntas } from "@/lib/seo/metadata";
import { jsonldPreguntas } from "@/lib/seo/jsonld";
import { JsonLd } from "@/components/seo/JsonLd";

export async function generateMetadata(): Promise<Metadata> {
  try {
    const config = await obtenerConfigTiendaServidor();
    return metadataPreguntas(config);
  } catch {
    return { title: "Preguntas frecuentes | Mundo Celular", description: "Resolvemos tus dudas." };
  }
}

const FAQ_ITEMS = [
  {
    q: "¿Cómo compro?",
    a: "Elige tus productos, agrégalos al carrito y presiona "Proceder al checkout". Completa el formulario y serás redirigido a WhatsApp con tu pedido ya armado. Solo confirma con el vendedor y listo.",
  },
  {
    q: "¿Aceptan tarjeta de crédito o débito?",
    a: "Aceptamos efectivo, transferencia bancaria, Nequi y Daviplata. Actualmente no aceptamos tarjeta de crédito o débito directamente.",
  },
  {
    q: "¿Hacen envíos a domicilio?",
    a: "Sí, hacemos envíos a Medellín y alrededores. También puedes recoger gratis en nuestra tienda en Cra 36 # 38 - 33, Barrio El Salvador.",
  },
  {
    q: "¿Tienen garantía?",
    a: "Todos los productos nuevos tienen garantía de 12 meses. Los accesorios tienen garantía de 3 meses. La garantía cubre defectos de fabricación.",
  },
  {
    q: "¿Reparan celulares?",
    a: "Sí, ofrecemos servicio técnico de celulares, tablets y consolas. Visita nuestra página de Reparaciones para ver servicios y precios.",
  },
  {
    q: "¿Puedo devolver un producto?",
    a: "Si el producto presenta un defecto de fabricación, lo cambiamos dentro de los primeros 30 días con el empaque original. Los productos sin defecto no tienen devolución.",
  },
  {
    q: "¿Dónde están ubicados?",
    a: "Estamos en Cra 36 # 38 - 33, Barrio El Salvador, Medellín, Antioquia. Visítanos de lunes a sábado de 9:00 AM a 7:00 PM.",
  },
  {
    q: "¿Cuál es su horario?",
    a: "Atendemos de lunes a sábado de 9:00 AM a 7:00 PM. Domingos y festivos cerrado.",
  },
];

export default async function PreguntasPage() {
  let config;
  try {
    config = await obtenerConfigTiendaServidor();
  } catch {
    config = null;
  }

  const direccion = config?.direccion ?? "Cra 36 # 38 - 33, Barrio El Salvador";
  const horario = config?.horario ?? "Lun-Sáb 9:00 AM - 7:00 PM";

  const preguntas = FAQ_ITEMS.map((item) => {
    let respuesta = item.a;
    respuesta = respuesta.replace("Cra 36 # 38 - 33, Barrio El Salvador", direccion);
    respuesta = respuesta.replace("lunes a sábado de 9:00 AM a 7:00 PM", horario.toLowerCase());
    return { pregunta: item.q, respuesta };
  });

  return (
    <>
      <JsonLd data={jsonldPreguntas(preguntas)} />
      <main className="mx-auto max-w-[800px] px-4 py-14">
        <h1 className="text-[28px] font-semibold tracking-[-0.03em] text-gray-900">
          Preguntas frecuentes
        </h1>

        <div className="mt-8 space-y-3">
          {preguntas.map((p, i) => (
            <details key={i} className="group rounded-2xl bg-white p-4 shadow-sm-2">
              <summary className="cursor-pointer text-[14px] font-semibold text-gray-900 marker:text-steel-blue-gray">
                {p.pregunta}
              </summary>
              <p className="mt-3 text-[14px] leading-relaxed text-steel-blue-gray">
                {p.respuesta}
              </p>
            </details>
          ))}
        </div>
      </main>
    </>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/app/preguntas/page.tsx
git commit -m "feat(f5-t6): página /preguntas — 8 FAQ con schema FAQPage"
```

---

### Task 7: Expand /reparaciones Page

**Files:**
- Modify: `src/app/reparaciones/page.tsx`

**Interfaces:**
- Consumes: `obtenerConfigTiendaServidor()` (existing), `metadataReparaciones()`, `jsonldReparaciones()`
- Produces: Expanded reparaciones page with services list

- [ ] **Step 1: Rewrite reparaciones page**

Replace entire content of `src/app/reparaciones/page.tsx`:

```tsx
import type { Metadata } from "next";
import Link from "next/link";
import { obtenerConfigTiendaServidor } from "@/lib/firestore/public";
import { metadataReparaciones } from "@/lib/seo/metadata";
import { jsonldReparaciones } from "@/lib/seo/jsonld";
import { JsonLd } from "@/components/seo/JsonLd";

export async function generateMetadata(): Promise<Metadata> {
  try {
    const config = await obtenerConfigTiendaServidor();
    return metadataReparaciones(config);
  } catch {
    return {
      title: "Reparaciones | Mundo Celular",
      description: "Reparación de celulares, tablets y consolas en Medellín.",
    };
  }
}

const SERVICIOS = [
  { nombre: "Cambio de pantalla", precio: "Desde $80.000", descripcion: "Pantallas originales y compatibles para todas las marcas." },
  { nombre: "Cambio de batería", precio: "Desde $50.000", descripcion: "Baterías de alta capacidad con garantía de 6 meses." },
  { nombre: "Reparación de software", precio: "Desde $30.000", descripcion: "Formateo, actualización, eliminación de virus y recuperación de datos." },
  { nombre: "Cambio de puerto de carga", precio: "Desde $60.000", descripcion: "Reparación de puertos USB-C, Lightning y micro-USB." },
  { nombre: "Desbloqueo de celular", precio: "Desde $40.000", descripcion: "Desbloqueo de operadores y patrones de seguridad." },
  { nombre: "Diagnóstico", precio: "GRATIS", descripcion: "Evaluación completa del estado de tu dispositivo sin compromiso." },
];

export default async function ReparacionesPage() {
  let config;
  try {
    config = await obtenerConfigTiendaServidor();
  } catch {
    config = null;
  }

  const whatsapp = config?.whatsapp ?? "573113554021";
  const direccion = config?.direccion ?? "Cra 36 # 38 - 33, Barrio El Salvador";
  const ciudad = config?.ciudad ?? "Medellín";
  const horario = config?.horario ?? "Lun-Sáb 9:00 AM - 7:00 PM";

  const whatsappMsg = encodeURIComponent("Hola Mundo Celular, necesito reparar mi celular");
  const whatsappLink = `https://wa.me/${whatsapp}?text=${whatsappMsg}`;

  return (
    <>
      {config && <JsonLd data={jsonldReparaciones(config)} />}
      <main className="mx-auto max-w-[800px] px-4 py-14">
        <h1 className="text-[28px] font-semibold tracking-[-0.03em] text-gray-900">
          Reparación de celulares en {ciudad}
        </h1>
        <p className="mt-4 text-[16px] text-steel-blue-gray">
          Reparamos celulares, tablets y consolas. Diagnóstico gratis y sin compromiso.
        </p>

        <section className="mt-8">
          <h2 className="text-[18px] font-semibold text-gray-900">Servicios</h2>
          <div className="mt-4 space-y-3">
            {SERVICIOS.map((s) => (
              <div key={s.nombre} className="flex items-start justify-between rounded-2xl bg-white p-4 shadow-sm-2">
                <div>
                  <h3 className="text-[14px] font-semibold text-gray-900">{s.nombre}</h3>
                  <p className="mt-1 text-[13px] text-steel-blue-gray">{s.descripcion}</p>
                </div>
                <span className="ml-4 shrink-0 rounded-chips bg-blue-wash px-3 py-1 text-[12px] font-semibold text-mundo-blue">
                  {s.precio}
                </span>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-8 rounded-2xl bg-canvas-frost p-6 text-center">
          <p className="text-[14px] text-steel-blue-gray">{direccion}</p>
          <p className="mt-1 text-[14px] text-steel-blue-gray">{horario}</p>
        </section>

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <a
            href={whatsappLink}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-full bg-mundo-blue px-6 py-3 text-[14px] font-semibold text-white shadow-lg-2"
          >
            Consultar por WhatsApp
          </a>
          <Link
            href="/"
            className="rounded-full border border-faint-border bg-white px-6 py-3 text-[14px] font-semibold text-gray-900 shadow-sm-2"
          >
            Ver productos
          </Link>
        </div>
      </main>
    </>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/app/reparaciones/page.tsx
git commit -m "feat(f5-t7): /reparaciones — servicios con precios + CTA WhatsApp prellenado"
```

---

### Task 8: Home Reparaciones Section

**Files:**
- Modify: `src/app/page.tsx`

**Interfaces:**
- Consumes: `config` from `safeFetchConfig()` (existing)
- Produces: Reparaciones banner section in home

- [ ] **Step 1: Add reparaciones section to home page**

Add before the closing `</main>` in `src/app/page.tsx`, after the destacados section:

```tsx
      <section className="mt-12 rounded-cards bg-abyss-navy px-6 py-10 text-center text-pure-white">
        <h2 className="text-[20px] font-semibold tracking-[-0.02em]">
          ¿Necesitas reparar tu celular?
        </h2>
        <p className="mt-2 text-[14px] text-cool-frost">
          Servicio técnico profesional. Diagnóstico gratis.
        </p>
        <Link
          href="/reparaciones"
          className="mt-4 inline-block rounded-chips bg-pure-white px-5 py-2 text-[13px] font-semibold text-ink-navy"
        >
          Ver servicios
        </Link>
      </section>
    </main>
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/app/page.tsx
git commit -m "feat(f5-t8): home — sección reparaciones banner CTA"
```

---

### Task 9: Footer Update

**Files:**
- Modify: `src/components/layout/Footer.tsx`

**Interfaces:**
- Consumes: None
- Produces: Updated footer with /contacto and /preguntas links

- [ ] **Step 1: Add links to footer**

In `src/components/layout/Footer.tsx`, add two items after the "Carrito" link in the "Enlaces" section:

```tsx
              <li>
                <Link href="/contacto" className="hover:text-gray-900">
                  Contacto
                </Link>
              </li>
              <li>
                <Link href="/preguntas" className="hover:text-gray-900">
                  Preguntas frecuentes
                </Link>
              </li>
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/components/layout/Footer.tsx
git commit -m "feat(f5-t9): footer — links a /contacto y /preguntas"
```

---

### Task 10: Final Verification + Audit

**Files:** None (verification only)

- [ ] **Step 1: Full TypeScript check**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 2: Build verification**

Run: `npm run build`
Expected: Build succeeds

- [ ] **Step 3: Manual WCAG check**

Verify:
- Bottom tab bar: `aria-label` on each icon, `aria-current="page"` on active
- /preguntas: `<details>/<summary>` for accordion, focus visible
- /contacto: links have descriptive text, `rel="noopener noreferrer"` on external
- All pages: 1 H1 only
- Tab order: logical (header → main → footer → bottom bar)

- [ ] **Step 4: Update tasks.md**

Mark Fase 5 as complete in `tasks.md`.

- [ ] **Step 5: Final commit**

```bash
git add tasks.md
git commit -m "feat(f5): Fase 5 completa — pulido mobile + páginas estáticas + auditoría"
```
