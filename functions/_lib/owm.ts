/**
 * Outer world model (OWM) snapshot: validation shared by GET /api/owm and its tests.
 *
 * The snapshot is produced once per cycle by fleet/owm/owm.py on the scheduler host and reaches the site only
 * through the gated land path, as public/owm/v0.1/latest.json. It is a NEW kind and is UNSIGNED: the board
 * signer is used only for kinds that already sign. So this door does not vouch for a signature; it re-derives
 * every count and every stage status from the snapshot's own rows and refuses (503) any snapshot whose typed
 * totals, enums or evidence digests do not hold. It never serves a partial snapshot.
 */

export const OWM_SCHEMA = "csoai.owm-snapshot/0.1";
export const OWM_PATH = "/owm/v0.1/latest.json";
export const STATES = ["CONSISTENT", "INCONSISTENT", "SINGLE_SURFACE", "UNCHECKABLE", "UNMEASURED"] as const;
export const STAGE_STATUSES = ["LIVE", "STAGED", "MISSING"] as const;
const COMPONENT_STATUSES = ["LIVE", "STALE", "FAILING", "OFF", "STAGED", "MISSING"];
const HEX64 = /^[0-9a-f]{64}$/;
/** A public view carries labels, never a host path or a login. */
const HOST_LEAK = /\/evac-bulk\/|\/home\/[a-z]|\/root\/|\/workspace\/|ubuntu@|root@/;

export type Check = { check: string; ok: boolean; detail: string };
export type Ctx = { request: Request; env: { ASSETS?: { fetch: (r: Request | string) => Promise<Response> } } };

type Component = { label?: string; status?: string };
type Stage = { stage?: string; status?: string; components?: Component[] };
type Subject = { id?: string; state?: string; evidence_sha256?: string | null; next_check?: string | null; last_change?: string | null };
export type Snapshot = {
  schema?: string;
  generated_at?: string;
  stale_after_s?: number;
  counts?: { subjects?: number; by_state?: Record<string, number>; stages?: number; by_stage_status?: Record<string, number> };
  stages?: Stage[];
  subjects?: Subject[];
  signature?: { state?: string };
  [k: string]: unknown;
};

const isIso = (s: unknown) => typeof s === "string" && /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\dZ$/.test(s) && !Number.isNaN(Date.parse(s));

/** The stage rule, the same as owm.py: LIVE if any component is LIVE; STAGED if any is built but not producing. */
export function deriveStageStatus(components: Component[]): string {
  const st = components.map((c) => c.status);
  if (st.includes("LIVE")) return "LIVE";
  if (st.some((s) => s === "STALE" || s === "FAILING" || s === "OFF" || s === "STAGED")) return "STAGED";
  return "MISSING";
}

export function validateSnapshot(raw: string): { snapshot: Snapshot | null; checks: Check[] } {
  const checks: Check[] = [];
  const add = (check: string, ok: boolean, detail: string) => checks.push({ check, ok, detail });
  let s: Snapshot;
  try {
    s = JSON.parse(raw);
  } catch (e) {
    add("parse", false, `not JSON: ${(e as Error).message.slice(0, 80)}`);
    return { snapshot: null, checks };
  }
  add("parse", true, "JSON");
  add("schema", s.schema === OWM_SCHEMA, `schema=${String(s.schema)}`);
  add("generated_at", isIso(s.generated_at), `generated_at=${String(s.generated_at)}`);
  add("stale_after_s", typeof s.stale_after_s === "number" && s.stale_after_s > 0, `stale_after_s=${String(s.stale_after_s)}`);
  add("host_paths", !HOST_LEAK.test(raw), HOST_LEAK.test(raw) ? "a host path or login is in the public view" : "none");
  add("signature", s.signature?.state === "UNSIGNED",
    s.signature?.state === "UNSIGNED" ? "UNSIGNED (new kind; declared, not inferred)" :
      `signature.state=${String(s.signature?.state)}: this door has no verification path for a signed snapshot`);

  const subjects = Array.isArray(s.subjects) ? s.subjects : null;
  add("subjects", !!subjects && subjects.length > 0, subjects ? `${subjects.length} rows` : "missing");
  const derivedStates: Record<string, number> = Object.fromEntries(STATES.map((k) => [k, 0]));
  if (subjects) {
    const ids = new Set<string>();
    const bad: string[] = [];
    for (const r of subjects) {
      const id = String(r.id);
      if (!r.id || ids.has(id)) bad.push(`${id}: missing or duplicate id`);
      ids.add(id);
      if (!STATES.includes(r.state as (typeof STATES)[number])) {
        bad.push(`${id}: state ${String(r.state)} not in the enum`);
        continue;
      }
      derivedStates[r.state as string]++;
      const ev = r.evidence_sha256;
      if (ev !== null && ev !== undefined && !HEX64.test(ev)) bad.push(`${id}: evidence_sha256 is not a sha256`);
      const observed = r.state === "CONSISTENT" || r.state === "INCONSISTENT" || r.state === "SINGLE_SURFACE";
      if (observed && !ev) bad.push(`${id}: ${r.state} with no evidence digest`);
      if (r.next_check !== null && r.next_check !== undefined && !isIso(r.next_check)) bad.push(`${id}: next_check not ISO`);
      if (r.last_change !== null && r.last_change !== undefined && !isIso(r.last_change)) bad.push(`${id}: last_change not ISO`);
    }
    add("subject_rows", bad.length === 0, bad.length ? bad.slice(0, 5).join("; ") : "every row carries an enum state, and every observed state a sha256");
  }
  const stages = Array.isArray(s.stages) ? s.stages : null;
  add("stages", !!stages && stages.length > 0, stages ? `${stages.length} stages` : "missing");
  const derivedStages: Record<string, number> = Object.fromEntries(STAGE_STATUSES.map((k) => [k, 0]));
  if (stages) {
    const bad: string[] = [];
    for (const st of stages) {
      const comps = Array.isArray(st.components) ? st.components : [];
      if (comps.some((c) => !COMPONENT_STATUSES.includes(String(c.status)))) bad.push(`${st.stage}: a component status is not in the enum`);
      const want = deriveStageStatus(comps);
      if (st.status !== want) bad.push(`${st.stage}: typed ${String(st.status)}, components derive ${want}`);
      if (STAGE_STATUSES.includes(st.status as (typeof STAGE_STATUSES)[number])) derivedStages[st.status as string]++;
    }
    add("stage_status", bad.length === 0, bad.length ? bad.join("; ") : "every stage status re-derives from its components");
  }
  const c = s.counts ?? {};
  const eq = (a: Record<string, number> | undefined, b: Record<string, number>) =>
    !!a && Object.keys(b).every((k) => a[k] === b[k]) && Object.keys(a).every((k) => k in b);
  add("counts_by_state", eq(c.by_state, derivedStates) && c.subjects === (subjects?.length ?? -1),
    `typed ${JSON.stringify(c.by_state)} n=${String(c.subjects)}; derived ${JSON.stringify(derivedStates)} n=${subjects?.length ?? 0}`);
  add("counts_by_stage", eq(c.by_stage_status, derivedStages) && c.stages === (stages?.length ?? -1),
    `typed ${JSON.stringify(c.by_stage_status)}; derived ${JSON.stringify(derivedStages)}`);
  return { snapshot: s, checks };
}

export async function sha256Hex(bytes: ArrayBuffer): Promise<string> {
  const d = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(d)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export function unavailable(reason: string, checks: Check[] = []): Response {
  return new Response(
    JSON.stringify({ schema: OWM_SCHEMA, state: "UNMEASURED", error: "snapshot_unavailable", reason, checks, raw: OWM_PATH }, null, 2),
    {
      status: 503,
      headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store", "access-control-allow-origin": "*" },
    },
  );
}
