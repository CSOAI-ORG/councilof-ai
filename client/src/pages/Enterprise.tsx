/**
 * /enterprise — measuring a portfolio of AI systems.
 *
 * REWRITTEN 2026-08-20 (inner-page uplift). The previous version carried claims
 * this estate cannot stand behind and which the content canon forbids:
 *   • "87% cost reduction", "74% cost reduction", "99.9%", "hundreds of enterprises",
 *     "Fortune 500 bank with 47 AI systems" — invented counters and case studies with
 *     no source endpoint.
 *   • "33 AI Agents in Council" as a live counter — the council is a DESIGN figure;
 *     the consensus/fault-tolerance property was RETRACTED (DR-0007).
 *   • a mock dashboard rendering "ISO 42001: Certified" / "EU AI Act: Compliant", plus
 *     FAQ copy promising "certification-ready documentation that auditors accept" and
 *     "SOC 2 Type II compliance" — Council of AI certifies nothing and holds no such
 *     attestation. See /trust-center for what we have NOT been awarded.
 * Everything below is either sourced, read live from the wire, or removed.
 *
 * Design: the homepage scroll-world language via components/pagekit/PageKit.
 */

import { useEffect, useState } from "react";
import { setMetaDescription } from "@/lib/utils";
import { Band, Caveat, PageHero, Panel, PanelGrid } from "@/components/pagekit/PageKit";
import { BoardCount } from "@/components/pagekit/useBoardCount";

const FAQ = [
  {
    q: "Which regimes can you measure a system against?",
    a: "The EU AI Act is the primary instrument. Beyond it we crosswalk an evidenced control set covering NIST AI RMF, ISO/IEC 42001 and TC260, so a control you already hold can be mapped onto the duty it satisfies rather than re-evidenced from scratch. The crosswalk is published — you can read the mapping before you rely on it.",
  },
  {
    q: "How does the assessment avoid single-vendor bias?",
    a: "Verdicts are produced by deterministic predicates reading a recorded trace — no model judges another model, ours included. Where a designed multi-provider council is used, it is a design, and its measured performance (including where it loses) is published on the Refutation Ledger rather than asserted here.",
  },
  {
    q: "What do we actually receive?",
    a: "A signed measurement record per system: the axis results with their sample sizes, the intervals where the n supports one, the gaps named individually, and an Ed25519 signature over the canonical content. It exports as JSON and verifies offline against the key published at did:web:csoai.org.",
  },
  {
    q: "Is this a certification we can show an auditor?",
    a: "No, and we will not describe it as one. Council of AI is a measurement body: it issues no conformity mark, no accreditation and no approval. What you can show an auditor is a signed record of what your system did on a published test, which they can recompute themselves. That is a different — and checkable — kind of evidence.",
  },
  {
    q: "What happens when we fail an axis?",
    a: "You get the failing rows and a machine-readable finding, and you take it to whoever you like — your own team, your existing vendor, anyone. We publish remediation recipes but we do not sell or operate remediation for anything we measure, and re-measurement afterwards is free and cannot be bought. That rule is written down in the Firewall Charter.",
  },
  {
    q: "What happens when the law changes underneath us?",
    a: "A measurement taken against last year's text quietly stops meaning anything. The governing corpus is watched daily and state changes are published to the regulation feed, so a re-measurement trigger is observable rather than promised.",
  },
  {
    q: "How do we handle a large portfolio?",
    a: "Systems are registered individually but managed together — bulk import by CSV/JSON or through the API, with grouping and tagging so a portfolio owner can see which systems are measured, which are stale, and which have never been measured at all.",
  },
  {
    q: "What do you do with our data?",
    a: "Your system documentation is used to run the measurement you asked for and nothing else. We do not train models on it. For our actual security posture — including the attestations we have NOT been awarded — read the Trust Center rather than taking a badge on a marketing page at face value.",
  },
];

const PORTFOLIO = [
  {
    n: "01",
    h: "Register the portfolio",
    b: "Bulk import by CSV, JSON or API. Each system gets its own profile; grouping and tagging keep a hundred of them legible.",
  },
  {
    n: "02",
    h: "Measure against the duties that bind it",
    b: "Deterministic predicates, frozen published splits, and a sample size on every result. No model judges another model.",
  },
  {
    n: "03",
    h: "Take the signed record",
    b: "One small Ed25519-signed card per system, verifiable offline against a key published on the domain itself.",
  },
  {
    n: "04",
    h: "Re-measure when something moves",
    b: "Your model changes, or the statute does. The corpus is watched daily and state changes are published, so staleness is visible.",
  },
];

export default function Enterprise() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  useEffect(() => {
    document.title = "Enterprise — measure a portfolio of AI systems | Council of AI";
    setMetaDescription("Measure a portfolio of AI systems against the duties that actually bind them: deterministic grading, a sample size on every result, and an Ed25519-signed record per system. Measurement, not certification.");
  }, []);

  return (
    <div className="min-h-screen bg-white">
      <PageHero
        kicker="For CISOs, compliance leads and portfolio owners"
        title={<>Find out what your AI systems actually do.</>}
        lede={
          <>
            You are accountable for systems you did not build, on evidence supplied by the people who
            built them. We measure each one against the duties that bind it, hand you a signed record
            per system, and tell you plainly which ones we could not measure at all.
          </>
        }
        image={{ src: "/images/coliseum_humans_vs_humanoids.jpg", alt: "Human overseers facing a line of humanoid systems across the arena floor" }}
        points={[
          { tag: "pain", text: "Your evidence for a high-risk system is a vendor questionnaire nobody can independently check." },
          { tag: "benefit", text: "A signed measurement per system, with sample sizes, that your auditor can recompute without us." },
          { tag: "usp", text: "We never sell you the fix for what we measure — and re-measurement afterwards is free and unpurchasable." },
        ]}
        actions={[
          { href: "/assess", label: "Measure one system — free" },
          { href: "/gspc-scoreboard", label: "See the live board", tone: "ghost" },
        ]}
        footnote={
          <>
            Measurement, not certification. Council of AI issues no conformity mark, no accreditation
            and no approval — and it never tells you, or anyone else, that you are compliant.
          </>
        }
      />

      <Band
        tone="tint"
        kicker="Why the stakes moved"
        title={<>The Act stopped being a consultation and started being a deadline.</>}
        lede={
          <>
            Infringement of the prohibited-practice rules carries penalties of up to €35 million or 7%
            of worldwide annual turnover, whichever is higher. The uncomfortable part is not the
            number — it is that most organisations cannot currently say what their systems do.
          </>
        }
      >
        <PanelGrid cols={3}>
          <Panel>
            <div className="text-3xl font-black tracking-tight text-emerald-700 sm:text-4xl">
              <BoardCount />
            </div>
            <p className="mt-2 text-sm font-bold text-gray-900">Axes on the public board</p>
            <p className="mt-1 text-[12px] leading-snug text-gray-500">
              Read live from GET /api/gspc on every page load — never typed into this page.
            </p>
          </Panel>
          <Panel>
            <div className="text-3xl font-black tracking-tight text-emerald-700 sm:text-4xl">4</div>
            <p className="mt-2 text-sm font-bold text-gray-900">Crosswalked control sets</p>
            <p className="mt-1 text-[12px] leading-snug text-gray-500">
              EU AI Act, NIST AI RMF, ISO/IEC 42001, TC260 — the evidenced set, published at /crosswalk.
            </p>
          </Panel>
          <Panel>
            <div className="text-3xl font-black tracking-tight text-emerald-700 sm:text-4xl">Free</div>
            <p className="mt-2 text-sm font-bold text-gray-900">Verification, for everyone, forever</p>
            <p className="mt-1 text-[12px] leading-snug text-gray-500">
              Anyone can check any signed record against did:web:csoai.org. No account, no key exchange.
            </p>
          </Panel>
        </PanelGrid>
      </Band>

      <Band
        kicker="How a portfolio runs"
        title={<>Four steps, repeated whenever something moves.</>}
        lede={
          <>
            Nothing here requires you to trust a dashboard. Every step ends in an artefact you hold
            and can check yourself.
          </>
        }
        actions={[
          { href: "/payg", label: "Wire it into your own tooling" },
          { href: "/integrations", label: "See the integrations", tone: "ghost" },
        ]}
      >
        <PanelGrid cols={2}>
          {PORTFOLIO.map((p) => (
            <Panel key={p.n}>
              <span className="font-mono text-xs font-bold tracking-[0.2em] text-emerald-600">{p.n}</span>
              <h3 className="mt-2 text-xl font-black tracking-tight text-gray-900">{p.h}</h3>
              <p className="mt-2 text-[15px] leading-relaxed text-gray-600">{p.b}</p>
            </Panel>
          ))}
        </PanelGrid>
      </Band>

      <Band
        kicker="The independence rule"
        title={<>We will never quote you for the fix.</>}
        lede={
          <>
            Most AI assurance vendors grade you and then sell you the remediation, which makes the
            grade a sales lead. We publish the finding and the recipe, and any provider you like can
            implement it. Re-measurement afterwards runs on the same free queue as everyone else, and
            cannot be bought or expedited.
          </>
        }
        points={[
          { tag: "pain", text: "A grader with a remediation upsell has a commercial reason to find problems, and to find them again." },
          { tag: "benefit", text: "Findings you can take to anyone, and a re-measure that costs you nothing." },
          { tag: "usp", text: "Nobody we measure or rank pays us for measurement, placement, cadence or visibility." },
        ]}
        actions={[{ href: "/firewall-charter", label: "Read the Firewall Charter", tone: "ghost" }]}
      />

      <Band
        tone="tint"
        kicker="Questions we get asked"
        title={<>The awkward ones, answered first.</>}
        lede={<>Including the one where the answer is no.</>}
      >
        <div className="mx-auto max-w-3xl space-y-3">
          {FAQ.map((item, i) => (
            <div key={item.q} className="overflow-hidden rounded-2xl border border-emerald-900/10 bg-white">
              <button
                type="button"
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                aria-expanded={openFaq === i}
                className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left"
              >
                <span className="text-[16px] font-bold text-gray-900">{item.q}</span>
                <span className="shrink-0 text-xl font-black text-emerald-600">
                  {openFaq === i ? "−" : "+"}
                </span>
              </button>
              {openFaq === i && (
                <p className="border-t border-gray-100 px-6 py-5 text-[15px] leading-relaxed text-gray-600">
                  {item.a}
                </p>
              )}
            </div>
          ))}
        </div>
      </Band>

      <Band width="prose" kicker="Before you commit anything" title={<>What this is not.</>}>
        <div className="space-y-6">
          <Caveat title="Not certification, not compliance, not advice">
            <p>
              Council of AI is a <strong>measurement body</strong>. It is not a certification body,
              not an accreditation body and not a notified body. It issues no conformity mark, and
              nothing it produces says that you or your systems are compliant with the EU AI Act or
              any other regime. Only your own competent authority and your own counsel can tell you
              that.
            </p>
            <p>
              A signed record says one thing precisely: <strong>this system did this on this
              published test, on this date, and here is the signature over it</strong>. That is a
              genuinely useful input to a compliance file — and it is not the file.
            </p>
            <p>
              For our actual security posture, including the attestations we have{" "}
              <strong>not</strong> been awarded, read the{" "}
              <a href="/trust-center" className="font-semibold underline">
                Trust Center
              </a>{" "}
              rather than a badge on a marketing page.
            </p>
          </Caveat>

          <div className="rounded-2xl border border-emerald-900/10 bg-white p-6 shadow-[0_18px_50px_-32px_rgba(4,18,12,.45)]">
            <h3 className="text-2xl font-black tracking-tight text-gray-900">Start with one system.</h3>
            <p className="mt-3 text-[15px] leading-relaxed text-gray-600">
              Run the free signed check on a single system before anyone signs anything. If the output
              is not useful to you, you have lost two minutes.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <a
                href="/assess"
                className="inline-flex items-center rounded-xl bg-emerald-500 px-6 py-3 text-base font-extrabold text-white shadow-lg transition-colors hover:bg-emerald-400"
              >
                Measure one system — free
              </a>
              <a
                href="/contact"
                className="inline-flex items-center rounded-xl border border-emerald-600/30 px-6 py-3 text-base font-bold text-emerald-800 transition-colors hover:bg-emerald-50"
              >
                Talk to us about a portfolio
              </a>
            </div>
          </div>
        </div>
      </Band>
    </div>
  );
}
