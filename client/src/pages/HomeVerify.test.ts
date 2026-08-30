import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { wantsGetMeasured } from "@/components/os/osChat";

const here = resolve(__dirname);
const src = [
  readFileSync(resolve(here, "HomeVerify.tsx"), "utf8"),
  readFileSync(resolve(here, "../components/home/HomeComposer.tsx"), "utf8"),
  readFileSync(resolve(here, "../components/board/LiveLeaderboard.tsx"), "utf8"),
  readFileSync(resolve(here, "../components/home/HomeFilms.tsx"), "utf8"),
]
  .join("\n")
  .replace(/\/\*[\s\S]*?\*\//g, "")
  .replace(/^\s*\/\/.*$/gm, "");
const app = readFileSync(resolve(here, "../App.tsx"), "utf8");
const header = readFileSync(resolve(here, "../components/Header.tsx"), "utf8");
const tools = readFileSync(resolve(here, "ToolsPage.tsx"), "utf8");
const stack = readFileSync(resolve(here, "../components/home/ToolStack.tsx"), "utf8");
const boardHook = readFileSync(resolve(here, "../components/board/useGspcBoard.ts"), "utf8");

describe("homepage is chat + GSPC list plus the estate", () => {
  it("is OpenRouter desk plus slides, nine products, and Council OS", () => {
    expect(src).toMatch(/Check an AI claim\. Or measure your system\./);
    expect(src).toContain('href="/gspc-verify"');
    expect(src).toContain('href="/assess"');
    expect(src).toContain('id="os-chat"');
    expect(src).toContain("The live board");
    expect(src).toContain("HeroSlides");
    expect(src).toContain("HomeFilms");
    expect(src).toContain("HomeCinematicWorlds");
    expect(src).toContain("ToolStack");
    expect(src).toContain("LivingStages");
    expect(src).toContain("Open Council OS");
    expect(src).toContain("Empty means not measured");
    expect(src).toContain("What you can do in this box");
    expect(src).toContain("What this film is saying");
    expect(src).toContain("defaultExpanded");
    expect(src).not.toContain("HomeDemoLoop");
    expect(src).not.toContain("PluginBlock");
    expect(src).not.toContain("OsShell");
    expect(src).not.toMatch(/certified organization|buy a rank|rank for sale/i);
  });

  it("falls back to the live board when local /api/gspc is 500 or HTML", () => {
    expect(boardHook).toContain("https://councilof.ai/api/gspc");
    expect(boardHook).toContain("HTTP [45]\\d\\d");
  });

  it("shows all nine product plates", () => {
    expect(stack).toContain("Nine products");
    expect(stack).toContain("Council OS");
    expect(stack).toContain("The living board");
    expect(stack).toContain("Verify a card");
    expect(stack).toContain("Get measured");
    expect(stack).toContain("GPAI evidence pack");
    expect(stack).toContain("Embed and white-label kit");
    expect(stack).toContain("Insurance evidence rail");
    expect(stack).toContain("Specialist registers");
    expect(stack).toContain("Report an incident");
    expect(stack).toContain("/images/");
    expect(stack).toContain("ticks:");
    expect(stack).toContain("Why these nine, and not a catalogue");
  });

  it("routes Claude-at-work to get measured", () => {
    expect(wantsGetMeasured("I use Claude at work")).toBe(true);
    expect(src).toContain("wantsGetMeasured");
  });

  it("App keeps the desk on /", () => {
    expect(app).toContain("component={HomeVerify}");
    expect(app).not.toMatch(/path === '\/' \|\| path === '\/os'/);
  });
});

describe("header restores master menu and Council OS", () => {
  it("keeps Verify · Get measured · Board · Council OS · Tools", () => {
    expect(header).toContain('name: "Verify"');
    expect(header).toContain('name: "Get measured"');
    expect(header).toContain('name: "Board"');
    expect(header).toContain('name: "Council OS"');
    expect(header).toContain('name: "Tools"');
    expect(header).toContain("href: '/report'");
    expect(header).toContain("href: '/for/startup'");
    expect(header).toContain("href: '/for/enterprise'");
    expect(header).toContain("href: '/for/finance'");
    expect(header).toContain("href: '/for/healthcare'");
    expect(header).toContain("href: '/for/regulator'");
    expect(header).toContain("href: '/for/sec-filer'");
    expect(header).not.toContain("href: '/watchdog'");
    expect(header).not.toContain("Chat is Council OS");
    expect(header).not.toContain("Start free");
    expect(header).toContain("SPA hops keep this header mounted");
  });

  it("renders the mega-menu groups", () => {
    expect(header).toContain("{navigation.map");
    expect(header).toContain("name: 'Measure'");
    expect(header).toContain("name: 'Products'");
    expect(header).toContain("name: 'Council OS'");
  });
});

describe("/tools is the plugin snippet", () => {
  it("lists four hosts and one MCP URL", () => {
    expect(tools).toContain("Claude");
    expect(tools).toContain("Cursor");
    expect(tools).toContain("Kimi");
    expect(tools).toContain("Grok");
    expect(tools).toContain("https://councilof.ai/mcp");
    expect(tools).toContain("mcpServers");
    expect(tools).toMatch(/Ask: board totals/);
    expect(tools).not.toMatch(/lifestyle/i);
  });
});
