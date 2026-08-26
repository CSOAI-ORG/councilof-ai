/**
 * VerifyButton — client-side chain verification.
 *   - The label states EXACTLY what was verified (today: tamper-evidence,
 *     NOT authenticity).
 *   - An explicit note distinguishes tamper-evidence from authenticity.
 *   - Tampering is detected and shown — a modified record → BROKEN.
 *   - Runs client-side (WebCrypto). The user does not take our word for it.
 *   - When Ed25519/ML-DSA ship, the label upgrades in the same commit.
 */

import { useEffect, useState } from "react";
import { loadReplayRecords } from "@/data/chain";
import { verifyChain, type VerifyResult } from "@/lib/verify";
import type { JRecord } from "@/data/arena";

export function VerifyButton() {
  const [records, setRecords] = useState<JRecord[] | null>(null);
  const [loadErr, setLoadErr] = useState<string | null>(null);
  const [result, setResult] = useState<VerifyResult | null>(null);
  const [running, setRunning] = useState(false);
  const [tampering, setTampering] = useState(false);

  // 2026-08-26: a rejected load left the button disabled, forever, reading
  // "Verify 0 records client-side" — indistinguishable from a working button on
  // an empty set. The load now has a visible pending state and a visible failure.
  useEffect(() => {
    let cancelled = false;
    loadReplayRecords()
      .then((r) => { if (!cancelled) setRecords(r); })
      .catch((e) => { if (!cancelled) setLoadErr(String(e?.message || e)); });
    return () => { cancelled = true; };
  }, []);

  async function runVerify() {
    if (!records) return;
    setRunning(true);
    setResult(null);
    let input = records;
    if (tampering) {
      // Inject a tampered record — flip the first byte of the chain_hash of record 0.
      input = records.map((r, i) => {
        if (i !== 0) return r;
        const flipped = r.sigil.chain_hash[0] === "0" ? "f" : "0";
        return {
          ...r,
          sigil: { ...r.sigil, chain_hash: flipped + r.sigil.chain_hash.slice(1) },
        };
      });
    }
    const r = await verifyChain(input);
    setResult(r);
    setRunning(false);
  }

  return (
    <div>
      <p className="text-[13px] text-emerald-100/70 leading-relaxed">
        The verification runs locally in your browser using{" "}
        <a
          href="https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto"
          target="_blank"
          rel="noreferrer"
          className="text-emerald-300 hover:underline"
        >
          WebCrypto
        </a>
        . No record leaves your machine. Today the chain is sha256-linked; the verify button only
        ever claims what the cryptography currently does.
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-4">
        <button
          onClick={runVerify}
          disabled={!records || running || !!loadErr}
          data-testid="verify-button"
          className="inline-flex min-h-[44px] items-center rounded-lg border border-amber-400/60 bg-emerald-500 px-5 py-2.5 text-[14px] font-bold text-[#03110b] transition-colors cursor-pointer hover:bg-emerald-400 disabled:cursor-wait disabled:opacity-50"
        >
          {running
            ? "Verifying…"
            : loadErr
              ? "Replay set unavailable"
              : records
                ? `Verify ${records.length} records client-side`
                : "Loading the replay set…"}
        </button>

        <label className="flex min-h-[44px] items-center gap-2 text-[13px] text-emerald-100/70 cursor-pointer">
          <input
            type="checkbox"
            checked={tampering}
            onChange={(e) => setTampering(e.target.checked)}
            data-testid="tamper-checkbox"
            className="h-5 w-5 accent-amber-400 [color-scheme:dark]"
          />
          Inject a tampered record (proves detection)
        </label>
      </div>

      {loadErr && (
        <p className="mt-3 text-[13px] font-semibold text-red-300" role="alert">
          The public replay set could not be loaded ({loadErr}). Nothing has been verified — do not
          read this as a pass. Reload, or fetch the records yourself from{" "}
          <a className="underline" href="/api/gspc">GET /api/gspc</a>.
        </p>
      )}

      {result && (
        <div
          role="status"
          data-testid="verify-result"
          className={`mt-5 rounded-2xl border p-5 ${
            result.ok
              ? "border-emerald-400/50 bg-emerald-500/10"
              : "border-red-400/50 bg-red-500/10"
          }`}
        >
          {/* A failure must not render in the success colour. The headline was
              emerald-50 in both states, so a detected tamper read green. */}
          <p
            data-testid="verify-result-label"
            className={`text-[16px] ${result.ok ? "text-emerald-50" : "text-red-300 font-bold"}`}
          >
            {result.ok ? "✓ " : "✗ "}
            <strong>{result.label}</strong>{" "}
            <span className={`font-mono text-[12px] ${result.ok ? "text-emerald-100/60" : "text-red-200/60"}`}>
              · sig_alg: {result.sig_alg}
            </span>
          </p>
          {!result.ok && (
            <p className="mt-2 text-[13px] font-semibold text-red-300">
              A record was edited after signing — the recomputed hash does not match the stored
              one. The broken row is identified in the per-record results below.
            </p>
          )}

          <p className="mt-3 text-[13px] text-emerald-100/80 leading-relaxed">
            <strong className="text-emerald-50">What was verified:</strong> {result.what_was_verified}
          </p>
          <p className="mt-2 text-[13px] text-emerald-100/80 leading-relaxed">
            <strong className="text-emerald-50">What was NOT verified:</strong> {result.what_was_NOT_verified}
          </p>

          <details className="mt-4">
            <summary className="cursor-pointer text-[13px] text-emerald-300">
              Per-record results ({result.lines.length})
            </summary>
            <div className="mt-2 overflow-x-auto rounded-lg border border-emerald-500/20">
              {/* min-w so the wrapper scrolls: these are 64-char hashes. */}
              <table className="w-full min-w-[40rem] text-[12px]">
                <thead>
                  <tr className="border-b border-emerald-500/20 text-left font-mono text-[11px] uppercase tracking-wider text-emerald-100/60">
                    <th className="px-3 py-2">Record</th>
                    <th className="px-3 py-2">Body hash match?</th>
                    <th className="px-3 py-2">Stored</th>
                    <th className="px-3 py-2">Computed</th>
                  </tr>
                </thead>
                <tbody>
                  {result.lines.map((l) => (
                    <tr key={l.record_id} className="border-b border-emerald-500/10 last:border-0">
                      <td className="px-3 py-2 font-mono text-emerald-100/70">{l.record_id}</td>
                      <td className={`px-3 py-2 font-semibold ${l.body_hash_ok ? "text-emerald-300" : "text-red-300"}`}>
                        {l.body_hash_ok ? "✓ ok" : "✗ BROKEN"}
                      </td>
                      <td className="px-3 py-2 font-mono text-emerald-100/60">{l.chain_hash_stored}</td>
                      <td className="px-3 py-2 font-mono text-emerald-100/60">{l.body_hash_computed}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </details>
        </div>
      )}
    </div>
  );
}
