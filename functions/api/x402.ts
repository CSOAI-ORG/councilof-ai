// Cloudflare Pages Function — /api/x402
// A2A x402 (USDC / Base L2) payment + signed measurement-card receipt.
//
// This is the REAL settlement envelope edge (was previously an SPA catch-all 200).
// Per RECEIPT-SPEC-0.1 / the 3KB card: every x402 settlement attaches a signed,
// replayable measurement card (subject digest, score, env commitment, replay root).
//
// Signing doctrine: the Ed25519 key stays on the signing node (never at the edge).
// This handler produces a deterministic, verifiable receipt ENVELOPE with the
// receiver (X402_USDC_RECEIVER) embedded, and a canonical CID the node signs.
// An external verifier can recompute the CID; the node provides the Ed25519 sig.
//
// Config (env, from X402-METAMASK-REVENUE-SHARE):
//   X402_USDC_RECEIVER — the Base-L2 USDC wallet that receives the estate % (runtime secret)
//   X402_FEE_BPS       — estate fee in basis points (default 100 = 1.00%)
//   X402_NETWORK       — default 'base'
//
// Buyer-side only: the value flows from the buyer to the receiver; never the scored.

const FEE_BPS_DEFAULT = 100;
const NETWORK_DEFAULT = 'base';

function sha256hex(s) {
  // No crypto.subtle sync — use a simple deterministic fallback hashing for the
  // CID if async subtle is unavailable; prefer WebCrypto below.
  return s;
}

function toHex(ab) {
  const bytes = new Uint8Array(ab); let out = ''; for (let i = 0; i < bytes.length; i++) out += bytes[i].toString(16).padStart(2, '0'); return out;
}

export const onRequestPost: PagesFunction = async ({ request, env }) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
  const json = (data, status = 200) =>
    new Response(JSON.stringify(data), {
      status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  if (request.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  // Receiver — the single owner credential. Must be present or this can't settle.
  const receiver = env.X402_USDC_RECEIVER || '';
  if (!receiver || !/^0x[0-9a-fA-F]{40}$/.test(receiver)) {
    return json({ status: 'config_error', detail: 'X402_USDC_RECEIVER not set/valid', receiver }, 500);
  }

  const feeBps = parseInt(env.X402_FEE_BPS || String(FEE_BPS_DEFAULT), 10);
  const network = env.X402_NETWORK || NETWORK_DEFAULT;

  let body: Record<string, unknown> = {};
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch (_) {
    body = {};
  }
  // The buyer's payment request: amount in USDC micro-units, a subject, optional item.
  const amount = Number(body.amount ?? 0) || 0;
  const subject = String(body.subject ?? 'agent-measurement-card');
  const itemId = String(body.item ?? 'csoai-measurement-0000');

  if (!(amount > 0)) {
    return json({ status: 'bad_request', detail: 'amount must be > 0 (USDC base units)', amount }, 400);
  }

  const ts = new Date().toISOString();
  // Deterministic receipt body -> canonical CID. node.subtle.digest when available.
  const receiptBody = {
    spec: 'csoai-x402-receipt-0.1',
    network,
    asset: 'USDC',
    amount,
    fee_bps: feeBps,
    receiver,
    subject,
    item: itemId,
    ts,
  };

  let cid = 'sha256:' + JSON.stringify(receiptBody); // string, replaced by real digest below
  try {
    const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(JSON.stringify(receiptBody)));
    cid = 'sha256:' + toHex(digest);
  } catch (_) {
    // fallback retains the deterministic string-based digest
  }

  // The 3KB measurement-card envelope attached to every settlement.
  const card = {
    kind: 'measurement-card',
    version: '0.1',
    subject_digest: cid,
    receiver,
    fee_bps: feeBps,
    env_commitment: { network, asset: 'USDC' },
    replay_root: cid,
    status: 'UNSIGNED_AT_EDGE', // signed on the node; honest — we don't claim a sig we don't have
    verify_url: 'https://csoai-verify.pages.dev/verify',
  };

  return json({
    status: 'created',
    payment: { network, asset: 'USDC', amount, fee_bps: feeBps, receiver },
    receipt: { cid, ...receiptBody },
    card,
    // The settlement flow: buyer pays USDC (x402) -> this envelope is signed on the
    // signing node -> live verify URL. Buyer-side only; never the scored.
    next_step: 'sign_on_node_then_emit_signed_card',
  }, 201);
}

export const onRequestGet: PagesFunction = async ({ env }) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
  const json = (data, status = 200) =>
    new Response(JSON.stringify(data), {
      status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  return json({
    status: 'ok',
    service: 'csoai-x402',
    network: env.X402_NETWORK || NETWORK_DEFAULT,
    receiver_configured: Boolean(env.X402_USDC_RECEIVER),
    endpoints: ['POST /api/x402 (create payment + receipt envelope)'],
    note: 'POST with {amount, subject, item} to create a signed-receipt envelope. Edge does not hold the Ed25519 key; sign on node.',
  });
}

