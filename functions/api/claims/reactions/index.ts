import { BASE_HEADERS, loadVerified, splitLines, type Ctx } from "../../../_lib/claimEvents";
import { REACTION_SCHEMA, deriveClaimReactions, reactionSummary } from "../../../_lib/claimReactions";
import { headFromGet } from "../../_head";

export const onRequestGet: PagesFunction = async (ctx) => {
  try {
    const verified = await loadVerified(ctx as unknown as Ctx);
    if (verified.verdict.state !== "VERIFIES") {
      return Response.json(
        { error: "claim_event_feed_does_not_verify", checks: verified.verdict.checks },
        { status: 503, headers: { ...BASE_HEADERS, "cache-control": "no-store" } },
      );
    }

    const rawSince = new URL(ctx.request.url).searchParams.get("since");
    const since = rawSince === null ? -1 : Number(rawSince);
    if (!Number.isInteger(since) || since < -1) {
      return Response.json(
        { error: "invalid_since", note: "since must be an integer event sequence >= -1" },
        { status: 400, headers: BASE_HEADERS },
      );
    }

    const lines = splitLines(verified.feed) ?? [];
    const reactions = deriveClaimReactions(lines, since);
    return Response.json(
      {
        schema: REACTION_SCHEMA,
        source: "/api/claims/events",
        source_verification: "VERIFIES",
        authority_state:
          "NONE: read-only projection; no recheck, correction, payment, signing or publication is executed here",
        since_exclusive: since,
        ...reactionSummary(reactions),
        reactions,
        does_not_prove: [
          "that any maintained claim is true or false",
          "that a recommended re-check has been executed",
          "that a source failure means the source changed",
        ],
      },
      { headers: { ...BASE_HEADERS, "cache-control": "no-store" } },
    );
  } catch (error) {
    return Response.json(
      {
        error: "reaction_projection_unavailable",
        detail: error instanceof Error ? error.message : String(error),
      },
      { status: 503, headers: { ...BASE_HEADERS, "cache-control": "no-store" } },
    );
  }
};

export const onRequestOptions: PagesFunction = async () =>
  new Response(null, {
    status: 204,
    headers: { ...BASE_HEADERS, "access-control-allow-methods": "GET, OPTIONS" },
  });

// HEAD answers what GET answers, with no body (functions/api/_head.ts); without it a HEAD falls
// through to a 404. Ratchet: functions/api/_head.coverage.test.ts.
export const onRequestHead = headFromGet(onRequestGet);
