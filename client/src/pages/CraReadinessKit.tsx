import { useEffect } from "react";
import { Link } from "wouter";

/**
 * /cra-readiness — the CRA Readiness Kit product page.
 *
 * Live regulatory window: EU Cyber Resilience Act (Regulation (EU) 2024/2847)
 * vulnerability- and incident-reporting obligations apply from 11 Sep 2026 —
 * 24h early warning / 72h notification / 14-day final report to ENISA via the
 * Single Reporting Platform.
 *
 * The product: the ENISA reporting runbook template + a CycloneDX SBOM workflow
 * + an SCA/CI gate pattern, in the same signed (Ed25519) dialect as every other
 * Council of AI artifact.
 *
 * Honest posture (absolute): template + tooling, not legal advice, not a
 * conformity assessment; no public prices; we run this workflow on our own
 * products before offering it to anyone else.
 */

const WINDOWS = [
  {
    w: "Early warning",
    d: "within 24 hours",
    s: "Initial notification that an actively exploited vulnerability or severe incident exists; whether it is believed unlawful or malicious; which member states may be affected. Minimal facts, sent fast.",
  },
  {
    w: "Notification",
    d: "within 72 hours",
    s: "Updated report: severity and impact assessment, and — where available — indicators of compromise plus any corrective or mitigating measures taken or advised.",
  },
  {
    w: "Final report",
    d: "within 14 days",
    s: "Full report: description of the vulnerability or incident, its severity and impact, root cause, and the mitigation or remediation applied. (For incidents: after handling.)",
  },
];

const TIMELINE = [
  {
    date: "11 Jun 2026",
    what: "Notified-body / conformity-assessment provisions apply",
    note: "The conformity-assessment framework is live — relevant if a product is later classified important or critical.",
  },
  {
    date: "11 Sep 2026",
    what: "Vulnerability- and incident-reporting obligations apply",
    note: "The 24h / 72h / 14-day ENISA reporting clocks are live. The runbook must be operational by this date.",
    hot: true,
  },
  {
    date: "11 Dec 2027",
    what: "Full conformity obligations apply",
    note: "CE marking, full essential-requirement conformity, and documentation obligations in force.",
  },
];

const KIT = [
  {
    t: "The ENISA reporting runbook template",
    d: "The step-by-step runbook: four named roles (Incident Lead, Engineering On-Call, Counsel/Compliance, Comms/Customer), the awareness-timestamp discipline that starts the clocks, the triage questions, and the 24h / 72h / 14-day filing sequence to ENISA and the relevant national CSIRT.",
  },
  {
    t: "CycloneDX SBOM generation, per release",
    d: "Working commands for JavaScript/TypeScript (npx @cyclonedx/cyclonedx-npm) and Python (cyclonedx-py) trees, aggregated per shipped artifact and regenerated on every dependency change — the machine-readable component inventory the CRA expects a manufacturer to hold.",
  },
  {
    t: "An SCA / CI gate pattern",
    d: "Software-composition analysis wired into CI so a known-vulnerable dependency fails the build: npm audit and pip-audit against the lockfiles, or an SBOM-aware scanner (Grype, Trivy, OSV-Scanner) over the generated CycloneDX files, with an accepted-risk note required to pass a high/critical finding.",
  },
  {
    t: "The incident-register pattern",
    d: "A minimal register where every candidate incident lands with its awareness timestamp, triage verdict, filings, and closure — so the 24-hour clock is measured from a recorded moment, not reconstructed from memory afterwards.",
  },
  {
    t: "The signing approach",
    d: "Every artifact in the kit — the SBOM, the runbook, the register entries — is signed with the same Ed25519 approach as the rest of our evidence rail, so a downstream operator or supervisor can verify what they were handed is what was produced.",
  },
];

const FAQ = [
  {
    q: "What starts on 11 September 2026 under the Cyber Resilience Act?",
    a: "From 11 September 2026, manufacturers of products with digital elements placed on the EU market must report actively exploited vulnerabilities and severe incidents to ENISA via the Single Reporting Platform, with notification also to the relevant national CSIRT: an early warning within 24 hours of becoming aware, an updated notification within 72 hours, and a final report within 14 days for a vulnerability (after handling, for an incident).",
  },
  {
    q: "Who is in scope?",
    a: "The CRA covers 'products with digital elements' placed on the EU market — software and connected hardware alike. If you ship a digital product into the EU, assume the reporting obligations reach you and confirm your exact classification with counsel.",
  },
  {
    q: "What is the CRA Readiness Kit?",
    a: "The evidence artifacts a product with digital elements needs, in one signed dialect: the ENISA reporting runbook template (roles, clocks, filing sequence), a CycloneDX SBOM generation workflow, an SCA gate pattern for CI, an incident-register pattern, and an Ed25519 signing approach so every artifact is verifiable.",
  },
  {
    q: "Is this legal advice or a conformity assessment?",
    a: "No. The kit is a template plus tooling. It is not legal advice and not a conformity assessment — confirm your scope, classification, and the precise reporting-window wording against Regulation (EU) 2024/2847 and ENISA platform guidance with your counsel.",
  },
];

export default function CraReadinessKit() {
  useEffect(() => {
    document.title = "CRA Readiness Kit — the 24h/72h/14-day runbook, signed | CSOAI";
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
          <span className="text-zinc-300">CRA Readiness Kit</span>
        </nav>

        <p className="font-mono text-[11px] uppercase tracking-[3px] text-zinc-500 mb-3">
          EU Cyber Resilience Act · Reg (EU) 2024/2847 · reporting live 11 Sep 2026
        </p>
        <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight mb-3">
          CRA reporting starts 11 Sep 2026 — the 24h/72h/14-day runbook, signed.
        </h1>
        <p className="text-zinc-400 leading-relaxed mb-2">
          From <strong className="text-zinc-200">11 September 2026</strong>, every manufacturer of a
          &ldquo;product with digital elements&rdquo; on the EU market owes ENISA an early warning
          within 24 hours of learning of an actively exploited vulnerability or severe incident, an
          updated notification within 72 hours, and a final report within 14 days — via the ENISA
          Single Reporting Platform, with the relevant national CSIRT notified too. The CRA Readiness
          Kit is the runbook, the SBOM workflow, and the CI gate that make those clocks survivable —
          every artifact in the same signed dialect as the rest of our evidence rail.
        </p>
        <p className="text-zinc-500 text-sm mb-10">
          A template plus tooling — not legal advice, not a conformity assessment.
        </p>

        {/* Section: deadline mechanics */}
        <section className="mb-10">
          <h2 className="text-xl font-semibold mb-2">The deadline mechanics</h2>
          <p className="text-zinc-400 text-sm leading-relaxed mb-4">
            Three clocks, all starting from the moment the manufacturer{" "}
            <strong className="text-zinc-200">becomes aware</strong>. The trigger is an actively
            exploited vulnerability in the product, or a severe incident affecting the product&rsquo;s
            security. Reports go to ENISA via the Single Reporting Platform, with notification also to
            the relevant national CSIRT.
          </p>
          <div className="overflow-x-auto rounded-lg border border-zinc-800 mb-4">
            <table className="w-full text-sm">
              <thead className="bg-zinc-900 text-zinc-400">
                <tr>
                  <th className="text-left font-medium px-3 py-2">Window</th>
                  <th className="text-left font-medium px-3 py-2">Deadline from awareness</th>
                  <th className="text-left font-medium px-3 py-2">What to submit</th>
                </tr>
              </thead>
              <tbody>
                {WINDOWS.map((w) => (
                  <tr key={w.w} className="border-t border-zinc-800/70 align-top">
                    <td className="px-3 py-2 font-semibold text-zinc-200 whitespace-nowrap">{w.w}</td>
                    <td className="px-3 py-2 text-emerald-400 font-semibold whitespace-nowrap">{w.d}</td>
                    <td className="px-3 py-2 text-zinc-400">{w.s}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="space-y-2">
            {TIMELINE.map((t) => (
              <div
                key={t.date}
                className={`flex items-start gap-3 rounded-lg border p-3 ${
                  t.hot ? "border-emerald-800/70 bg-emerald-950/20" : "border-zinc-800 bg-zinc-900/40"
                }`}
              >
                <span
                  className={`mt-0.5 shrink-0 rounded-full px-2 py-0.5 font-mono text-[10px] ${
                    t.hot ? "bg-emerald-500/15 text-emerald-300" : "bg-zinc-800 text-zinc-400"
                  }`}
                >
                  {t.date}
                </span>
                <div>
                  <div className="text-sm font-semibold text-zinc-200">{t.what}</div>
                  <p className="mt-0.5 text-xs text-zinc-400 leading-relaxed">{t.note}</p>
                </div>
              </div>
            ))}
          </div>
          <p className="text-zinc-500 text-xs mt-3 leading-relaxed">
            Who is in scope: any &ldquo;product with digital elements&rdquo; placed on the EU market —
            software and connected hardware alike. If you ship digital products into the EU, assume
            this reaches you and confirm the boundary with counsel.
          </p>
        </section>

        {/* Section: what the kit contains */}
        <section className="mb-10">
          <h2 className="text-xl font-semibold mb-4">What the kit contains</h2>
          <div className="space-y-3">
            {KIT.map((k) => (
              <div key={k.t} className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4">
                <div className="text-sm font-semibold text-zinc-200">{k.t}</div>
                <p className="mt-1 text-sm text-zinc-400 leading-relaxed">{k.d}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Section: we run this ourselves */}
        <section className="mb-10 rounded-xl border border-zinc-800 bg-zinc-900/40 p-6">
          <h2 className="text-xl font-semibold mb-2">We run this ourselves</h2>
          <p className="text-zinc-400 text-sm leading-relaxed mb-3">
            We ship digital products into the EU, so the 11 September clocks apply to us too. The kit
            is not theory sold at a distance: it is the same compliance pack we are standing up for
            our own products against the same date — the same runbook roles, the same CycloneDX
            commands over our own dependency trees, the same SCA gate in our own CI, the same Ed25519
            signing root.
          </p>
          <p className="text-zinc-500 text-xs leading-relaxed">
            Honestly stated: standing up a runbook is work — registering platform access, naming the
            roles, keeping the SBOM current on every release. We publish the workflow we practice, and
            where our own pack still has an open item, the pack says so rather than pretending
            otherwise.
          </p>
        </section>

        {/* Honest boundary box */}
        <section className="mb-10 rounded-xl border border-amber-900/60 bg-amber-950/20 p-6">
          <h2 className="text-base font-semibold text-amber-300 mb-2">The honest boundary</h2>
          <p className="text-sm text-amber-100/80 leading-relaxed">
            The CRA Readiness Kit is a <strong>template plus tooling</strong>. It is not legal advice
            and not a conformity assessment, and holding a signed SBOM does not make a product
            compliant. Whether the CRA classifies you as a manufacturer, which distribution modes
            cross its threshold, and the precise reporting-window wording are questions for Regulation
            (EU) 2024/2847, ENISA&rsquo;s platform guidance, and your counsel. We measure and we
            template; we never decide.
          </p>
        </section>

        {/* CTA */}
        <section className="mb-12">
          <div className="flex flex-wrap gap-3">
            <Link
              href="/contact"
              className="rounded-lg bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-zinc-950 hover:bg-emerald-400"
            >
              Get the kit — talk to us →
            </Link>
            <Link
              href="/blog/uk-cyber-security-resilience-bill-ai-supply-chain"
              className="rounded-lg border border-zinc-700 px-5 py-2.5 text-sm font-semibold text-zinc-200 hover:bg-white/5"
            >
              Free explainer: cyber-resilience law and the AI supply chain →
            </Link>
          </div>
          <p className="text-zinc-500 text-xs mt-3">
            No public prices — pricing lives behind the enterprise door. The explainer, like all our
            public material, is free for everyone, always.
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
            Council of AI (CSOAI Ltd) is an independent measurement body. Dates above (11 Jun 2026,
            11 Sep 2026, 11 Dec 2027; the 24h / 72h / 14-day windows) should be confirmed against the
            final text of Regulation (EU) 2024/2847 and ENISA Single Reporting Platform guidance
            before you rely on them — treat the tables here as operational scaffolding, not the legal
            text.
          </p>
        </section>
      </div>
    </div>
  );
}
