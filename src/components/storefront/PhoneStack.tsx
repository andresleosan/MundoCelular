"use client";

import { useTilt } from "@/hooks/useTilt";

const phones = [
  { offsetX: 0, offsetY: 0, rotation: 0, scale: 1, shadow: "0 8px 32px rgba(11,19,48,0.5)" },
  { offsetX: -18, offsetY: 14, rotation: -4, scale: 0.96, shadow: "0 6px 24px rgba(11,19,48,0.4)" },
  { offsetX: 20, offsetY: 24, rotation: 3, scale: 0.92, shadow: "0 4px 16px rgba(11,19,48,0.3)" },
];

const chips = [
  { label: "5G", x: -60, y: -30, delay: "0s" },
  { label: "128GB", x: 70, y: -20, delay: "0.5s" },
  { label: "48MP", x: -50, y: 50, delay: "1s" },
  { label: "12 meses", x: 65, y: 55, delay: "1.5s" },
];

function PhoneSVG({ glowId }: { glowId: string }) {
  return (
    <svg viewBox="0 0 120 220" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-full w-full">
      <defs>
        <linearGradient id={glowId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--color-primary)" />
          <stop offset="100%" stopColor="var(--color-glow-cyan)" />
        </linearGradient>
      </defs>
      {/* Phone body */}
      <rect x="4" y="4" width="112" height="212" rx="20" fill="#1a1f36" stroke="#2a3050" strokeWidth="1.5" />
      {/* Screen */}
      <rect x="10" y="16" width="100" height="188" rx="12" fill={`url(#${glowId})`} opacity="0.85" className="animate-glow-pulse" />
      {/* Notch */}
      <rect x="40" y="8" width="40" height="8" rx="4" fill="#0f1325" />
      {/* Camera dot */}
      <circle cx="60" cy="12" r="2" fill="#2a3050" />
    </svg>
  );
}

export function PhoneStack() {
  const { ref, tilt } = useTilt(8);

  return (
    <div
      ref={ref}
      className="relative aspect-square w-full max-w-[420px]"
      style={{
        perspective: "800px",
        transform: `rotateX(${tilt.rotateX}deg) rotateY(${tilt.rotateY}deg)`,
        transition: "transform 0.15s ease-out",
      }}
    >
      {/* Phone stack */}
      <div className="absolute inset-0">
        {phones.map((phone, i) => (
          <div
            key={i}
            className="absolute"
            style={{
              left: "50%",
              top: "50%",
              width: "55%",
              transform: `translate(calc(-50% + ${phone.offsetX}px), calc(-50% + ${phone.offsetY}px)) rotate(${phone.rotation}deg) scale(${phone.scale})`,
              boxShadow: phone.shadow,
              borderRadius: "24px",
              zIndex: phones.length - i,
            }}
          >
            <PhoneSVG glowId={`phone-glow-${i}`} />
          </div>
        ))}
      </div>

      {/* Floating chips */}
      {chips.map((chip) => (
        <div
          key={chip.label}
          className="animate-float-chip absolute z-20 cursor-default rounded-chips border border-white/10 bg-white/10 px-3 py-1.5 text-[11px] font-semibold tracking-wide text-fog-white backdrop-blur-md transition-all duration-200 hover:scale-110 hover:border-glow-cyan/40 hover:bg-white/20 hover:shadow-[0_0_16px_rgba(51,214,255,0.25)]"
          style={{
            left: `calc(50% + ${chip.x}px)`,
            top: `calc(50% + ${chip.y}px)`,
            animationDelay: chip.delay,
            fontFamily: "var(--font-jetbrains-mono)",
          }}
        >
          {chip.label}
        </div>
      ))}
    </div>
  );
}
