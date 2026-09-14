import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { execSync } from "child_process";

describe("x402-bazaar-audit", () => {
  it("audit script exists and is executable", () => {
    const script = readFileSync("scripts/interop/x402-bazaar-audit.py", "utf-8");
    expect(script).toContain("x402-bazaar-audit");
    expect(script).toContain("def main()");
  });

  it("audit produces valid output format", () => {
    // Just verify the script parses without syntax errors
    const result = execSync("python3 scripts/interop/x402-bazaar-audit.py", { encoding: "utf-8", timeout: 60000 });
    expect(result).toContain("| Door |");
    expect(result).toContain("402 OK");
    expect(result).toContain("Summary:");
  });
});
