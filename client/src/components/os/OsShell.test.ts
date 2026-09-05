import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { DOORS } from "./doors";
import { OS_TOOLS } from "./osChat";

const shell = readFileSync(resolve(__dirname, "OsShell.tsx"), "utf8");
const app = readFileSync(resolve(__dirname, "../../App.tsx"), "utf8");

describe("OsShell is not the homepage or canonical workspace", () => {
  it("keeps four tools in the unused shell", () => {
    expect(DOORS.map((d) => d.label)).toEqual(["Board", "Verify", "Space", "Assess", "Harness"]);
    expect(OS_TOOLS).toEqual(["board_totals", "get_axis", "verify_card", "list_cards"]);
    expect(shell).not.toMatch(/sov33|SOVOS|lifestyle|GPAI Code/i);
  });

  it("homepage is verify; top-level /os converges on the dashboard", () => {
    expect(app).toContain("HomeVerify");
    expect(app).toContain("ToolsPage");
    expect(app).not.toContain("return <OsLauncher />");
    expect(app).not.toContain('import OsLauncher from "./pages/OsLauncher"');
    expect(app).toContain('p.set("tab", lobby)');
    expect(app).toContain('return <Redirect to={"/dashboard?" + p.toString()} />');
    expect(app).toContain("there is no second embedded Council OS");
  });

  it("glass only after VALID; paid sign stays gated", () => {
    expect(shell).toContain("<OsGlassCard");
    expect(shell).toContain("<OsSignGate");
  });
});
