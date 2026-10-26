/**
 * GET /api/claims/events — the claim-event feed: append-only, hash-chained JSONL.
 *
 * READ-ONLY over committed bytes. public/claims/events/v0.1/events.jsonl is produced by
 * scripts/claims/claim_events_export.py from the claim maintenance loop's own event log and committed;
 * this endpoint computes nothing of its own. It serves the file only when the file, its daily head and
 * the head's board signature agree (functions/_lib/claimEvents.ts). When they do not, it answers 503
 * with the failing check — never a partial or unverified feed.
 *
 *   ?since=<seq>   lines with seq >= since, bytes unchanged. Each line still carries prev_sha256, so a
 *                  reader holding line since-1 continues the chain; a reader holding nothing re-reads from 0.
 *
 * Head (signed): GET /api/claims/events/head. Re-derive it yourself:
 *   node scripts/claims/claim-events-rederive.mjs --url https://councilof.ai
 *
 * WHAT THIS IS NOT. Not a verdict on any subject and not certification. CONFIRMED means no change was
 * detected against the pinned observation and the checks reproduced; QUARANTINED records a proposal for
 * the owner's review. No score, rank or index may be derived from these states.
 */
import { BASE_HEADERS, type Ctx, loadVerified, splitLines, unavailable } from "../../../_lib/claimEvents";
import { headFromGet } from "../../_head";


export const onRequestGet = async (ctx: Ctx): Promise<Response> => {
  const url = new URL(ctx.request.url);
  const sinceRaw = url.searchParams.get("since");
  if (sinceRaw !== null && !/^\d{1,9}$/.test(sinceRaw)) {
    return new Response(JSON.stringify({ error: "bad_since", detail: "since is a non-negative integer seq" }), {
      status: 400,
      headers: { ...BASE_HEADERS, "content-type": "application/json; charset=utf-8" },
    });
  }
  let loaded;
  try {
    loaded = await loadVerified(ctx);
  } catch (e) {
    return unavailable((e as Error).message);
  }
  const { feed, verdict } = loaded;
  if (verdict.state !== "VERIFIES") {
    const failed = verdict.checks.filter((c) => !c.ok);
    return unavailable(failed.map((c) => `${c.check}: ${c.detail}`).join("; "), verdict.checks);
  }
  const headFeed = (verdict.head?.feed ?? {}) as Record<string, unknown>;
  let body = feed;
  if (sinceRaw !== null) {
    const since = Number(sinceRaw);
    const lines = splitLines(feed) ?? [];
    body = lines.slice(since).map((l) => l + "\n").join("");
  }
  return new Response(body, {
    status: 200,
    headers: {
      ...BASE_HEADERS,
      "content-type": "application/x-ndjson; charset=utf-8",
      "x-claim-events-lines": String(verdict.n_lines),
      "x-claim-events-bytes-sha256": String(headFeed.bytes_sha256 ?? ""),
      "x-claim-events-head-date": String(verdict.head?.date ?? ""),
      ...(sinceRaw !== null ? { "x-claim-events-since": sinceRaw } : {}),
    },
  });
};

export const onRequestOptions = async (): Promise<Response> =>
  new Response(null, {
    status: 204,
    headers: { ...BASE_HEADERS, "access-control-allow-methods": "GET, OPTIONS", "access-control-allow-headers": "*" },
  });

// HEAD answers what GET answers, with no body (functions/api/_head.ts); without it a HEAD falls
// through to a 404. Ratchet: functions/api/_head.coverage.test.ts.
export const onRequestHead = headFromGet(onRequestGet);
