/**
 * GET /api/claim-maintenance-priority-root — deterministic Merkle root over immutable
 * Claim Maintenance contribution-priority snapshots.
 *
 * Separate evidence domain: this is NOT the public measurement-card root, does not
 * inherit its signature, and is not evidence of trademark ownership or certification.
 */
import root from "../../public/spec/claim-maintenance/priority-root.json";

const HEADERS = {
  "content-type": "application/json; charset=utf-8",
  "cache-control": "public, max-age=300",
  "access-control-allow-origin": "*",
  link: '<https://councilof.ai/claim-maintenance/>; rel="describedby"; type="text/html", </spec/claim-maintenance/priority-root-witness.json>; rel="related"; type="application/json"',
  "x-claim-maintenance-spec": "https://councilof.ai/spec/claim-maintenance/v0.2/",
};

export const onRequestGet: PagesFunction = async () =>
  new Response(JSON.stringify(root, null, 2), {
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
