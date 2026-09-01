/**
 * /api/* catch-all — real 404 JSON, never the SPA shell.
 * Unknown /api paths must NOT fall through to the SPA catch-all (soft-404
 * poison: crawlers and agent probes get HTML pretending to be a page).
 * Specific handlers (mcp, tools, gspc, xrpl, root.ts, proof.ts) take precedence
 * when Pages has compiled those files. This catch-all also aliases GET /api/root
 * and GET /api/proof so a dropped NEW function file still serves the same forest
 * as /root.json — never a second merkle. x402 is GET /proof?bundle=1 only.
 */
const json = (body, status = 200) =>
  new Response(JSON.stringify(body, null, 2), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      "access-control-allow-origin": "*",
    },
  });

async function aliasRoot(request) {
  const origin = new URL(request.url).origin;
  const r = await fetch(new URL("/root.json", origin).toString());
  if (!r.ok) {
    return json(
      {
        error: "not_found",
        path: "/api/root",
        unmeasured: ["root.json"],
        reason: `static /root.json HTTP ${r.status}`,
      },
      404,
    );
  }
  const text = await r.text();
  return new Response(text, {
    status: 200,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      "access-control-allow-origin": "*",
    },
  });
}

async function proofGet(request) {
  const url = new URL(request.url);
  const origin = url.origin;
  const u = (p) => new URL(p, origin).toString();
  const sha = (url.searchParams.get("sha") || "").trim().toLowerCase();
  const bundle = url.searchParams.get("bundle") === "1";
  const paid = request.headers.get("x-payment") != null;

  if (bundle && !paid) {
    return json(
      {
        schema: "csoai.public-root-proof/0.1",
        payment_required: {
          kind: "x402",
          per: "proof-bundle",
          instruction:
            "One inclusion is free (?sha=). The full bundle is x402. Settle via the estate x402 receipt MCP, then retry with the x-payment header. Verify stays free.",
          settle_mcp: "https://github.com/CSOAI-ORG/csoai-coinbase-x402-receipt-mcp",
        },
        free: { one_inclusion: "/api/proof?sha=<64-hex>" },
      },
      402,
    );
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
  const root = await rootRes.json();
  const hashes = Array.isArray(root.card_sha256) ? root.card_sha256 : [];

  if (bundle && paid) {
    const items = [];
    for (let i = 0; i < hashes.length; i++) {
      const h = hashes[i];
      const r = await fetch(u(`/proofs/${String(h).slice(0, 16)}.json`));
      if (r.ok) {
        items.push(await r.json());
        continue;
      }
      const c = await fetch(u(`/cards/${String(h).slice(0, 16)}.json`));
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
}

export async function onRequest(context) {
  const p = context.params && Array.isArray(context.params.path)
    ? context.params.path.join("/")
    : "";
  const request = context.request;
  if (request.method === "GET" && p === "root") return aliasRoot(request);
  if (request.method === "GET" && p === "proof") return proofGet(request);
  return json(
    {
      error: "not_found",
      path: p ? `/api/${p}` : "/api",
      hint: "See the MCP registry entry io.github.CSOAI-ORG/gspc for live endpoints, or /api/mcp for the server catalogue.",
    },
    404,
  );
}
