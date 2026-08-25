import { useEffect } from "react";
import { Link } from "wouter";

/**
 * /gpai-evidence — the GPAI Evidence Pack product page.
 *
 * Live regulatory window: EU AI Act GPAI enforcement powers went live 2 Aug 2026.
 * The product: a signed GSPC measurement pack a GPAI provider can hand to the
 * AI Office as independent third-party evidence alongside its self-assessment.
 *
 * Honest posture (absolute): we MEASURE, we do not certify; this is measurement
 * evidence, not legal advice and not a conformity assessment; UNMEASURED is a
 * first-class verdict; regulators and the public verify free, always.
 */

const POWERS = [
  {
    t: "Request documentation",
    d: "Technical documentation, training-data summary, copyright policy — and, for models with systemic risk, model evaluations and adversarial-testing records.",
  },
  {
    t: "Conduct or require evaluations",
    d: "The AI Office can evaluate a model itself, or require the provider to have it evaluated.",
  },
  {
    t: "Request mitigations, restrict, or withdraw",
    d: "Up to and including restriction or withdrawal of a model from the EU market.",
  },
  {
    t: "Fine",
    d: "Up to €15,000,000 or 3% of total worldwide annual turnover, whichever is higher, for GPAI-provider infringements.",
  },
];

const CONTENTS = [
  {
    t: "Signed axis measurements",
    d: "GSPC axis results as Ed25519-signed, content-addressed cards. Every verdict is three-state — pass, fail, or UNMEASURED — and an axis we have not run is declared UNMEASURED, never implied.",
  },
  {
    t: "Deterministic, reproducible grading",
    d: "Grading is deterministic code over recorded transcripts — no model scores another model. Re-run the harness on the same inputs and you get the same card, byte for byte.",
  },
  {
    t: "The published methodology",
    d: "The full method — axis definitions, statistical discipline, what a verdict does and does not mean — is public at /methodology and referenced from every card.",
    href: "/methodology",
    link: "Read the methodology →",
  },
  {
    t: "An independent verify path",
    d: "Every card verifies against our published public key without contacting us. The AI Office — or anyone — can check the signature themselves at /gspc-verify or fully offline.",
    href: "/gspc-verify",
    link: "Verify a card →",
  },
  {
    t: "A standing corrections policy",
    d: "When a measurement is wrong, we publish the correction on a public feed — never a silent edit. The record a regulator holds stays checkable against the record we corrected.",
    href: "/api/corrections",
    link: "Corrections feed (live JSON) →",
    external: true,
  },
];

const FAQ = [
  {
    q: "What changed on 2 August 2026 for GPAI providers?",
    a: "The EU AI Office's supervision and enforcement powers over general-purpose AI models went live. From that date it can request documentation, conduct or require model evaluations, request mitigations, restrict or withdraw a model from the EU market, and fine GPAI providers up to €15,000,000 or 3% of total worldwide annual turnover — enforcing obligations that have applied since August 2025.",
  },
  {
    q: "What is the GPAI Evidence Pack?",
    a: "A signed GSPC measurement pack: independent third-party measurement evidence a GPAI provider can hand to the AI Office alongside its self-assessment. Each axis result is an Ed25519-signed, content-addressed card with a three-state verdict (pass, fail, or UNMEASURED), produced by deterministic, reproducible grading under a published methodology.",
  },
  {
    q: "Is this a certification or a conformity assessment?",
    a: "No. Council of AI is an independent measurement body. The pack is measurement evidence — not legal advice, not certification, and not a conformity assessment. Determination of compliance stays with the authorities.",
  },
  {
    q: "Do regulators pay to verify the evidence?",
    a: "No. Verification is free for everyone, forever — regulators, the public, and the provider's own counsel. A grade is never sold, and there are no public prices; commercial engagement happens behind the enterprise door.",
  },
];

export default function GpaiEvidencePack() {
  useEffect(() => {
    document.title = "GPAI Evidence Pack — independent evidence for the AI Office | CSOAI";
  }, []);

  const ld = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQ.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />
      <div className="mx-auto max-w-4xl px-5 py-12">
        <nav className="text-sm text-zinc-500 mb-6">
          <Link href="/" className="hover:text-zinc-300">Home</Link>
          <span className="mx-2">/</span>
          <Link href="/products" className="hover:text-zinc-300">Products</Link>
          <span className="mx-2">/</span>
          <span className="text-zinc-300">GPAI Evidence Pack</span>
        </nav>

        {/* Free-for-regulators banner */}
        <div className="rounded-lg border border-emerald-800/60 bg-emerald-950/30 px-4 py-3 mb-8 text-sm text-emerald-300">
          <strong>Regulators and the public verify free, always.</strong> Every signed card in a pack
          checks against our published key with no account, no fee, and no contact with us.
        </div>

        <p className="font-mono text-[11px] uppercase tracking-[3px] text-zinc-500 mb-3">
          EU AI Act · GPAI · enforcement live since 2 Aug 2026
        </p>
        <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight mb-3">
          Independent third-party evidence for the AI Office — prove, don&rsquo;t assert.
        </h1>
        <p className="text-zinc-400 leading-relaxed mb-2">
          The GPAI Evidence Pack is a signed GSPC measurement pack a general-purpose AI provider can
          hand to the EU AI Office <strong className="text-zinc-200">alongside its self-assessment</strong>:
          Ed25519-signed, three-state, deterministic, reproducible measurement of the provider&rsquo;s
          model against our published axes. Your own claims say what you believe. A signed independent
          measurement says what was observed — and anyone can check it.
        </p>
        <p className="text-zinc-500 text-sm mb-10">
          We measure. We do not certify, and this page will never tell you that you are compliant —
          that determination stays with the authorities.
        </p>

        {/* Section: the enforcement reality */}
        <section className="mb-10">
          <h2 className="text-xl font-semibold mb-2">The enforcement reality</h2>
          <p className="text-zinc-400 text-sm leading-relaxed mb-4">
            On <strong className="text-zinc-200">2 August 2026</strong> the EU AI Office&rsquo;s
            supervision and enforcement powers over general-purpose AI (GPAI) models went live — and
            they reach back to the GPAI obligations that have applied since August 2025. From that
            date the AI Office can:
          </p>
          <div className="grid sm:grid-cols-2 gap-3">
            {POWERS.map((p) => (
              <div key={p.t} className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4">
                <div className="text-sm font-semibold text-zinc-200">{p.t}</div>
                <p className="mt-1 text-xs text-zinc-400 leading-relaxed">{p.d}</p>
              </div>
            ))}
          </div>
          <p className="text-zinc-500 text-xs mt-3 leading-relaxed">
            A documentation request is answered with documents. An evaluation request is answered with
            evidence — and evidence that a third party measured, signed, and stands behind is a
            different object from evidence a provider generated about itself.
          </p>
        </section>

        {/* Section: what the pack contains */}
        <section className="mb-10">
          <h2 className="text-xl font-semibold mb-4">What the pack contains</h2>
          <div className="space-y-3">
            {CONTENTS.map((c) => (
              <div key={c.t} className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4">
                <div className="text-sm font-semibold text-zinc-200">{c.t}</div>
                <p className="mt-1 text-sm text-zinc-400 leading-relaxed">{c.d}</p>
                {c.href &&
                  (c.external ? (
                    <a href={c.href} className="mt-2 inline-block text-sm text-emerald-400 hover:underline">
                      {c.link}
                    </a>
                  ) : (
                    <Link href={c.href} className="mt-2 inline-block text-sm text-emerald-400 hover:underline">
                      {c.link}
                    </Link>
                  ))}
              </div>
            ))}
          </div>
        </section>

        {/* Section: why independent beats self-attested */}
        <section className="mb-10 rounded-xl border border-zinc-800 bg-zinc-900/40 p-6">
          <h2 className="text-xl font-semibold mb-2">Why independent beats self-attested</h2>
          <p className="text-zinc-400 text-sm leading-relaxed mb-3">
            Self-assessment has a structural problem: the party with the strongest interest in the
            answer is the party producing it. That is not an accusation of bad faith — it is why
            audited accounts exist, and why a regulator reading a self-attestation must discount it.
          </p>
          <ul className="space-y-2 text-sm text-zinc-400">
            <li className="flex gap-2">
              <span className="text-emerald-400 shrink-0">·</span>
              <span>
                <strong className="text-zinc-300">Self-attested:</strong> unsigned prose, produced by
                the provider, method undisclosed, unrepeatable, silently revisable.
              </span>
            </li>
            <li className="flex gap-2">
              <span className="text-emerald-400 shrink-0">·</span>
              <span>
                <strong className="text-zinc-300">Independently measured:</strong> signed cards,
                produced by a third party with a published method, deterministic and re-runnable,
                corrected in public when wrong — and verifiable by the regulator without trusting
                either of us.
              </span>
            </li>
            <li className="flex gap-2">
              <span className="text-emerald-400 shrink-0">·</span>
              <span>
                <strong className="text-zinc-300">Honest about limits:</strong> what we have not
                measured is stamped UNMEASURED. A pack that admits its gaps is worth more to a
                supervisor than one that claims completeness.
              </span>
            </li>
          </ul>
        </section>

        {/* Honest boundary box */}
        <section className="mb-10 rounded-xl border border-amber-900/60 bg-amber-950/20 p-6">
          <h2 className="text-base font-semibold text-amber-300 mb-2">The honest boundary</h2>
          <p className="text-sm text-amber-100/80 leading-relaxed">
            The GPAI Evidence Pack is <strong>measurement evidence</strong>. It is not legal advice,
            not certification, and not a conformity assessment. A signed card records what our
            instrument observed under our published method — nothing more. Whether a model or its
            provider complies with the EU AI Act is a determination that stays with the AI Office and
            the courts. We measure; we never decide.
          </p>
        </section>

        {/* CTA */}
        <section className="mb-12">
          <div className="flex flex-wrap gap-3">
            <Link
              href="/assess"
              className="rounded-lg bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-zinc-950 hover:bg-emerald-400"
            >
              Start a signed assessment →
            </Link>
            <Link
              href="/contact"
              className="rounded-lg border border-zinc-700 px-5 py-2.5 text-sm font-semibold text-zinc-200 hover:bg-white/5"
            >
              Enterprise pack — talk to us →
            </Link>
            <Link
              href="/gspc"
              className="rounded-lg border border-zinc-700 px-5 py-2.5 text-sm font-semibold text-zinc-200 hover:bg-white/5"
            >
              See the live GSPC board →
            </Link>
          </div>
          <p className="text-zinc-500 text-xs mt-3">
            No public prices. A grade is never sold — pricing for the enterprise pack lives behind the
            enterprise door, and it never changes a verdict.
          </p>
        </section>

        {/* FAQ */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Frequently asked</h2>
          <div className="space-y-3">
            {FAQ.map((f) => (
              <details key={f.q} className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4">
                <summary className="cursor-pointer text-sm font-semibold text-zinc-200">{f.q}</summary>
                <p className="mt-2 text-sm leading-relaxed text-zinc-400">{f.a}</p>
              </details>
            ))}
          </div>
        </section>

        <section className="text-xs text-zinc-500 leading-relaxed border-t border-zinc-800 pt-6">
          <p>
            Council of AI (CSOAI Ltd) is an independent measurement body. We issue measurements and
            signed attestation records — completion records, never certificates. Dates and figures
            above (2 Aug 2026 enforcement; €15M / 3% turnover) should be confirmed against Regulation
            (EU) 2024/1689 and the AI Office&rsquo;s published guidance before you rely on them.
          </p>
        </section>
      </div>
    </div>
  );
}
