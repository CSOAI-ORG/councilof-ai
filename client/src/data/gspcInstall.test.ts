import { describe, expect, it } from "vitest";
import { MCP_NATIVE, NON_MCP, REGISTRIES } from "./gspcInstall";

describe("GSPC registry truth", () => {
  it("points listed directories at evidence instead of submission forms", () => {
    const listed = [
      "npm — gspc-card-verifier",
      "npm — @csoai/gspc-cli",
      "Official MCP Registry",
      "A2A agent directories",
      "Smithery",
      "mcp.so",
      "awesome-mcp-servers",
      "Glama",
      "PulseMCP",
    ];

    for (const name of listed) {
      const row = REGISTRIES.find((candidate) => candidate.name === name);
      expect(row, name).toBeDefined();
      expect(row?.status, name).toBe("listed");
      expect(row?.where, name).not.toMatch(/\/submit|\/new$/i);
      expect(row?.note, name).not.toMatch(/submit the|submission by/i);
    }
  });

  it("reports Glama's listing separately from ownership verification", () => {
    const glama = REGISTRIES.find((row) => row.name === "Glama");

    expect(glama).toMatchObject({
      status: "listed",
      where: "https://glama.ai/mcp/connectors/io.github.CSOAI-ORG/gspc",
    });
    expect(glama?.note).toMatch(/ownership remains unverified/i);
  });
});

describe("/connect-gspc install matrix", () => {
  it("offers no npx csoai-gspc-mcp fallback (deprecated on npm; the remote URL is the install)", () => {
    for (const card of [...MCP_NATIVE, ...NON_MCP]) {
      for (const block of card.blocks) {
        expect(block.code, `${card.id}: ${block.label}`).not.toMatch(/csoai-gspc-mcp/);
      }
    }
  });
});

