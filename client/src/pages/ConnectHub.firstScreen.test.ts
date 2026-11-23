/**
 * /connect's first screen (22 Nov 2026). Read live with JavaScript off, the page's "Was this helpful?"
 * card came at text offset 449 and the free door's address first at 1543; at 1440 px the address sat
 * 1,186 px down. These checks read the page source in render order. Against master before this change,
 * the first two go red.
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const page = readFileSync(resolve(__dirname, "ConnectHub.tsx"), "utf8");
const claude = readFileSync(resolve(__dirname, "ConnectClaude.tsx"), "utf8");

describe("/connect puts the door before the page furniture", () => {
  it("shows the one-line Claude Code connect in the hero, before the section chips and the DocMeta card", () => {
    const quick = page.indexOf('data-testid="connect-quick-start"');
    const chips = page.indexOf('["#choose", "Choose your starting point"]');
    const meta = page.indexOf("<DocMeta ");
    const header = page.indexOf("</header>");
    expect(quick).toBeGreaterThan(-1);
    expect(quick).toBeLessThan(chips);
    expect(chips).toBeLessThan(meta);
    expect(meta).toBeLessThan(header);
    expect(page.match(/<DocMeta /g)).toHaveLength(1);
  });

  it("renders the command the free door's guide uses, which names the door", () => {
    const block = page.slice(page.indexOf('data-testid="connect-quick-start"'), page.indexOf('["#choose"'));
    expect(block).toContain('<Code tone="ink" label="Free MCP door · Claude Code" text={CLAUDE_CODE_CMD} />');
    const door = claude.match(/export const FREE_DOOR = "([^"]+)"/)?.[1];
    expect(door).toBe("https://councilof.ai/mcp/free");
    expect(claude).toMatch(/export const CLAUDE_CODE_CMD = `claude mcp add --transport http council-of-ai \$\{FREE_DOOR\}`/);
  });

  it("keeps the copy control legible on the dark header", () => {
    expect(page).toMatch(/tone === "ink" \? "ink-kicker" : "text-muted-foreground"/);
    expect(page).toContain("text-[var(--ink-foreground)] transition hover:border-[var(--ink-border-hover)]");
  });
});
