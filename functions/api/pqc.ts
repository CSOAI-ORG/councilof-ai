/**
 * GET /api/pqc — continuity mill vs estate signer.
 * Not a 23rd axis. Continuity MEASURED ≠ we are PQC.
 */
import inv from "../../public/interop/estate-crypto-inventory.json";
import { headFromGet } from "./_head";

const json = (body: unknown) =>
  new Response(JSON.stringify(body, null, 2), {
    status: 200,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      "access-control-allow-origin": "*",
    },
  });

export const onRequestGet: PagesFunction = async () =>
  json({
    schema: "csoai.pqc-status/0.1",
    writes_board: false,
    ...(inv as object),
    live: "Cite GET /api/gspc axis=continuity for the mill. Estate signatures: Ed25519 only.",
  });

// HEAD answers what GET answers, with no body (functions/api/_head.ts); without it a HEAD falls
// through to a 404. Ratchet: functions/api/_head.coverage.test.ts.
export const onRequestHead = headFromGet(onRequestGet);
