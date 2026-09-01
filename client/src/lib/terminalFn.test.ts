import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  axisFromFn,
  censusNote,
  correctionsNote,
  looksLikeHubId,
  parseTerminal,
  TERMINAL_FN_RULING,
  TERMINAL_FNS,
  TERMINAL_HINT,
} from "./terminalFn";

const home = readFileSync(resolve(__dirname, "../components/home/HomeComposer.tsx"), "utf8");
const os = readFileSync(resolve(__dirname, "../pages/OsLauncher.tsx"), "utf8");

describe("terminal functions", () => {
  it("parses Bloomberg keys and a bare Hub id as census", () => {
    expect(TERMINAL_FN_RULING).toMatch(/DISCOVERED, never MEASURED/);
    expect(TERMINAL_FNS).toEqual(["VERIFY", "BOARD", "AXIS", "CENSUS", "CORRECT", "WATCH", "COMPUTE", "HELP"]);
    expect(parseTerminal("BOARD").fn).toBe("BOARD");
    expect(parseTerminal("AXIS jail").fn).toBe("AXIS");
    expect(axisFromFn(parseTerminal("AXIS jail"))).toBe("jail");
    expect(parseTerminal("CORRECT").fn).toBe("CORRECT");
    expect(parseTerminal("CENSUS gpt2").fn).toBe("CENSUS");
    expect(looksLikeHubId("Qwen/Qwen3.8-27B")).toBe(true);
    expect(parseTerminal("Qwen/Qwen3.8-27B")).toEqual({
      fn: "CENSUS",
      arg: "Qwen/Qwen3.8-27B",
      paste: "hub-id",
    });
    expect(looksLikeHubId("hello there")).toBe(false);
    expect(censusNote("gpt2")).toMatch(/DISCOVERED/);
    expect(censusNote("gpt2")).toMatch(/not MEASURED/);
    expect(correctionsNote(30)).toMatch(/30 addenda/);
    expect(correctionsNote(30)).toMatch(/not a wellness score/);
    expect(TERMINAL_HINT).toMatch(/VERIFY/);
    expect(TERMINAL_HINT).toMatch(/COMPUTE/);
    expect(parseTerminal("COMPUTE").fn).toBe("COMPUTE");
  });

  it("treats card JSON as VERIFY and does not invent a sold rank", () => {
    const card = '{"id":"abc","signature":"x","body":{}}';
    expect(parseTerminal(card).fn).toBe("VERIFY");
    expect(parseTerminal(`VERIFY ${card}`).paste).toBe("card");
    const blob = JSON.stringify({ TERMINAL_FN_RULING, TERMINAL_HINT, TERMINAL_FNS });
    expect(blob).not.toMatch(/£79|£499|rank for sale|22\/22|dorado|cibola|sovos/i);
    expect(home).toContain("parseTerminal");
    expect(os).toContain("parseTerminal");
  });
});
