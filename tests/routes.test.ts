import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("../src/turath/client.js", () => ({
  turathGet: vi.fn(async () => ({ results: [], count: 0 }))
}));

vi.mock("../src/turath/index-cache.js", () => ({
  getBookIndex: vi.fn(async () => ({
    bookId: 170,
    fetchedAt: Date.now(),
    meta: null,
    headings: Array.from({ length: 120 }).map((_, i) => ({ title: `H${i + 1}`, page: i + 1, level: 1, breadcrumb: [`H${i + 1}`] })),
    volumes: null,
    pageMap: null,
    pageHeadings: null,
    printPgToPg: null,
    volumeBounds: null
  }))
}));

describe("routes", () => {
  afterEach(() => vi.clearAllMocks());

  it("/health returns ok", async () => {
    const { buildApp } = await import("../src/app.js");
    const app = buildApp();
    const res = await app.inject({ method: "GET", url: "/health" });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ ok: true });
  });

  it("/index/chunk rejects limit > 100", async () => {
    const { buildApp } = await import("../src/app.js");
    const app = buildApp();
    const res = await app.inject({ method: "GET", url: "/books/170/index/chunk?offset=0&limit=101" });
    expect(res.statusCode).toBe(400);
  });

  it("/index/search returns bounded results", async () => {
    const { buildApp } = await import("../src/app.js");
    const app = buildApp();
    const res = await app.inject({ method: "GET", url: "/books/170/index/search?q=H&limit=10" });
    expect(res.statusCode).toBe(200);
    expect(res.json().results.length).toBeLessThanOrEqual(10);
  });
});
