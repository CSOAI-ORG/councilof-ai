/**
 * GET /api/claims/events/head — the signed daily head of the claim-event feed, with this door's own
 * verification of it against the committed feed bytes.
 *
 * `head` and `signed` are the committed public/claims/events/v0.1/head.json and head.signed.json, parsed;
 * their exact bytes (which the signature pins) are at `raw.*`. `verification` is what this door checked;
 * re-derive it without trusting this door:
 *   node scripts/claims/claim-events-rederive.mjs --url https://councilof.ai
 */
import { type Ctx, loadVerified, unavailable } from "../../../_lib/claimEvents";

export const onRequestGet = async (ctx: Ctx): Promise<Response> => {
  let loaded;
  try {
    loaded = await loadVerified(ctx);
  } catch (e) {
    return unavailable((e as Error).message);
  }
  const { head, signed, verdict } = loaded;
  if (verdict.state !== "VERIFIES") {
    const failed = verdict.checks.filter((c) => !c.ok);
    return unavailable(failed.map((c) => `${c.check}: ${c.detail}`).join("; "), verdict.checks);
  }
  return new Response(
    JSON.stringify(
      {
        head: JSON.parse(head),
        signed: JSON.parse(signed),
        verification: { state: verdict.state, checks: verdict.checks },
        feed: "/api/claims/events",
        raw: {
          head: "/claims/events/v0.1/head.json",
          signed: "/claims/events/v0.1/head.signed.json",
          feed: "/claims/events/v0.1/events.jsonl",
        },
        rederive: "node scripts/claims/claim-events-rederive.mjs --url https://councilof.ai",
      },
      null,
      2,
    ),
    {
      status: 200,
      headers: {
        "content-type": "application/json; charset=utf-8",
        "cache-control": "public, max-age=300",
        "access-control-allow-origin": "*",
        link: '</api/claims/events>; rel="alternate"; type="application/x-ndjson"',
      },
    },
  );
};
