import { useEffect } from "react";
import { Link } from "wouter";
import { setMetaDescription } from "@/lib/utils";

/**
 * /postmortems/x402-settlement-reading — public postmortem of the 2026-09-05
 * x402 "lost settlement" claim. Every fact below is drawn verbatim from the
 * public corrections ledger entry C-2026-0905-05 (GET /api/corrections).
 * Radical transparency is the trust mechanism: the claim was ours, it was
 * wrong, and the record of it being wrong is the artifact.
 * No number on this page is typed from memory; each is quoted from the ledger
 * entry or the live endpoint named beside it.
 */

const ARTICLE_LD = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: "Postmortem: the x402 settlement that was never lost, and the claim that was wrong",
  datePublished: "2026-09-12",
  url: "https://councilof.ai/postmortems/x402-settlement-reading",
  publisher: { "@type": "Organization", name: "CSOAI Ltd", url: "https://councilof.ai", identifier: "UK Companies House 16939677" },
  author: { "@type": "Organization", name: "CSOAI Ltd", url: "https://councilof.ai" },
  description:
    "On 2026-09-05 a merged commit claimed a confirmed x402 settlement never reached the revenue ledger. That was false — a read taken 6 seconds after settle against an eventually consistent store. This postmortem records the claim, the two real defects the re-read uncovered, and the fixes.",
};

const TIMELINE: { when: string; what: string }[] = [
  {
    when: "2026-09-05 — settle",
    what:
      "An x402 payment settled on the rail. The settlement WAS recorded by the revenue ledger.",
  },
  {
    when: "+6 seconds",
    what:
      "A read of the ledger was taken 6 seconds after the settle. Cloudflare KV list operations are eventually consistent — the record had not propagated. The read showed nothing.",
  },
  {
    when: "the false claim",
    what:
      "A merged commit and its PR (#1321) stated the settlement never reached the ledger: \u201ca real payment settled and the ledger never saw it\u201d. That statement is false. No payment was ever lost.",
  },
  {
    when: "~20 minutes later",
    what:
      "The same endpoint was re-read in the same session: GET /api/revenue one_number showed settlements 1, all_time 1, records_unreadable 0. The two readings disagreed while nothing else had changed — the signature of a consistency window, not a lost write.",
  },
  {
    when: "2026-09-05 — recorded",
    what:
      "Corrections ledger entry C-2026-0905-05 records the false claim. The commit message cannot be rewritten; the ledger entry is the standing correction.",
  },
];

const FIXES: { title: string; body: string }[] = [
  {
    title: "Real defect 1 — a catch that swallowed failure.",
    body:
      "recordSettlement had swallowed every KV error into an empty catch, so a failed write and no settlement really were indistinguishable. It now returns {stored, reason}. The diagnosis was wrong; this fix stands on its own merits and is unaffected by the correction.",
  },
  {
    title: "Real defect 2 — a zero-value settle counted as a buyer.",
    body:
      "One zero-value settle from an ephemeral wallet moved one_number.all_time from 0 to 1, counting a wallet we created and controlled, paying nothing, as a distinct non-self buyer. Settlement records now carry zero_value, because the payer-exclusion list can never enumerate a throwaway key.",
  },
  {
    title: "Process rule — re-read before you accuse the ledger.",
    body:
      "The check that caught this costs one line: read the same endpoint twice, minutes apart. A measurement body\u2019s own claims are measurements; they get the same re-read discipline we ask of anyone else.",
  },
];

export default function PostmortemX402() {
  useEffect(() => {
    document.title =
      "Postmortem — the x402 settlement that was never lost | Council of AI";
    setMetaDescription(
      "Public postmortem, 2026-09-05: a merged commit claimed an x402 settlement never reached the revenue ledger. It had — the read was 6 seconds after settle against an eventually consistent store. Corrections ledger C-2026-0905-05.",
    );
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 via-white to-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(ARTICLE_LD) }}
      />
      <div className="mx-auto max-w-3xl px-6 py-16">
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-emerald-600">
          Postmortem · 2026-09-05 · corrections ledger C-2026-0905-05
        </p>
        <h1 className="mt-3 text-4xl font-black leading-tight text-gray-900">
          The settlement that was never lost — and the claim that was wrong.
        </h1>
        <p className="mt-4 text-lg text-gray-600">
          We published a claim about our own x402 payment rail that was false. This page is the
          standing postmortem: what we said, what was true, the two real defects the re-read
          uncovered, and the fixes. The primary record is the public corrections ledger,{" "}
          <a className="text-emerald-700 underline" href="/api/corrections">
            GET /api/corrections
          </a>
          , entry <strong>C-2026-0905-05</strong> — this page quotes it, it does not replace it.
        </p>

        <section className="mt-10 rounded-xl border border-emerald-600/15 bg-white p-5 shadow-sm">
          <h2 className="text-base font-extrabold text-gray-900">What was claimed — and what was true</h2>
          <p className="mt-2 text-[15px] leading-relaxed text-gray-600">
            A merged commit stated that a confirmed x402 settlement never reached the revenue
            ledger. The settlement <strong>was</strong> recorded. The reading behind the claim was
            taken 6 seconds after the settle, and Cloudflare KV list operations are eventually
            consistent — the record had not propagated yet. Re-read ~20 minutes later, the ledger
            showed the settlement, with zero unreadable records. No payment was ever lost.
          </p>
        </section>

        <h2 className="mt-12 text-2xl font-black leading-tight text-gray-900">Timeline</h2>
        <div className="mt-6 space-y-5">
          {TIMELINE.map((t) => (
            <section key={t.when} className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <h3 className="text-sm font-extrabold uppercase tracking-wide text-emerald-700">{t.when}</h3>
              <p className="mt-2 text-[15px] leading-relaxed text-gray-600">{t.what}</p>
            </section>
          ))}
        </div>

        <h2 className="mt-12 text-2xl font-black leading-tight text-gray-900">
          What was actually defective — and fixed
        </h2>
        <div className="mt-6 space-y-5">
          {FIXES.map((f) => (
            <section key={f.title} className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <h3 className="text-base font-extrabold text-gray-900">{f.title}</h3>
              <p className="mt-2 text-[15px] leading-relaxed text-gray-600">{f.body}</p>
            </section>
          ))}
        </div>

        <h2 className="mt-12 text-2xl font-black leading-tight text-gray-900">
          Where the rail stands today
        </h2>
        <section className="mt-6 rounded-xl border border-emerald-600/15 bg-white p-5 shadow-sm">
          <ul className="list-disc space-y-2 pl-5 text-[15px] leading-relaxed text-gray-600">
            <li>
              The x402 discovery document is live at{" "}
              <a className="text-emerald-700 underline" href="/.well-known/x402.json">
                /.well-known/x402.json
              </a>{" "}
              (x402 v2, exact scheme, network eip155:8453, mode: live) — verified 2026-09-12.
            </li>
            <li>
              The paid door returns a correct HTTP 402 challenge. Settlement requires a payer
              authorisation; independent tracker x402-list.com shows zero revenue and zero
              buyers in the last 30 days for this service (checked 2026-09-12). Honest zeros are
              the current numbers.
            </li>
            <li>
              Settlement records now distinguish zero-value self-tests from real payers
              (the <code>zero_value</code> field above), so the revenue endpoint cannot again count
              our own ephemeral wallet as a customer.
            </li>
          </ul>
        </section>

        <p className="mt-10 text-sm text-gray-500">
          Why publish this: a measurement body that asks others to show their provenance publishes
          its own failures first. The ledger is the product.{" "}
          <Link href="/doctrine" className="text-emerald-700 underline">
            Doctrine &amp; refusals
          </Link>
          {" · "}
          <Link href="/honesty" className="text-emerald-700 underline">
            Honesty gate
          </Link>
          {" · "}
          <a className="text-emerald-700 underline" href="/api/corrections">
            /api/corrections
          </a>
        </p>
      </div>
    </div>
  );
}
