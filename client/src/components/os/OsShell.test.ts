import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { DOORS } from "./doors";
import { OS_TOOLS } from "./osChat";

const shell = readFileSync(resolve(__dirname, "OsShell.tsx"), "utf8");
const app = readFileSync(resolve(__dirname, "../../App.tsx"), "utf8");
const launcher = readFileSync(resolve(__dirname, "../../pages/OsLauncher.tsx"), "utf8");

describe("OsShell is not the homepage or /os directory", () => {
  it("keeps four tools in the unused shell", () => {
    expect(DOORS.map((d) => d.label)).toEqual(["Board", "Verify", "Space", "Assess", "Harness"]);
    expect(OS_TOOLS).toEqual(["board_totals", "get_axis", "verify_card", "list_cards"]);
    expect(shell).not.toMatch(/sov33|SOVOS|lifestyle|GPAI Code/i);
  });

  it("homepage is verify; /os is a directory of real pages", () => {
    expect(app).toContain("HomeVerify");
    expect(app).toContain("ToolsPage");
    expect(app).toContain('<Redirect to="/os" />');
    expect(launcher).toContain('data-testid="os-directory"');
    expect(launcher).toContain("/gspc-verify");
    expect(launcher).toContain("/assess");
    expect(launcher).not.toMatch(/<OsShell|import OsShell/);
  });

  it("glass only after VALID; paid sign stays gated", () => {
    expect(shell).toContain("<OsGlassCard");
    expect(shell).toContain("<OsSignGate");
  });
});
