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
}

export default function XrplAttest() {
  const [rec, setRec] = useState<RunRecord | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    document.title = "Ledger attestation — permissionless attach | Council of AI";
    setMetaDescription(
      "Devnet-validated proof: Council of AI attaches signed measurement evidence to the XRP Ledger about accounts it does not control — memo + XLS-70 credential, stranger-verifiable.",
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
          The tokenized-asset market has ratings and compliance data — but every production
          example flows <em>through</em> the issuer&apos;s cooperation. The missing layer is an{" "}
          <strong>independent</strong> attestor: signed evidence about assets the attestor does not
          issue, attached with nobody&apos;s permission, verifiable by anyone. This page is a
          validated demonstration of exactly that.
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
                  Attach 2 — XLS-70 credential
                </p>
                <p className="mt-2 text-sm text-gray-600">
                  An on-ledger <span className="font-mono text-xs">CredentialCreate</span> naming an
                  account we do not control, type{" "}
                  <span className="font-mono text-xs">CSOAI.GSPC.CARD/0.1</span>, URI pointing at the
                  public signed index. Unaccepted credentials authorize nothing — the attach itself
                  is the demonstration.
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
                  Coverage registry — the full XRPL RWA universe
                </p>
                <p className="mt-2 text-sm text-gray-600">
                  All <strong>{rec.registry.counts.named}</strong> named XRPL tokenized-RWA
                  instruments, accounted for honestly:{" "}
                  <strong>{rec.registry.counts.mainnet_verified_and_attested}</strong>{" "}
                  mainnet-verified and attested on-ledger,{" "}
                  <strong>{rec.registry.counts.not_located}</strong> listed but{" "}
                  <em>not attested</em> because no public issuer address was independently
                  confirmable. Nothing is faked to reach a count — the reference layer earns
                  trust by what it refuses to assert. Queryable index:{" "}
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
