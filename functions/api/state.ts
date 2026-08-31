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
import hubCensus from "../../public/signed/hub-census-baseline.json";

import type { AxisScore } from "./_gspc_types";
import { AXES_A } from "./_gspc_axes_a";
import { AXES_B } from "./_gspc_axes_b";
import { AXES_FIN } from "./_gspc_axes_fin";

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

// ── sources, named once ──────────────────────────────────────────
const SRC_BOARD = "public/signed/gspc-board.signed.json";
const SRC_CARDS = "public/signed/card_index.json";
const SRC_CHAIN = "public/signed/chain-facts.json (derived by scripts/derive-chain-facts.mjs from chain.json + every card body)";
const SRC_CLAIMS = "public/claims-register.json";
const SRC_RWA = "public/interop/rwa-registry.json";
const SRC_MCP = "evidence/mcp-registry.json";
const SRC_CENSUS = "public/signed/hub-census-baseline.json";
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
const liveAxisSlots = LIVE_AXES.length;
const liveMeasuredAxes = LIVE_AXES.filter((a) => a.status === "MEASURED").length;
const liveUnmeasuredAxes = liveAxisSlots - liveMeasuredAxes;
const boardAgrees =
  boardTotals.axes === liveAxisSlots && boardTotals.measured_axes === liveMeasuredAxes;

// ── cards: counted from the index, not read off a header ─────────────────────
const cards: Array<{ signed?: boolean }> = (cardIndex as any).cards ?? [];
const cardsCounted = cards.length;
const cardsSigned = cards.filter((c) => c.signed === true).length;
const cardsHeaderCount = (cardIndex as any).n_cards ?? null;

// ── claims register: rows tallied by status ──────────────────────────────
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
const instruments: Array<{ address_status?: string; status?: string }> =
  (rwaRegistry as any).instruments ?? [];
const rwaNamed = instruments.length;
const rwaAttested = instruments.filter((i) => i.address_status === "mainnet-verified").length;
const rwaNotLocated = instruments.filter((i) => i.address_status === "not-located").length;
const rwaUnmeasuredRisk = instruments.filter((i) => i.status === "UNMEASURED").length;
const rwaHeader = (rwaRegistry as any).counts ?? {};
const rwaHeaderAgrees =
  rwaHeader.named === rwaNamed &&
  rwaHeader.mainnet_verified_and_attested === rwaAttested &&
  rwaHeader.not_located === rwaNotLocated;
