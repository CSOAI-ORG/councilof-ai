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
// /how-we-work is where the eight bands retired from the front door on 2026-09-23 now live.
// It is read here so the "nothing was deleted, it moved" claim is pinned against the file that
// has to carry it, rather than asserted in a comment.
const howWeWork = readFileSync(resolve(here, "HowWeWork.tsx"), "utf8");
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
    expect(src).toContain("HomeCredibility");
    expect(src).toContain("HomeWeakScore");
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
  it("labels the sitewide attestation door and measured-run enquiry honestly", () => {
    expect(header).toContain('name: "Verify"');
    expect(header).toContain('<Link href="/assess">Request attestation</Link>');
    expect(header).toContain('<a href="/assess" onClick={() => setMobileMenuOpen(false)}>Request attestation</a>');
    expect(header).toContain("name: 'Request attestation', href: '/dashboard?tab=measured'");
    const footer = readFileSync(resolve(here, "../components/Footer.tsx"), "utf8");
    expect(footer).toContain("{ name: 'Request attestation', href: '/assess/' }");
    expect(footer).toContain("{ name: 'Ask about a measured run', href: '/contact/?arm=run' }");
    expect(footer).not.toContain("{ name: 'Run / re-attest', href: '/assess' }");
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
    // Since 2026-09-23 the band it belongs to renders on /how-we-work, so the prop is pinned
    // there — and the front door satisfies the ruling more strongly, by not mounting it at all.
    expect(howWeWork).toContain("showWithdrawn={false}");
    expect(home).not.toContain("<HomeEvidenceShowcase");
  });

  it("does not render a column of UNMEASURED stages, on the page or in the chrome", () => {
    // The complete funnel is published at /api/footprint, which is named in both places.
    expect(home).not.toContain("<LiveCounters");
    expect(footer).not.toContain("<LiveCounters");
    expect(footer).toContain("/api/footprint");
  });

  it("shows participation once on the front door and hands the full record to /memberships", () => {
    expect(home).toMatch(/variant="featured"/);
    expect(home).not.toMatch(/variant="home"/);
    expect(home).not.toMatch(/data-testid="home-participation"/);
    expect(home).not.toMatch(/variant="badges"/);
  });

  it("leads with the credibility: signed evidence, corrections, anchoring, free re-checking", () => {
    // The band that carries this is HomeCredibility as of 2026-09-23 — the same six claims as
    // HomeStrengths, in six tiles instead of six essays, because at 27,743px the essays were
    // published to whoever was still reading and to nobody else. It is still the SECOND band,
    // above the board and above everything after it, which is what this test has always meant.
    expect(home.indexOf("<HomeCredibility")).toBeLessThan(home.indexOf('id="board"'));
    expect(home.indexOf("<HomeCredibility")).toBeGreaterThan(home.indexOf("<HomeHero"));
    expect(home).toContain("<HomeWeakScore");
  });
});

describe("the 2026-09-23 shortening — retired, not deleted", () => {
  // THE MEASUREMENT BEHIND THIS BLOCK. The front door rendered 27,743px at 1280px and 47,757px
  // at 390px, so every band below the board was effectively unpublished. Eight bands moved to
  // /how-we-work. All eight were mounted ONLY on HomeVerify, which means a removal with no
  // destination would have deleted them outright — so this block pins BOTH halves: gone from
  // the front door, and present on the page that now carries them.
  const home = readFileSync(resolve(here, "HomeVerify.tsx"), "utf8");
  const retired = [
    "HomeStrengths",
    "HomeMachineSurface",
    "HomeReach",
    "ToolStack",
    "LivingStages",
    "HomeFilms",
    "HomeEvidenceShowcase",
    "HomeNavigator",
  ];

  it("each retired band is off the front door", () => {
    for (const band of retired) {
      expect(home, `${band} is still mounted on the home page`).not.toContain(`<${band}`);
    }
  });

  it("every retired band is mounted on /how-we-work", () => {
    for (const band of retired) {
      expect(howWeWork, `${band} was removed from home with nowhere to go`).toContain(`<${band}`);
    }
  });

  it("carries the owner's two rulings across to the page that now renders the band", () => {
    // showWithdrawn={false} and sections="reading" were rulings about HomeEvidenceShowcase, not
    // about the home page. Moving the band must not quietly drop them.
    expect(howWeWork).toContain("showWithdrawn={false}");
    expect(howWeWork).toContain('sections="reading"');
  });

  it("/how-we-work is routed and registered as a primary path", () => {
    // A new page that is not in PRIMARY_PATHS ships the ArchivedBanner — it would tell every
    // reader and every answer engine that a page the front door promotes is superseded.
    expect(app).toContain('path="/how-we-work"');
    expect(app).toContain('import("./pages/HowWeWork")');
    const ia = readFileSync(resolve(here, "../data/library-ia.ts"), "utf8");
    expect(ia).toContain('"/how-we-work"');
  });

  it("the front door still reaches the retired material", () => {
    expect(home).toContain("/how-we-work");
  });
});

describe("the count is never published without the separation that qualifies it", () => {
  const hero = readFileSync(resolve(here, "../components/home/HomeHero.tsx"), "utf8");

  it("reads all four separation fields live, or prints none of them", () => {
    // MEASURED means a run exists behind the slot. It does NOT mean the axis told two models
    // apart. separationRead returns null unless comparison_axes, separated_leads, ties AND
    // untested_separations all arrive, so a partial read can never render as a zero.
    expect(hero).toContain("separationRead");
    expect(hero).toContain("comparison_axes");
    expect(hero).toContain("separated_leads");
    expect(hero).toContain("untested_separations");
    expect(hero).toMatch(/if \(comparison === null \|\| separated === null \|\| ties === null \|\| untested === null\) return null;/);
  });

  it("says in words that measured is not separated, on the first screen", () => {
    expect(hero).toContain("Measured is not the same as separated.");
    expect(hero).toContain('data-testid="hero-separation"');
    // A tie is first-class and is never rounded up into a ranking.
    expect(hero).toMatch(/A tie stays a tie/);
  });
});

describe("no third-party mark is redrawn to imply a relationship we do not have", () => {
  const footer = readFileSync(resolve(here, "../components/Footer.tsx"), "utf8");

  it("ships no framework logo art", () => {
    // Nine in-house <img> badges imitating other bodies' marks — including the European
    // emblem's circle of twelve stars in the emblem's own colours — were replaced on
    // 2026-09-23 with the text-pill pattern MembershipStrip already uses. Participation is
    // stated in words, with the relationship named and a link to that body's own page.
    expect(footer).not.toMatch(/src=\{b\.src\}/);
    expect(footer).not.toContain("src: '/images/badges/frameworks/");
  });

  it("states the limit of what naming a framework means", () => {
    expect(footer).toMatch(/Naming a framework is not a claim to comply with it/);
    // The sentence wraps in the JSX, so match across whitespace rather than pinning the wrap.
    expect(footer).toMatch(/we hold no\s+certification under any scheme/i);
  });
});

describe("no in-page anchor on the front door points at nothing", () => {
  // THE DEFECT THIS CATCHES. Retiring a band takes its id with it, and any href="#that-id" left
  // behind becomes a link that silently does nothing. It happened on 2026-09-23 to the hero's
  // "Reading this as an agent?" link, which pointed at #machine-surface after that band moved to
  // /how-we-work. A dead in-page anchor is invisible to a type-check and to every other test.
  const mounted = [
    "HomeVerify.tsx",
    "../components/home/HomeHero.tsx",
    "../components/home/HomeCredibility.tsx",
    "../components/home/HomeGspcTable.tsx",
    "../components/home/HomeWeakScore.tsx",
    "../components/home/HomeComposer.tsx",
    "../components/MembershipStrip.tsx",
  ].map((f) => readFileSync(resolve(here, f), "utf8"));
  const joined = mounted.join("\n");
  const ids = new Set([...joined.matchAll(/id="([a-z0-9-]+)"/g)].map((m) => m[1]));
  const anchors = [...joined.matchAll(/href="#([a-z0-9-]+)"/g)].map((m) => m[1]);

  it("finds at least the anchors we know are there", () => {
    expect(anchors).toContain("board");
  });

  it("every in-page anchor resolves to an id rendered on the same page", () => {
    for (const a of anchors) {
      expect(ids.has(a), `href="#${a}" points at no id on the front door`).toBe(true);
    }
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
