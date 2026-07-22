import { describe, it, expect } from "vitest";

import robots from "@/app/robots";

type MetadataRouteRules = { userAgent?: string | string[]; allow?: string | string[]; disallow?: string | string[]; crawlDelay?: number };

function getRulesArray(result: ReturnType<typeof robots>): MetadataRouteRules[] {
  return Array.isArray(result.rules) ? result.rules : [result.rules];
}

describe("robots.ts", () => {
  it("bloquea /admin", () => {
    const result = robots();
    const disallowRules = getRulesArray(result)
      .filter((r) => r.disallow !== undefined)
      .flatMap((r) => Array.isArray(r.disallow) ? r.disallow : [r.disallow ?? ""]);
    expect(disallowRules).toContain("/admin");
  });

  it("permite /", () => {
    const result = robots();
    const allowRules = getRulesArray(result)
      .filter((r) => r.allow !== undefined)
      .map((r) => r.allow)
      .filter((a): a is string => typeof a === "string");
    expect(allowRules).toContain("/");
  });

  it("incluye sitemap", () => {
    const result = robots();
    expect(result.sitemap).toBeDefined();
    expect(result.sitemap).toContain("sitemap.xml");
  });
});
