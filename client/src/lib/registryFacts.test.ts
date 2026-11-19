/**
 * Three client surfaces quote the MCP registry entry, and one of them the /mcp tool count.
 *
 * Read 18 Nov 2026: the registry lists ai.councilof/gspc 1.4.4 as active and io.github.CSOAI-ORG/gspc
 * as deprecated, and /mcp lists 54 tools. reachStrip named the deprecated id ("1.1.1") as the official
 * entry; sovExternalAudit's "live" truth named it too and said "HTTP /mcp is seven read tools"; and
 * permissionlessRevenue said the old entry "awaits deprecation". The count now comes from
 * lib/mcpTools' TOOL_COUNT_SENTENCE, which is derived from the files the doors serve.
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const read = (file: string) => readFileSync(resolve(__dirname, file), "utf8");

describe("the registry name and tool count these surfaces quote are the live ones", () => {
  it("names ai.councilof/gspc as the official registry entry", () => {
    expect(read("reachStrip.ts")).toContain('"Official registry ai.councilof/gspc → this URL."');
    expect(read("sovExternalAudit.ts")).toContain(
      "Official registry ai.councilof/gspc (the older io.github.CSOAI-ORG/gspc entry is deprecated)",
    );
  });

  it("never presents the deprecated id as the current one", () => {
    for (const file of ["reachStrip.ts", "sovExternalAudit.ts", "permissionlessRevenue.ts"]) {
      const src = read(file);
      expect(src, file).not.toMatch(/Official (registry|MCP id) io\.github\.CSOAI-ORG\/gspc/);
      expect(src, file).not.toMatch(/awaits deprecation/);
    }
  });

  it("takes the /mcp tool count from the derived sentence, not a typed number", () => {
    const audit = read("sovExternalAudit.ts");
    expect(audit).not.toMatch(/seven read tools/);
    expect(audit).toContain("One server: ${TOOL_COUNT_SENTENCE}");
    expect(audit).toContain('import { TOOL_COUNT_SENTENCE, toolSummary } from "./mcpTools";');
  });
});
