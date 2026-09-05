import { useEffect } from "react";
import { useBoardCount } from "@/lib/boardCount";

/**
 * /compare and /vs/:slug — what Council of AI publishes, beside what a
 * compliance-automation platform is for.
 *
 * ── WHY THIS PAGE WAS REWRITTEN ──────────────────────────────────────────────
 * The previous version rendered a six-row capability matrix with five columns:
 * CSOAI, Vanta, Drata, Credo AI, OneTrust. Five of the six rows hard-coded
 * `false` for all four named companies, and `false` rendered as a bare grey
 * dash with no legend anywhere on the page. So the page asserted, about four
 * identifiable live companies, that they do not do five specific things — with
 * no source, no date, no assessment behind any cell, and no key telling the
 * reader what the dash even meant.
 *
 * That is not merely an honesty problem. UK comparative advertising is governed
 * by the Business Protection from Misleading Marketing Regulations 2008 (reg 4),
 * which permits a comparison identifying a competitor only where it compares
 * features that are "material, relevant, verifiable and representative", and
 * which prohibits discrediting or denigrating a competitor. An unsourced `false`
 * about a named company fails both limbs at once: it is not verifiable, and it
 * is discrediting. It was the worst cell on the site.
 *
 * ── WHAT REPLACED IT ─────────────────────────────────────────────────────────
 * Every row is now a claim about US, with the artifact that settles it in the
 * same row. That is the only kind of cell this page can support: we can publish
 * the bytes behind our own row, and we have not audited anyone else's product.
 * The category difference is stated once, in prose, in terms that describe what
 * a compliance-automation platform is FOR — which its own vendors state — and
 * it names no company in a comparative claim.
 *
 * The four /vs/:slug URLs are kept: they answer a real question a buyer types,
 * nominative use of a trademark to say what we are not is lawful, and deleting
 * them would strand inbound links. What changed is that naming a company no
 * longer licenses an unsupported claim about it.
 *
 * NOTHING HERE MAY BECOME A COMPETITOR SCORECARD AGAIN without, per row, per
 * company: a dated citation to that company's own published material, and a
 * legend. Absent those, the row is about us or it is not on the page.
 */

/** Rows are claims about Council of AI, each with the artifact that settles it. */
const ROWS: { claim: string; proof: string; href: string; external?: boolean }[] = [
  {
    claim: "Independent measurement of published model behaviour, not a self-attestation",
    proof: "The living board — every axis, with its bench, its n and its separation verdict",
    href: "/api/gspc",
    external: true,
  },
  {
    claim: "Empty cells stay empty — an unmeasured slot is published, not hidden",
    proof: "The board's own totals separate slots from measurements, and name the unmeasured ones",
    href: "/gspc-scoreboard",
  },
  {
    claim: "Ed25519-signed cards a stranger can recompute with no account and no call back to us",
    proof: "The preimage rule and the zero-dependency offline verifier",
    href: "/signed/HOW-TO-VERIFY.md",
    external: true,
  },
  {
    claim: "Every chain position is published — a withheld card cannot hide as an absence",
    proof: "The full chain, head to genesis, including the positions whose bodies we do not publish",
    href: "/signed/chain.json",
    external: true,
  },
  {
    claim: "A corrections ledger when our own number turns out to be wrong",
    proof: "The corrections ledger — appended, never edited: what was wrong, how it was caught, the fix",
    href: "/api/corrections",
    external: true,
  },
  {
    claim: "Measurement, not certification — we do not certify, accredit, enforce or remediate",
    proof: "The frozen rules every grade is computed under, and the boundary stated in them",
    href: "/methodology",
  },
];

const FAQS = [
  {
    q: "How is Council of AI different from a compliance-automation platform?",
    a: "They are for different jobs. A compliance-automation platform helps an organisation collect, organise and keep current the evidence of its own controls — its own systems, its own policies, its own attestations. Council of AI measures published model behaviour against frozen rules, signs the result, and publishes what it could not measure. One is your evidence locker; the other is an outside reading you did not produce. Most organisations that want the second still need the first.",
  },
  {
    q: "Can I use a GRC platform and still get a Council of AI measurement?",
    a: "Yes, and that is the normal case. A measurement card is a signed record of one graded run. It does not replace a controls programme and it is not an audit. Read the living board at GET /api/gspc and recompute a card at /gspc-verify.",
  },
  {
    q: "Is there an open, checkable AI measurement board?",
    a: "Yes — GET https://councilof.ai/api/gspc. Counts, stamps and per-axis rows live there, and no page types them. The signing keys are published at did:web:csoai.org on https://csoai.org/.well-known/did.json.",
  },
  {
    q: "Who decides whether a system is lawful?",
    a: "Regulators, notified bodies and courts. We measure against an obligation and sign the result; we do not enforce it, we issue no certification, and we will not give a legal opinion or fill an empty cell.",
  },
  {
    q: "Do you rate or score the vendors named on this page?",
    a: "No. We have not assessed Vanta, Drata, Credo AI or OneTrust, and this page publishes no finding about any of them. If we ever do assess a product, it will appear as a signed card on the board with its bench and its n, like every other measurement — not as a tick in a marketing table.",
  },
];

const JSONLD = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: FAQS.map((f) => ({
    "@type": "Question",
    name: f.q,
    acceptedAnswer: { "@type": "Answer", text: f.a },
  })),
};

const FOCUS: Record<string, string> = {
  vanta: "Vanta",
  drata: "Drata",
  "credo-ai": "Credo AI",
  credo: "Credo AI",
  onetrust: "OneTrust",
};

export default function Compare({ focus }: { focus?: string }) {
  const fname = focus ? FOCUS[focus.toLowerCase()] || "" : "";
  const board = useBoardCount();
  const focusFaq = fname
    ? {
        q: `Council of AI vs ${fname} — what is the difference?`,
        a:
          `${fname} publishes its own description of what its product does; read it there rather than here, ` +
          `because we have not assessed it and will not characterise it for you. What we can tell you is what ` +
          `we do: we measure published model behaviour against frozen rules, sign each result Ed25519, publish ` +
          `every chain position including the withheld ones, and label what we could not measure as unmeasured. ` +
          `Verification is free forever and needs no account. If you are choosing between an evidence-collection ` +
          `platform and an outside measurement, the honest answer is that they are different purchases.`,
      }
    : null;
  const allFaqs = focusFaq ? [focusFaq, ...FAQS] : FAQS;

  useEffect(() => {
    document.title = fname
      ? `Council of AI vs ${fname} — measurement, not compliance automation | Council of AI`
      : "Council of AI vs Vanta, Drata, Credo AI, OneTrust — measurement, not compliance automation | Council of AI";
    let m = document.querySelector('meta[name="description"]') as HTMLMetaElement | null;
    const prev = m?.content;
    if (!m) {
      m = document.createElement("meta");
      m.name = "description";
      document.head.appendChild(m);
    }
    m.content =
      "What Council of AI publishes, with the artifact behind every row: a living board, signed cards anyone can recompute, every chain position, and a corrections ledger. We have not assessed the vendors named here and publish no finding about them. Measurement, not certification.";
    const ld = focusFaq
      ? {
          ...JSONLD,
          mainEntity: [
            { "@type": "Question", name: focusFaq.q, acceptedAnswer: { "@type": "Answer", text: focusFaq.a } },
            ...JSONLD.mainEntity,
          ],
        }
      : JSONLD;
    const s = document.createElement("script");
    s.type = "application/ld+json";
    s.id = "cmp-ld";
    s.text = JSON.stringify(ld);
    document.getElementById("cmp-ld")?.remove();
    document.head.appendChild(s);
    return () => {
      document.getElementById("cmp-ld")?.remove();
      if (prev !== undefined && m) m.content = prev;
    };
  }, [focus]);

  return (
    <div className="min-h-screen bg-white">
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-emerald-900 to-teal-900 py-16 text-white">
        <div
          className="pointer-events-none absolute inset-0"
          style={{ background: "radial-gradient(700px 380px at 80% -10%, rgba(45,212,191,.22), transparent 60%)" }}
        />
        <div className="relative mx-auto max-w-6xl px-6">
          <p className="font-mono text-[11px] uppercase tracking-[2px] text-emerald-300/80">
            Council of AI — comparison
          </p>
          <h1 className="mt-3 text-4xl font-black tracking-tight sm:text-4xl">
            {fname ? `Council of AI vs ${fname}` : "Council of AI vs Vanta, Drata, Credo AI, OneTrust"}
          </h1>
          <p className="mt-4 max-w-3xl text-lg text-emerald-50/90">
            {fname
              ? `${fname} is a compliance-automation platform and describes its own scope on its own site. This page describes ours, and puts the artifact behind every line of it.`
              : "Those are compliance-automation platforms, and each describes its own scope on its own site. This page describes ours — and puts the artifact behind every line of it."}
          </p>
          <p className="mt-3 max-w-3xl text-sm text-emerald-100/70">
            Every row below is a claim about Council of AI with a link that settles it. There is no row
            about anyone else, because we have not assessed anyone else.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-12">
        <h2 className="text-2xl font-black tracking-tight text-gray-900">
          What we publish — and where to check it
        </h2>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-gray-600">
          The board today: <span className="font-semibold text-emerald-700">{board.public_count}</span>{" "}
          {board.live ? (
            <span className="text-gray-500">— read from GET /api/gspc as this page loaded.</span>
          ) : (
            <span className="text-gray-500">
              — the last recorded observation; the live board could not be read and the endpoint wins.
            </span>
          )}
        </p>

        {/* min-w + this container's own scroll: at 375px a two-column table of
            prose with no minimum collapses to two-character columns. The page
            body still never scrolls sideways. */}
        <div className="mt-6 overflow-x-auto rounded-2xl border border-gray-200">
          <table className="w-full min-w-[480px] border-collapse text-sm">
            <thead>
              <tr className="bg-emerald-50/60 text-left">
                <th className="px-4 py-3 font-bold text-gray-900">What Council of AI publishes</th>
                <th className="px-4 py-3 font-bold text-gray-900">The artifact that settles it</th>
              </tr>
            </thead>
            <tbody>
              {ROWS.map((r) => (
                <tr key={r.claim} className="border-t border-gray-100 align-top">
                  <td className="px-4 py-3 font-medium text-gray-800">{r.claim}</td>
                  <td className="px-4 py-3 text-gray-600">
                    {r.proof}
                    <a
                      href={r.href}
                      {...(r.external ? { rel: "noopener" } : {})}
                      className="ml-1 whitespace-nowrap font-semibold text-emerald-700 underline"
                    >
                      {r.href} →
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* The affiliation + no-assessment notice. This page names four live companies;
            it must say what that naming does and does not mean, on the page itself. */}
        <p className="mt-6 max-w-3xl rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-[12px] leading-relaxed text-gray-600">
          Vanta, Drata, Credo AI and OneTrust are trademarks of their respective owners. Council of AI
          (CSOAI Ltd, UK Companies House 16939677) is not affiliated with, endorsed by, or partnered
          with any of them. Their names appear here because buyers ask how we differ from them — not
          as the subject of any finding. <strong>We have not assessed any of their products</strong>,
          we publish no measurement of them, and nothing on this page should be read as a statement
          about what their products do or do not do; read that from them. If anything here is wrong
          it is a defect: tell us at nicholas@csoai.org and the correction is published in our ledger.
        </p>

        <div className="mt-8 flex flex-wrap gap-3">
          <a
            href="/dashboard?tab=board"
            className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-emerald-500"
          >
            Read the living board →
          </a>
          <a
            href="/gspc-verify"
            className="rounded-xl border border-emerald-300 px-5 py-2.5 text-sm font-semibold text-emerald-700 hover:bg-emerald-50"
          >
            Verify a card — free, no account →
          </a>
        </div>

        <div className="mt-14 border-t border-gray-100 pt-10">
          <h2 className="text-2xl font-black tracking-tight text-gray-900">Frequently asked</h2>
          <dl className="mt-6 max-w-3xl space-y-6">
            {allFaqs.map((f) => (
              <div key={f.q}>
                <dt className="font-bold text-gray-900">{f.q}</dt>
                <dd className="mt-1.5 leading-relaxed text-gray-600">{f.a}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>
    </div>
  );
}
