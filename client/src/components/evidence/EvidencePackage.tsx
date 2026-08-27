import { useEffect, useState } from "react";
import { Link } from "wouter";

/**
 * Evidence Package — ported from donor csoai-org-v2 (src/app/evidence/page.tsx)
 * per CONSOLIDATION.md.
 *
 * Per-attestation evidence package: enter a cert_id, fetch the signed record
 * from the live attestation API, and see the chain position + human-readable
 * gloss. This is also where the donor's "live-worker client" jewel lands: the
 * fetch below is the client-side half of the donor's src/lib/attestation.ts
 * (which was a Next.js server-side fetcher — not portable to a Vite SPA),
 * reduced to the one call this page needs, with a timeout and honest error
 * states.
 *
 * Changes from the donor:
 *  - FIXED a donor bug: the donor's verify form POSTed the cert_id to
 *    /api/subscribe (a newsletter endpoint). The port fetches
 *    /verify/<cert_id> on the attestation API — the endpoint the donor page
 *    itself documents two sections later.
 *  - The donor's "Measured results" block is NOT ported: those figures
 *    (GovComp-Bench 1.000/32, frontier 0.489, 3 primaries, refusal 0.0% FP,
 *    15/15 citations) were already harvested into the master's /layer0 (P3).
 *    A "Where the numbers live" strip links there instead of duplicating.
 *  - dangerouslySetInnerHTML legacy markup + inline <style> replaced with
 *    ordinary React/Tailwind in the master wing theme.
 *  - Register: "Watchdog Certificate" kept only as the record type name;
 *    copy otherwise stays in the measured/signed/attestation register.
 */

const ATTESTATION_API = "https://meok-attestation-api.vercel.app";

type AttestationRecord = {
  id?: string;
  ts?: number;
  line?: string;
  gloss?: string;
  digest?: string;
  prev_sig?: string;
  signature?: string;
  alg?: string;
  chain_position?: number;
  total_chain_length?: number;
};

type FetchState =
  | { state: "idle" }
  | { state: "loading" }
  | { state: "ok"; record: AttestationRecord }
  | { state: "not_found" }
  | { state: "unreachable" };

const EXAMPLE_IDS = [
  "MEOK-MEOKSP-7D1E008FE28",
  "MEOK-MEOKSP-01B2F35D59E0",
  "MEOK-MEOKSP-067C85866DB9",
];

const CHAIN_STEPS = [
  {
    title: "1. The record",
    body: "Every signed attestation has a unique ID (e.g. MEOK-MEOKSP-7D1E008FE28) and is signed with Ed25519.",
  },
  {
    title: "2. The signature",
    body: "The signature is over (digest + prev_sig), where digest is SHA-256 of the canonical signed-vote line.",
  },
  {
    title: "3. The chain",
    body: "Each record references the previous record's signature. Walking the chain from genesis proves no records were tampered with.",
  },
  {
    title: "4. The gloss",
    body: "The plain-English interpretation tells non-technical auditors and regulators what the record means.",
  },
];

export default function EvidencePackage() {
  const [certId, setCertId] = useState("");
  const [result, setResult] = useState<FetchState>({ state: "idle" });

  useEffect(() => {
    document.title = "Evidence Package — verify a signed attestation | CSOAI";
  }, []);

  async function lookup(id: string) {
    const trimmed = id.trim();
    if (!trimmed) return;
    setResult({ state: "loading" });
    try {
      const res = await fetch(`${ATTESTATION_API}/verify/${encodeURIComponent(trimmed)}`, {
        headers: { Accept: "application/json" },
        signal: AbortSignal.timeout(8000),
      });
      if (res.status === 404) {
        setResult({ state: "not_found" });
        return;
      }
      if (!res.ok) {
        setResult({ state: "unreachable" });
        return;
      }
      const record = (await res.json()) as AttestationRecord;
      setResult({ state: "ok", record });
    } catch {
      setResult({ state: "unreachable" });
    }
  }

  return (
    <div className="min-h-screen bg-[#03110b] text-emerald-50">
      <div className="mx-auto max-w-4xl px-6 pt-14 pb-16">
        <p className="font-mono text-[11px] uppercase tracking-[3px] text-emerald-300/70">
          CSOAI · Evidence
        </p>
        <h1 className="mt-3 text-4xl sm:text-4xl font-black tracking-tight">
          Per-record{" "}
          <span className="bg-gradient-to-r from-emerald-300 to-teal-300 bg-clip-text text-transparent">
            evidence package
          </span>
        </h1>
        <p className="mt-4 max-w-3xl text-lg leading-relaxed text-emerald-100/75">
          Every signed attestation is an evidence package. Enter a cert_id to see the full package:
          signature, chain position, and human-readable interpretation — fetched live from the
          attestation API.
        </p>

        {/* Verify box */}
        <div className="mt-10 rounded-2xl border-2 border-emerald-400/40 bg-emerald-500/[0.06] p-6 sm:p-8">
          <h2 className="mb-4 text-xl font-bold tracking-tight">Verify an attestation</h2>
          <form
            className="flex flex-wrap gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              lookup(certId);
            }}
          >
            <input
              type="text"
              value={certId}
              onChange={(e) => setCertId(e.target.value)}
              placeholder="MEOK-MEOKSP-7D1E008FE28"
              aria-label="Attestation cert_id"
              className="min-w-[280px] flex-1 rounded-lg border border-emerald-500/40 bg-black/30 px-4 py-2.5 font-mono text-sm text-emerald-50 placeholder:text-emerald-100/30 focus:border-emerald-300 focus:outline-none"
            />
            <button
              type="submit"
              disabled={result.state === "loading"}
              className="rounded-lg bg-emerald-500 px-6 py-2.5 text-sm font-bold text-[#03110b] transition hover:bg-emerald-400 disabled:opacity-60"
            >
              {result.state === "loading" ? "Fetching…" : "Verify →"}
            </button>
          </form>

          {result.state === "ok" && (
            <div className="mt-4 rounded-xl border border-emerald-500/30 bg-black/30 p-4 font-mono text-xs leading-relaxed text-emerald-100/85">
              <div className="mb-2 text-[10px] uppercase tracking-[2px] text-emerald-300/60">
                Signed record · alg {result.record.alg ?? "unknown"}
                {typeof result.record.chain_position === "number" &&
                  ` · chain position ${result.record.chain_position}` +
                    (typeof result.record.total_chain_length === "number"
                      ? ` of ${result.record.total_chain_length}`
                      : "")}
              </div>
              {result.record.gloss && (
                <p className="mb-3 font-sans text-[13px] text-emerald-100/80">{result.record.gloss}</p>
              )}
              <pre className="overflow-x-auto whitespace-pre-wrap break-all">
                {JSON.stringify(result.record, null, 2)}
              </pre>
            </div>
          )}
          {result.state === "not_found" && (
            <div className="mt-4 rounded-xl border border-amber-400/40 bg-amber-500/10 p-4 text-sm text-amber-200">
              No record with that cert_id. Check the ID and try again — verification is against the
              live chain, so an unknown ID is reported, not guessed.
            </div>
          )}
          {result.state === "unreachable" && (
            <div className="mt-4 rounded-xl border border-amber-400/40 bg-amber-500/10 p-4 text-sm text-amber-200">
              The attestation API did not answer. The record may still be valid — verification
              failed to complete, it did not fail. Try again, or verify the signature offline with
              any Ed25519 tool.
            </div>
          )}
        </div>

        {/* How it works */}
        <h2 className="mt-14 mb-5 text-2xl font-bold tracking-tight">How it works</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {CHAIN_STEPS.map((s) => (
            <div key={s.title} className="rounded-xl border border-emerald-500/20 bg-[#05140d] p-5">
              <strong className="mb-1.5 block text-emerald-300">{s.title}</strong>
              <p className="text-[13px] leading-relaxed text-emerald-100/70">{s.body}</p>
            </div>
          ))}
        </div>

        {/* Examples */}
        <h2 className="mt-14 mb-4 text-2xl font-bold tracking-tight">Example evidence packages</h2>
        <p className="mb-4 text-emerald-100/70">Try one of these live records:</p>
        <div className="space-y-2">
          {EXAMPLE_IDS.map((id) => (
            <div
              key={id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-emerald-500/20 bg-[#05140d] px-4 py-3 font-mono text-[13px]"
            >
              <span className="text-emerald-100/85">{id}</span>
              <span className="flex gap-3">
                <button
                  onClick={() => {
                    setCertId(id);
                    lookup(id);
                  }}
                  className="text-emerald-300 hover:underline"
                >
                  load →
                </button>
                <a
                  href={`${ATTESTATION_API}/verify/${id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-teal-300 hover:underline"
                >
                  raw JSON →
                </a>
              </span>
            </div>
          ))}
        </div>

        {/* What you get back */}
        <h2 className="mt-14 mb-4 text-2xl font-bold tracking-tight">What you get back</h2>
        <pre className="overflow-x-auto rounded-xl border border-emerald-500/20 bg-black/30 p-4 font-mono text-xs leading-relaxed text-emerald-100/80">{`{
  "id": "MEOK-MEOKSP-7D1E008FE28",
  "ts": 1781669322.0,
  "line": "C|signer|principal|...",
  "gloss": "Plain-English summary of the attestation",
  "digest": "909c0295afb058e9",
  "prev_sig": "a9dd344e8b54b2db...",
  "signature": "abc123def456...",
  "alg": "ed25519",
  "chain_position": 496,
  "total_chain_length": 609
}`}</pre>

        {/* Bulk verification */}
        <h2 className="mt-14 mb-4 text-2xl font-bold tracking-tight">Bulk verification</h2>
        <p className="mb-3 text-emerald-100/70">
          For auditors checking 100+ records at once, use the API:
        </p>
        <pre className="mb-4 overflow-x-auto rounded-xl border border-emerald-500/20 bg-black/30 p-4 font-mono text-xs leading-relaxed text-emerald-100/80">{`curl -s ${ATTESTATION_API}/api/manifest | jq '.records[].id'
# Returns every cert_id in the chain`}</pre>
        <p className="mb-3 text-emerald-100/70">Or programmatically check a single record:</p>
        <pre className="overflow-x-auto rounded-xl border border-emerald-500/20 bg-black/30 p-4 font-mono text-xs leading-relaxed text-emerald-100/80">{`import requests
r = requests.get("${ATTESTATION_API}/verify/MEOK-MEOKSP-7D1E008FE28")
cert = r.json()
assert cert["alg"] == "ed25519"
print(f"Valid record: {cert['id']}, chain position {cert['chain_position']}")`}</pre>

        {/* Where the numbers live */}
        <h2 className="mt-14 mb-4 text-2xl font-bold tracking-tight">Where the measured numbers live</h2>
        <p className="mb-4 leading-relaxed text-emerald-100/70">
          The benchmark figures behind these records — the governed-gate bench, the frontier
          comparison, the framework gap matrix, the refusal-quality run — are published with their
          caveats on the Layer 0 bench, and the chain underneath them can be recomputed in your
          browser.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/layer0"
            className="rounded-xl bg-emerald-500 px-5 py-2.5 text-sm font-bold text-[#03110b] transition hover:bg-emerald-400"
          >
            The Layer 0 bench →
          </Link>
          <Link
            href="/gspc-verify"
            className="rounded-xl border border-emerald-400/40 px-5 py-2.5 text-sm font-bold text-emerald-100 transition hover:bg-white/5"
          >
            Recompute a chain yourself
          </Link>
          <Link
            href="/provenance-finding"
            className="rounded-xl border border-emerald-400/40 px-5 py-2.5 text-sm font-bold text-emerald-100 transition hover:bg-white/5"
          >
            The 0-of-20 provenance finding
          </Link>
        </div>

        {/* For your records */}
        <h2 className="mt-14 mb-4 text-2xl font-bold tracking-tight">For your records</h2>
        <p className="mb-3 text-emerald-100/70">For your audit, save:</p>
        <ul className="list-disc space-y-1.5 pl-6 text-emerald-100/75">
          <li>
            The <strong className="text-emerald-50">cert_id</strong> (e.g.{" "}
            <code className="text-teal-300">MEOK-MEOKSP-7D1E008FE28</code>)
          </li>
          <li>
            The <strong className="text-emerald-50">timestamp</strong> (Unix epoch, when the record
            was signed)
          </li>
          <li>
            The <strong className="text-emerald-50">record JSON</strong> (download from the verify
            URL)
          </li>
          <li>
            The <strong className="text-emerald-50">chain position</strong> (which record in the
            ledger)
          </li>
          <li>
            The <strong className="text-emerald-50">signature verification result</strong> (your
            local Ed25519 verification)
          </li>
        </ul>

        <p className="mt-14 border-t border-emerald-500/15 pt-6 text-center text-xs text-emerald-100/40">
          © 2026 CSOAI LTD (UK Companies House 16939677) · A signature proves integrity and
          authorship — never that a claim is true. Provenance is not truth.
        </p>
      </div>
    </div>
  );
}
