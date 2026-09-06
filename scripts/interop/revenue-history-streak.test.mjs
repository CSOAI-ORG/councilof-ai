import { describe, expect, it } from "vitest";
import { execFileSync } from "node:child_process";
import { resolve } from "node:path";

/**
 * The zero-buyer streak in public/interop/revenue-history.json.
 *
 * WHY IT EXISTS. The estate's gates are written against TIME, not against a reading: "0 for 30
 * days: the shape or the price is wrong, do not add doors"; ">=1 repeat: open the next door".
 * pull-revenue-history.py collected the series and published it, and derived none of that — the
 * document existed to answer a question it did not answer.
 *
 * WHY THE NULL RULE IS THE WHOLE POINT. `all_time: null` means the endpoint had no source that
 * day. We did not observe zero buyers; we observed nothing. Counting a null as a zero
 * manufactures evidence for "the price is wrong" out of a day we failed to read — the estate's
 * standing rule that absent is never zero, applied to a series instead of a cell.
 *
 * This drives build() directly. main() writes public/interop/revenue-history.json, and a test
 * that overwrites a published artefact to check a number is a worse bug than the one it catches.
 */
const SCRIPT = resolve(import.meta.dirname, "pull-revenue-history.py");

/** Run build() over a synthetic series of all_time values; return the derived document. */
function derive(values) {
  const py = `
import json, importlib.util, sys
spec = importlib.util.spec_from_file_location("m", ${JSON.stringify(SCRIPT)})
m = importlib.util.module_from_spec(spec); spec.loader.exec_module(m)
vals = json.loads(sys.argv[1])
text = "\\n".join(json.dumps({
    "date": "2026-09-%02d" % (i + 1),
    "fetched_at": "2026-09-%02dT00:00:00Z" % (i + 1),
    "one_number": {"definition": "distinct non-self x402 payers", "status": "MEASURED",
                   "all_time": v, "last_30d": v, "settlements": 1, "self_settlements": 1},
    "settled_usdc": {"value": None},
}) for i, v in enumerate(vals))
d = m.build(text)
print(json.dumps({k: d[k] for k in ("days", "consecutive_days_at_zero_buyers",
                                    "streak_stopped_at", "days_unreadable", "days_with_a_buyer")}))
`;
  return JSON.parse(execFileSync("python3", ["-c", py, JSON.stringify(values)], { encoding: "utf8" }));
}

describe("revenue-history derives the zero-buyer streak the gates are written against", () => {
  it("counts an unbroken run of observed zeros", () => {
    const d = derive([0, 0, 0, 0]);
    expect(d.days).toBe(4);
    expect(d.consecutive_days_at_zero_buyers).toBe(4);
    expect(d.streak_stopped_at).toBeNull();
    expect(d.days_with_a_buyer).toEqual([]);
  });

  it("stops at a buyer and names the day, so the streak cannot outrun the evidence", () => {
    const d = derive([0, 3, 0, 0]);
    expect(d.consecutive_days_at_zero_buyers).toBe(2);
    expect(d.streak_stopped_at).toMatchObject({ date: "2026-09-02", all_time: 3, kind: "a buyer" });
    expect(d.days_with_a_buyer).toEqual(["2026-09-02"]);
  });

  it("a null day stops the walk and is named UNREADABLE, never counted as a zero", () => {
    const d = derive([0, null, 0, 0]);
    expect(d.consecutive_days_at_zero_buyers, "a day we could not read is not a day at zero").toBe(2);
    expect(d.streak_stopped_at).toMatchObject({ date: "2026-09-02", all_time: null, kind: "unreadable" });
    expect(d.days_unreadable).toBe(1);
    expect(d.days_with_a_buyer).toEqual([]);
  });

  it("when the LATEST day is unreadable the current run is null, never 0", () => {
    const d = derive([0, 0, 0, null]);
    expect(d.consecutive_days_at_zero_buyers,
      "reporting 0 here would say 'the streak just broke' about a day nobody read").toBeNull();
    expect(d.streak_stopped_at).toMatchObject({ kind: "unreadable" });
  });

  it("a buyer today ends the streak at 0 and lists the day", () => {
    const d = derive([0, 0, 0, 2]);
    expect(d.consecutive_days_at_zero_buyers).toBe(0);
    expect(d.days_with_a_buyer).toEqual(["2026-09-04"]);
  });

  it("false is not zero — a boolean must never be read as a count", () => {
    const d = derive([0, 0]);
    expect(d.consecutive_days_at_zero_buyers).toBe(2);
  });
});
