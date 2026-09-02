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
  readFileSync(resolve(here, "../components/HfLivingRecord.tsx"), "utf8"),
  readFileSync(resolve(here, "../lib/hfLivingRecord.ts"), "utf8"),
  readFileSync(resolve(here, "../components/ReachStrip.tsx"), "utf8"),
  readFileSync(resolve(here, "../lib/reachStrip.ts"), "utf8"),
]
  .join("\n")
  .replace(/\/\*[\s\S]*?\*\//g, "")
  .replace(/^\s*\/\/.*$/gm, "");
const app = readFileSync(resolve(here, "../App.tsx"), "utf8");
const header = readFileSync(resolve(here, "../components/Header.tsx"), "utf8");
const tools = readFileSync(resolve(here, "ToolsPage.tsx"), "utf8");
const stack = readFileSync(resolve(here, "../components/home/ToolStack.tsx"), "utf8");

describe("homepage is chat + GSPC list plus the estate", () => {
  it("is OpenRouter desk plus slides, nine products, and Council OS", () => {
    expect(src).toMatch(/Check a claim\. Measure a system\./);
    expect(src).toContain('href="/gspc-verify"');
    expect(src).toContain('href="/assess"');
    expect(src).toContain('id="os-chat"');
    expect(src).toContain("The living board");
    expect(src).toContain("HeroSlides");
    expect(src).toContain("HomeFilms");
    expect(src).toContain("HomeCinematicWorlds");
    expect(src).toContain("ToolStack");
    expect(src).toContain("LivingStages");
    expect(src).toContain("Open Council OS");
    expect(src).toContain("Empty means not measured");
    expect(src).toContain("What this desk does");
    expect(src).toContain("What this film is saying");
    expect(src).toContain("defaultExpanded");
    expect(src).not.toContain("HomeDemoLoop");
    expect(src).not.toContain("PluginBlock");
    expect(src).toContain("HfLivingRecord");
    expect(src).toContain("ReachStrip");
    expect(src).toContain("Printers of the live board");
    expect(src).toContain("glama.ai/mcp/connectors/io.github.CSOAI-ORG/gspc");
    expect(src).toContain("10.5281/zenodo.21991104");
    expect(src).toMatch(/not a certificate/i);
    expect(src).toContain("huggingface.co/datasets/csoai/gspc-board");
    expect(src).not.toContain("OsShell");
    expect(src).not.toMatch(/certified organization|buy a rank|rank for sale/i);
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
    expect(header).toContain("href: '/for/enterprise'");
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
    expect(tools).toContain("board_totals · get_axis · verify_card · list_cards · get_root · get_card · verify_inclusion");
    expect(tools).toContain("HundredGate");
    expect(tools).toContain("WatchlistPane");
    expect(tools).not.toMatch(/lifestyle/i);
  });
});

describe("home lock — later merges must not restore the desk video", () => {
  it("HomeVerify.tsx stays living-board first with no HomeDemoLoop", () => {
    const home = readFileSync(resolve(here, "HomeVerify.tsx"), "utf8");
    expect(home).toContain("LiveLeaderboard");
    expect(home).toContain("HfLivingRecord");
    expect(home).toContain("ReachStrip");
    expect(home).toContain("The living board");
    expect(home).toMatch(/Check a claim\. Measure a system\./);
    expect(home).not.toContain("HomeDemoLoop");
    expect(home).not.toContain("csoai-demo.mp4");
    expect(home).not.toContain("HomeBoard");
  });
});
