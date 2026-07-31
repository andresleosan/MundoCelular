"use client";

import { useReportWebVitals } from "next/web-vitals";

export function WebVitals() {
  useReportWebVitals(async (metric) => {
    if (process.env.NODE_ENV !== "production") return;

    try {
      await fetch("/api/vitals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: metric.name,
          value: metric.value,
          id: metric.id,
          rating: metric.rating,
          path: typeof window !== "undefined" ? window.location.pathname : "/",
          timestamp: Date.now(),
        }),
        keepalive: true,
      });
    } catch {
      // Telemetría no debe romper UX
    }
  });

  return null;
}
