import Link from "next/link";
import Image from "next/image";
import { Icon } from "@/components/ui/Icon";

export function Footer() {
  return (
    <footer className="border-t border-white/10 bg-navy-base">
      <div className="mx-auto max-w-[1280px] px-4 py-12 sm:py-16">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-3">
          {/* Info tienda */}
          <div>
            <Image
              src="/icons/logo-footer.png"
              alt="Mundo Celular"
              width={56}
              height={56}
              className="h-14 w-14"
            />
            <h3 className="mt-3 font-inter-tight text-[18px] font-bold tracking-[-0.02em] text-fog-white">
              MUNDO CELULAR
            </h3>
            <div className="mt-4 space-y-2 text-[14px] text-slate-muted">
              <p>Cra 36 # 38 - 33, Barrio El Salvador</p>
              <p>Medellín, Antioquia</p>
            </div>
            <div className="mt-4 space-y-2 text-[14px] text-slate-muted">
              <a
                href="https://wa.me/573113554021"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 transition-colors hover:text-glow-cyan"
              >
                <Icon name="message-circle" size={16} />
                WhatsApp: +57 311 355 4021
              </a>
              <p>Lun–Sáb 9:00 AM – 7:00 PM</p>
            </div>
          </div>

          {/* Enlaces */}
          <div>
            <h4 className="font-inter-tight text-[16px] font-semibold text-fog-white">
              Enlaces
            </h4>
            <ul className="mt-4 space-y-3">
              <li>
                <Link
                  href="/"
                  className="text-[14px] text-slate-muted transition-colors hover:text-glow-cyan"
                >
                  Categorías
                </Link>
              </li>
              <li>
                <Link
                  href="/reparaciones"
                  className="text-[14px] text-slate-muted transition-colors hover:text-glow-cyan"
                >
                  Reparaciones
                </Link>
              </li>
              <li>
                <Link
                  href="/carrito"
                  className="text-[14px] text-slate-muted transition-colors hover:text-glow-cyan"
                >
                  Carrito
                </Link>
              </li>
              <li>
                <Link
                  href="/contacto"
                  className="text-[14px] text-slate-muted transition-colors hover:text-glow-cyan"
                >
                  Contacto
                </Link>
              </li>
              <li>
                <Link
                  href="/preguntas"
                  className="text-[14px] text-slate-muted transition-colors hover:text-glow-cyan"
                >
                  Preguntas frecuentes
                </Link>
              </li>
            </ul>
          </div>

          {/* Redes sociales */}
          <div>
            <h4 className="font-inter-tight text-[16px] font-semibold text-fog-white">
              Redes sociales
            </h4>
            <ul className="mt-4 space-y-3">
              <li>
                <a
                  href="https://instagram.com/mundo_celular_75"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-[14px] text-slate-muted transition-colors hover:text-glow-cyan"
                >
                  <Icon name="user" size={16} />
                  Instagram
                </a>
              </li>
              <li>
                <a
                  href="https://facebook.com/Mundo.Celular.01"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-[14px] text-slate-muted transition-colors hover:text-glow-cyan"
                >
                  <Icon name="user" size={16} />
                  Facebook
                </a>
              </li>
              <li>
                <a
                  href="https://tiktok.com/@mundocelular75"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-[14px] text-slate-muted transition-colors hover:text-glow-cyan"
                >
                  <Icon name="user" size={16} />
                  TikTok
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 border-t border-white/10 pt-6 text-center text-[13px] text-slate-muted">
          &copy; {new Date().getFullYear()} Mundo Celular. Todos los derechos reservados.
        </div>
      </div>
    </footer>
  );
}