import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-faint-border bg-pure-white">
      <div className="mx-auto max-w-[1200px] px-4 py-12">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
          <div>
            <h3 className="font-sora text-[16px] font-semibold tracking-[-0.015em] text-ink-navy">
              MUNDO CELULAR
            </h3>
            <p className="mt-3 text-[14px] text-steel-blue-gray">
              Cra 36 # 38 - 33, Barrio El Salvador, Medellín, Antioquia
            </p>
            <p className="mt-2 text-[14px] text-steel-blue-gray">
              <a
                href="https://wa.me/573113554021"
                target="_blank"
                rel="noopener noreferrer"
                className="text-mundo-blue hover:underline"
              >
                WhatsApp: +57 311 355 4021
              </a>
            </p>
            <p className="mt-1 text-[14px] text-steel-blue-gray">
              Lun–Sáb 9:00 AM – 7:00 PM
            </p>
          </div>

          <div>
            <h4 className="text-[14px] font-semibold text-ink-navy">Enlaces</h4>
            <ul className="mt-3 space-y-2 text-[14px] text-steel-blue-gray">
              <li>
                <Link href="/" className="hover:text-gray-900">
                  Categorías
                </Link>
              </li>
              <li>
                <Link href="/reparaciones" className="hover:text-gray-900">
                  Reparaciones
                </Link>
              </li>
              <li>
                <Link href="/carrito" className="hover:text-gray-900">
                  Carrito
                </Link>
              </li>
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
            </ul>
          </div>

          <div>
            <h4 className="text-[14px] font-semibold text-ink-navy">Redes sociales</h4>
            <ul className="mt-3 space-y-2 text-[14px] text-steel-blue-gray">
              <li>
                <a
                  href="https://instagram.com/mundo_celular_75"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-gray-900"
                >
                  Instagram
                </a>
              </li>
              <li>
                <a
                  href="https://facebook.com/Mundo.Celular.01"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-gray-900"
                >
                  Facebook
                </a>
              </li>
              <li>
                <a
                  href="https://tiktok.com/@mundocelular75"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-gray-900"
                >
                  TikTok
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 border-t border-faint-border pt-6 text-center text-[12px] text-steel-blue-gray">
          &copy; {new Date().getFullYear()} Mundo Celular. Todos los derechos reservados.
        </div>
      </div>
    </footer>
  );
}