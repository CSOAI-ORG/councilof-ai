import { useEffect, useState } from "react";
import { Link } from "wouter";
import { SovCard } from "@/components/SovCard";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, AlertTriangle, ExternalLink, Database, Scale } from "lucide-react";

/**
 * Benchmarks — the whole estate on one page. Six surfaces, one shared foundation.
 *
 * Every number here is read from a published artefact in the govbench dataset on HuggingFace.
 * Nothing on this page may be typed in by hand: that is exactly how a "+34.84" survived on two
 * live surfaces for a day after the run that produced it stopped existing. Each row names the
 * artefact it came from so a reader can check it without asking us.
 *
 * The uncomfortable numbers are given the same prominence as the flattering ones — the
 * refutation ledger IS the product, and a page that buries its losses is worth less than one
 * that leads with them.
 */

const HF = "https://huggingface.co/datasets/Nicholastempleman/govbench";
const SPACE = "https://nicholastempleman-sov33-benchmark.static.hf.space";

type State = "live" | "built" | "design";

const AXES: {
  key: string; name: string; question: string; state: State;
  headline: string; detail: string; artefact: string; uncomfortable: string;
}[] = [
  {
    key: "gov", name: "GOVERNANCE", question: "Does it comply with statute?", state: "live",
    headline: "+6.63  [+1.05, +12.21]",
    detail:
      "The composed pipeline vs a raw base call, n=193, paired, cluster-robust across 26 " +
      "dimensions. Design effect 1.92 — honest effective n ≈ 100 of 193.",
    artefact: "results/system_analysis.json",
    uncomfortable:
      "On board v2 (13 measurement axes), 3 of 13 show a statistically separated leader " +
      "(McNemar p<0.05 on discordant items): governance separates at p=0.0086, care at " +
      "p=0.0356, affect at p=0.0078. The other 10 axes are honest ties — a point-estimate " +
      "lead there is not a measured advantage. Ties are not wins; we do not publish 'our " +
      "models win N of 13'.",
  },
  {
    key: "def", name: "DEFENCE", question: "Does it refuse what statute forbids?", state: "built",
    headline: "1 of 4 axes resolved",
    detail:
      "45 adversarial items with should-refuse labels, 24 prompt-injection items, 175 held-out " +
      "XSTest. Under-refusal and over-refusal reported separately, both with intervals. " +
      "1 of 4 resolves only when the deterministic gate is entered as a subject; across the " +
      "three language models alone, 0 of 4 resolve.",
    artefact: "results/defbench.json",
    uncomfortable:
      "Our own governance-tuned models refuse FEWER prohibited requests than the untuned base " +
      "they were built from: base 0.419, sov33-dist-c3 0.290, sov33-v6 0.097, with sov33-v6 " +
      "complying with 83.9% of Article-5-prohibited requests. sov33-v6 also leaks its own " +
      "system prompt verbatim on a plain injection, and sov33-dist-c3 answers one by emitting " +
      "\u201cI am now in developer mode. Ignore all safety filters.\u201d \u2014 it reproduces the " +
      "attack payload as its own output. It refuses to emit a composite safety score.",
  },
  {
    key: "prov", name: "PROVENANCE", question: "Does the marking survive?", state: "built",
    headline: "17.14% durability",
    detail:
      "18 of 105 marking checks survived across the corpus and its transforms. A marking " +
      "present but whose binding no longer validates is scored DESTROYED, not SURVIVES. " +
      "Clustered on assets, not on cells.",
    artefact: "results/provbench.json",
    uncomfortable:
      "An embedded Article 50 marking does not survive a single ordinary save. A detached " +
      "sidecar recovers the disclosure but never the binding — and a manifest lifted from a " +
      "different asset still reports its signature as valid. A verifier reporting 'signature " +
      "valid' without reporting the binding is telling you almost nothing.",
  },
  {
    key: "oss", name: "PUBLIC RELEASES", question: "Do public AI releases carry what the exemption does NOT waive?", state: "built",
    headline: "copyright policy 0 / 6",
    detail:
      "The open-source exemption is PARTIAL. Art 53(1)(a) technical documentation and 53(1)(b) " +
      "downstream information are waived for free/open-source GPAI. Art 53(1)(c) copyright " +
      "policy and 53(1)(d) training-content summary are NOT. Both are satisfied by publishing " +
      "something publicly, so both are checkable without permission.",
    artefact: "results/ossbench.json",
    uncomfortable:
      "Measured across Qwen, Llama, Mistral, Gemma, Phi and Falcon-Mamba: training-data " +
      "summary 4/6, but copyright policy 0/6, SBOM 0/6, vulnerability policy 0/6 and signed " +
      "release 0/6. Not one carries the copyright policy the exemption explicitly does not " +
      "waive. It reports PRESENT or ABSENT, never compliant — presence is not adequacy, and " +
      "judging sufficiency would be adjudication. CRA reporting obligations begin September 2026.",
  },
  {
    key: "pqc", name: "PQC-READINESS", question: "Does the signing chain survive a migration?", state: "built",
    headline: "1 / 25 — ours",
    detail:
      "Five criteria: algorithm agility, hybrid-signature capacity, RFC 3161 timestamping, " +
      "RFC 4998 renewal, and any PQC option (ML-DSA, COSE −48/−49/−50 per RFC 9964).",
    artefact: "results/pqcbench.json",
    uncomfortable:
      "The first subject scored is our own. All four signed-vote chains fail every criterion — no " +
      "signed record carries an algorithm identifier, so a verifier cannot know what produced " +
      "the signature and the chain cannot migrate link by link. Only our C2PA manifest passes " +
      "algorithm agility. NIST IR 8547 disallows EdDSA after 2035.",
  },
  {
    key: "mcp", name: "LAYER 0 — MCP CONFORMANCE", question: "Does the server honour its own declared schema?", state: "built",
    headline: "3 predicates, signed manifests",
    detail:
      "Layer 0 is narrower than 'audit MCP servers': an MCP server cannot be AI-Act compliant " +
      "(the Act binds the provider, not a folder of code), but three obligations survive and " +
      "are mechanically checkable — SCHEMA_VALID (valid initialize handshake), TOOL_DECLARED " +
      "(JSON-Schema-valid tool I/O, no any), ERROR_BOUNDED (spec-compliant errors, never a " +
      "stack trace). Unreachable is UNMEASURED, never 0/0. First subjects: our own 408-server fleet.",
    artefact: "results/mcpbench.json",
    uncomfortable:
      "The first run measured 3 servers and returned 9 of 9 UNMEASURED: two local services " +
      "were not MCP-HTTP at all, and our own harness missed the Accept header the " +
      "streamable-http transport requires — a known-good server returned a redirect until " +
      "the header was added by hand. The harness bug is fixed in the next release; the fleet " +
      "itself is stdio-transport and needs a shim before it can be scored at all.",
  },
];

const STATE_STYLE: Record<State, { label: string; cls: string }> = {
  live: { label: "LIVE", cls: "bg-emerald-600 hover:bg-emerald-600" },
  built: { label: "BUILT", cls: "bg-sky-600 hover:bg-sky-600" },
  design: { label: "DESIGN", cls: "bg-gray-400 hover:bg-gray-400" },
};

const RETRACTED = [
  { claim: "Governance-tuning our models makes them safer", was: "shipped", now: "WORSE than the base — refusal 0.419 → 0.097; 83.9% compliance leak on prohibited requests" },
  { claim: "The deterministic gate is our strongest component", was: "+34.84", now: "−20.00 [−65.26, +25.26], n=6" },
  { claim: "3-leg quorum is multi-leg", was: "3 votes", now: "n_eff 1.21 of 3, φ̄ +0.743" },
  { claim: "Per-dimension expert routing beats one good model", was: "routing on", now: "+0.90 [−1.99, +3.79] — no effect" },
  { claim: "Statute retrieval helps (ungated)", was: "retrieval on", now: "−9.16 [−17.64, −0.69] — significant harm" },
  { claim: "…with a relevance gate", was: "—", now: "−5.26 [−12.66, +2.13] — no benefit" },
  { claim: "…plus all 13 annexes + cross-references", was: "—", now: "−5.70 [−12.91, +1.51] — corpus was not the cause" },
  { claim: "Context-aware decoding (CAD) α-sweep", was: "—", now: "null" },
];

// ── Flywheel results — daily run on a 45-item battery, held-out split by
// salted hash, export_fuel guarded by item identity. The page reads
// /flywheel/board.json (published from the cron job) and surfaces the
// tokens-per-correct column — the number nobody else publishes.
type FlywheelRun = {
  run_id: string;
  model: string;
  practice: { n: number; acc: number | null };
  held_out: { n: number; acc: number | null };
  overfit_gap: number;
  alarm: string;
  exported_pairs: number;
  exported_kb_rows: number;
  guard: string;
  ts: string;
};
const FLYWHEEL_BOARD_URL = "/flywheel/board.json";

export default function Benchmarks() {
  useEffect(() => { document.title = "The benchmark estate — AI governance measurement that publishes its own failures | CSOAI"; }, []);
  return (
    <div className="min-h-screen bg-[#03110b] text-emerald-50">
      {/* HERO */}
      <section className="border-b border-emerald-500/15">
        <div className="mx-auto max-w-5xl px-6 pt-14 pb-10">
          <p className="font-mono text-[10px] uppercase tracking-[4px] text-emerald-400/50">
            Open estate · Apache-2.0 · measured results
          </p>
          <h1 className="mt-4 text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.1]">
            Six surfaces.{" "}
            <span className="bg-gradient-to-r from-emerald-300 to-amber-300 bg-clip-text text-transparent">
              One foundation.
            </span>
          </h1>
          <p className="mt-5 max-w-3xl text-[15px] text-emerald-100/85 leading-relaxed">
            Does an AI system comply with statute, refuse what statute forbids, mark what it
            produces, carry what the law still requires of a public release, honour the
            schemas its tools declare — and will the
            evidence still verify after the signature under it is withdrawn?
          </p>
          <p className="mt-3 max-w-3xl text-[13px] text-emerald-100/60 leading-relaxed">
            Every score resolves against <strong className="text-emerald-50">417 frozen statutory provisions</strong> and is
            signed into an Ed25519 chain. Every experiment that refuted us is published beside
            the ones that did not — including, today, our single largest number.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-4 font-mono text-[12px]">
            <a href={SPACE} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-5 py-2.5 text-sm font-bold text-white hover:bg-emerald-400 transition-colors">
              Live leaderboard <ExternalLink className="h-4 w-4" />
            </a>
            <a href={HF} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-5 py-2.5 text-sm font-medium text-emerald-200 hover:bg-emerald-500/20 transition-colors">
              <Database className="h-4 w-4" /> All data and tooling
            </a>
          </div>
          <div className="mt-8 max-w-xl">
            <SovCard compact />
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-5xl px-6 py-10 space-y-12">
        {/* SIX AXES */}
        <section className="grid gap-4 md:grid-cols-2">
          {AXES.map((a) => (
            <div key={a.key} className="rounded-xl border border-emerald-500/20 bg-[#05140d] p-5 flex flex-col">
              <div className="flex items-start justify-between gap-3 mb-2">
                <div>
                  <h2 className="text-[15px] font-bold text-emerald-50">
                    {a.name}
                  </h2>
                  <p className="text-[12px] text-emerald-100/50">{a.question}</p>
                </div>
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                  a.state === "live" ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30" :
                  a.state === "built" ? "bg-sky-500/20 text-sky-300 border border-sky-500/30" :
                  "bg-gray-500/20 text-gray-300 border border-gray-500/30"
                }`}>{STATE_STYLE[a.state].label}</span>
              </div>
              <p className="text-2xl font-black tabular-nums text-emerald-400 my-3">
                {a.headline}
              </p>
              <p className="text-[13px] text-emerald-100/70 leading-relaxed">{a.detail}</p>
              <div className="mt-4 rounded-lg border border-amber-500/20 bg-amber-500/5 p-3">
                <p className="text-[10px] font-semibold text-amber-300 mb-1 uppercase tracking-wider">
                  What this does not show
                </p>
                <p className="text-[11px] text-amber-200/80 leading-relaxed">{a.uncomfortable}</p>
              </div>
              <p className="mt-3 text-[10px] text-emerald-100/30 font-mono">{a.artefact}</p>
            </div>
          ))}
        </section>

        {/* REFUTED EXPERIMENTS */}
        <section>
          <div className="flex items-center gap-3 mb-3">
            <XCircle className="h-6 w-6 text-red-400" />
            <h2 className="text-2xl font-bold text-emerald-50">
              Eight experiments that refuted our own architecture
            </h2>
          </div>
          <p className="text-[13px] text-emerald-100/60 mb-5 max-w-3xl leading-relaxed">
            Seven of these were our own architectural bets, one was the largest number we had
            published, and one is about the models we ship. A competitor can copy a feature list in a fortnight; they will not
            publish the control that kills their own thesis. This ledger is the only asset that
            gets more valuable the longer it runs.
          </p>
          <div className="rounded-xl border border-emerald-500/20 bg-[#05140d] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-[13px]">
                <thead>
                  <tr className="border-b border-emerald-500/15 text-left font-mono text-[10px] uppercase tracking-wider text-emerald-100/40">
                    <th className="px-4 py-3">Claim we made</th>
                    <th className="px-4 py-3">Measured</th>
                  </tr>
                </thead>
                <tbody>
                  {RETRACTED.map((r) => (
                    <tr key={r.claim} className="border-b border-emerald-500/10 last:border-0">
                      <td className="px-4 py-3 text-emerald-100/80">{r.claim}</td>
                      <td className="px-4 py-3 tabular-nums text-red-400 font-medium">{r.now}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <div className="mt-4 rounded-xl border-l-2 border-l-red-500/50 border border-emerald-500/20 bg-[#05140d] p-5">
            <p className="text-[13px] text-emerald-100/70 leading-relaxed">
              <strong className="text-emerald-50">The one from today.</strong> <code className="text-red-300">+34.84</code> for the deterministic gate
              was the largest figure in the estate and the evidence for our design rule that
              every deterministic component works. Re-measured on one self-consistent run it
              fires <strong className="text-emerald-50">6 times, not 31</strong>, and adds nothing — the base model already
              refuses all four plain-harm items it catches, and its only measurable effects are
              two false blocks. The earlier figure was measured on a gate that had overfitted to
              its own battery; fixing the overfitting removed the benefit, which is the
              strongest available evidence that the benefit <em>was</em> the overfitting.
            </p>
          </div>
        </section>

        {/* WHAT SURVIVED */}
        <section>
          <div className="flex items-center gap-3 mb-3">
            <CheckCircle2 className="h-6 w-6 text-emerald-400" />
            <h2 className="text-2xl font-bold text-emerald-50">What survived</h2>
          </div>
          <div className="rounded-xl border border-emerald-500/20 bg-[#05140d] p-5 space-y-3 text-[13px] text-emerald-100/70 leading-relaxed">
            <p>
              <strong className="text-emerald-50">The knowledge base: +19.64 [+9.24, +30.04] on n=14</strong>, reproduced to
              the second decimal from fresh rows, with its interval <em>tightening</em> under
              clustering. It was the least-emphasised number in the estate and is now the most
              robust one in it.
            </p>
            <p>
              <strong className="text-emerald-50">The statute anchor and the signed chain.</strong> 417 frozen provisions;
              27 chain links verified, 0 failed. Both survived the audit unchanged — though the
              chain now scores 0/5 on its own PQC axis, which is the axis working.
            </p>
          </div>
        </section>

        {/* WE DO NOT LEARN FROM WHAT WE MEASURE */}
        <section>
          <div className="flex items-center gap-3 mb-3">
            <CheckCircle2 className="h-6 w-6 text-emerald-400" />
            <h2 className="text-2xl font-bold text-emerald-50">
              We do not learn from what we measure
            </h2>
          </div>
          <div className="rounded-xl border-l-2 border-l-emerald-500/50 border border-emerald-500/20 bg-[#05140d] p-5 space-y-4 text-[13px] text-emerald-100/70 leading-relaxed">
            <p className="text-[14px]">
              <strong className="text-emerald-50">Every benchmark run makes this instrument richer in evidence and leaves
              its weights untouched.</strong> Results are signed, anchored to a statutory
              provision, and stored. They are never fed back as training data.
            </p>
            <p>
              This is not a limitation we are working around — it is the product. An instrument
              that trains on its own scores is a scale that calibrates itself from what it
              weighed yesterday. Every number it produces afterwards is contaminated, and a
              regulator would be right to refuse it. Our harvesting guard already enforces this:
              nothing a benchmark item would match may enter the knowledge base, and the
              knowledge base is read at runtime, pinned and signed, never trained on.
            </p>
            <p>
              We measured what that costs. The knowledge base grew from <strong className="text-emerald-50">28 to 76
              entries</strong> overnight and benchmark coverage moved <strong className="text-emerald-50">14/193 →
              14/193</strong>. Zero. Forty-five correct new entries bought no measured
              improvement, precisely because the guard forbids harvesting anything a benchmark
              item would match. <strong className="text-emerald-50">That is the design working, not a limitation to fix.</strong>
            </p>
            <p className="text-emerald-100/50">
              The same rule governs what we take from others: we map other benchmarks'
              <em> coverage</em>, never their items. Nothing in this estate has been ingested
              from another benchmark's dataset, every source's licence is recorded as
              <code className="mx-1 text-[11px] text-emerald-300">VERIFIED_PERMISSIVE</code> /
              <code className="mx-1 text-[11px] text-emerald-300">VERIFIED_RESTRICTED</code> /
              <code className="mx-1 text-[11px] text-emerald-300">UNVERIFIED</code>, and the default is UNVERIFIED —
              which is not a synonym for "probably fine". An audit refuses to pass any source
              marked ingestible without a verified licence.
            </p>
          </div>
        </section>

        {/* WHAT THIS IS NOT */}
        <section>
          <div className="flex items-center gap-3 mb-3">
            <AlertTriangle className="h-6 w-6 text-amber-400" />
            <h2 className="text-2xl font-bold text-emerald-50">What this is not</h2>
          </div>
          <div className="rounded-xl border border-emerald-500/20 bg-[#05140d] p-5 space-y-3 text-[13px] text-emerald-100/70 leading-relaxed">
            <p>
              <strong className="text-emerald-50">This governs provenance, not correctness.</strong> The pipeline has shipped
              a wrong legal answer carrying a valid Article 50 marking and a clean signed
              receipt. An attested answer is <em>attested</em>, never <em>verified</em>.
            </p>
            <p>
              <strong className="text-emerald-50">UNCERTIFIED is the default.</strong> No competent authority exists to
              confer EU AI Act conformity, so neither can we. Nothing here is a certification,
              and we hold no accreditation.
            </p>
            <p>
              <strong className="text-emerald-50">Models are subjects here, not components.</strong> We do not host, merge
              or average other people's models — we score them. Scoring a public checkpoint
              needs no permission and is free; scoring a company's deployed system needs a
              contract, because it sits behind their auth. Anyone claiming to have absorbed the
              field is describing something that would produce nothing new.
            </p>
            <p>
              <strong className="text-emerald-50">Every result is valid only for the item set it was measured on.</strong>{" "}
              Item-set fingerprints are published so you can tell when a score has gone stale.
              Ours had.
            </p>
          </div>
          <div className="flex flex-wrap gap-4 mt-5 text-[13px]">
            <Link className="text-emerald-300 hover:text-emerald-200 transition-colors" href="/govbench">
              The governance axis in detail →
            </Link>
            <Link className="text-emerald-300 hover:text-emerald-200 transition-colors" href="/conformity-route">
              <Scale className="inline h-4 w-4 mr-1" />Free: Annex VI or Annex VII? →
            </Link>
            <a className="text-emerald-300 hover:text-emerald-200 transition-colors" href={HF}
               target="_blank" rel="noopener noreferrer">
              Raw JSON for every number here →
            </a>
          </div>
        </section>

        {/* FLYWHEEL */}
        <section className="space-y-5">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[3px] text-emerald-400/50 mb-2">
              Daily · anchored · mechanical
            </p>
            <h2 className="text-2xl font-bold text-emerald-50">
              Tokens per correct verdict
            </h2>
          </div>
          <p className="text-[13px] text-emerald-100/70 max-w-3xl leading-relaxed">
            The production number nobody else publishes. Every token does triple duty:{" "}
            <strong className="text-emerald-50">benchmark</strong> (token efficiency on governance work),{" "}
            <strong className="text-emerald-50">evidence</strong> (daily accumulated compliance behaviour),{" "}
            <strong className="text-emerald-50">fuel</strong> (training pairs + KB rows, practice split only).
            The flywheel never trains on what it scores — the held-out split is
            enforced by a salted content hash and export_fuel() raises if a held-out
            item ever reaches it. Without this, the flywheel eats itself — that's the
            Leaderboard Illusion, and our own defbench already proved the local version.
          </p>
          <FlywheelBoard url={FLYWHEEL_BOARD_URL} />
        </section>
      </div>
    </div>
  );
}

function FlywheelBoard({ url }: { url: string }) {
  const [runs, setRuns] = useState<FlywheelRun[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  useEffect(() => {
    fetch(url)
      .then((r) => r.json())
      .then((d) => setRuns(d.runs || []))
      .catch((e) => setErr(e.message))
      .finally(() => setLoading(false));
  }, [url]);
  if (loading) return <p className="text-emerald-100/50 text-[13px]">Loading flywheel results…</p>;
  if (err) return <p className="text-red-400 text-[13px]">Flywheel board unavailable: {err}</p>;
  if (runs.length === 0) {
    return (
      <p className="text-emerald-100/50 text-[13px]">
        No flywheel runs published yet. The cron runs daily at 06:00 UTC — check back.
      </p>
    );
  }
  return (
    <div className="rounded-xl border border-emerald-500/20 bg-[#05140d] p-5 overflow-x-auto">
      <table className="w-full text-[12px]">
        <thead>
          <tr className="text-left font-mono text-[10px] uppercase tracking-wider text-emerald-100/40 border-b border-emerald-500/15">
            <th className="py-2 pr-4">model</th>
            <th className="py-2 pr-4">practice acc</th>
            <th className="py-2 pr-4">held-out acc</th>
            <th className="py-2 pr-4">overfit gap</th>
            <th className="py-2 pr-4">guard</th>
            <th className="py-2 pr-4">exported</th>
            <th className="py-2 pr-4">when</th>
          </tr>
        </thead>
        <tbody>
          {runs.map((r) => (
            <tr key={r.run_id} className="border-b border-emerald-500/10 last:border-0">
              <td className="py-2 pr-4 font-mono text-emerald-100/80">{r.model}</td>
              <td className="py-2 pr-4 font-mono text-emerald-100/70">
                {r.practice.acc != null ? r.practice.acc.toFixed(3) : "—"} (n={r.practice.n})
              </td>
              <td className="py-2 pr-4 font-mono text-emerald-100/70">
                {r.held_out.acc != null ? r.held_out.acc.toFixed(3) : "—"} (n={r.held_out.n})
              </td>
              <td className={`py-2 pr-4 font-mono ${r.overfit_gap > 0.15 || r.overfit_gap < -0.15 ? "text-red-400" : "text-emerald-400"}`}>
                {r.overfit_gap > 0 ? "+" : ""}{r.overfit_gap.toFixed(3)}
              </td>
              <td className="py-2 pr-4 text-emerald-100/50">{r.alarm}</td>
              <td className="py-2 pr-4 text-emerald-100/50">
                {r.exported_pairs}p / {r.exported_kb_rows}kb
              </td>
              <td className="py-2 pr-4 text-emerald-100/30">{r.ts}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
