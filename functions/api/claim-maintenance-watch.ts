/**
 * GET /api/claim-maintenance-watch — latest bounded Claim Maintenance watch summary.
 *
 * ONE SET OF BYTES. This route serves the committed watch/latest.json produced by the
 * scheduled reread/review pipeline. A moved digest or missing phrase is a review trigger,
 * never a finding of falsity, motive, non-compliance, service quality or endorsement.
 */
import latest from "../../public/spec/claim-maintenance/watch/latest.json";

const HEADERS = {
  "content-type": "application/json; charset=utf-8",
  "cache-control": "public, max-age=300",
  "access-control-allow-origin": "*",
  link: '<https://councilof.ai/claim-maintenance/>; rel="describedby"; type="text/html"',
  "x-claim-maintenance-spec": "https://councilof.ai/spec/claim-maintenance/v0.2/",
};

export const onRequestGet: PagesFunction = async () =>
  new Response(JSON.stringify(latest, null, 2), {
    status: 200,
    headers: HEADERS,
  });

export const onRequestOptions: PagesFunction = async () =>
  new Response(null, {
    status: 204,
    headers: {
      ...HEADERS,
      "access-control-allow-methods": "GET, OPTIONS",
      "access-control-allow-headers": "*",
    },
  });
