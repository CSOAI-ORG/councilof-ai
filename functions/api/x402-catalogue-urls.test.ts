import { describe, expect, it } from "vitest";
import { onRequestGet } from "./x402";

/**
 * Every URL the catalogue publishes must name the kind of value its handler actually reads.
 *
 * B05 in the lane backlog asks that the free preview be non-empty for every SKU. Measured live
 * 2026-09-05, one was not: `free_preview` for the evidence-bundle entry read
 * `?obligation=<id>&subject=<s>` and answered **404 unknown_obligation**, because `<id>` means a
 * MODEL id on the request-attestation entry ten lines above and an OBLIGATION id here. The same
 * ambiguity had already cost a 404 in /.well-known/x402.json earlier the same day.
 *
 * This reads the catalogue from the Function, so an entry added there is covered the moment it is
 * added. It asserts the SHAPE of the published URL — no network — because the failure mode is a
 * placeholder naming the wrong kind of value, and that is visible in the string itself.
 */
const catalogue = async () => {
  const r = (await (onRequestGet as unknown as (c: unknown) => Promise<Response>)({
    request: new Request("https://councilof.ai/api/x402"),
    env: {},
  })) as Response;
  return (await r.json()) as { resources: { id: string; resource?: string; free_preview?: string }[] };
};

describe("/api/x402 publishes URLs a buyer can actually use", () => {
  it("gives every entry a resource and a free_preview that are URLs and nothing else", async () => {
    const { resources } = await catalogue();
    expect(resources.length).toBeGreaterThanOrEqual(6);
    for (const t of resources) {
      for (const [field, v] of [["resource", t.resource], ["free_preview", t.free_preview]] as const) {
        if (!v) continue;
        expect(v.startsWith("https://"), `${t.id}.${field} must be a bare URL: ${v}`).toBe(true);
        // a URL concatenated with English prose is the defect this file's header records
        expect(v, `${t.id}.${field} carries prose`).not.toMatch(/\s—\s|\s\(the\s/);
      }
    }
  });

  it("never uses the bare <id> placeholder where the handler wants an obligation", async () => {
    const { resources } = await catalogue();
    const eb = resources.find((t) => (t.resource ?? "").includes("/api/evidence-bundle"));
    expect(eb).toBeTruthy();
    // `<id>` is a MODEL id elsewhere in this same document — naming it here 404s.
    expect(eb!.free_preview ?? "").not.toMatch(/obligation=<id>/);
    expect(eb!.free_preview ?? "").toMatch(/obligation=<[^>]*dora[^>]*>/);
  });

  it("names a concrete kind for every placeholder it publishes", async () => {
    const { resources } = await catalogue();
    const vague = new Set(["<id>", "<s>", "<x>", "<value>"]);
    const found: string[] = [];
    for (const t of resources) {
      for (const v of [t.resource, t.free_preview]) {
        for (const m of (v ?? "").matchAll(/<[^>]+>/g)) {
          if (vague.has(m[0]) && !/subject=<id>/.test(v ?? "")) found.push(`${t.id}: ${m[0]} in ${v}`);
        }
      }
    }
    expect(found, `\n  ${found.join("\n  ")}\n`).toEqual([]);
  });
});
