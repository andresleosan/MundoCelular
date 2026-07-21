import { describe, it, expect } from "vitest";

import robots from "@/app/robots";

describe("robots.ts", () => {
  it("bloquea /admin", () => {
    const result = robots();
    const disallowRules = result.rules.flatMap((r) =>
      Array.isArray(r.disallow) ? r.disallow : [r.disallow ?? ""]
    );
    expect(disallowRules).toContain("/admin");
  });

  it("permite /", () => {
    const result = robots();
    const allowRules = result.rules
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
