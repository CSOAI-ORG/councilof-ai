/**
 * GET /api/xrpl — reader of the published public-root, not a mill.
 *
 * Lists identity-verified issued XRPL assets from live /root.json cards.
 * Does not write /api/gspc. Does not invent 377 instruments. Missing
 * fields stay UNMEASURED. Coverage, not clients.
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

export const onRequestGet = async ({ request }) => {
  const origin = new URL(request.url).origin;
  const u = (p) => new URL(p, origin).toString();

  const rootRes = await fetch(u("/root.json"));
  if (!rootRes.ok) {
    return json(
      {
        schema: "csoai.xrpl-reader/0.1",
        kind: "reader",
        writes_board: false,
        status: "UNMEASURED",
        unmeasured: ["root.json"],
        reason: `live /root.json HTTP ${rootRes.status}`,
      },
      503,
    );
  }
  const root = await rootRes.json();
  const hashes = Array.isArray(root.card_sha256) ? root.card_sha256 : [];
  const wrapped = await Promise.all(
    hashes.map(async (h) => {
      const r = await fetch(u(`/cards/${String(h).slice(0, 16)}.json`));
      if (!r.ok) return null;
      try {
        return await r.json();
      } catch {
        return null;
      }
    }),
  );
  const xrpl = wrapped
    .filter((w) => w && w.card && w.card.surface === "xrpl.asset.state")
    .map((w) => w.card);

  return json({
    schema: "csoai.xrpl-reader/0.1",
    kind: "reader",
    writes_board: false,
    root: "/root.json",
    merkle_root: root.merkle_root || null,
    n: xrpl.length,
    xrpl_asset_count_attempted: root.xrpl_asset_count_attempted || xrpl.length,
    note: "Coverage of public xrpl.fi identity-verified issued assets. Not a GSPC mill. Not 377 instruments. Not clients.",
    assets: xrpl.map((c) => ({
      symbol: (c.payload && c.payload.symbol) || null,
      issuer: (c.payload && c.payload.issuer) || null,
      issuer_address: (c.payload && c.payload.issuer_address) || null,
      kind: (c.payload && c.payload.kind) || "distributed",
      holders: (c.payload && c.payload.holders) ?? null,
      supply: (c.payload && c.payload.supply) ?? null,
      verified_via: (c.payload && c.payload.verified_via) || null,
      sha256: c.sha256,
      unmeasured: c.unmeasured || [],
      sig_ed25519: c.sig_ed25519,
    })),
  });
};
