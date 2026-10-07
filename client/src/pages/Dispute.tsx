import { useEffect } from "react";
import { Link } from "wouter";
import PlainEmail from "@/components/PlainEmail";

// /dispute — appeals & dispute resolution: every decision is reviewable; a measurement body
// with no appeal path is a court with no defence counsel (GAP-E2E HM.0). An allegation is not a
// verdict — it is measured before it is answered (PRODUCT-E2E HU.5).
//
// Public copy carries no internal labels (audit 2026-09-28 #30): "Charter Article 18" is not the
// Article 18 the live /charter/ page shows, and "Boundary #7" is defined nowhere public.
// Contact is the one mailbox (lib/buying.ts CONTACT_MAILBOX, rendered by PlainEmail), the address the footer uses: councilof.ai publishes no MX record,
// so a @councilof.ai address cannot receive mail (audit #2). The ledger is /corrections/, not
// /refutation-ledger (a page of experiments); the verifier is /gspc-verify/, not the board JSON
// (audit #12). Two paths, not one: an instrument run is re-run, and a disclosure-lag or claim
// record is re-read against the primary source you send (audit #13).

const PATH = [
  {
    step: "1",
    title: "Raise the dispute",
    body: "Identify the card, board cell, or instrument run you contest. A dispute needs standing (you or your system are the subject of the published result) and substance (a specific claim, not a general objection).",
  },
  {
    step: "2",
    title: "We measure, we don't argue",
    body: "We re-run the frozen instrument exactly as published — same items, same scoring code, same seed discipline — and publish the re-run as a new signed record. An allegation is never answered with an assertion; it is answered with a measurement.",
  },
  {
    step: "3",
    title: "Reasoned decision",
    body: "You receive a written decision: findings of fact, the evidence, the application of the instrument, and the outcome. If we were wrong, the correction is published on the same surface the original was — superseded, never deleted. History stays append-only.",
  },
  {
    step: "4",
    title: "No dead ends",
    // OWNER_REVIEW (2026-09-26): no independent or separate arbiter exists today. Do not reintroduce
    // arbiter wording until one is appointed and named on this page.
    body: "Today the owner of CSOAI Ltd reviews every dispute; there is no independent arbiter yet, and we do not claim one. Every outcome, including a rejection, is entered in the public corrections ledger. External judicial review is never closed off.",
  },
];

const STANDING = [
  "The measured party (company, model, or system named in a published result)",
  "A licensee or member affected by a decision",
  "A member of the public directly affected by a published measurement",
  "Any AI system subject to a published result — the instrument measures everyone, including the people selling it",
];

const GUARANTEES = [
  "Notice — a clear explanation of the decision, the reasoning, and the evidence",
  "A hearing — written arguments, evidence, and a response to opposing arguments",
  "A reasoned decision — findings of fact, application of the instrument, clear outcome",
  "A public record — the outcome is entered in the corrections ledger at /corrections",
  "The courts — external judicial review is never closed off",
];

const LEDGER_LD = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  name: "Appeals & dispute resolution",
  description:
    "How to contest a published CSOAI measurement. Every decision is reviewable; disputes are answered with re-measurement on the frozen instrument, never with assertions.",
  url: "https://councilof.ai/dispute",
  publisher: { "@type": "Organization", name: "CSOAI Ltd", url: "https://councilof.ai", identifier: "UK Companies House 16939677" },
};

export default function Dispute() {
  useEffect(() => {
    document.title = "Appeals & dispute resolution | Council of AI";
  }, []);

  return (
    <div className="min-h-screen bg-[#fafaf7] text-[#0c1a12]">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(LEDGER_LD) }} />
      <div className="mx-auto max-w-3xl px-5 py-14">
        <p className="text-xs font-semibold uppercase tracking-widest text-emerald-700">
          Appeals &amp; dispute resolution
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
          A measurement you can contest is a measurement you can trust.
        </h1>
        <p className="mt-4 text-lg leading-relaxed text-slate-700">
          Every published result on this estate is reviewable. Power must be checked —
          including the power of the measurer. If you contest a card, a board cell, or an
          instrument run, this is the path. It costs nothing, it is open to anyone with
          standing, and the answer is always a re-measurement or a re-reading of the source,
          never a defence.
        </p>

        <div className="mt-8 rounded-xl border border-emerald-200 bg-emerald-50 p-5 text-sm text-emerald-900">
          <strong>Stated plainly:</strong> an allegation is not a verdict. A dispute is not
          answered with an assertion — it is answered by re-running the frozen instrument, or by
          re-reading the primary source, and publishing the result. We measure first, we decide
          after.
        </div>

        <h2 className="mt-10 text-xl font-bold">The path</h2>
        <ol className="mt-4 space-y-4">
          {PATH.map((p) => (
            <li key={p.step} className="flex gap-4 rounded-xl border border-slate-200 bg-white p-5">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-600 font-bold text-white">
                {p.step}
              </div>
              <div>
                <h3 className="font-bold">{p.title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-slate-600">{p.body}</p>
              </div>
            </li>
          ))}
        </ol>

        <h2 className="mt-10 text-xl font-bold">Who can appeal</h2>
        <ul className="mt-3 list-disc space-y-2 pl-5 leading-relaxed text-slate-700">
          {STANDING.map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ul>

        <h2 className="mt-10 text-xl font-bold">What every appellant is entitled to</h2>
        <ul className="mt-3 list-disc space-y-2 pl-5 leading-relaxed text-slate-700">
          {GUARANTEES.map((g) => (
            <li key={g}>{g}</li>
          ))}
        </ul>

        <h2 className="mt-10 text-xl font-bold">What happens to the record</h2>
        <p className="mt-3 leading-relaxed text-slate-700">
          Corrections are <strong>published, never silently edited</strong>. The original
          record stays — history is append-only — and the correction is a new signed record
          on the same surface, linked to the one it supersedes. The corrections ledger is
          public at{" "}
          <Link href="/corrections/" className="text-emerald-700 underline">
            /corrections
          </Link>
          : it opens with our own errors, and it grows when a dispute shows we were wrong.
        </p>

        <h2 className="mt-10 text-xl font-bold">How to raise one</h2>
        <p className="mt-3 leading-relaxed text-slate-700">
          Disputes run through the same intake as everything else on this estate — via{" "}
          <Link href="/contact/" className="text-emerald-700 underline">
            /contact
          </Link>
          , citing the card hash or board cell you contest. There is no fee, no account, and
          no pay-to-prioritise: a dispute that sits in a paid queue would be a measurement
          body selling access to its own appeal — that is exactly what this estate does not do.
        </p>

        <div className="mt-8 rounded-xl border border-slate-200 bg-white p-5">
          <h3 className="font-bold">Direct dispute contact</h3>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">
            {/* PlainEmail, not a bare mailto (2026-10-07): /dispute is the objection route the
                /api/corrections and /api/claims/register envelopes name, and Cloudflare's Email
                Address Obfuscation turned a bare mailto here into "[email protected]" for every
                reader without JavaScript. */}
            Email{" "}
            <PlainEmail subject="Dispute" className="text-emerald-700 underline font-medium" />{" "}
            with the card hash, board cell, instrument run or record you contest. Include your
            name, organisation (if applicable), and the specific claim you are raising.
          </p>
          <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900">
            <strong>Response SLA:</strong> acknowledgement within 3 business days. Reasoned
            decision within 20 business days of receipt. If we need more time (complex
            measurement re-runs), we tell you before day 20 and give a revised date.
          </div>
        </div>

        <div className="mt-8 rounded-xl border border-slate-200 bg-white p-5" data-testid="dispute-primary-source">
          <h3 className="font-bold">Named in a disclosure-lag or claim record?</h3>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">
            Some records do not come from an instrument run: a disclosure-lag measurement or a claim
            record reads what was published, where and when. Send the primary source (URL and date)
            to{" "}
            <PlainEmail subject="Primary source" className="text-emerald-700 underline font-medium" />
            . We re-read it, move the row to PRIMARY if it qualifies, and log the outcome in the{" "}
            <Link href="/corrections/" className="text-emerald-700 underline">
              corrections ledger
            </Link>
            .
          </p>
        </div>

        <div className="mt-8 rounded-xl border border-slate-200 bg-white p-5">
          <h3 className="font-bold">Re-measurement policy</h3>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">
            Every dispute is answered with a re-measurement on the frozen instrument — same items,
            same scoring code, same seed discipline. The re-run is published as a new signed record
            on the same surface as the original. If the re-run differs, the correction supersedes
            (never deletes) the original. The corrections ledger at{" "}
            <Link href="/corrections/" className="text-emerald-700 underline">
              /corrections
            </Link>{" "}
            records every correction, starting with our own.
          </p>
        </div>

        <div className="mt-12 rounded-xl border border-emerald-200 bg-emerald-50 p-5 text-sm text-emerald-900">
          Even guardians need guardians. The instrument measures everyone, including the
          people selling it — verify any signed card free at{" "}
          <Link href="/gspc-verify/" className="underline">
            /gspc-verify
          </Link>
          , in your own browser, no account, no key.
        </div>
      </div>
    </div>
  );
}
