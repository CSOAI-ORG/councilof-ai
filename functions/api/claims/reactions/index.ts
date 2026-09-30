import { BASE_HEADERS, loadVerified, splitLines, type Ctx } from "../../../_lib/claimEvents";
import { REACTION_SCHEMA, deriveClaimReactions, reactionSummary } from "../../../_lib/claimReactions";

export const onRequestGet: PagesFunction = async (ctx) => {
  const rawSince = new URL(ctx.request.url).searchParams.get("since");
  const since = rawSince === null ? -1 : Number(rawSince);
  if (!Number.isInteger(since) || since < -1) {
    return Response.json(
      { state: "BAD_INPUT", error: "invalid_since", note: "since must be an integer event sequence >= -1" },
      { status: 400, headers: BASE_HEADERS },
    );
  }

  try {
    const verified = await loadVerified(ctx as unknown as Ctx);
    if (verified.verdict.state !== "VERIFIES") {
      return Response.json(
        { state: "UNREACHABLE", error: "claim_event_feed_does_not_verify", checks: verified.verdict.checks },
        { status: 503, headers: { ...BASE_HEADERS, "cache-control": "no-store" } },
      );
    }

    const lines = splitLines(verified.feed);
    if (lines === null) {
      return Response.json({ state: "UNREACHABLE", error: "claim_event_feed_framing_invalid" }, { status: 503, headers: BASE_HEADERS });
    }
    const head = verified.verdict.head ?? {};
    const feedHead = (head.feed ?? {}) as Record<string, unknown>;
    const reactions = deriveClaimReactions(lines, since);
    return Response.json(
      {
        state: "LIVE",
        schema: REACTION_SCHEMA,
        source: "/api/claims/events",
        source_verification: "VERIFIES",
        source_as_of: head.as_of ?? null,
        evidence_freshness: "NOT_EVALUATED",
        feed_head_seq: feedHead.head_seq ?? null,
        authority_state: "NONE: read-only projection; no recheck, correction, payment, signing or publication is executed here",
        since_exclusive: since,
        ...reactionSummary(reactions),
        reactions,
        does_not_prove: [
          "that any maintained claim is true or false",
          "that a recommended re-check has been executed",
          "that a source failure means the source changed",
          "that the observation is current; freshness policy is not evaluated by this projection",
        ],
      },
      { headers: { ...BASE_HEADERS, "cache-control": "no-store" } },
    );
  } catch (error) {
    return Response.json(
      { state: "UNREACHABLE", error: "reaction_projection_unavailable", detail: error instanceof Error ? error.message : String(error) },
      { status: 503, headers: { ...BASE_HEADERS, "cache-control": "no-store" } },
    );
  }
};

export const onRequestOptions: PagesFunction = async () =>
  new Response(null, {
    status: 204,
    headers: { ...BASE_HEADERS, "access-control-allow-methods": "GET, OPTIONS" },
  });
