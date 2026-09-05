import { describe, expect, it } from "vitest";
import { MCP_NATIVE, REGISTRIES, type PlatformCard } from "./gspcInstall";

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

  /**
   * WHAT `verified` MEANS HERE, and why the distinction matters. The file header defines it:
   * "Every config block here was verified against the platform's CURRENT official docs
   * (Sept 2026); the docUrl is the page it was checked against." It is a DOCS confirmation,
   * not a tested host connection — WP-4 asks for actual host support to be tested, and this
   * flag does not claim that.
   *
   * The page is already careful: ConnectGSPC renders NO badge for a verified card and an
   * explicit "Unverified shape" warning for the others, so it never asserts "Verified" at a
   * reader. Audited 2026-09-05 and found correct; this pins the property that makes it
   * checkable rather than trusting it to stay that way.
   */
  it("every verified card names the doc page it was checked against", () => {
    const unevidenced = MCP_NATIVE.filter(
      (p: PlatformCard) => p.verified && !/^https?:\/\//.test(p.docUrl ?? ""),
    ).map((p) => p.id);
    expect(
      unevidenced,
      `these cards claim verified with no docUrl: ${unevidenced.join(", ")}. "Verified" here ` +
        `means the config was checked against the platform's official docs, so a card without ` +
        `the page it was checked against is an unfalsifiable claim. Add the docUrl, or set ` +
        `verified:false and let the page label it unverified.`,
    ).toEqual([]);
  });
});
