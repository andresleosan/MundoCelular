import { describe, it, expect } from "vitest";
import { esClaimAdmin } from "@/lib/auth-claims";

describe("esClaimAdmin", () => {
  it("true solo cuando el claim admin es true", () => {
    expect(esClaimAdmin({ admin: true })).toBe(true);
    expect(esClaimAdmin({ admin: false })).toBe(false);
    expect(esClaimAdmin({})).toBe(false);
    expect(esClaimAdmin({ admin: "true" })).toBe(false);
  });
});
