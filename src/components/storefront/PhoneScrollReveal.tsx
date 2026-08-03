"use client";

import { useRef, useEffect, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export function PhoneScrollReveal() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const pinRef = useRef<HTMLDivElement>(null);
  const armadoRef = useRef<HTMLImageElement>(null);
  const desarmadoRef = useRef<HTMLImageElement>(null);
  const [reducedMotion, setReducedMotion] = useState(true);

  useEffect(() => {
    setReducedMotion(
      window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    );
  }, []);

  useEffect(() => {
    if (reducedMotion) return;

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top top",
          end: "+=2500",
          scrub: 1.2,
          pin: pinRef.current,
          anticipatePin: 1,
        },
      });

      tl.fromTo(
        armadoRef.current,
        { opacity: 1, scale: 1, y: 0 },
        { opacity: 0, scale: 1.08, y: -30, ease: "power2.inOut" },
        0,
      );

      tl.fromTo(
        desarmadoRef.current,
        { opacity: 0, scale: 0.92, y: 30 },
        { opacity: 1, scale: 1, y: 0, ease: "power2.inOut" },
        0,
      );
    }, sectionRef);

    return () => ctx.revert();
  }, [reducedMotion]);

  if (reducedMotion) {
    return (
      <section
        className="relative flex items-center justify-center bg-navy-base py-16"
        aria-label="Celular armado"
      >
        <img
          src="/Armado.png"
          alt="Celular armado"
          className="max-h-[60vh] w-auto object-contain"
          loading="lazy"
        />
      </section>
    );
  }

  return (
    <section
      ref={sectionRef}
      className="relative w-full bg-navy-base"
      style={{ height: "300vh" }}
      aria-label="Animación de despiece del celular"
    >
      {/* Background depth */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-navy-deep via-navy-base to-navy-surface opacity-90" />
        <div
          className="absolute -left-20 top-20 h-72 w-72 rounded-full opacity-30 blur-3xl"
          style={{
            background:
              "radial-gradient(circle, #00D4FF 0%, transparent 70%)",
          }}
        />
        <div
          className="absolute -right-10 bottom-10 h-96 w-96 rounded-full opacity-20 blur-3xl"
          style={{
            background:
              "radial-gradient(circle, #0035A8 0%, transparent 70%)",
          }}
        />
        <div
          className="absolute inset-0 opacity-[0.03] mix-blend-overlay"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
          }}
        />
      </div>

      <div
        ref={pinRef}
        className="sticky top-0 flex h-screen items-center justify-center overflow-hidden"
      >
        <div className="relative flex h-full w-full max-w-[1200px] items-center justify-center px-4">
          <img
            ref={armadoRef}
            src="/Armado.png"
            alt="Celular armado"
            className="absolute max-h-[72vh] w-auto object-contain"
            style={{ willChange: "transform, opacity" }}
            loading="eager"
          />
          <img
            ref={desarmadoRef}
            src="/Desarmado.png"
            alt="Celular desarmado"
            className="absolute max-h-[72vh] w-auto object-contain"
            style={{ opacity: 0, willChange: "transform, opacity" }}
            loading="lazy"
          />
        </div>
      </div>
    </section>
  );
}
