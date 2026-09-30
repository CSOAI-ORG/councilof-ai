/**
 * GSPC Route doctrine tests. Each was proved to FAIL against a planted violation before it was
 * trusted (lane gspc-route-20260930; the plants and their red runs are in services/gspc-router/PROOF.md).
 *
 *  - wording: a router output never contains best / safest / recommended / compliant / certified, and
 *    never "leader" unless the comparison was SEPARATED (leaderLabel.ts is the only writer of the label);
 *  - money: no sponsor / bid / paid-placement field can change a route decision;
 *  - policy: forbid beats permit; anything not understood grants nothing (openshell-cedar rule);
 *  - record: event_id is the JCS id event.py computes; no task bytes; UNMEASURED carries no number.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { route, routeSummary, BANNED_ROUTE_WORDS, type RouteResult } from "./route";
import { computeEventId, jcs } from "./evidence";
import { callerPolicy, CEDAR_SCHEMA, FLOOR_CEDAR, presetCedar, PRESETS, evaluate } from "./policy";
import { COMMERCIAL_FIELDS, normaliseCandidate, fleetCandidates, checkEndpoint } from "./candidates";
import { SEPARATED_LEADER_LABEL, TOP_OBSERVED_LABEL } from "../leaderLabel";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..", "..", "..");
const GOLD = join(ROOT, "fixtures", "route-golden");
const BOARD = JSON.parse(readFileSync(join(GOLD, "board-2026-09-30.json"), "utf8"));
const CASES = JSON.parse(readFileSync(join(GOLD, "cases.json"), "utf8"));

type Args = Record<string, unknown>;

function boardFor(kind: string | null): () => Promise<unknown> {
  if (kind === "unreachable") return async () => { throw new Error("HTTP 503"); };
  if (kind === "planted-separated") {
    const b = structuredClone(BOARD);
    for (const r of b.axes) if (r.axis === "governance") r.separation = "SEPARATED";
    return async () => b;
  }
  return async () => BOARD;
}

const fixed = { now: () => new Date(CASES.read_at), uuid: () => CASES.uuid as string };
const run = (args: Args, board: string | null = "recorded") => route(args, { fetchBoard: boardFor(board), ...fixed });

/** Everything the router wrote, minus the ids the caller chose (those are echoed as given). */
function routerText(r: RouteResult): string {
  const callerIds = new Set<string>();
  const rec = r.record as Record<string, any> | undefined;
  for (const c of rec?.observed?.considered ?? []) callerIds.add(c.id);
  let s = `${routeSummary(r)}\n${JSON.stringify(r)}`;
  for (const id of callerIds) s = s.split(id).join("<id>");
  return s;
}

const TIE_ARGS: Args = CASES.cases[0].args;

describe("wording: routing is not ranking", () => {
  it("a TIE comparison never says best, safest, recommended, compliant, certified or leader", async () => {
    const r = await run(TIE_ARGS);
    expect(r.state).toBe("ROUTED");
    expect(r.separation).toBe("TIE");
    const text = routerText(r);
    expect(text).not.toMatch(BANNED_ROUTE_WORDS);
    expect(text.toLowerCase()).not.toContain("leader");
    expect((r.chosen as { choice_basis: string }).choice_basis).toMatch(/^tie_break:/);
    expect(r.label).toBe(TOP_OBSERVED_LABEL);
  });

  it("an UNTESTED comparison (board unreachable) says neither leader nor best", async () => {
    const r = await run(TIE_ARGS, "unreachable");
    expect(r.separation).toBe("UNTESTED");
    const text = routerText(r);
    expect(text).not.toMatch(BANNED_ROUTE_WORDS);
    expect(text.toLowerCase()).not.toContain("leader");
  });

  it("a separated board row forbidden by policy does not make the choice separated", async () => {
    const args = structuredClone(TIE_ARGS) as Args;
    (args as any).policy = { forbid_providers: ["ollama"] }; // the separated top row is an ollama model
    const r = await run(args, "planted-separated");
    expect(r.separation).not.toBe("SEPARATED");
    expect(routerText(r).toLowerCase()).not.toContain("leader");
  });

  it("only a SEPARATED comparison may be named, and only by leaderLabel", async () => {
    const r = await run(CASES.cases[1].args, "planted-separated");
    expect(r.separation).toBe("SEPARATED");
    expect(r.label).toBe(SEPARATED_LEADER_LABEL);
    expect((r.chosen as any).choice_basis).toBe("separated_leader:governance");
    expect((r.chosen as any).id).toBe("local:mistral-7b");
    expect(routerText(r)).not.toMatch(BANNED_ROUTE_WORDS);
  });

  it("a missing measurement is UNTESTED with no number, never 0", async () => {
    const r = await run(TIE_ARGS);
    const c = (r.record as any).observed.considered.find((x: any) => x.id === "local:llama3.2-3b");
    expect(c.measurements[0]).toMatchObject({ axis: "governance", state: "UNTESTED", value: null });
  });

  it("the caller's tie_break decides a TIE and is recorded", async () => {
    const local = await run(TIE_ARGS);
    expect((local.chosen as any).choice_basis).toBe("tie_break:local_first>cheapest_declared");
    expect((local.chosen as any).id).toBe("local:llama3.2-3b"); // local, declared cost 0
    const args = structuredClone(TIE_ARGS) as any;
    args.objective.tie_break = ["lexical_id"];
    const lex = await run(args);
    expect((lex.chosen as any).id).toBe("byok:deepseek-r1-8b");
    expect((lex.record as any).declared.objective.tie_break).toEqual(["lexical_id"]);
  });
});

describe("money: no sponsor or paid field can change a route decision", () => {
  const decisionOf = (r: RouteResult) => ({
    state: r.state,
    chosen: r.chosen,
    separation: r.separation,
    permitted: (r.record as any)?.observed?.permitted,
    forbidden: r.forbidden,
  });
  const values = [true, 1, 1e9, "vendor", { tier: "gold" }, ["a"]];

  for (const c of CASES.cases as Array<{ name: string; board: string | null; args: Args }>) {
    it(`${c.name}: decision is invariant to every commercial field on every candidate`, async () => {
      const base = decisionOf(await run(c.args, c.board));
      const cands = (c.args.candidates as Args[] | undefined) ?? [];
      for (const field of COMMERCIAL_FIELDS) {
        for (const [vi, v] of values.entries()) {
          for (let i = 0; i < cands.length; i++) {
            const args = structuredClone(c.args) as any;
            // Give ONE candidate the money; every other candidate gets none, so any use of it moves the choice.
            args.candidates[i][field] = v;
            const got = decisionOf(await run(args, c.board));
            expect(got, `${field}=${JSON.stringify(v)} on candidate ${i} (${vi})`).toEqual(base);
          }
        }
      }
    });
  }

  it("commercial fields are listed as ignored, never as reasons", async () => {
    const r = await run(CASES.cases[4].args, "unreachable");
    const s = (r.record as any).observed.considered.find((x: any) => x.id === "model:sponsored");
    expect(s.ignored_fields).toEqual(["bid", "sponsor"]);
    expect(s.uncheckable).toEqual([]);
  });
});

describe("policy: Cedar floor + caller policy, fail closed", () => {
  const cand = (over: Args = {}) => normaliseCandidate({ id: "m", kind: "model", provider: "p", region: "eu-1", read_only: true, ...over }, 0);
  const ctx = { confirm: false, caller_wallet: false, data_class: "public" as const };
  const f = { measured_on_axis: false };

  it("forbid beats permit", () => {
    const pol = callerPolicy({ presets: ["local-only"] });
    expect(pol.rules[0].id).toBe("caller:permit");
    const v = evaluate(cand(), f, pol, ctx);
    expect(v).toMatchObject({ permit: false, forbid_policy: "caller:preset:local-only" });
  });

  it("an unknown policy key or preset grants nothing (no caller permit)", () => {
    for (const raw of [{ presets: ["trusted"] }, { allow_everything: true }, { presets: "read-only" }, { forbid_providers: [] }]) {
      const pol = callerPolicy(raw);
      expect(pol.uncheckable.length, JSON.stringify(raw)).toBeGreaterThan(0);
      expect(pol.rules.some((r) => r.effect === "permit")).toBe(false);
      expect(evaluate(cand(), f, pol, ctx).permit).toBe(false);
    }
  });

  it("an unknown candidate attribute makes it UNCHECKABLE and never permitted", () => {
    const c = cand({ trust_score: 99 });
    expect(c.uncheckable[0]).toMatch(/unknown attribute/);
    expect(evaluate(c, f, callerPolicy({}), ctx).permit).toBe(false);
  });

  it("the floor forbids DIVERGENT effect-binding, destructive without confirm, paid without wallet, undeclared data class", () => {
    const pol = callerPolicy({});
    const div = cand();
    div.census.effect_binding = "DIVERGENT";
    expect(evaluate(div, f, pol, ctx).forbid_policy).toBe("floor:effect-binding-divergent");
    expect(evaluate(cand({ destructive: true }), f, pol, ctx).forbid_policy).toBe("floor:destructive-needs-confirm");
    expect(evaluate(cand({ destructive: true }), f, callerPolicy({ confirm_destructive: true }), { ...ctx, confirm: true }).permit).toBe(true);
    expect(evaluate(cand({ paid: true }), f, pol, ctx).forbid_policy).toBe("floor:paid-needs-caller-wallet");
    expect(evaluate(cand(), f, pol, { ...ctx, data_class: "pii" }).forbid_policy).toBe("floor:data-class-not-declared");
  });

  it("endpoints: https public hosts or local:<name>; private and loopback addresses are refused on the edge", () => {
    expect(checkEndpoint("https://api.example.com/v1")).toBeNull();
    expect(checkEndpoint("local:ollama/mistral:7b")).toBeNull();
    for (const bad of ["http://api.example.com", "https://127.0.0.1:11434", "https://10.0.0.2/", "https://[::1]/", "https://user:pw@example.com", "https://printer.local/"])
      expect(checkEndpoint(bad), bad).not.toBeNull();
  });

  it("route is never a candidate for its own decision", () => {
    expect(fleetCandidates().map((c) => c.id)).not.toContain("mcp:route");
  });

  it("the committed Cedar files are the rendered ones (producer, not artifact)", () => {
    const dir = join(HERE, "policy");
    const want: Record<string, string> = { "gspc-route.cedarschema": CEDAR_SCHEMA, "floor.cedar": FLOOR_CEDAR };
    for (const p of PRESETS) want[`presets/${p}.cedar`] = presetCedar(p);
    for (const [name, text] of Object.entries(want)) {
      if (process.env.ROUTE_GOLDEN_WRITE === "1") writeFileSync(join(dir, name), text);
      expect(readFileSync(join(dir, name), "utf8"), name).toBe(text);
    }
  });
});

describe("record: csoai.route-evidence/0.1 over csoai.evidence-event/0.1", () => {
  it("event_id recomputes from the JCS bytes without event_id, signature, anchors", async () => {
    const r = await run(TIE_ARGS);
    const rec = r.record as Record<string, unknown>;
    expect(rec.event_id).toBe(await computeEventId(rec));
    const tampered = { ...rec, state: "CONSISTENT" };
    expect(await computeEventId(tampered)).not.toBe(rec.event_id);
    expect(await computeEventId({ ...rec, signature: { x: 1 }, anchors: null })).toBe(rec.event_id);
  });

  it("decide-only is UNMEASURED, value null, unsigned, and carries the profile", async () => {
    const rec = (await run(TIE_ARGS)).record as any;
    expect(rec).toMatchObject({
      schema: "csoai.evidence-event/0.1",
      profile: "csoai.route-evidence/0.1",
      state: "UNMEASURED",
      value: null,
      signature: null,
      subject: { kind: "route" },
    });
    expect(rec.observed.execution.mode).toBe("decide_only");
  });

  it("no task bytes: a canary in the task never appears in the output", async () => {
    const canary = "CANARY-7f3e9d-do-not-store";
    const r = await run({ ...TIE_ARGS, task: `please route ${canary} now` });
    expect(JSON.stringify(r)).not.toContain(canary);
    expect(routeSummary(r)).not.toContain(canary);
  });

  it("execute is NOT_ENABLED (501); nothing is called", async () => {
    let fetched = false;
    const r = await route({ ...TIE_ARGS, mode: "execute" }, { fetchBoard: async () => { fetched = true; return BOARD; } });
    expect(r).toMatchObject({ state: "NOT_ENABLED", http_status: 501 });
    expect(fetched).toBe(false);
  });

  it("jcs sorts keys and writes numbers the ECMAScript way", () => {
    expect(jcs({ b: 1, a: [0.6, 1e21, "é"], c: null })).toBe('{"a":[0.6,1e+21,"é"],"b":1,"c":null}');
  });

  it("golden records: every case reproduces its committed record byte for byte", async () => {
    for (const c of CASES.cases as Array<{ name: string; board: string | null; args: Args }>) {
      const r = await run(c.args, c.board);
      const text = `${JSON.stringify(r.record, null, 1)}\n`;
      const p = join(GOLD, `${c.name}.record.json`);
      if (process.env.ROUTE_GOLDEN_WRITE === "1") writeFileSync(p, text);
      expect(readFileSync(p, "utf8"), c.name).toBe(text);
    }
  });
});
