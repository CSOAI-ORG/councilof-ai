/**
 * /connect and the first screen's three ways in (front-end audit 2026-09-30, findings #1 and #3).
 *
 * Every assertion reads the thing it is about: the served tool file, the served agent card, the
 * route table, the IA list, the prerender list — never a number typed into this test.
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { Router } from "wouter";
import ConnectHub, { A2A_ENDPOINT, FULL_DOOR, PLATFORMS } from "./ConnectHub";
import { FREE_DOOR } from "./ConnectClaude";
import HomeHero from "../components/home/HomeHero";
import HomeWaysIn from "../components/home/HomeWaysIn";
import FREE_TOOLS from "../../../functions/mcp/gspc-tools.json";

const here = resolve(__dirname);
const root = resolve(here, "../../..");
const read = (p: string) => readFileSync(resolve(root, p), "utf8");
const render = (node: React.ReactNode) => renderToStaticMarkup(<Router ssrPath="/connect">{node}</Router>);
const stripComments = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");

describe("/connect is the connector hub, not a withdrawal notice", () => {
  const app = stripComments(read("client/src/App.tsx"));

  it("routes /connect to ConnectHub", () => {
    expect(app).toMatch(/<Route path="\/connect" component=\{ConnectHub\} \/>/);
    expect(app).not.toMatch(/<Route path="\/connect" component=\{ContentReviewNotice\} \/>/);
  });

  it("is a primary path (no archive banner) and is prerendered", () => {
    expect(stripComments(read("client/src/data/library-ia.ts"))).toMatch(/"\/connect",/);
    // A real list entry on its own line — a comment naming the path cannot satisfy this.
    expect(read("scripts/prerender.mjs")).toMatch(/^\s*"\/connect",\s*$/m);
  });

  it("lists exactly the tools the free door serves, by name", () => {
    const html = render(<ConnectHub />);
    const served = (FREE_TOOLS as { tools: { name: string }[] }).tools.map((t) => t.name);
    expect(served.length).toBeGreaterThan(0);
    for (const name of served) expect(html).toContain(`>${name}</code>`);
    expect(html).toContain(`these ${served.length} tools`);
    expect(html).toContain(FREE_DOOR);
    expect(html).toContain(FULL_DOOR);
  });

  it("renders the generated VS Code install href and keeps its copy-paste fallback", () => {
    const row = PLATFORMS.find((c) => c.id === "vscode")!;
    const html = render(<ConnectHub />);
    const block = html.match(/<details\b[^>]*data-testid="connect-platform-vscode"[^>]*>([\s\S]*?)<\/details>/)?.[1] ?? "";
    const tag = block.match(/<a\b[^>]*data-testid="connect-install-vscode"[^>]*>/)?.[0] ?? "";
    const href = tag.match(/href="([^"]+)"/)?.[1] ?? "";
    expect(row.install_action?.kind).toBe("vscode");
    expect(href).toBe(row.install_action!.href);
    expect(href).toMatch(/^vscode:mcp\/install\?/);
    const servers = JSON.parse(row.snippet).servers;
    expect(Object.keys(servers)).toEqual(["gspc"]);
    expect(JSON.parse(decodeURIComponent(href.slice("vscode:mcp/install?".length)))).toEqual({ name: "gspc", ...servers.gspc });
    expect(block).toContain("Add to VS Code");
    expect(block).toContain('aria-label="Copy: VS Code (GitHub Copilot agent mode)"');
    expect(block).toContain(row.snippet.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#x27;"));
    expect(PLATFORMS.filter((c) => c.id !== "vscode").every((c) => c.install_action === undefined)).toBe(true);
    expect(html.match(/data-testid="connect-install-/g)).toHaveLength(1);
  });

  it("names the A2A endpoint the served agent card declares", () => {
    const card = JSON.parse(read("public/.well-known/agent.json")) as {
      supportedInterfaces: { url: string; protocolVersion: string }[];
    };
    expect(card.supportedInterfaces.map((i) => i.url)).toContain(A2A_ENDPOINT);
    const html = render(<ConnectHub />);
    const v = card.supportedInterfaces.find((i) => i.url === A2A_ENDPOINT)!.protocolVersion;
    expect(html).toContain(`A2A protocol ${v}`);
  });

  it("offers the free verifier and never a price or a certificate", () => {
    const html = render(<ConnectHub />);
    expect(html).toContain("verify-card.mjs --all");
    expect(html).toContain("We measure; we do not certify.");
    expect(html).not.toMatch(/[$£€]\s?\d/);
    expect(html).not.toMatch(/\bcertified\b/i);
  });
});

describe("the home page says how to use it", () => {
  it("offers Ask, Connect and Verify, each to a live route", () => {
    const html = renderToStaticMarkup(<Router ssrPath="/"><HomeWaysIn /></Router>);
    for (const [id, href] of [
      ["hero-cta-ask", "/dashboard"],
      ["hero-cta-connect", "/connect/"],
      ["hero-cta-verify", "/gspc-verify"],
    ]) {
      const tag = html.match(new RegExp(`<a[^>]*data-testid="${id}"[^>]*>`))?.[0] ?? "";
      expect(tag, id).toContain(`href="${href}"`);
    }
  });

  it("says what we do in plain words: agents and endpoints, signed vs unsigned vs untested, corrections public", () => {
    const html = renderToStaticMarkup(<Router ssrPath="/"><HomeHero /></Router>);
    expect(html).toContain("agents and the endpoints they call");
    expect(html).toContain("signed cards, unsigned evidence and untested work");
    expect(html).toContain("corrections stay public");
    // Not every result is signed; the hero must not say so.
    expect(html).not.toContain("Every result is signed");
  });
});

describe("the type floor", () => {
  const css = read("client/src/styles/index.css");
  it("sets the kicker at 12px and floors every arbitrary sub-12px size on phones", () => {
    expect(css).toMatch(/\.t-kicker \{[\s\S]*?font-size: 0\.75rem;/);
    const phone = css.match(/@media \(max-width: 639\.98px\) \{([\s\S]*?)\}/)?.[1] ?? "";
    for (const z of ["9px", "10px", "11px", "11\\.5px"]) expect(phone).toContain(`.text-\\[${z}\\]`);
    expect(phone).toContain("font-size: 0.75rem");
  });
});

describe("web fonts never cause a second Largest Contentful Paint", () => {
  it("loads the Google Fonts stylesheet with display=optional", () => {
    const html = read("client/index.html").replace(/<!--[\s\S]*?-->/g, "");
    const href = html.match(/href="(https:\/\/fonts\.googleapis\.com\/css2\?[^"]+)"/)?.[1] ?? "";
    expect(href).toContain("display=optional");
  });
});

describe("the home board keeps its height while the board read lands", () => {
  // 2026-09-30: the hero no longer carries live figures (home-v2); the figures and tiles are in
  // LiveBoardGlance, which reserves the tiles' box while GET /api/gspc lands.
  it("reserves the tile area and each figure's line", () => {
    const board = read("client/src/components/home/LiveBoardGlance.tsx");
    expect(board).toMatch(/min-h-\[[0-9.]+rem\][^"]*" aria-busy="true" aria-label="Loading the board"/);
    expect(board).toMatch(/<dd className="order-first min-h-\[1\.2em\]/);
  });
});

describe("/connect's social and search head is the hub's, not a withdrawal notice", () => {
  it("resolves the seo-head entry for /connect", async () => {
    const { resolveHead } = await import("../lib/seoHead");
    const head = resolveHead("/connect/");
    expect(head.title).toBe("Connect an agent: MCP, A2A and HTTP | Council of AI");
  });
});
