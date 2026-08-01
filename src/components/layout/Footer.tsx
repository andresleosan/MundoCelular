import Link from "next/link";
import { Icon } from "@/components/ui/Icon";

export function Footer() {
  return (
    <footer className="border-t border-faint-border bg-surface">
      <div className="mx-auto max-w-[1280px] px-4 py-12 sm:py-16">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-3">
          {/* Info tienda */}
          <div>
            <h3 className="font-inter-tight text-[18px] font-bold tracking-[-0.02em] text-text">
              MUNDO CELULAR
            </h3>
            <div className="mt-4 space-y-2 text-[14px] text-text-secondary">
              <p>Cra 36 # 38 - 33, Barrio El Salvador</p>
              <p>Medellín, Antioquia</p>
            </div>
            <div className="mt-4 space-y-2 text-[14px] text-text-secondary">
              <a
                href="https://wa.me/573113554021"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 transition-colors hover:text-primary"
              >
                <Icon name="message-circle" size={16} />
                WhatsApp: +57 311 355 4021
              </a>
              <p>Lun–Sáb 9:00 AM – 7:00 PM</p>
            </div>
          </div>

          {/* Enlaces */}
          <div>
            <h4 className="font-inter-tight text-[16px] font-semibold text-text">
              Enlaces
            </h4>
            <ul className="mt-4 space-y-3">
              <li>
                <Link
                  href="/"
                  className="text-[14px] text-text-secondary transition-colors hover:text-primary"
                >
                  Categorías
                </Link>
              </li>
              <li>
                <Link
                  href="/reparaciones"
                  className="text-[14px] text-text-secondary transition-colors hover:text-primary"
                >
                  Reparaciones
                </Link>
              </li>
              <li>
                <Link
                  href="/carrito"
                  className="text-[14px] text-text-secondary transition-colors hover:text-primary"
                >
                  Carrito
                </Link>
              </li>
              <li>
                <Link
                  href="/contacto"
                  className="text-[14px] text-text-secondary transition-colors hover:text-primary"
                >
                  Contacto
                </Link>
              </li>
              <li>
                <Link
                  href="/preguntas"
                  className="text-[14px] text-text-secondary transition-colors hover:text-primary"
                >
                  Preguntas frecuentes
                </Link>
              </li>
            </ul>
          </div>

          {/* Redes sociales */}
          <div>
            <h4 className="font-inter-tight text-[16px] font-semibold text-text">
              Redes sociales
            </h4>
            <ul className="mt-4 space-y-3">
              <li>
                <a
                  href="https://instagram.com/mundo_celular_75"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-[14px] text-text-secondary transition-colors hover:text-primary"
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
                  className="inline-flex items-center gap-2 text-[14px] text-text-secondary transition-colors hover:text-primary"
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
                  className="inline-flex items-center gap-2 text-[14px] text-text-secondary transition-colors hover:text-primary"
                >
                  <Icon name="user" size={16} />
                  TikTok
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 border-t border-faint-border pt-6 text-center text-[13px] text-text-secondary">
          &copy; {new Date().getFullYear()} Mundo Celular. Todos los derechos reservados.
        </div>
      </div>
    </footer>
  );
}