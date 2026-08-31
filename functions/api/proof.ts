/**
 * GET /api/proof — inclusion proofs for public-root leaves.
 *
 * One inclusion (sha=) is free. bundle=1 is x402. Never a silent 404.
 * 402 without payment is OK. May trail the last published root (≤24h).
 */
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body, null, 2), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      "access-control-allow-origin": "*",
    },
  });

export const onRequestGet: PagesFunction = async ({ request }) => {
  const url = new URL(request.url);
  const origin = url.origin;
  const u = (p: string) => new URL(p, origin).toString();
  const sha = (url.searchParams.get("sha") || "").trim().toLowerCase();
  const bundle = url.searchParams.get("bundle") === "1";
  const paid = request.headers.get("x-payment") != null;

  if (bundle) {
    if (!paid) {
      return json(
        {
          schema: "csoai.public-root-proof/0.1",
          payment_required: {
            kind: "x402",
            amount: 0.02,
            per: "proof-bundle",
            instruction:
              "One inclusion is free (?sha=). The full bundle is x402. Settle via the estate x402 receipt MCP, then retry with the x-payment header.",
            settle_mcp: "https://github.com/CSOAI-ORG/csoai-coinbase-x402-receipt-mcp",
          },
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
    const items = [];
    for (let i = 0; i < hashes.length; i++) {
      const h = hashes[i];
      const r = await fetch(u(`/proofs/${h.slice(0, 16)}.json`));
      if (r.ok) {
        items.push(await r.json());
        continue;
      }
      const c = await fetch(u(`/cards/${h.slice(0, 16)}.json`));
      if (c.ok) {
        const w = await c.json();
        items.push({
          sha256: h,
          index: i,
          proof: w.proof || [],
          merkle_root: root.merkle_root,
        });
      }
    }
    return json({
      schema: "csoai.public-root-proof/0.1",
      kind: "bundle",
      as_of: root.as_of || null,
      merkle_root: root.merkle_root || null,
      n: items.length,
      proofs: items,
      note: "Paid bundle of inclusion proofs for the last published root. Not a grade.",
    });
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
