/**
 * /connect — "GSPC in your platform" (master plugin plan C6, 2026-09-30).
 *
 * The blocks come from distribution/connect/connect-matrix.json (rendered by scripts/harness-x/render.mjs from
 * council-os/distribution.json). Held here: every client in the matrix is on the page with its exact snippet, every
 * snippet names only the two doors, and the committed live check (scripts/harness-x/connect-live.mjs) covered every
 * block and passed. The 375 px layout is checked in a real browser at preview time, not here.
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { Router } from "wouter";
import ConnectHub, { FULL_DOOR, PLATFORMS } from "./ConnectHub";
import { FREE_DOOR } from "./ConnectClaude";

const root = resolve(__dirname, "../../..");
const json = (p: string) => JSON.parse(readFileSync(resolve(root, p), "utf8"));
const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#x27;");
const html = renderToStaticMarkup(<Router ssrPath="/connect"><ConnectHub /></Router>);

describe("/connect: GSPC in your platform", () => {
  it("carries every client in the matrix, at least fifteen, each with its exact snippet", () => {
    const matrix = json("distribution/connect/connect-matrix.json") as { clients: { id: string; platform: string; snippet: string }[] };
    expect(PLATFORMS.map((c) => c.id)).toEqual(matrix.clients.map((c) => c.id));
    expect(PLATFORMS.length).toBeGreaterThanOrEqual(15);
    for (const c of matrix.clients) {
      expect(html, c.id).toContain(`data-testid="connect-platform-${c.id}"`);
      expect(html, c.id).toContain(`GSPC for ${esc(c.platform)}`);
      expect(html, c.id).toContain(esc(c.snippet));
    }
  });

  it("every snippet names only the two doors, and the one its row declares", () => {
    for (const c of PLATFORMS) {
      const urls = [...c.snippet.matchAll(/https:\/\/councilof\.ai[^\s"')]*/g)].map((m) => m[0]);
      expect(urls.length, c.id).toBeGreaterThan(0);
      for (const u of urls) expect([FREE_DOOR, FULL_DOOR], `${c.id}: ${u}`).toContain(u);
      expect(c.snippet, c.id).toContain(c.door === "full" ? FULL_DOOR : FREE_DOOR);
    }
  });

  it("the committed live check covered every block and every block passed", () => {
    const check = json("distribution/connect/connect-live-check.json") as { clients: { id: string; state: string }[]; doors: Record<string, { state: string }> };
    expect(check.clients.map((c) => c.id).sort()).toEqual(PLATFORMS.map((c) => c.id).sort());
    expect(check.clients.filter((c) => c.state !== "PASS")).toEqual([]);
    expect(Object.keys(check.doors).sort()).toEqual([FULL_DOOR, FREE_DOOR].sort());
  });

  it("no price and no status claim in any block", () => {
    for (const c of PLATFORMS) {
      expect(c.snippet, c.id).not.toMatch(/[$£€]\s?\d/);
      expect(`${c.snippet} ${c.where}`, c.id).not.toMatch(/\b(certified|compliant|approved)\b/i);
    }
  });
});
