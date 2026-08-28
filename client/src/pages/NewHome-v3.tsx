/**
 * NewHome-v3 — councilof.ai Homepage (LEAN v2 2026-08-28)
 *
 * Structure: short intro + OpenRouter-style dense table of ALL 22 axes + three doors
 *
 * WHAT WAS CUT:
 * - Fat UNMEASURED card stack (replaced with dense table)
 * - StoryWorldRest scroll-world slides
 * - ToolStack "Nine problems, nine tools" brochure
 * - Industries/demographics/buyer grids
 * - FAQ accordion (lives on /faq per PR 833)
 * - CardChainBand (too much detail for first paint)
 * - Repeated pain/benefit blocks
 *
 * WHAT STAYS:
 * - Short intro: who we are, one line
 * - Dense table of ALL 22 axes (OpenRouter-style: every row visible, no teaser)
 * - Three doors: verify (free), OS, Space
 * - Products / refusals below the fold
 */
import { useEffect, useState, type ReactNode } from "react";
import EnterpriseTrust from "../components/EnterpriseTrust";
import RegionBanner from "../components/RegionBanner";
import {
  fetchAxes, quotable,
  type Axis,
} from "../lib/gspcAxes";
import {
  ChevronRight,
  Ban,
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

// ── hero: short intro, not a scroll-world ───────────────────
function HeroIntro() {
  return (
    <section className="surface-ink py-16 sm:py-20">
      <div className="section-shell text-center">
        <h1 className="text-3xl font-black tracking-tight text-white sm:text-4xl lg:text-5xl">
          Council of AI
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-emerald-100/90">
          Independent measurement body for AI behaviour. We run AI systems against frozen,
          published tests, sign the result, and publish what we could not measure alongside
          what we could. Measurement, not certification.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-center">
          <a
            href="/gspc-verify"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-emerald-400"
          >
            Verify a card — free <ChevronRight className="h-4 w-4" />
          </a>
          <a
            href="/os"
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/30 px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-white/10"
          >
            Open Council OS
          </a>
          <a
            href="/gspc-arena"
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/30 px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-white/10"
          >
            Council Space
          </a>
        </div>
      </div>
    </section>
  );
}

// ── dense board: OpenRouter-style table of ALL 22 axes ──────
function DenseBoard() {
  const [axes, setAxes] = useState<Axis[]>([]);
  const [publicCount, setPublicCount] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const ac = new AbortController();
    fetchAxes(ac.signal).then((r) => {
      setAxes(r.axes);
      setPublicCount(r.publicCount || "");
      setLoading(false);
    });
    return () => ac.abort();
  }, []);

  return (
    <section className="surface-sunken section-y">
      <div className="section-shell">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-black tracking-tight text-foreground sm:text-3xl">
              The GSPC Board
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Live from <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">GET /api/gspc</code>
              {publicCount && <span className="ml-2 font-semibold text-foreground">{publicCount}</span>}
            </p>
          </div>
          <a
            href="/gspc-scoreboard"
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-bold text-primary-foreground transition-opacity hover:opacity-90"
          >
            Full scoreboard <ChevronRight className="h-4 w-4" />
          </a>
        </div>

        <div className="mt-6 overflow-x-auto rounded-xl border border-border bg-card">
          <table className="w-full min-w-[40rem] text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50 text-left text-xs font-bold uppercase tracking-wide text-muted-foreground">
                <th className="px-4 py-3">Axis</th>
                <th className="px-4 py-3">Instrument</th>
                <th className="px-4 py-3 text-right">Figure</th>
                <th className="px-4 py-3 text-right">n</th>
                <th className="px-4 py-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                    Loading from GET /api/gspc…
                  </td>
                </tr>
              ) : (
                axes.map((a) => {
                  const q = quotable(a);
                  const isMeasured = a.status === "MEASURED";
                  return (
                    <tr
                      key={a.axis}
                      className="border-b border-border last:border-0 hover:bg-muted/30"
                    >
                      <td className="px-4 py-2.5">
                        <span className="font-semibold text-foreground">{a.axis}</span>
                      </td>
                      <td className="px-4 py-2.5 text-muted-foreground">
                        {a.bench || "—"}
                      </td>
                      <td className="px-4 py-2.5 text-right font-mono tabular-nums">
                        {q ? (
                          <span className="font-bold text-primary">
                            {(a.accuracy * 100).toFixed(0)}%
                          </span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="px-4 py-2.5 text-right font-mono tabular-nums text-muted-foreground">
                        {typeof a.n === "number" && a.n > 0 ? a.n : "—"}
                      </td>
                      <td className="px-4 py-2.5 text-center">
                        <span
                          className={`inline-block rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                            isMeasured
                              ? "bg-primary/15 text-primary"
                              : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {a.status}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
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
