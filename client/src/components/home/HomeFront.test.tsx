/**
 * The rebuilt front door, rendered against INJECTED payloads so every assertion is provably
 * about the mock and nothing in this file can leak onto a page.
 *
 * What is pinned, band by band:
 *  HomeHero          the four figures come off totals; an unread board prints the reason and NO
 *                    figure; the proposition is in plain words with no banned string
 *  HomeStrengths     six cards in the owner's order; every proof line is live-read or a labelled
 *                    absence; a STALE ledger signature survives onto the page
 *  HomeNavigator     five reader questions, every href non-empty, no dead "#" placeholder
 *  HomeMachineSurface  ten doors as ten lines; a refused total is words; nothing is summed
 *  HomeReach         the two corpora are printed with their KINDS and are never added
 *  HomeWeakScore     the verdict word on screen is whatever the verifier returned
 */
import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { Router } from "wouter";
import HomeHero, { heroStamp, heroStats } from "./HomeHero";
import HomeStrengths, { anchorProof, correctionsProof, machineProof, strengthCards } from "./HomeStrengths";
import HomeNavigator, { NAV_GROUPS } from "./HomeNavigator";
import HomeMachineSurface, { MACHINE_DOORS } from "./HomeMachineSurface";
import HomeReach, { corpusLines } from "./HomeReach";
import HomeEvidenceShowcase, { withdrawnReadingRecords } from "./HomeEvidenceShowcase";
import HomeWeakScore, { accuracyText, fieldText, WEAK_CARD_ID } from "./HomeWeakScore";
import type { CorrectionsPayload, PopPreview, ReadState, RootPayload, StatePayload } from "./homeReads";
import type { GspcPayload } from "../board/useGspcBoard";

/**
 * Render on the server at a fixed path. The wouter <Link> reads window.location, which does not
 * exist under the node test environment; ssrPath is wouter own answer to that, so the markup
 * asserted below is the markup a reader gets on the home route.
 */
function render(node: React.ReactNode): string {
  return renderToStaticMarkup(<Router ssrPath="/">{node}</Router>);
}

/* ── fixtures ──────────────────────────────────────────────────────────── */

const board: GspcPayload = {
  totals: { public_count: "6 axis · 5 measured (mock)", items: 1230, model_fleets: 14, fact_runs: 9 },
  measured_on: { date: "mock run 2026-01-01" },
  axes: [],
};

const corrections: ReadState<CorrectionsPayload> = {
  kind: "ready",
  payload: { corrections: [{ id: "C-1" }, { id: "C-2" }], signature_state: "STALE" },
};

const root: ReadState<RootPayload> = {
  kind: "ready",
  payload: {
    as_of: "2026-09-22T08:54:02Z",
    card_count: 305,
    merkle_root: "40ce3833118fab76a98c55429a5b06c7c3051915780893f3ab60a25cb31ac0a4",
    sig_ed25519: "a39f",
  },
};

const ots: PopPreview = {
  title: "OpenTimestamps proof manifest",
  state: "MEASURED",
  n: 600,
  n_unit: "published .ots proofs that parse as proofs",
  as_of: "2026-09-22",
  head: { declared_counts: { proofs: 600, bitcoin_attested: 56, calendar_pending: 544 } },
};

const estate: ReadState<StatePayload> = {
  kind: "ready",
  payload: {
    card_chain: { bodies_verified_valid: { value: 335, kind: "measured" } },
    public_root: { card_count: { value: 305, kind: "catalogued" } },
    signed_cards: { corpus_relation: { identifier_overlap: 0 } },
  },
};

/** Banned on every public surface by scripts/brand-gate.mjs. Re-asserted at the component level. */
const BANNED = [/\bsovos\b/i, /\bsov3\d*\b/i, /\bdorado\b/i, /\bcibola\b/i, /\bCEASAI/i, /\bget certified\b/i, /\bwe certify\b/i, /\bbyzantine\b/i, /\bBFT\b/];

/* ── hero ──────────────────────────────────────────────────────────────── */

describe("HomeHero", () => {
  it("takes all four first-screen figures off totals and types none of them", () => {
    expect(heroStats(board).map((s) => s.value)).toEqual(["6 axis · 5 measured (mock)", "1,230", "14", "9"]);
    expect(heroStamp(board)).toBe("mock run 2026-01-01");
  });

  it("prints a dash, never a zero, for a figure the payload does not carry", () => {
    expect(heroStats({ totals: {} }).every((s) => s.value === null)).toBe(true);
    expect(heroStats(null).map((s) => s.value)).toEqual([null, null, null, null]);
    expect(heroStamp({})).toBeNull();
    const html = render(<HomeHero data={null} />);
    expect(html).toContain("—");
  });

  it("renders the figures and the endpoint they came from", () => {
    const html = render(<HomeHero data={board} />);
    expect(html).toContain("6 axis · 5 measured (mock)");
    expect(html).toContain("1,230");
    expect(html).toContain("GET /api/gspc");
    expect(html).toContain("mock run 2026-01-01");
  });

  it("says what the business is, in the first screen, without jargon or a banned string", () => {
    const html = render(<HomeHero data={board} />);
    expect(html).toContain("We measure how AI systems behave");
    expect(html).toContain("free");
    // Measurement, never certification.
    expect(html).toContain("Nothing on this page is a certificate");
    for (const re of BANNED) expect(html).not.toMatch(re);
  });

  it("prints the reason and NO figure when the board is unread", () => {
    const html = render(<HomeHero data={null} error="HTTP 503" />);
    expect(html).toContain("The board is unread");
    expect(html).toContain("HTTP 503");
    expect(html).not.toContain("1,230");
    expect(html).not.toContain("hero-board-glance\"><dl");
  });

  it("offers a human door, a verification door and a machine door", () => {
    const html = render(<HomeHero data={board} />);
    expect(html).toContain('data-testid="hero-cta-board"');
    expect(html).toContain('data-testid="hero-cta-verify"');
    expect(html).toContain('data-testid="hero-cta-agents"');
  });
});

/* ── strengths ─────────────────────────────────────────────────────────── */

describe("HomeStrengths", () => {
  it("states the six strengths in the order they are worth saying", () => {
    const titles = strengthCards({ corrections, root, ots }).map((c) => c.title);
    expect(titles).toHaveLength(6);
    expect(titles[0]).toMatch(/paying us/i); // independent, published signed, free to re-check
    expect(titles[1]).toMatch(/bad results/i); // we publish our weak scores
    expect(titles[2]).toMatch(/wrong/i); // corrections ledger
    expect(titles[3]).toMatch(/rewritten/i); // anchoring
    expect(titles[4]).toMatch(/rooms/i); // standards
    expect(titles[5]).toMatch(/machine/i); // runs on a schedule
  });

  it("carries the ledger's own count and its STALE signature onto the page", () => {
    const p = correctionsProof(corrections);
    expect(p.live).toBe(true);
    expect(p.text).toContain("2 corrections published");
    expect(p.text).toContain("STALE");
  });

  it("reports a failed ledger read as unread with the reason, never as zero corrections", () => {
    const p = correctionsProof({ kind: "failed", reason: "HTTP 500" });
    expect(p.live).toBe(false);
    expect(p.text).toContain("HTTP 500");
    expect(p.text).not.toMatch(/\b0 corrections\b/);
  });

  it("never calls a pending timestamp anchored", () => {
    const p = anchorProof(root, ots);
    expect(p.text).toContain("56 of 600 published proof files contain Bitcoin block-header attestations");
    expect(p.text).toContain("544 remain calendar-pending");
    expect(p.text).not.toMatch(/600 (?:proofs )?anchored/i);
  });

  it("does not claim this root is timestamped — it is signed, and that is a different fact", () => {
    // /root.json.ots is a 404 and no proof in the timestamp manifest names /root.json as its
    // subject. The card said "signed and timestamped" until that was probed.
    const anchor = strengthCards({ corrections, root, ots })[3];
    expect(anchor.body).toContain("whose root is signed");
    expect(anchor.body).not.toMatch(/signed and timestamped/i);
    expect(anchor.body).toContain("Separately");
    expect(anchorProof(root, ots).text).toContain("separately");
    expect(anchorProof(root, ots).text).not.toMatch(/timestamps? of this root/i);
  });

  it("drops the timestamp clause entirely when that door did not answer", () => {
    expect(anchorProof(root, null).text).not.toMatch(/Bitcoin/);
    expect(anchorProof(root, null).text).toContain("305 records under one signed root");
  });

  it("says the root is unread rather than printing a stale timestamp", () => {
    expect(machineProof({ kind: "failed", reason: "offline" }).text).toContain("offline");
    expect(machineProof({ kind: "loading" }).live).toBe(false);
  });

  it("renders six cards with no banned string", () => {
    const html = render(<HomeStrengths corrections={corrections} root={root} ots={ots} />);
    expect(html.match(/data-strength="/g)).toHaveLength(6);
    expect(html).toContain("STALE");
    for (const re of BANNED) expect(html).not.toMatch(re);
  });
});

/* ── navigator ─────────────────────────────────────────────────────────── */

describe("HomeNavigator", () => {
  it("groups the estate by the five questions a reader arrives with", () => {
    expect(NAV_GROUPS.map((g) => g.id)).toEqual(["see", "check", "use", "changed", "who"]);
    for (const g of NAV_GROUPS) expect(g.question.endsWith("?")).toBe(true);
  });

  it("gives every door a real destination and a sentence about what it opens", () => {
    for (const g of NAV_GROUPS) {
      expect(g.links.length).toBeGreaterThan(2);
      for (const l of g.links) {
        expect(l.href).not.toBe("");
        expect(l.href).not.toBe("#");
        expect(l.what.length).toBeGreaterThan(10);
      }
    }
  });

  it("reaches the board, the verifier, the ledger, the data doors and the library", () => {
    const hrefs = NAV_GROUPS.flatMap((g) => g.links.map((l) => l.href));
    for (const href of ["#board", "/gspc-verify", "/refutation-ledger", "#machine-surface", "/library", "/memberships", "/contact/?arm=run"]) {
      expect(hrefs).toContain(href);
    }
  });

  it("renders every group", () => {
    const html = render(<HomeNavigator />);
    for (const g of NAV_GROUPS) expect(html).toContain(g.question);
    for (const re of BANNED) expect(html).not.toMatch(re);
  });
});

/* ── machine surface ───────────────────────────────────────────────────── */

describe("HomeMachineSurface", () => {
  const doors = {
    stablecoins: { payload: { title: "Stablecoin universe", state: "INDEXED", n: 425, n_unit: "assets catalogued", as_of: "2026-09-16" } },
    "x402-bazaar": { payload: { title: "x402 Bazaar listings", state: "INDEXED", n: null, as_of: "2026-09-17" } },
    a2a: { payload: null, reason: "/api/pop/a2a answered HTTP 500" },
    "ots-proofs": { payload: ots },
  };
  const manifest: ReadState<{ resources: unknown[]; mcp: { free_tools: string[]; paid_tools: string[] } }> = {
    kind: "ready",
    payload: { resources: new Array(21).fill({ url: "x" }), mcp: { free_tools: new Array(9).fill("f"), paid_tools: new Array(4).fill("p") } },
  };

  it("renders ten door lines and never a total across them", () => {
    const html = render(<HomeMachineSurface doors={doors} manifest={manifest as never} />);
    expect(html.match(/data-door="/g)).toHaveLength(10);
    expect(html).toContain("never added together");
    // 425 + 600 must not appear anywhere as a sum.
    expect(html).not.toContain("1,025");
  });

  it("shows a refused total as words and an unread door as UNREAD", () => {
    const html = render(<HomeMachineSurface doors={doors} manifest={manifest as never} />);
    expect(html).toContain("no total published");
    expect(html).toContain('data-door-state="UNREAD"');
    expect(html).toContain("HTTP 500");
  });

  it("counts the doors and tools off the manifest arrays", () => {
    const html = render(<HomeMachineSurface doors={doors} manifest={manifest as never} />);
    expect(html).toContain("21 doors");
    expect(html).toContain("9 free tools");
    expect(html).toContain("4 metered");
  });

  it("names only machine doors that are published, each with what it serves", () => {
    expect(MACHINE_DOORS.map((d) => d.href)).toEqual(
      expect.arrayContaining(["/api/gspc", "/mcp", "/.well-known/agent.json", "/.well-known/x402.json", "/.well-known/did.json", "/llms.txt"]),
    );
    for (const d of MACHINE_DOORS) expect(d.what.length).toBeGreaterThan(10);
  });

  it("says the manifest is unread rather than printing a door count from memory", () => {
    const html = render(<HomeMachineSurface doors={doors} manifest={{ kind: "failed", reason: "HTTP 502" } as never} />);
    expect(html).toContain("could not be read");
    expect(html).toContain("HTTP 502");
    expect(html).not.toContain("21 doors");
  });
});

/* ── reach ─────────────────────────────────────────────────────────────── */

describe("HomeReach", () => {
  it("prints each corpus with its own kind and never adds them", () => {
    const lines = corpusLines(estate) as { figure: string; headline: string; qualifier: string }[];
    expect(lines.map((l) => l.figure)).toEqual(["335", "305", "0"]);
    expect(lines[0].qualifier).toContain("measured");
    expect(lines[1].qualifier).toContain("catalogued");
    expect(lines[2].headline).toContain("in common");
    // 335 + 305 is not a number about anything.
    expect(lines.map((l) => l.figure)).not.toContain("640");
  });

  it("reports an unread state rather than an empty row of zeroes", () => {
    expect(corpusLines({ kind: "failed", reason: "HTTP 500" })).toEqual({ unread: "HTTP 500" });
    expect(corpusLines({ kind: "loading" })).toEqual([]);
  });

  it("renders the figures with their kinds and the warning against adding them", () => {
    const html = render(<HomeReach state={estate} />);
    expect(html).toContain("335");
    expect(html).toContain("305");
    expect(html).toContain("never add them");
    for (const re of BANNED) expect(html).not.toMatch(re);
  });
});

/* ── the front door never opens on a withdrawal notice ─────────────────── */

describe("the withdrawal record is reachable, but never the front door's first impression", () => {
  // OWNER RULING 2026-09-22. The reviewed-reading manifest carries a withdrawn entry, and the
  // band used to render it under "This material is under review" on the home page. It is real,
  // it stays published, and it stays reachable from the refutation ledger — it just does not get
  // a section on the page a stranger lands on.
  it("has a withdrawn entry to suppress, so this test is about a real state", () => {
    expect(withdrawnReadingRecords().length).toBeGreaterThan(0);
  });

  it("renders no withdrawal block when showWithdrawn is false", () => {
    const html = render(<HomeEvidenceShowcase sections="reading" showWithdrawn={false} />);
    expect(html).not.toContain('data-publication-state="withdrawn"');
    expect(html).not.toContain("This material is under review");
    expect(html).not.toContain("Withdrawal record");
    // The reviewed half still ships.
    expect(html).toContain("Read the method behind the board");
  });

  it("still renders it everywhere else, so nothing was deleted", () => {
    const html = render(<HomeEvidenceShowcase sections="reading" />);
    expect(html).toContain('data-publication-state="withdrawn"');
    expect(html).toContain("This material is under review");
  });

  it("never promotes a withdrawn entry as ready reading, either way", () => {
    const withdrawnHrefs = new Set(withdrawnReadingRecords().map((w) => w.href));
    for (const html of [
      render(<HomeEvidenceShowcase sections="reading" showWithdrawn={false} />),
      render(<HomeEvidenceShowcase sections="reading" />),
    ]) {
      const promoted = html.slice(0, html.indexOf("withdrawn-reading") + 1 || html.length);
      for (const href of withdrawnHrefs) expect(promoted).not.toContain(`id="reading-${href.replace(/[^a-z0-9]+/gi, "-")}"`);
    }
  });
});

/* ── the front door leads with reach, not with a column of absences ─────── */

describe("HomeReach presentation", () => {
  it("leads with what the work reaches, in the reader's words", () => {
    const html = render(<HomeReach state={estate} />);
    expect(html).toContain("The work travels");
    expect(html).toContain("How far it reaches");
  });

  it("mounts the stages that have something to say, not the whole funnel", () => {
    const html = render(<HomeReach state={estate} />);
    // The hero variant, whose stages are the ones with a figure or a checkable state.
    expect(html).toContain('data-testid="live-counters-hero"');
    expect(html).not.toContain('data-testid="live-counters-footer"');
  });

  it("keeps dry accounting words off the face of the page", () => {
    const html = render(<HomeReach state={estate} />);
    const ourCopy = html.replace(/<section data-testid="live-counters-hero"[\s\S]*?<\/section>/g, "");
    for (const word of [/\bcumulative\b/i, /\baggregate\b/i, /\bgross\b/i]) expect(ourCopy).not.toMatch(word);
  });
});

/* ── weak score ────────────────────────────────────────────────────────── */

describe("HomeWeakScore", () => {
  const card = {
    id: WEAK_CARD_ID,
    pubkey: "d4cb0eaa",
    body: {
      accuracy: 0.0968,
      axis: "care-refusal-protect",
      model: "clan-csoai-plain:latest",
      created: "2026-08-19T09:24:39.152331+00:00",
      issuer: "CSOAI Ltd (UK 16939677)",
      public_framing: "13 measured of 14 quotable",
    },
  };

  it("reads the score out of the fetched record, never out of this repository", () => {
    expect(accuracyText(card)).toBe("9.7%");
    expect(accuracyText({ body: {} })).toBe("not published");
    expect(accuracyText(null)).toBe("not published");
    expect(fieldText(card, "axis")).toBe("care-refusal-protect");
    expect(fieldText(card, "nothing")).toBe("not published");
  });

  it("shows whatever verdict the verifier returned, including a bad one", () => {
    const valid = render(<HomeWeakScore read={{ kind: "ready", card, verdict: { state: "VALID", reason: "the hash matched and the signature verifies" } }} />,
    );
    expect(valid).toContain('data-verdict="VALID"');
    expect(valid).toContain("9.7%");
    expect(valid).toContain("signed card under our published key");
    expect(valid).not.toContain("every other result");

    const bad = render(<HomeWeakScore read={{ kind: "ready", card, verdict: { state: "INVALID", reason: "the signature does not verify" } }} />,
    );
    expect(bad).toContain('data-verdict="INVALID"');
    expect(bad).toContain("the signature does not verify");
  });

  it("claims no superlative it has not counted", () => {
    // "the worst score we have ever published" and "the lowest score we have published" both
    // shipped on this band until the 335 signed bodies were actually counted: the minimum is
    // 0.0, not this card. A superlative a reader cannot check is the defect this instrument
    // exists to catch.
    const html = render(
      <HomeWeakScore read={{ kind: "ready", card, verdict: { state: "VALID", reason: "ok" } }} />,
    );
    expect(html).not.toMatch(/\bthe (worst|lowest)\b/i);
    expect(html).toContain("not even the bottom");
    expect(html).toContain("/signed/card_index.json");
    for (const c of strengthCards({ corrections, root, ots })) {
      expect(c.proof.text).not.toMatch(/\bthe (worst|lowest|highest|best)\b/i);
    }
  });

  it("discloses the superseded framing frozen inside the signed bytes", () => {
    const html = render(<HomeWeakScore read={{ kind: "ready", card, verdict: { state: "VALID", reason: "ok" } }} />,
    );
    expect(html).toContain("13 measured of 14 quotable");
    expect(html).toContain("out of date, on purpose");
    expect(html).toContain("We supersede");
  });

  it("shows no score at all when the record could not be fetched", () => {
    const html = render(<HomeWeakScore read={{ kind: "failed", reason: "HTTP 404" }} />);
    expect(html).toContain("could not be read");
    expect(html).toContain("HTTP 404");
    expect(html).not.toContain("9.7%");
  });
});
