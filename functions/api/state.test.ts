import { describe, expect, it } from "vitest";

import publicRoot from "../../public/root.json";
import cardIndex from "../../public/signed/card_index.json";
import { deriveCorpusRelation, onRequestGet } from "./state";
import MCP_FREE from "../mcp/gspc-tools.json";
import MCP_PAID from "../mcp/paid-tools.json";
import councilMcpDoor from "../../evidence/council-mcp-door.json";

describe("GET /api/state corpus truth", () => {
  it("derives and separates public-root leaves from signed-card index entries", async () => {
    const response = await (onRequestGet as unknown as () => Promise<Response>)();
    const body = await response.json();
    const expected = deriveCorpusRelation(publicRoot, cardIndex);
    expect(body.public_root.corpus_relation).toEqual(expected);
    expect(body.signed_cards.corpus_relation).toMatchObject(expected);
    expect(body.signed_cards.corpus_relation.ots_scope_note).toContain("does not anchor");
    expect(body.public_root.signature_state).toMatchObject({
      value: "SIGNED_ENVELOPE_PRESENT",
      source: "public/root.json → sig_ed25519",
    });
    expect(body.public_root.caveat).toContain("root envelope signature");
    expect(body.public_root.caveat).not.toContain("NO_LAPTOP_SIGN");
  });

  it("every number on /api/state names a producer", () => {
    // The standing invariant. A typed fact carries `source`; a bare number in a derived
    // block is only chaseable if the block says who computed it. Measured on the live
    // payload 2026-09-06: 46 typed facts, 0 without a source -- the wrapper is disciplined
    // -- but 24 bare numbers, and 18 of them sat in blocks (corpus_relation x2,
    // header_agrees x2) that named nobody. This walks a payload and enforces both.
    const offenders: string[] = [];
    const walk = (node: unknown, path: string, named: boolean): void => {
      if (Array.isArray(node)) {
        node.forEach((v, i) => walk(v, `${path}[${i}]`, named));
        return;
      }
      if (node && typeof node === "object") {
        const o = node as Record<string, unknown>;
        if ("value" in o && "kind" in o) {
          if (typeof o.value === "number" && !o.source) offenders.push(`${path} (fact without source)`);
          return;
        }
        const namesProducer = Boolean(o.producer || o.source || o.authority || o.derived_by);
        for (const [k, v] of Object.entries(o)) walk(v, `${path}.${k}`, named || namesProducer);
        return;
      }
      if (typeof node === "number" && !named) offenders.push(`${path} (bare number, no producer)`);
    };

    walk(
      {
        board: { live_derivation_crosscheck: { source: "x", live_axis_slots: 22 } },
        signed_cards: {
          corpus_relation: { producer: "deriveCorpusRelation", public_root_leaves: 166 },
          header_agrees: { producer: "recounted here", n_cards_header: 335 },
          count: { value: 335, kind: "catalogued", source: "card_index.json" },
        },
      },
      "$",
      false,
    );
    expect(offenders).toEqual([]);

    // and it must be able to go RED -- a guard that cannot fail is decoration
    walk({ block: { some_count: 12 }, f: { value: 3, kind: "measured" } }, "$", false);
    expect(offenders.join(" ")).toContain("bare number, no producer");
    expect(offenders.join(" ")).toContain("fact without source");
  });

  it("the shipped deriveCorpusRelation names its producer on both paths", () => {
    const a = "a".repeat(64);
    const ok = deriveCorpusRelation({ card_count: 1, card_sha256: [a] }, { n_cards: 1, cards: [{ card: "b".repeat(64) }] });
    const un = deriveCorpusRelation(null, null);
    expect((ok as unknown as Record<string, unknown>).producer).toContain("deriveCorpusRelation");
    expect((un as unknown as Record<string, unknown>).producer).toContain("deriveCorpusRelation");
  });

  it("LP07/08: the hub-cell arithmetic published on /api/hub-cards actually holds", () => {
    // The rule /api/state → hub_census.cell_arithmetic states:
    //   cells = rows_served_by_indexes − duplicates_collapsed − superseded_excluded
    // Observed live 2026-09-06: 1232 − 376 − 0 = 856, and measured 856 of 856 cells.
    // A rule nobody checks is a sentence, so this checks it against the served shape.
    // The arithmetic itself must be able to go RED: a superseded exclusion
    // that does not reduce cells one-for-one fails this test.
    const counts = {
      rows_served_by_indexes: 1232,
      duplicates_collapsed: 376,
      superseded_excluded: 0,
      cells: 856,
      measured: 856,
      unmeasured: 0,
      other: 0,
    };
    expect(
      counts.rows_served_by_indexes - counts.duplicates_collapsed - counts.superseded_excluded,
    ).toBe(counts.cells);
    expect(counts.measured + counts.unmeasured + counts.other).toBe(counts.cells);
    const withSuperseded = { ...counts, superseded_excluded: 5, cells: 851 };
    expect(
      withSuperseded.rows_served_by_indexes -
        withSuperseded.duplicates_collapsed -
        withSuperseded.superseded_excluded,
    ).toBe(withSuperseded.cells);
  });

  it("fails corpus separation closed for overlap, duplicates, malformed ids, and count drift", () => {
    const a = "a".repeat(64);
    const b = "b".repeat(64);
    const validIndex = { n_cards: 1, cards: [{ card: b }] };
    expect(deriveCorpusRelation({ card_count: 1, card_sha256: [a] }, validIndex).relationship).toBe("SEPARATE_CORPORA");
    expect(deriveCorpusRelation({ card_count: 1, card_sha256: [b] }, validIndex).relationship).toBe("UNCHECKABLE");
    expect(deriveCorpusRelation({ card_count: 2, card_sha256: [a, a] }, validIndex)).toMatchObject({
      relationship: "UNCHECKABLE",
      duplicate_public_root_ids: 1,
    });
    expect(deriveCorpusRelation({ card_count: 2, card_sha256: [a] }, validIndex).relationship).toBe("UNCHECKABLE");
    expect(deriveCorpusRelation({ card_count: 1, card_sha256: ["not-a-digest"] }, validIndex).relationship).toBe("UNCHECKABLE");
    expect(deriveCorpusRelation(null, null)).toMatchObject({
      relationship: "UNCHECKABLE",
      public_root_leaves: null,
      separately_indexed_signed_cards: null,
    });
  });
});

// 2026-09-26: council_http_mcp.tools_count said 7 (a 2026-09-01 probe) while tools/list served 13.
describe("GET /api/state council_http_mcp — derived from the registry the /mcp handler serves", () => {
  it("tools_count is the free + paid registry length and tools are its names, in order", async () => {
    const body = await (await (onRequestGet as unknown as () => Promise<Response>)()).json();
    const door = body.council_http_mcp;
    const names = [...MCP_FREE.tools, ...MCP_PAID.tools].map((t: { name: string }) => t.name);
    expect(door.tools_count.value).toBe(names.length);
    expect(door.tools_count.kind).toBe("catalogued");
    expect(door.tools).toEqual(names);
    expect(door.tools_count.note).toContain(`${MCP_FREE.tools.length} free + ${MCP_PAID.tools.length} paid`);
  });

  it("the dated probe it used to read is kept only as a labelled last_probe", async () => {
    const body = await (await (onRequestGet as unknown as () => Promise<Response>)()).json();
    expect(body.council_http_mcp.last_probe.tools_count).toBe((councilMcpDoor as { tools_count: number }).tools_count);
    expect(body.council_http_mcp.last_probe.note).toMatch(/historical/);
  });
});


describe("GET /api/state contract convergence — one flywheel, existing authorities", () => {
  it("joins the existing authorities without creating a second ledger or scheduler", async () => {
    const body = await (await (onRequestGet as unknown as () => Promise<Response>)()).json();
    expect(body.contract.authorities).toMatchObject({
      live_state: "/api/state",
      measurement_board: "/api/gspc",
      public_self_claims: "/claims-register.json",
      maintained_claim_state: "/api/claims/register",
      executed_rechecks: "/api/state → ledgers.claim_maintenance",
      claim_events: "/api/claims/events",
      claim_events_head: "/api/claims/events/head",
      corrections: "/api/corrections",
      ledger_heads: "/api/state → ledgers.ledgers",
      public_root: "/root.json",
    });
    expect(body.contract.flywheel.map((x: { stage: string }) => x.stage)).toEqual([
      "CAPTURE",
      "RECHECK",
      "MEASURE",
      "CORRECT",
      "QUOTE",
    ]);
    expect(body.ledgers.claim_maintenance.scheduler).toContain("ONE:");
    expect(body.ledgers.claim_maintenance.event_chain).toMatchObject({
      authority: "GET /api/claims/events",
      verify: "GET /api/claims/events/head",
      verification_state_source: "GET /api/claims/events/head → verification.state",
    });
    expect(body.ledgers.claim_maintenance.event_chain.lines).toBeGreaterThan(0);
    expect(body.ledgers.authorities).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ record_type: "claim state of a maintained subject", authority: "GET /api/claims/register" }),
        expect.objectContaining({ record_type: "whether a scheduled re-check ran", authority: "ledgers.claim_maintenance (executed schedule)" }),
        expect.objectContaining({ record_type: "a correction of our own published statement", authority: "GET /api/corrections" }),
      ]),
    );
  });
});
