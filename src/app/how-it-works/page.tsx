import type { Metadata } from "next";
import Link from "next/link";
import { ShieldCheck, Signature, Bitcoin, Users, Vote, FileCheck2, ArrowRight } from "lucide-react";

export const metadata: Metadata = {
  title: "How CSOAI Works | Council Safety of AI",
  description:
    "A weighted multi-model council (Claude, Hermes, Kimi) deliberates, a tie-breaking judge decides, and every verdict is Ed25519-signed and Bitcoin-anchored — independently verifiable, no black box.",
  alternates: { canonical: "/how-it-works" },
  openGraph: {
    title: "How CSOAI Works | Council Safety of AI",
    description:
      "Weighted multi-model council + tie-breaking judge, Ed25519 Sigil-signed verdicts, Bitcoin-anchored ledger. Trust-minimized AI governance — verify any verdict yourself.",
    type: "website",
  },
};

const flow = [
  {
    icon: Vote,
    step: "1",
    title: "Submit a decision",
    body: "A governance question — a policy check, a content verdict, an agent action — enters the council via the API or dashboard.",
  },
  {
    icon: Users,
    step: "2",
    title: "Council deliberation",
    body: "A weighted multi-model council (Claude, Hermes, Kimi and other pluggable brains) analyses the decision in parallel from distinct personas, each scored on confidence.",
  },
  {
    icon: FileCheck2,
    step: "3",
    title: "Tie-breaking judge",
    body: "A judge model resolves the weighted vote. Ties are honest: a tied verdict is marked unattestable and is NOT signed — we never dress an inconclusive vote as a confident one.",
  },
  {
    icon: Signature,
    step: "4",
    title: "Sigil Ed25519 signature",
    body: "Only a winning, non-tied verdict is signed with an Ed25519 Sigil attestation, binding the decision to the council substrate and the issuer key.",
  },
  {
    icon: Bitcoin,
    step: "5",
    title: "Bitcoin-anchored ledger",
    body: "Signed verdicts join a hash-chained ledger whose Merkle root is timestamped on Bitcoin via OpenTimestamps — externally anchored, not just self-signed.",
  },
  {
    icon: ShieldCheck,
    step: "6",
    title: "Return a verifiable receipt",
    body: "You get the verdict plus a signed, anchored receipt. Anyone can re-verify it in their browser against the public issuer key — no call to CSOAI required.",
  },
];

export default function HowItWorksPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Hero */}
      <section className="border-b border-white/5 bg-gradient-to-b from-slate-900/40 to-slate-950">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
          <p className="text-emerald-400 text-xs font-bold tracking-widest uppercase mb-4">
            How it works
          </p>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tighter mb-6">
            A governed council you can verify, not a black box you must trust.
          </h1>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto">
            CSOAI runs a weighted multi-model council — Claude, Hermes, Kimi and other pluggable
            brains — with a tie-breaking judge. Every winning verdict is Ed25519-signed and the
            ledger is Bitcoin-anchored, so any decision is independently checkable. No governance
            tokens, no on-chain voting theatre — just cryptography and an audit trail.
          </p>
          <div className="flex flex-wrap justify-center gap-4 mt-8">
            <Link
              href="/council"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold transition"
            >
              See the live council <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/verify"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-emerald-500/30 hover:bg-emerald-500/10 text-emerald-400 font-bold transition"
            >
              Verify a verdict
            </Link>
          </div>
        </div>
      </section>

      {/* The flow */}
      <section className="py-24 border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-5xl font-black tracking-tighter mb-6">
              From question to signed receipt
            </h2>
            <p className="text-lg text-slate-400">
              Six steps, each producing an artifact you can re-check. The signing and anchoring are
              the difference between a governance claim and governance proof.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {flow.map((s) => (
              <div
                key={s.step}
                className="rounded-2xl border border-white/10 bg-white/[0.03] p-7 hover:border-emerald-500/30 transition"
              >
                <div className="flex items-center gap-3 mb-3">
                  <s.icon className="w-6 h-6 text-emerald-400" />
                  <span className="text-xs font-bold text-slate-500 tracking-widest">
                    STEP {s.step}
                  </span>
                </div>
                <h3 className="text-lg font-bold mb-2">{s.title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why signed + anchored, not "blockchain voting" */}
      <section className="py-24 border-b border-white/5 bg-slate-900/20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-3xl sm:text-5xl font-black tracking-tighter mb-6">
              Why signing and anchoring beat a token vote
            </h2>
            <p className="text-lg text-slate-400">
              Most "decentralised AI governance" is a token-weighted vote on a smart contract —
              trust the token holders, trust the chain, never check the model. CSOAI inverts that:
              the proof is in the signature, and the signature is anchored outside any CSOAI system.
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="rounded-2xl border border-red-500/20 bg-red-500/[0.03] p-7">
              <h3 className="text-lg font-bold text-red-400 mb-3">Token-vote governance</h3>
              <ul className="space-y-2 text-sm text-slate-400">
                <li>• Trust resides in token holders, not in the decision</li>
                <li>• The model&apos;s reasoning is never verifiable</li>
                <li>• A coin majority can override a correct verdict</li>
                <li>• &ldquo;On-chain&rdquo; ≠ &ldquo;checked&rdquo; — the vote is logged, the AI is not</li>
              </ul>
            </div>
            <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/[0.05] p-7">
              <h3 className="text-lg font-bold text-emerald-400 mb-3">Signed + anchored governance</h3>
              <ul className="space-y-2 text-sm text-slate-300">
                <li>• Every winning verdict is Ed25519-signed by the council issuer key</li>
                <li>• Ties are flagged unattestable and never signed — no false confidence</li>
                <li>• The ledger Merkle root is timestamped on Bitcoin (OpenTimestamps)</li>
                <li>• Verification is client-side, against a public key — no CSOAPI call needed</li>
              </ul>
            </div>
          </div>
          <p className="text-xs text-slate-600 mt-6 text-center">
            CSOAI issues no governance tokens and runs no on-chain voting. The only chain usage is
            Bitcoin timestamping of the signed ledger&apos;s Merkle root.
          </p>
        </div>
      </section>

      {/* The measured result — the real evidence, not "15-30% accuracy" */}
      <section className="py-24 border-b border-white/5">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-emerald-400 text-xs font-bold tracking-widest uppercase mb-3">
            The evidence
          </p>
          <h2 className="text-3xl sm:text-5xl font-black tracking-tighter mb-6">
            The proof is a signed ledger, not a marketing stat.
          </h2>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto mb-10">
            Sovereign Town runs the governed-vs-ungoverned counterfactual across dozens of hives and
            ~1.45 billion signed episodes. With the Sovereign Gate on, violations are blocked at the
            gate by construction; with it off, the same agents produce tens of millions of
            violations. That counterfactual — and the Ed25519 chain it is signed into — is the
            measurable claim. Verify it yourself.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/sovereign-town"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold transition"
            >
              Explore Sovereign Town <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/verify"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-emerald-500/30 hover:bg-emerald-500/10 text-emerald-400 font-bold transition"
            >
              Verify the ledger
            </Link>
          </div>
          <p className="text-xs text-slate-600 mt-8 max-w-2xl mx-auto">
            We do not publish &ldquo;X% more accurate than a single model&rdquo; figures. Comparative
            accuracy depends on task, model and benchmark; the durable, falsifiable claim is the
            signed counterfactual above.
          </p>
        </div>
      </section>

      {/* Integration — honest surfaces only, no fabricated SDKs */}
      <section className="py-24 bg-slate-900/20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-3xl sm:text-5xl font-black tracking-tighter mb-6">
              Work with it
            </h2>
            <p className="text-lg text-slate-400">
              No &ldquo;pip install&rdquo; magic. The real surfaces today are the public proof layer
              and a design-partner pilot for teams that want the council wired into their own
              governance flow.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-5">
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-7">
              <h3 className="font-bold mb-2 text-emerald-400">Public proof layer</h3>
              <p className="text-sm text-slate-400 mb-4">
                The signed ledger head and Bitcoin anchor are public. Verify any entry in your
                browser, or read the live council dome.
              </p>
              <div className="flex flex-col gap-2 text-sm">
                <Link href="/verify" className="text-emerald-400 hover:underline">/verify — ledger verifier</Link>
                <Link href="/council" className="text-emerald-400 hover:underline">/council — live dome</Link>
                <Link href="/sovereign-town" className="text-emerald-400 hover:underline">/sovereign-town — the counterfactual</Link>
              </div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-7">
              <h3 className="font-bold mb-2 text-emerald-400">Design-partner pilot</h3>
              <p className="text-sm text-slate-400 mb-4">
                Wire the council into your policy, content or agent-action review. We integrate with
                your risk engine and your regulator observes.
              </p>
              <a
                href="mailto:nicholas@csoai.org?subject=Council%20design-partner%20pilot"
                className="text-emerald-400 hover:underline text-sm"
              >
                Request a pilot →
              </a>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-7">
              <h3 className="font-bold mb-2 text-emerald-400">Certification</h3>
              <p className="text-sm text-slate-400 mb-4">
                Run a CSOAI compliance audit against DORA, NIS2, GDPR or the EU AI Act. Certified
                decisions carry a signed Watchdog certificate.
              </p>
              <Link href="/certification" className="text-emerald-400 hover:underline text-sm">
                /certification →
              </Link>
            </div>
          </div>
          <p className="text-xs text-slate-600 mt-8 text-center max-w-2xl mx-auto">
            Simulation output is research-grade and predictive only. No named-firm assertions. Public
            data sources are cited and OGL-UK-3.0 / public-domain where applicable.
          </p>
        </div>
      </section>
    </div>
  );
}