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
            "One inclusion is free (?sha=). The full bundle is x402. Settle with any x402 client, then retry with the x-payment header. Verify stays free.",
          settle_mcp: null,
          settle_mcp_note: "The estate x402 receipt MCP is not publicly hosted while the GitHub organisation is unavailable. Any x402 client can settle against the challenge terms.",
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

// The /api 404 names the real doors. /api/mcp is the census of OTHER people's MCP servers, so it is
// labelled as that and never offered as ours.
export const NOT_FOUND_HINT =
  "Public API description: /openapi.json. Ask: GET /api/chat lists its skins. MCP server: /mcp/free (free, read-only). Board: /api/gspc. /api/mcp is a census of other MCP servers, not ours.";


// ─── free preview routes: GET /api/<door>/preview ────────────────────────────────────────────
// The agent-conversion surface for every priced endpoint (x402 REVENUE-NOW repair): the FULL
// payload shape with live free data — the proven pattern the doors' own ?preview=1 slices and
// free GETs already serve — plus a `buy` block naming the paid resource. It never charges, never
// settles and never invents data: it serves the door's own free slice through one canonical URL
// an agent can discover (PRICES.json preview_route), and where the door needs input it states the
// requirement instead of failing. Amounts live only in the 402 at buy.resource.
const PREVIEW_GATE_PARAMS = ["feed", "bundle", "history", "x402", "preview"];
const PREVIEW_STATIC_DOORS = new Set([
  "request-attestation",
  "evidence-bundle",
  "signed-data-feed",
  "proof",
  "rwa/evidence",
  "wrapper",
  "wrapper/changes",
  "measurement/fresh-capsule",
  "art50/marking-evidence",
  "feeds/provider-diff",
  "receipts/batch",
  "ras/mcp-probe",
  "ras/x402-check",
  "ras/supply",
]);
const PREVIEW_NOTICE =
  "Measurement artifacts, never grades. Verification is free forever.";

function previewDoorBase(p) {
  if (!p.endsWith("/preview")) return null;
  const base = p.slice(0, -"/preview".length);
  if (PREVIEW_STATIC_DOORS.has(base)) return base;
  if (/^(pop|wrapper\/asset|discover)\/[^/]+$/.test(base)) return base;
  return null;
}

async function previewResponse(request, isHead) {
  const url = new URL(request.url);
  const base = previewDoorBase(url.pathname.replace(/^\/api\//, ""));
  if (!base) return null;
  const buySearch = new URLSearchParams(url.searchParams);
  const freeSearch = new URLSearchParams(url.searchParams);
  for (const k of PREVIEW_GATE_PARAMS) freeSearch.delete(k);
  freeSearch.set("preview", "1");
  const buy = {
    resource: `${url.origin}/api/${base}${buySearch.toString() ? "?" + buySearch.toString() : ""}`,
    how: "GET the resource → 402 (accepts[] names the amount — the only place a price lives) → pay from your own wallet over x402 → retry with X-PAYMENT",
    catalog: `${url.origin}/api/x402`,
    prices:
      "https://github.com/CSOAI-ORG/councilof-ai/blob/master/PRICES.json — price POINTS with basis; the 402 challenge is authoritative",
    notice: PREVIEW_NOTICE,
  };
  let upstream = null;
  try {
    upstream = await fetch(`${url.origin}/api/${base}?${freeSearch.toString()}`, {
      headers: { accept: "application/json" },
    });
  } catch {
    upstream = null;
  }
  if (!upstream) {
    return json({ kind: "preview", state: "UNAVAILABLE", upstream_status: null, buy }, 200);
  }
  const text = await upstream.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    data = { raw_excerpt: text.slice(0, 500) };
  }
  if (upstream.status === 200 && data && typeof data === "object" && !Array.isArray(data)) {
    return json(
      {
        ...data,
        kind: typeof data.kind === "string" ? data.kind : "preview",
        preview_route: url.pathname,
        buy: data.buy && typeof data.buy === "object" ? data.buy : buy,
      },
      200,
    );
  }
  if (upstream.status === 402 && data && typeof data === "object") {
    const csoai = data.csoai && typeof data.csoai === "object" ? data.csoai : {};
    return json(
      {
        ...csoai,
        kind: "preview",
        state: "PREVIEW_FROM_CHALLENGE",
        preview_route: url.pathname,
        amount_note: "amounts live only in accepts[] at buy.resource — never in prose",
        buy,
      },
      200,
    );
  }
  return json(
    {
      kind: "preview",
      state: upstream.status === 400 ? "INPUT_REQUIRED" : "UNAVAILABLE",
      upstream_status: upstream.status,
      upstream: data,
      buy,
    },
    200,
  );
}

export async function onRequest(context) {
  const p = context.params && Array.isArray(context.params.path)
    ? context.params.path.join("/")
    : "";
  const request = context.request;
  // HEAD on an alias answers what its GET answers, with no body (RFC 9110 §9.3.2). Until 6 Oct 2026
  // a HEAD fell to the 404 below, so link checkers recorded the live root/proof aliases as missing.
  const isHead = request.method === "HEAD";
  const asGet = isHead ? new Request(request.url, { method: "GET", headers: request.headers }) : request;
  const bodiless = (res) =>
    new Response(null, { status: res.status, statusText: res.statusText, headers: res.headers });
  if ((request.method === "GET" || isHead) && (p === "root" || p === "proof")) {
    const res = await (p === "root" ? aliasRoot(asGet) : proofGet(asGet));
    return isHead ? bodiless(res) : res;
  }
  if (request.method === "GET" || isHead) {
    const preview = await previewResponse(asGet, isHead);
    if (preview) return isHead ? bodiless(preview) : preview;
  }
  return json(
    {
      error: "not_found",
      path: p ? `/api/${p}` : "/api",
      hint: NOT_FOUND_HINT,
    },
    404,
  );
}
