import { useEffect, useState } from "react";
import { setMetaDescription } from "@/lib/utils";

/* /xrpl-attest — the permissionless-attach proof, human-readable.
 *
 * Renders /interop/xrpl-attest-run.json: a devnet-validated demonstration that
 * Council of AI can attach signed measurement evidence to a public ledger about
 * accounts it does not control. The honesty box is not a footnote — it is the
 * product framing: DEVNET capability proof, never an investment or a rating.
 */

interface RunRecord {
  schema: string;
  network: string;
  honesty: string;
  evidence: { source: string; card: string; axis?: string; sha256_of_canonical_entry: string; signer_kid: string; signer_pub: string };
  attestor_account: string;
  subject_account: string;
  memo_attach_tx: string;
  credential_attach_tx: string;
  explorer: string[];
  coverage?: {
    xrpl: { instrument: string; issuer: string; status: string; tx: string; explorer: string }[];
    evm: { asset: string; contract: string; status: string; uid: string }[];
    honesty: string;
  };
  registry?: {
    counts: { named: number; mainnet_verified_and_attested: number; not_located: number };
    instruments: { instrument: string; category: string; status: string; address_status: string; tx?: string }[];
    corpus_index: string;
    honesty: string;
  };
  financial_axis?: {
    status: string;
    measured: { instrument: string; issuer: string; allowlisting: boolean; freeze: boolean; domain: boolean; tx: string; explorer: string }[];
    honesty: string;
  };
}

export default function XrplAttest() {
  const [rec, setRec] = useState<RunRecord | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    document.title = "Ledger attestation — permissionless attach | Council of AI";
    setMetaDescription(
      "Devnet pointer: memo + optional XLS-70 URI to a card URL. XLS-70 Credentials exist on XRPL mainnet as an allowlist primitive. We are not issuing GSPC grades on-ledger.",
    );
    fetch("/interop/xrpl-attest-run.json")
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("HTTP " + r.status))))
      .then(setRec)
      .catch((e) => setErr(String(e)));
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 via-white to-white">
      <div className="mx-auto max-w-4xl px-6 py-14">
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-emerald-600">
          Interop — evidence that travels
        </p>
        <h1 className="mt-3 text-4xl font-black text-gray-900">Attestation on the ledger</h1>
        <p className="mt-4 max-w-3xl text-gray-600">
          A card&apos;s trust path is Ed25519 over SHA-256, not this ledger. This page is a{" "}
          <strong>devnet pointer</strong>: two transactions that memo or URI-point at signed
          evidence. XLS-70 Credentials are an on-ledger allowlist (who may pay whom), enabled on
          mainnet. We are not issuing GSPC grades as credentials, and this is not a bond, a
          rating, or a market.
        </p>

        {err && <p className="mt-8 text-red-600">Record fetch failed: {err}</p>}
        {!rec && !err && <p className="mt-8 text-gray-500">Loading the run record…</p>}

        {rec && (
          <>
            <div className="mt-8 rounded-xl border border-amber-300 bg-amber-50 p-5 text-sm text-amber-900">
              <p className="font-bold uppercase tracking-wide text-xs">Honesty box — read first</p>
              <p className="mt-2">{rec.honesty}</p>
            </div>

            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl border border-emerald-600/20 bg-white p-5 shadow-sm">
                <p className="text-xs font-bold uppercase tracking-wide text-emerald-700">
                  Attach 1 — transaction memo
                </p>
                <p className="mt-2 text-sm text-gray-600">
                  A 1-drop payment toward the subject account carrying the SHA-256 of a{" "}
                  <a className="text-emerald-700 underline" href={rec.evidence.source}>
                    live signed card entry
                  </a>{" "}
                  and an Ed25519 signature by the scoped key{" "}
                  <span className="font-mono text-xs">{rec.evidence.signer_kid}</span>.
                </p>
                <a className="mt-3 block break-all font-mono text-xs text-emerald-700 underline" href={rec.explorer[0]}>
                  {rec.memo_attach_tx}
                </a>
              </div>
              <div className="rounded-xl border border-emerald-600/20 bg-white p-5 shadow-sm">
                <p className="text-xs font-bold uppercase tracking-wide text-emerald-700">
                  Attach 2 — XLS-70 credential (devnet)
                </p>
                <p className="mt-2 text-sm text-gray-600">
                  A <span className="font-mono text-xs">CredentialCreate</span> on{" "}
                  <strong>devnet</strong>. Optional <span className="font-mono text-xs">URI</span>{" "}
                  may point at a card URL. The ledger object is not the card. Unaccepted credentials
                  authorize nothing. Mainnet XLS-70 exists; we are not minting a GSPC grade on it.
                </p>
                <a className="mt-3 block break-all font-mono text-xs text-emerald-700 underline" href={rec.explorer[1]}>
                  {rec.credential_attach_tx}
                </a>
              </div>
            </div>

            {rec.coverage && (
              <div className="mt-8 rounded-xl border border-emerald-600/20 bg-white p-5 shadow-sm">
                <p className="text-xs font-bold uppercase tracking-wide text-emerald-700">
                  Coverage universe — every status UNMEASURED
                </p>
                <p className="mt-2 text-sm text-gray-600">
                  An independent measurement body declaring its coverage across real, verified
                  instruments on two chains — in three-state grammar, permissionlessly. UNMEASURED
                  is a first-class answer, never hidden. Not verdicts, ratings, advice, or
                  endorsements.
                </p>
                <div className="mt-4 overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-left text-gray-700">
                        <th className="p-2">Chain</th><th className="p-2">Instrument</th>
                        <th className="p-2">Issuer / contract</th><th className="p-2">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rec.coverage.xrpl.map((c) => (
                        <tr key={c.tx} className="border-b last:border-0">
                          <td className="p-2 font-mono text-xs">XRPL</td>
                          <td className="p-2">{c.instrument}</td>
                          <td className="p-2"><a className="font-mono text-xs text-emerald-700 underline" href={c.explorer}>{c.issuer.slice(0, 14)}…</a></td>
                          <td className="p-2"><span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-bold text-gray-600">{c.status}</span></td>
                        </tr>
                      ))}
                      {rec.coverage.evm.map((c) => (
                        <tr key={c.uid} className="border-b last:border-0">
                          <td className="p-2 font-mono text-xs">EVM · EAS</td>
                          <td className="p-2">{c.asset}</td>
                          <td className="p-2 font-mono text-xs">{c.contract.slice(0, 14)}…</td>
                          <td className="p-2"><span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-bold text-gray-600">{c.status}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {rec.registry && (
              <div className="mt-8 rounded-xl border border-emerald-600/20 bg-white p-5 shadow-sm">
                <p className="text-xs font-bold uppercase tracking-wide text-emerald-700">
                  Coverage registry — named instruments, not a market
                </p>
                <p className="mt-2 text-sm text-gray-600">
                  The two transactions on this page are <strong>devnet</strong>. Counts below are
                  the published run record for named XRPL instruments:{" "}
                  <strong>{rec.registry.counts.named}</strong> named,{" "}
                  <strong>{rec.registry.counts.mainnet_verified_and_attested}</strong>{" "}
                  listed as mainnet-verified in that record,{" "}
                  <strong>{rec.registry.counts.not_located}</strong> listed but{" "}
                  <em>not attested</em> because no public issuer address was independently
                  confirmable. This is coverage accounting, not a bond or a grade. Queryable index:{" "}
                  <a className="text-emerald-700 underline" href={rec.registry.corpus_index}>
                    attestation-corpus.json
                  </a>.
                </p>
                <div className="mt-4 overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-left text-gray-700">
                        <th className="p-2">Instrument</th><th className="p-2">Category</th>
                        <th className="p-2">Address</th><th className="p-2">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rec.registry.instruments.map((r) => (
                        <tr key={r.instrument} className="border-b last:border-0">
                          <td className="p-2">{r.instrument}</td>
                          <td className="p-2 text-gray-500">{r.category}</td>
                          <td className="p-2">
                            <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${r.address_status === "mainnet-verified" ? "bg-emerald-100 text-emerald-800" : "bg-gray-100 text-gray-500"}`}>
                              {r.address_status}
                            </span>
                          </td>
                          <td className="p-2 font-mono text-xs text-gray-600">{r.status}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {rec.financial_axis && (
              <div className="mt-8 rounded-xl border border-emerald-700/30 bg-emerald-50/40 p-5 shadow-sm">
                <p className="text-xs font-bold uppercase tracking-wide text-emerald-800">
                  Financial axis — MEASURED (on-chain control facts)
                </p>
                <p className="mt-2 text-sm text-gray-700">
                  Real, deterministic, re-checkable facts read from the validated ledger and signed —
                  not a rating, not advice, not an endorsement. Regulated securities enforce
                  allowlisting; permissionless stablecoins do not. The <em>risk</em> verdict stays
                  UNMEASURED (an aggregate opinion on a named security needs counsel — refused here).
                </p>
                <div className="mt-4 overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-left text-gray-700">
                        <th className="p-2">Instrument</th><th className="p-2">Allowlisting</th>
                        <th className="p-2">Freeze</th><th className="p-2">Identity domain</th>
                        <th className="p-2">Signed</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rec.financial_axis.measured.map((m) => (
                        <tr key={m.tx} className="border-b last:border-0">
                          <td className="p-2 font-medium">{m.instrument}</td>
                          <td className="p-2">{m.allowlisting ? "enforced" : "none"}</td>
                          <td className="p-2">{m.freeze ? "retained" : "none"}</td>
                          <td className="p-2">{m.domain ? "declared" : "absent"}</td>
                          <td className="p-2"><a className="font-mono text-xs text-emerald-700 underline" href={m.explorer}>tx</a></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <div className="mt-8 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-bold uppercase tracking-wide text-gray-700">Verify it yourself</p>
              <p className="mt-2 text-sm text-gray-600">
                The stranger checker re-fetches both transactions from the public ledger, re-derives
                the digest from the live signed index, and verifies the signature — it passes only
                if every check passes, reports UNVERIFIABLE (never a pass) when a fetch fails, and a
                tampered record fails. No Council of AI infrastructure is trusted.
              </p>
              <pre className="mt-3 overflow-x-auto rounded-lg bg-gray-900 p-4 text-xs text-emerald-300">
{`git clone https://github.com/CSOAI-ORG/council-os
cd council-os/economy/xrpl-attest
pip install cryptography xrpl-py && python3 verify.py`}</pre>
              <p className="mt-3 text-xs text-gray-500">
                Network: {rec.network} · evidence card{" "}
                <span className="font-mono">{rec.evidence.card.slice(0, 16)}…</span>
                {rec.evidence.axis ? <> · axis {rec.evidence.axis}</> : null}
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
