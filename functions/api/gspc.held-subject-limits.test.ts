import { describe, expect, it } from "vitest";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { onRequestGet } from "./gspc";
import dailyReportHolds from "../../scripts/daily-report/holds.json";

// Owner ruling G8, 2026-11-21T02:12Z ("All as recommended" to OWNER-GATES-20261121): the hold on the
// subject-axis banks covers ten axes (C-2026-1120-01), and the claim-maintenance row rests on neither
// re-read (C-2026-1120-03). Each of the eleven rows states that on itself, as axes[<axis>].limit (the
// field #4550 added for C-2026-1120-02). The rows keep their status and figures: the limit says what
// those figures do not show. Every count a limit quotes is recounted here from the committed file the
// row cites, so a limit cannot state a figure its own evidence does not give.

const HELD = [
  "lab-practice",
  "company-practice",
  "measurer-integrity",
  "harness-fidelity",
  "interop-conformance",
  "humanoid-deployment",
  "regulator-transparency",
  "interpretability-reproducibility",
  "serving-fidelity",
  "watchdog-ingest",
] as const;

// The banks built by scripts/subject-axis/subject-axis-live-run.mjs (presence/1), which tested its
// patterns against the raw HTML of each page (the header of scripts/subject-axis/presence-v2.mjs).
// watchdog-ingest and harness-fidelity were built by scripts that stripped script and style first.
const LIVE_RUN_METHOD = "scripts/subject-axis/subject-axis-live-run.mjs";
const RAW_SOURCE_BANKS = [
  "lab-practice",
  "company-practice",
  "measurer-integrity",
  "interop-conformance",
  "humanoid-deployment",
  "regulator-transparency",
  "interpretability-reproducibility",
  "serving-fidelity",
];

const NOT_RELIED_ON = "no rate, count or single row of this axis should be relied on";

type Row = {
  axis: string;
  status?: string;
  n?: number;
  rate?: number;
  method?: string;
  note?: string;
  limit?: unknown;
  bank_sha256?: string;
  per_outcome?: Record<string, number>;
};

type BoardResponse = {
  axes: Row[];
  totals: { quotable_axes: number; measured_axes: number };
  daily_report_quotation: { policy_as_of: string; held_axes: Record<string, string> };
};

async function served(search = ""): Promise<BoardResponse> {
  (globalThis as unknown as { caches: unknown }).caches = {
    default: { match: async () => undefined, put: async () => undefined },
  };
  const res = await onRequestGet({
    request: new Request("https://councilof.ai/api/gspc" + search),
    env: {},
    waitUntil: () => undefined,
  } as unknown as Parameters<typeof onRequestGet>[0]);
  return (await res.json()) as BoardResponse;
}

describe("daily report quotation holds", () => {
  it("keeps the legacy measurement count and shares the daily publisher's correction IDs", async () => {
    const board = await served();
    expect(board.totals.quotable_axes).toBe(board.totals.measured_axes);
    expect(board.daily_report_quotation.policy_as_of).toBe(dailyReportHolds.as_of);
    expect(board.daily_report_quotation.held_axes).toEqual(dailyReportHolds.axes);
  });

  it("limits correction holds to the returned axes", async () => {
    const governance = await served("?axis=governance");
    expect(governance.daily_report_quotation.held_axes).toEqual({
      governance: dailyReportHolds.axes.governance,
    });
    const safety = await served("?axis=safety");
    expect(safety.daily_report_quotation.held_axes).toEqual({});
  });
});

const repoBytes = (rel: string): Buffer => readFileSync(fileURLToPath(new URL(`../../${rel}`, import.meta.url)));
const sha256 = (b: Buffer) => createHash("sha256").update(b).digest("hex");

type BankItem = { url: string; payload: { bytes?: number; final_url?: string; meets_disclosure_bar?: boolean } };
function bank(axis: string): { sha256: string; items: BankItem[] } {
  const bytes = repoBytes(`public/interop/axis-banks/${axis}-20261102.json`);
  return { sha256: sha256(bytes), items: (JSON.parse(bytes.toString("utf8")) as { items: BankItem[] }).items };
}

describe("G8: the ten held subject axes state their limit (C-2026-1120-01)", () => {
  it("GET /api/gspc serves a limit on each held axis, on the whole board and on ?axis=, citing C-2026-1120-01 and saying no rate, count or single row should be relied on", async () => {
    const whole = (await served()).axes;
    for (const axis of HELD) {
      const one = (await served(`?axis=${axis}`)).axes;
      expect(one.map((a) => a.axis), axis).toEqual([axis]);
      for (const row of [whole.find((a) => a.axis === axis), one[0]]) {
        expect(row, axis).toBeDefined();
        expect(typeof row?.limit, axis).toBe("string");
        expect(row?.limit, axis).toContain("(C-2026-1120-01)");
        expect(row?.limit, axis).toContain(NOT_RELIED_ON);
        expect(row?.limit, axis).toContain("We have not run the bank again with the corrected method");
      }
    }
  });

  it("the eight banks built by subject-axis-live-run.mjs say they matched the raw page source; watchdog-ingest and harness-fidelity, which stripped script and style first, do not", async () => {
    const { axes } = await served();
    const held = axes.filter((a) => (HELD as readonly string[]).includes(a.axis));
    expect(held.map((a) => a.axis).sort()).toEqual([...HELD].sort());
    expect(held.filter((a) => a.method === LIVE_RUN_METHOD).map((a) => a.axis).sort()).toEqual([...RAW_SOURCE_BANKS].sort());
    for (const row of held) {
      const limit = String(row.limit);
      if (RAW_SOURCE_BANKS.includes(row.axis)) {
        expect(limit, row.axis).toContain("patterns on the raw page source, not on the text a reader sees");
      } else {
        expect(limit, row.axis).not.toMatch(/raw page source/);
        expect(limit, row.axis).toContain("as a plain run of letters");
      }
      expect(limit, row.axis).toContain("so it could match inside other words");
    }
  });

  it("each held limit's counts are its bank file's own: rows cut at exactly 400,000 bytes, distinct pages, near-empty pages and our own endpoints, beside the unchanged status, n and rate", async () => {
    const { axes } = await served();
    for (const axis of HELD) {
      const row = axes.find((a) => a.axis === axis) as Row;
      const b = bank(axis);
      const limit = String(row.limit);
      // The file recounted is the one the row cites.
      expect(row.bank_sha256, axis).toBe(b.sha256);
      // The row keeps the figures the board served; the limit sits beside them.
      expect(row.status, axis).toBe("MEASURED");
      expect(row.n, axis).toBe(b.items.length);
      expect(row.rate, axis).toBe(Math.round((b.items.filter((i) => i.payload.meets_disclosure_bar).length / b.items.length) * 1e4) / 1e4);

      const n = b.items.length;
      const cut = b.items.filter((i) => i.payload.bytes === 400_000).length;
      expect(limit, axis).toContain(`We cut every page at 400,000 bytes before scoring it, and ${cut} of the ${n} rows are recorded at exactly that size.`);

      const pages = new Set(b.items.map((i) => i.payload.final_url ?? i.url)).size;
      if (pages < n) expect(limit, axis).toContain(`Its ${n} rows hold ${pages} distinct pages.`);
      else expect(limit, axis).not.toMatch(/distinct pages/);

      const nearEmpty = b.items.filter((i) => typeof i.payload.bytes === "number" && i.payload.bytes < 3000).length;
      if (nearEmpty === 1) expect(limit, axis).toContain("We kept one page that answered with under 3,000 bytes as a row with all five checks false");
      else {
        expect(nearEmpty, axis).toBe(0);
        expect(limit, axis).not.toMatch(/3,000 bytes/);
      }

      const own = b.items.filter((i) => new URL(i.url).hostname === "councilof.ai").length;
      if (own > 0) {
        expect(own, axis).toBe(5);
        expect(limit, axis).toContain(`Five of the ${n} rows are our own endpoints; without them the bank has ${n - own} rows, under our minimum of 30`);
      } else expect(limit, axis).not.toMatch(/our own endpoints/);
    }
  });
});

describe("G8: the claim-maintenance row rests on neither re-read (C-2026-1120-03)", () => {
  it("GET /api/gspc serves a limit on claim-maintenance citing C-2026-1120-03 that names the row's own n, note and counts and rests the row on neither re-read", async () => {
    for (const search of ["", "?axis=claim-maintenance"]) {
      const row = (await served(search)).axes.find((a) => a.axis === "claim-maintenance");
      expect(row, search || "whole board").toBeDefined();
      expect(typeof row?.limit, search || "whole board").toBe("string");
      const limit = String(row?.limit);
      expect(limit).toContain("(C-2026-1120-03)");
      expect(limit).toContain("The row rests on neither re-read.");
      expect(limit).toContain("none of them should be relied on");
      // The figures the limit names are the ones on the row beside it.
      expect(row?.n).toBe(174);
      expect(limit).toContain(`The n of ${row?.n},`);
      expect(row?.note).toContain("174 of 182 captured claims");
      expect(limit).toContain("'174 of 182 captured claims'");
      expect(row?.per_outcome).toBeDefined();
      expect(limit).toContain("the outcome counts on this row");
      expect(limit).toContain("re-read of 2026-10-28");
      expect(limit).toContain("re-read of 2026-10-30");
    }
  });

  it("the counts the claim-maintenance limit quotes are the two re-read files' own: 182 rows for 91 claims, and 40 of the 91 read differently", async () => {
    type WaveRow = { claim_id: string; outcome: string; captured_at?: string };
    const oldBytes = repoBytes("public/interop/claim-maintenance-wave-2026-10-28.json");
    const oldWave = JSON.parse(oldBytes.toString("utf8")) as { rows: WaveRow[] };
    const newWave = JSON.parse(repoBytes("public/interop/claim-maintenance-wave-2026-10-30.json").toString("utf8")) as { rows: WaveRow[] };
    const row = (await served()).axes.find((a) => a.axis === "claim-maintenance") as Row;
    // The 2026-10-28 file is the one the row cites.
    expect(row.bank_sha256).toBe(sha256(oldBytes));

    const claims = new Set(oldWave.rows.map((r) => r.claim_id));
    expect(oldWave.rows.length).toBe(182);
    expect(claims.size).toBe(91);
    const limit = String(row.limit);
    expect(limit).toContain(`That file counts every claim twice: its ${oldWave.rows.length} rows hold ${claims.size} distinct claims.`);

    // The 2026-10-30 file reads each claim once; compare it with the newer capture of each claim in the earlier file.
    expect(newWave.rows.length).toBe(claims.size);
    const newer = new Map<string, WaveRow>();
    for (const r of oldWave.rows) {
      const seen = newer.get(r.claim_id);
      if (!seen || String(r.captured_at ?? "") > String(seen.captured_at ?? "")) newer.set(r.claim_id, r);
    }
    const differ = newWave.rows.filter((r) => newer.get(r.claim_id)?.outcome !== r.outcome).length;
    expect(differ).toBe(40);
    expect(limit).toContain(`reads the same ${newWave.rows.length} claims once`);
    expect(limit).toContain(`gives a different outcome for ${differ} of them`);
  });
});
