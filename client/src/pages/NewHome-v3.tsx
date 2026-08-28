/**
 * NewHome-v3 — councilof.ai Homepage (LEAN v3 2026-08-28)
 *
 * Structure: institutional first-paint + OpenRouter-style living 22-row table + doors
 *
 * DESIGN INTENT:
 * - OpenRouter leaderboard: dense, sortable, every row visible, every number live
 * - Moody's measurement house: institution chrome, measurement credential language
 * - Row click → deep pane with progress (measured vs unmeasured), axis detail
 * - Never certify. Never sell a grade. UNMEASURED is first-class.
 *
 * WHAT WAS CUT:
 * - Fat UNMEASURED card stack (replaced with dense table)
 * - Industries/demographics/buyer grids
 * - FAQ accordion (lives on /faq per PR 833)
 *
 * WHAT STAYS:
 * - Short intro: who we are (independent measurement body), one line
 * - Dense table of ALL axes (OpenRouter-style: every row visible, no teaser)
 * - Three doors: verify (free), OS, Space
 * - Products / refusals below the fold
 */
import { useEffect, useState, type ReactNode, useCallback } from "react";
import EnterpriseTrust from "../components/EnterpriseTrust";
import RegionBanner from "../components/RegionBanner";
import {
  fetchAxes, quotable, wilson, hasInterval, hasMacroF1,
  type Axis,
} from "../lib/gspcAxes";
import {
  ChevronRight,
  Ban,
  X,
  BarChart3,
  ExternalLink,
  Activity,
  CheckCircle2,
  Circle,
} from "lucide-react";

// ── data ───────────────────────────────────────────────────
// Live SKUs only: verify, board, OS, Space, embed, assess
const PRODUCT_FAMILY = [
  {
    name: "Verify a card",
    href: "/gspc-verify",
    tag: "Free forever",
    what: "Paste a signed measurement card. Your browser recomputes the hash and checks the Ed25519 signature. Nothing is sent to us. No account, no fee.",
  },
  {
    name: "The living board",
    href: "/gspc-scoreboard",
    tag: "GSPC",
    what: "Every slot we publish about AI behaviour. Measured cells carry a figure; empty cells stay honestly empty. Live from GET /api/gspc.",
  },
  {
    name: "Council OS",
    href: "/os",
    tag: "The workspace",
    what: "One window that opens every surface here — board, verifier, assessment, evidence pack — without a second tab or login.",
  },
  {
    name: "Council Space",
    href: "/gspc-arena",
    tag: "The contest",
    what: "Model versus model on frozen instruments. Every match is evidence, not a brochure. Ties stay ties.",
  },
  {
    name: "Embed badge",
    href: "/embed",
    tag: "For your site",
    what: "A self-verifying badge: WebCrypto checks the signature in each reader's own browser. Green only when the bytes are true. Free forever.",
  },
  {
    name: "Get measured",
    href: "/assess",
    tag: "Your system",
    what: "We run your system against frozen, published tests and hand you a signed card — the scores, the sample sizes, and the slots we could not fill.",
  },
];

// ── mini-nav for Council OS panes ─────────────────────────────
const OS_PANES = [
  { label: "Board", href: "/?lobby=board", pane: "board" },
  { label: "Verify", href: "/?lobby=verify", pane: "verify" },
  { label: "Space", href: "/?lobby=space", pane: "space" },
  { label: "Models", href: "/?lobby=models", pane: "models" },
  { label: "News", href: "/blog", pane: null },
  { label: "Progress", href: "/methodology", pane: null },
] as const;

const REFUSALS = [
  { no: "We do not certify", why: "No conformity mark, no badge, no seal, no accreditation chain. We are not a notified body under the EU AI Act or anything else." },
  { no: "We do not sell a grade", why: "Nobody on the board pays for their place on it, their score, or their removal from either. Verification is free forever and needs no account." },
  { no: "We do not publish a number we did not measure", why: "UNMEASURED is a first-class state. An empty cell stays empty — inventing one is the exact behaviour this instrument exists to catch." },
  { no: "We do not let a model judge a model", why: "Every verdict is deterministic code against pre-written gold labels. An AI grading an AI is a correlated error, not an audit." },
  { no: "We do not promote a lead into a win", why: "Where a lead is not statistically separated we call it a tie — including when the model in front is one of ours." },
  { no: "We do not edit history", why: "Re-attestation issues a new signed record; the old one stands. Corrections are appended in public at /api/corrections, never silently applied." },
];

// ── sections ───────────────────────────────────────────────
type Tone = "base" | "raised" | "sunken";
const TONE: Record<Tone, string> = {
  base: "surface-base",
  raised: "surface-raised",
  sunken: "surface-sunken",
};

function Section({
  id, title, subtitle, children, tone = "raised",
}: { id?: string; title?: string; subtitle?: string; children: ReactNode; tone?: Tone }) {
  return (
    <section id={id} className={`section-y ${TONE[tone]}`}>
      <div className="section-shell">
        {title && <h2 className="t-section text-center text-foreground">{title}</h2>}
        {subtitle && (
          <p className="t-lede measure measure-center mt-4 text-center text-muted-foreground">{subtitle}</p>
        )}
        <div className="mt-10 sm:mt-12">{children}</div>
      </div>
    </section>
  );
}

// ── hero: institutional first-paint ───────────────────
function HeroIntro() {
  return (
    <section className="surface-ink py-16 sm:py-20 lg:py-24">
      <div className="section-shell">
        {/* Institution badge */}
        <div className="mb-6 flex justify-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-500/10 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-emerald-300">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            Independent Measurement Body
          </span>
        </div>

        <h1 className="text-center text-3xl font-black tracking-tight text-white sm:text-4xl lg:text-5xl">
          Council of AI
        </h1>

        <p className="mx-auto mt-5 max-w-2xl text-center text-lg leading-relaxed text-emerald-100/90">
          We run AI systems against frozen, published tests, sign the result with Ed25519,
          and publish what we could not measure alongside what we could. Measurement credential,
          not certification. Verification is free forever.
        </p>

        {/* Key facts row */}
        <div className="mx-auto mt-8 flex max-w-xl flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-emerald-200/80">
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            Ed25519-signed
          </span>
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            Verify free forever
          </span>
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            No login required
          </span>
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            UNMEASURED is first-class
          </span>
        </div>

        {/* Primary CTAs */}
        <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-center">
          <a
            href="/gspc-verify"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-emerald-500/25 transition-all hover:bg-emerald-400 hover:shadow-emerald-400/30"
          >
            Verify a card — free <ChevronRight className="h-4 w-4" />
          </a>
          <a
            href="/os"
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/30 bg-white/5 px-6 py-3.5 text-sm font-bold text-white backdrop-blur-sm transition-colors hover:bg-white/10"
          >
            Open Council OS
          </a>
          <a
            href="/gspc-arena"
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/30 bg-white/5 px-6 py-3.5 text-sm font-bold text-white backdrop-blur-sm transition-colors hover:bg-white/10"
          >
            Council Space
          </a>
        </div>

        {/* Doctrine statement */}
        <p className="mx-auto mt-10 max-w-xl text-center text-xs leading-relaxed text-emerald-200/60">
          We measure; we never certify. No conformity mark, no badge, no seal, no accreditation chain.
          A grade is never sold; nobody on the board pays for their place on it. Empty cells stay
          visible — an invented number is exactly the behaviour this instrument exists to catch.
        </p>
      </div>
    </section>
  );
}

// ── axis detail pane: row-click deep view ──────────────────────────────
function AxisDetailPane({
  axis,
  onClose,
}: {
  axis: Axis | null;
  onClose: () => void;
}) {
  if (!axis) return null;
  const isMeasured = axis.status === "MEASURED";
  const q = quotable(axis);
  const showInterval = hasInterval(axis);
  const interval = showInterval && q ? wilson(axis.accuracy!, axis.n) : null;
  const showMacro = hasMacroF1(axis);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative mx-4 w-full max-w-2xl rounded-2xl border border-border bg-card shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="p-6 sm:p-8">
          {/* Header */}
          <div className="flex items-start gap-4">
            <div
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl"
              style={{ backgroundColor: `${axis.colour}20`, color: axis.colour }}
            >
              <BarChart3 className="h-6 w-6" />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-xl font-bold text-foreground">{axis.axis}</h2>
              <p className="mt-0.5 text-sm text-muted-foreground">{axis.bench}</p>
            </div>
          </div>

          {/* Status badge row */}
          <div className="mt-6 flex flex-wrap items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide ${
                isMeasured
                  ? "bg-emerald-500/15 text-emerald-700"
                  : "bg-slate-500/10 text-slate-500"
              }`}
            >
              {isMeasured ? (
                <CheckCircle2 className="h-3.5 w-3.5" />
              ) : (
                <Circle className="h-3.5 w-3.5" />
              )}
              {axis.status}
            </span>
            {axis.instrument && (
              <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
                {axis.instrument}
              </span>
            )}
          </div>

          {/* Task description */}
          {axis.task && (
            <p className="mt-4 text-sm leading-relaxed text-foreground">
              <strong className="font-semibold">Measurement task:</strong> {axis.task}
            </p>
          )}

          {/* Metrics grid */}
          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="rounded-xl border border-border bg-muted/30 p-4">
              <div className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                Sample (n)
              </div>
              <div className="mt-1 font-mono text-2xl font-bold tabular-nums text-foreground">
                {axis.n > 0 ? axis.n : "—"}
              </div>
            </div>
            <div className="rounded-xl border border-border bg-muted/30 p-4">
              <div className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                Accuracy
              </div>
              <div className="mt-1 font-mono text-2xl font-bold tabular-nums text-foreground">
                {q ? `${((axis.accuracy ?? 0) * 100).toFixed(1)}%` : "—"}
              </div>
            </div>
            {showMacro && (
              <div className="rounded-xl border border-border bg-muted/30 p-4">
                <div className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                  Macro F1
                </div>
                <div className="mt-1 font-mono text-2xl font-bold tabular-nums text-foreground">
                  {(axis.macro_f1! * 100).toFixed(1)}%
                </div>
              </div>
            )}
            <div className="rounded-xl border border-border bg-muted/30 p-4">
              <div className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                Unparsed
              </div>
              <div className="mt-1 font-mono text-2xl font-bold tabular-nums text-foreground">
                {axis.unparsed_rate > 0 ? `${(axis.unparsed_rate * 100).toFixed(1)}%` : "0%"}
              </div>
            </div>
          </div>

          {/* Confidence interval visualization */}
          {interval && (
            <div className="mt-6">
              <div className="mb-2 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                95% Wilson Interval
              </div>
              <div className="relative h-8 overflow-hidden rounded-lg bg-muted">
                <div
                  className="absolute top-0 h-full bg-emerald-500/30"
                  style={{
                    left: `${interval[0] * 100}%`,
                    width: `${(interval[1] - interval[0]) * 100}%`,
                  }}
                />
                <div
                  className="absolute top-0 h-full w-0.5 bg-emerald-600"
                  style={{ left: `${(axis.accuracy ?? 0) * 100}%` }}
                />
                <div className="absolute inset-0 flex items-center justify-between px-3 text-[10px] font-mono text-muted-foreground">
                  <span>{(interval[0] * 100).toFixed(0)}%</span>
                  <span className="font-bold text-foreground">
                    {((axis.accuracy ?? 0) * 100).toFixed(1)}%
                  </span>
                  <span>{(interval[1] * 100).toFixed(0)}%</span>
                </div>
              </div>
              <p className="mt-1 text-[11px] text-muted-foreground">
                n≥30 required. Interval is withheld below that threshold.
              </p>
            </div>
          )}

          {/* Progress bar: measured vs unmeasured visual */}
          <div className="mt-6">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                Measurement Progress
              </span>
              <span className="text-xs text-muted-foreground">
                {isMeasured ? "Measured" : "UNMEASURED — slot declared, no run behind it"}
              </span>
            </div>
            <div className="h-3 overflow-hidden rounded-full bg-muted">
              <div
                className={`h-full transition-all ${
                  isMeasured ? "bg-emerald-500" : "bg-slate-300"
                }`}
                style={{ width: isMeasured ? "100%" : "0%" }}
              />
            </div>
          </div>

          {/* Note */}
          {axis.note && (
            <p className="mt-6 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs leading-relaxed text-amber-800">
              <strong className="font-semibold">Note:</strong> {axis.note}
            </p>
          )}

          {/* Actions */}
          <div className="mt-6 flex flex-wrap items-center gap-3">
            {isMeasured && (
              <a
                href={`/gspc-verify?axis=${encodeURIComponent(axis.axis)}`}
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-bold text-primary-foreground hover:bg-primary/90"
              >
                Verify this axis <ExternalLink className="h-3.5 w-3.5" />
              </a>
            )}
            <a
              href={`/gspc-scoreboard?axis=${encodeURIComponent(axis.axis)}`}
              className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted"
            >
              View on scoreboard
            </a>
            {axis.dataset_url && (
              <a
                href={axis.dataset_url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
              >
                Dataset <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-border bg-muted/30 px-6 py-4 sm:px-8">
          <p className="text-[11px] leading-relaxed text-muted-foreground">
            <strong>Measurement credential, not certification.</strong> This axis is a measurement —
            we run AI systems against frozen, published tests and sign the result. We issue no
            conformity mark, no badge, no seal. UNMEASURED slots stay visible: an empty cell is
            honest, a fabricated number is not. Verification is free forever.
          </p>
        </div>
      </div>
    </div>
  );
}

// ── dense board: OpenRouter-style sortable leaderboard of ALL axes ──────
type SortKey = "axis" | "status" | "n" | "score";
type SortDir = "asc" | "desc";

function DenseBoard() {
  const [axes, setAxes] = useState<Axis[]>([]);
  const [publicCount, setPublicCount] = useState("");
  const [measuredOn, setMeasuredOn] = useState("");
  const [loading, setLoading] = useState(true);
  const [sortKey, setSortKey] = useState<SortKey>("status");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [selectedAxis, setSelectedAxis] = useState<Axis | null>(null);

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

  const measuredCount = axes.filter((a) => a.status === "MEASURED").length;
  const emptyCount = axes.length - measuredCount;

  const handleRowClick = useCallback((axis: Axis) => {
    setSelectedAxis(axis);
  }, []);

  const SortIcon = ({ k }: { k: SortKey }) => (
    <span className="ml-1 inline-block opacity-60">
      {sortKey === k ? (sortDir === "asc" ? "↑" : "↓") : "⇅"}
    </span>
  );

  return (
    <section className="surface-sunken section-y">
      <div className="section-shell">
        {/* Institutional header */}
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
                  {publicCount ? (
                    <span className="font-medium text-emerald-700">{publicCount}</span>
                  ) : (
                    <>
                      {axes.length} axis · {measuredCount} measured · {emptyCount} empty
                    </>
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

        {/* Mini-nav for Council OS panes */}
        <div className="mb-4 flex flex-wrap items-center gap-2 text-xs">
          <span className="font-bold uppercase tracking-wide text-muted-foreground">Open in OS:</span>
          {OS_PANES.map((p) => (
            <a
              key={p.label}
              href={p.href}
              className="rounded-md border border-border bg-card px-2.5 py-1 font-medium text-foreground transition hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700"
            >
              {p.label}
            </a>
          ))}
        </div>

        {/* Dense table */}
        <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-sm">
          <table className="w-full min-w-[44rem] text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50 text-left text-xs font-bold uppercase tracking-wide text-muted-foreground">
                <th
                  className="cursor-pointer select-none px-4 py-3 hover:text-foreground"
                  onClick={() => toggleSort("axis")}
                >
                  Axis<SortIcon k="axis" />
                </th>
                <th
                  className="cursor-pointer select-none px-4 py-3 text-center hover:text-foreground"
                  onClick={() => toggleSort("status")}
                >
                  Status<SortIcon k="status" />
                </th>
                <th
                  className="cursor-pointer select-none px-4 py-3 text-right hover:text-foreground"
                  onClick={() => toggleSort("n")}
                >
                  n<SortIcon k="n" />
                </th>
                <th
                  className="cursor-pointer select-none px-4 py-3 text-right hover:text-foreground"
                  onClick={() => toggleSort("score")}
                >
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
                      onClick={() => handleRowClick(a)}
                      tabIndex={0}
                      onKeyDown={(e) => e.key === "Enter" && handleRowClick(a)}
                      role="button"
                      aria-label={`View details for ${a.axis}`}
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
                        <span
                          className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                            isMeasured
                              ? "bg-emerald-500/15 text-emerald-700"
                              : "bg-slate-100 text-slate-500"
                          }`}
                        >
                          {isMeasured ? (
                            <CheckCircle2 className="h-3 w-3" />
                          ) : (
                            <Circle className="h-3 w-3" />
                          )}
                          {a.status}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-right font-mono tabular-nums text-muted-foreground">
                        {typeof a.n === "number" && a.n > 0 ? a.n : "—"}
                      </td>
                      <td className="px-4 py-2.5 text-right font-mono tabular-nums">
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
          Click any row for axis detail. Empty cells stay visible — UNMEASURED is honest.
          <span className="mx-1">·</span>
          <a href="/methodology" className="font-medium text-emerald-600 hover:underline">
            How we measure
          </a>
        </p>
      </div>

      {/* Detail pane */}
      <AxisDetailPane axis={selectedAxis} onClose={() => setSelectedAxis(null)} />
    </section>
  );
}

// ── products ─────────────────────────────────
function ProductBand() {
  return (
    <Section
      id="products"
      title="What you can use today"
      subtitle="Ed25519 over canonical JSON, three-state verdicts (pass / fail / UNMEASURED), every public number recomputable from a live API. Verification is free forever and a grade is never sold."
      tone="raised"
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {PRODUCT_FAMILY.map(p => (
          <a key={p.href} href={p.href} className="card-quiet group flex flex-col p-5 sm:p-6">
            <span className="t-kicker text-primary">{p.tag}</span>
            <h3 className="mt-3 text-lg font-extrabold leading-snug tracking-tight text-foreground transition-colors group-hover:text-primary">{p.name}</h3>
            <p className="t-body mt-2 flex-1 text-muted-foreground">{p.what}</p>
            <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-bold text-primary">
              Open <ChevronRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
            </span>
          </a>
        ))}
      </div>
    </Section>
  );
}

// ── refusals ───────────────────────────────────────
function RefusalBand() {
  return (
    <Section
      id="refusals"
      title="What we refuse to do"
      subtitle="The limits are the product. An instrument that will say anything measures nothing."
      tone="sunken"
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
    </Section>
  );
}

// ── export ───────────────────────────────
export default function NewHomeV3() {
  return (
    <main className="surface-base">
      {/* Short intro: who we are + three doors */}
      <HeroIntro />

      {/* OpenRouter-style dense table of ALL 22 axes */}
      <DenseBoard />

      {/* Products matching live SKUs only */}
      <ProductBand />

      {/* Doctrine is product: what we refuse to do */}
      <RefusalBand />

      {/* Trust badges */}
      <EnterpriseTrust />

      {/* Region detection banner */}
      <div className="surface-ink pb-12 sm:pb-16">
        <div className="section-shell">
          <RegionBanner />
        </div>
      </div>

      {/* FAQ link — full FAQ lives on /faq */}
      <section className="surface-raised py-12">
        <div className="section-shell text-center">
          <a
            href="/faq"
            className="inline-flex items-center gap-2 text-sm font-bold text-primary hover:underline"
          >
            Questions? See all FAQs <ChevronRight className="h-4 w-4" />
          </a>
        </div>
      </section>
    </main>
  );
}
