/**
 * POST /api/finance/settle — atomic settlement envelope.
 *
 * The atomic unit: COBOL batch row → attestation + x402 receipt in one signed package.
 * Honest stub until smart contracts + live bank pilot wire in.
 */
interface Env {}

type SettleRequest = {
  instruction_id?: string;
  cobol_job_id?: string;
  bond_token?: string;
  cash_amount_usdc?: string;
  counterparty_did?: string;
  frameworks?: string[];
};

export const onRequestPost: PagesFunction<Env> = async ({ request }) => {
  let body: SettleRequest;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "body must be JSON" }, { status: 400 });
  }

  const instructionId = body.instruction_id ?? `inst_${Date.now()}`;
  const now = new Date().toISOString();

  const envelope = {
    schema: "eunomia-settle/0.1",
    status: "stub",
    message:
      "Settlement envelope stub — attestation + x402 receipt shape. Wire meok-coinbase-x402-receipt-mcp + proofof-ai-mcp for production.",
    instruction_id: instructionId,
    cobol_job_id: body.cobol_job_id ?? null,
    timestamp: now,
    layers: {
      identity: {
        counterparty_did: body.counterparty_did ?? null,
        issuer: "did:web:councilof.ai",
      },
      attestation: {
        type: "C2PA",
        mcp: "proofof-ai-mcp",
        status: "pending",
        note: "C2PA certificate generated per batch instruction row",
      },
      consensus: {
        mcp: "bft-progress-council-mcp",
        status: "pending",
        note: "BFT council multi-sig before release",
      },
      settlement: {
        type: "atomic-dvp",
        chain: "base",
        asset: "USDC",
        amount: body.cash_amount_usdc ?? null,
        bond_token: body.bond_token ?? null,
        mcp: "meok-coinbase-x402-receipt-mcp",
        status: "pending",
        note: "Lock both legs; release both or neither",
      },
      compliance: {
        frameworks: body.frameworks ?? ["MiCA", "EU AI Act", "ISO 42001"],
        mcp: "iso-42001-ai-mcp",
        crosswalk: "eunomia://compliance/crosswalk",
      },
    },
    eunomia_uri: `eunomia://finance/settle/${instructionId}`,
    verify: "https://councilof.ai/gspc-verify",
    docs: "https://councilof.ai/engine-axis",
  };

  return Response.json(envelope, {
    status: 202,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "access-control-allow-origin": "*",
    },
  });
};

export const onRequestOptions: PagesFunction<Env> = async () =>
  new Response(null, {
    headers: {
      "access-control-allow-origin": "*",
      "access-control-allow-methods": "POST, OPTIONS",
      "access-control-allow-headers": "content-type, authorization",
    },
  });
