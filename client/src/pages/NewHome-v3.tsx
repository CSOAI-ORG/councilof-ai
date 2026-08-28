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
import { useEffect, useState, type ReactNode } from "react";
import { useLocation } from "wouter";
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
// All links load INSIDE Council OS (not outbound tabs). Empty panes hidden until they exist.
// News loads /blog/ inside OS via Library pane. Vote/OTEL panes hidden (404 until live).
const OS_PANES = [
  { label: "Board", href: "/?lobby=board" },         // living GET, 22 axis
  { label: "Verify", href: "/?lobby=verify" },       // Ed25519/SHA-256
  { label: "Space", href: "/?lobby=space" },         // graphs, Wilson/McNemar
  { label: "Models", href: "/?lobby=models" },       // measured models
  { label: "News", href: "/?lobby=library" },        // /blog/ inside OS (Company > Blog)
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

// ── dense board: OpenRouter-style sortable leaderboard of ALL axes ──────
// Row click navigates to the existing board/OS deep pages (graphs, OTEL, logs, traces)
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

  const measuredCount = axes.filter((a) => a.status === "MEASURED").length;
  const emptyCount = axes.length - measuredCount;

  const goToAxis = (axis: Axis) => {
    // Navigate to the existing board deep page: /gspc/:axis (graphs, OTEL, logs, traces)
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
