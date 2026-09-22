import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { wantsGetMeasured } from "@/components/os/osChat";

const here = resolve(__dirname);
const src = [
  readFileSync(resolve(here, "HomeVerify.tsx"), "utf8"),
  readFileSync(resolve(here, "../components/home/HomeComposer.tsx"), "utf8"),
  readFileSync(resolve(here, "../components/home/HomeGspcTable.tsx"), "utf8"),
  readFileSync(resolve(here, "../components/home/HomeGspcBoard.tsx"), "utf8"),
  readFileSync(resolve(here, "../components/home/homeGspcTableReaders.ts"), "utf8"),
  readFileSync(resolve(here, "../components/home/HomeFilms.tsx"), "utf8"),
]
  .join("\n")
  .replace(/\/\*[\s\S]*?\*\//g, "")
  .replace(/^\s*\/\/.*$/gm, "");
const app = readFileSync(resolve(here, "../App.tsx"), "utf8");
// The menu data moved to HeaderNav.tsx; the header behaviour stays in Header.tsx. Pin both.
const header =
  readFileSync(resolve(here, "../components/Header.tsx"), "utf8") +
  readFileSync(resolve(here, "../components/HeaderNav.tsx"), "utf8");
const tools = readFileSync(resolve(here, "ToolsPage.tsx"), "utf8");
const stack = readFileSync(resolve(here, "../components/home/ToolStack.tsx"), "utf8");

describe("homepage is chat + GSPC list plus the estate", () => {
  it("does not ship the removed proposition block or a live-read result on the first screen", () => {
    // Removed 2026-09-16 at the owner's instruction. HomeFirstResult rendered
    // "No result could be read live" when its fetch did not return, which put an empty
    // failure state on the first screen: a reader cannot tell a broken page from an
    // estate with nothing to show. This test pins the removal so it cannot come back by
    // accident, and pins that the page still has exactly one h1.
    expect(src).not.toContain('data-testid="home-proposition"');
    expect(src).not.toContain("<HomeFirstResult />");
    expect(src).not.toContain("Independent measurements. Evidence you can check.");
    expect(src.match(/<h1\b/g)?.length ?? 0).toBeLessThanOrEqual(1);
  });

  it("is the board, the verifier, the ledger, the data doors, nine products and the stages", () => {
    // 2026-09-22. The three literals this test used to pin - "Explore measurements. See what
    // changed.", HeroSlides and HomeCinematicWorlds - encoded a structure the owner retired:
    // a seven-slide carousel as the first screen, four numbered buttons in place of navigation,
    // and a second three-film band restating ToolStack. Every component still exists; what
    // changed is which of them the FRONT DOOR mounts, so the pins move with it. The assertions
    // that are real guarantees (verify and assess are reachable, the board is here, the films
    // explain themselves, nothing sells a rank) are all kept below unchanged.
    expect(src).toContain('href="/gspc-verify"');
    expect(src).toContain('href="/assess"');
    expect(src).toContain('id="os-chat"');
    expect(src).toContain("The living board");
    expect(src).toContain("HomeHero");
    expect(src).toContain("HomeStrengths");
    expect(src).toContain("HomeNavigator");
    expect(src).toContain("HomeWeakScore");
    expect(src).toContain("HomeMachineSurface");
    expect(src).toContain("HomeReach");
    expect(src).toContain("HomeFilms");
    expect(src).toContain("ToolStack");
    expect(src).toContain("LivingStages");
    expect(src).toContain("What this film is saying");
    expect(src).toContain("HomeGspcTable");
    expect(src).toMatch(/totals\?\.lid/);
    expect(src).toContain("home-models-ranked");
    expect(src).not.toContain("HomeDemoLoop");
    expect(src).not.toContain("PluginBlock");
    expect(src).toContain("Hugging Face measured-model results");
    expect(src).toContain("/api/hub-cards");
    expect(src).not.toContain("Printers of the live board");
    expect(src).not.toContain("glama.ai/mcp/connectors/io.github.CSOAI-ORG/gspc");
    expect(src).not.toContain("glama.ai/mcp/servers/CSOAI-ORG/councilof-ai");
    expect(src).toMatch(/not a certificate/i);
    expect(src).toContain("huggingface.co/datasets/csoai/gspc-hub-cards");
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
    expect(stack).toContain("Watchdog evidence");
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
    // The PRIMARY_LINKS entry named "Get measured" was REMOVED on purpose: it rendered
    // beside the green "Get measured" CTA, same label, both to /assess (duplicate #2 of 3,
    // measured live at 1280x800 as "Get measured" x3). The destination is what this test
    // means to pin, and the CTA carries it at every breakpoint including mobile — so assert
    // the label and the href, not the nav-entry literal that encoded the duplicate.
    expect(header).toContain('Get measured');
    expect(header).toContain('/assess');
    expect(header).toContain('name: "Board"');
    expect(header).toContain('name: "Council OS"');
    expect(header).toContain('name: "Tools"');
    expect(header).toContain("href: '/watchdog-hub'");
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
    expect(tools).toContain("ALL_TOOL_NAMES");
    expect(tools).toContain("FREE_TOOL_NAMES");
    expect(tools).toContain("PAID_TOOL_NAMES");
    expect(tools).not.toContain("HundredGate"); // internal planning envelope — never on a public page
    expect(tools).toContain("WatchlistPane");
    expect(tools).not.toMatch(/lifestyle/i);
  });
});

describe("owner rulings on the front door, 2026-09-22", () => {
  const home = readFileSync(resolve(here, "HomeVerify.tsx"), "utf8");
  const footer = readFileSync(resolve(here, "../components/Footer.tsx"), "utf8");

  it("does not open on a withdrawal notice", () => {
    // The record stays published and stays reachable; it simply does not get a section on the
    // page a stranger lands on. The prop is what carries that, so the prop is what is pinned.
    expect(home).toContain("showWithdrawn={false}");
  });

  it("does not render a column of UNMEASURED stages, on the page or in the chrome", () => {
    // The complete funnel is published at /api/footprint, which is named in both places.
    expect(home).not.toContain("<LiveCounters");
    expect(footer).not.toContain("<LiveCounters");
    expect(footer).toContain("/api/footprint");
  });

  it("gives participation a band of its own rather than a thin strip", () => {
    expect(home).toContain('variant="home"');
    expect(home).toContain('data-testid="home-participation"');
    expect(home).not.toContain('variant="badges"');
  });

  it("leads with the credibility: signed evidence, corrections, anchoring, free re-checking", () => {
    // HomeStrengths is the second band on the page, above the board and everything after it.
    expect(home.indexOf("<HomeStrengths")).toBeLessThan(home.indexOf('id="board"'));
    expect(home.indexOf("<HomeStrengths")).toBeLessThan(home.indexOf("<ToolStack"));
    expect(home.indexOf("<HomeStrengths")).toBeLessThan(home.indexOf("<LivingStages"));
  });
});

describe("home lock — later merges must not restore the desk video", () => {
  it("HomeVerify.tsx stays living-board first with no HomeDemoLoop", () => {
    const home = readFileSync(resolve(here, "HomeVerify.tsx"), "utf8");
    expect(home).toContain("HomeGspcTable");
    expect(home).not.toContain("HfLivingRecord");
    expect(home).not.toContain("ReachStrip");
    expect(home).toContain("The living board");
    // The first screen must state what this business is, and must carry the one count line.
    expect(home).toContain("<HomeHero");
    expect(home).toContain("showPublicCount={false}");
    expect(home.indexOf("<HomeHero")).toBeLessThan(home.indexOf("<HomeGspcTable"));
    expect(home).not.toContain("HomeDemoLoop");
    expect(home).not.toContain("csoai-demo.mp4");
    expect(home).not.toContain("HomeBoard");
  });
});
