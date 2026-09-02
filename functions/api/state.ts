/**
 * GET /api/state — the ONE live state surface every lane quotes instead of asserting.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * WHY THIS EXISTS
 * In one week twelve lane reports each published their own counts and they did
 * not agree. The axis count was reported as 14, 15, 16, 22 and 25. The MCP fleet
 * was reported as 6, 216, 271, 291, 338, 348, 377 and 378. The card count as 150,
 * 335 and 3,851. RWA instruments as 6 and 19. Some of those differences are real
 * (they count different things in different repos); most were stale figures that
 * nothing ever retired, because nothing in the estate had the job of retiring them.
 * The board already derives its counts from signed data. Nothing else did.
 *
 * This endpoint is the thing that retires a number: if a figure is not here, it is
 * not established, and a lane may not publish it as if it were.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * THE FOUR RULES THIS FILE KEEPS
 *
 * 1. EVERY VALUE IS DERIVED FROM AN ARTIFACT, NEVER TYPED.
 *    There is not one hand-written count below. Each number is computed from a
 *    committed file at build time (counted from an array, or read from a totals
 *    block that was itself derived). Grep this file for a bare integer standing in
 *    for a count and you will not find one.
 *
 * 2. THERE IS NO `new Date()` IN THIS FILE.
 *    This is the defect that made this endpoint necessary. /api/mcp used to stamp
 *    every server with `last_checked: new Date().toISOString()` — so the endpoint
 *    told every caller that six servers had been verified moments earlier while
 *    nothing had ever been contacted. Two real requests three seconds apart came
 *    back 11:43:53.111Z and 11:43:56.233Z: the field was simply following the
 *    clock, and it was reported as a measurement. Here, `as_of` is always read
 *    FROM the artifact, and `as_of_field` names the exact key it was read from so
 *    a stranger can open the file and check. Two calls to this endpoint an hour
 *    apart return byte-identical timestamps, because a timestamp here describes
 *    when something happened, not when someone asked.
 *
 * 3. AN ABSENT TIMESTAMP IS NULL, NEVER SUBSTITUTED.
 *    public/interop/rwa-registry.json carries no timestamp of any kind. Its facts
 *    therefore carry `as_of: null` with `as_of_field: null` and a note saying so.
 *    Borrowing a neighbouring file's timestamp, or the deploy time, would assert a
 *    freshness nobody established. Unknown is null.
 *
 * 4. `kind` IS NEVER COLLAPSED.
 *      measured    — a run happened against a frozen bank/source and was graded.
 *      probed      — something was contacted and answered, at as_of.
 *      catalogued  — it is listed in a register. Nothing was contacted or run.
 *      declared    — a slot/claim published so a gap is visible. No run behind it.
 *      unmeasured  — it exists and we have NOT measured it, and we say so.
 *    A catalogue entry is not a reachable server. A declared slot is not a
 *    measurement. Summing across kinds is how 6 became 378.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * BOUNDED AUTHORITY
 * See `not_covered` in the payload. This endpoint speaks for THIS repo's committed
 * artifacts and nothing else. The separate csoai-static-deploy2 estate has its own
 * card count, which is a different number about a different set of bytes; quoting
 * one as the other is the single most common way these figures got mixed.
 *
 * Refresh path: edit the artifact, re-run its producer (scripts/mcp-probe.mjs for
 * the fleet), commit, deploy. This endpoint has no state of its own.
 */

import boardSigned from "../../public/signed/gspc-board.signed.json";
import cardIndex from "../../public/signed/card_index.json";
import chainFacts from "../../public/signed/chain-facts.json";
import claimsRegister from "../../public/claims-register.json";
import rwaRegistry from "../../public/interop/rwa-registry.json";
import mcpRegistry from "../../evidence/mcp-registry.json";
import councilMcpDoor from "../../evidence/council-mcp-door.json";
import publicRoot from "../../public/root.json";
import hubCensus from "../../public/signed/hub-census-baseline.json";

import type { AxisScore } from "./_gspc_types";
import { MEASURED_ON } from "./_gspc_types";
import { AXES_A } from "./_gspc_axes_a";
import { AXES_B } from "./_gspc_axes_b";
import { AXES_FIN } from "./_gspc_axes_fin";
import { deriveBoardCounts } from "./_boardCounts";

/** How a number was obtained. Never collapsed, never inferred from the value. */
type Kind = "measured" | "probed" | "catalogued" | "declared" | "unmeasured";

interface Fact {
  value: unknown;
  kind: Kind;
  /** The file (repo-relative) or endpoint the value came from. */
  source: string;
  /** A timestamp read OUT OF that artifact. Null when the artifact has none. */
  as_of: string | null;
  /** The exact key inside the artifact that as_of was read from. Null with as_of. */
  as_of_field: string | null;
  note?: string;
}

const fact = (
  value: unknown,
  kind: Kind,
  source: string,
  as_of: string | null,
  as_of_field: string | null,
  note?: string,
): Fact => ({ value, kind, source, as_of, as_of_field, ...(note ? { note } : {}) });

// ── sources, named once ──────────────────────────────────────────────────────
const SRC_BOARD = "public/signed/gspc-board.signed.json";
const SRC_CARDS = "public/signed/card_index.json";
const SRC_CHAIN = "public/signed/chain-facts.json (derived by scripts/derive-chain-facts.mjs from chain.json + every card body)";
const SRC_CLAIMS = "public/claims-register.json";
const SRC_RWA = "public/interop/rwa-registry.json";
const SRC_MCP = "evidence/mcp-registry.json";
const SRC_CENSUS = "public/signed/hub-census-baseline.json";
const SRC_PUBLIC_ROOT = "public/root.json";
const SRC_AXES = "functions/api/_gspc_axes_{a,b,fin}.ts (the arrays /api/gspc derives from)";

const censusAsOf: string | null = (hubCensus as { as_of?: string }).as_of ?? null;

// ── board: as_of comes from the payload's own measurement stamp ──────────────
// This artifact carries no ISO timestamp. Its honest date-of-record is the
// measurement stamp it was signed over, so that string is quoted verbatim rather
// than parsed into something that looks more precise than it is.
const boardTotals = (boardSigned as any).totals ?? {};
const boardMeasuredOn: string | null = (boardSigned as any).measured_on?.date ?? null;
const boardCustody = (boardSigned as any).custody_attestation ?? {};

// ── live derivation, so snapshot drift is visible rather than silent ─────────
// /api/gspc computes its totals from these arrays at request time. The signed
// file above is a snapshot of that computation. If the two ever disagree, the
// number a lane quotes depends on which surface it happened to read — exactly the
// failure this endpoint exists to end. So both are computed and compared here,
// and the disagreement (if any) is published rather than resolved silently.
const LIVE_AXES: AxisScore[] = [...AXES_A, ...AXES_B, ...AXES_FIN];
const liveBoard = deriveBoardCounts(LIVE_AXES);
const liveAxisSlots = liveBoard.axes;
const liveMeasuredAxes = liveBoard.measured_axes;
const liveUnmeasuredAxes = liveBoard.unmeasured_axes;
const boardAgrees =
  boardTotals.axes === liveAxisSlots &&
  boardTotals.measured_axes === liveMeasuredAxes &&
  boardTotals.unmeasured_axes === liveUnmeasuredAxes;

// ── cards: counted from the index, not read off a header ─────────────────────
const cards: Array<{ signed?: boolean }> = (cardIndex as any).cards ?? [];
const cardsCounted = cards.length;
const cardsSigned = cards.filter((c) => c.signed === true).length;
const cardsHeaderCount = (cardIndex as any).n_cards ?? null;

// ── claims register: rows tallied by status ──────────────────────────────────
const claimRows: Array<{ status?: string }> = (claimsRegister as any).claims ?? [];
const declaredStatuses: string[] = (claimsRegister as any).statuses ?? [];
const claimsByStatus: Record<string, number> = {};
for (const s of declaredStatuses) claimsByStatus[s] = 0;
const undeclaredStatuses: string[] = [];
for (const row of claimRows) {
  const s = row.status ?? "(missing)";
  if (!(s in claimsByStatus)) {
    claimsByStatus[s] = 0;
    if (!declaredStatuses.includes(s)) undeclaredStatuses.push(s);
  }
  claimsByStatus[s] += 1;
}

// ── MCP fleet: the probe's own counts, never summed across kinds ─────────────
const mcpCounts = (mcpRegistry as any).counts ?? {};
const mcpFinished: string | null = mcpCounts.finished ?? null;

// ── RWA instruments: recounted from the array, then compared to the header ───
const instruments: Array<{ address_status?: string; status?: string; control_facts?: string; chain?: string }> =
  (rwaRegistry as any).instruments ?? [];
const rwaNamed = instruments.length;
const rwaLocated = instruments.filter((i) => i.address_status === "mainnet-verified" || i.address_status === "evm-located").length;
const rwaAttested = instruments.filter((i) => i.address_status === "mainnet-verified").length;
const rwaNotLocated = instruments.filter((i) => i.address_status === "not-located").length;
const rwaControlFacts = instruments.filter((i) => String(i.control_facts || "").startsWith("MEASURED")).length;
const rwaUnmeasuredRisk = instruments.filter((i) => i.status === "UNMEASURED").length;
const rwaHeader = (rwaRegistry as any).counts ?? {};
const rwaHeaderAgrees =
  rwaHeader.named === rwaNamed &&
  rwaHeader.mainnet_verified_and_attested === rwaAttested &&
  rwaHeader.not_located === rwaNotLocated;

export const onRequestGet: PagesFunction = async () => {
  const body = {
    schema: "csoai.live-state/1",
    title: "CSOAI live state — the numbers a lane may quote",

    contract: {
      quote_this: "Every count a lane publishes must come from this endpoint, by field name.",
      not_here_not_established:
        "If a number is not in this payload, it is NOT established. Do not publish it as a fact, " +
        "do not carry it forward from an older report, and do not reconcile two stale figures by " +
        "picking one. Measure it, or say it is unmeasured.",
      derivation:
        "Every value below is computed from a committed artifact. No count in this endpoint's " +
        "source is typed by hand.",
      freshness:
        "as_of is read OUT OF the artifact and as_of_field names the key it came from. There is no " +
        "new Date() in this endpoint. Two calls any interval apart return identical as_of values; " +
        "if they ever differ, this endpoint has the defect it was built to prevent.",
      freshness_self_test:
        "curl -s https://councilof.ai/api/state | jq -S '[..|objects|select(has(\"as_of\"))|{source,as_of_field,as_of}]' > /tmp/a; sleep 5; " +
        "curl -s https://councilof.ai/api/state | jq -S '[..|objects|select(has(\"as_of\"))|{source,as_of_field,as_of}]' > /tmp/b; diff /tmp/a /tmp/b && echo IDENTICAL",
      kinds: {
        measured: "A run happened against a frozen bank or source and was graded.",
        probed: "Something was contacted and answered, at as_of.",
        catalogued: "It is listed in a register. Nothing was contacted and nothing was run.",
        declared: "A slot or claim published so a gap is visible. No run behind it.",
        unmeasured: "It exists and we have not measured it — stated, not implied.",
      },
      kinds_rule:
        "These are never collapsed and never summed together. A catalogue entry is not a reachable " +
        "server; a declared slot is not a measurement. Adding across kinds is how a fleet of 1 " +
        "reachable server got published as 378.",
    },

    // ── THE BOARD ────────────────────────────────────────────────────────────
    board: {
      authority: SRC_AXES,
      live_endpoint: "/api/gspc",
      axis_slots: fact(
        liveBoard.axes,
        "declared",
        SRC_AXES + " → deriveBoardCounts(axes).axes",
        MEASURED_ON.date,
        "MEASURED_ON.date",
        "A count of SLOTS on the board. A slot is published so a gap is visible; it is not " +
          "evidence that anything was measured. Never quote this number alone.",
      ),
      measured_axes: fact(
        liveBoard.measured_axes,
        "measured",
        SRC_AXES + " → deriveBoardCounts(axes).measured_axes",
        MEASURED_ON.date,
        "MEASURED_ON.date",
        "Slots with a real graded run behind them. This is the number to quote if you quote only one.",
      ),
      unmeasured_axes: fact(
        liveBoard.unmeasured_axes,
        "declared",
        SRC_AXES + " → deriveBoardCounts(axes).unmeasured_axes",
        MEASURED_ON.date,
        "MEASURED_ON.date",
        "Declared slots with no run behind them. Published so the gap is visible.",
      ),
      public_count: fact(
        liveBoard.public_count,
        "declared",
        SRC_AXES + " → deriveBoardCounts(axes).public_count",
        MEASURED_ON.date,
        "MEASURED_ON.date",
        "The short sentence. Safe to quote verbatim because it carries both numbers.",
      ),
      count_grammar: fact(
        liveBoard.count_grammar,
        "declared",
        SRC_AXES + " → deriveBoardCounts(axes).count_grammar",
        MEASURED_ON.date,
        "MEASURED_ON.date",
        "The long form, verbatim from the signed payload. Quote this when a report has room for it.",
      ),
      by_family: fact(
        liveBoard.by_family,
        "declared",
        SRC_AXES + " → deriveBoardCounts(axes).by_family",
        MEASURED_ON.date,
        "MEASURED_ON.date",
        "The two families are measured by two different instruments and their counts are not " +
          "interchangeable. A behavioural-family figure is not a board figure.",
      ),
      signed_snapshot: {
        note:
          "Historical custody snapshot. Its signature remains checkable for its original bytes, but " +
          "its counters do not govern the living board after the axis arrays changed. It is exposed " +
          "as stale rather than deleted or silently treated as current.",
        source: SRC_BOARD,
        state: boardAgrees ? "CURRENT" : "STALE",
        counters: {
          axes: boardTotals.axes ?? null,
          measured_axes: boardTotals.measured_axes ?? null,
          unmeasured_axes: boardTotals.unmeasured_axes ?? null,
          public_count: boardTotals.public_count ?? null,
        },
        as_of: boardMeasuredOn,
        as_of_field: "measured_on.date",
        agrees_with_authority: boardAgrees,
        signature: {
          signer: boardCustody.signer ?? null,
          alg: boardCustody.alg ?? null,
          keyid: boardCustody.keyid ?? null,
          content_id: boardCustody.content_id ?? null,
          custody: boardCustody.custody ?? null,
          verify: boardCustody.verify ?? null,
          sig_input: boardCustody.sig_input ?? null,
        },
      },
      caveat:
        "Measurement, not certification. A score describes a measured run on a frozen split on a " +
        "date; it does not describe anyone's compliance with anything.",
    },

    // ── COUNCIL HTTP MCP DOOR (not the 2026-08-27 fleet probe) ──────────────
    council_http_mcp: {
      authority: "evidence/council-mcp-door.json",
      url: (councilMcpDoor as { url: string }).url,
      tools_count: fact(
        (councilMcpDoor as { tools_count: number }).tools_count,
        "probed",
        "evidence/council-mcp-door.json → tools_count",
        (councilMcpDoor as { as_of: string }).as_of,
        "as_of",
        "POST /mcp tools/list. Seven tools. Distinct from mcp_fleet.tools_probed (8 from two other servers on 2026-08-27). Do not add those numbers.",
      ),
      tools: (councilMcpDoor as { tools: string[] }).tools,
    },

    // ── THE MCP FLEET ────────────────────────────────────────────────────────
    mcp_fleet: {
      authority: SRC_MCP,
      live_endpoint: "/api/mcp",
      produced_by: (mcpRegistry as any).generated_by ?? null,
      probe_method: (mcpRegistry as any).probe_method ?? null,
      probe_host: (mcpRegistry as any).probe_host ?? null,
      reachable_distinct_servers: fact(
        mcpCounts.reachable_distinct_servers ?? null,
        "probed",
        SRC_MCP + " → counts.reachable_distinct_servers",
        mcpFinished,
        "counts.finished",
        "Servers that answered MCP initialize from probe_host. Alias endpoints for the same server " +
          "are excluded, so this is the honest fleet size.",
      ),
      reachable_endpoints: fact(
        mcpCounts.reachable_endpoints ?? null,
        "probed",
        SRC_MCP + " → counts.reachable_endpoints",
        mcpFinished,
        "counts.finished",
        "URLs that answered. Larger than the distinct server count when a server is behind an alias.",
      ),
      unreachable_endpoints: fact(
        mcpCounts.unreachable_endpoints ?? null,
        "probed",
        SRC_MCP + " → counts.unreachable_endpoints",
        mcpFinished,
        "counts.finished",
        "Contacted and did not answer. This is a result, not an absence of one.",
      ),
      catalogued_not_probed: fact(
        mcpCounts.catalogued_not_probed ?? null,
        "catalogued",
        SRC_MCP + " → counts.catalogued_not_probed",
        mcpFinished,
        "counts.finished",
        "Ids with no published endpoint. NEVER contacted. Adding this to a reachable count is the " +
          "specific arithmetic that produced the inflated fleet figures.",
      ),
      tools_probed: fact(
        mcpCounts.tools_probed ?? null,
        "probed",
        SRC_MCP + " → counts.tools_probed",
        mcpFinished,
        "counts.finished",
        "Derived from the length of a tools array a server actually returned.",
      ),
      tools_catalogued_not_probed: fact(
        mcpCounts.tools_catalogued_not_probed ?? null,
        "unmeasured",
        SRC_MCP + " → counts.tools_catalogued_not_probed",
        mcpFinished,
        "counts.finished",
        "Null is the honest value: a catalogue's asserted tool count is never adopted as a probed one.",
      ),
      external_catalogues_not_probed: fact(
        mcpCounts.external_catalogues_not_probed ?? [],
        "catalogued",
        SRC_MCP + " → counts.external_catalogues_not_probed",
        mcpFinished,
        "counts.finished",
        "Directory listings in other repos. Each entry states why its number is unverifiable from " +
          "this machine. These counts are NOT part of any fleet figure and must not be quoted as one.",
      ),
      never_sum:
        "reachable and catalogued-not-probed are different kinds and are never added. A directory " +
        "listing is not a fleet.",
    },

    // ── HUB CENSUS ───────────────────────────────────────────────────────────
    // A dated listing walk. DISCOVERED, not MEASURED. Quote these fields; do
    // not say we scored the Hub. Live RunPod / AG-UI probes are NOT here.
    hub_census: {
      authority: SRC_CENSUS,
      live_endpoint: "/api/compute",
      listings_observed: fact(
        (hubCensus as { n_unique_ids?: number }).n_unique_ids ?? null,
        "catalogued",
        SRC_CENSUS + " → n_unique_ids",
        censusAsOf,
        "as_of",
        "Unique Hub repo ids seen on a metadata walk. DISCOVERED listings. Not models graded. " +
          "Not MEASURED. Never quote this as a coverage score.",
      ),
      n_measured: fact(
        (hubCensus as { n_measured?: number }).n_measured ?? 0,
        "catalogued",
        SRC_CENSUS + " → n_measured",
        censusAsOf,
        "as_of",
        "GSPC cells written by this walk. Zero. Do not stamp MEASURED on the queue.",
      ),
      listing_state_all: fact(
        (hubCensus as { listing_state_all?: string }).listing_state_all ?? "DISCOVERED",
        "catalogued",
        SRC_CENSUS + " → listing_state_all",
        censusAsOf,
        "as_of",
        "Every row in this walk is a listing. A listing is not a grade.",
      ),
      status_all: fact(
        (hubCensus as { status_all?: string }).status_all ?? "UNMEASURED",
        "unmeasured",
        SRC_CENSUS + " → status_all",
        censusAsOf,
        "as_of",
        "The walk did not grade. UNMEASURED is the finding.",
      ),
      complete: fact(
        (hubCensus as { complete?: boolean }).complete ?? false,
        "catalogued",
        SRC_CENSUS + " → complete",
        censusAsOf,
        "as_of",
        "The Hub list_models cursor exhausted. That is a finished walk, not a finished grade.",
      ),
      complete_reason: fact(
        (hubCensus as { complete_reason?: string }).complete_reason ?? null,
        "catalogued",
        SRC_CENSUS + " → complete_reason",
        censusAsOf,
        "as_of",
      ),
      pages_done: fact(
        (hubCensus as { pages_done?: number }).pages_done ?? null,
        "catalogued",
        SRC_CENSUS + " → pages_done",
        censusAsOf,
        "as_of",
      ),
      sha256_jsonl: fact(
        (hubCensus as { sha256_jsonl?: string }).sha256_jsonl ?? null,
        "catalogued",
        SRC_CENSUS + " → sha256_jsonl",
        censusAsOf,
        "as_of",
        "Digest of the listings file. A census digest is not a signed GSPC cell.",
      ),
      weights_downloaded: fact(
        (hubCensus as { weights_downloaded?: number }).weights_downloaded ?? 0,
        "catalogued",
        SRC_CENSUS + " → weights_downloaded",
        censusAsOf,
        "as_of",
        "Must stay 0. A census machine does not download weights.",
      ),
    },

    // ── PUBLISHED SIGNED CARDS ───────────────────────────────────────────────
    signed_cards: {
      authority: SRC_CARDS,
      live_endpoint: "/api/cards",
      count: fact(
        cardsCounted,
        "catalogued",
        SRC_CARDS + " → cards[].length",
        (cardIndex as any).created ?? null,
        "created",
        "Counted from the index array, not read off its n_cards header, so a header that drifts from " +
          "its own contents cannot become the published number.",
      ),
      signed_entries: fact(
        cardsSigned,
        "catalogued",
        SRC_CARDS + " → cards[].filter(signed === true).length",
        (cardIndex as any).created ?? null,
        "created",
        "Entries carrying a signature. signed=true means the card carries a JWS signature under kid.",
      ),
      header_agrees: {
        n_cards_header: cardsHeaderCount,
        agrees: cardsHeaderCount === cardsCounted,
        note: "If agrees is false the artifact is internally inconsistent and neither number is quotable.",
      },
      packaged_at: fact(
        (cardIndex as any).packaged_at ?? null,
        "declared",
        SRC_CARDS + " → packaged_at",
        (cardIndex as any).packaged_at ?? null,
        "packaged_at",
        "When the bundle was packaged. Later than `created`, and not a measurement date.",
      ),
      chain_head: (cardIndex as any).head ?? null,
      pubkey: (cardIndex as any).pubkey ?? null,
      how_to_verify: {
        steps: [
          "1. Fetch /signed/card_index.json — the index and its chain head.",
          "2. Fetch /.well-known/did.json — the estate's published keys. Trust anchors HERE, not in the payload.",
          "3. Verify each card's Ed25519 signature against the kid on its entry.",
          "4. Re-walk the SHA-256 hash chain and check it terminates at `head`.",
        ],
        offline: "The whole path runs offline. It needs neither our servers nor our permission.",
        guide: "/signed/HOW-TO-VERIFY.md",
        page: "/gspc-verify",
      },
      floor_note:
        "This count is the verifiable floor: it is what the published index actually contains. " +
        "Larger figures have circulated for card sets in other repos and for cards never published " +
        "here — see not_covered. A number that no published index contains is not a card count.",
    },

    // ── THE SIGNED CARD CHAIN ────────────────────────────────────────────────
    // Included because signed_cards.count above answers a NARROWER question than
    // the one every surface actually asks. It counts the rows in card_index.json —
    // a subset index frozen at the verifiable floor — while the published card
    // STORE holds more bodies than that index lists. Both facts are true, they are
    // not the same fact, and a page that quotes one as the other is wrong either
    // way. So the store is derived and published on its own line.
    card_chain: {
      authority: SRC_CHAIN,
      manifest: "/signed/chain.json",
      verifier: "/signed/verify-card.mjs",
      guide: "/signed/HOW-TO-VERIFY.md",
      bodies_published: fact(
        (chainFacts as any).bodies.published,
        "catalogued",
        SRC_CHAIN + " → bodies.published",
        (chainFacts as any).as_of,
        (chainFacts as any).as_of_field,
        "Card bodies present in public/signed/cards/, counted from the directory.",
      ),
      bodies_verified_valid: fact(
        (chainFacts as any).bodies.verified_valid,
        "measured",
        SRC_CHAIN + " → bodies.verified_valid",
        (chainFacts as any).as_of,
        (chainFacts as any).as_of_field,
        "Bodies that VERIFY: id recomputed from the canonical body and the Ed25519 signature " +
          "checked against the pinned card-attestation key, by the same verifier we publish. " +
          "This is a measurement, not a catalogue entry — the check was run.",
      ),
      distinct_signing_keys: fact(
        (chainFacts as any).bodies.distinct_pubkeys,
        "measured",
        SRC_CHAIN + " → bodies.distinct_pubkeys",
        (chainFacts as any).as_of,
        (chainFacts as any).as_of_field,
        "Distinct pubkey values across the published bodies.",
      ),
      chain_positions: fact(
        (chainFacts as any).chain.positions,
        "catalogued",
        SRC_CHAIN + " → chain.positions",
        (chainFacts as any).as_of,
        (chainFacts as any).as_of_field,
        "Positions listed in the chain manifest, recounted from links[] rather than read off its header.",
      ),
      bodies_withheld: fact(
        (chainFacts as any).chain.bodies_withheld,
        "declared",
        SRC_CHAIN + " → chain.bodies_withheld",
        (chainFacts as any).as_of,
        (chainFacts as any).as_of_field,
        (chainFacts as any).withheld.why_withheld,
      ),
      withheld_attested_by_published_parent: fact(
        (chainFacts as any).withheld.attested_by_published_parent,
        "measured",
        SRC_CHAIN + " → withheld.attested_by_published_parent",
        (chainFacts as any).as_of,
        (chainFacts as any).as_of_field,
        (chainFacts as any).withheld.what_this_means,
      ),
      manifest_signed: {
        value: (chainFacts as any).chain.manifest_signed,
        note: (chainFacts as any).chain.manifest_signed_note,
      },
      index_relationship: (chainFacts as any).index.relationship_note,
      never_conflate:
        "bodies_published is the STORE. signed_cards.count is the INDEX. bodies_withheld is a " +
        "DISCLOSURE, and only withheld_attested_by_published_parent is a PROOF. Four different " +
        "numbers about four different things — never substituted for one another.",
    },

    // ── THE CLAIMS REGISTER ──────────────────────────────────────────────────
    claims_register: {
      authority: SRC_CLAIMS,
      page: "/claims-register",
      corrections_feed: "/api/corrections",
      rows_total: fact(
        claimRows.length,
        "declared",
        SRC_CLAIMS + " → claims[].length",
        (claimsRegister as any).generated_at ?? null,
        "generated_at",
        "Every material capability claim made on a public surface, with its evidence.",
      ),
      rows_by_status: fact(
        claimsByStatus,
        "declared",
        SRC_CLAIMS + " → claims[] tallied by .status",
        (claimsRegister as any).generated_at ?? null,
        "generated_at",
        "Tallied from the rows. A status declared in the register's vocabulary but used by no row " +
          "reports 0 rather than being omitted, so the absence is visible.",
      ),
      status_vocabulary: (claimsRegister as any).doctrine ?? null,
      undeclared_statuses_found: undeclaredStatuses,
      undeclared_note:
        "Non-empty means a row uses a status the register never declared — an artifact defect, not a " +
        "new category. Fix the artifact; do not invent a meaning for it here.",
      how_to_challenge: (claimsRegister as any).how_to_challenge ?? null,
    },

    // ── RWA INSTRUMENTS ──────────────────────────────────────────────────────
    // Included because this is a live disagreement: 6 and 19 have both been
    // published as "the instrument count". Neither is what the registry says.
    rwa_instruments: {
      authority: SRC_RWA,
      chain: (rwaRegistry as any).chain ?? null,
      named: fact(
        rwaNamed,
        "catalogued",
        SRC_RWA + " → instruments[].length",
        null,
        null,
        "Instruments the registry NAMES. Naming is not locating, attesting, or measuring. See /interop/xrpl-16.json for the 16-name catalogue (located 9 / not-located 7).",
      ),
      located: fact(
        rwaLocated,
        "catalogued",
        SRC_RWA + " → instruments[].address_status in {mainnet-verified, evm-located}",
        null,
        null,
        "Has a public r-address or EVM contract. Located is not attested and is not MEASURED.",
      ),
      mainnet_verified_and_attested: fact(
        rwaAttested,
        "probed",
        SRC_RWA + " → instruments[].filter(address_status === 'mainnet-verified').length",
        null,
        null,
        "XRPL issuer accounts with a locatable public r-address (six). Not EVM. Not an attestation TX (those remain DEVNET). Control-facts MEASURED is a different field.",
      ),
      control_facts_measured: fact(
        rwaControlFacts,
        "measured",
        SRC_RWA + " → instruments[].control_facts starts MEASURED",
        null,
        null,
        "Signed control-facts run exists (XRPL v0.2 and EVM facts). Risk verdict stays UNMEASURED.",
      ),
      not_located: fact(
        rwaNotLocated,
        "unmeasured",
        SRC_RWA + " → instruments[].filter(address_status === 'not-located').length",
        null,
        null,
        "No independently confirmable public r-address. Accounted for, never attested. This gap is " +
          "SCOPE, not staleness.",
      ),
      risk_status: fact(
        { UNMEASURED: rwaUnmeasuredRisk, of: rwaNamed },
        "unmeasured",
        SRC_RWA + " → instruments[].status",
        null,
        null,
        "What the control facts imply about any instrument's risk, solvency or creditworthiness is " +
          "UNMEASURED and needs counsel. Not a rating, not advice, not an endorsement.",
      ),
      no_timestamp_note:
        "This artifact carries NO timestamp of any kind, so every as_of above is null and " +
        "as_of_field is null with it. A neighbouring file's date is not this file's date, and the " +
        "deploy time is nobody's measurement time. Unknown stays null.",
      header_agrees: {
        header: rwaHeader,
        agrees: rwaHeaderAgrees,
        note: "The header block is recomputed from the instruments array rather than trusted.",
      },
      rail_honesty: (rwaRegistry as any).honesty ?? null,
    },

    // ── PUBLIC-ROOT (permissionless Merkle; NOT GSPC) ────────────────────────
    public_root: {
      authority: SRC_PUBLIC_ROOT,
      live_endpoint: "/root.json",
      xrpl_reader: "/api/xrpl",
      card_count: fact(
        (publicRoot as any).card_count ?? null,
        "catalogued",
        SRC_PUBLIC_ROOT + " → card_count",
        (publicRoot as any).as_of ?? null,
        "as_of",
        "Leaves on the permissionless public-root. Separate from signed_cards.count and from GSPC.",
      ),
      xrpl_asset_count_attempted: fact(
        (publicRoot as any).xrpl_asset_count_attempted ?? null,
        "catalogued",
        SRC_PUBLIC_ROOT + " → xrpl_asset_count_attempted",
        (publicRoot as any).as_of ?? null,
        "as_of",
        "xrpl.fi instruments attempted this fold. Not a GSPC mill. Not 377 instruments.",
      ),
      merkle_root: fact(
        (publicRoot as any).merkle_root ?? null,
        "catalogued",
        SRC_PUBLIC_ROOT + " → merkle_root",
        (publicRoot as any).as_of ?? null,
        "as_of",
        "Merkle over card_sha256[]. Stranger inclusion is membership in that list.",
      ),
      schema: fact(
        (publicRoot as any).schema ?? null,
        "declared",
        SRC_PUBLIC_ROOT + " → schema",
        (publicRoot as any).as_of ?? null,
        "as_of",
        "Frozen card-v0 schema URL.",
      ),
      caveat:
        "Card sig_ed25519 is null (NO_LAPTOP_SIGN). This is not GSPC. Hugging Face " +
        "csoai/gspc-boards public-root/root.json is a mirror of these bytes, not a second board.",
    },

    // ── BOUNDED AUTHORITY ────────────────────────────────────────────────────
    not_covered: {
      rule:
        "This endpoint speaks ONLY for the committed artifacts named above, in this repo " +
        "(CSOAI-ORG/councilof-ai). For anything below, /api/state is silent — and silence here is " +
        "not permission to quote a figure from somewhere else as if it were.",
      items: [
        {
          subject: "csoai-static-deploy2 (the separate static estate)",
          why_not:
            "A different repo with its own card set and its own card count, which is a DIFFERENT " +
            "NUMBER about a different set of bytes. Conflating it with signed_cards.count above is " +
            "the single most common source of the competing card figures.",
          where: "That estate's own signed index. Quote it as that estate's number, never as this one's.",
        },
        {
          subject: "gspc-os vendored server directories",
          why_not:
            "A private, pod-only checkout. Its server directories have never been contacted from any " +
            "machine that publishes this endpoint, so its size is a directory listing, not a fleet.",
          where:
            "Probe with scripts/mcp-stdio-probe.py on a host where the repo exists, commit the output, " +
            "then it becomes quotable — as a probed count, on its own line.",
        },
        {
          subject: "arena / leaderboard axis counts",
          why_not:
            "The arena measures a different set of axes with a different instrument. Its figures are " +
            "not board figures and were mistaken for contradictions of the board before now.",
          where: "/api/arena surfaces, labelled as arena figures.",
        },
        {
          subject: "benchmark-results/ working files in coai-dashboard",
          why_not:
            "In-flight run state, not published evidence. Nothing there has been signed or gated, and " +
            "an in-lane honesty probe is explicitly not board-quotable.",
          where: "Only after a result is promoted into a signed artifact in this repo.",
        },
        {
          subject: "MEOK / SOVOS / sov34 model figures",
          why_not:
            "A different estate with a different boundary. CSOAI measures; it does not host that model. " +
            "Its numbers never belong in a CSOAI count.",
          where: "That estate's own surfaces.",
        },
        {
          subject: "the csoai.org static site",
          why_not: "A separate deploy with separate content and its own figures.",
          where: "That site's own artifacts.",
        },
        {
          subject: "Hugging Face Hub live listing counts",
          why_not:
            "HF is a mirror of committed bytes in this repo (public-root/root.json on " +
            "csoai/gspc-boards). This endpoint does not probe the Hub. A Hub file matching " +
            "is a three-host checksum, not a second board and not a GSPC grade.",
          where:
            "GET /root.json here, then GET " +
            "https://huggingface.co/datasets/csoai/gspc-boards/resolve/main/public-root/root.json",
        },
        {
          subject: "traffic, users, customers, revenue",
          why_not:
            "Not measured and not published. There is no counter behind these anywhere in this repo, " +
            "so any figure would be invented.",
          where: "Nowhere. UNPUBLISHED is the honest answer, and it is the whole answer.",
        },
        {
          subject: "live RunPod pod inventory and grokbot estate GPUs",
          why_not:
            "This repo has no RunPod API identity. The 2026-08-22 inventory IPs are stale. A pod " +
            "being up is not a measurement, and a remembered address is not a fleet.",
          where:
            "GET /api/compute probes the AG-UI wire only. Quote that probe, never a remembered IP.",
        },
        {
          subject: "AG-UI / grokbot live session state",
          why_not:
            "Live probes are forbidden in /api/state. The wire is configured by AGUI_WIRE_URL on " +
            "Cloudflare Pages. Copying a serve-time ping here would stamp freshness nobody measured.",
          where: "GET /api/compute and GET /api/agui/health.",
        },
      ],
    },

    doctrine: {
      instruction_for_lanes: "council-os/QUOTING-NUMBERS.md",
      one_line:
        "Quote /api/state by field name. Never assert a count in a report. If it is not here, it is " +
        "not established.",
    },
  };

  return new Response(JSON.stringify(body, null, 2), {
    status: 200,
    headers: {
      "content-type": "application/json; charset=utf-8",
      // Short cache only. The payload is deterministic for a given deploy, so a
      // cache cannot make it stale in the way a serve-time stamp could.
      "cache-control": "public, max-age=300",
      "access-control-allow-origin": "*",
    },
  });
};
