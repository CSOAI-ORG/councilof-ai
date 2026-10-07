/**
 * GSPC Route, MATCHED_FORBIDDEN on the default tool fleet: when a request matches a paid tool, every
 * reason it was not chosen is named. Found 7 Oct 2026 (verifier): with a preset set and no wallet, the
 * answer said only "paid check / pay from your wallet" and offered the free preview, hiding the preset
 * the person had set. Both reasons are named now, and the single next step lifts the preset first.
 */
import { describe, expect, it } from "vitest";
import { route, routeSummary, BANNED_ROUTE_WORDS } from "./route";
import { callerRuleWords, decide } from "./decide";
import { callerPolicy } from "./policy";
import { PAID_FLOOR, PAID_NEXT, type TaskMatch } from "./taskMatch";
import type { Candidate } from "./types";

const deps = {
  fetchBoard: async () => ({ axes: [] }),
  now: () => new Date("2026-10-07T04:00:00.000Z"),
  uuid: () => "00000000-0000-4000-8000-0000000007a5",
};
const ask = (task: string, extra: Record<string, unknown> = {}) => route({ task, ...extra }, deps);
const PAID_TASK = "commission a measurement card for my model";
const FREE_TASK = "which tool verifies a signed card";

describe("paid match with no preset", () => {
  it("names only the paid check; the next step is the free step", async () => {
    const r = await ask(PAID_TASK);
    expect(r.state).toBe("NO_PERMITTED_CANDIDATE");
    expect(r.chosen).toBeNull();
    const tm = r.task_match as TaskMatch;
    expect(tm.state).toBe("MATCHED_FORBIDDEN");
    expect(tm.matched[0]).toMatchObject({ id: "mcp:commission_card", forbid_policy: PAID_FLOOR });
    expect(tm.paid).toMatchObject({ id: "mcp:commission_card", tool: "commission_card", door: "/dashboard?tab=measured" });
    expect(tm.paid!.forbidden_by).toBeUndefined();
    expect(tm.paid!.next_step).toBe(PAID_NEXT.commission_card.free_step);
    expect(tm.reason).toContain("commission_card, a paid check (x402)");
    expect(tm.reason).not.toMatch(/preset|your policy forbids/);
    expect(routeSummary(r)).toContain("Free next step:");
    expect(routeSummary(r)).not.toMatch(/preset|your policy forbids/);
  });
});

describe("paid match with a forbidding preset and no wallet", () => {
  for (const preset of ["read-only", "local-only", "eu-only", "no-unmeasured"]) {
    it(`${preset}: names the preset AND the paid check, with one next step that lifts the preset first`, async () => {
      const r = await ask(PAID_TASK, { policy: { presets: [preset] } });
      expect(r.state).toBe("NO_PERMITTED_CANDIDATE");
      expect(r.chosen).toBeNull();
      const tm = r.task_match as TaskMatch;
      expect(tm.state).toBe("MATCHED_FORBIDDEN");
      // evaluate() still names the floor first; the caller's rule is in forbids_matched, and now in the answer.
      expect(tm.matched[0]).toMatchObject({ id: "mcp:commission_card", forbid_policy: PAID_FLOOR });
      expect(tm.paid).toMatchObject({ id: "mcp:commission_card", tool: "commission_card", door: "/dashboard?tab=measured" });
      expect(tm.paid!.forbidden_by).toEqual([`caller:preset:${preset}`]);
      // Both reasons in the reason.
      expect(tm.reason).toContain(`caller:preset:${preset}`);
      expect(tm.reason).toContain(`the ${preset} preset`);
      expect(tm.reason).toContain("paid check (x402)");
      expect(tm.reason).toContain("two reasons");
      // One next step: lift the preset, then the free step. Never the free step alone.
      expect(tm.paid!.next_step.startsWith(`Turn off the ${preset} preset`)).toBe(true);
      expect(tm.paid!.next_step).toContain(PAID_NEXT.commission_card.free_step);
      expect(tm.paid!.next_step.split("Turn off").length).toBe(2);
      const s = routeSummary(r);
      expect(s).toContain(`your policy forbids (caller:preset:${preset})`);
      expect(s).toContain("a paid check (x402)");
      expect(s).toContain(`Next step: ${tm.paid!.next_step}`);
      expect(s).not.toContain("Free next step:");
      expect(`${tm.reason} ${s}`).not.toMatch(BANNED_ROUTE_WORDS);
    });
  }

  it("two presets: both are named", async () => {
    const r = await ask("is this image AI-generated", { policy: { presets: ["read-only", "local-only"] } });
    const tm = r.task_match as TaskMatch;
    expect(tm.paid!.forbidden_by).toEqual(["caller:preset:local-only", "caller:preset:read-only"]);
    expect(tm.reason).toContain("the local-only preset and the read-only preset");
    expect(tm.paid!.next_step).toMatch(/^Turn off the local-only preset and the read-only preset/);
  });

  it("with a wallet declared, the preset alone is named and nothing is called paid", async () => {
    const r = await ask(PAID_TASK, { policy: { presets: ["read-only"], caller_wallet: true } });
    const tm = r.task_match as TaskMatch;
    expect(tm.state).toBe("MATCHED_FORBIDDEN");
    expect(tm.paid).toBeUndefined();
    expect(tm.reason).toContain("forbidden by the policy (caller:preset:read-only)");
  });

  it("decide() directly: a paid candidate forbidden by the floor and a preset carries both", () => {
    const c: Candidate = {
      id: "mcp:rwa_evidence",
      kind: "mcp_tool",
      provider: "csoai",
      model: null,
      endpoint: null,
      region: "",
      tool: "rwa_evidence",
      local: false,
      read_only: false,
      destructive: false,
      paid: true,
      cost_declared: null,
      latency_declared_ms: null,
      source: "gspc_fleet",
      data_class_allowed: ["public"],
      census: { effect_binding: "UNMEASURED" },
      uncheckable: [],
      ignored_fields: [],
    };
    const policy = callerPolicy({ presets: ["read-only"] });
    const d = decide(
      [c],
      policy,
      { confirm: false, caller_wallet: false, data_class: "public" },
      { quality_axis: null, weights: { quality: 0, cost: 0, latency: 0 }, tie_break: ["lexical_id"] },
      null,
      new Map([[c.id, 4]]),
    );
    expect(d.chosen).toBeNull();
    expect(d.considered[0].verdict.forbids_matched).toEqual([PAID_FLOOR, "caller:preset:read-only"]);
    expect(d.task_match!.paid!.forbidden_by).toEqual(["caller:preset:read-only"]);
    expect(d.task_match!.reason).toMatch(/your policy forbids it \(caller:preset:read-only: the read-only preset\)/);
  });
});

describe("a forbidden free tool", () => {
  it("names the preset; no paid check, no paid next step", async () => {
    const r = await ask(FREE_TASK, { policy: { presets: ["local-only"] } });
    expect(r.state).toBe("NO_PERMITTED_CANDIDATE");
    expect(r.chosen).toBeNull();
    const tm = r.task_match as TaskMatch;
    expect(tm.state).toBe("MATCHED_FORBIDDEN");
    expect(tm.matched[0]).toMatchObject({ id: "mcp:verify_card", forbid_policy: "caller:preset:local-only" });
    expect(tm.paid).toBeUndefined();
    expect(tm.reason).toBe(
      "The tool whose purpose matches this request is forbidden by the policy (caller:preset:local-only), so no tool was chosen.",
    );
    const s = routeSummary(r);
    expect(s).toContain("mcp:verify_card, which the policy forbids (caller:preset:local-only)");
    expect(s).not.toMatch(/paid|wallet|x402/);
  });

  it("the same free request with read-only is permitted (verify_card is read-only) and routes", async () => {
    const r = await ask(FREE_TASK, { policy: { presets: ["read-only"] } });
    expect(r.state).toBe("ROUTED");
    expect((r.chosen as { id: string }).id).toBe("mcp:verify_card");
  });
});

describe("callerRuleWords", () => {
  it("speaks the person's own rule names", () => {
    expect(callerRuleWords(["caller:preset:eu-only"])).toBe("the eu-only preset");
    expect(callerRuleWords(["caller:forbid-providers", "caller:allow-kinds"])).toBe(
      "your forbid_providers list and your allow_kinds list",
    );
  });
});
