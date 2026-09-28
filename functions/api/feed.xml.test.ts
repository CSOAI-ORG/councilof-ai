import { afterEach, describe, expect, it, vi } from "vitest";
import { onRequestGet, deriveItems, CAP } from "./feed.xml";

/**
 * The feed derives its items; it types none. Board line first (live or honestly
 * unavailable), then report items from /reports/index.json and the findings-index
 * line from /signed/findings_index.json, newest first, capped.
 */

const report = (i: number, status = "UNMEASURED") => ({
  subject: `model-${i}`, slug: `model-${i}`, axis: "governance", status,
  n: status === "MEASURED" ? 40 : 0, n_unit: "bank items",
  reason: status === "MEASURED" ? undefined : "source card carries no n",
  as_of: new Date(Date.UTC(2026, 7, 1 + (i % 28), i % 24)).toISOString(),
  source_cards: 1, obligations: i % 2 ? 3 : "UNMAPPED", rooted: false,
  api: `/api/report?subject=model-${i}&axis=governance`, canonical_sha256: "f".repeat(64),
});

const install = (opts: { gspc?: boolean; gspcCount?: string; index?: any; findings?: any } = {}) => {
  vi.stubGlobal("fetch", vi.fn(async (input: string | URL | Request) => {
    const url = new URL(typeof input === "string" ? input : input instanceof URL ? input : input.url);
    if (url.pathname === "/api/gspc") return opts.gspc === false ? new Response("down", { status: 503 }) : Response.json({ totals: { public_count: opts.gspcCount ?? "23 axis · 23 measured", model_fleets: 1, fact_runs: 9, items: 900 } });
    if (url.pathname === "/reports/index.json") return opts.index === null ? new Response("nf", { status: 404 }) : Response.json(opts.index ?? { reports: [report(1, "MEASURED"), report(2)] });
    if (url.pathname === "/signed/findings_index.json") return opts.findings === null ? new Response("nf", { status: 404 }) : Response.json(opts.findings ?? { as_of: "2026-08-19T09:24:39Z", counts: { findings: 335, models: 64, axes: 16, regulators: 3, possible_cells: 1024, unmeasured_cells: 689 } });
    return new Response("nf", { status: 404 });
  }));
};

afterEach(() => { vi.unstubAllGlobals(); vi.useRealTimers(); });

describe("/api/feed.xml derives its items", () => {
  it("board line first, then one item per report and the findings-index line", async () => {
    install();
    const items = await deriveItems("https://councilof.ai");
    expect(items[0].title).toBe("GSPC board: 23 axis · 23 measured — live");
    const titles = items.slice(1).map((i) => i.title);
    expect(titles).toContain("model-1 × governance: MEASURED (n=40 bank items)");
    expect(titles).toContain("model-2 × governance: UNMEASURED");
    expect(titles).toContain("Regulation-findings index: 335 findings · 64 models · 16 axes · 3 regulators");
    const unmeasured = items.find((i) => i.title.startsWith("model-2"))!;
    expect(unmeasured.desc).toMatch(/UNMEASURED — source card carries no n/);
    expect(unmeasured.desc).toMatch(/obligations UNMAPPED/);
    expect(unmeasured.link).toBe("https://councilof.ai/api/report?subject=model-2&axis=governance");
  });

  it("newest first and capped at 50 derived items after the board line", async () => {
    install({ index: { reports: Array.from({ length: 80 }, (_, i) => report(i)) } });
    const items = await deriveItems("https://councilof.ai");
    expect(items.length).toBe(1 + CAP);
    const dates = items.slice(1).map((i) => new Date(i.date!).getTime());
    for (let i = 1; i < dates.length; i++) expect(dates[i - 1]).toBeGreaterThanOrEqual(dates[i]);
  });

  it("never fabricates: an unreadable board and unreadable indexes yield honest lines, no typed history", async () => {
    install({ gspc: false, index: null, findings: null });
    const items = await deriveItems("https://councilof.ai");
    expect(items.map((i) => i.title)).toEqual(["GSPC board: live count unavailable", "Derived items unavailable"]);
  });

  it("renders RSS 2.0 with the channel shape and CORS header", async () => {
    install();
    const res = await (onRequestGet as unknown as Function)({ request: new Request("https://councilof.ai/api/feed.xml") });
    expect(res.headers.get("content-type")).toMatch(/application\/rss\+xml/);
    expect(res.headers.get("access-control-allow-origin")).toBe("*");
    const xml = await res.text();
    expect(xml).toMatch(/^<\?xml version="1\.0"/);
    expect(xml).toMatch(/<rss version="2\.0"/);
    expect(xml).toMatch(/<atom:link href="https:\/\/councilof\.ai\/feed\.xml" rel="self"/);
    expect((xml.match(/<item>/g) || []).length).toBe(4);
    expect(xml).toMatch(/&amp;axis=governance/);
  });

  it("keeps item identity stable across reads and changes it only when source content changes", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-09-24T03:00:00Z"));
    install();
    const read = async () => (await (onRequestGet as unknown as Function)({ request: new Request("https://councilof.ai/feed.xml") })).text();
    const before = await read();
    vi.setSystemTime(new Date("2026-09-24T04:00:00Z"));
    const unchanged = await read();
    expect(unchanged).toBe(before);
    const boardItem = before.match(/<item>[\s\S]*?<\/item>/)?.[0] ?? "";
    expect(boardItem).toContain("#sha256-");
    expect(boardItem).not.toContain("<pubDate>"); // API supplies no board event time.

    install({ gspcCount: "24 axis · 23 measured" });
    const changed = await read();
    expect(changed).not.toBe(before);
    expect(changed.match(/<item>[\s\S]*?<\/item>/)?.[0]).not.toBe(boardItem);
  });
});
