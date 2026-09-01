/**
 * GET /api/proof — inclusion proofs for public-root leaves.
 *
 * One inclusion (sha=) is free. bundle=1 is x402. Never a silent 404.
 * 402 without payment is OK. May trail the last published root (≤24h).
 */
import { verifyX402Payment, x402Accepts, type X402Env } from "./_x402";

const json = (body: unknown, status = 200, extraHeaders: Record<string, string> = {}) =>
  new Response(JSON.stringify(body, null, 2), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      "access-control-allow-origin": "*",
      ...extraHeaders,
    },
  });

export const onRequestGet: PagesFunction = async ({ request, env }) => {
  const url = new URL(request.url);
  const origin = url.origin;
  const u = (p: string) => new URL(p, origin).toString();
  const sha = (url.searchParams.get("sha") || "").trim().toLowerCase();
  const bundle = url.searchParams.get("bundle") === "1";
  // Payment is VERIFIED, not assumed from header presence. Only evaluated for the paid
  // (bundle) branch; the free ?sha= inclusion never needs it.
  const payment = bundle
    ? await verifyX402Payment(request, env as X402Env, u("/api/proof?bundle=1"))
    : { ok: false, reason: "not a bundle request" };
  const paid = payment.ok;

  if (bundle) {
    if (!paid) {
      return json(
        {
          schema: "csoai.public-root-proof/0.1",
          error: "payment_required",
          // Canonical x402 challenge: an off-the-shelf x402 client pays straight off `accepts`.
          // Price atom is the issuance re-serve tier ($0.02, ESTIMATE, owner-overridable); payTo
          // is null until the owner provisions X402_PAY_TO (no address is invented here).
          accepts: x402Accepts(env as X402Env, u("/api/proof?bundle=1"), {
            skuId: "issuance",
            tier: "reserve",
            description: "Bundle of inclusion proofs for the last published root (re-serve). Not a grade.",
          }),
          x402Version: 1,
          payment_required: {
            kind: "x402",
            amount: 0.02,
            per: "proof-bundle",
            instruction:
              "One inclusion is free (?sha=). The full bundle is x402. Settle via the estate x402 receipt MCP, then retry with the x-payment header carrying the settled receipt.",
            settle_mcp: "https://github.com/CSOAI-ORG/csoai-coinbase-x402-receipt-mcp",
          },
          // Fail-closed: a receipt is only accepted when a configured x402 facilitator
          // verifies it. Header presence alone is NOT payment and never grants the bundle.
          verification: "x402 facilitator /verify (fail-closed; unverified receipts are refused)",
          not_paid_reason: payment.reason,
          free: { one_inclusion: "/api/proof?sha=<64-hex>" },
        },
        402,
      );
    }
  }

  const rootRes = await fetch(u("/root.json"));
  if (!rootRes.ok) {
    return json(
      {
        schema: "csoai.public-root-proof/0.1",
        error: "not_found",
        path: "/api/proof",
        unmeasured: ["root.json"],
        reason: `static /root.json HTTP ${rootRes.status}`,
      },
      404,
    );
  }
  const root = (await rootRes.json()) as {
    merkle_root?: string;
    card_sha256?: string[];
    as_of?: string;
  };
  const hashes = Array.isArray(root.card_sha256) ? root.card_sha256 : [];

  if (bundle && paid) {
    // O(1) subrequests. This used to fetch /proofs/<h>.json AND fall back to /cards/<h>.json
    // ONCE PER hash — up to 1 (root) + 2 x card_sha256.length subrequests. With 50 hashes that
    // is ~101 fetches, far past Cloudflare Pages Functions' 50-subrequest cap, so the invocation
    // threw and the endpoint 500'd. Every inclusion proof already lives inside its card wrapper,
    // which the build-time aggregate carries, so ONE fetch of /cards-bundle.json resolves them
    // all regardless of card count.
    const bundleRes = await fetch(u("/cards-bundle.json"));
    if (!bundleRes.ok) {
      return json(
        {
          schema: "csoai.public-root-proof/0.1",
          error: "not_found",
          path: "/api/proof",
          unmeasured: ["cards-bundle.json"],
          reason: `static /cards-bundle.json HTTP ${bundleRes.status}`,
        },
        404,
      );
    }
    const cbundle = (await bundleRes.json()) as {
      cards?: Record<string, { proof?: unknown[] } | undefined>;
    };
    const bundleCards = cbundle && cbundle.cards ? cbundle.cards : {};
    const items = [];
    for (let i = 0; i < hashes.length; i++) {
      const h = hashes[i];
      const w = bundleCards[h];
      if (!w) continue;
      items.push({
        sha256: h,
        index: i,
        proof: Array.isArray(w.proof) ? w.proof : [],
        merkle_root: root.merkle_root,
      });
    }
    return json(
      {
        schema: "csoai.public-root-proof/0.1",
        kind: "bundle",
        as_of: root.as_of || null,
        merkle_root: root.merkle_root || null,
        n: items.length,
        proofs: items,
        note: "Paid bundle of inclusion proofs for the last published root. Not a grade.",
      },
      200,
      // Echo settlement back per x402 when the facilitator returned one; omitted otherwise.
      payment.paymentResponse ? { "x-payment-response": payment.paymentResponse } : {},
    );
  }

  if (!/^[0-9a-f]{64}$/.test(sha)) {
    return json(
      {
        schema: "csoai.public-root-proof/0.1",
        error: "bad_request",
        path: "/api/proof",
        reason: "pass sha=<64-hex> for one free inclusion, or bundle=1 for x402",
        free: { one_inclusion: "/api/proof?sha=<64-hex>" },
        bundle: "/api/proof?bundle=1",
      },
      400,
    );
  }

  const index = hashes.indexOf(sha);
  if (index < 0) {
    return json(
      {
        schema: "csoai.public-root-proof/0.1",
        error: "not_found",
        path: "/api/proof",
        sha,
        unmeasured: ["inclusion"],
        reason: "sha is not a leaf of the last published root (trail is that root only)",
        merkle_root: root.merkle_root || null,
        as_of: root.as_of || null,
      },
      404,
    );
  }

  const proofRes = await fetch(u(`/proofs/${sha.slice(0, 16)}.json`));
  if (proofRes.ok) {
    const body = await proofRes.json();
    return json({
      schema: "csoai.public-root-proof/0.1",
      kind: "inclusion",
      free: true,
      as_of: root.as_of || null,
      ...body,
    });
  }

  const cardRes = await fetch(u(`/cards/${sha.slice(0, 16)}.json`));
  if (!cardRes.ok) {
    return json(
      {
        schema: "csoai.public-root-proof/0.1",
        error: "not_found",
        path: "/api/proof",
        sha,
        unmeasured: ["proof", "card"],
        reason: `card wrapper HTTP ${cardRes.status}`,
      },
      404,
    );
  }
  const wrapped = await cardRes.json();
  return json({
    schema: "csoai.public-root-proof/0.1",
    kind: "inclusion",
    free: true,
    as_of: root.as_of || null,
    sha256: sha,
    index,
    proof: wrapped.proof || [],
    merkle_root: root.merkle_root || null,
    note: "Inclusion from the card wrapper. public/proofs/ may trail up to the last publish.",
  });
};
