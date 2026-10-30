import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import NpmMcpLiveBadge, { NPM_MCP_BADGE_ALT } from "./NpmMcpLiveBadge";

describe("live npm/MCP package proof", () => {
  it("uses npm's live monthly badge without freezing a count into HTML", () => {
    const html = renderToStaticMarkup(<NpmMcpLiveBadge />);
    expect(html).toContain('src="https://img.shields.io/npm/dm/csoai-gspc-mcp');
    expect(html).toContain('href="https://www.npmjs.com/package/csoai-gspc-mcp"');
    expect(NPM_MCP_BADGE_ALT).toMatch(/including automated installs/);
    expect(html).toContain("reported downloads, not unique users");
    expect(html.replace(/<[^>]*>/g, "")).not.toMatch(/\d/);
  });
});
