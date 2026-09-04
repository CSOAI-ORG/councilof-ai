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

describe("stale copy honesty", () => {
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
    const j = JSON.parse(mcp);
    const eleven = [
      "board_totals",
      "get_axis",
      "verify_card",
      "list_cards",
      "get_root",
      "get_card",
      "verify_inclusion",
      "commission_card",
      "art50_marking_evidence",
      "rwa_evidence",
      "receipts_batch",
    ];
    expect(j.planted.tools).toEqual(eleven);
    expect(j.measured.tools).toEqual(eleven);
    expect(j.measured.total_tools).toBe(11);
    expect(j.measured.free_tools).toBe(7);
    expect(j.measured.metered_tools).toBe(4);
    expect(j.measured.note).toMatch(/npm(?: stdio)? csoai-gspc-mcp@0\.2\.1 lists twelve/i);
    expect(j.measured.note).toMatch(/witness_hash is quarantined/i);
    expect(JSON.parse(mcpCard).endpoints.mcp.stdio).toBe(
      "npx -y csoai-gspc-mcp@0.2.1",
    );
    const agentMcp = JSON.parse(agentCard).supportedInterfaces.find(
      (entry: { protocolBinding?: string }) => entry.protocolBinding === "JSONRPC",
    );
    expect(agentMcp.note).toMatch(/csoai-gspc-mcp@0\.2\.1 lists twelve/i);
    expect(tools).toContain("WatchlistPane");
    expect(tools).toMatch(
      /board_totals · get_axis · verify_card · list_cards ·\s*get_root · get_card · verify_inclusion/,
    );
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
    expect(header).toMatch(/Coming — Paddle waitlist/);
    expect(header).toMatch(/XRPL_STATUS_LABEL/);
    expect(header).toMatch(/writes_board false/);
  });
});

const eunomiaNav = readFileSync(resolve(__dirname, "../components/HeaderNav.tsx"), "utf8");
const eunomiaPage = readFileSync(resolve(__dirname, "../pages/EunomiaIndices.tsx"), "utf8");
const eunomiaData = readFileSync(resolve(__dirname, "../data/eunomia.ts"), "utf8");

describe("leftover: eunomia indices stay UNMEASURED on the living board", () => {
  it("does not stamp the three empty index axes MEASURED", () => {
    expect(eunomiaNav).not.toMatch(/now measured \(frozen gold sets/);
    expect(eunomiaNav).toMatch(/UNMEASURED on GET \/api\/gspc/);
    expect(eunomiaPage).not.toMatch(/EUNOMIA indices — measured/);
    expect(eunomiaPage).not.toMatch(/now MEASURED/);
    expect(eunomiaPage).toMatch(/UNMEASURED on GET \/api\/gspc/);
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
