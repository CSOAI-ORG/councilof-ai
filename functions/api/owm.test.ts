/**
 * GET /api/owm over the COMMITTED public/owm/v0.1/latest.json, through a mocked ASSETS binding that serves
 * public/ from disk (the reach and claim-events suites' pattern). The door serves the snapshot only when every
 * typed count and stage status re-derives from its rows; any mismatch is a 503, never a partial snapshot.
 */
import { afterEach, describe, expect, it, vi } from "vitest";
import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { onRequestGet } from "./owm";
import { deriveStageStatus, STATES, validateSnapshot } from "../_lib/owm";

const REPO = resolve(__dirname, "../..");
const FILE = join(REPO, "public/owm/v0.1/latest.json");
const BYTES = readFileSync(FILE);
const SNAP = JSON.parse(BYTES.toString());

const assets = (override?: string) => ({
  fetch: async (req: Request | string) => {
    const path = new URL(typeof req === "string" ? req : req.url).pathname;
    if (override !== undefined && path === "/owm/v0.1/latest.json") return new Response(override, { status: 200 });
    const f = join(REPO, "public", decodeURIComponent(path));
    return existsSync(f) ? new Response(readFileSync(f), { status: 200 }) : new Response("<!doctype html><title>SPA</title>", { status: 200 });
  },
});
const ctx = (path: string, override?: string) => ({ request: new Request(`https://councilof.ai${path}`), env: { ASSETS: assets(override) } });
const mutate = (fn: (s: any) => void) => {
  const s = JSON.parse(BYTES.toString());
  fn(s);
  return JSON.stringify(s, null, 1);
};

afterEach(() => vi.useRealTimers());

describe("GET /api/owm", () => {
  it("serves the committed snapshot with its bytes digest, when every count re-derives", async () => {
    const r = await onRequestGet(ctx("/api/owm"));
    expect(r.status).toBe(200);
    const body = await r.json();
    const sha = createHash("sha256").update(BYTES).digest("hex");
    expect(r.headers.get("x-owm-bytes-sha256")).toBe(sha);
    expect(body.served.bytes_sha256).toBe(sha);
    expect(body.schema).toBe("csoai.owm-snapshot/0.1");
    expect(body.subjects.length).toBe(SNAP.subjects.length);
    expect(body.signature.state).toBe("UNSIGNED");
  });

  it("the committed snapshot lists own surfaces as subjects and covers all nine stages", () => {
    const own = SNAP.subjects.filter((s: any) => s.kind === "own_surface").map((s: any) => s.id);
    expect(own).toEqual(expect.arrayContaining(["own:public-root", "own:board-totals", "own:owm"]));
    expect(SNAP.stages.map((s: any) => s.stage)).toEqual([
      "capture", "observation_store", "change_detection", "dependency_index", "recheck", "state", "sign", "capsule", "land",
    ]);
    for (const s of SNAP.subjects) {
      expect(STATES).toContain(s.state);
      expect(s).toHaveProperty("last_change");
      expect(s).toHaveProperty("next_check");
      expect(s).toHaveProperty("evidence_sha256");
    }
  });

  it("says CURRENT inside stale_after_s and STALE after it — the committed snapshot is not a live read", async () => {
    vi.useFakeTimers();
    const t0 = Date.parse(SNAP.generated_at);
    vi.setSystemTime(t0 + 60_000);
    expect((await (await onRequestGet(ctx("/api/owm"))).json()).served.state).toBe("CURRENT");
    vi.setSystemTime(t0 + (SNAP.stale_after_s + 1) * 1000);
    const late = (await (await onRequestGet(ctx("/api/owm"))).json()).served;
    expect(late.state).toBe("STALE");
    expect(late.age_s).toBe(SNAP.stale_after_s + 1);
  });

  it("refuses a typed state count that the rows do not derive (503, naming the check)", async () => {
    const r = await onRequestGet(ctx("/api/owm", mutate((s) => { s.counts.by_state.CONSISTENT += 1; })));
    expect(r.status).toBe(503);
    const b = await r.json();
    expect(b.state).toBe("UNMEASURED");
    expect(b.checks.find((c: any) => c.check === "counts_by_state").ok).toBe(false);
  });

  it("refuses a stage status its components do not derive", async () => {
    const r = await onRequestGet(ctx("/api/owm", mutate((s) => {
      const st = s.stages.find((x: any) => x.stage === "state");
      st.components = st.components.map((c: any) => ({ ...c, status: "STALE" }));
    })));
    expect(r.status).toBe(503);
    expect((await r.json()).reason).toMatch(/stage_status: state: typed LIVE, components derive STAGED/);
  });

  it("refuses a state outside the enum, and an observed state with no evidence digest", async () => {
    const a = await onRequestGet(ctx("/api/owm", mutate((s) => { s.subjects[0].state = "GREEN"; })));
    expect(a.status).toBe(503);
    const b = await onRequestGet(ctx("/api/owm", mutate((s) => {
      const row = s.subjects.find((x: any) => x.state === "CONSISTENT" || x.state === "SINGLE_SURFACE");
      row.evidence_sha256 = null;
    })));
    expect(b.status).toBe(503);
    expect((await b.json()).reason).toMatch(/with no evidence digest/);
  });

  it("refuses a snapshot that claims a signature (no verification path for this kind)", async () => {
    const r = await onRequestGet(ctx("/api/owm", mutate((s) => { s.signature = { state: "VALID" }; })));
    expect(r.status).toBe(503);
  });

  it("refuses a public view that leaks a host path", async () => {
    const r = await onRequestGet(ctx("/api/owm", mutate((s) => { s.subjects[0].reason = "read /evac-bulk/x/y.json"; })));
    expect(r.status).toBe(503);
    expect((await r.json()).reason).toMatch(/host_paths/);
  });

  it("a missing file (the SPA fallback answers HTML with 200) is a 503, not a snapshot", async () => {
    const r = await onRequestGet(ctx("/api/owm", "<!doctype html><title>SPA</title>"));
    expect(r.status).toBe(503);
  });

  it("?subject= returns one row, and 404 for an id the snapshot does not carry", async () => {
    const id = SNAP.subjects[0].id;
    const r = await onRequestGet(ctx(`/api/owm?subject=${encodeURIComponent(id)}`));
    expect(r.status).toBe(200);
    expect((await r.json()).subject.id).toBe(id);
    const n = await onRequestGet(ctx("/api/owm?subject=nope"));
    expect(n.status).toBe(404);
  });

  it("the stage rule matches the producer: LIVE if any component is LIVE; STAGED if built but not producing", () => {
    expect(deriveStageStatus([{ status: "STALE" }, { status: "LIVE" }])).toBe("LIVE");
    expect(deriveStageStatus([{ status: "OFF" }, { status: "MISSING" }])).toBe("STAGED");
    expect(deriveStageStatus([{ status: "MISSING" }])).toBe("MISSING");
    expect(validateSnapshot(BYTES.toString()).checks.every((c) => c.ok)).toBe(true);
  });
});
