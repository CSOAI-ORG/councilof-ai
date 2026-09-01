import { useEffect, useState } from "react";
import { setMetaDescription } from "@/lib/utils";
import PublicRootCatalogue from "@/components/gspc/PublicRootCatalogue";

/**
 * /xrpl-attest — public-root catalogue reader, not a DEVNET grade.
 *
 * Living feed is GET /root.json. GET /api/xrpl is a reader of that root
 * (writes_board false, n=16). Live /api/xrpl: 14/16 GH-secret sigs;
 * EURQ/USDQ unsigned (NO_LAPTOP_SIGN). Historical DEVNET txs are not this feed.
 * Do not restamp. Do not mix represented TVL. Do not add /api/swift.
 */

type RootDoc = {
  as_of?: string;
  card_count?: number;
  merkle_root?: string;
  xrpl_fi_assetCount?: number;
  did_intended?: string;
  note?: string;
};

export default function XrplAttest() {
  const [root, setRoot] = useState<RootDoc | null>(null);
  const [xrplStatus, setXrplStatus] = useState<number | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    document.title = "XRPL public-root catalogue — 14/16 GH-secret sigs; EURQ/USDQ unsigned | Council of AI";
    setMetaDescription(
      "GET /root.json is the living XRPL catalogue. GET /api/xrpl: 14/16 GH-secret sigs; EURQ/USDQ unsigned (NO_LAPTOP_SIGN). writes_board false. DEVNET historical. Not a GSPC grade.",
    );
    fetch("/root.json")
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("GET /root.json HTTP " + r.status))))
      .then(setRoot)
      .catch((e) => setErr(String(e)));
    fetch("/api/xrpl")
      .then((r) => setXrplStatus(r.status))
      .catch(() => setXrplStatus(0));
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 via-white to-white">
      <div className="mx-auto max-w-4xl px-6 py-14">
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-emerald-600">
          Interop — public-root reader
        </p>
        <h1 className="mt-3 text-4xl font-black text-gray-900">XRPL public-root catalogue</h1>
        <p className="mt-4 max-w-3xl text-gray-600">
          Living catalogue is GET <a className="text-emerald-700 underline" href="/root.json">/root.json</a>.
          GET <a className="text-emerald-700 underline" href="/api/xrpl">/api/xrpl</a> has{" "}
          <strong>14/16 GH-secret sigs</strong>; <code>EURQ</code>/<code>USDQ</code> unsigned
          (<code>sig_ed25519</code> null, NO_LAPTOP_SIGN). Do not say all leaves unsigned.
          Inclusion is membership in that hash list — not a laptop-signed card check for the two
          unsigned leaves. Schema:{" "}
          <a className="text-emerald-700 underline" href="/schema/card-v0.json">/schema/card-v0.json</a>.
          Intended DID: <code>did:web:csoai.org#board-attestation-1</code>. We use{" "}
          <strong>did:web:csoai.org</strong>, not did:xrpl. DEVNET Payment-memo / CredentialCreate
          hashes are historical, not this feed. This is not a GSPC grade, not a bond,
          and not a market. Do not mix represented TVL.
        </p>

        <div className="mt-8 rounded-xl border border-amber-300 bg-amber-50 p-5 text-sm text-amber-900">
          <p className="font-bold uppercase tracking-wide text-xs">Honesty box — read first</p>
          <p className="mt-2">
            GET <code>/api/xrpl</code> is a <strong>reader</strong> of <code>/root.json</code>
            {xrplStatus != null ? <> (HTTP {xrplStatus} this load)</> : null}.{" "}
            <code>writes_board</code> is false. Live n=16: 14/16 GH-secret sigs; EURQ/USDQ unsigned.
            Do not stamp MEASURED from this catalogue. Do not restamp. Historical XRPL DEVNET
            Payment-memo / CredentialCreate hashes are not this feed. Hugging Face mirror:{" "}
            <a className="underline" href="https://huggingface.co/datasets/csoai/gspc-boards">
              csoai/gspc-boards
            </a>{" "}
            <code>public-root/root.json</code>.
          </p>
          {root?.note && <p className="mt-2">{root.note}</p>}
        </div>

        {err && <p className="mt-8 text-red-600">Root fetch failed: {err}</p>}
        {!root && !err && <p className="mt-8 text-gray-500">Loading /root.json…</p>}

        {root && (
          <dl className="mt-8 grid gap-3 sm:grid-cols-2 text-sm">
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <dt className="text-xs uppercase tracking-wide text-slate-500">as_of</dt>
              <dd className="mt-1 font-mono">{root.as_of || "—"}</dd>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <dt className="text-xs uppercase tracking-wide text-slate-500">card_count</dt>
              <dd className="mt-1 font-mono">{root.card_count ?? "—"}</dd>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-4 sm:col-span-2">
              <dt className="text-xs uppercase tracking-wide text-slate-500">merkle_root</dt>
              <dd className="mt-1 break-all font-mono text-xs">{root.merkle_root || "—"}</dd>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <dt className="text-xs uppercase tracking-wide text-slate-500">xrpl.fi assetCount</dt>
              <dd className="mt-1 font-mono">{root.xrpl_fi_assetCount ?? "—"}</dd>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <dt className="text-xs uppercase tracking-wide text-slate-500">/api/xrpl sigs</dt>
              <dd className="mt-1 font-mono">14/16 GH-secret; EURQ/USDQ unsigned</dd>
            </div>
          </dl>
        )}

        <div className="mt-8">
          <PublicRootCatalogue variant="light" />
        </div>

        <p className="mt-8 text-sm text-gray-600">
          Estate cards still recompute at{" "}
          <a className="text-emerald-700 underline" href="/gspc-verify">/gspc-verify</a>{" "}
          (estate mode). Public-root mode on that page loads this same catalogue: 14/16 GH-secret
          sigs on GET /api/xrpl; EURQ/USDQ unsigned; DEVNET historical.
        </p>
      </div>
    </div>
  );
}
