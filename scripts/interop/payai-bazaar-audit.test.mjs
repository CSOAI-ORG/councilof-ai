import { describe, expect, it } from "vitest";
import { execFileSync } from "node:child_process";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

/**
 * The population guard on the PayAI Bazaar audit.
 *
 * The index holds 28,230 resources and pages at 1000. Asking it once and counting our hits gives
 * a true statement about the FIRST PAGE, and it reads exactly like a statement about the Bazaar —
 * "we appear once". That is the estate's partial-read-totalled-as-population defect, and it has
 * already published a NOT_LISTED for a registry we had been in for weeks.
 *
 * So `scan()` must refuse rather than under-report: an absence is only a claim when the number
 * scanned reaches the index's own declared total.
 */
const SCRIPT = resolve(import.meta.dirname, "payai-bazaar-audit.py");

function run(sourceUrl) {
  try {
    const out = execFileSync("python3", [SCRIPT, "--json", "--source", sourceUrl],
      { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
    return { code: 0, out };
  } catch (e) {
    return { code: e.status, err: String(e.stderr ?? "") };
  }
}

const dir = mkdtempSync(join(tmpdir(), "bazaar-"));
const fixture = (name, body) => {
  const p = join(dir, name);
  writeFileSync(p, JSON.stringify(body));
  return `file://${p}`;
};

describe("the Bazaar audit refuses to turn a partial read into a population", () => {
  it("refuses when the pages never reach the index's own declared total", () => {
    // Two items, but the index says there are 5000. Reporting "ours: 0" here would be a lie
    // dressed as a measurement.
    const src = fixture("short.json", {
      items: [{ resource: "https://example.com/a" }, { resource: "https://example.com/b" }],
      pagination: { limit: 1000, offset: 0, total: 5000 },
    });
    const r = run(src);
    expect(r.code, "a short read must not exit 0").toBe(2);
    expect(r.err).toMatch(/UNCHECKABLE/);
    expect(r.err, "the refusal must name both numbers").toMatch(/of a declared 5000/);
  });

  it("refuses when the index declares no total at all", () => {
    const src = fixture("nototal.json", { items: [{ resource: "https://example.com/a" }], pagination: {} });
    const r = run(src);
    expect(r.code).toBe(2);
    expect(r.err).toMatch(/declared no pagination.total/);
  });

  it("reports when the scan is complete, and finds us by host", () => {
    const src = fixture("full.json", {
      items: [
        { resource: "https://example.com/a" },
        { resource: "https://councilof.ai/api/free-door", x402Version: 2, lastUpdated: "2026-09-05T03:27:26.273Z",
          description: "x".repeat(120), serviceName: null, tags: null,
          accepts: [{ amount: "0", maxTimeoutSeconds: 900 }] },
      ],
      pagination: { limit: 1000, offset: 0, total: 2 },
    });
    const r = run(src);
    expect(r.code).toBe(0);
    const d = JSON.parse(r.out);
    expect(d.population_complete).toBe(true);
    expect(d.scanned).toBe(2);
    expect(d.ours).toHaveLength(1);
    expect(d.ours[0].resource).toBe("https://councilof.ai/api/free-door");
    expect(d.ours[0].description_chars).toBe(120);
  });

  it("an empty result is a claim only because the scan was complete", () => {
    const src = fixture("none.json", {
      items: [{ resource: "https://example.com/a" }],
      pagination: { limit: 1000, offset: 0, total: 1 },
    });
    const r = run(src);
    expect(r.code).toBe(0);
    const d = JSON.parse(r.out);
    expect(d.population_complete).toBe(true);
    expect(d.ours).toEqual([]);
  });
});
