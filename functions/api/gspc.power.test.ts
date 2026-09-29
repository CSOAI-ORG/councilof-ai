import { beforeAll, describe, expect, it } from "vitest";
import { onRequestGet } from "./gspc";
import { BANK_DISTINCT_AXES, POWER_AXES, UNDERPOWERED_STATE, applyUnderpowered, isUnderpowered, powerFields } from "./_gspc_power";
import { ROWS_POWER } from "./_gspc_rows_power";
import { JAIL_PROMPT_INTERVAL } from "./_gspc_jail_prompt_interval";
import { ROWS_SEPARATION } from "./_gspc_rows_separation";

// Board honesty (2026-09-28): distinct_items and the MDE of the separation test on every
// model-comparison axis, measured_on.model derived from the rows, and the owner-gated UNDERPOWERED
// state (HELD, OFF). These checks read the served payload and the generated modules; the MDE is
// re-derived here by an independent exact power computation, never compared with a typed number.

type Axis = Record<string, any> & { axis: string; kind?: string; separation?: string };
type Payload = { axes: Axis[]; totals: Record<string, any>; measured_on: Record<string, any>; state_enum: Record<string, any> };

async function served(): Promise<Payload> {
  (globalThis as unknown as { caches: unknown }).caches = {
    default: { match: async () => undefined, put: async () => undefined },
  };
  const res = await onRequestGet({
    request: new Request("https://councilof.ai/api/gspc"),
    env: {},
    waitUntil: () => undefined,
  } as unknown as Parameters<typeof onRequestGet>[0]);
  return (await res.json()) as Payload;
}

// ── an independent exact power computation (not the producer's code) ────────────────────────
const LOGF: number[] = [0];
for (let i = 1; i <= 2000; i++) LOGF[i] = LOGF[i - 1] + Math.log(i);
const pmf = (k: number, n: number, p: number): number => {
  if (p <= 0) return k === 0 ? 1 : 0;
  if (p >= 1) return k === n ? 1 : 0;
  return Math.exp(LOGF[n] - LOGF[k] - LOGF[n - k] + k * Math.log(p) + (n - k) * Math.log1p(-p));
};
// exact two-sided McNemar p for min split k of d discordant items: 2 * P(X <= k), X ~ Bin(d, 1/2)
const mcnemarP = (k: number, d: number): number => {
  let s = 0;
  for (let i = 0; i <= k; i++) s += Math.exp(LOGF[d] - LOGF[i] - LOGF[d - i] - d * Math.LN2);
  return Math.min(1, 2 * s);
};
function power(n: number, psi: number, delta: number): number {
  const pi = (psi + delta) / (2 * psi);
  let total = 0;
  for (let d = 0; d <= n; d++) {
    let k = -1;
    for (let i = 0; i <= Math.floor(d / 2); i++) {
      if (mcnemarP(i, d) < 0.05) k = i;
      else break;
    }
    if (k < 0) continue;
    let rej = 0;
    for (let b = 0; b <= k; b++) rej += pmf(b, d, pi);
    for (let b = d - k; b <= d; b++) rej += pmf(b, d, pi);
    total += pmf(d, n, psi) * rej;
  }
  return total;
}

describe("GET /api/gspc: distinct_items and MDE on every model-comparison axis", () => {
  let board: Payload;
  beforeAll(async () => {
    board = await served();
  });

  it("every model-comparison axis carries distinct_items and an MDE block with a served state", () => {
    const cmp = board.axes.filter((a) => a.kind === "model-comparison");
    expect(cmp.length).toBe(14);
    const states = board.state_enum.mde_state as string[];
    for (const a of cmp) {
      expect(Number.isInteger(a.distinct_items) && a.distinct_items > 0, a.axis).toBe(true);
      expect(typeof a.distinct_items_source, a.axis).toBe("string");
      expect(states, a.axis).toContain(a.mde.state);
      // a null MDE is never a zero, and a number only ever comes with MEASURED
      expect(a.mde.value === null, a.axis).toBe(a.mde.state !== "MEASURED");
      expect(a.mde.alpha).toBe(0.05);
      expect(a.mde.power).toBe(0.8);
    }
    for (const a of board.axes.filter((x) => x.kind !== "model-comparison")) {
      expect(a.distinct_items, a.axis).toBeUndefined();
      expect(a.mde, a.axis).toBeUndefined();
    }
  });

  it("rows-backed axes read distinct_items and the MDE from the generated module", () => {
    const backed = board.axes.filter((a) => a.kind === "model-comparison" && a.mde?.paired_items !== undefined);
    expect(backed.length).toBeGreaterThan(0);
    for (const a of backed) {
      const p = POWER_AXES[a.axis];
      expect(a.distinct_items).toBe(p.distinct_items);
      expect(a.mde.value).toBe(p.mde);
      expect(a.mde.state).toBe(p.mde_state);
      expect(a.mde.paired_items).toBe(p.paired_items);
    }
  });

  it("each MEASURED MDE is the smallest difference reaching 80% power (independent recompute)", () => {
    const measured = Object.entries(POWER_AXES).filter(([, p]) => p.mde_state === "MEASURED");
    expect(measured.length).toBeGreaterThan(0);
    for (const [axis, p] of measured) {
      const psi = p.discordant_items / p.paired_items;
      expect(power(p.paired_items, psi, p.mde as number), axis).toBeGreaterThanOrEqual(0.8);
      expect(power(p.paired_items, psi, Math.max(0, (p.mde as number) - 0.002)), axis).toBeLessThan(0.8);
    }
  });

  it("NOT_REACHABLE means even the largest possible difference stays under 80% power", () => {
    const nr = Object.entries(POWER_AXES).filter(([, p]) => p.mde_state === "NOT_REACHABLE");
    expect(nr.length).toBeGreaterThan(0);
    for (const [axis, p] of nr) {
      const psi = p.discordant_items / p.paired_items;
      expect(power(p.paired_items, psi, psi), axis).toBeLessThan(0.8);
    }
  });

  it("the power module is bound to the same rows and the same test as the separation module", () => {
    expect(ROWS_POWER.peritem_sha256).toBe(ROWS_SEPARATION.peritem_sha256);
    expect(ROWS_POWER.dataset_revision).toBe(ROWS_SEPARATION.dataset_revision);
    const sepAxes = ROWS_SEPARATION.axes as unknown as Record<string, any>;
    for (const [axis, p] of Object.entries(POWER_AXES)) {
      const s = sepAxes[axis];
      expect(p.sha256, axis).toBe(s.sha256);
      expect(p.distinct_items, axis).toBe(s.distinct_items);
      expect(p.leader, axis).toBe(s.test.leader.model);
      expect(p.next_best, axis).toBe(s.test.runner_up.model);
      expect(p.paired_items, axis).toBe(s.test.paired_items);
      expect(p.discordant_items, axis).toBe(s.test.b10 + s.test.c01);
      expect(p.mcnemar_p, axis).toBe(s.test.mcnemar_p);
    }
  });

  it("an axis whose served bank has no published paired rows says UNMEASURED, and says why", () => {
    const jail = board.axes.find((a) => a.axis === "jail")!;
    expect(jail.mde.state).toBe("UNMEASURED");
    expect(jail.mde.reason_code).toBe("NO_PAIRED_ROWS");
    // C-2026-0929-02: n counts rows; distinct_items counts distinct inputs in the served bank's bytes
    expect(jail.distinct_items).toBe(BANK_DISTINCT_AXES.jail.distinct_inputs);
    expect(jail.distinct_items).toBe(27);
    expect(jail.n).toBe(71);
    expect(jail.distinct_items_source).toContain("sha256 of the normalised prompt");
    expect(jail.distinct_items_source).toContain("44 rows repeat an input already counted");
    expect(jail.distinct_items_source).not.toContain("the axis's own n");
    const swarm = board.axes.find((a) => a.axis === "swarm")!;
    expect(swarm.mde.state).toBe("UNMEASURED");
    expect(swarm.mde.reason_code).toBe("NO_PAIRED_ROWS_FOR_SERVED_BANK");
    expect(swarm.distinct_items).toBe(BANK_DISTINCT_AXES.swarm.distinct_inputs);
    expect(swarm.distinct_items_source).toContain(BANK_DISTINCT_AXES.swarm.file_sha256.slice(0, 16));
    // the retired bank's own numbers are named, not hidden
    expect(swarm.mde.reason).toContain(`${POWER_AXES.swarm.distinct_items} distinct items`);
  });
});

describe("distinct_items never falls back to n (C-2026-0929-02)", () => {
  it("every model-comparison axis without rows for its served bank has a counted bank, and distinct <= n", async () => {
    const board = await served();
    for (const a of board.axes.filter((x) => x.kind === "model-comparison")) {
      expect(a.distinct_items, a.axis).toBeLessThanOrEqual(a.n);
      if (a.mde.paired_items === undefined) expect(BANK_DISTINCT_AXES[a.axis], a.axis).toBeDefined();
    }
  });

  it("failing control: an axis with neither rows nor a counted bank reads UNMEASURED (null), never its n", () => {
    const f = powerFields({ axis: "no-such-axis", kind: "model-comparison", n: 71 })!;
    expect(f.distinct_items).toBeNull();
    expect(f.distinct_items_source).toMatch(/^UNMEASURED: .*not published as distinct items/);
  });
});

describe("measured_on.model is derived from the rows", () => {
  let board: Payload;
  beforeAll(async () => {
    board = await served();
  });

  it("states the fleet counted from the rows, and no fleet the rows do not hold", () => {
    const f = ROWS_POWER.fleet as unknown as Record<string, any>;
    const m = board.measured_on.model as string;
    expect(f.models_in_rows).toBe(f.base_count + f.own_count + f.other_count);
    expect(m).toContain(`${f.models_in_rows}-model fleet`);
    expect(m).toContain(`${f.base_count} base models, compared`);
    expect(m).toContain(`${f.own_count} CSOAI own fine-tunes, excluded before comparison and never counted in a comparison`);
    for (const b of f.base_models as string[]) expect(m).toContain(b);
    if (f.other_count === 0) {
      expect(m).toContain("no other model is in the rows");
      expect(m).not.toMatch(/cross-lab|frontier/i);
      expect(board.measured_on.endpoint).not.toMatch(/cross-lab|OpenRouter/i);
    }
    expect(m).not.toMatch(/8 tuned council specialists/);
    // own fine-tunes are counted, never named on this surface
    expect(m).not.toMatch(/sov\d|v3-light/i);
  });

  it("failing control: the retired typed text would be caught", () => {
    const typed = "19-model fleet (8 tuned council specialists + 6 base models + frontier cross-lab models)";
    const f = ROWS_POWER.fleet as unknown as Record<string, any>;
    expect(typed.includes(`${f.own_count} CSOAI own fine-tunes`)).toBe(false);
    expect(/cross-lab|frontier/i.test(typed)).toBe(true);
  });
});

describe("UNDERPOWERED is owner-gated: HELD and OFF by default", () => {
  let board: Payload;
  beforeAll(async () => {
    board = await served();
  });

  it("OFF: the word appears nowhere in the served payload and no count changes", () => {
    expect(UNDERPOWERED_STATE.enabled).toBe(false);
    expect(board.state_enum.separation).toEqual(["SEPARATED", "TIE", "UNTESTED"]);
    expect(JSON.stringify(board)).not.toContain("UNDERPOWERED");
    expect(board.totals.underpowered_separations).toBeUndefined();
    const cmp = board.axes.filter((a) => a.kind === "model-comparison" && a.status === "MEASURED");
    expect(board.totals.separated_leads + board.totals.ties + board.totals.untested_separations).toBe(cmp.length);
  });

  it("ON (pure, not served): only a TIE whose MDE cannot be reached turns UNDERPOWERED; UNTESTED keeps its reason", () => {
    const on = { enabled: true, mde_threshold: null };
    const cmp = board.axes.filter((a) => a.kind === "model-comparison");
    const flipped = cmp.map((a) => applyUnderpowered(a as any, on) as Axis);
    for (let i = 0; i < cmp.length; i++) {
      const before = cmp[i];
      const after = flipped[i];
      const expectFlip =
        before.separation === "TIE" && (before.mde.state === "NOT_REACHABLE" || before.mde.state === "UNDEFINED");
      expect(after.separation === "UNDERPOWERED", before.axis).toBe(expectFlip);
      if (expectFlip) {
        expect(after.separation_test_verdict).toBe("TIE");
        expect(after.separation_underpowered_reason).toMatch(/Not a tie, not a win\.$/);
      }
      if (before.separation === "UNTESTED") expect(after.separation).toBe("UNTESTED");
    }
    expect(flipped.some((a) => a.separation === "UNDERPOWERED")).toBe(true); // not a vacuous pass
  });

  it("ON with an owner threshold also flags a TIE whose measured MDE exceeds it", () => {
    const tie = board.axes.find((a) => a.separation === "TIE" && a.mde?.state === "MEASURED")!;
    expect(tie).toBeDefined();
    expect(isUnderpowered(tie as any, { enabled: true, mde_threshold: tie.mde.value - 0.001 })).toBe(true);
    expect(isUnderpowered(tie as any, { enabled: true, mde_threshold: tie.mde.value })).toBe(false);
    expect(isUnderpowered(tie as any, { enabled: false, mde_threshold: 0 })).toBe(false);
  });
});

describe("jail interval at the prompt level (derived, unsigned; owner-approved 2026-09-29)", () => {
  const wilson = (p: number, n: number): [number, number] => {
    const z = 1.959963984540054, z2 = z * z, den = 1 + z2 / n;
    const c = (p + z2 / (2 * n)) / den, h = (z * Math.sqrt((p * (1 - p)) / n + z2 / (4 * n * n))) / den;
    return [c - h, c + h];
  };

  it("sits beside the signed row-level numbers and never overwrites them", async () => {
    const board = await served();
    const jail = board.axes.find((a) => a.axis === "jail")!;
    expect(jail.separation).toBe("TIE"); // signed; changes only through a re-sign at land
    expect(jail.interval).toEqual([0.475, 0.698]);
    expect(jail.fleet_mean).toBe(0.5455);
    const pl = jail.interval_prompt_level;
    expect(pl.signed).toBe(false);
    expect(pl.unit).toBe("prompt");
    expect(pl.label).toContain("DERIVED, UNSIGNED");
    expect(pl.resign).toContain("PENDING RE-SIGN");
    expect(pl.resign).toContain("C-2026-0929-02");
    expect(pl.row_level_signed).toEqual({ interval: jail.interval, fleet_mean: jail.fleet_mean, n: jail.n, separation: jail.separation });
    expect(pl.prompts).toBe(jail.distinct_items);
    expect(pl.rows).toBe(jail.n);
    for (const a of board.axes.filter((x) => x.axis !== "jail")) expect(a.interval_prompt_level, a.axis).toBeUndefined();
  });

  it("reads the generated module, and its counts are the axis's signed per-model counts", () => {
    const pm = JAIL_PROMPT_INTERVAL.per_model as Record<string, { tp: number; fp: number; tn: number; fn: number }>;
    const board = (JAIL_PROMPT_INTERVAL.row_level_signed as { interval: readonly number[] }).interval;
    expect(board).toEqual([0.475, 0.698]);
    expect(JAIL_PROMPT_INTERVAL.leader).toBe("qwen2.5:0.5b-instruct");
    expect(Object.keys(pm).length).toBe(7);
    // row-level Wilson of the leader reproduces the signed interval: the same formula at n = 71
    const L = pm["qwen2.5:0.5b-instruct"];
    expect(wilson((L.tp + L.tn) / 71, 71).map((x) => Math.round(x * 1000) / 1000)).toEqual([0.475, 0.698]);
  });

  it("the leader's prompt-level range is re-derived here from the bank's group sizes, not read back", () => {
    // ESCAPE prompts: five of 6 rows and eight single rows; BENIGN: 14 prompts, and the leader got every
    // benign row right (tn 33, fp 0). With s of its 9 detected escapes on single-row prompts, the prompt-level
    // accuracy is (14 + (9 - s)/6 + s) / 27, s = 0..8.
    const accs = Array.from({ length: 9 }, (_, s) => (14 + (9 - s) / 6 + s) / 27);
    const pl = JAIL_PROMPT_INTERVAL.prompt_level;
    const r4 = (x: number) => Math.round(x * 10000) / 10000;
    expect(pl.leader_accuracy_range).toEqual([r4(Math.min(...accs)), r4(Math.max(...accs))]);
    expect(pl.leader_assignments).toBe(9);
    const los = accs.map((a) => wilson(a, 27)[0]), his = accs.map((a) => wilson(a, 27)[1]);
    expect(pl.leader_interval_envelope).toEqual([r4(Math.min(...los)), r4(Math.max(...his))]);
  });

  it("the state is the board rule over every consistent assignment, and the prose agrees with it", async () => {
    const pl = JAIL_PROMPT_INTERVAL.prompt_level as Record<string, any>;
    const [fmLo, fmHi] = pl.fleet_mean_range as number[];
    const [envLo, envHi] = pl.leader_interval_envelope as number[];
    // UNTESTED needs both outcomes reachable: some fleet mean inside some leader interval, some outside
    if (pl.separation === "UNTESTED") {
      expect(pl.untested_reason_code).toBe("NO_PER_ROW_RESULTS");
      expect(pl.leader_assignments_by_outcome.TIE_for_every_fleet + pl.leader_assignments_by_outcome.depends_on_fleet).toBeGreaterThan(0);
      expect(pl.leader_assignments_by_outcome.depends_on_fleet + pl.leader_assignments_by_outcome.SEPARATED_for_every_fleet).toBeGreaterThan(0);
      expect(fmLo < (pl.leader_interval_lo_range as number[])[1] || fmHi > (pl.leader_interval_hi_range as number[])[0]).toBe(true);
    }
    expect(envLo).toBeLessThan(envHi);
    const board = await served();
    const jail = board.axes.find((a) => a.axis === "jail")!;
    if (pl.separation === "UNTESTED") expect(jail.n_note).toContain("UNTESTED at the prompt level");
    expect(jail.n_note).not.toContain("so the TIE stands");
  });
});
