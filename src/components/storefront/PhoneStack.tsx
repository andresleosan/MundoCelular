"use client";

import Image from "next/image";
import { useTilt } from "@/hooks/useTilt";

const phones = [
  { offsetX: 0, offsetY: 0, rotation: 0, scale: 1, shadow: "0 12px 40px rgba(0, 27, 91, 0.5), 0 0 48px rgba(0, 212, 255, 0.25)" },
  { offsetX: -18, offsetY: 14, rotation: -4, scale: 0.96, shadow: "0 8px 28px rgba(0, 27, 91, 0.4), 0 0 24px rgba(0, 212, 255, 0.15)" },
  { offsetX: 20, offsetY: 24, rotation: 3, scale: 0.92, shadow: "0 6px 20px rgba(0, 27, 91, 0.3), 0 0 16px rgba(0, 212, 255, 0.1)" },
];

const chips = [
  { label: "5G", left: "18%", top: "18%", delay: "0s" },
  { label: "128GB", left: "82%", top: "18%", delay: "0.5s" },
  { label: "48MP", left: "18%", top: "82%", delay: "1s" },
  { label: "12 meses", left: "82%", top: "82%", delay: "1.5s" },
];

function PhoneSVG({ glowId }: { glowId: string }) {
  return (
    <svg viewBox="0 0 120 220" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-full w-full">
      <defs>
        <linearGradient id={glowId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#001B5B" />
          <stop offset="100%" stopColor="#00D4FF" />
        </linearGradient>
      </defs>
      {/* Phone body */}
      <rect x="4" y="4" width="112" height="212" rx="20" fill="#00113A" stroke="#0035A8" strokeWidth="1.5" />
      {/* Screen */}
      <rect x="10" y="16" width="100" height="188" rx="12" fill={`url(#${glowId})`} opacity="0.9" className="animate-glow-pulse" />
      {/* Notch */}
      <rect x="40" y="8" width="40" height="8" rx="4" fill="#00113A" />
      {/* Camera dot */}
      <circle cx="60" cy="12" r="2" fill="#0035A8" />
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
              aspectRatio: "120 / 220",
              transform: `translate(calc(-50% + ${phone.offsetX}px), calc(-50% + ${phone.offsetY}px)) rotate(${phone.rotation}deg) scale(${phone.scale})`,
              boxShadow: phone.shadow,
              borderRadius: "24px",
              zIndex: phones.length - i,
            }}
          >
            <PhoneSVG glowId={`phone-glow-${i}`} />
            {/* Screen overlay — only on front phone */}
            {i === 0 && (
              <div
                className="absolute"
                style={{
                  left: "8.33%",
                  top: "7.27%",
                  width: "83.33%",
                  height: "85.45%",
                }}
              >
                {/* Logo icon centered */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="relative flex h-[35%] w-[35%] items-center justify-center rounded-[16px] bg-white/10 backdrop-blur-sm">
                    <Image
                      src="/icons/logo-icon-white.svg"
                      alt=""
                      width={48}
                      height={48}
                      className="h-full w-full object-contain animate-logo-breathe"
                    />
                    {/* Ping ring */}
                    <div className="absolute inset-0 rounded-[16px] border-2 border-white/30 animate-ping-ring" />
                  </div>
                </div>
                {/* Chips in screen area */}
                <div className="relative h-full w-full">
                  {chips.map((chip) => (
                    <div
                      key={chip.label}
                      className="animate-float-chip absolute z-20 -translate-x-1/2 -translate-y-1/2 cursor-default rounded-chips border border-white/10 bg-white/10 px-3 py-1.5 text-[11px] font-semibold tracking-wide text-fog-white backdrop-blur-md transition-all duration-200 hover:scale-110 hover:border-glow-cyan/40 hover:bg-white/20 hover:shadow-[0_0_16px_rgba(51,214,255,0.25)]"
                      style={{
                        left: chip.left,
                        top: chip.top,
                        animationDelay: chip.delay,
                        fontFamily: "var(--font-jetbrains-mono)",
                      }}
                    >
                      {chip.label}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
