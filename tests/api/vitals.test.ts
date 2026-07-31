import { describe, it, expect, vi } from "vitest";

describe("POST /api/vitals", () => {
  it("responde 200 y loguea la métrica en formato JSON estructurado", async () => {
    const spy = vi.spyOn(console, "log").mockImplementation(() => {});
    const { POST } = await import("@/app/api/vitals/route");

    const req = new Request("http://localhost/api/vitals", {
      method: "POST",
      body: JSON.stringify({
        name: "LCP",
        value: 1234,
        id: "v1-123",
        rating: "good",
        path: "/",
        timestamp: Date.now(),
      }),
    });
    const res = await POST(req as unknown as import("next/server").NextRequest);

    expect(res.status).toBe(200);
    const logged = spy.mock.calls[0]?.[0] as string;
    expect(logged).toContain('"type":"web-vital"');
    expect(logged).toContain('"name":"LCP"');
    expect(logged).toContain('"value":1234');
    spy.mockRestore();
  });
});
