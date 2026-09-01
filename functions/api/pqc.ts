/**
 * GET /api/pqc — continuity mill vs estate signer.
 * Not a 23rd axis. Continuity MEASURED ≠ we are PQC.
 */
import inv from "../../public/interop/estate-crypto-inventory.json";

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
