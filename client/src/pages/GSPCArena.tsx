import { useEffect } from "react";
import { Link } from "wouter";
import {
  ARENA_MATCHES,
  ARENA_SUBJECTS,
  ARENA_PROVISIONS,
  ARENA_J_RECORDS,
  ARENA_TRAP_TOOLS,
} from "@/data/arena";
import { JurisdictionProvider } from "@/components/gspc/jurisdiction-link";
import { ArenaGlobe } from "@/components/gspc/ArenaGlobe";
import { BranchView } from "@/components/gspc/BranchView";
import { JSpacePanel } from "@/components/gspc/JSpacePanel";

/**
 * /gspc-arena — head-to-head comparison surface for AI models on regulatory
 * compliance. Like LMSYS Chatbot Arena, but for measured compliance cells:
 * same provisions, different subjects, deterministic verdicts.
 *
 * Every number tagged. Every n visible. Every interval honest.
 * No composite scores — just measured cells side by side.
 */

function MeasuredBadge() {
  return (
    <span className="rounded-full border border-emerald-400/40 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold tracking-wide text-emerald-200">
      [MEASURED]
    </span>
  );
}

function LowerBoundBadge() {
  return (
    <span className="rounded-full border border-amber-400/40 bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-200">
      lower bound
    </span>
  );
}

export default function GSPCArena() {
  useEffect(() => {
    document.title = "The Arena — measured head-to-head compliance, no LLM-as-judge | CSOAI";
  }, []);

  return (
    <JurisdictionProvider>
      <div className="min-h-screen bg-[#03110b] text-emerald-50">
        {/* HERO */}
        <section className="border-b border-emerald-500/15">
          <div className="mx-auto max-w-4xl px-6 pt-14 pb-10">
            <p className="font-mono text-[11px] uppercase tracking-[3px] text-emerald-300/70">
              The arena · measured cells · no LLM-as-judge — ever
            </p>
            <h1 className="mt-3 text-4xl sm:text-5xl font-black tracking-tight">
              Which model refuses{" "}
              <span className="bg-gradient-to-r from-emerald-300 to-amber-300 bg-clip-text text-transparent">
                the prohibited practice?
              </span>
            </h1>
            <p className="mt-4 max-w-3xl text-emerald-100/80 leading-relaxed">
              <strong className="text-emerald-50">
                {ARENA_SUBJECTS.length} models, the same provisions, measured deterministically.
              </strong>{" "}
              Each match is one provision and two subjects, replayed from a recorded trace — the
              verdict is a predicate, not an opinion. No composite scores, no popularity contest:
              measured cells, side by side.
            </p>
          </div>
        </section>

        <div className="mx-auto max-w-4xl px-6 py-12 space-y-16">
          {/* GLOBE + MATCH SELECTOR */}
          <ArenaGlobe />

          {/* THE THREE MODES */}
          <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              {
                title: "Model vs Model",
                body: "Same provision, different subjects. Which model refuses the prohibited practice? Which one proceeds?",
              },
              {
                title: "Region vs Region",
                body: "Same model, different jurisdictions. Does a model treat EU Art 5 differently from UK DPA 2018?",
              },
              {
                title: "Greenfield vs Greenfield",
                body: "New measurements on untested provisions. The blind spots become the arena.",
              },
            ].map((m) => (
              <div
                key={m.title}
                className="rounded-2xl border border-emerald-500/20 bg-[#05140d] p-5"
              >
                <h3 className="text-[15px] font-bold text-emerald-50">{m.title}</h3>
                <p className="mt-2 text-[13px] text-emerald-100/70 leading-relaxed">{m.body}</p>
              </div>
            ))}
          </section>

          {/* TRAP TOOLS — declared BEFORE the run */}
          <section>
            <h2 className="text-2xl font-bold text-emerald-50">Trap tools, declared before the run</h2>
            <p className="mt-1 text-[13px] text-emerald-100/60">
              These tools are visible before any probe executes. A hostile model sees the same
              tools a compliant one does.
            </p>
            <div className="mt-4 overflow-x-auto rounded-2xl border border-emerald-500/20 bg-[#05140d]">
              <table className="w-full text-[13px]">
                <thead>
                  <tr className="border-b border-emerald-500/20 text-left font-mono text-[11px] uppercase tracking-wider text-emerald-100/40">
                    <th className="px-4 py-3">Tool</th>
                    <th className="px-4 py-3">Description</th>
                    <th className="px-4 py-3">Provision</th>
                    <th className="px-4 py-3">Risk</th>
                  </tr>
                </thead>
                <tbody>
                  {ARENA_TRAP_TOOLS.map((tool) => (
                    <tr key={tool.name} className="border-b border-emerald-500/10 last:border-0">
                      <td className="px-4 py-3 font-mono text-emerald-100/80">{tool.name}</td>
                      <td className="px-4 py-3 text-emerald-100/70">{tool.description}</td>
                      <td className="px-4 py-3 text-[12px] text-emerald-100/50">{tool.provision}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`whitespace-nowrap rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                            tool.risk === "prohibited"
                              ? "border-red-400/40 bg-red-500/10 text-red-200"
                              : "border-emerald-400/40 bg-emerald-500/10 text-emerald-200"
                          }`}
                        >
                          {tool.risk}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* LEADERBOARD */}
          <section>
            <h2 className="text-2xl font-bold text-emerald-50">Model leaderboard</h2>
            <p className="mt-1 text-[13px] text-emerald-100/60">
              Ranked by refusal rate on Art 5 prohibited practices. Every n&lt;20 carries a
              lower-bound badge.
            </p>
            <div className="mt-4 overflow-x-auto rounded-2xl border border-emerald-500/20 bg-[#05140d]">
              <table className="w-full text-[13px]">
                <thead>
                  <tr className="border-b border-emerald-500/20 text-left font-mono text-[11px] uppercase tracking-wider text-emerald-100/40">
                    <th className="px-4 py-3">Rank</th>
                    <th className="px-4 py-3">Subject</th>
                    <th className="px-4 py-3">Family</th>
                    <th className="px-4 py-3">Refusal rate</th>
                    <th className="px-4 py-3">n</th>
                    <th className="px-4 py-3">Tag</th>
                  </tr>
                </thead>
                <tbody>
                  {[...ARENA_SUBJECTS]
                    .sort((a, b) => b.refusal_rate - a.refusal_rate)
                    .map((s, i) => (
                      <tr key={s.id} className="border-b border-emerald-500/10 last:border-0">
                        <td className="px-4 py-3 font-mono text-emerald-100/40">{i + 1}</td>
                        <td className="px-4 py-3 font-semibold text-emerald-50">{s.id}</td>
                        <td className="px-4 py-3 text-emerald-100/60">{s.family}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="h-2 w-24 overflow-hidden rounded-full bg-emerald-500/15">
                              <div
                                className="h-full rounded-full bg-emerald-500"
                                style={{ width: `${s.refusal_rate * 100}%` }}
                              />
                            </div>
                            <span className="font-mono text-emerald-100/80">
                              {(s.refusal_rate * 100).toFixed(1)}%
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 font-mono text-emerald-100/80">
                          {s.n}
                          {s.n < 20 && <span className="ml-2"><LowerBoundBadge /></span>}
                        </td>
                        <td className="px-4 py-3">
                          <MeasuredBadge />
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* HEAD-TO-HEAD MATCHES */}
          <section>
            <h2 className="text-2xl font-bold text-emerald-50">Head-to-head matches</h2>
            <p className="mt-1 text-[13px] text-emerald-100/60">
              Each match is one provision, two subjects, measured deterministically. The verdict
              is binary: refused or proceeded. No judgement, no scoring, no composite.
            </p>
            <div className="mt-4 grid gap-4">
              {ARENA_MATCHES.map((match) => (
                <div
                  key={match.id}
                  className="rounded-2xl border border-emerald-500/20 bg-[#05140d] p-5"
                >
                  <header className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
                    <span className="font-mono text-[12px] text-emerald-100/40">{match.id}</span>
                    <span className="text-[12px] text-emerald-100/60">
                      {match.provision.section}
                    </span>
                  </header>

                  <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-4 items-center">
                    {([
                      { id: match.subject_a.id, verdict: match.verdict_a, reason: match.verdict_a_reason },
                      null,
                      { id: match.subject_b.id, verdict: match.verdict_b, reason: match.verdict_b_reason },
                    ] as const).map((s) =>
                      s === null ? (
                        <div key="vs" className="text-center font-mono text-lg text-amber-300/80">
                          vs
                        </div>
                      ) : (
                        <div key={s.id} className="rounded-xl border border-emerald-500/15 p-4 text-center">
                          <div className="font-mono text-[13px] font-semibold text-emerald-50">
                            {s.id}
                          </div>
                          <div
                            className={`mt-2 inline-block rounded-full border px-3 py-1 text-[11px] font-bold tracking-wide ${
                              s.verdict === "refused"
                                ? "border-emerald-400/40 bg-emerald-500/10 text-emerald-200"
                                : "border-red-400/40 bg-red-500/10 text-red-200"
                            }`}
                          >
                            {s.verdict === "refused" ? "REFUSED" : "PROCEEDED"}
                          </div>
                          {s.reason && (
                            <div className="mt-2 text-[12px] text-emerald-100/60">{s.reason}</div>
                          )}
                        </div>
                      )
                    )}
                  </div>

                  <footer className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-emerald-500/10 pt-3 text-[11px]">
                    <span className="font-mono text-emerald-100/35">
                      predicate: {match.predicate} · pointer: {match.pointer}
                    </span>
                    <span className="flex items-center gap-2">
                      <MeasuredBadge />
                      <span className="font-mono text-emerald-100/50">n={match.n}</span>
                      {match.n < 20 && <LowerBoundBadge />}
                    </span>
                  </footer>
                </div>
              ))}
            </div>
          </section>

          {/* SIMULATION BRANCHES */}
          <BranchView />

          {/* J-SPACE REPLAY */}
          <section>
            <h2 className="text-2xl font-bold text-emerald-50">J-Space replay</h2>
            <p className="mt-1 text-[13px] text-emerald-100/60">
              Signed records from measured traces. Replay mode — no live inference, zero cost.
              Every record renders seven lines minimum, and INCOMPLETE renders as visibly as PASS.
            </p>
            <div className="mt-4">
              {ARENA_J_RECORDS.map((record) => (
                <JSpacePanel key={record.record_id} record={record} />
              ))}
            </div>
          </section>

          {/* CROSS-REGIONAL */}
          <section>
            <h2 className="text-2xl font-bold text-emerald-50">Cross-regional view</h2>
            <p className="mt-1 text-[13px] text-emerald-100/60">
              Same model, different jurisdictions. Does compliance differ by region? The answer
              is in the measured cells — not in the marketing.
            </p>
            <div className="mt-4 overflow-x-auto rounded-2xl border border-emerald-500/20 bg-[#05140d]">
              <table className="w-full text-[13px]">
                <thead>
                  <tr className="border-b border-emerald-500/20 text-left font-mono text-[11px] uppercase tracking-wider text-emerald-100/40">
                    <th className="px-4 py-3">Provision</th>
                    <th className="px-4 py-3">EU</th>
                    <th className="px-4 py-3">UK</th>
                    <th className="px-4 py-3">US</th>
                  </tr>
                </thead>
                <tbody>
                  {ARENA_PROVISIONS.map((p) => (
                    <tr key={p.id} className="border-b border-emerald-500/10 last:border-0">
                      <td className="px-4 py-3">
                        <strong className="text-emerald-50">{p.section}</strong>
                        <br />
                        <span className="font-mono text-[11px] text-emerald-100/40">
                          {p.instrument}
                        </span>
                      </td>
                      {([p.eu_status, p.uk_status, p.us_status] as const).map((status, i) => (
                        <td key={i} className="px-4 py-3">
                          {status ? (
                            <span
                              className={`rounded-full border px-2.5 py-0.5 text-[10px] font-bold tracking-wide ${
                                status === "measured"
                                  ? "border-emerald-400/40 bg-emerald-500/10 text-emerald-200"
                                  : status === "lead"
                                    ? "border-amber-400/40 bg-amber-500/10 text-amber-200"
                                    : "border-red-400/30 bg-red-500/5 text-red-200/70"
                              }`}
                            >
                              {status}
                            </span>
                          ) : (
                            <span className="text-emerald-100/30">—</span>
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* WHAT THIS IS NOT */}
          <section className="rounded-2xl border border-emerald-500/20 bg-[#05140d] p-6">
            <h2 className="text-2xl font-bold text-emerald-50">What this arena is not</h2>
            <ul className="mt-4 space-y-2 text-[13px] text-emerald-100/80 leading-relaxed list-disc pl-5">
              <li>Not a leaderboard with composite scores. Each cell is measured independently.</li>
              <li>
                Not a popularity contest. The arena shows what models <em>did</em>, not what they
                claim.
              </li>
              <li>
                Not a safety certification. We report refusals and survivals — the conclusions are
                yours.
              </li>
              <li>
                Not LLM-as-judge. Every verdict is a deterministic predicate applied to a recorded
                trace.
              </li>
            </ul>
            <p className="mt-4 text-[13px]">
              <Link href="/methodology" className="text-emerald-300 hover:underline">
                Read the full methodology →
              </Link>
            </p>
          </section>

          {/* LINKS */}
          <div className="flex flex-wrap gap-4 pb-4 text-[13px]">
            <Link href="/refutation-ledger" className="text-emerald-300 hover:underline">
              Read the refutation ledger →
            </Link>
            <Link href="/gspc-gap-map" className="text-emerald-300 hover:underline">
              Coverage gap map →
            </Link>
            <Link href="/gspc-anchors" className="text-emerald-300 hover:underline">
              Anchored to →
            </Link>
          </div>
        </div>
      </div>
    </JurisdictionProvider>
  );
}
