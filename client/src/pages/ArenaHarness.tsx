import { Link } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StackHonestyBanner } from "@/components/StackHonestyBanner";
import { openLobby } from "@/lib/lobbyLink";
import { POSITIONING, CTA_PRIMARY } from "@/lib/positioning";
import { STACK_STATS } from "@/lib/stackHonesty";

type Register = "MEASURED" | "REPORTED" | "DESIGN" | "PARTIAL" | "SHIPPED" | "GAP" | "SPEC";

const SIGNAL_LEGS: {
  leg: string;
  register: Register;
  source: string;
  blurb: string;
}[] = [
  {
    leg: "Live regulation (east-west)",
    register: "SHIPPED",
    source: "GET /api/regulation",
    blurb: "EU · US states · China · Korea · Japan · Australia — dated deadlines, penalty exposure cited",
  },
  {
    leg: "Hive crosswalk",
    register: "SHIPPED",
    source: "/crosswalk",
    blurb: "15 frameworks — TC260 ↔ NIST ↔ EU AI Act predicate map (catalogue live; per-axis join illustrative)",
  },
  {
    leg: "Measured AI board",
    register: "MEASURED",
    source: "GET /api/gspc",
    blurb: "13 core axes on frozen bank — deterministic grader, Ed25519-signed cells",
  },
  {
    leg: "Human baseline context",
    register: "REPORTED",
    source: "GET /api/reported",
    blurb: "Third-party capability baselines — reported alongside, never fused into a score",
  },
  {
    leg: "Council Space sim (MEOK)",
    register: "PARTIAL",
    source: "GET /api/arena/rounds.jsonl",
    blurb: "MEOK runs sim fleet on os.meok.ai — CSOAI signs composed output only; no brand conflict",
  },
  {
    leg: "Divergence compose",
    register: "MEASURED",
    source: "GET /api/cross",
    blurb: "Deterministic join of law × measure — composes, does not certify",
  },
];

const PHASES: {
  phase: string;
  title: string;
  body: string;
  diagram: string;
  revenue: { label: string; register: Register }[];
}[] = [
  {
    phase: "Phase 1",
    title: "The data vampire (downstream, not competing)",
    body:
      "Stripe/OpenRouter own the toll road — routing at scale. EUNOMIA Harness sits downstream: every prompt that passes through any router gets evaluated in our arena. We do not compete on routing. We compete on proving the routing was correct.",
    diagram: `OpenRouter/Stripe ──► EUNOMIA Arena ──► Proof DB
     (routes)            (evaluates)         (owns traces)`,
    revenue: [
      { label: "Model vendors pay to prove they were the right route choice", register: "DESIGN" },
      { label: "Enterprises pay to audit routing bills against signed benchmarks", register: "DESIGN" },
    ],
  },
  {
    phase: "Phase 2",
    title: "The bond market (insurance for the toll road)",
    body:
      "Stripe bought a tollbooth. We build verification + risk: performance bonds where vendors stake collateral against live benchmark failure, legacy migration coverage for COBOL breakage, and data futures on upcoming arena seasons. Stripe handles payments; we handle attestation.",
    diagram: `Performance bond ──► live GSPC / arena fail ──► payout (DESIGN)
Legacy COBOL cover ──► venturi crossing ──► insurer evidence (PARTIAL)
Data futures ──► arena season N+1 traces (DESIGN)`,
    revenue: [
      { label: "Performance bonds — collateral against live benchmark failure", register: "DESIGN" },
      { label: "Legacy migration insurance — COBOL→A2A venturi coverage", register: "DESIGN" },
      { label: "Data futures — pre-purchase arena season traces", register: "DESIGN" },
    ],
  },
  {
    phase: "Phase 3",
    title: "The embodiment gap (physical substrate)",
    body:
      "Stripe is pure software. SovOS has water-pipe memory (CPO), LED visual cortex, farm-based bio-compute (iokfarm), and fly-brain neuromorphic cores — mostly PARTIAL repos today, not a shipped product line. The thesis: regulators and defense buyers will want physically verifiable AI, not a ghost in a datacenter.",
    diagram: `Software router ──► no body
EUNOMIA harness ──► CPO · LED · farm · neuromorphic (PARTIAL)`,
    revenue: [
      { label: "Defense / regulated physical-verifiable AI contracts", register: "DESIGN" },
    ],
  },
];

const COMPARE: { layer: string; stripe: string; eunomia: string; register: Register }[] = [
  { layer: "Routing", stripe: "REPORTED: proxy at scale (OpenRouter acquisition context)", eunomia: "We do not build this", register: "REPORTED" },
  { layer: "Benchmarking", stripe: "None on-router", eunomia: "Live arenas + human baselines — GET /api/gspc", register: "MEASURED" },
  { layer: "Verification", stripe: "None", eunomia: "Ed25519 signed records + C2PA (not blockchain)", register: "MEASURED" },
  { layer: "Data", stripe: "Discarded in transit", eunomia: "Reasoning traces — the product", register: "DESIGN" },
  { layer: "Legacy", stripe: "None", eunomia: "COBOL bridge + venturi — SPEC/DESIGN", register: "SPEC" },
  { layer: "Physical", stripe: "None", eunomia: "CPO / farm / neuromorphic — PARTIAL", register: "PARTIAL" },
];

const DOMAINS: { domain: string; role: string; hosts: string; href: string }[] = [
  {
    domain: "councilof.ai",
    role: "Arena + bonds + sovereign pitch",
    hosts: "GSPC board, engine axis, venturi, insurers, ownership plan, RECEIPT-SPEC",
    href: "/",
  },
  {
    domain: "proofof.ai",
    role: "Attestation primitive",
    hosts: "C2PA provenance, DID verify, route receipts — proofof-ai-mcp",
    href: "https://proofof.ai",
  },
  {
    domain: "meok.ai",
    role: "Eval volume + behavioral safety",
    hosts: "Arenas, NPC wallets, MEOK→CSOAI sensory loop (PARTIAL)",
    href: "https://meok.ai",
  },
  {
    domain: "openmoe.ai",
    role: "OSS / multi-agent developer substrate",
    hosts: "SwarmBench, open-model BFT, Hugging Face dev audience",
    href: "https://openmoe.ai",
  },
];

const CATAPULT: { who: string; pitch: string; domain: string }[] = [
  {
    who: "Hugging Face",
    pitch: "Integrate EUNOMIA arenas into inference endpoints. Every model run generates benchmark data. Split data revenue.",
    domain: "openmoe.ai + councilof.ai/api/gspc",
  },
  {
    who: "TrustedRouter (or OSS alternative)",
    pitch: "Ed25519 attestation instead of 'trust us.' Every route decision carries a signed receipt (RECEIPT-SPEC-0.1).",
    domain: "proofof.ai",
  },
  {
    who: "NVIDIA (ACE / Omniverse)",
    pitch: "MEOK arenas generate behavioral safety datasets. NPC companions that pass red-team evals = certified safe agents.",
    domain: "meok.ai",
  },
  {
    who: "UK Government / FCA",
    pitch: "COAI-certified harness, EU AI Act aligned, UK infrastructure — sovereign alternative to US routing tollbooths.",
    domain: "councilof.ai",
  },
];

const MATH: { item: string; value: string; register: Register }[] = [
  { item: "OpenRouter acquisition context (REPORTED)", value: "~$7.5B · ~10T tokens/day cited in press", register: "REPORTED" },
  { item: "Benchmark trace licensing", value: "$0.10–0.50 per reasoning trace (enterprise)", register: "DESIGN" },
  { item: "Signed measurement engagement", value: "$5K–50K per scoped run (not certification)", register: "DESIGN" },
  { item: "Legacy bridge access", value: "$100K–1M per enterprise contract", register: "DESIGN" },
  { item: "Insurance bonds", value: "2–5% of AI spend under coverage", register: "DESIGN" },
  { item: "Target", value: "1M verified traces/day at higher margin — not 10T tokens/day", register: "DESIGN" },
];

function RegBadge({ r }: { r: Register }) {
  const cls =
    r === "MEASURED"
      ? "border-emerald-500/40 text-emerald-300"
      : r === "SHIPPED"
        ? "border-cyan-500/40 text-cyan-300"
        : r === "REPORTED"
          ? "border-sky-500/40 text-sky-300"
          : r === "PARTIAL"
            ? "border-amber-500/40 text-amber-300"
            : r === "GAP"
              ? "border-slate-500/40 text-slate-400"
              : r === "SPEC"
                ? "border-orange-500/40 text-orange-300"
                : "border-violet-500/40 text-violet-300";
  return (
    <span className={`rounded border px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${cls}`}>
      {r}
    </span>
  );
}

export default function ArenaHarness() {
  return (
    <div className="min-h-screen bg-[#04070d] text-slate-200">
      <header className="border-b border-white/8 bg-[#080c14]">
        <div className="mx-auto max-w-5xl px-4 py-14 sm:px-6">
          <Badge className="mb-4 border-amber-500/40 text-amber-300">Strategic thesis · DESIGN register</Badge>
          <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
            {POSITIONING.harness.name}: prove routing was correct
          </h1>
          <p className="mt-4 max-w-3xl text-slate-400 leading-relaxed">
            {POSITIONING.subhead} Stripe bought the LLM highway (REPORTED). We build the crash-test facility,
            signed traces, and insurance layer downstream.{" "}
            {STACK_STATS.mcpServers} MCP rules catalogued; {STACK_STATS.gspcAxesMeasured} GSPC core axes MEASURED on the
            frozen bank. Wilson 95% intervals apply only on frozen banks (GSPC today; future frozen RWA banks after
            custody + counsel) — never on live contract churn or UNMEASURED labour/economy indices (
            <a href="/indices" className="text-amber-300/90 underline">/indices</a>).
          </p>
          <div className="mt-8">
            <StackHonestyBanner note="Revenue tables and bond mechanics are DESIGN until frozen contracts exist. We measure and sign — we do not certify." />
          </div>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/instruments" className={CTA_PRIMARY}>
              {POSITIONING.router.cta}
            </Link>
            <Link href="/gspc-arena">
              <Button className="bg-emerald-600 hover:bg-emerald-700">Council Space arena →</Button>
            </Link>
            <Link href="/venturi">
              <Button variant="outline" className="border-white/15">Bond venturi →</Button>
            </Link>
            <Button
              variant="outline"
              className="border-amber-500/30 text-amber-300"
              onClick={() =>
                openLobby({
                  task: "eunomia-router",
                  prompt:
                    "Explain the arena-harness thesis: we do not compete on routing — we prove routing was correct. What is MEASURED today?",
                })
              }
            >
              Ask in Council Lobby
            </Button>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-5xl px-4 py-12 sm:px-6 border-b border-white/8">
        <h2 className="text-lg font-bold text-white mb-2">Which domain hosts what?</h2>
        <p className="text-sm text-slate-500 mb-6 max-w-2xl">
          Not openmoe.ai <em>or</em> proofof.ai alone — split by SovOS layer. The Stripe/OpenRouter story lands on{" "}
          <strong className="text-slate-300">councilof.ai</strong>; attestation on{" "}
          <strong className="text-slate-300">proofof.ai</strong>; trace volume on{" "}
          <strong className="text-slate-300">meok.ai</strong>; OSS dev wedge on{" "}
          <strong className="text-slate-300">openmoe.ai</strong>.
        </p>
        <ul className="grid gap-4 sm:grid-cols-2">
          {DOMAINS.map((d) => (
            <li key={d.domain} className="rounded-xl border border-white/10 p-5">
              <p className="font-mono text-sm text-emerald-400">{d.domain}</p>
              <p className="mt-1 font-semibold text-white">{d.role}</p>
              <p className="mt-2 text-xs text-slate-500">{d.hosts}</p>
              <a
                href={d.href.startsWith("http") ? d.href : d.href}
                className="mt-3 inline-block text-xs text-emerald-400 hover:underline"
                {...(d.href.startsWith("http") ? { target: "_blank", rel: "noreferrer" } : {})}
              >
                Open →
              </a>
            </li>
          ))}
        </ul>
      </section>

      {PHASES.map((p) => (
        <section key={p.phase} className="mx-auto max-w-5xl px-4 py-10 sm:px-6 border-b border-white/8">
          <p className="text-xs uppercase tracking-[0.2em] text-amber-400/90">{p.phase}</p>
          <h2 className="mt-2 text-xl font-bold text-white">{p.title}</h2>
          <p className="mt-3 text-sm text-slate-400 max-w-3xl">{p.body}</p>
          <pre className="mt-4 overflow-x-auto rounded-xl border border-white/10 bg-black/40 p-4 text-xs text-emerald-100 font-mono">
            {p.diagram}
          </pre>
          <ul className="mt-4 space-y-2">
            {p.revenue.map((r) => (
              <li key={r.label} className="flex flex-wrap items-center gap-2 text-sm text-slate-400">
                <RegBadge r={r.register} />
                {r.label}
              </li>
            ))}
          </ul>
        </section>
      ))}

      <section className="mx-auto max-w-5xl px-4 py-12 sm:px-6 border-b border-white/8">
        <Badge className="mb-4 border-cyan-500/40 text-cyan-300">SOV Signal Index · csoai.sov-signal-index/0.1</Badge>
        <h2 className="text-xl font-bold text-white mb-2">The third data product — composed, not fused</h2>
        <p className="text-sm text-slate-500 mb-6 max-w-3xl">
          Cross-sync east-west regulation, hive crosswalk, GSPC measurement, and MEOK Council Space sim traces into one
          signed index. <code className="text-cyan-400/90">signal_index</code> stays{" "}
          <code className="text-slate-400">null</code> on every row until a frozen formula ships — no invented composite
          score.
        </p>
        <div className="rounded-xl border border-cyan-500/20 bg-cyan-950/20 p-5 mb-6 text-sm text-slate-400">
          <p className="font-semibold text-cyan-200/90 mb-2">MEOK vs CSOAI — no conflict</p>
          <p>
            <strong className="text-slate-300">MEOK</strong> (meok.ai) runs Council Space sim substrate — NPC clans,
            arena rounds, eval volume on <code className="text-xs">os.meok.ai</code>.
          </p>
          <p className="mt-2">
            <strong className="text-slate-300">CSOAI</strong> (councilof.ai) signs the GSPC board, RECEIPT-SPEC, and
            this composed index. Body measures; head generates traces.
          </p>
        </div>
        <ul className="space-y-3 mb-8">
          {SIGNAL_LEGS.map((leg) => (
            <li
              key={leg.leg}
              className="flex flex-wrap items-start gap-3 rounded-lg border border-white/8 p-4 text-sm"
            >
              <RegBadge r={leg.register} />
              <div className="flex-1 min-w-[12rem]">
                <p className="font-medium text-white">{leg.leg}</p>
                <p className="mt-1 text-xs text-slate-500">{leg.blurb}</p>
              </div>
              <code className="text-[10px] text-emerald-400/80 shrink-0">{leg.source}</code>
            </li>
          ))}
        </ul>
        <pre className="overflow-x-auto rounded-xl border border-white/10 bg-black/40 p-4 text-xs text-emerald-100 font-mono mb-4">
{`curl -sS https://councilof.ai/api/signal | jq '.schema, .legs, .signals[0].registers'

# Per-axis composed statement (no fused score):
# .signals[].divergence_statement
# .signals[].signal_index  → always null today`}
        </pre>
        <a
          href="/api/signal"
          target="_blank"
          rel="noreferrer"
          className="text-sm text-emerald-400 hover:underline"
        >
          Open live SOV Signal Index JSON →
        </a>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-12 sm:px-6 border-b border-white/8">
        <h2 className="text-xl font-bold text-white mb-6">Stripe bought the highway. You own the proof.</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-slate-500 border-b border-white/10">
                <th className="pb-3 pr-4">Layer</th>
                <th className="pb-3 pr-4">OpenRouter / Stripe</th>
                <th className="pb-3">EUNOMIA Harness</th>
              </tr>
            </thead>
            <tbody>
              {COMPARE.map((row) => (
                <tr key={row.layer} className="border-b border-white/5">
                  <td className="py-3 pr-4 font-medium text-white">
                    {row.layer}{" "}
                    <RegBadge r={row.register} />
                  </td>
                  <td className="py-3 pr-4 text-slate-500">{row.stripe}</td>
                  <td className="py-3 text-slate-300">{row.eunomia}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-12 sm:px-6 border-b border-white/8">
        <h2 className="text-xl font-bold text-white mb-6">The catapult — who to call</h2>
        <ul className="grid gap-4 sm:grid-cols-2">
          {CATAPULT.map((c) => (
            <li key={c.who} className="rounded-xl border border-white/10 p-5">
              <h3 className="font-semibold text-white">{c.who}</h3>
              <p className="mt-2 text-xs text-slate-400">{c.pitch}</p>
              <p className="mt-3 font-mono text-[10px] text-violet-400/80">Lead with: {c.domain}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-12 sm:px-6 pb-20">
        <h2 className="text-xl font-bold text-white mb-6">The math that matters</h2>
        <ul className="space-y-3">
          {MATH.map((m) => (
            <li key={m.item} className="flex flex-wrap items-baseline gap-3 text-sm border-b border-white/5 pb-3">
              <RegBadge r={m.register} />
              <span className="text-slate-400 flex-1 min-w-[12rem]">{m.item}</span>
              <span className="text-slate-200 font-mono text-xs">{m.value}</span>
            </li>
          ))}
        </ul>
        <div className="mt-10 flex flex-wrap gap-4 text-sm">
          <Link href="/ownership" className="text-emerald-400 hover:underline">
            100-move ownership plan →
          </Link>
          <Link href="/receipt-spec" className="text-emerald-400 hover:underline">
            RECEIPT-SPEC-0.1 →
          </Link>
          <Link href="/agent-runbook" className="text-emerald-400 hover:underline">
            Agent runbook →
          </Link>
        </div>
      </section>
    </div>
  );
}
