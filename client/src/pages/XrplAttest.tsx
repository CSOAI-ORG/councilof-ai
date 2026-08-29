import { useEffect, useState } from "react";
import { setMetaDescription } from "@/lib/utils";

/* /xrpl-attest — Package 2 pointer, DEVNET only.
 *
 * Renders /interop/xrpl-attest-run.json. Two hashes, labelled from a live
 * JSON-RPC `tx` read 2026-08-29: Payment+memo, and XLS-70 CredentialCreate.
 * Neither exists on mainnet. CredentialCreate is a pointer, not a GSPC grade.
 * Glass cards (package 1) stay card-v1 on /gspc-verify; this page is not that.
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
  tx_labels?: {
    checked?: string;
    memo_attach_tx?: { TransactionType?: string; network?: string; ledger_index?: number; mainnet?: string; note?: string; memo_type?: string };
    credential_attach_tx?: { TransactionType?: string; network?: string; ledger_index?: number; mainnet?: string; note?: string; CredentialType_ascii?: string; URI?: string };
  };
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
    document.title = "Ledger attestation — XRPL DEVNET pointer | Council of AI";
    setMetaDescription(
      "DEVNET pointer only: a Payment memo and an XLS-70 CredentialCreate. Both hashes are txnNotFound on mainnet. XLS-70 exists on mainnet; we are not issuing grades on it.",
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
        <h1 className="mt-3 text-4xl font-black text-gray-900">XRPL DEVNET pointer</h1>
        <p className="mt-4 max-w-3xl text-gray-600">
          A card&apos;s trust path is Ed25519 over SHA-256 at{" "}
          <a className="text-emerald-700 underline" href="/gspc-verify">/gspc-verify</a>
          , not this ledger. Two stranger-readable hashes on <strong>XRPL Devnet</strong>{" "}
          (Payment memo + CredentialCreate) point at a published card index. Both are
          txnNotFound on mainnet. We use <strong>did:web:csoai.org</strong>, not did:xrpl
          (XLS-40). DepositPreauth is not a product. We are not issuing GSPC grades as
          credentials, and this is not a bond, a rating, or a market.
        </p>

        {err && <p className="mt-8 text-red-600">Record fetch failed: {err}</p>}
        {!rec && !err && <p className="mt-8 text-gray-500">Loading the run record…</p>}

        {rec && (
          <>
            <div className="mt-8 rounded-xl border border-amber-300 bg-amber-50 p-5 text-sm text-amber-900">
              <p className="font-bold uppercase tracking-wide text-xs">Honesty box — read first</p>
              <p className="mt-2">{rec.honesty}</p>
            </div>

            <div className="mt-8 overflow-x-auto rounded-xl border border-slate-200 bg-white">
              <table className="w-full text-sm">
                <caption className="sr-only">The two published XRPL hashes</caption>
                <thead>
                  <tr className="border-b bg-slate-50 text-left text-slate-700">
                    <th className="p-3">Kind</th>
                    <th className="p-3">Network</th>
                    <th className="p-3">Transaction</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b">
                    <td className="p-3 font-semibold">Payment memo</td>
                    <td className="p-3 font-mono text-xs">{rec.network}</td>
                    <td className="p-3">
                      <a className="break-all font-mono text-xs text-emerald-700 underline" href={rec.explorer[0]}>
                        {rec.memo_attach_tx}
                      </a>
                    </td>
                  </tr>
                  <tr>
                    <td className="p-3 font-semibold">XLS-70 CredentialCreate</td>
                    <td className="p-3 font-mono text-xs">{rec.network}</td>
                    <td className="p-3">
                      <a className="break-all font-mono text-xs text-emerald-700 underline" href={rec.explorer[1]}>
                        {rec.credential_attach_tx}
                      </a>
                      <p className="mt-1 text-xs text-slate-500">Not a GSPC grade. No mainnet mint.</p>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl border border-emerald-600/20 bg-white p-5 shadow-sm">
                <p className="text-xs font-bold uppercase tracking-wide text-emerald-700">
                  Hash 1 — Payment memo
                </p>
                <p className="mt-1 font-mono text-[11px] text-emerald-800">
                  TransactionType: {rec.tx_labels?.memo_attach_tx?.TransactionType || "Payment"} · network:{" "}
                  {rec.tx_labels?.memo_attach_tx?.network || "xrpl-devnet"} · mainnet:{" "}
                  {rec.tx_labels?.memo_attach_tx?.mainnet || "txnNotFound"}
                </p>
                <p className="mt-2 text-sm text-gray-600">
                  A 1-drop <span className="font-mono text-xs">Payment</span> toward the subject
                  account. Memo type <span className="font-mono text-xs">{rec.tx_labels?.memo_attach_tx?.memo_type || "csoai/attest"}</span>{" "}
                  carries the SHA-256 of a{" "}
                  <a className="text-emerald-700 underline" href={rec.evidence.source}>
                    live signed card entry
                  </a>
                  . Pointer, not a score. Re-read {rec.tx_labels?.checked || "2026-08-29"} on Devnet RPC; absent on mainnet.
                </p>
                <a className="mt-3 block break-all font-mono text-xs text-emerald-700 underline" href={rec.explorer[0]}>
                  {rec.memo_attach_tx}
                </a>
              </div>
              <div className="rounded-xl border border-emerald-600/20 bg-white p-5 shadow-sm">
                <p className="text-xs font-bold uppercase tracking-wide text-emerald-700">
                  Hash 2 — CredentialCreate (XLS-70, DEVNET)
                </p>
                <p className="mt-1 font-mono text-[11px] text-emerald-800">
                  TransactionType: {rec.tx_labels?.credential_attach_tx?.TransactionType || "CredentialCreate"} · network:{" "}
                  {rec.tx_labels?.credential_attach_tx?.network || "xrpl-devnet"} · mainnet:{" "}
                  {rec.tx_labels?.credential_attach_tx?.mainnet || "txnNotFound"}
                </p>
                <p className="mt-2 text-sm text-gray-600">
                  On-ledger <span className="font-mono text-xs">CredentialCreate</span>. Type name{" "}
                  <span className="font-mono text-xs">{rec.tx_labels?.credential_attach_tx?.CredentialType_ascii || "CSOAI.GSPC.CARD/0.1"}</span>{" "}
                  is a pointer label. URI{" "}
                  <span className="font-mono text-xs">{rec.tx_labels?.credential_attach_tx?.URI || rec.evidence.source}</span>.
                  Unaccepted, so it authorizes nothing. <strong>Not a GSPC grade.</strong> Not
                  DepositPreauth. Not CSOAI KYC. Do not mint this on mainnet.
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
