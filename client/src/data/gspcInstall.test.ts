import { describe, expect, it } from "vitest";
import { REGISTRIES } from "./gspcInstall";

describe("GSPC registry truth", () => {
  it("keeps Glama staged against the searchable directory", () => {
    const glama = REGISTRIES.find((row) => row.name === "Glama");

    expect(glama).toMatchObject({
      status: "staged",
      where: "https://glama.ai/mcp/servers?query=csoai",
    });
    expect(glama?.note).toMatch(/other CSOAI servers are listed/i);
    expect(JSON.stringify(glama)).not.toContain(
      "glama.ai/mcp/connectors/io.github.CSOAI-ORG/gspc",
    );
  });
});
