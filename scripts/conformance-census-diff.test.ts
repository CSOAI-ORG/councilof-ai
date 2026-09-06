import { describe, expect, it } from "vitest";
import { execFileSync } from "node:child_process";
import { writeFileSync, mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

/**
 * The diff is the product: a census is one photograph, and the CHANGE between two is the thing
 * nobody else can publish because nobody else took the first one.
 *
 * The case that earns the test is refusal. Handed the 3,520-row conformance census against the
 * 316-row settlement census, an earlier version reported "3204 vanished, 316 stopped conforming,
 * 316 prices moved to null" — every number confident, every number meaningless, because those are
 * different populations with different field names. A diff that cannot tell it is comparing unlike
 * things publishes nonsense with a straight face.
 */
const SCRIPT = resolve(__dirname, "conformance-census-diff.mjs");
const dir = mkdtempSync(join(tmpdir(), "census-diff-"));
const row = (host: string, o: Record<string, unknown> = {}) =>
  JSON.stringify({ host, conformant: true, amount: "1000", pay_to: "0xAAA", ...o });
const write = (name: string, lines: string[]) => {
  const p = join(dir, name);
  writeFileSync(p, lines.join("\n"));
  return p;
};
const run = (from: string, to: string, out?: string) => {
  try {
    const args = [SCRIPT, "--from", from, "--to", to, ...(out ? ["--out", out] : [])];
    return { ok: true, stdout: execFileSync("node", args, { encoding: "utf8" }) };
  } catch (e: any) {
    return { ok: false, stdout: String(e.stdout ?? ""), stderr: String(e.stderr ?? "") };
  }
};

describe("conformance census diff", () => {
  const base = ["a.example", "b.example", "c.example", "d.example"].map((h) => row(h));

  it("counts arrivals, departures, conformance flips and price moves — and nothing else", () => {
    const from = write("from.jsonl", base);
    const to = write("to.jsonl", [
      row("a.example", { amount: "1500" }),        // price moved
      row("b.example", { conformant: false }),     // stopped conforming
      row("c.example"),                            // unchanged
      // d.example vanished
      row("e.example"),                            // arrived
    ]);
    const out = join(dir, "d.json");
    const r = run(from, to, out);
    expect(r.ok, r.stderr).toBe(true);
    const d = JSON.parse(readFileSync(out, "utf8"));
    expect(d.change.arrived).toBe(1);
    expect(d.change.vanished).toBe(1);
    expect(d.change.stopped_conforming).toBe(1);
    expect(d.change.price_moved).toBe(1);
    expect(d.change.started_conforming).toBe(0);
    expect(d.price_moved[0]).toMatchObject({ host: "a.example", from: "1000", to: "1500" });
  });

  it("REFUSES two snapshots that are not both conformance censuses", () => {
    const good = write("g.jsonl", base);
    const wrongShape = write("w.jsonl", [JSON.stringify({ host: "a.example", settle_tx: "0x1" })]);
    const r = run(good, wrongShape);
    expect(r.ok, "a diff against a different schema must not succeed").toBe(false);
    expect(r.stderr).toMatch(/REFUSING/);
    expect(r.stderr).toMatch(/do not look like two conformance censuses/);
  });

  it("REFUSES two censuses of different populations", () => {
    const from = write("p1.jsonl", base);
    const to = write("p2.jsonl", ["x1", "x2", "x3", "x4"].map((h) => row(`${h}.other`)));
    const r = run(from, to);
    expect(r.ok).toBe(false);
    expect(r.stderr, "scope change must not be reported as churn").toMatch(/different populations/);
  });

  it("REFUSES an unreadable snapshot rather than diffing against nothing", () => {
    const good = write("g2.jsonl", base);
    const empty = write("empty.jsonl", ["", "   "]);
    const r = run(good, empty);
    expect(r.ok).toBe(false);
    expect(r.stderr).toMatch(/parsed to zero rows/);
  });

  it("says what a two-point comparison cannot support", () => {
    const from = write("f2.jsonl", base);
    const to = write("t2.jsonl", base);
    const out = join(dir, "d2.json");
    run(from, to, out);
    const d = JSON.parse(readFileSync(out, "utf8"));
    expect(d.what_this_is_not.join(" ")).toMatch(/Two observations, not a trend/);
    expect(d.what_this_is_not.join(" ")).toMatch(/not a judgement of any host/i);
  });
});
