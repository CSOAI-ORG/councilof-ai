import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import { AXES_FIN } from "./_gspc_axes_fin";

// WHY THIS EXISTS
// Two rows asserted values their own evidence_url artifact contradicted. The board said
// ai-adoption-components was "two Eurostat series (13.48% / 41.17% 2024)" with n=2 while
// the linked run said n=1 and carried 55.03; labour-components said "Eurostat" and
// "participation 57.58%" while the run fetched api.worldbank.org and had the
// participation series UNREACHABLE. Nothing compared the two, because the row's numbers
// came from one producer (hardcoded literals) and the artifact from another (a live
// fetch), both writing the same claim.
//
// So: every percent and every year a row prints must be a cell of the run behind its own
// evidence_url, and n and bench must agree with it. A number that is right about some
// other source is still wrong here.

const REPO = path.resolve(__dirname, "..", "..");

type Cell = { series?: string; status?: string; value?: number; year?: string | number };
type Run = { n?: number; bench?: string; measured?: Cell[]; tally?: Record<string, number> };

const SERIES_ROWS = AXES_FIN.filter((a) =>
  String(a.evidence_url ?? "").includes("financial-measure-run-") &&
  ["ai-adoption-components", "labour-components"].includes(a.axis),
);

function loadRun(evidenceUrl: string): Run {
  return JSON.parse(readFileSync(path.join(REPO, "public", evidenceUrl.replace(/^\//, "")), "utf8"));
}

describe("financial series rows quote their own run artifact", () => {
  it("covers both series axes (a silently empty sweep is not a pass)", () => {
    expect(SERIES_ROWS.map((a) => a.axis).sort()).toEqual([
      "ai-adoption-components",
      "labour-components",
    ]);
  });

  for (const axis of SERIES_ROWS) {
    describe(axis.axis, () => {
      const run = loadRun(String(axis.evidence_url));
      const measured = (run.measured ?? []).filter((m) => m.status === "MEASURED");
      const note = String(axis.note ?? "");

      it("n matches the artifact", () => {
        expect(axis.n).toBe(run.n);
      });

      it("n equals the count of MEASURED cells", () => {
        expect(run.n).toBe(measured.length);
      });

      it("bench matches the artifact's own bench", () => {
        if (run.bench) expect(axis.bench).toBe(run.bench);
      });

      it("every percent the row prints is a MEASURED value in the artifact", () => {
        const printed = [...note.matchAll(/(\d+(?:\.\d+)?)%/g)].map((m) => Number(m[1]));
        expect(printed.length).toBeGreaterThan(0);
        const allowed = measured.map((m) => Number(m.value));
        for (const p of printed) {
          // Compare at the precision the row prints, so 6.0% matches a 6.0 cell.
          expect(allowed.some((v) => Math.abs(v - p) < 0.005)).toBe(true);
        }
      });

      it("every MEASURED value in the artifact appears in the row", () => {
        for (const cell of measured) {
          const v = Number(cell.value);
          const printed = [...note.matchAll(/(\d+(?:\.\d+)?)%/g)].map((m) => Number(m[1]));
          expect(printed.some((p) => Math.abs(v - p) < 0.005)).toBe(true);
        }
      });

      it("every year the artifact records appears in the row", () => {
        for (const cell of measured) {
          expect(note).toContain(String(cell.year));
        }
      });

      it("a cell the artifact could not measure is never printed as a number", () => {
        const unmeasured = (run.measured ?? []).filter((m) => m.status !== "MEASURED");
        for (const cell of unmeasured) {
          expect(cell.value).toBeUndefined();
          // An UNCHECKABLE/UNREACHABLE series must be said, not quietly dropped.
          expect(note.toUpperCase()).toContain(String(cell.status));
        }
      });
    });
  }
});
