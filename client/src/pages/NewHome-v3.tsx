/**
 * NewHome-v3 — councilof.ai Homepage (OWNER STACK 2026-08-28)
 *
 * Structure: Council OS hero (arena image) + HeroSlides + products + outcomes
 * + living board as printer + slim USP.
 *
 * Owner hypothesis: strangers land on OS door, not the board table. Products and
 * outcomes are visible, the board is a fluid printer, not the hero.
 *
 * LIVE LOCK: GET /api/gspc is 22 axis · 15 MEASURED · 7 UNMEASURED.
 * Never "22 measured". Empty stays empty. Never certify. Never invent scores.
 *
 * NOTE: Council OS is a DOOR (arena image + CTAs), not a live embed.
 * Embedding the full LobbyOverlay would conflict with the standalone /os route.
 * The arena image serves as the visual preview; click opens the real OS.
 */
import ToolStack from "../components/home/ToolStack";
import LiveLeaderboard from "../components/board/LiveLeaderboard";
import HeroSlides from "../components/HeroSlides";
import { useGspcBoard } from "../components/board/useGspcBoard";
import {
  ChevronRight,
  FileCheck,
  BarChart3,
  Shield,
  Gamepad2,
  Cpu,
} from "lucide-react";

// ── End-user outcomes — real surfaces, owned images ───────────────────────
const OUTCOMES: {
  title: string;
  desc: string;
  href: string;
  image?: string;
  icon: typeof BarChart3;
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
];

// ── Hero: Council OS door ───────────────────
function HeroCouncilOS() {
  const { data, error, loading } = useGspcBoard();
  const t = data?.totals;
  const cta =
    typeof t?.axes === "number" &&
    typeof t?.measured_axes === "number" &&
    typeof t?.unmeasured_axes === "number"
      ? `${t.axes} slots · ${t.measured_axes} measured · ${t.unmeasured_axes} empty on purpose`
      : error
        ? "board unreachable"
        : loading
          ? "reading GET /api/gspc"
          : null;
  const stamp = (data?.measured_on as { living_stamp?: { verification_state?: string } } | undefined)
    ?.living_stamp;
  const stampState = stamp?.verification_state;

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

            <p className="mt-5 max-w-lg font-mono text-sm font-semibold tracking-wide text-emerald-200 lg:mx-0 mx-auto">
              {cta ?? "GET /api/gspc"}
            </p>

            {/* One sentence */}
            <p className="mt-4 max-w-lg text-lg leading-relaxed text-emerald-100/90 lg:mx-0 mx-auto">
              The workspace that opens the board, verifier, assessment, and evidence
              pack in one window — loginless and free.
            </p>
            <p className="mt-3 max-w-lg text-sm text-emerald-100/75 lg:mx-0 mx-auto">
              Verify free. Pack is assembly only. Payment does not fill a cell.
            </p>
            <p className="mt-2 max-w-lg text-sm text-emerald-100/75 lg:mx-0 mx-auto">
              Arena:{" "}
              <a href="/gspc-arena" className="underline underline-offset-2 hover:text-white">
                one quotable room
              </a>{" "}
              on this fold.
            </p>
            <p className="mt-2 max-w-lg text-xs text-emerald-100/60 lg:mx-0 mx-auto">
              Living stamp on GET /api/gspc:{" "}
              {stampState ?? (error ? "UNCHECKABLE" : "…")}. The 18 Aug stamp stays
              superseded UNVERIFIABLE — not deleted.
            </p>

            {/* Three buttons: board / verify, OS second row */}
            <div className="mt-8 flex flex-col gap-3 sm:items-start">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-center lg:justify-start">
                <a
                  href="/gspc-scoreboard"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-7 py-3.5 text-sm font-bold text-white shadow-lg shadow-emerald-500/25 transition-all hover:bg-emerald-400 hover:shadow-emerald-400/30"
                >
                  Board <ChevronRight className="h-4 w-4" />
                </a>
                <a
                  href="/gspc-verify"
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/30 bg-transparent px-7 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-white/10"
                >
                  Verify
                </a>
              </div>
              <a
                href="/os"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/20 px-7 py-3 text-sm font-semibold text-emerald-100/90 transition-colors hover:bg-white/10"
              >
                Council OS
              </a>
            </div>
          </div>

          {/* Right: arena image — the Council OS measurement space */}
          <div className="relative mx-auto w-full max-w-xl lg:mx-0">
            <div className="overflow-hidden rounded-2xl shadow-2xl shadow-emerald-900/30">
              <img
                src="/images/coliseum_hero_arena.jpg"
                alt="White arena with humans in green and white facing humanoid robots - the Council OS measurement space"
                className="w-full object-cover"
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
        <p className="measure measure-center mt-3 text-center text-xs text-muted-foreground">
          XRPL is a scope line, not a product tile: mainnet facts on 6 accounts;
          attestation devnet-proven; mainnet planned. Not 16 axes.
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
    { icon: "🔓", label: "Verification free forever", sub: "No account, no fee" },
  ];

  return (
    <section className="section-y-sm surface-ink border-y" style={{ borderColor: "var(--ink-border)" }}>
      <div className="section-shell">
        <p className="t-kicker ink-kicker text-center font-mono">Measurement, not certification</p>
        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
          {SIGNALS.map((s) => (
            <div key={s.label} className="ink-card flex flex-col items-center rounded-xl px-3 py-5 text-center">
              <span className="text-xl leading-none text-emerald-300/90" aria-hidden>{s.icon}</span>
              <span className="mt-2.5 text-[13px] font-bold leading-snug">{s.label}</span>
              <span className="ink-muted mt-1.5 text-[11px] leading-snug">{s.sub}</span>
            </div>
          ))}
        </div>
        <p className="ink-muted mt-5 text-center text-[11px]">
          We are not certified to SOC 2 or ISO 42001. Measurement credential, never certification.
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
          <p className="mt-3 text-sm text-muted-foreground">
            Verify free. Pack is assembly only. Payment does not fill a cell.
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
      {/* 1. Hero = Council OS door with arena image */}
      <HeroCouncilOS />

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
