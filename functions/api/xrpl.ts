/**
 * GET /api/xrpl — reader of the committed public-root 16.
 *
 * 200 only when this deploy's /root.json plus /cards yield exactly the locked
 * 16 xrpl.asset.state leaves whose sha256 sit on that root. Else keep 404
 * honest. Not a mill. Not 377. Does not write /api/gspc.
 */

type RootDoc = {
  merkle_root?: string;
  card_sha256?: string[];
  xrpl_asset_count_attempted?: number;
  xrpl_fi_assetCount?: number;
  as_of?: string;
};

type Card = {
  surface?: string;
  sha256?: string;
  sig_ed25519?: string | null;
  unmeasured?: string[];
  payload?: Record<string, unknown>;
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body, null, 2), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      "access-control-allow-origin": "*",
    },
  });

const four = (reason: string, extra: Record<string, unknown> = {}) =>
  json(
    {
      schema: "csoai.xrpl-reader/0.1",
      kind: "reader",
      writes_board: false,
      status: "UNMEASURED",
      error: "not_found",
      path: "/api/xrpl",
      reason,
      ...extra,
    },
    404,
  );

export const onRequestGet: PagesFunction = async ({ request }) => {
  const origin = new URL(request.url).origin;
  const u = (p: string) => new URL(p, origin).toString();

  const rootRes = await fetch(u("/root.json"));
  if (!rootRes.ok) return four(`live /root.json HTTP ${rootRes.status}`, { unmeasured: ["root.json"] });

  let root: RootDoc;
  try {
    root = (await rootRes.json()) as RootDoc;
  } catch {
    return four("root.json is not JSON", { unmeasured: ["root.json"] });
  }

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
    .filter((w) => w && w.card && (w.card as Card).surface === "xrpl.asset.state")
    .map((w) => w.card as Card);

  const onRoot = new Set(hashes);
  const same = xrpl.filter((c) => c.sha256 && onRoot.has(c.sha256));
  if (same.length !== 16) {
    return four(
      `committed xrpl.asset.state count is ${same.length}, not the locked 16 — keeping 404 honest`,
      { n: same.length, merkle_root: root.merkle_root || null, unmeasured: ["xrpl.asset.state.16"] },
    );
  }

  return json({
    schema: "csoai.xrpl-reader/0.1",
    kind: "reader",
    writes_board: false,
    root: "/root.json",
    merkle_root: root.merkle_root || null,
    as_of: root.as_of || null,
    n: 16,
    xrpl_asset_count_attempted: root.xrpl_asset_count_attempted || 16,
    xrpl_fi_assetCount: root.xrpl_fi_assetCount ?? null,
    note: "Coverage of public xrpl.fi identity-verified issued assets. Not a GSPC mill. Not 377 instruments. Not clients.",
    assets: same.map((c) => ({
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
