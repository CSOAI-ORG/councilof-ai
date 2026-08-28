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
import ToolStack from "../components/home/ToolStack";
import AxisPanel from "../components/os/AxisPanel";
import EnterpriseTrust from "../components/EnterpriseTrust";
import {
  ChevronRight,
  Ban,
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

          {/* Right: static OS screenshot (NOT a live embed — /os one-frame is separate PR) */}
          <div className="relative mx-auto w-full max-w-xl lg:mx-0">
            <div className="overflow-hidden rounded-2xl border border-emerald-500/20 bg-slate-900/50 shadow-2xl shadow-emerald-900/30">
              {/* OS header bar mockup */}
              <div className="flex items-center gap-2 border-b border-white/10 bg-slate-800/80 px-4 py-2.5">
                <span className="h-3 w-3 rounded-full bg-rose-400/70" />
                <span className="h-3 w-3 rounded-full bg-amber-400/70" />
                <span className="h-3 w-3 rounded-full bg-emerald-400/70" />
                <span className="ml-3 text-xs font-medium text-slate-400">Council OS · councilof.ai/os</span>
              </div>
              {/* Static screenshot — hero is a DOOR to /os, not a live embed */}
              <img
                src="/images/band/hardened.png"
                alt="Council OS workspace"
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

// ── Living Board: SAME component as /os uses (AxisPanel) ──────
function LivingBoardSection() {
  return (
    <section className="surface-raised section-y">
      <div className="section-shell">
        {/* The shared AxisPanel component — same one /os Board door uses */}
        <AxisPanel />
        <div className="mt-6 text-center">
          <a
            href="/gspc-scoreboard"
            className="inline-flex items-center gap-2 rounded-lg bg-emerald-700 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-emerald-800"
          >
            Full scoreboard <ChevronRight className="h-4 w-4" />
          </a>
        </div>
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
      <LivingBoardSection />

      {/* Verify door — free forever */}
      <VerifyDoor />

      {/* 4. Doctrine: what we refuse to do */}
      <RefusalBand />

      {/* 5. Trust badges */}
      <EnterpriseTrust />

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
