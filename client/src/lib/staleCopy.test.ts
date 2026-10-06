import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const pack = readFileSync(resolve(__dirname, "../../../functions/api/evidence-pack.ts"), "utf8");
const mcp = readFileSync(resolve(__dirname, "../../../public/.well-known/mcp.json"), "utf8");
const mcpCard = readFileSync(resolve(__dirname, "../../../public/.well-known/mcp/server-card.json"), "utf8");
const agentCard = readFileSync(resolve(__dirname, "../../../public/.well-known/agent-card.json"), "utf8");
const hfBadge = readFileSync(resolve(__dirname, "../../../public/hf-badge.html"), "utf8");
const tools = readFileSync(resolve(__dirname, "../pages/ToolsPage.tsx"), "utf8");
const claim = readFileSync(resolve(__dirname, "../data/anchoringClaim.ts"), "utf8");
const productsFill = readFileSync(resolve(__dirname, "./productFill.ts"), "utf8");
const sov = readFileSync(resolve(__dirname, "./sovExternalAudit.ts"), "utf8");
const playbook = readFileSync(resolve(__dirname, "./playbookAudit.ts"), "utf8");
const payDesk = readFileSync(resolve(__dirname, "../../../public/pay.html"), "utf8");
const pressroom = readFileSync(resolve(__dirname, "../pages/PublicPress.tsx"), "utf8");
const accessibility = readFileSync(resolve(__dirname, "../pages/Accessibility.tsx"), "utf8");

describe("stale copy honesty", () => {
  // public/pay.html is the static BUYER page since #2788 (2026-10-01): it owns /pay, while the owner's
  // wallet sweep (PayEveryDoor, which reads live settlement state) moved to the /pay-all app route.
  // This test used to demand MCP-job deep links and live /api/revenue reads from a pay.html that no
  // GitHub master revision ever shipped. What the buyer page must do now: send the buyer to the live
  // manifest and a free preview, keep amounts out of the page, and say what a payment never buys.
  it("the public buyer page sends a buyer to the live manifest and claims no price or settlement state", () => {
    expect(payDesk).toContain('<link rel="canonical" href="https://councilof.ai/pay">');
    expect(payDesk).toContain('href="/.well-known/x402.json"');
    expect(payDesk).toContain('href="/x402-buyer-guide.html"');
    expect(payDesk).toMatch(/Amounts appear only in the 402 challenge/);
    expect(payDesk).toMatch(/payment mints no new measurement/i);
    expect(payDesk).toMatch(/Measurement, not certification/);
    expect(payDesk).toContain("/pay-all");
    expect(payDesk).not.toMatch(/(?:£|\$|€)\s?\d|\b\d+(?:\.\d+)?\s?(?:usd|usdc|gbp|eur)\b/i);
    // 2026-09-14: both PayAPI URLs answer 404 and PayAPI's own llms.txt / providers page do not list us.
    // A page may not call a dead link a "verified PayAPI listing"; re-add only with a live detail URL.
    expect(payDesk).not.toContain("payapi.market");
    expect(payDesk).not.toMatch(/settlement\s+(?:stays\s+)?UNCHECKABLE|No <code>\/proof<\/code> until live/i);
  });

  it("press and accessibility claims fail closed instead of freezing unsupported claims", () => {
    expect(pressroom).toContain('fetch("/api/revenue"');
    expect(pressroom).toContain('fetch("/api/coverage"');
    expect(pressroom).toMatch(/not a grade, endorsement, customer count, signed measurement, or payment/i);
    expect(pressroom).toMatch(/UNCHECKABLE:[\s\S]*no previous count is reused/);
    expect(pressroom).not.toMatch(/first settlement.*NOT HAPPENED/i);
    expect(accessibility).toMatch(/working toward WCAG 2\.2 Level AA/);
    expect(accessibility).not.toMatch(/WCAG 2\.1 Level AA compliance|Haptic feedback support|Closed captioning for videos/);
    expect(accessibility).toContain("councilof.ai");
  });

  it("RAS pack cites the living board, not a 13-axis product", () => {
    expect(pack).toMatch(/Not a 13-axis product/);
    expect(pack).toMatch(/GET \/api\/gspc/);
    expect(pack).toMatch(/public, source-maintained corrections record/);
    expect(pack).toMatch(/not backed by append-only storage proof/);
    expect(pack).not.toMatch(/cite the live length|append-only ledger/i);
    expect(pack).not.toMatch(/13 real self-caught/);
    expect(pack).not.toMatch(/13 axes × 8 frameworks/);
  });

  it("publishes the current HTTP and npm tool boundaries", () => {
    // WAS: a typed twelve-name list, 8 free, registry "1.4.0" and "csoai-gspc-mcp@0.2.1" — pins that
    // went stale the day mcp_trust shipped (13 tools, 9 free) and the registry moved to 1.4.2, so this
    // case held the drift in place. The derived fields of both files are now RENDERED by
    // scripts/harness-x/render.mjs; they are checked here against the fleet lock and the registry
    // file they are rendered from, never against a typed count or version.
    const j = JSON.parse(mcp);
    const lock = JSON.parse(readFileSync(resolve(__dirname, "../../../functions/mcp/tool-fleet.lock.json"), "utf8"));
    const registry = JSON.parse(readFileSync(resolve(__dirname, "../../../mcp/gspc-server/server.json"), "utf8"));
    const fleet = [...lock.free, ...lock.paid];
    expect(j.planted.tools).toEqual(fleet);
    expect(j.measured.tools).toEqual(fleet);
    expect(j.measured.total_tools).toBe(fleet.length);
    expect(j.measured.free_tools).toBe(lock.free.length);
    expect(j.measured.metered_tools).toBe(lock.paid.length);
    expect(j.measured.note).toMatch(/witness_hash (?:is|remains) quarantined/i);
    expect(j.servers[0].registry.version).toBe(registry.version);
    const card = JSON.parse(mcpCard);
    expect(card.capabilities.total_tools).toBe(fleet.length);
    expect(card.capabilities.free_tools).toBe(lock.free.length);
    expect(card.capabilities.tools).toEqual(fleet);
    expect(card.description).toContain(`server ${registry.version}`);
    // While every published npm release is deprecated on npm (scripts/harness-x/render.mjs
    // NPM_STDIO_ADVERTISED), the card withholds the stdio pin and names the free door instead.
    if (card.endpoints.mcp.stdio === null) {
      expect(card.endpoints.mcp.stdio_note).toMatch(/deprecated on npm.*use the free door https:\/\/councilof\.ai\/mcp\/free/);
      expect(card.endpoints.mcp.free).toBe("https://councilof.ai/mcp/free");
    } else {
      expect(card.endpoints.mcp.stdio).toBe(
        `npx -y ${registry.packages[0].identifier}@${registry.packages[0].version}`,
      );
    }
    // The agent card no longer lists /mcp as an A2A interface (it does not speak A2A;
    // spec v1.0.1 §8.3.1). The npm-tools copy it used to carry lives in mcp.json, asserted
    // above. What the card's JSONRPC interface must now say is that it is the real A2A door.
    const agentA2a = JSON.parse(agentCard).supportedInterfaces.find(
      (entry: { protocolBinding?: string }) => entry.protocolBinding === "JSONRPC",
    );
    expect(agentA2a.url).toBe("https://councilof.ai/api/a2a");
    expect(agentA2a.protocolVersion).toMatch(/^\d+\.\d+$/);
    expect(tools).toContain("WatchlistPane");
    expect(tools).toContain("ALL_TOOL_NAMES");
    expect(tools).toContain("FREE_TOOL_NAMES");
    expect(tools).toContain("PAID_TOOL_NAMES");
  });

  it("never derives a model score from the global board", () => {
    expect(hfBadge).toMatch(/global board badge is a link/i);
    expect(hfBadge).toContain("UNMEASURED");
    expect(hfBadge).toContain("UNSIGNED");
    expect(hfBadge).toContain("/api/badge?card=&lt;SIGNED_CARD_SHA256&gt;&amp;subject=");
    expect(hfBadge).toMatch(/exact model and immutable revision/i);
    expect(hfBadge).not.toContain("value: live");
    expect(hfBadge).not.toMatch(/Every public model on the Hub can carry an independent governance badge/);
  });
});

describe("leftover: /xrpl-attest is a public-root reader, not a live DEVNET pointer", () => {
  it("does not present /xrpl-attest as a separate DEVNET pointer", () => {
    expect(claim).not.toMatch(/\/xrpl-attest page is a separate DEVNET pointer/);
    expect(claim).toMatch(/reader of GET \/root\.json/);
    expect(productsFill).not.toMatch(/XRPL memo \/ XLS-70 on DEVNET today/);
    expect(productsFill).toMatch(/living feed is GET \/root\.json/);
    expect(sov).toMatch(/\/xrpl-attest is a \/root\.json reader/);
    expect(playbook).toMatch(/\/xrpl-attest is a \/root\.json reader/);
  });
});

const header =
  readFileSync(resolve(__dirname, "../components/Header.tsx"), "utf8") +
  readFileSync(resolve(__dirname, "../components/HeaderNav.tsx"), "utf8");

describe("leftover: header mega-nav honesty", () => {
  it("does not sell /assess as a free signed assessment or /xrpl-attest as a Devnet pointer", () => {
    expect(header).not.toMatch(/Free signed assessment/);
    expect(header).not.toMatch(/No account, no fee/);
    expect(header).not.toMatch(/Devnet pointer/);
    expect(header).toMatch(/Verify stays free/);
    // WAS: toMatch(/Coming — Paddle waitlist/). That pinned a PHRASE, and the phrase named a
    // payment processor. The OWNER RULING of 6 Sep 2026 forbids naming one on any page, so the
    // phrase had to change and this assertion blocked the change while protecting nothing the
    // line below does not protect better. What the case is really for — "does not sell /assess
    // as a free signed assessment" — is the booking-not-live statement, so assert THAT, and ban
    // the processor outright rather than requiring it.
    expect(header).toMatch(/Booking is not live/);
    expect(header).not.toMatch(/\b(paddle|stripe|paypal)\b/i);
    expect(header).toMatch(/XRPL_STATUS_LABEL/);
    expect(header).toMatch(/writes_board false/);
  });
});

const eunomiaNav = readFileSync(resolve(__dirname, "../components/HeaderNav.tsx"), "utf8");
const eunomiaPage = readFileSync(resolve(__dirname, "../pages/EunomiaIndices.tsx"), "utf8");
const eunomiaData = readFileSync(resolve(__dirname, "../data/eunomia.ts"), "utf8");

describe("leftover: eunomia indices stay UNMEASURED as indices", () => {
  it("does not stamp the three empty index axes MEASURED", () => {
    expect(eunomiaNav).not.toMatch(/now measured \(frozen gold sets/);
    // Persona sweep 6 Oct 2026 (T05): the index ids are not rows on GET /api/gspc, and the board
    // lists humanoid-labour-index (component facts) as MEASURED, so the menu no longer says
    // "UNMEASURED on GET /api/gspc"; it says none is a signed result.
    expect(eunomiaNav).not.toMatch(/UNMEASURED on GET \/api\/gspc/);
    expect(eunomiaNav).toMatch(/Three proposed index measures\. Reference test sets only; none is a signed result\./);
    expect(eunomiaPage).not.toMatch(/EUNOMIA indices — measured/);
    expect(eunomiaPage).not.toMatch(/now MEASURED/);
    expect(eunomiaPage).toMatch(/UNMEASURED as indices/);
    expect(eunomiaPage).not.toMatch(/Each index slot on the living board is UNMEASURED/);
    expect(eunomiaPage).not.toMatch(/[Dd]o not restore/);
    expect(eunomiaPage).toMatch(/stays withdrawn/);
    expect(eunomiaData).not.toMatch(/Aspirational index axes — now MEASURED/);
    expect(eunomiaData).toMatch(/UNMEASURED on the living board \(C-2026-0826-05\)/);
  });
});

const osHeader = readFileSync(resolve(__dirname, "../components/os/OsHeader.tsx"), "utf8");

describe("leftover: chrome is not a certificate mill", () => {
  it("does not offer My Certificates in Header or OsHeader", () => {
    expect(header).not.toMatch(/My Certificates/);
    expect(osHeader).toMatch(/Training records/);
    expect(osHeader).not.toMatch(/href="\/certificates"/);
  });
});

const leftoverCensus = readFileSync(
  resolve(__dirname, "../../../public/interop/census-digest-leftover.json"),
  "utf8",
);
const llms = readFileSync(resolve(__dirname, "../../../public/llms.txt"), "utf8");
const spaceReadme = readFileSync(resolve(__dirname, "../../../spaces/gspc-board/README.md"), "utf8");

describe("leftover: CENSUS_3M is census+digest+queue+lock, remainder UNMEASURED", () => {
  it("does not treat 3032028 Hub listings as MEASURED", () => {
    const j = JSON.parse(leftoverCensus);
    expect(j.measured).toBe(false);
    expect(j.signed).toBe(false);
    expect(j.remainder).toBe("UNMEASURED");
    expect(j.eat).toMatch(/census \+ digest \+ queue \+ lock/);
    expect(j.census.status_all).toBe("UNMEASURED");
    expect(j.census.n_measured).toBe(0);
    expect(j.census.listing_state_all).toBe("DISCOVERED");
    expect(j.digest.measured).toBe(false);
    expect(j.digest.invented_3m_digest_file).toBe(false);
    expect(j.queue.status_all).toBe("UNMEASURED");
    expect(j.lock.status_all).toBe("UNMEASURED");
    expect(j.lock.n_locked).toBe(40);
    expect(llms).toMatch(/census \+ digest \+ queue \+ lock/);
    expect(llms).toMatch(/Remainder UNMEASURED/);
    expect(spaceReadme).toMatch(/census, not a grade/);
    expect(spaceReadme).toMatch(/Remainder UNMEASURED/);
    expect(spaceReadme).not.toMatch(/Fifteen axes carry a signed measurement/);
    expect(spaceReadme).toMatch(/Not a mill/);
  });
});
