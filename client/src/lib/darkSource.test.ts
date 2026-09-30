import { describe, expect, it } from "vitest";
import { publicSourceUrl } from "./darkSource";

describe("publicSourceUrl", () => {
  it("never links the unavailable GitHub organisations", () => {
    expect(publicSourceUrl("https://github.com/CSOAI-ORG/a2a-governance-bridge-mcp")).toBeNull();
    expect(publicSourceUrl("https://github.com/csoai-org/x")).toBeNull();
    expect(publicSourceUrl("https://github.com/CouncilofAI-CSOAI/y")).toBeNull();
  });
  it("keeps every other source", () => {
    expect(publicSourceUrl("https://pypi.org/project/claimguard/")).toBe("https://pypi.org/project/claimguard/");
    expect(publicSourceUrl("https://github.com/modelcontextprotocol/servers")).toBe("https://github.com/modelcontextprotocol/servers");
    expect(publicSourceUrl(undefined)).toBeNull();
  });
});
