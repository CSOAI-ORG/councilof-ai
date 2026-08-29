import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { DOORS } from "./doors";
import { OS_EMPTY, OS_PROMPT, OS_TOOLS } from "./osChat";

const shell = readFileSync(resolve(__dirname, "OsShell.tsx"), "utf8");
const app = readFileSync(resolve(__dirname, "../../App.tsx"), "utf8");
const launcher = readFileSync(resolve(__dirname, "../../pages/OsLauncher.tsx"), "utf8");

describe("OsShell is the product on / and /os", () => {
  it("uses the five header doors and four tools", () => {
    expect(DOORS.map((d) => d.label)).toEqual(["Board", "Verify", "Space", "Assess", "Harness"]);
    expect(OS_TOOLS).toEqual(["board_totals", "get_axis", "verify_card", "list_cards"]);
    expect(shell).toContain("OS_PROMPT");
    expect(shell).toContain("OS_EMPTY");
    expect(OS_PROMPT).toBe("Paste a card, name an axis, or ask the board.");
    expect(OS_EMPTY).toBe("Free verify. Paste never leaves this browser.");
  });

  it("homepage is the OS product frame, not a marketing poster", () => {
    expect(app).toMatch(/path === '\/' \|\| path === '\/os'/);
    expect(launcher).toContain("<OsShell");
    expect(launcher).toContain('variant="page"');
    expect(shell).toMatch(/Article 50 is in force/);
    expect(shell).toMatch(/We measure marking/);
    expect(shell).toMatch(/We do not certify/);
    expect(shell).not.toMatch(/sov33|SOVOS|lifestyle|GPAI Code/i);
  });

  it("glass only after VALID; paid sign stays gated", () => {
    expect(shell).toContain("<OsGlassCard");
    expect(shell).toContain("<OsSignGate");
  });
});
