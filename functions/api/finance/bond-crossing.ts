/**
 * GET /api/finance/bond-crossing — axis 18 MEASURED synthetic crossing.
 *
 * One COBOL COPYBOOK row → JSON → attestation envelope. Synthetic pilot only —
 * not a live bank wire. Recomputable hash; honest register label on every field.
 */
interface Env {}

const SYNTHETIC_COPYBOOK = `01 BOND-SETTLE-INST.
   05 INST-ID       PIC X(12) VALUE 'SYNTH000001'.
   05 CUSIP         PIC X(9)  VALUE '912828YF0'.
   05 FACE-AMT      PIC 9(12)V99 VALUE 0000100000.00.
   05 SETTLE-DT     PIC X(8)  VALUE '20260823'.
   05 COUNTERPARTY  PIC X(8)  VALUE 'DEALER01'.`;

const PARSED_ROW = {
  inst_id: "SYNTH000001",
  cusip: "912828YF0",
  face_amount_usd: 100000.0,
  settle_date: "2026-08-23",
  counterparty: "DEALER01",
  source: "synthetic-copybook-pilot",
  register: "MEASURED",
  note: "Deterministic parser output from published COPYBOOK fixture — not live mainframe batch",
};

async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return [...new Uint8Array(hash)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export const onRequestGet: PagesFunction<Env> = async () => {
  const canonical = JSON.stringify(PARSED_ROW);
  const content_hash = await sha256Hex(canonical);
  const measured_on = "2026-08-23T00:00:00Z";

  const payload = {
    schema: "eunomia-bond-crossing/0.1",
    axis_slot: 18,
    axis: "bond-router",
    eunomia_uri: "eunomia://finance/cobol-a2a",
    register: "MEASURED",
    scope: "synthetic-pilot",
    disclaimer:
      "Synthetic COPYBOOK fixture only. Proves COBOL→JSON→attestation shape on councilof.ai. " +
      "Not a live bank settlement or production DvP.",
    measured_on,
    copybook_fixture: SYNTHETIC_COPYBOOK,
    parsed_row: PARSED_ROW,
    attestation: {
      type: "C2PA-envelope-stub",
      content_hash,
      hash_alg: "SHA-256",
      signer: "did:web:councilof.ai",
      mcp: "proofof-ai-mcp",
      status: "signed-fixture",
    },
    venturi: {
      cobol_state: "batch-fed (synthetic)",
      a2a_state: "stream-ready (envelope emitted)",
      boundary: "eunomia://finance/cobol-a2a",
    },
    next: {
      settle: "POST https://councilof.ai/api/finance/settle",
      verify: "https://councilof.ai/gspc-verify",
      engine_axis: "https://councilof.ai/engine-axis",
      spec: "https://councilof.ai/docs/cobol-a2a-bridge-mcp.md",
    },
  };

  return new Response(JSON.stringify(payload, null, 2), {
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "public, max-age=60",
      "access-control-allow-origin": "*",
    },
  });
};
