/**
 * NewHome-v3 — councilof.ai Homepage (OWNER STACK 2026-08-28)
 *
 * First paint is the instrument: H1 Council of AI, live totals from GET /api/gspc,
 * filled vs hollow cells from the payload, Verify first. OS is tertiary. Empty stays empty.
 */
import ToolStack from "../components/home/ToolStack";
import HeroBoard from "../components/home/HeroBoard";
import LiveLeaderboard from "../components/board/LiveLeaderboard";
import HeroSlides from "../components/HeroSlides";
import {
  ChevronRight,
  FileCheck,
  Monitor,
  BarChart3,
  Shield,
  Gamepad2,
  Cpu,
  Link2,
} from "lucide-react";

// ── End-user outcomes — real surfaces, owned images ───────────────────────
const OUTCOMES: {
  title: string;
  desc: string;
  href: string;
  image?: string;
  icon: typeof Monitor;
  status?: string;
}[] = [
  {
    title: "Humans vs AI arena",
    desc: "Step in, probe a system, get a signed result. Practice runs stay practice; measured runs count.",
    href: "/gspc-arena",
    image: "/images/coliseum_humans_vs_humanoids.jpg",
    icon: Gamepad2,
  },
  {
    title: "Living GSPC board",
    desc: "Every axis we publish, live from GET /api/gspc. Measured cells show a figure; empty cells stay empty.",
    href: "/gspc-scoreboard",
    image: "/images/coliseum_logic_duel.jpg",
    icon: BarChart3,
  },
  {
    title: "XRPL attestation",
    desc: "Devnet-proven ledger attestation. Cards anchored to XRP Ledger for tamper-evident history.",
    href: "/xrpl-attest",
    image: "/images/secure_evidence_vault.jpg",
    icon: Link2,
    status: "devnet",
  },
  {
    title: "OpenTelemetry harness",
    desc: "OTEL-instrumented measurement runs. Every call traced, every verdict reproducible.",
    href: "/benchmarks",
    image: "/images/liveness_drift_engine.jpg",
    icon: Cpu,
  },
  {
    title: "MCP tool fleet",
    desc: "Governed MCP servers: crosswalk, risk-check, evidence-pack. Inspect on /mcp-fleet.",
    href: "/mcp-fleet",
    image: "/images/public_watchdog_intake.jpg",
    icon: Shield,
  },
  {
    title: "Training arenas",
    desc: "Six arenas serving frozen items, marked by the same published key. You vs the AI, scored.",
    href: "/arena",
    image: "/images/literacy_training_arena.jpg",
    icon: Monitor,
  },
];

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

// ── Living Board: shared component from @/components/board ──────
// LiveLeaderboard: self-contained, uses useGspcBoard(), same GET as /os.
// Empty stays empty. 22·15·7.
function LivingBoardSection() {
  return (
    <section className="surface-raised section-y">
      {/* LiveLeaderboard owns its fetch via useGspcBoard — same shared hook */}
      <LiveLeaderboard showHumanPanel={false} />
    </section>
  );
}

// ── outcomes: what you actually get ───────────────────────────────────────
function OutcomesBand() {
  return (
    <section className="surface-sunken section-y">
      <div className="section-shell">
        <h2 className="t-section text-center text-foreground">What you get</h2>
        <p className="t-lede measure measure-center mt-4 text-center text-muted-foreground">
          Real surfaces, real images, real links. Empty cells stay empty. Every figure from a live API.
        </p>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {OUTCOMES.map((o) => (
            <a
              key={o.title}
              href={o.href}
              className="group relative flex flex-col overflow-hidden rounded-xl border border-border bg-card transition-shadow hover:shadow-lg"
            >
              {o.image && (
                <div className="relative aspect-[16/9] overflow-hidden">
                  <img
                    src={o.image}
                    alt=""
                    className="absolute inset-0 h-full w-full object-cover transition-transform group-hover:scale-105"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  {o.status && (
                    <span className="absolute right-3 top-3 rounded-full bg-amber-500/90 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white">
                      {o.status}
                    </span>
                  )}
                </div>
              )}
              <div className="flex flex-1 flex-col p-5">
                <div className="flex items-start gap-3">
                  <o.icon className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden />
                  <h3 className="text-base font-bold leading-snug text-foreground group-hover:text-primary">
                    {o.title}
                  </h3>
                </div>
                <p className="mt-2.5 flex-1 text-sm text-muted-foreground">{o.desc}</p>
                <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-primary">
                  Open <ChevronRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                </span>
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── USP strip: what makes this different ───────────────────────────────────
function USPStrip() {
  const SIGNALS = [
    { icon: "✶", label: "Ed25519 signed", sub: "Every card cryptographically signed" },
    { icon: "⚖", label: "Live axis counts", sub: "GET /api/gspc — never typed" },
    { icon: "◫", label: "Framework alignment", sub: "EU AI Act · NIST · ISO 42001 · DORA" },
    { icon: "🔓", label: "Verification free forever", sub: "No account, no fee" },
  ];

  return (
    <section className="section-y-sm surface-ink border-y" style={{ borderColor: "var(--ink-border)" }}>
      <div className="section-shell">
        <p className="t-kicker ink-kicker text-center font-mono">Measurement, not certification</p>
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {SIGNALS.map((s) => (
            <div key={s.label} className="ink-card flex flex-col items-center rounded-xl px-3 py-5 text-center">
              <span className="text-xl leading-none text-emerald-300/90" aria-hidden>{s.icon}</span>
              <span className="mt-2.5 text-[13px] font-bold leading-snug">{s.label}</span>
              <span className="ink-muted mt-1.5 text-[11px] leading-snug">{s.sub}</span>
            </div>
          ))}
        </div>
        <p className="ink-muted mt-5 text-center text-[11px]">
          Measurement, never certification. Framework wordmarks live in the footer, once.
        </p>
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
      <HeroBoard />

      {/* 2. HeroSlides carousel — instruments, council, refutations */}
      <HeroSlides />

      {/* 3. 9 product tiles from git history (ToolStack) */}
      <ToolStack />

      {/* Primary CTA after products */}
      <PrimaryCtaBand id="cta-after-products" />

      {/* 4. End-user outcomes with real images (replaces refusals) */}
      <OutcomesBand />

      {/* 5. Living board as a printer (below products) */}
      <LivingBoardSection />

      {/* Verify door — free forever */}
      <VerifyDoor />

      {/* 6. USP strip with framework alignment (replaces EnterpriseTrust) */}
      <USPStrip />

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
