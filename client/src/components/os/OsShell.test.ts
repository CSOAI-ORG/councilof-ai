import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { DOORS } from "./doors";
import { OS_EMPTY, OS_PROMPT, OS_TOOLS } from "./osChat";

const shell = readFileSync(resolve(__dirname, "OsShell.tsx"), "utf8");
const header = readFileSync(resolve(__dirname, "OsHeader.tsx"), "utf8");
const app = readFileSync(resolve(__dirname, "../../App.tsx"), "utf8");
const launcher = readFileSync(resolve(__dirname, "../../pages/OsLauncher.tsx"), "utf8");

describe("OsShell is the product on / and /os", () => {
  it("uses the five header doors and four tools", () => {
    expect(DOORS.map((d) => d.label)).toEqual(["Board", "Verify", "Space", "Assess", "Harness"]);
    expect(OS_TOOLS).toEqual(["board_totals", "get_axis", "verify_card", "list_cards"]);
    expect(shell).toContain("OS_PROMPT");
    expect(shell).toContain("OS_EMPTY");
    expect(OS_PROMPT).toBe("Paste a signed card, or say what you use AI for.");
    expect(OS_EMPTY).toBe("Free verify. Paste never leaves this browser.");
    expect(shell).toContain('id="os-chat"');
    expect(shell).toContain('data-testid="os-tabs"');
    expect(shell).toContain('data-testid="os-chips"');
    expect(shell).toContain("I was sent a card");
    expect(shell).toContain("I use AI at work");
    expect(shell).toContain("Show the board");
    expect(shell).not.toContain("showTabs");
    expect(shell).not.toMatch(/GET \/api\/gspc/);
    expect(header).toContain('getElementById("os-chat")');
    expect(header).toContain("Chat is Council OS");
  });

  it("homepage is the OS product frame, not a marketing poster", () => {
    expect(app).toMatch(/path === '\/' \|\| path === '\/os'/);
    expect(launcher).toContain("<OsShell");
    expect(launcher).toContain('variant="page"');
    expect(shell).toMatch(/Check an AI claim/);
    expect(shell).toMatch(/We do not certify you/);
    expect(shell).toMatch(/Marking rules are in force/);
    expect(shell).not.toMatch(/sov33|SOVOS|lifestyle|GPAI Code/i);
    expect(shell).toContain("{door ?");
  });

  it("glass only after VALID; paid sign stays gated", () => {
    expect(shell).toContain("<OsGlassCard");
    expect(shell).toContain("<OsSignGate");
  });
});
