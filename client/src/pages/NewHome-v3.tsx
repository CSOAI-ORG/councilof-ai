/**
 * NewHome-v3 — councilof.ai Homepage (2026-08-28)
 *
 * LOCKED ORDER:
 * 1. Hero = Council OS door (one sentence, one filled CTA, one ghost CTA, OS visual)
 * 2. 9 product tiles from git history (ToolStack component)
 * 3. Living 22-row GET /api/gspc table (below hero, not the hero)
 * 4. Refusals + Trust
 *
 * 9 PRODUCT TILES (from ToolStack, recovered from git history):
 * Council OS, The living board, Verify a card, Get measured, GPAI evidence pack,
 * Embed and white-label kit, Insurance evidence rail, Specialist registers, Report an incident
 *
 * DOCTRINE:
 * - Never certify. Never sell a grade. UNMEASURED is first-class.
 * - Empty stays empty (7 UNMEASURED visible). No invented scores.
 * - Verification free forever. Primary OS CTA appears THREE times.
 */
import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import ToolStack from "../components/home/ToolStack";
import EnterpriseTrust from "../components/EnterpriseTrust";
import RegionBanner from "../components/RegionBanner";
import {
  fetchAxes, quotable,
  type Axis,
} from "../lib/gspcAxes";
import {
  ChevronRight,
  Ban,
  Activity,
  CheckCircle2,
  Circle,
  FileCheck,
} from "lucide-react";

// ── refusals ───────────────────────────────────────────────────
const REFUSALS = [
  { no: "We do not certify", why: "No conformity mark, no badge, no seal, no accreditation chain. We are not a notified body under the EU AI Act or anything else." },
  { no: "We do not sell a grade", why: "Nobody on the board pays for their place on it, their score, or their removal from either. Verification is free forever and needs no account." },
  { no: "We do not publish a number we did not measure", why: "UNMEASURED is a first-class state. An empty cell stays empty — inventing one is the exact behaviour this instrument exists to catch." },
  { no: "We do not let a model judge a model", why: "Every verdict is deterministic code against pre-written gold labels. An AI grading an AI is a correlated error, not an audit." },
  { no: "We do not promote a lead into a win", why: "Where a lead is not statistically separated we call it a tie — including when the model in front is one of ours." },
  { no: "We do not edit history", why: "Re-attestation issues a new signed record; the old one stands. Corrections are appended in public at /api/corrections, never silently applied." },
];

// ── Hero: Council OS door ───────────────────
function HeroCouncilOS() {
  return (
    <section className="surface-ink py-16 sm:py-20 lg:py-24">
      <div className="section-shell">
        <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
          {/* Left: headline + CTAs */}
          <div className="text-center lg:text-left">
            {/* Badge */}
            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-500/10 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-emerald-300">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              Independent Measurement Body
            </span>

            <h1 className="mt-6 text-3xl font-black tracking-tight text-white sm:text-4xl lg:text-5xl">
              Council OS
            </h1>

            {/* One sentence */}
            <p className="mt-5 max-w-lg text-lg leading-relaxed text-emerald-100/90 lg:mx-0 mx-auto">
              The workspace that opens the board, verifier, assessment, and evidence
              pack in one window — loginless and free.
            </p>

            {/* Two CTAs only: primary filled + ghost */}
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-center lg:justify-start">
              <a
                href="/os"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-7 py-3.5 text-sm font-bold text-white shadow-lg shadow-emerald-500/25 transition-all hover:bg-emerald-400 hover:shadow-emerald-400/30"
              >
                Open Council OS <ChevronRight className="h-4 w-4" />
              </a>
              <a
                href="/gspc-verify"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/30 bg-transparent px-7 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-white/10"
              >
                Verify a card — free
              </a>
            </div>
          </div>

          {/* Right: real OS visual (screenshot or iframe embed) */}
          <div className="relative mx-auto w-full max-w-xl lg:mx-0">
            <div className="overflow-hidden rounded-2xl border border-emerald-500/20 bg-slate-900/50 shadow-2xl shadow-emerald-900/30">
              {/* OS header bar mockup */}
              <div className="flex items-center gap-2 border-b border-white/10 bg-slate-800/80 px-4 py-2.5">
                <span className="h-3 w-3 rounded-full bg-rose-400/70" />
                <span className="h-3 w-3 rounded-full bg-amber-400/70" />
                <span className="h-3 w-3 rounded-full bg-emerald-400/70" />
                <span className="ml-3 text-xs font-medium text-slate-400">Council OS · councilof.ai/os</span>
              </div>
              {/* Screenshot of the OS — uses actual screenshot from public/images */}
              <img
                src="/images/band/hardened.png"
                alt="Council OS workspace showing the board, verifier, and evidence tools"
                className="w-full"
                loading="eager"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ── Primary CTA band (repeated after products and above footer) ───────────────────
function PrimaryCtaBand({ id }: { id?: string }) {
  return (
    <section id={id} className="surface-raised py-10 sm:py-12">
      <div className="section-shell text-center">
        <a
          href="/os"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-8 py-4 text-base font-bold text-white shadow-lg shadow-emerald-600/25 transition-all hover:bg-emerald-500 hover:shadow-emerald-500/30"
        >
          Open Council OS <ChevronRight className="h-5 w-5" />
        </a>
        <p className="mt-4 text-sm text-muted-foreground">
          Free and loginless. Board, verifier, assessment, evidence — one window.
        </p>
      </div>
    </section>
  );
}

// ── dense board: OpenRouter-style sortable leaderboard of ALL axes ──────
type SortKey = "axis" | "status" | "n" | "score";
type SortDir = "asc" | "desc";

function DenseBoard() {
  const [, navigate] = useLocation();
  const [axes, setAxes] = useState<Axis[]>([]);
  const [publicCount, setPublicCount] = useState("");
  const [measuredOn, setMeasuredOn] = useState("");
  const [loading, setLoading] = useState(true);
  const [sortKey, setSortKey] = useState<SortKey>("status");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  useEffect(() => {
    const ac = new AbortController();
    fetchAxes(ac.signal).then((r) => {
      setAxes(r.axes);
      setPublicCount(r.publicCount || "");
      setMeasuredOn(r.measuredOn || "");
      setLoading(false);
    });
    return () => ac.abort();
  }, []);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir(key === "axis" ? "asc" : "desc");
    }
  };

  const sorted = [...axes].sort((a, b) => {
    const dir = sortDir === "asc" ? 1 : -1;
    switch (sortKey) {
      case "axis":
        return dir * a.axis.localeCompare(b.axis);
      case "status": {
        const aM = a.status === "MEASURED" ? 1 : 0;
        const bM = b.status === "MEASURED" ? 1 : 0;
        return dir * (bM - aM) || a.axis.localeCompare(b.axis);
      }
      case "n":
        return dir * ((a.n || 0) - (b.n || 0));
      case "score": {
        const aS = quotable(a) ? (a.accuracy ?? 0) : -1;
        const bS = quotable(b) ? (b.accuracy ?? 0) : -1;
        return dir * (aS - bS);
      }
      default:
        return 0;
    }
  });

  const stampAge = (() => {
    if (!measuredOn) return null;
    const match = measuredOn.match(/\d{4}-\d{2}-\d{2}/);
    if (!match) return null;
    const d = new Date(match[0]);
    const now = new Date();
    const days = Math.floor((now.getTime() - d.getTime()) / 86400000);
    return days;
  })();

  const goToAxis = (axis: Axis) => {
    navigate(`/gspc/${encodeURIComponent(axis.axis)}`);
  };

  const SortIcon = ({ k }: { k: SortKey }) => (
    <span className="ml-1 inline-block opacity-60">
      {sortKey === k ? (sortDir === "asc" ? "↑" : "↓") : "⇅"}
    </span>
  );

  return (
    <section className="surface-sunken section-y">
      <div className="section-shell">
        {/* Header */}
        <div className="mb-6 rounded-xl border border-emerald-200/50 bg-gradient-to-r from-emerald-50/80 to-transparent p-4 sm:p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-600 text-white">
                <Activity className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-xl font-black tracking-tight text-foreground sm:text-2xl">
                  The Living Board
                </h2>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  {/* Caption from payload, never hardcoded */}
                  {publicCount ? (
                    <span className="font-medium text-emerald-700">{publicCount}</span>
                  ) : loading ? (
                    <span>Loading…</span>
                  ) : (
                    <span>{axes.length} axis · {axes.filter(a => a.status === "MEASURED").length} measured · {axes.filter(a => a.status !== "MEASURED").length} empty</span>
                  )}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-emerald-100 px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-emerald-700">
                Live from GET /api/gspc
              </span>
              <a
                href="/gspc-scoreboard"
                className="inline-flex items-center gap-2 rounded-lg bg-emerald-700 px-4 py-2 text-sm font-bold text-white transition hover:bg-emerald-800"
              >
                Full scoreboard <ChevronRight className="h-4 w-4" />
              </a>
            </div>
          </div>
        </div>

        {/* Dense table: all 22 rows */}
        <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-sm">
          <table className="w-full min-w-[44rem] text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50 text-left text-xs font-bold uppercase tracking-wide text-muted-foreground">
                <th className="cursor-pointer select-none px-4 py-3 hover:text-foreground" onClick={() => toggleSort("axis")}>
                  Axis<SortIcon k="axis" />
                </th>
                <th className="cursor-pointer select-none px-4 py-3 text-center hover:text-foreground" onClick={() => toggleSort("status")}>
                  Status<SortIcon k="status" />
                </th>
                <th className="cursor-pointer select-none px-4 py-3 text-right hover:text-foreground" onClick={() => toggleSort("n")}>
                  n<SortIcon k="n" />
                </th>
                <th className="cursor-pointer select-none px-4 py-3 text-right hover:text-foreground" onClick={() => toggleSort("score")}>
                  Score<SortIcon k="score" />
                </th>
                <th className="px-4 py-3 text-center">Age</th>
                <th className="px-4 py-3 text-center">Verify</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                    <span className="inline-flex items-center gap-2">
                      <Activity className="h-4 w-4 animate-pulse" />
                      Fetching live board…
                    </span>
                  </td>
                </tr>
              ) : (
                sorted.map((a) => {
                  const q = quotable(a);
                  const isMeasured = a.status === "MEASURED";
                  return (
                    <tr
                      key={a.axis}
                      className="cursor-pointer border-b border-border last:border-0 transition-colors hover:bg-emerald-50/50"
                      onClick={() => goToAxis(a)}
                      tabIndex={0}
                      onKeyDown={(e) => e.key === "Enter" && goToAxis(a)}
                      role="button"
                      aria-label={`Open ${a.axis} deep page`}
                    >
                      <td className="px-4 py-2.5">
                        <span className="font-semibold text-foreground">{a.axis}</span>
                        {a.task && (
                          <span className="ml-2 hidden text-xs text-muted-foreground sm:inline">
                            {a.task.slice(0, 40)}…
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-2.5 text-center">
                        <span className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                          isMeasured ? "bg-emerald-500/15 text-emerald-700" : "bg-slate-100 text-slate-500"
                        }`}>
                          {isMeasured ? <CheckCircle2 className="h-3 w-3" /> : <Circle className="h-3 w-3" />}
                          {a.status}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-right font-mono tabular-nums text-muted-foreground">
                        {typeof a.n === "number" && a.n > 0 ? a.n : "—"}
                      </td>
                      <td className="px-4 py-2.5 text-right font-mono tabular-nums">
                        {/* provenance-controls with n but no score stays — */}
                        {q ? (
                          <span className="font-bold text-emerald-700">
                            {((a.accuracy ?? 0) * 100).toFixed(0)}%
                          </span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                      <td className="px-4 py-2.5 text-center font-mono text-xs text-muted-foreground">
                        {isMeasured && stampAge !== null ? `${stampAge}d` : "—"}
                      </td>
                      <td className="px-4 py-2.5 text-center">
                        {isMeasured ? (
                          <a
                            href={`/gspc-verify?axis=${encodeURIComponent(a.axis)}`}
                            className="text-xs font-bold text-emerald-600 hover:underline"
                            onClick={(e) => e.stopPropagation()}
                          >
                            verify
                          </a>
                        ) : (
                          <span className="text-xs text-slate-400">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer note */}
        <p className="mt-4 text-center text-xs text-muted-foreground">
          Click any row → deep page (graphs, traces, evidence). Empty cells stay visible.
          <span className="mx-1">·</span>
          <a href="/methodology" className="font-medium text-emerald-600 hover:underline">
            How we measure
          </a>
        </p>
      </div>
    </section>
  );
}

// ── refusals ───────────────────────────────────────
function RefusalBand() {
  return (
    <section className="surface-sunken section-y">
      <div className="section-shell">
        <h2 className="t-section text-center text-foreground">What we refuse to do</h2>
        <p className="t-lede measure measure-center mt-4 text-center text-muted-foreground">
          The limits are the product. An instrument that will say anything measures nothing.
        </p>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {REFUSALS.map(r => (
            <div key={r.no} className="card-quiet p-5 sm:p-6">
              <div className="flex items-start gap-2.5">
                <Ban className="mt-0.5 h-5 w-5 shrink-0 text-rose-500" aria-hidden />
                <h3 className="t-card text-foreground">{r.no}</h3>
              </div>
              <p className="t-body mt-3 text-muted-foreground">{r.why}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}


// ── Verify Door (free forever) ───────────────────────────────
function VerifyDoor() {
  return (
    <section className="surface-sunken py-12 sm:py-16">
      <div className="section-shell">
        <div className="mx-auto max-w-2xl rounded-2xl border border-emerald-200 bg-white p-8 text-center shadow-sm">
          <FileCheck className="mx-auto h-10 w-10 text-emerald-600" />
          <h3 className="mt-4 text-xl font-bold text-foreground">Verify a card — free forever</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Paste a signed measurement record. Your browser recomputes the hash and checks
            the Ed25519 signature. Nothing is sent to us. No account, no fee, permanently.
          </p>
          <a
            href="/gspc-verify"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-3 text-sm font-bold text-white transition hover:bg-emerald-700"
          >
            Open verifier <ChevronRight className="h-4 w-4" />
          </a>
        </div>
      </div>
    </section>
  );
}

// ── export ───────────────────────────────
export default function NewHomeV3() {
  return (
    <main className="surface-base">
      {/* 1. Hero = Council OS door (one filled CTA + one ghost) */}
      <HeroCouncilOS />

      {/* 2. 9 product tiles from git history (ToolStack) */}
      <ToolStack />

      {/* Primary CTA #2: after products */}
      <PrimaryCtaBand id="cta-after-products" />

      {/* 3. Living 22-row GET /api/gspc table (below hero, not the hero) */}
      <DenseBoard />

      {/* Verify door — free forever */}
      <VerifyDoor />

      {/* 4. Doctrine: what we refuse to do */}
      <RefusalBand />

      {/* 5. Trust badges */}
      <EnterpriseTrust />

      {/* Region detection banner */}
      <div className="surface-ink pb-12 sm:pb-16">
        <div className="section-shell">
          <RegionBanner />
        </div>
      </div>

      {/* Primary CTA #3: above footer */}
      <PrimaryCtaBand id="cta-footer" />

      {/* FAQ link — full FAQ on /faq, News on /blog/ */}
      <section className="surface-raised py-8">
        <div className="section-shell flex flex-wrap items-center justify-center gap-4 text-sm">
          <a
            href="/faq"
            className="inline-flex items-center gap-2 font-bold text-primary hover:underline"
          >
            Questions? See all FAQs <ChevronRight className="h-4 w-4" />
          </a>
          <span className="text-muted-foreground">·</span>
          <a
            href="/blog"
            className="inline-flex items-center gap-2 font-bold text-primary hover:underline"
          >
            News <ChevronRight className="h-4 w-4" />
          </a>
        </div>
      </section>
    </main>
  );
}
