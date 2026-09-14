import { describe, expect, it } from "vitest";
import { REGISTRIES } from "./gspcInstall";

describe("GSPC registry truth", () => {
  it("points listed directories at evidence instead of submission forms", () => {
    const listed = [
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
