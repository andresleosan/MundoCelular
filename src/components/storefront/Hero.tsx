import Link from "next/link";
import type { ConfigTienda } from "@/types";

const WHATSAPP_LINK = "https://wa.me/573113554021";

export function Hero({ config }: { config: ConfigTienda }) {
  return (
    <section className="relative overflow-hidden rounded-cards bg-abyss-navy px-6 py-16 text-center text-pure-white">
      <h1 className="font-inter-tight text-[28px] font-semibold tracking-[-0.03em] text-mundo-blue sm:text-[36px]">
        {config.nombre}
      </h1>
      <p className="mt-3 text-[16px] tracking-[-0.02em] text-canvas-frost">
        Celulares, accesorios, consolas y tecnología en {config.ciudad}. Compra por WhatsApp.
      </p>
      <p className="mt-2 text-[12px] text-cool-frost">También reparamos celulares.</p>
      <div className="mt-6 flex flex-wrap justify-center gap-2">
        <Link href={WHATSAPP_LINK} className="rounded-chips bg-mundo-blue px-4 py-2 text-[12px] font-semibold text-pure-white">
          WhatsApp
        </Link>
        <Link href="/reparaciones" className="rounded-chips bg-pure-white px-4 py-2 text-[12px] font-semibold text-ink-navy">
          Reparaciones
        </Link>
      </div>
      <div className="mt-6 flex flex-wrap justify-center gap-3 text-[12px] text-canvas-frost">
        <span>🚚 Envío gratis</span>
        <span>🛡️ Garantía 12 meses</span>
        <span>💬 Soporte 24/7</span>
      </div>
    </section>
  );
}
