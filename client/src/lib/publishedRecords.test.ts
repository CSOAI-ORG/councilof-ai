import { describe, it, expect } from "vitest";
import { mapPublishedRecords, legendLine, type FeedInputs, type FeedResult } from "./publishedRecords";

const ok = (url: string, data: any): FeedResult => ({ ok: true, url, data });
const bad = (url: string, reason: string): FeedResult => ({ ok: false, url, reason });

const index = {
  as_of: "2026-11-21T16:57:32Z", run_artifact: "/interop/watchdog-intake/20261121T165732Z.json",
  signals: [
    { source_id: "cisa-kev", name: "CISA Known Exploited Vulnerabilities catalog", kind: "advisory-feed", state: "REACHABLE", count: 1790, count_kind: "count", http_status: 200, body_sha256: "ab" },
    { source_id: "atlas-current", name: "MITRE ATLAS", kind: "threat-framework", state: "REACHABLE", count: 221, count_kind: "count", http_status: 200 },
    { source_id: "atlas-manifest", name: "MITRE ATLAS manifest", kind: "threat-framework", state: "REACHABLE", count: 38, count_kind: "count", http_status: 200 },
    { source_id: "owasp-asvs", name: "OWASP ASVS", kind: "threat-framework", state: "REACHABLE", count: null, count_kind: "digest" },
    { source_id: "go-vuln", name: "Go vulnerability database", kind: "advisory-feed", state: "UNREACHABLE", count: 0, count_kind: "count" },
  ],
};
const gspc = { axes: [
  { axis: "ai-adoption-components", facts_as_of: "2026-09-17T12:58:11Z", evidence_url: "/interop/financial-measure-run-ai-adoption-components.json", run_attestation: "CONTENT_ADDRESSED_UNSIGNED" },
  { axis: "labour-components", facts_as_of: "2026-09-17T12:58:11Z", evidence_url: "/interop/financial-measure-run-labour-components.json" },
] };
const run = (series: any[]) => ({ measured: series });
const eu = { series: "EU27 enterprises with 10+ employees using any AI", status: "MEASURED", year: "2025", value: 19.95, unit: "%", source: "https://ec.europa.eu/x" };

const base = (): FeedInputs => ({
  gspc: ok("/api/gspc", gspc),
  intakeLatest: ok("/interop/watchdog-intake/latest.json", { run_artifact: index.run_artifact }),
  intakeIndex: ok("/interop/watchdog-intake/_index.json", index),
  adoption: ok("a", run([eu])),
  labour: ok("l", run([{ ...eu, series: "EU27 activity rate", value: 75.6 }])),
});

describe("mapPublishedRecords", () => {
  it("maps a normal record with address, as_of and verifier link", () => {
    const r = mapPublishedRecords(base());
    const s = r.stamps.find((x) => x.id === "pub:watchdog:cisa-kev")!;
    expect(s.payload.record_address).toBe("https://councilof.ai/interop/watchdog-intake/20261121T165732Z.json");
    expect(s.payload.as_of).toBe("2026-11-21T16:57:32Z");
    expect(s.payload.verifier).toBe("https://councilof.ai/verify");
    expect(s.payload.layer_class).toBe("measured");
    expect(s.payload.review).toMatch(/unreviewed/);
    const e = r.stamps.find((x) => x.id === "pub:eurostat:ai-adoption-components")!;
    expect(e.payload.layer_class).toBe("reported-by-other");
    expect((e.payload.detail.series as any[])[0]).toMatchObject({ value: 19.95, unit: "%" });
    expect(r.count).toBe(r.stamps.length);
    expect(r.newest_as_of).toBe("2026-11-21T16:57:32Z");
    expect(legendLine(r)).toContain("newest as_of 2026-11-21T16:57:32Z");
  });

  it("keeps records with no place off the globe and lists them", () => {
    const r = mapPublishedRecords(base());
    expect(r.stamps.find((x) => x.id.includes("owasp-asvs"))).toBeUndefined();
    expect(r.omitted.some((o) => o.source.includes("owasp-asvs"))).toBe(true);
    expect(r.omitted.some((o) => o.source.includes("/api/gspc totals"))).toBe(true);
    expect(r.omitted.some((o) => o.source.includes("x402"))).toBe(true);
  });

  it("does not draw an unreachable source, and does not overlap sources sharing a seat", () => {
    const r = mapPublishedRecords(base());
    expect(r.stamps.find((x) => x.id.includes("go-vuln"))).toBeUndefined();
    const a = r.stamps.find((x) => x.id.endsWith("atlas-current"))!, b = r.stamps.find((x) => x.id.endsWith("atlas-manifest"))!;
    expect(a.lng).not.toBe(b.lng);
  });

  it("omits and lists a failed source instead of drawing zero", () => {
    const i = base();
    i.intakeIndex = bad("/interop/watchdog-intake/_index.json", "HTTP 503");
    i.labour = bad("l", "timeout");
    const r = mapPublishedRecords(i);
    expect(r.stamps.some((s) => s.id.startsWith("pub:watchdog"))).toBe(false);
    expect(r.stamps.some((s) => s.id.endsWith("labour-components"))).toBe(false);
    expect(r.omitted.map((o) => o.reason).join("|")).toMatch(/HTTP 503/);
    expect(r.omitted.map((o) => o.reason).join("|")).toMatch(/timeout/);
    expect(r.stamps.some((s) => s.id.endsWith("ai-adoption-components"))).toBe(true);
  });

  it("with every source failed, reports none and a null newest time", () => {
    const f = (u: string) => bad(u, "offline");
    const r = mapPublishedRecords({ gspc: f("g"), intakeLatest: f("a"), intakeIndex: f("b"), adoption: f("c"), labour: f("d") });
    expect(r.count).toBe(0);
    expect(r.newest_as_of).toBeNull();
    expect(legendLine(r)).toMatch(/none available/);
  });

  it("still maps the intake when only latest.json failed, using the index's run address", () => {
    const i = base(); i.intakeLatest = bad("latest", "HTTP 500");
    const r = mapPublishedRecords(i);
    expect(r.stamps.find((x) => x.id.endsWith("cisa-kev"))!.payload.record_address).toContain("20261121T165732Z.json");
    expect(r.omitted.some((o) => o.reason.includes("HTTP 500"))).toBe(true);
  });
});
