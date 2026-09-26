/**
 * /verify-server's logic and rendering, against the REAL published tree (public/measurement-capsules,
 * the board-signed index of 2026-09-26) served from disk through a stubbed fetch — the same bytes a
 * deploy serves — plus the synthetic layout fixture for the split-batch case.
 */
import { afterEach, describe, expect, it, vi } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { Router } from "wouter";
import { lookupServer, normaliseEndpoint, verifyCapsuleText, LOOKUP_MEANING } from "./serverLookup";
import { EvidenceView } from "../pages/VerifyServer";

vi.setConfig({ testTimeout: 120_000 });
const PUBLIC = resolve(__dirname, "../../../public");
const ORIGIN = "https://councilof.ai";
afterEach(() => vi.unstubAllGlobals());

function serveDisk() {
  vi.stubGlobal("fetch", async (input: string | URL | Request) => {
    const path = new URL(typeof input === "string" ? input : input instanceof URL ? input.href : input.url).pathname;
    const file = join(PUBLIC, path);
    return path.startsWith("/measurement-capsules/") && existsSync(file)
      ? new Response(readFileSync(file))
      : new Response("<!doctype html><title>shell</title>", { status: 404 });
  });
}

describe("lookup: per server, not totals", () => {
  it("an unknown URL is NOT_MEASURED — an empty list, never an error and never 'clean'", async () => {
    serveDisk();
    const r = await lookupServer(ORIGIN, "https://never-measured.example/mcp");
    expect(r.state).toBe("NOT_MEASURED");
    expect(r.capsules).toEqual([]);
    expect(r.key).toMatch(/^[0-9a-f]{64}$/);
    const html = renderToStaticMarkup(<Router ssrPath="/verify-server"><EvidenceView result={r} /></Router>);
    expect(html).toContain("NOT_MEASURED");
    expect(html).toContain(LOOKUP_MEANING.NOT_MEASURED.split(":")[0]);
    expect(html).not.toMatch(/\b(score|grade|rating|trusted|safe to use)\b/i);
  });

  it("a known endpoint: its capsules render, each with state, observed_at, batch root and a verify button", async () => {
    serveDisk();
    const r = await lookupServer(ORIGIN, "https://councilof.ai/mcp");
    expect(r.state).toBe("MEASURED");
    expect(r.capsules.length).toBeGreaterThan(0);
    const html = renderToStaticMarkup(<Router ssrPath="/verify-server"><EvidenceView result={r} /></Router>);
    for (const c of r.capsules) {
      expect(html).toContain(c.capsule_id);
      expect(html).toContain(c.batch.merkle_root);
      expect(html).toContain(String(c.measurement_state));
      expect(html).toContain(String(c.observed_at));
    }
    expect(html.match(/data-testid="verify-capsule"/g)?.length).toBe(r.capsules.length);
    expect(html).toContain("Declared vs observed");
  });

  it("URL normalisation: host case, trailing slash, default port and fragment do not change the key; the query does", async () => {
    serveDisk();
    const base = await lookupServer(ORIGIN, "https://councilof.ai/mcp");
    for (const v of ["https://COUNCILOF.AI/mcp", "https://councilof.ai/mcp/", "https://councilof.ai:443/mcp", "  https://councilof.ai/mcp#x  "]) {
      const r = await lookupServer(ORIGIN, v);
      expect(r.endpoint, v).toBe("https://councilof.ai/mcp");
      expect(r.key, v).toBe(base.key);
      expect(r.capsules.length, v).toBe(base.capsules.length);
    }
    expect(normaliseEndpoint("https://councilof.ai/mcp?x=1")).toBe("https://councilof.ai/mcp?x=1");
    expect(normaliseEndpoint("https://councilof.ai/MCP")).toBe("https://councilof.ai/MCP"); // the path's case is kept
    expect(normaliseEndpoint("ftp://councilof.ai/mcp")).toBeNull();
    expect((await lookupServer(ORIGIN, "not a url")).state).toBe("NOT_MEASURED");
  });
});

describe("verify this capsule: re-derived in the page's own code path", () => {
  it("a published capsule PASSes: id recomputes, inclusion folds to the batch root, the index signature verifies", async () => {
    serveDisk();
    const r = await lookupServer(ORIGIN, "https://councilof.ai/mcp");
    const c = r.capsules[0];
    const v = await verifyCapsuleText(ORIGIN, c.capsule_json!, c.capsule_id);
    expect(v.outcome).toBe("PASS");
    expect(v.state).toBe("INCLUDED");
    expect(v.recomputed_id).toBe(c.capsule_id);
    expect(v.recomputed_root).toBe(c.batch.merkle_root);
    expect(v.signature).toBe("VERIFIES");
  });

  it("a tampered capsule FAILs — changed bytes under the old id, and changed bytes with a re-sealed id", async () => {
    serveDisk();
    const r = await lookupServer(ORIGIN, "https://councilof.ai/mcp");
    const c = r.capsules[0];
    const tampered = c.capsule_json!.replace(`"measurement_state":"${c.measurement_state}"`, '"measurement_state":"INCONSISTENT"');
    expect(tampered).not.toBe(c.capsule_json);
    const v1 = await verifyCapsuleText(ORIGIN, tampered, c.capsule_id);
    expect(v1.outcome).toBe("FAIL");
    // Without the listing's id: the capsule's own id no longer recomputes.
    const v2 = await verifyCapsuleText(ORIGIN, tampered);
    expect(v2.outcome).toBe("FAIL");
    expect(v2.state).toBe("ID_MISMATCH");
    // Re-sealed: a forger recomputes capsule_id — it is then simply not in any published batch.
    const { parseLexical, recomputeCapsuleId } = await import("../../../functions/_lib/measurementCapsule");
    const resealedId = await recomputeCapsuleId(parseLexical(tampered));
    const resealed = tampered.replace(c.capsule_id, resealedId);
    const v3 = await verifyCapsuleText(ORIGIN, resealed);
    expect(v3.outcome).toBe("FAIL");
    expect(v3.state).toBe("NOT_INCLUDED");
  });

  it("nothing published: UNCHECKABLE, never FAIL (could-not-check is a different claim)", async () => {
    vi.stubGlobal("fetch", async () => new Response("<!doctype html>", { status: 404 }));
    const line = '{"schema":"csoai.measurement-capsule/0.2","kind":"measurement.contract_parity"}';
    const v = await verifyCapsuleText(ORIGIN, line);
    expect(v.outcome).toBe("UNCHECKABLE");
    expect(v.state).toBe("NOT_PUBLISHED");
  });
});
