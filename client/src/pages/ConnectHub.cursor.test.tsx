import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { Router } from "wouter";
import ConnectHub, { PLATFORMS } from "./ConnectHub";
import { FREE_DOOR } from "./ConnectClaude";

const render = (node: React.ReactNode) => renderToStaticMarkup(<Router ssrPath="/connect">{node}</Router>);

describe("/connect Cursor install link", () => {
  it("renders the generated Cursor deeplink for the free door and keeps its copy-paste fallback", () => {
    const row = PLATFORMS.find((c) => c.id === "cursor")!;
    const html = render(<ConnectHub />);
    const block = html.match(/<details\b[^>]*data-testid="connect-platform-cursor"[^>]*>([\s\S]*?)<\/details>/)?.[1] ?? "";
    const href = (block.match(/<a\b[^>]*data-testid="connect-install-cursor"[^>]*>/)?.[0] ?? "").match(/href="([^"]+)"/)?.[1]?.replaceAll("&amp;", "&") ?? "";
    expect(row.install_action?.kind).toBe("cursor");
    expect(href).toBe(row.install_action!.href);
    const u = new URL(href);
    expect(`${u.protocol}//${u.host}${u.pathname}`).toBe("cursor://anysphere.cursor-deeplink/mcp/install");
    expect(u.searchParams.get("name")).toBe("gspc");
    expect(JSON.parse(atob(u.searchParams.get("config")!))).toEqual({ url: FREE_DOOR });
    expect(block).toContain("Add to Cursor");
    expect(block).toContain('aria-label="Copy: Cursor"');
  });
  it("only the VS Code and Cursor rows carry an install link", () => {
    expect(PLATFORMS.filter((c) => c.install_action).map((c) => c.id).sort()).toEqual(["cursor", "vscode"]);
  });
});
