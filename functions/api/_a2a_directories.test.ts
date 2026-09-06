import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const R = (p: string) => JSON.parse(readFileSync(resolve(__dirname, "../..", p), "utf8"));
const doc = R("public/interop/a2a-directories.json");
const card = R("public/.well-known/agent-card.json");

const STATES = ["LISTED", "NOT_LISTED", "UNKNOWN", "NOT_A_DIRECTORY"];
const SURFACES = ["api", "sitemap", "rendered", "ours"];

describe("the A2A directory census claims only what a probe of the directory returned", () => {
  it("every row carries a state, a surface and the command that produced them", () => {
    for (const r of doc.directories) {
      expect(STATES, `${r.id}: ${r.state}`).toContain(r.state);
      expect(SURFACES, `${r.id}: ${r.surface}`).toContain(r.surface);
      expect(r.probe, `${r.id} has no probe command`).toBeTruthy();
      expect(r.evidence, `${r.id} has no evidence`).toBeTruthy();
    }
  });

  it("never lets `ours` be evidence about a third party", () => {
    const bad = doc.directories.filter((r: { surface: string }) => r.surface === "ours");
    expect(bad.map((b: { id: string }) => b.id), "a scan of our own files says nothing about a directory").toEqual([]);
  });

  it("does not rest a state on `rendered` alone where an authoritative surface was available", () => {
    const rendered = doc.directories.filter((r: { surface: string }) => r.surface === "rendered");
    for (const r of rendered) {
      expect(["UNKNOWN", "NOT_LISTED"], `${r.id}: rendered may not assert LISTED`).toContain(r.state);
    }
  });

  it("totals are consistent with the rows, not typed alongside them", () => {
    expect(doc.totals.directories_probed).toBe(doc.directories.length);
    expect(doc.totals.real_directories).toBe(
      doc.directories.filter((r: { state: string }) => r.state !== "NOT_A_DIRECTORY").length,
    );
    expect(doc.totals.listed).toBe(
      doc.directories.filter((r: { state: string }) => r.state === "LISTED").length,
    );
  });

  it("a row that is blocked names what blocks it", () => {
    for (const r of doc.directories) {
      if (r.state === "NOT_LISTED" && r.submission) {
        expect(r.blocked_by, `${r.id} is submittable and unsubmitted with no blocker named`).toBeTruthy();
      }
    }
  });
});

// ---------------------------------------------------------------------------
// WHY THIS EXISTS. a2aregistry.org registers an agent by FETCHING our published
// card and validating it server-side. Nobody here sees that validation run, so a
// later edit to the card could make us unregistrable and this repo would carry no
// signal at all. These are a2aregistry's own rules, read out of
// backend/app/validators.py (_validate_manual, _validate_skills, _check_url_scheme)
// and its v1.0 compatibility path in the same file, re-run against the card we
// actually serve. If this fails, registration would be REJECTED — fix the card.
// ---------------------------------------------------------------------------
describe("the served agent card passes a2aregistry's validation", () => {
  // their v1.0 compat: url and protocolVersion are lifted from supportedInterfaces[0]
  const normalised: Record<string, unknown> = { ...card };
  if (!("url" in normalised)) {
    for (const key of ["interfaces", "supportedInterfaces"]) {
      const ifaces = normalised[key] as Array<Record<string, unknown>> | undefined;
      if (Array.isArray(ifaces) && ifaces.length > 0) {
        if ("url" in ifaces[0]) normalised.url = ifaces[0].url;
        if (!("protocolVersion" in normalised) && "protocolVersion" in ifaces[0]) {
          normalised.protocolVersion = ifaces[0].protocolVersion;
        }
        break;
      }
    }
  }

  it("carries every field their strict path requires", () => {
    const required = [
      "name", "description", "url", "version",
      "capabilities", "defaultInputModes", "defaultOutputModes", "skills",
    ];
    const missing = required.filter((f) => !(f in normalised));
    expect(missing, "a2aregistry would reject the card for these").toEqual([]);
  });

  it("resolves a url and a protocolVersion out of supportedInterfaces", () => {
    // the card itself must NOT carry these at the top level: A2A v1.0.1 has no such fields
    expect(card.url, "v1.0.1 AgentCard has no top-level url").toBeUndefined();
    expect(card.protocolVersion, "v1.0.1 AgentCard has no top-level protocolVersion").toBeUndefined();
    expect(String(normalised.url)).toMatch(/^https:\/\//);
    expect(normalised.protocolVersion).toBeTruthy();
  });

  it("declares all three REQUIRED AgentInterface fields on every interface", () => {
    // A2A v1.0.1 specification/a2a.proto: url, protocol_binding, protocol_version are REQUIRED
    const ifaces = card.supportedInterfaces as Array<Record<string, unknown>>;
    expect(Array.isArray(ifaces) && ifaces.length > 0).toBe(true);
    for (const [i, iface] of ifaces.entries()) {
      for (const f of ["url", "protocolBinding", "protocolVersion"]) {
        expect(iface[f], `supportedInterfaces[${i}] missing REQUIRED ${f}`).toBeTruthy();
      }
      expect(String(iface.url)).toMatch(/^https:\/\//);
    }
  });

  it("every skill carries the id, name and description their skill check requires", () => {
    const defects: string[] = [];
    for (const [i, s] of (card.skills as Array<Record<string, unknown>>).entries()) {
      for (const f of ["id", "name", "description"]) {
        if (!(f in s)) defects.push(`skill[${i}] missing ${f}`);
        else if (typeof s[f] !== "string" || !String(s[f]).trim()) defects.push(`skill[${i}].${f} empty`);
      }
    }
    expect(defects).toEqual([]);
  });

  it("the census records the interface the card actually names", () => {
    const iface = (card.supportedInterfaces as Array<Record<string, unknown>>)[0];
    expect(doc.our_agent.interface).toBe(iface.url);
    expect(doc.our_agent.a2a_version).toBe(iface.protocolVersion);
    expect(doc.our_agent.skills).toBe((card.skills as unknown[]).length);
  });
});

// ---------------------------------------------------------------------------
// WHY THIS EXISTS. On 2026-09-05 this file published NOT_LISTED for a registry we
// had been listed in since 2026-08-19, healthy and conformant. The cause was one
// act: GET /api/agents was read as the population when it is a PAGE. The very same
// JSON carried `total: 370` beside `limit: 50`. Four separate published numbers were
// wrong from that one read. A count is not a measurement until it is compared with
// the source's own declared total — rule R5, and memory's
// partial-read-totalled-as-population.
// ---------------------------------------------------------------------------
describe("a census may not conclude from a page", () => {
  it("records the index's own declared total and what was actually scanned", () => {
    const t = doc.totals;
    expect(t.index_declared_total, "the source's own total must be recorded").toBeGreaterThan(0);
    expect(t.agents_scanned, "what was scanned must be recorded").toBeGreaterThan(0);
  });

  it("scanned the whole index before drawing any conclusion from absence", () => {
    const t = doc.totals;
    expect(t.agents_scanned, "scanned fewer than the index declares: no absence claim is valid")
      .toBe(t.index_declared_total);
  });

  it("never lets a page size stand in for a population", () => {
    const t = doc.totals;
    if (t.page_size && t.agents_scanned > t.page_size) {
      expect(t.pages_fetched, "more than one page of data requires more than one page fetched")
        .toBeGreaterThan(1);
      expect(t.pages_fetched).toBe(Math.ceil(t.index_declared_total / t.page_size));
    }
  });

  it("a NOT_LISTED row must name a full scan, not a sample", () => {
    for (const r of doc.directories) {
      if (r.state !== "NOT_LISTED") continue;
      expect(doc.totals.agents_scanned, `${r.id}: NOT_LISTED asserted without a full scan`)
        .toBe(doc.totals.index_declared_total);
    }
  });
});
