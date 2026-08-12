// SOV CITY — the arena run, surfaced as evidence rather than as a story.
//
// Reads the signed artefacts of a real run: /city/board.json (the counts), and
// /city/chain.jsonl (one Ed25519-signed ChainResult per epoch, sha256-chained).
//
// The rule this panel exists to honour: a low breach count means nothing unless the
// gate was proven able to fire on that run's own code path. So the positive control
// is rendered FIRST and, when it fails, the panel refuses to show the numbers at all.

import { useEffect, useState } from "react";

interface Board {
  valid?: boolean;
  design?: { kind: "natural" | "stratified"; note: string };
  unmeasured_split?: { no_response: number; unparseable: number };
  decoding?: { grammar: string; note: string };
  validity_note?: string | null;
  positive_control?: { gate_exercised: boolean; checks: { expect: string; verdict: string; ok: boolean }[] };
  epochs: number;
  turns: number;
  usable_n: number;
  unmeasured: number;
  counts: Record<string, number>;
  breaches_by_article: Record<string, number>;
  zero_block_reading?: string | null;
  blue: Faction;
  red: Faction;
  chain: { records: number; hash_ok: number; hash_broken: number; signature_ok: number; signature_broken: number; unsigned: number; chain_intact: boolean };
  law: Record<string, string>;
  wall_seconds?: number;
}
interface Faction {
  citizens: number; turns: number; usable_n: number; unmeasured: number;
  allowed: number; blocked: number;
  block_rate: number | null; block_rate_ci95: number[] | null; interval_note: string | null;
}

const pct = (x: number) => `${(x * 100).toFixed(1)}%`;

function Stat({ label, value, tone = "" }: { label: string; value: React.ReactNode; tone?: string }) {
  return (
    <div className="rounded-lg border border-white/5 bg-white/[0.02] px-3 py-2">
      <div className="text-[10px] uppercase tracking-[0.16em] text-slate-500">{label}</div>
      <div className={`mt-0.5 text-sm font-semibold tabular-nums ${tone || "text-slate-100"}`}>{value}</div>
    </div>
  );
}

function FactionCard({ name, f, tone }: { name: string; f: Faction; tone: string }) {
  return (
    <div className="rounded-lg border border-white/5 bg-white/[0.02] p-3">
      <div className={`text-xs font-semibold tracking-wider ${tone}`}>{name}</div>
      <div className="mt-1 text-[11px] text-slate-400">
        {f.citizens} citizens · {f.turns} turns · {f.usable_n} usable
      </div>
      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[11px] tabular-nums text-slate-300">
        <span>allowed <b className="text-slate-100">{f.allowed}</b></span>
        <span>blocked <b className="text-slate-100">{f.blocked}</b></span>
        <span className="text-slate-500">unmeasured <b>{f.unmeasured}</b></span>
      </div>
      <div className="mt-2 text-[11px] text-slate-400">
        {f.block_rate_ci95 ? (
          <>breach rate <b className="text-slate-100">{pct(f.block_rate ?? 0)}</b>{" "}
            <span className="text-slate-500">95% [{pct(f.block_rate_ci95[0])}, {pct(f.block_rate_ci95[1])}]</span></>
        ) : (
          <span className="text-slate-500">{f.interval_note}</span>
        )}
      </div>
    </div>
  );
}

export default function CityPanel() {
  const [board, setBoard] = useState<Board | null>(null);
  const [epochs, setEpochs] = useState<any[]>([]);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let dead = false;
    Promise.all([
      fetch("/city/board.json").then((r) => (r.ok ? r.json() : Promise.reject(new Error(`board HTTP ${r.status}`)))),
      fetch("/city/chain.jsonl").then((r) => (r.ok ? r.text() : "")),
    ])
      .then(([b, chainText]) => {
        if (dead) return;
        setBoard(b);
        setEpochs(chainText.split("\n").filter(Boolean).map((l) => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean));
      })
      .catch((e) => !dead && setErr(String(e.message ?? e)));
    return () => { dead = true; };
  }, []);

  if (err) return <Wrap><p className="text-sm text-amber-400/80">No city run published — {err}. Nothing is shown rather than a fabricated run.</p></Wrap>;
  if (!board) return <Wrap><p className="text-sm text-slate-500">loading the signed run…</p></Wrap>;

  const control = board.positive_control;
  const gateProven = control?.gate_exercised ?? false;

  return (
    <Wrap>
      {/* The control comes first. Without it the rest is not evidence. */}
      <div className={`rounded-lg border p-3 ${gateProven ? "border-emerald-400/25 bg-emerald-400/[0.06]" : "border-red-400/40 bg-red-400/10"}`}>
        <div className="flex items-center gap-2">
          <span className={`h-1.5 w-1.5 rounded-full ${gateProven ? "bg-emerald-400" : "bg-red-400"}`} />
          <span className={`text-xs font-semibold tracking-wide ${gateProven ? "text-emerald-300" : "text-red-300"}`}>
            POSITIVE CONTROL {gateProven ? "PASSED" : "FAILED"}
          </span>
        </div>
        <p className="mt-1 text-[11px] leading-relaxed text-slate-400">
          {gateProven
            ? "Known-breaching actions were pushed through the live gate on this run's own code path and every one was blocked with the correct citation. A low breach count below is therefore a property of the citizens — not a gate that cannot fire."
            : "The gate did not block known-breaching canaries. No statement about governance can be made from this run."}
        </p>
        {control && (
          <div className="mt-2 flex flex-wrap gap-1">
            {control.checks.map((c) => (
              <span key={c.expect} className={`rounded border px-1.5 py-0.5 text-[10px] font-medium ${c.ok ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-300" : "border-red-400/40 bg-red-400/10 text-red-300"}`}>
                {c.expect} {c.ok ? "✓" : "✕"}
              </span>
            ))}
          </div>
        )}
      </div>

      {!gateProven ? null : (
        <>
          {board.design && (
            <div className={`mt-3 rounded-lg border p-3 ${board.design.kind === "stratified"
              ? "border-violet-400/30 bg-violet-400/[0.07]" : "border-white/10 bg-white/[0.02]"}`}>
              <div className="text-xs font-semibold tracking-wide text-violet-300">
                DESIGN · {board.design.kind.toUpperCase()}
              </div>
              <p className="mt-1 text-[11px] leading-relaxed text-slate-400">{board.design.note}</p>
            </div>
          )}

          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
            <Stat label="epochs" value={board.epochs} />
            <Stat label="turns" value={board.turns} />
            <Stat label="usable n" value={board.usable_n} />
            <Stat label="unmeasured" value={board.unmeasured} tone="text-amber-300" />
          </div>
          {board.unmeasured_split ? (
            <p className="mt-1.5 text-[11px] leading-relaxed text-slate-500">
              Of {board.unmeasured} unmeasured turns, <b className="text-slate-300">{board.unmeasured_split.no_response} were ours</b> —
              we never obtained an answer (timeout, model load, dead socket) — and are never scored against a citizen.
              <b className="text-slate-300"> {board.unmeasured_split.unparseable} were theirs</b>: the model answered but
              could not state a lawful action in the city's schema. Those count, and are never dropped.
            </p>
          ) : (
            <p className="mt-1.5 text-[11px] leading-relaxed text-slate-500">
              {board.unmeasured} of {board.turns} turns produced no usable action. They count against their citizen and are never dropped.
            </p>
          )}
          {board.decoding && (
            <p className="mt-1.5 text-[11px] leading-relaxed text-slate-600">
              Decoding: {board.decoding.grammar}. {board.decoding.note}
            </p>
          )}

          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            <FactionCard name="BLUE · constitutionalists" f={board.blue} tone="text-sky-300" />
            <FactionCard name="RED · abolitionists" f={board.red} tone="text-rose-300" />
          </div>

          <div className="mt-3">
            <div className="text-[11px] uppercase tracking-[0.16em] text-slate-500">breaches by article</div>
            {Object.keys(board.breaches_by_article).length === 0 ? (
              <p className="mt-1 text-[12px] leading-relaxed text-slate-400">
                {board.zero_block_reading ?? "No Article 5 breach was proposed by any citizen this run."}
              </p>
            ) : (
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {Object.entries(board.breaches_by_article).map(([art, n]) => (
                  <span key={art} className="rounded border border-rose-400/30 bg-rose-400/10 px-2 py-1 text-[11px] font-medium text-rose-200">
                    {art} · {n}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="mt-3 rounded-lg border border-white/5 bg-white/[0.02] p-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] uppercase tracking-[0.16em] text-slate-500">signed chain</span>
              <span className={`text-[11px] font-semibold ${board.chain.chain_intact ? "text-emerald-300" : "text-red-300"}`}>
                {board.chain.chain_intact ? "INTACT" : "BROKEN"}
              </span>
            </div>
            <div className="mt-1 text-[11px] text-slate-400">
              {board.chain.records} records · {board.chain.hash_ok} hashes recomputed · {board.chain.signature_ok} Ed25519 signatures verified
              {board.chain.unsigned > 0 && <span className="text-amber-300"> · {board.chain.unsigned} unsigned</span>}
            </div>
            <div className="mt-2 space-y-1">
              {epochs.map((e) => (
                <div key={e.id} className="flex items-center gap-2 font-mono text-[10px] text-slate-500">
                  <span className="text-slate-400">epoch {e.epoch}</span>
                  <span className="truncate">{e.id.slice(0, 24)}…</span>
                  <span className={e.status === "SIGNED" ? "text-emerald-400" : "text-amber-400"}>{e.status}</span>
                </div>
              ))}
            </div>
          </div>

          <p className="mt-3 border-t border-white/5 pt-3 text-[11px] leading-relaxed text-slate-500">
            Law: {board.law?.article_zero} + {board.law?.eu_ai_act}. Grader: {board.law?.grader}. Because the gate is a pure
            function of structure, its verdicts are gold labels — which is what makes a city run a legitimate source of
            benchmark items rather than synthetic noise.
          </p>
        </>
      )}
    </Wrap>
  );
}

function Wrap({ children }: { children: React.ReactNode }) {
  return (
    <div className="h-full w-full overflow-auto bg-[#080c14] text-slate-200">
      <div className="sticky top-0 z-10 border-b border-white/5 bg-[#080c14]/95 px-4 py-2 text-[11px] uppercase tracking-[0.18em] text-slate-500 backdrop-blur">
        SOV City — governed multi-agent arena
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}
