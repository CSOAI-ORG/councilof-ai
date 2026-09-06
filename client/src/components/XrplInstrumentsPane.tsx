import { useEffect, useState } from "react";

/**
 * XRPL instruments — the live XRPL public-root catalogue as a table.
 *
 * Everything derived at load from GET /api/xrpl: assets, holders, supply,
 * verification path and the signed/unsigned split. NOTHING is typed; the pane
 * is honest about the catalogue's state (live 13/16 signed class and rising or
 * falling as the signer runs).
 *
 * Grammar: LOADING → skeleton. UNREACHABLE → that word, never a cached table.
 * A signed count is derived from sig_ed25519 != null. This is the XRPL
 * public-root catalogue reader — not a GSPC grade, not a bond, not a market.
 * Pay path: the per-asset evidence card is a paid x402 door (rwa_evidence) —
 * amounts only appear at the 402, never here.
 */

type XrplAsset = {
  symbol?: string;
  issuer?: string;
  kind?: string;
  holders?: number;
  supply?: number;
  verified_via?: string;
  sha256?: string;
  sig_ed25519?: string | null;
};

type XrplDoc = {
  schema?: string;
  as_of?: string;
  n?: number;
  merkle_root?: string;
};

export default function XrplInstrumentsPane() {
  const [doc, setDoc] = useState<XrplDoc | null>(null);
  const [assets, setAssets] = useState<XrplAsset[] | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/xrpl")
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("GET /api/xrpl HTTP " + r.status))))
      .then((d) => {
        setDoc(d);
        setAssets(Array.isArray(d.assets) ? d.assets : []);
      })
      .catch((e) => setErr(String(e)));
  }, []);

  const signed = assets ? assets.filter((a) => a.sig_ed25519 != null).length : null;

  if (err) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-800">
        UNREACHABLE — {err}. The catalogue reader did not answer; no cached table is shown.
      </div>
    );
  }
  if (!assets) {
    return (
      <div className="p-6">
        <div className="h-40 animate-pulse rounded-2xl bg-emerald-50" />
        <p className="mt-2 text-sm text-gray-500">Loading /api/xrpl…</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-emerald-100 bg-white p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-lg font-black text-gray-900">XRPL instruments</h2>
        <p className="font-mono text-xs text-gray-500">
          as_of {doc?.as_of || "…"} · n={doc?.n ?? "…"} · signed {signed ?? "…"}/{assets.length}
        </p>
      </div>
      <p className="mt-1 text-sm text-gray-600">
        The XRPL public-root catalogue: {assets.length} assets,{" "}
        {signed ?? "…"} with <code>sig_ed25519</code>. An unsigned asset is{" "}
        <em>unsigned</em> — say so, never a fabricated signature. Not a GSPC grade.
      </p>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-gray-200 text-xs uppercase tracking-wide text-gray-500">
              <th className="py-2 pr-4">symbol</th>
              <th className="py-2 pr-4">issuer</th>
              <th className="py-2 pr-4">kind</th>
              <th className="py-2 pr-4">holders</th>
              <th className="py-2 pr-4">supply</th>
              <th className="py-2 pr-4">verified via</th>
              <th className="py-2">signed</th>
            </tr>
          </thead>
          <tbody>
            {assets.map((a) => (
              <tr key={a.symbol || a.sha256} className="border-b border-gray-100">
                <td className="py-2 pr-4 font-mono font-bold text-gray-900">{a.symbol}</td>
                <td className="py-2 pr-4 text-gray-700">{a.issuer}</td>
                <td className="py-2 pr-4 text-gray-700">{a.kind}</td>
                <td className="py-2 pr-4 tabular-nums text-gray-700">{a.holders ?? "—"}</td>
                <td className="py-2 pr-4 tabular-nums text-gray-700">
                  {a.supply != null ? a.supply.toLocaleString() : "—"}
                </td>
                <td className="py-2 pr-4 text-gray-600">{a.verified_via || "—"}</td>
                <td className="py-2">
                  {a.sig_ed25519 ? (
                    <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-700">
                      signed
                    </span>
                  ) : (
                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-700">
                      unsigned
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-4 text-xs text-gray-500">
        Per-asset evidence card = the <code>rwa_evidence</code> x402 door (free{" "}
        <code>?preview=1</code> state; the settled card is paid at the 402 — the amount appears
        only in the challenge). Verification stays free. Never a grade.
      </p>
    </div>
  );
}
