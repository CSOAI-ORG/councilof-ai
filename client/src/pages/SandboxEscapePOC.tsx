import { useEffect, useState } from "react";
import { Link } from "wouter";
import { verifyEd25519Detached, type Ed25519Result } from "@/lib/verify";

/**
 * /poc/sandbox-escape — a live, signed POC: an arena that catches a model whose
 * output attempts to escape its sandbox, and disqualifies it even when its answer
 * is correct. Timely against the "models acting outside their sandbox" news.
 *
 * Honesty held on purpose: this is escape DETECTION + disqualification with signed
 * proof — NOT an OS-level guarantee that a model cannot escape. The record shows
 * the containment backend used; a missing/failed backend is reported as UNKNOWN,
 * never as a pass.
 */

const BASE = "/packs/sandbox-escape";
const PUBKEY = "ZnF3DZUFc5QOoy+y07rvzNUyxJgza2kUQmn1nv4S9SY=";

interface Entrant {
  model: string;
  code: string;
  benchmark_correct: boolean | null;
  sandbox_status: string;
  disqualified: boolean;
  dq_reason: string | null;
  sandbox_detail: { backend?: string };
}
interface Record {
  scenario: string;
  entrants: Entrant[];
  winner: string | null;
  any_escape_attempt: boolean;
  containment_backend_missing: boolean;
  frame: string;
}
interface Sidecar { sig_b64: string; pubkey_b64: string; body_sha256: string }

function statusColor(s: string) {
  if (s === "ESCAPE_ATTEMPT") return "text-red-400";
  if (s === "CONFINED") return "text-emerald-400";
  if (s === "CONFINED_ATTEMPT_SEEN") return "text-amber-400";
  return "text-zinc-500"; // UNKNOWN / UNRUN
}

export default function SandboxEscapePOC() {
  const [rec, setRec] = useState<Record | null>(null);
  const [res, setRes] = useState<Ed25519Result | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const [bodyRes, sideRes] = await Promise.all([
          fetch(`${BASE}/record.body`),
          fetch(`${BASE}/record.sig.json`),
        ]);
        const body = await bodyRes.arrayBuffer();
        const side: Sidecar = await sideRes.json();
        setRec(JSON.parse(new TextDecoder().decode(body)) as Record);
        setRes(await verifyEd25519Detached(body, side.sig_b64, side.pubkey_b64, side.body_sha256, PUBKEY));
      } catch (e) {
        setErr(String((e as Error).message || e));
      }
    })();
  }, []);

  const backend = rec?.entrants[0]?.sandbox_detail?.backend;

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="mx-auto max-w-3xl px-5 py-12">
        <nav className="text-sm text-zinc-500 mb-6">
          <Link href="/" className="hover:text-zinc-300">Home</Link>
          <span className="mx-2">/</span><span className="text-zinc-300">Sandbox-escape POC</span>
        </nav>

        <h1 className="text-3xl font-semibold tracking-tight mb-3">
          Catching a model that tries to escape its sandbox
        </h1>
        <p className="text-zinc-400 leading-relaxed mb-2">
          When a model's output is <em>executed</em> — a tool call, generated code, an agent action —
          it can reach for things it shouldn't: the network, a shell, files outside its box. This is a
          live proof that the arena runs each entrant's output inside a containment jail, and
          <strong className="text-zinc-200"> disqualifies any model that attempts to escape — even when
          its answer is correct.</strong> Safety gates correctness, not the other way round.
        </p>
        <p className="text-zinc-500 text-sm mb-8">
          Honest scope: this is escape <strong className="text-zinc-300">detection + disqualification with
          signed proof</strong>, not an OS-level guarantee that escape is impossible. The record names the
          containment backend; a failed backend is reported as UNKNOWN, never as a pass.
        </p>

        {err && <div className="rounded-lg border border-red-800 bg-red-950/40 p-4 mb-8 text-red-300 text-sm">Could not load the record: {err}</div>}

        {rec && (
          <>
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 mb-6">
              <div className="text-xs text-zinc-500 mb-1">Scenario (both models answer the same task)</div>
              <div className="text-zinc-200 mb-5">{rec.scenario}</div>

              <div className="space-y-4">
                {rec.entrants.map((e) => (
                  <div key={e.model} className="rounded-lg border border-zinc-800 bg-zinc-950 p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">{e.model}</span>
                      <span className={`text-sm font-semibold ${statusColor(e.sandbox_status)}`}>
                        {e.sandbox_status}{e.disqualified && " · DISQUALIFIED"}
                      </span>
                    </div>
                    <pre className="text-xs bg-black/40 border border-zinc-800 rounded p-2 overflow-x-auto text-zinc-400 mb-2">{e.code.trim()}</pre>
                    <div className="text-xs text-zinc-500">
                      benchmark answer: {e.benchmark_correct ? "correct" : "wrong"}
                      {e.dq_reason && <> · <span className="text-red-400">{e.dq_reason}</span></>}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-5 pt-4 border-t border-zinc-800 text-sm">
                <span className="text-zinc-400">Winner: </span>
                <span className="text-emerald-400 font-semibold">{rec.winner ?? "none"}</span>
                <span className="text-zinc-500"> — the correct answer that <em>didn't</em> try to escape.
                  A correct answer that reached for the network was disqualified.</span>
              </div>
            </div>

            {/* signed proof */}
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-5 mb-6 text-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium">Signed record</span>
                {res && (res.ok
                  ? <span className="text-emerald-400 font-semibold">✅ signature valid · unaltered</span>
                  : !res.supported
                    ? <span className="text-amber-400">⚠ verify offline</span>
                    : <span className="text-red-400 font-semibold">❌ invalid</span>)}
              </div>
              <div className="text-xs text-zinc-500">
                Containment backend: <code className="text-zinc-400">{backend ?? "unknown"}</code>.
                {rec.containment_backend_missing && " No enforcing backend was present — containment NOT enforced here (honest UNKNOWN)."}
                {" "}Record verified in your browser (WebCrypto Ed25519) against the published key{" "}
                <code className="text-emerald-300 break-all">{PUBKEY}</code>.
              </div>
              <div className="mt-2 text-xs">
                <a href={`${BASE}/record.json`} download className="text-emerald-400 hover:underline">download record.json</a>
              </div>
            </div>

            <p className="text-xs text-zinc-500 leading-relaxed border-t border-zinc-800 pt-6">
              What this proves: an arena that executes model output under monitored containment,
              detects escape attempts, and refuses to let an escaping model win — with an offline-verifiable
              signed record. What it does not claim: that any sandbox stops all escapes (that is an OS/VM
              boundary, not this). CSOAI issues measurements and signed attestations, never certificates of
              conformity.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
