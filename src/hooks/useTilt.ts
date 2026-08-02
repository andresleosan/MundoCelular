"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface Tilt {
  rotateX: number;
  rotateY: number;
}

export function useTilt(maxAngle = 8): {
  ref: React.RefObject<HTMLDivElement | null>;
  tilt: Tilt;
} {
  const ref = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState<Tilt>({ rotateX: 0, rotateY: 0 });

  const handlePointerMove = useCallback(
    (e: PointerEvent) => {
      const el = ref.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      setTilt({
        rotateX: -y * maxAngle,
        rotateY: x * maxAngle,
      });
    },
    [maxAngle],
  );

  const handlePointerLeave = useCallback(() => {
    setTilt({ rotateX: 0, rotateY: 0 });
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (window.innerWidth < 1024) return;

    el.addEventListener("pointermove", handlePointerMove, { passive: true });
    el.addEventListener("pointerleave", handlePointerLeave);
    return () => {
      el.removeEventListener("pointermove", handlePointerMove);
      el.removeEventListener("pointerleave", handlePointerLeave);
    };
  }, [handlePointerMove, handlePointerLeave]);

  return { ref, tilt };
}
