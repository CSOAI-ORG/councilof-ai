import { describe, expect, it } from "vitest";
import { MCP_CATALOG } from "./mcpCatalog";

const WATERMARK_FORKS = [
  "csoai-watermark-attest-mcp",
  "csoai-eu-aigc-icon-mcp",
  "watermarking-authenticity-mcp",
  "c2pa-watermark-mcp",
  "agent-content-watermark-mcp",
  "meok-watermark-attest-mcp",
];

describe("one C2PA path", () => {
  it("lists the durable C2PA MCP and hides the extra watermark forks", () => {
    const names = MCP_CATALOG.map((e) => e.name);
    expect(names).toContain("csoai-c2pa-durable-mcp");
    for (const fork of WATERMARK_FORKS) {
      expect(names).not.toContain(fork);
    }
  });
});
