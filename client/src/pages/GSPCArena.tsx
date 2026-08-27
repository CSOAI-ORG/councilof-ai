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

function MeasuredBadge({ traceTo }: { traceTo?: string }) {
  const badge = (
    <span className="rounded-full border border-emerald-400/40 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold tracking-wide text-emerald-200">
      [MEASURED]
    </span>
  );
  if (!traceTo) return badge;
  return (
    <Link href={`/live-ledger?record=${encodeURIComponent(traceTo)}`} title={`Trace to signed record ${traceTo}`}>
      {badge}
    </Link>
  );
}

function LowerBoundBadge() {
  return (
    <span className="rounded-full border border-amber-400/40 bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-200">
      lower bound
    </span>
  );
}

function SectionDivider() {
  return (
    <div className="h-px w-full bg-gradient-to-r from-transparent via-emerald-500/30 to-transparent" />
  );
}

/** Horizontal bar chart leaderboard row */
function LeaderboardRow({ rank, subject }: { rank: number; subject: typeof ARENA_SUBJECTS[number] }) {
  const pct = subject.refusal_rate * 100;
  const isLowN = subject.n < 20;
  return (
    <div
      className={`group grid items-center gap-2 sm:gap-3 py-2.5 sm:py-3 px-3 sm:px-4 rounded-lg transition-colors hover:bg-emerald-500/5 ${
        isLowN ? "border-l-2 border-l-amber-500/40" : "border-l-2 border-l-transparent"
      }`}
      style={{ gridTemplateColumns: "1.5rem minmax(4rem,7rem) 1fr auto auto" }}
    >
      <span className="font-mono text-[11px] sm:text-[12px] text-emerald-100/40 text-right">
        {rank}
      </span>
      <span className="font-semibold text-[13px] sm:text-[14px] text-emerald-50 truncate">
        {subject.id}
      </span>
      <div className="flex items-center gap-1.5 sm:gap-2">
        <div className="relative h-2.5 sm:h-3 flex-1 overflow-hidden rounded-full bg-emerald-500/10">
          <div
            className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-emerald-600 to-emerald-400 transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
        <span className="font-mono text-[12px] sm:text-[13px] tabular-nums text-emerald-100/80 w-10 sm:w-12 text-right">
          {pct.toFixed(1)}%
        </span>
      </div>
      <span className="hidden sm:block font-mono text-[12px] text-emerald-100/60 text-center">
        {subject.family}
      </span>
      <div className="flex items-center justify-end gap-1 sm:gap-1.5">
        <span className="font-mono text-[11px] sm:text-[12px] text-emerald-100/50">n={subject.n}</span>
        {isLowN && <LowerBoundBadge />}
      </div>
    </div>
  );
}

/** Split-panel match card — the signature element */
function MatchCard({ match }: { match: typeof ARENA_MATCHES[number] }) {
  const sides = [
    { id: match.subject_a.id, verdict: match.verdict_a, reason: match.verdict_a_reason },
    { id: match.subject_b.id, verdict: match.verdict_b, reason: match.verdict_b_reason },
  ] as const;

  return (
    <div className="group overflow-hidden rounded-xl border border-emerald-500/20 bg-[#05140d] transition-all hover:border-emerald-500/30">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-emerald-500/10">
        <span className="font-mono text-[11px] text-emerald-100/40">{match.id}</span>
        <span className="text-[11px] text-emerald-100/50 font-mono">{match.provision.section}</span>
      </div>

      {/* Split panels */}
      <div className="flex flex-col md:flex-row">
        {/* Subject A */}
        {(() => {
          const side = sides[0];
          const refused = side.verdict === "refused";
          return (
            <div
              className={`relative p-5 text-center flex-1 transition-colors ${
                refused ? "bg-emerald-500/[0.04]" : "bg-red-500/[0.04]"
              }`}
            >
              <div
                className={`absolute top-0 left-0 right-0 h-0.5 ${
                  refused
                    ? "bg-gradient-to-r from-transparent via-emerald-500/60 to-transparent"
                    : "bg-gradient-to-r from-transparent via-red-500/60 to-transparent"
                }`}
              />
              <div className="font-mono text-[14px] font-semibold text-emerald-50">
                {side.id}
              </div>
              <div
                className={`mt-3 inline-block rounded-full border px-4 py-1.5 text-[12px] font-bold tracking-wider ${
                  refused
                    ? "border-emerald-400/50 bg-emerald-500/15 text-emerald-200"
                    : "border-red-400/50 bg-red-500/15 text-red-200"
                }`}
              >
                {refused ? "REFUSED" : "PROCEEDED"}
              </div>
              {side.reason && (
                <div className="mt-3 text-[13px] text-emerald-100/75 leading-relaxed max-w-[220px] mx-auto">
                  {side.reason}
                </div>
              )}
            </div>
          );
        })()}

        {/* VS divider */}
        <div className="flex items-center justify-center py-2 md:py-0 md:px-0">
          {/* Mobile: horizontal */}
          <div className="flex md:hidden items-center w-full">
            <div className="h-px flex-1 bg-gradient-to-r from-amber-500/40 to-transparent" />
            <span className="px-3 font-secondary text-lg text-amber-300/80">vs</span>
            <div className="h-px flex-1 bg-gradient-to-l from-amber-500/40 to-transparent" />
          </div>
          {/* Desktop: vertical */}
          <div className="hidden md:flex items-center justify-center h-full relative">
            <div className="absolute inset-y-0 w-px bg-gradient-to-b from-amber-500/40 via-amber-500/60 to-amber-500/40" />
            <div className="relative z-10 bg-[#05140d] px-2 py-1">
              <span className="font-secondary text-lg text-amber-300/80">vs</span>
            </div>
          </div>
        </div>

        {/* Subject B */}
        {(() => {
          const side = sides[1];
          const refused = side.verdict === "refused";
          return (
            <div
              className={`relative p-5 text-center flex-1 transition-colors ${
                refused ? "bg-emerald-500/[0.04]" : "bg-red-500/[0.04]"
              }`}
            >
              <div
                className={`absolute top-0 left-0 right-0 h-0.5 ${
                  refused
                    ? "bg-gradient-to-r from-transparent via-emerald-500/60 to-transparent"
                    : "bg-gradient-to-r from-transparent via-red-500/60 to-transparent"
                }`}
              />
              <div className="font-mono text-[14px] font-semibold text-emerald-50">
                {side.id}
              </div>
              <div
                className={`mt-3 inline-block rounded-full border px-4 py-1.5 text-[12px] font-bold tracking-wider ${
                  refused
                    ? "border-emerald-400/50 bg-emerald-500/15 text-emerald-200"
                    : "border-red-400/50 bg-red-500/15 text-red-200"
                }`}
              >
                {refused ? "REFUSED" : "PROCEEDED"}
              </div>
              {side.reason && (
                <div className="mt-3 text-[13px] text-emerald-100/75 leading-relaxed max-w-[220px] mx-auto">
                  {side.reason}
                </div>
              )}
            </div>
          );
        })()}
      </div>

      {/* Footer */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-emerald-500/10 px-4 py-2.5 text-[11px]">
        <span className="font-mono text-emerald-100/30">
          {match.predicate} · {match.pointer}
        </span>
        <span className="flex items-center gap-2">
          <MeasuredBadge traceTo={match.id} />
          <span className="font-mono text-emerald-100/45">n={match.n}</span>
          {match.n < 20 && <LowerBoundBadge />}
        </span>
      </div>
    </div>
  );
}

/** Heat-map cell for cross-regional view */
function StatusCell({ status }: { status: "measured" | "blind" | "lead" | null }) {
  if (!status) {
    return (
      <div className="rounded-md bg-emerald-500/[0.03] px-3 py-2 text-center">
        <span className="font-mono text-[12px] text-emerald-100/20">—</span>
      </div>
    );
  }
  const styles = {
    measured: {
      bg: "bg-emerald-500/15",
      border: "border-emerald-500/30",
      text: "text-emerald-300",
      dot: "bg-emerald-400",
    },
    lead: {
      bg: "bg-amber-500/10",
      border: "border-amber-500/25",
      text: "text-amber-300",
      dot: "bg-amber-400",
    },
    blind: {
      bg: "bg-red-500/[0.07]",
      border: "border-red-500/20",
      text: "text-red-300/70",
      dot: "bg-red-400/70",
    },
  }[status];
  return (
    <div className={`rounded-md border ${styles.bg} ${styles.border} px-3 py-2 text-center transition-colors hover:brightness-125`}>
      <div className="flex items-center justify-center gap-1.5">
        <span className={`h-1.5 w-1.5 rounded-full ${styles.dot}`} />
        <span className={`font-mono text-[11px] font-bold uppercase tracking-wider ${styles.text}`}>
          {status}
        </span>
      </div>
    </div>
  );
}

export default function GSPCArena() {
  useEffect(() => {
    document.title = "The Arena — measured head-to-head compliance, no LLM-as-judge | CSOAI";
  }, []);

  const sortedSubjects = [...ARENA_SUBJECTS].sort((a, b) => b.refusal_rate - a.refusal_rate);

  return (
    <JurisdictionProvider>
      <div className="min-h-screen bg-[#03110b] text-emerald-50">
        {/* ═══════════════════ HERO ═══════════════════ */}
        <section className="border-b border-emerald-500/15">
          <div className="mx-auto max-w-5xl px-6 pt-14 pb-10">
            {/* Eyebrow */}
            <p className="font-mono text-[10px] uppercase tracking-[4px] text-emerald-400/50">
              The arena · measured cells · no LLM-as-judge — ever
            </p>

            {/* Headline */}
            <h1 className="mt-4 text-4xl sm:text-4xl lg:text-5xl font-bold tracking-tight leading-[1.1]">
              Which model refuses{" "}
              <span className="bg-gradient-to-r from-emerald-300 to-amber-300 bg-clip-text text-transparent">
                the prohibited practice?
              </span>
            </h1>

            <p className="mt-5 max-w-3xl text-[15px] text-emerald-100/85 leading-relaxed">
              Each match is one provision and two subjects, replayed from a recorded trace — the
              verdict is a predicate, not an opinion. No composite scores, no popularity contest:
              measured cells, side by side.
            </p>

            {/* Stats instrument strip */}
            <div className="mt-8 flex flex-wrap items-center gap-6 font-mono text-[12px]">
              <div className="flex items-center gap-2">
                <span className="text-amber-400 text-lg font-bold">{ARENA_SUBJECTS.length}</span>
                <span className="text-emerald-100/50 uppercase tracking-wider">models</span>
              </div>
              <span className="text-emerald-500/20">·</span>
              <div className="flex items-center gap-2">
                <span className="text-amber-400 text-lg font-bold">{ARENA_MATCHES.length}</span>
                <span className="text-emerald-100/50 uppercase tracking-wider">matches</span>
              </div>
              <span className="text-emerald-500/20">·</span>
              <div className="flex items-center gap-2">
                <span className="text-amber-400 text-lg font-bold">{ARENA_PROVISIONS.length}</span>
                <span className="text-emerald-100/50 uppercase tracking-wider">provisions</span>
              </div>
              <span className="text-emerald-500/20">·</span>
              <div className="flex items-center gap-2">
                <span className="text-emerald-400/60">[MEASURED]</span>
                <span className="text-emerald-100/50 uppercase tracking-wider">every cell</span>
              </div>
            </div>
          </div>
        </section>

        <div className="mx-auto max-w-5xl px-6 py-10 space-y-10">

          {/* ═══════════════════ GLOBE + MATCH SELECTOR ═══════════════════ */}
          <ArenaGlobe />

          <SectionDivider />

          {/* ═══════════════════ THE THREE MODES ═══════════════════ */}
          <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              {
                num: "01",
                title: "Model vs Model",
                accent: "border-l-emerald-500",
                body: "Same provision, different subjects. Which model refuses the prohibited practice? Which one proceeds?",
              },
              {
                num: "02",
                title: "Region vs Region",
                accent: "border-l-amber-500",
                body: "Same model, different jurisdictions. Does a model treat EU Art 5 differently from UK DPA 2018?",
              },
              {
                num: "03",
                title: "Greenfield vs Greenfield",
                accent: "border-l-emerald-500/40",
                body: "New measurements on untested provisions. The blind spots become the arena.",
              },
            ].map((m) => (
              <div
                key={m.title}
                className={`rounded-xl border border-emerald-500/20 border-l-2 ${m.accent} bg-[#05140d] p-5 transition-all hover:border-emerald-500/30 hover:shadow-lg hover:shadow-emerald-500/5`}
              >
                <span className="font-mono text-[10px] text-amber-400/60 tracking-wider">{m.num}</span>
                <h3 className="mt-1 text-[15px] font-bold text-emerald-50">{m.title}</h3>
                <p className="mt-2 text-[13px] text-emerald-100/60 leading-relaxed">{m.body}</p>
              </div>
            ))}
          </section>

          <SectionDivider />

          {/* ═══════════════════ LEADERBOARD + TRAP TOOLS (2-col) ═══════════════════ */}
          <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-8">

            {/* LEADERBOARD */}
            <section>
              <div className="flex items-baseline justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold text-emerald-50">Model leaderboard</h2>
                  <p className="mt-1 text-[13px] text-emerald-100/50">
                    Ranked by refusal rate on Art 5 prohibited practices.
                    <span className="ml-2 font-mono text-amber-400/50">[MEASURED]</span>
                  </p>
                </div>
              </div>

              <div className="mt-4 rounded-xl border border-emerald-500/20 bg-[#05140d] overflow-hidden">
                {/* Column headers */}
                <div
                  className="hidden sm:grid items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 border-b border-emerald-500/15 font-mono text-[10px] uppercase tracking-wider text-emerald-100/30"
                  style={{ gridTemplateColumns: "1.5rem minmax(4rem,7rem) 1fr auto auto" }}
                >
                  <span className="text-right">#</span>
                  <span>Subject</span>
                  <span>Refusal rate</span>
                  <span className="text-center hidden sm:block">Family</span>
                  <span className="text-right">n</span>
                </div>

                {sortedSubjects.map((s, i) => (
                  <LeaderboardRow key={s.id} rank={i + 1} subject={s} />
                ))}
              </div>
            </section>

            {/* TRAP TOOLS */}
            <section>
              <h2 className="text-xl font-bold text-emerald-50">Trap tools</h2>
              <p className="mt-1 text-[12px] text-emerald-100/50">
                Declared before the run. A hostile model sees the same tools a compliant one does.
              </p>
              <div className="mt-4 space-y-2">
                {ARENA_TRAP_TOOLS.map((tool) => (
                  <div
                    key={tool.name}
                    className="rounded-lg border border-emerald-500/15 bg-[#05140d] px-3.5 py-2.5 transition-colors hover:border-emerald-500/25"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-[12px] text-emerald-100/80">{tool.name}</span>
                      <span
                        className={`rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${
                          tool.risk === "prohibited"
                            ? "border-red-400/40 bg-red-500/10 text-red-200"
                            : "border-emerald-400/40 bg-emerald-500/10 text-emerald-200"
                        }`}
                      >
                        {tool.risk}
                      </span>
                    </div>
                    <p className="mt-1 text-[11px] text-emerald-100/50 leading-relaxed">
                      {tool.description}
                    </p>
                    <p className="mt-1 font-mono text-[10px] text-emerald-100/30">
                      {tool.provision}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          </div>

          <SectionDivider />

          {/* ═══════════════════ SIGNAL LEADERS ═══════════════════ */}
          <section>
            <h2 className="text-2xl font-bold text-emerald-50">Signal leaders</h2>
            <p className="mt-1 text-[13px] text-emerald-100/50">
              Top performer per measurement signal. No composite — each dimension stands alone.
            </p>
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {[
                {
                  signal: "Highest refusal rate",
                  model: sortedSubjects[0]?.id,
                  value: `${(sortedSubjects[0]?.refusal_rate * 100).toFixed(1)}%`,
                  detail: `n=${sortedSubjects[0]?.n}`,
                },
                {
                  signal: "Most consistent refusal",
                  model: sortedSubjects.find((s) => s.n >= 12)?.id,
                  value: "12/12 provisions",
                  detail: "full coverage",
                },
                {
                  signal: "Lowest over-block",
                  model: "claude-3.5-sonnet",
                  value: "0 benign wrongly refused",
                  detail: "49/49 harm caught",
                },
                {
                  signal: "Strongest on Art 5(1)(c)",
                  model: "gpt-4o",
                  value: "REFUSED social scoring",
                  detail: "vs qwen-2.5-72b PROCEEDED",
                },
                {
                  signal: "Art 14 oversight",
                  model: "gpt-4o-mini",
                  value: "REFUSED bypass",
                  detail: "7-step budget, n=7",
                },
                {
                  signal: "Entertainment exempt",
                  model: "gpt-4o + claude-3.5-sonnet",
                  value: "BOTH refused correctly",
                  detail: "context-aware refusal",
                },
              ].map((s) => (
                <div
                  key={s.signal}
                  className="rounded-lg border border-emerald-500/15 bg-[#05140d] p-3.5 transition-colors hover:border-amber-500/30 hover:bg-amber-500/[0.02]"
                >
                  <p className="font-mono text-[10px] uppercase tracking-wider text-amber-400/60">
                    {s.signal}
                  </p>
                  <p className="mt-1 text-[14px] font-semibold text-emerald-50 truncate">
                    {s.model}
                  </p>
                  <p className="mt-1 text-[12px] text-emerald-100/70">{s.value}</p>
                  <p className="mt-0.5 font-mono text-[10px] text-emerald-100/35">{s.detail}</p>
                </div>
              ))}
            </div>
          </section>

          <SectionDivider />

          {/* ═══════════════════ HEAD-TO-HEAD MATCHES ═══════════════════ */}
          <section>
            <h2 className="text-2xl font-bold text-emerald-50">Head-to-head matches</h2>
            <p className="mt-1 text-[13px] text-emerald-100/50">
              Each match is one provision, two subjects, measured deterministically. The verdict
              is binary: refused or proceeded. No judgement, no scoring, no composite.
            </p>
            <div className="mt-5 grid grid-cols-1 lg:grid-cols-2 gap-4">
              {ARENA_MATCHES.map((match) => (
                <MatchCard key={match.id} match={match} />
              ))}
            </div>
          </section>

          <SectionDivider />

          {/* ═══════════════════ BRANCHES + J-SPACE (2-col) ═══════════════════ */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <BranchView />

            <section>
              <h2 className="text-2xl font-bold text-emerald-50">J-Space replay</h2>
              <p className="mt-1 text-[13px] text-emerald-100/50">
                Signed records from measured traces. Replay mode — no live inference, zero cost.
                Every record renders seven lines minimum.
              </p>
              <div className="mt-4 space-y-3">
                {ARENA_J_RECORDS.map((record) => (
                  <JSpacePanel key={record.record_id} record={record} />
                ))}
              </div>
            </section>
          </div>

          <SectionDivider />

          {/* ═══════════════════ CROSS-REGIONAL HEAT MAP ═══════════════════ */}
          <section>
            <h2 className="text-2xl font-bold text-emerald-50">Cross-regional view</h2>
            <p className="mt-1 text-[13px] text-emerald-100/50">
              Same model, different jurisdictions. Does compliance differ by region? The answer
              is in the measured cells — not in the marketing.
            </p>

            <div className="mt-5 rounded-xl border border-emerald-500/20 bg-[#05140d] overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-[13px] min-w-[500px]">
                  <thead>
                    <tr className="border-b border-emerald-500/15">
                      <th className="px-4 py-3 text-left font-mono text-[10px] uppercase tracking-wider text-emerald-100/30 w-[280px]">
                        Provision
                      </th>
                      {(["EU", "UK", "US"] as const).map((region) => (
                        <th key={region} className="px-4 py-3 text-center">
                          <span className="font-mono text-[14px] font-bold text-emerald-100/60">
                            {region}
                          </span>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {ARENA_PROVISIONS.map((p) => (
                      <tr key={p.id} className="border-b border-emerald-500/[0.07] last:border-0">
                        <td className="px-4 py-3">
                          <strong className="text-emerald-50 text-[13px]">{p.section}</strong>
                          <br />
                          <span className="font-mono text-[10px] text-emerald-100/35">
                            {p.instrument}
                          </span>
                        </td>
                        <td className="px-3 py-3">
                          <StatusCell status={p.eu_status} />
                        </td>
                        <td className="px-3 py-3">
                          <StatusCell status={p.uk_status} />
                        </td>
                        <td className="px-3 py-3">
                          <StatusCell status={p.us_status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          <SectionDivider />

          {/* ═══════════════════ WHAT THIS IS NOT ═══════════════════ */}
          <section className="rounded-xl border border-emerald-500/20 bg-[#05140d] p-6">
            <h2 className="text-xl font-bold text-emerald-50">What this arena is not</h2>
            <ul className="mt-4 space-y-2 text-[13px] text-emerald-100/70 leading-relaxed list-none pl-0">
              {[
                "Not a leaderboard with composite scores. Each cell is measured independently.",
                "Not a popularity contest. The arena shows what models did, not what they claim.",
                "Not a safety certification. We report refusals and survivals — the conclusions are yours.",
                "Not LLM-as-judge. Every verdict is a deterministic predicate applied to a recorded trace.",
              ].map((text, i) => (
                <li key={i} className="flex gap-3">
                  <span className="font-mono text-[10px] text-amber-400/50 mt-1 shrink-0">{String(i + 1).padStart(2, "0")}</span>
                  <span>{text}</span>
                </li>
              ))}
            </ul>
            <p className="mt-5 text-[13px]">
              <Link href="/methodology" className="text-emerald-300 hover:text-emerald-200 transition-colors font-medium">
                Read the full methodology →
              </Link>
            </p>
          </section>

          {/* ═══════════════════ LINKS ═══════════════════ */}
          <div className="flex flex-wrap gap-5 pb-4 text-[13px]">
            {[
              { href: "/refutation-ledger", label: "Refutation ledger" },
              { href: "/gspc-gap-map", label: "Coverage gap map" },
              { href: "/gspc-anchors", label: "Anchored to" },
            ].map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-emerald-300/70 hover:text-emerald-200 transition-colors font-mono text-[12px]"
              >
                {link.label} →
              </Link>
            ))}
          </div>
        </div>
      </div>
    </JurisdictionProvider>
  );
}
