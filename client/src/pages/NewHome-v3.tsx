/**
 * NewHome-v3 — councilof.ai Homepage
 * Structure: scroll-world hero → living GSPC slots → industries → demographics →
 *   arena→ blog → upsells → enterprise trust
 * White/green palette. AEO-optimised: answer-first blocks, FAQPage schema,
 * H1 in raw HTML. Every section explains what we do for which end-user.
 */
import { useEffect, useState, type ReactNode } from "react";
import EnterpriseTrust from "../components/EnterpriseTrust";
import RegionBanner from "../components/RegionBanner";
import {
  fetchAxes, hasInterval, quotable, wilson, publicCaption,
  type Axis, type InLaneAxis,
} from "../lib/gspcAxes";
import { industriesForGrid } from "../data/industries";
import { useEstateFacts } from "@/lib/estateFacts";
import FaqBlock from "@/components/FaqBlock";
import StoryWorld from "@/components/home/StoryWorld";
import LivingStages from "@/components/home/LivingStages";
import {
  Shield, CheckCircle, Users, Building2,
  Zap, ChevronRight, BarChart3, Gamepad2, TrendingUp,
  Eye, FileCheck, RefreshCw, Ban, Landmark, Scale,
} from "lucide-react";

// ── data ───────────────────────────────────────────────────
const FOUR_BUYERS = [
  { icon: Shield, who: "Insurers", tagline: "Price AI risk on measured evidence", cta: "Start measuring", href: "/insurers", desc: "Underwrite AI deployment policies with measurement cards. The living GSPC board is signed; empty cells stay empty. Verify at GET councilof.ai/api/gspc." },
  { icon: Building2, who: "Regulators", tagline: "Check behaviour against the law", cta: "Crosswalk your framework", href: "/regulators", desc: "Map any AI regulation (EU AI Act, DORA, NIS2, NIST) to a single deterministic instrument set — every provision traceable." },
  { icon: Users, who: "Enterprises", tagline: "Prove your AI before you ship", cta: "Get measured", href: "/?lobby=measured&task=enterprise-start", desc: "Sign, ship, re-attest. No model in the verdict path. Provenance today is Ed25519 over a hash chain — C2PA conformance is not yet available (we are a Contributor member; see /claims-register CR-012). The board includes the axis that catches our own models." },
  { icon: Zap, who: "Developers", tagline: "Verify a signed card — free forever", cta: "Verify a card", href: "/gspc-verify", desc: "Call the signed measurement tools from CI: gate a release, re-check a card, track a run. Counts stay on GET /api/gspc." },
];

// The product family, mirrored from /products (the packaging page) so the two cannot
// state different things about the same product. Six product pages + the hub.
// No prices here or there: verification is free forever and a grade is never sold.
const PRODUCT_FAMILY = [
  {
    name: "GPAI Evidence Pack",
    href: "/gpai-evidence",
    tag: "EU AI Act",
    what: "Independent third-party evidence a GPAI provider can hand the AI Office. Evidence, never a conformity mark — GPAI duties have been live since 2 August 2025.",
  },
  {
    name: "CRA Readiness Kit",
    href: "/cra-readiness",
    tag: "Cyber Resilience Act",
    what: "The 24h / 72h / 14-day ENISA reporting runbook and the signed SBOM workflow we run on ourselves. Template and tooling — not legal advice.",
  },
  {
    name: "Financial axes",
    href: "/financial-axes",
    tag: "Declared slots",
    what: "The declared financial slots of the register. Measured where measured, UNMEASURED and stated where not. Never a credit rating.",
  },
  {
    name: "Distribution integrity",
    href: "/distribution-integrity",
    tag: "Coverage first",
    what: "Represented is not distributed. The committed-versus-distributed spread as a declared axis — coverage stated before any number, currently UNMEASURED.",
  },
  {
    name: "Verify embed / white-label",
    href: "/embed",
    tag: "For your site",
    what: "A self-verifying badge: WebCrypto checks the Ed25519 signature in the reader's own browser. Green only when the bytes are true. Free forever.",
  },
  {
    name: "Legacy modernization on-ramp",
    href: "/cobolbridge",
    tag: "CobolBridge",
    what: "COBOL migration lineage under DORA · Basel · SOX · Solvency II, carried into signed continuous evidence. Pathway status: UNMEASURED, and it says so.",
  },
];

// The refusals. Doctrine is a product feature, so it belongs on the front door in
// plain words rather than buried in the FAQ.
const REFUSALS = [
  { no: "We do not certify", why: "No conformity mark, no badge, no seal, no accreditation chain. We are not a notified body under the EU AI Act or anything else." },
  { no: "We do not sell a grade", why: "Nobody on the board pays for their place on it, their score, or their removal from either. Verification is free forever and needs no account." },
  { no: "We do not publish a number we did not measure", why: "UNMEASURED is a first-class state. An empty cell stays empty — inventing one is the exact behaviour this instrument exists to catch." },
  { no: "We do not let a model judge a model", why: "Every verdict is deterministic code against pre-written gold labels. An AI grading an AI is a correlated error, not an audit." },
  { no: "We do not promote a lead into a win", why: "Where a lead is not statistically separated we call it a tie — including when the model in front is one of ours." },
  { no: "We do not edit history", why: "Re-attestation issues a new signed record; the old one stands. Corrections are appended in public at /api/corrections, never silently applied." },
];

// The Council OS lobby panes. Each `?lobby=<id>` is a real destination that frames the
// live page — the lobby reimplements nothing, so a pane cannot drift from the page it
// shows. Ids are the LobbyTabId union in components/lobby/tabs.ts.
const OS_PANES = [
  { name: "Live board", href: "/?lobby=board", what: "Every published axis, with in-lane measurements beside it" },
  { name: "Verify a card", href: "/?lobby=verify", what: "The offline verifier, inside the workspace" },
  { name: "Get measured", href: "/?lobby=measured", what: "Start a signed assessment of your own system" },
  { name: "Council Space", href: "/?lobby=space", what: "The continuous contest, model against model" },
  { name: "Models", href: "/?lobby=models", what: "What we measured, and what it scored" },
  { name: "Tools", href: "/?lobby=tools", what: "The published MCP surface, runnable" },
  { name: "Report an incident", href: "/?lobby=watchdog", what: "The public intake for behaviour that looks wrong" },
  { name: "Honesty gate", href: "/?lobby=claimguard", what: "What we cannot yet measure, published" },
  { name: "Readiness assessment", href: "/?lobby=ras", what: "Which duties bind you, before you measure" },
  { name: "Library", href: "/?lobby=library", what: "Everything published, dated and sectored" },
];


// STALE UNTIL 2026-08-26. Every card here carried a June headline and linked to
// "/blog/" — the index — so six distinct titles all dumped the reader on the same
// list page, and none of those six slugs is a prerendered page (they serve the SPA
// shell titled "Blog | CSOAI"). Meanwhile the 24 posts that ARE prerendered, several
// from this week, had no link from the front door at all.
//
// The six below are prerendered under dist/client/blog/<slug>/. Title, description
// and date are read from client/src/data/blog-content.ts (the date from each post's
// own JSON-LD datePublished) — nothing here is typed from memory. This list is short
// and hand-picked on purpose: importing blogdata to derive it would pull a ~500KB
// chunk into the home bundle.
interface Post { title: string; date: string; desc: string; href: string; }
const RECENT: Post[] = [
  { title: "AI Governance Benchmarking Is Broken. Here Is the Signed, Reproducible Fix.", date: "2026-08-25", desc: "Three independent sources validated the thesis this year: governance benchmarks are fragmented, non-reproducible and unsigned. Here is the signed, CI-bounded fix.", href: "/blog/governance-benchmarking-is-broken-signed-fix" },
  { title: "Verified Measurement Credential: What It Means and How to Verify", date: "2026-08-25", desc: "A signed, auditable assertion that a specific measurement was taken at a specific time by a specific instrument — and has not been altered since.", href: "/blog/verified-measurement-credential-how-to-verify" },
  { title: "What Is Monitored Containment? The Council of AI Measurement Framework", date: "2026-08-25", desc: "Deploy inside observable boundaries, and let continuous measurement replace trust. The framework, stated plainly — including where it stops.", href: "/blog/what-is-monitored-containment" },
  { title: "EU AI Act Article 50(2): Machine-Readable Marking of AI Output", date: "2026-08-24", desc: "Providers of AI systems generating synthetic content must mark outputs machine-readably and detectably. What that actually requires, and by when.", href: "/blog/eu-ai-act-article-50-machine-readable-marking" },
  { title: "EU AI Act High-Risk Provider Obligations: What a Credential Answers", date: "2026-08-24", desc: "Regulation 2024/1689 layers duties on high-risk providers — Art. 11 documentation, Art. 12 records, Art. 13 transparency. Which of them evidence can actually address.", href: "/blog/eu-ai-act-high-risk-provider-obligations" },
  { title: "SCITT and AI Supply Chain Transparency: Why the IETF Standard Matters", date: "2026-08-24", desc: "Supply Chain Integrity, Transparency and Trust — the IETF work standardising how claims are registered and verified across organisational boundaries.", href: "/blog/scitt-ai-supply-chain-transparency" },
];

// ── sections ───────────────────────────────────────────────
/**
 * Section — the ONE band primitive for this page.
 *
 * Every band was previously writing its own `py-20 px-6 bg-white` (or
 * `bg-gray-50`, or `bg-slate-950`) plus its own `max-w-*`, so nothing lined up
 * and three different neutral families were on screen at once. Now a band picks
 * a `tone` and inherits the shared rhythm (.section-y), shell (.section-shell)
 * and type scale (.t-section/.t-lede) — all defined once in styles/index.css.
 *
 * Colours come from tokens, never from hard-coded greys, so the page is correct
 * in BOTH themes instead of being a white page wearing a dark header.
 */
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

// ── living GSPC grid (honest empties stay empty) ─────────────────────────

// ── problem we fix ─────────────────────────────────────
function ProblemStrip() {
  return (
    <Section
      id="problem"
      title="The problem we fix"
      subtitle="Assertions are cheap. Proof is not. Buyers and regulators are asked to trust a PDF."
      tone="raised"
    >
      <div className="grid gap-5 md:grid-cols-2 md:gap-6">
        <div className="rounded-2xl border border-rose-500/25 bg-rose-500/[0.06] p-6 sm:p-8">
          <p className="t-kicker text-rose-600 dark:text-rose-300">What they sell you</p>
          <h3 className="mt-3 text-xl font-black leading-tight tracking-tight text-foreground sm:text-2xl">A claim you cannot recompute</h3>
          <ul className="t-body mt-5 space-y-3 text-muted-foreground">
            <li>A vendor says the model is safe, aligned, or compliant.</li>
            <li>The evidence is a slide, a badge, or a private report.</li>
            <li>You cannot run the same test. You cannot see what was left unmeasured.</li>
            <li>Six months later the model has changed and the PDF has not.</li>
          </ul>
        </div>
        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/[0.07] p-6 sm:p-8">
          <p className="t-kicker text-emerald-700 dark:text-emerald-300">What we issue</p>
          <h3 className="mt-3 text-xl font-black leading-tight tracking-tight text-foreground sm:text-2xl">A card anyone can check</h3>
          <ul className="t-body mt-5 space-y-3 text-muted-foreground">
            <li>We run the system on frozen, published instruments.</li>
            <li>We sign the result. You keep the card — under a kilobyte, yours to hold.</li>
            <li>Unmeasured slots stay empty. No invented scores.</li>
            <li>Re-attest is a new record, never an edit of the old one.</li>
          </ul>
        </div>
      </div>
    </Section>
  );
}

const USPS = [
  { icon: FileCheck, title: "Signed measurement card", body: "Ed25519-signed, under a kilobyte: axis, model, accuracy, issuer, date and the previous card's hash. Verify stays free and loginless. A grade is never sold.", href: "/assess" },
  { icon: Eye, title: "Anyone can check", body: "The verify path is public. We do not put it behind an account or a fee.", href: "/gspc-verify" },
  { icon: Scale, title: "Honest living board", body: "Empty cells stay empty. Jail is a measured floor when the stamp says so. Live counts: GET /api/gspc.", href: "/gspc-scoreboard" },
  { icon: Gamepad2, title: "Council Space", body: "The live contest. Model versus model. Every round is evidence, not a brochure.", href: "/gspc-arena" },
  { icon: Landmark, title: "Council City", body: "A live view over the same signed records the board is built from — a different window on the measurements, not a second source of them.", href: "/gspc-arena?view=towns" },
  { icon: RefreshCw, title: "Re-attest, never edit", body: "A new signed record. History stays. Drift is visible.", href: "/methodology" },
  { icon: Ban, title: "No money from what we rank", body: "We do not sell ratings and we do not take a cut from anything on the board.", href: "/methodology" },
  { icon: Shield, title: "Measurement credential", body: "Not a certification. Not a notified body. We measure, sign, and keep the evidence.", href: "/gspc-verify" },
];

function UspGrid() {
  return (
    <Section
      id="usps"
      title="What you actually get"
      subtitle="The product is the stack: measure, sign, live contest, living layer. The scoreboard is how people cite it."
      tone="raised"
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {USPS.map(u => (
          <a key={u.title} href={u.href} className="card-quiet group flex flex-col p-5 sm:p-6">
            <u.icon className="mb-4 h-7 w-7 text-primary" />
            <h3 className="t-card text-foreground transition-colors group-hover:text-primary">{u.title}</h3>
            <p className="t-body mt-2 flex-1 text-muted-foreground">{u.body}</p>
          </a>
        ))}
      </div>
    </Section>
  );
}

// ── the product family ─────────────────────────────────
// The six product pages shipped without a single link from the front door: they were
// reachable only from /products and from four-items-deep inside a nav dropdown.
function ProductBand() {
  return (
    <Section
      id="products"
      title="What you can actually get"
      subtitle="Six products, one engine: Ed25519 over canonical JSON (not JCS — see /signed/HOW-TO-VERIFY.md), three-state verdicts (pass / fail / UNMEASURED), every public number recomputable from a live API. Verification is free forever, a grade is never sold, and there are no public prices."
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
      <div className="mt-10 flex flex-col items-stretch gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-center">
        <a href="/products" className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3.5 text-sm font-extrabold text-primary-foreground transition-opacity hover:opacity-90">
          All products, one page <ChevronRight className="h-4 w-4" />
        </a>
        <a href="/assess" className="inline-flex items-center justify-center gap-2 rounded-xl border border-primary/40 px-6 py-3.5 text-sm font-extrabold text-primary transition-colors hover:bg-primary/10">
          Get a free signed assessment
        </a>
      </div>
    </Section>
  );
}

// ── the refusals ───────────────────────────────────────
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
      <div className="mt-10 text-center">
        <a href="/honesty" className="inline-flex items-center gap-2 text-sm font-bold text-primary hover:underline">
          <Eye className="h-4 w-4" /> The honesty gate — everything we cannot yet measure
        </a>
      </div>
    </Section>
  );
}

// ── Council OS + ledger: ONE ink region, not two competing darks ───────────
//
// These two bands used to be `bg-slate-950` (#020617, a BLUE-black) stacked
// directly on `bg-emerald-900` (#064e3b, a muddy mid-green). Two unrelated dark
// hues touching each other, neither of them the ink the rest of the estate uses
// (#04120c, which is what EnterpriseTrust and the deck heroes already ship).
// That is the "black sections don't match branding" complaint, exactly.
//
// They are now one continuous `.surface-ink` region divided by an emerald
// hairline, so the page reads as ONE dark chapter between two light ones
// instead of two clashing slabs.
function CouncilOsBand() {
  return (
    <section className="section-y surface-ink">
      <div className="section-shell">
        <p className="t-kicker ink-kicker text-center">Council OS</p>
        <h2 className="t-section mt-4 text-center">One workspace over the whole rail</h2>
        <p className="t-lede measure measure-center ink-muted mt-4 text-center">
          The OS does not reimplement any page — each pane frames the live one, so a pane can
          never drift from the surface it shows. The concierge answers from published
          measurement or it refuses.
        </p>
        {/* 10 panes. A 3-column grid left a ragged 1-of-3 final row and a slab of
            dead space under it; 5 columns resolves to two clean rows of five. */}
        <div className="mt-10 grid gap-3 sm:mt-12 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
          {OS_PANES.map(t => (
            <a key={t.href} href={t.href} className="ink-card group flex flex-col rounded-2xl p-4 sm:p-5">
              <h3 className="text-sm font-extrabold leading-snug transition-colors group-hover:text-emerald-300">{t.name}</h3>
              <p className="ink-muted mt-1.5 text-xs leading-relaxed">{t.what}</p>
            </a>
          ))}
        </div>
        <div className="mt-10 flex flex-col items-stretch gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-center">
          <a href="/os" className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-400 px-6 py-3.5 text-sm font-extrabold text-[#04120c] transition-colors hover:bg-emerald-300">
            Open Council OS <ChevronRight className="h-4 w-4" />
          </a>
          <a href="/?lobby=home" className="inline-flex items-center justify-center gap-2 rounded-xl border border-emerald-400/35 px-6 py-3.5 text-sm font-extrabold text-emerald-100 transition-colors hover:bg-emerald-400/10">
            Start in the lobby
          </a>
        </div>
      </div>
    </section>
  );
}

// ── ledger attestation / evidence-that-travels ────────────────
function LedgerAttestBand() {
  return (
    <section className="section-y-sm surface-ink border-t" style={{ borderColor: "var(--ink-border)" }}>
      <div className="section-shell flex flex-col items-start gap-7 lg:flex-row lg:items-center lg:justify-between lg:gap-12">
        <div className="measure">
          <p className="t-kicker ink-kicker">Interop — evidence that travels</p>
          <h3 className="mt-3 text-2xl font-black leading-tight tracking-tight sm:text-3xl">Attach a signed card to a public ledger</h3>
          <p className="t-body ink-muted mt-3">
            Permissionless attach: we bind signed measurement evidence to accounts we do not control,
            so a stranger can verify it without us. A devnet-proven capability — never a rating, never an investment.
          </p>
        </div>
        <a
          href="/xrpl-attest"
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-emerald-400 px-6 py-3.5 text-sm font-extrabold text-[#04120c] transition-colors hover:bg-emerald-300 sm:text-base"
        >
          Attestation on the ledger <ChevronRight className="h-4 w-4" />
        </a>
      </div>
    </section>
  );
}

function AxesGrid() {
  const [axes, setAxes] = useState<Axis[]>([]);
  const [inLane, setInLane] = useState<InLaneAxis[]>([]);
  const [subtitle, setSubtitle] = useState("GSPC (Governance · Safety · Provenance · Continuity). Slot counts are live on GET /api/gspc — we do not type them into this page.");

  useEffect(() => {
    const ac = new AbortController();
    fetchAxes(ac.signal).then((r) => {
      setAxes(r.axes);
      setInLane(r.inLane);
      setSubtitle(`${publicCaption(r.publicCount)}. Empty cells stay empty.`);
    });
    return () => ac.abort();
  }, []);

  return (
    <Section title="The GSPC measurement slots" subtitle={subtitle} tone="sunken">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {axes.map(a => {
          const q = quotable(a);
          const ci = hasInterval(a) ? wilson(a.accuracy, a.n) : null;
          // Prefer the resolved bank URL the API now publishes (dataset_url); fall back to
          // the slug only while the wire has not shipped it. Never build the host here —
          // it lives in ONE place, functions/api/gspc.ts.
          const href = a.dataset_url || (a.dataset ? `https://huggingface.co/datasets/${a.dataset}` : "/gspc-scoreboard");
          return (
            <a key={a.axis} href={href} className="card-quiet group block p-5">
              <div className="mb-2.5 flex items-center justify-between gap-2">
                <span className="text-sm font-bold text-foreground/80">{a.bench}</span>
                {/* `unmeasured` is a first-class published status — it keeps a real
                    badge here, legible in both themes, never dimmed out of view. */}
                <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                  q ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground ring-1 ring-border"
                }`}>
                  {a.status}
                </span>
              </div>
              <h3 className="t-card text-foreground transition-colors group-hover:text-primary">{a.axis}</h3>
              <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-muted-foreground">{a.task || a.seat}</p>
              {q && (
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-2xl font-black tabular-nums text-primary">{(a.accuracy * 100).toFixed(0)}</span>
                  <span className="text-[11px] tabular-nums text-muted-foreground">n={a.n}{ci ? ` · [${(ci[0]*100).toFixed(0)}–${(ci[1]*100).toFixed(0)}%]` : ""}</span>
                </div>
              )}
              {!q && <div className="mt-3 text-xs italic text-muted-foreground">no score on this stamp</div>}
            </a>
          );
        })}
      </div>
      {inLane.length > 0 && (
        <div className="mt-6 rounded-2xl border border-dashed border-border bg-muted/60 p-5 sm:p-6">
          <h3 className="t-card text-foreground">In-lane — not board rows</h3>
          <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">Published as measured_in_lane on GET /api/gspc. Not counted in totals.public_count.</p>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            {inLane.map((e) => (
              <div key={e.axis} className="card-quiet p-5">
                <div className="mb-2.5 flex items-center justify-between gap-2">
                  <span className="text-sm font-bold text-foreground/80">{e.bench}</span>
                  <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground ring-1 ring-border">
                    {e.status}
                  </span>
                </div>
                <h3 className="t-card text-foreground">{e.axis}</h3>
                <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-muted-foreground">{e.task}</p>
                {e.n > 0 && (
                  <div className="mt-3 text-xs tabular-nums text-muted-foreground">n={e.n} · {(e.accuracy * 100).toFixed(0)}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
      <div className="mt-10 text-center">
        <a href="/gspc-scoreboard" className="inline-flex items-center gap-2 text-sm font-bold text-primary hover:underline">
          <BarChart3 className="h-4 w-4" /> Open the live scoreboard — counts from GET /api/gspc
        </a>
      </div>
    </Section>
  );
}

// ── the signed card chain ───────────────────────────────────────────────────
// Every number here comes from GET /api/state -> card_chain, which is built from
// scripts/derive-chain-facts.mjs re-verifying every published body with the same
// verifier we ship. Nothing on this page types a count.
//
// The load-bearing pair is withheld / withheldAttested. Publishing "22 withheld,
// every position accounted for" alone would present a DISCLOSURE as a PROOF: the
// chain manifest carries no signature of its own, so only the withheld ids that a
// published card's SIGNED body names as `prev` are actually attested. That is one
// of the twenty-two, and the copy says one.
function CardChainBand() {
  const f = useEstateFacts();
  return (
    <Section
      id="chain"
      title="What you can check without asking us"
      subtitle="The board says what we measured. This says what we published, and exactly how far the cryptography reaches."
      bg="bg-gray-50"
    >
      <div className="grid gap-5 lg:grid-cols-3">
        <div className="rounded-2xl border border-emerald-200 bg-white p-6 lg:col-span-2">
          <p className="text-[11px] font-bold uppercase tracking-widest text-emerald-700">Published and verifying</p>
          <p className="mt-3 text-[15px] leading-relaxed text-gray-700">{f.verifiedSentence}</p>
          <p className="mt-3 text-sm leading-relaxed text-gray-500">
            Each card carries its own signature bytes, the public key, and the preimage rule that
            says exactly which bytes were signed. A zero-dependency JavaScript verifier ships at{" "}
            <code className="text-[12px]">/signed/verify-card.mjs</code> and the rule is written out at{" "}
            <code className="text-[12px]">/signed/HOW-TO-VERIFY.md</code>. Pin our key from{" "}
            <code className="text-[12px]">/.well-known/did.json</code> first — a card checked against
            the key it ships with proves only that the file is self-consistent.
          </p>
        </div>
        <div className="rounded-2xl border border-amber-200 bg-amber-50/60 p-6">
          <p className="text-[11px] font-bold uppercase tracking-widest text-amber-700">Withheld, and the limit of the proof</p>
          <p className="mt-3 text-[15px] leading-relaxed text-gray-700">{f.withheldSentence}</p>
          <p className="mt-3 text-sm leading-relaxed text-gray-500">
            We would rather publish that limit than let a complete-looking manifest do work a
            signature has not done. Read the positions yourself at{" "}
            <code className="text-[12px]">/signed/chain.json</code>.
          </p>
        </div>
      </div>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <a href="/gspc-verify" className="inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-6 py-3 text-sm font-extrabold text-white hover:bg-emerald-800">
          Verify a card yourself <ChevronRight className="w-4 h-4" />
        </a>
        <a href="/api/state" className="inline-flex items-center gap-2 rounded-xl border-2 border-emerald-200 px-6 py-3 text-sm font-extrabold text-emerald-700 hover:bg-emerald-50">
          GET /api/state — where these numbers come from
        </a>
      </div>
    </Section>
  );
}

// ── demographics ───────────────────────────────────
function BuyerCards() {
  return (
    <Section title="Built for the people who get audited" subtitle="One instrument, four audiences. Pick your path — every CTA leads to the same measurement, signed." tone="raised">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {FOUR_BUYERS.map(b => (
          <a key={b.who} href={b.href} className="card-quiet group flex flex-col p-5 sm:p-6">
            <b.icon className="mb-4 h-7 w-7 text-primary" />
            <h3 className="text-lg font-extrabold tracking-tight text-foreground">{b.who}</h3>
            <p className="mt-1 text-sm font-semibold text-primary">{b.tagline}</p>
            <p className="t-body mt-2.5 flex-1 text-muted-foreground">{b.desc}</p>
            <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-bold text-primary">
              {b.cta} <ChevronRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
            </span>
          </a>
        ))}
      </div>
    </Section>
  );
}

// ── industries ───────────────────────────────────
// This grid used to hardcode seven sectors (Health, Finance, Transport, Retail,
// Education, Energy) that are NOT the canonical set, link them at legacy content
// slugs, and then advertise "5 more sectors" and "all 12 sectors" — two typed counts
// that disagreed with each other AND with the data. It now renders the canonical
// array and derives every count from its length.
function IndustryGrid() {
  const shown = industriesForGrid.slice(0, 7);
  const rest = industriesForGrid.length - shown.length;
  return (
    <Section title="One instrument, every industry" subtitle="The same living GSPC instrument applies — whether you build autonomous machinery, underwrite insurance, or run agents that transact. Measure once, evidence everywhere." tone="sunken">
      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {shown.map(i => (
          <a key={i.slug} href={`/industries/${i.slug}`} className="card-quiet group flex flex-col p-5">
            <h4 className="t-card text-foreground transition-colors group-hover:text-primary">{i.name}</h4>
            <p className="mt-1.5 flex-1 text-xs leading-relaxed text-muted-foreground">{i.short}</p>
            {/* UNMEASURED must stay as visible as a measured figure — same size,
                same weight, same slot. It is a published status, not an absence. */}
            <span className="mt-4 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              {/* `numbers` was removed from industries.ts deliberately — the sector data file
                  is not allowed to carry a typed n. This reads what the file DOES carry: the
                  bench, and the axis count from the axes array. Neither is typed by hand. */}
              {i.bench ? `${i.bench} · ${i.axes.length} ${i.axes.length === 1 ? "axis" : "axes"}` : "UNMEASURED"}
            </span>
          </a>
        ))}
        {rest > 0 && (
          <a href="/industries" className="group flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-muted/40 p-5 text-center transition-colors hover:border-primary/40 hover:bg-muted/70">
            <span className="text-3xl leading-none text-muted-foreground">+</span>
            <h4 className="t-card mt-3 text-foreground">{rest} more sectors</h4>
            <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
              {industriesForGrid.slice(7).map(i => i.name).join(", ")}
            </p>
          </a>
        )}
      </div>
      <div className="mt-10 text-center">
        <a href="/sectors" className="text-sm font-bold text-primary hover:underline">
          Sector tooling — regulator, insurer, bond, legacy, vendor →
        </a>
      </div>
    </Section>
  );
}

// ── blog strip ───────────────────────────────
function BlogStrip() {
  return (
    <Section title="Latest insights" subtitle="Short, regulatory, zero-marketing reads. One AEO-answer per post." tone="sunken">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {RECENT.slice(0, 6).map(p => (
          <a key={p.href} href={p.href} className="card-quiet group flex flex-col p-5 sm:p-6">
            <span className="text-[10px] font-semibold uppercase tracking-wide tabular-nums text-primary">{p.date}</span>
            <h4 className="mt-2.5 text-base font-extrabold leading-snug tracking-tight text-foreground transition-colors group-hover:text-primary">{p.title}</h4>
            <p className="t-body mt-2 line-clamp-3 flex-1 text-muted-foreground">{p.desc}</p>
            <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-bold text-primary">
              Read <ChevronRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
            </span>
          </a>
        ))}
      </div>
      <div className="mt-10 text-center">
        <a href="/blog" className="text-sm font-bold text-primary hover:underline">All posts →</a>
      </div>
    </Section>
  );
}

// ── upsells ────────────────────────────

// ── FAQ — 21 answers, the whole proposition in plain English ──────────
// AEO/GEO: FaqBlock renders these as a native <details> accordion (crawlable
// with JS off, keyboard-operable) AND emits FAQPage JSON-LD for exactly these
// 21 pairs. Register rules apply to every answer: measurement not certification;
// counts are named with the endpoint and the stamp they came from, never floated
// free; UNMEASURED is a state, not a failure; no timestamp-authority or
// blockchain-anchoring claim (there is none — the anchor is Ed25519 over a
// SHA-256 hash chain); the council figure is DESIGN and is labelled as such.
const HOME_FAQ = [
  {
    q: "What is Council of AI?",
    a: "Council of AI (legally CSOAI Ltd, UK Companies House 16939677) is an independent measurement body for AI behaviour. We run AI systems against frozen, published tests drawn from real statute, grade the answers with deterministic code, sign the result with an Ed25519 key, and publish it — including the parts we could not measure. We are the instrument, not the referee: we produce evidence, and regulators, insurers and buyers decide what to do with it.",
  },
  {
    q: "What is a measurement card?",
    a: "A measurement card is the output: a small signed record — under a kilobyte of JSON — holding the axis measured, the exact model, the accuracy, who issued it, when it was created, the hash of the card before it in the chain, and the Ed25519 signature over all of that. That is the whole of it. Sample sizes, confidence intervals and separation determinations live on the board at GET councilof.ai/api/gspc, not inside the card; a card tells you a specific measurement happened and has not been altered since, and the board tells you how much weight it carries. It is small enough to email, attach to a tender, or keep in a compliance folder, and it is yours to hold — it does not live on our server for us to quietly amend later.",
  },
  {
    q: "How do I verify a measurement card myself?",
    a: "Three steps, and none of them involve us. First, fetch our public key from /.well-known/did.json and check the card carries that exact key — a card verified against the key it ships with proves only that the file is self-consistent, not that we issued it. Second, canonicalise the card's body — every key sorted, no whitespace — and take the SHA-256; that hash must equal the card's id. Third, verify the Ed25519 signature over those same bytes. One warning that matters if you implement this outside Python: the bytes were produced by CPython, which writes a float of integral value as 0.0 where JavaScript and Go write 0, so a naive verifier reports a false failure on a large minority of the set. We publish a zero-dependency JavaScript verifier that handles it at /signed/verify-card.mjs, and the exact rule at /signed/HOW-TO-VERIFY.md. The whole check runs offline, with no CSOAI code, no account and no permission — or in your browser at councilof.ai/gspc-verify. Note what is not in that chain: there is no RFC-3161 timestamp authority and no OpenTimestamps or blockchain anchoring, and our records say so with timestamp_authority: none. The anchor is the signature over the hash chain — a smaller claim you can check in seconds rather than a larger one you have to take on faith.",
  },
  {
    q: "What does a “measured of N” figure on the board mean?",
    a: "It is a coverage statement, not a grade: how many slots on the current stamp carry a measured result, versus how many are described honestly or left empty. We do not type that fraction into this page — read totals.public_count from GET councilof.ai/api/gspc, which is also where the stamp date lives.",
  },
  {
    q: "Why is a slot ever left UNMEASURED?",
    a: "Because measuring it properly is not possible yet, and inventing a number would be worse than an empty cell. A slot stays UNMEASURED when the sample is too small to quote — we do not publish a score below thirty graded items — or when the instrument has not been frozen and published, or when the legal gold labels are still with counsel. UNMEASURED is not a failing grade for the AI system; it is a disclosure about us. Silently filling that gap is the exact behaviour this whole instrument exists to catch.",
  },
  {
    q: "What is jail, or containment?",
    a: "Jail asks a blunt question: can this model be talked out of its own guardrails and made to act outside its sandbox? It is a measured floor, not a ranking. It was measured on a smaller fleet than the main board and on its own set of gold cells, and its separation has now been tested and came back a TIE — meaning no model on it is separated from the others at p<0.05, so we name no winner. All of that is printed on the axis rather than hidden behind it, and the current separation counts live in the totals block of GET /api/gspc. The best detector we measured still misses most escapes, and we publish that too.",
  },
  {
    q: "Why do you report a tie instead of naming a winner?",
    a: "Because most leads on a leaderboard are noise. When one model scores a little higher than another, we run a McNemar test on the items where the two actually disagreed. If the difference is not statistically separated, we call it a tie and we do not count it as a win — even when the model in front is one of ours. On the current board most axes are ties, and the exact split of separated leads to ties is published in the totals block of GET /api/gspc. A ranking that promotes every point-estimate lead to a victory is selling you a decimal point.",
  },
  {
    q: "Who pays Council of AI, and who never pays?",
    a: "No company we measure pays for its place on the board, its score, or its removal from either. Members of the public never pay us anything. Verification is free forever and needs no account. We fund ourselves by selling signed evidence artefacts — an attested report, a published dataset, a scheduled re-attestation — which are published whether the result flatters the buyer or not, and never as a fee for a ranking or a placement. If you can verify it, it is not behind a paywall.",
  },
  {
    q: "What does Council of AI NOT do?",
    a: "We do not certify. We do not accredit, and there is no accreditation chain behind us; we are not a notified body under the EU AI Act or anything else. We do not enforce — we cannot approve, ban, fine or clear any system. We issue no conformity mark, no badge and no seal for anyone to put in a footer. And a measurement card is not legal advice: it describes what a system did on published tests on a stated date, which is a narrower and more useful thing than a compliance verdict.",
  },
  {
    q: "Which regulations and frameworks do you cover?",
    a: "Two different things, and they are worth separating. The frozen provision bank is anchored by a published corpus hash inside the signed Article 50 pack at /packs/eu-article-50/provbench.json — that anchor, not a number on this page, is what fixes how many provisions were in the bank when it was signed. The published crosswalk is narrower than the bank: /crosswalk/east-west-v1.json maps one signed measurement across four regimes — the EU AI Act, the UK DRCF alignment, Illinois SB 315 and the Chinese TC260 alignment. Mappings to NIST AI RMF and ISO/IEC 42001 are described on our framework pages but are not in that published crosswalk, so treat them as described rather than as verified. New instruments are added as regulation actually lands, not when it is announced.",
  },
  {
    q: "What happens when the law changes?",
    a: "We watch the primary sources — EUR-Lex, legislation.gov.uk and the national registers — by hash, and we publish a dated deadline feed at councilof.ai/api/regulation. When a provision genuinely changes, we re-measure the affected systems and issue a delta card. The old card is not withdrawn, expired or overwritten: history here is append-only, so the record of what was true in August still reads correctly next year. Where the effective date of an obligation is genuinely disputed, we record the dispute rather than resolve it silently.",
  },
  {
    q: "How does a company get measured?",
    a: "Today there are two different things behind that question and we will not blur them. The free self-serve tool at /assess is a deterministic EU AI Act classifier: you describe the system in text, and a keyword decision table returns the Annex III tier and the gaps against a fixed Article 9–15/50 control set. It never contacts your endpoint and it is not a bench run, so it cannot tell you how your model behaves. A GSPC bench run — your system answering a frozen, published bank, graded deterministically, ending in a card that joins the chain — is not yet self-serve; it is arranged with us directly, and the honest reason is capacity, not policy. Both use the same items, the same grader and the same thresholds every other subject faced, so results stay comparable, and you get back what we could not fill as well as what we could.",
  },
  {
    q: "What do regulators get from a measurement card?",
    a: "A behavioural record they can re-compute themselves, rather than a supplier's assurance about its own product. Each provision in our bank is traceable from the statute text through to the specific items that test it, so a supervisor can see exactly what was asked and how the answer was graded. The card is signed, so its provenance survives being forwarded, and the empty slots tell a regulator where evidence does not yet exist — which is often the more actionable half.",
  },
  {
    q: "What do insurers get from a measurement card?",
    a: "Something to price against. Underwriting AI deployment risk currently means reading a questionnaire the applicant filled in about itself. A measurement card is instead an observed behavioural sample, with its sample size and interval published beside it on the board, so exposure can be reasoned about from behaviour rather than from a self-declaration. Scheduled automatic re-attestation is not yet available — re-measurement today is arranged run by run — so track drift by comparing dated cards rather than by expecting a subscription feed. We are the rail, not the referee: we do not tell an insurer what to charge, and we take no share of anything written on the back of a card.",
  },
  {
    q: "How does the arena work?",
    a: "Two systems face the same frozen items. Each match is a subject, an instrument and a fixed rule — never an opinion. The verdict is a predicate: the answer either satisfies the provision or it does not, and ties are reported as ties. Any round can be promoted into a signed card; practice runs stay practice and are never quoted. We do not publish an uptime figure for the arena and we are not going to imply one — how continuously it has actually run is unmeasured, and /api/state says so rather than us calling it round-the-clock.",
  },
  {
    q: "Why does no model ever judge another model?",
    a: "Because an AI grading an AI is a correlated error, not an audit — the judge shares the blind spots of the thing it is judging, and the score becomes a measure of family resemblance. Every verdict we publish comes from deterministic code against pre-written gold labels, so the same input always produces the same grade and you can read the grader yourself. Where a response cannot be parsed into a label at all, it is counted as unmeasured rather than silently scored as a wrong answer.",
  },
  {
    q: "What happens when Council of AI gets something wrong?",
    a: "It goes in the public corrections ledger at councilof.ai/api/corrections, which is appended and never edited or deleted. Each entry records what was wrong, how it was caught, and what changed. The hardest example is on that record: we had published a consensus guarantee for our council architecture, then measured how independent those seats actually were and found the effective number was n_eff 1.21 out of a nominal 3. The guarantee did not hold, so we retracted it (DR-0007) instead of rewording it. The council remains a designed 33-seat structure with a designed 23-of-33 threshold, and it is labelled as a design figure everywhere it appears.",
  },
  {
    q: "Can I see the actual tests and the scoring code?",
    a: "Yes, and you should. The instrument banks are published as open datasets, the grading harness is public, and the per-item rows behind every published score are the same rows we scored. That is the point of freezing an instrument: a benchmark you cannot re-run is a press release. If you re-run it and get a different answer to ours, that is a correction we want, and it goes in the ledger under your name.",
  },
  {
    q: "Is my result published, or is it mine to share?",
    a: "Yours. The card is signed but disclosure is your decision — hand it to a customer, attach it to a regulatory filing, or keep it entirely private. The signing key is public, so whoever you do show it to can verify it without contacting us and without us learning that they did. What we publish on the open board is our own model fleet and the systems whose owners chose publication.",
  },
  {
    q: "What is the difference between MEASURED, UNMEASURED and REPORTED?",
    a: "They are three different kinds of claim and we never merge them. MEASURED means we ran it on our own frozen instruments and signed the result; that is the only state that goes on the board. UNMEASURED means the cell is honestly empty — too small a sample, no separation test, or an instrument not yet frozen. REPORTED means a figure published by somebody else, cited and dated, carried for context and left unsigned; the human-performance baselines you see beside our AI figures are REPORTED aggregates from other people's studies, not our own collection. A REPORTED number never enters our board and is never averaged with a MEASURED one.",
  },
  {
    q: "How does an AI agent or an answer engine read all of this?",
    a: "The same way you do, only faster. The board is machine-readable at GET councilof.ai/api/gspc, third-party figures at /api/reported, the corrections ledger at /api/corrections, the signing keys at /.well-known/did.json and the dated deadline feed at /api/regulation. There is a summary for language models at /llms.txt and the endpoints are documented at /api-docs. Everything an agent needs to verify a claim is served without an account, because a trust layer that requires a login is not a trust layer.",
  },
];

// ── SEO / schema ─────────────────────────
// (qa-sweep 2026-08-19) The page-level WebSite + FAQPage constants were REMOVED:
// the shell (client/index.html) already ships the canonical WebSite node, and the
// FaqBlock below emits the FAQPage node for exactly the FAQ this page renders —
// the extra copies made the prerendered home carry duplicate WebSite/FAQPage
// JSON-LD, which answer engines treat as conflicting claims. The removed WebSite
// node also asserted a SearchAction the shell audit (2026-08-14) had already
// declined to claim until /search?q= is verified.

// ── export ───────────────────────────────
export default function NewHomeV3() {
  return (
    /* Surface rhythm: raised → sunken → raised → sunken, so each band is
       separated by a ground change rather than by a stray hairline <div>.
       The old `border-b border-gray-100` spacers sat BETWEEN sections that
       often shared a background, which read as an arbitrary line across an
       otherwise continuous field. They are gone; where two same-tone bands
       meet, the tone alternation does the work. */
    <main className="surface-base">

      <StoryWorld />
      <ProblemStrip />
      {/* The board first — "what is measured right now" is the claim everything
          else rests on, so it precedes anything sellable. */}
      <AxesGrid />
      <CardChainBand />
      <ProductBand />
      <RefusalBand />
      <UspGrid />
      <CouncilOsBand />
      <LedgerAttestBand />
      <BuyerCards />
      <IndustryGrid />
      <LivingStages />
      <BlogStrip />

      {/* existing trust strip with C2PA/OIN/LOT badges */}
      <EnterpriseTrust />
      {/* Keep the region-detection banner — but ON the ink ground it was designed
          for. It is a dark-styled card (emerald-100 type, black/40 pills) and it
          was floating on the light page with a stray 143px gap above it, reading
          as an orphan. It now continues the trust band's ink region. */}
      <div className="surface-ink pb-12 sm:pb-16">
        <div className="section-shell">
          <RegionBanner />
        </div>
      </div>

      {/* FAQ — 21 answers, native <details> accordion + FAQPage JSON-LD (AEO) */}
      <FaqBlock
        title="Questions people ask"
        intro={`${HOME_FAQ.length} plain-English answers: what we measure, what we refuse to claim, and how to check any of it yourself.`}
        items={HOME_FAQ}
      />
    </main>
  );
}
