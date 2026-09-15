import { readFileSync } from "node:fs";
import { beforeAll, describe, expect, it } from "vitest";
import { onRequestGet } from "./gspc";

// C-2026-0915-01: the governance axis on GET /api/gspc said its lead "is separated
// (McNemar p=0.0086 …) — one of only 4 separated leads on the board" while the same
// payload's governance.separation was UNTESTED and totals.separated_leads was 0. The
// sentence predated the own-model exclusion, which removes our own specialist from the
// public leader slot and with it every public separation determination on that axis.
//
// Rule, read off the served payload rather than off any phrase list:
//   1. Any typed count of separated leads anywhere in the payload equals
//      totals.separated_leads.
//   2. A sentence that says an axis's lead is separated stands only where that axis's
//      public separation field is SEPARATED. The one exception is an axis's
//      historical_measurement_record, and only when the record is marked superseded,
//      disclaims the current public fields, and labels the result as an in-lane result
//      on our own model that is not a public ranking.
//   3. A limitation sentence that names an axis and says it is separated obeys rule 2
//      for every axis it names.

type Axis = {
  axis: string;
  separation?: string;
  note?: string;
  excluded_note?: string;
  measurement_note?: string;
  historical_measurement_record?: {
    state?: string;
    note?: string;
    does_not_assert_current_public_fields?: boolean;
  };
};
type Payload = { totals: { separated_leads: number }; axes: Axis[]; limitations: string[] };

const WORDS: Record<string, number> = {
  zero: 0, no: 0, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10,
};

// "one of only 4 separated leads", "3 separated leads", "4 statistically separated leaders",
// "3 of 13 canonical axes carry a separated leader". Negations ("not a separated leader")
// carry no number and are not counts.
export function separatedLeadCounts(text: string): number[] {
  const out: number[] = [];
  const num = "(\\d+|zero|one|two|three|four|five|six|seven|eight|nine|ten)";
  const direct = new RegExp(`\\b${num}\\s+(?:statistically\\s+)?separated\\s+lead(?:er)?s\\b`, "gi");
  const ofAxes = new RegExp(`\\b${num}\\s+of\\s+\\d+\\s+[\\w\\s-]{0,40}?axe?s\\s+(?:carry|have|show)\\s+a\\s+(?:statistically\\s+)?separated\\s+lead`, "gi");
  for (const re of [direct, ofAxes]) {
    for (const m of text.matchAll(re)) {
      const raw = m[1].toLowerCase();
      out.push(/^\d+$/.test(raw) ? Number(raw) : WORDS[raw]);
    }
  }
  return out;
}

// A positive statement that a lead is separated. "not a separated leader", "not
// statistically separated", "still not separated" and "TIE" wording are not claims.
export function claimsSeparatedLead(text: string): boolean {
  const patterns = [
    /\blead\s+(?:is|was)\s+separated\b/i,
    /(?<!\bnot\s+(?:a\s+)?(?:statistically\s+)?)\bseparated\s+lead(?:er)?\b/i,
    /(?<!\bnot\s+)\bSEPARATED\s+vs\b/,
    /\bseparates\s+at\s+p\s*=/i,
    /\bis\s+separated\s+from\b/i,
    /\bcleanest\s+separation\b/i,
  ];
  return patterns.some((re) => re.test(text));
}

const IN_LANE_LABEL = /in-lane result on our own model[^.]*not a public ranking/i;

export function labelledHistorical(axis: Axis): boolean {
  const h = axis.historical_measurement_record;
  return (
    !!h &&
    h.state === "SUPERSEDED_FOR_PUBLIC_RANKING" &&
    h.does_not_assert_current_public_fields === true &&
    typeof h.note === "string" &&
    IN_LANE_LABEL.test(h.note)
  );
}

// Every violation, by name, so a failure says which axis and which field.
export function separationViolations(p: Payload): string[] {
  const bad: string[] = [];
  const total = p.totals.separated_leads;
  const byId = new Map(p.axes.map((a) => [a.axis, a]));

  const walk = (v: unknown, path: string) => {
    if (typeof v === "string") {
      for (const n of separatedLeadCounts(v)) {
        if (n !== total) bad.push(`${path}: typed ${n} separated leads, totals.separated_leads=${total}`);
      }
    } else if (Array.isArray(v)) v.forEach((x, i) => walk(x, `${path}[${i}]`));
    else if (v && typeof v === "object") for (const [k, x] of Object.entries(v)) walk(x, `${path}.${k}`);
  };
  walk(p, "$");

  for (const a of p.axes) {
    if (a.separation === "SEPARATED") continue;
    for (const field of ["note", "excluded_note", "measurement_note"] as const) {
      const s = a[field];
      if (typeof s === "string" && claimsSeparatedLead(s)) {
        bad.push(`${a.axis}.${field}: claims a separated lead, separation=${a.separation}`);
      }
    }
    const h = a.historical_measurement_record?.note;
    if (typeof h === "string" && claimsSeparatedLead(h) && !labelledHistorical(a)) {
      bad.push(`${a.axis}.historical_measurement_record.note: claims a separated lead without the in-lane label, separation=${a.separation}`);
    }
  }

  p.limitations.forEach((line, i) => {
    for (const sentence of line.split(/(?<=[.;])\s+/)) {
      if (!claimsSeparatedLead(sentence) || IN_LANE_LABEL.test(sentence)) continue;
      for (const [id, a] of byId) {
        if (a.separation === "SEPARATED") continue;
        if (new RegExp(`\\b${id.replace(/[-]/g, "\\-")}\\b`).test(sentence)) {
          bad.push(`limitations[${i}]: says ${id} is separated, separation=${a.separation}`);
        }
      }
    }
  });
  return bad;
}

async function servedBoard(): Promise<Payload> {
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

describe("GET /api/gspc: separation prose agrees with the separation fields", () => {
  let board: Payload;
  beforeAll(async () => {
    board = await servedBoard();
  });

  it("serves the fields this guard reads (not a vacuous pass)", () => {
    expect(typeof board.totals.separated_leads).toBe("number");
    expect(board.axes.length).toBeGreaterThan(10);
    expect(board.axes.find((a) => a.axis === "governance")).toBeDefined();
    expect(board.limitations.length).toBeGreaterThan(0);
  });

  it("no note, historical record or limitation contradicts separation or totals.separated_leads", () => {
    expect(separationViolations(board)).toEqual([]);
  });

  it("failing control: the pre-correction governance note is rejected on the served board", () => {
    const stale =
      "The tuned governance specialist leads AND the lead is separated (McNemar p=0.0086 vs best " +
      "base mistral:7b) — one of only 4 separated leads on the board.";
    const planted = structuredClone(board);
    const gov = planted.axes.find((a) => a.axis === "governance")!;
    gov.historical_measurement_record = { ...gov.historical_measurement_record, note: stale };
    const v = separationViolations(planted);
    expect(v.some((x) => x.startsWith("governance.historical_measurement_record.note"))).toBe(true);
    if (board.totals.separated_leads !== 4) {
      expect(v.some((x) => /typed 4 separated leads/.test(x))).toBe(true);
    }
  });

  it("failing controls: a public note, a limitation and a count each fail on their own", () => {
    const planted = structuredClone(board);
    const untested = planted.axes.find((a) => a.separation === "UNTESTED")!;
    untested.note = "The tuned specialist leads and the lead is separated (p=0.01).";
    planted.limitations.push(`${untested.axis} is separated from base models. Quote accordingly.`);
    planted.limitations.push(`${board.totals.separated_leads + 3} separated leads stand on the board.`);
    const v = separationViolations(planted);
    expect(v).toContain(`${untested.axis}.note: claims a separated lead, separation=UNTESTED`);
    expect(v.some((x) => x.includes(`says ${untested.axis} is separated`))).toBe(true);
    expect(v.some((x) => x.includes(`typed ${board.totals.separated_leads + 3} separated leads`))).toBe(true);
  });

  it("negations and TIE wording are not claims; the in-lane label is required, not assumed", () => {
    expect(claimsSeparatedLead("a TIE is not a separated leader")).toBe(false);
    expect(claimsSeparatedLead("support a point leader but not a statistically separated leader")).toBe(false);
    expect(claimsSeparatedLead("TIE (p=0.065 — still not separated at p<0.05)")).toBe(false);
    expect(separatedLeadCounts("one of only 4 separated leads on the board")).toEqual([4]);
    expect(separatedLeadCounts("3 of 13 canonical axes carry a separated leader")).toEqual([3]);
    const unlabelled: Axis = {
      axis: "x",
      separation: "UNTESTED",
      historical_measurement_record: {
        state: "SUPERSEDED_FOR_PUBLIC_RANKING",
        does_not_assert_current_public_fields: true,
        note: "The lead is separated (p=0.01).",
      },
    };
    expect(labelledHistorical(unlabelled)).toBe(false);
  });
});

// The same class on the two client surfaces that typed own-model separations as if they
// were public results. Axis ids are read from the served board's own-model exclusion list.
describe("client copy does not present own-model separations as public leads", () => {
  it("Benchmarks and industries name no own-model axis as separated without the in-lane label", async () => {
    const board = (await servedBoard()) as Payload & { totals: { own_leaders_excluded_axes: string[] } };
    const own = board.totals.own_leaders_excluded_axes;
    expect(own.length).toBeGreaterThan(0);
    const files = ["../../client/src/pages/Benchmarks.tsx", "../../client/src/data/industries.ts"];
    const bad: string[] = [];
    for (const f of files) {
      const src = readFileSync(new URL(f, import.meta.url), "utf8");
      // Join string-literal concatenations so a sentence split across `" +` lines reads whole.
      const joined = src.replace(/"\s*\+\s*\n\s*"/g, "");
      for (const sentence of joined.split(/(?<=[.;])\s+/)) {
        if (!claimsSeparatedLead(sentence) || IN_LANE_LABEL.test(sentence)) continue;
        if (own.some((id) => new RegExp(`\\b${id}\\b`, "i").test(sentence)) || /\bseparated lead\b/i.test(sentence)) {
          bad.push(`${f}: ${sentence.trim().slice(0, 140)}`);
        }
      }
    }
    expect(bad).toEqual([]);
  });
});
