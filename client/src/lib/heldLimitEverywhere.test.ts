/**
 * Every surface that prints a figure from a GET /api/gspc row prints that row's limit beside it (24 Nov 2026).
 *
 * Read live that day, after #4821 fixed /board/ and /independence/: /for/enterprise/, /for/finance/,
 * /for/regulator/, /for/sec-filer/ (AxisProof), /insurers/ and /axes printed governance's 58.7% and n of 237
 * with no limit beside them, though the row has carried one since #4680 and its bank is held. The scoreboard,
 * the board terminal, the benchmark index and the lobby's evidence and embed panes printed the same row the
 * same way, and the lobby's board reader dropped the field before any pane could see it.
 * Against master's files the helper, the reader, the evidence index and every renderer check go red.
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import { describe, expect, it } from "vitest";
import * as cells from "./axisCells";
import { composeEvidenceIndex } from "@/components/lobby/evidenceIndex";
import type { WireAxis, WireBoard } from "@/components/lobby/boardWire";

const ROOT = resolve(__dirname, "../../..");
const read = (p: string) => readFileSync(resolve(ROOT, p), "utf8");
const LIMIT = "The item wording gives the risk tier away, so this axis shows agreement with this bank's labels only.";
const heldLimit = (cells as unknown as { heldLimit?: (a: object) => string | null }).heldLimit;

function sources(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) return sources(p);
    return /\.(ts|tsx)$/.test(name) && !/\.test\.(ts|tsx)$/.test(name) ? [p] : [];
  });
}

describe("heldLimit reads a row's limit and nothing else", () => {
  it("returns the limit of a held row and null for any other row", () => {
    expect(typeof heldLimit).toBe("function");
    expect(heldLimit!({ axis: "governance", limit: `  ${LIMIT} ` })).toBe(LIMIT);
    expect(heldLimit!({ axis: "safety" })).toBeNull();
    expect(heldLimit!({ axis: "safety", limit: "   " })).toBeNull();
    expect(heldLimit!({ axis: "safety", limit: 3 })).toBeNull();
  });
});

describe("the lobby keeps the limit from the wire to the evidence index", () => {
  it("its board reader carries limit", () => {
    expect(read("client/src/components/lobby/boardWire.ts")).toMatch(/limit: typeof w\.limit === "string"/);
  });

  it("the evidence index row for a held axis carries its limit, and an unheld row carries none", () => {
    const axis = (over: Partial<WireAxis>): WireAxis => ({
      axis: "governance", bench: "GovBench", task: "risk-tier classification", n: 237, accuracy: 0.587,
      leader: "mistral:7b", separation: "TIE", status: "MEASURED", ...over,
    });
    const held = axis({ limit: LIMIT } as Partial<WireAxis>);
    const free = axis({ axis: "safety", bench: "DefBench", n: 36, accuracy: 0.944 });
    const board: WireBoard = {
      axes: [held, free], inLane: [], publicCount: "", measuredOn: "2026-11-24", issuer: "CSOAI Ltd",
      doi: "", license: "CC-BY-4.0", limitations: [],
    } as unknown as WireBoard;
    const index = composeEvidenceIndex({ board, included: [held, free], system: "s", provider: "p", now: "2026-11-24T00:00:00Z" } as never);
    const rows = JSON.stringify(index);
    expect(rows).toContain(LIMIT);
    expect(rows.split(LIMIT).length - 1).toBe(1);
  });
});

describe("every renderer of a board figure prints the row's limit", () => {
  const renderers: Record<string, RegExp> = {
    "client/src/components/AxisProof.tsx": /Held: \{lim\}/,
    "client/src/pages/Insurers.tsx": /Held: \{lim\}/,
    "client/src/pages/GspcScoreboard.tsx": /Held: \{lim\}/,
    "client/src/components/board/GspcTerminal.tsx": /Held: \{lim\}/,
    "client/src/pages/BenchmarkIndex.tsx": /Held: \{heldLimit\(a\)\}/,
    "client/src/components/lobby/LobbyEvidencePane.tsx": /Held: \{heldLimit\(a\)\}/,
    "client/src/components/lobby/LobbyEmbedPane.tsx": /Held: \{heldLimit\(chosen\)\}/,
  };
  for (const [file, printed] of Object.entries(renderers)) {
    it(file, () => {
      const src = read(file);
      expect(src).toMatch(/heldLimit\(/);
      expect(src).toMatch(printed);
    });
  }

  it("the scoreboard prints it in the table and in the focused axis", () => {
    const src = read("client/src/pages/GspcScoreboard.tsx");
    expect(src).toMatch(/Held: \{lim\}/);
    expect(src).toMatch(/Held: \{heldLimit\(focused\)\}/);
  });

  it("any file that formats a board row's accuracy also prints its limit", () => {
    const missing = sources(resolve(ROOT, "client/src"))
      .filter((f) => !f.endsWith("axisCells.ts"))
      .filter((f) => /\baccuracyCell\(/.test(readFileSync(f, "utf8")))
      .filter((f) => !/\bheldLimit\(/.test(readFileSync(f, "utf8")))
      .map((f) => relative(ROOT, f));
    expect(missing).toEqual([]);
  });
});
