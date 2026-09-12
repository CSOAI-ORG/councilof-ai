import { useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { Link } from "wouter";
import { setPageMetadata } from "@/lib/utils";

const CANONICAL = "https://councilof.ai/postmortems/x402-settlement-reading";

const article = {
  "@context": "https://schema.org",
  "@type": "TechArticle",
  headline:
    "The x402 record that was never lost — and the claim that was wrong",
  description:
    "A public correction of CSOAI's 2026-09-05 x402 settlement diagnosis, including the defects the investigation did uncover and the controls added afterward.",
  datePublished: "2026-09-12",
  dateModified: "2026-09-12",
  url: CANONICAL,
  mainEntityOfPage: CANONICAL,
  author: {
    "@type": "Organization",
    name: "CSOAI Ltd",
    url: "https://councilof.ai/",
  },
  publisher: {
    "@type": "Organization",
    name: "CSOAI Ltd",
    url: "https://councilof.ai/",
    identifier: "UK Companies House 16939677",
  },
};

const timeline = [
  {
    label: "Settlement",
    body: "A zero-value x402 test from an operator-controlled throwaway wallet settled and the record was written. The record was not lost.",
  },
  {
    label: "+6 seconds",
    body: "A list read returned no settlement. Cloudflare KV list operations are eventually consistent, so the record had not yet appeared in that read.",
  },
  {
    label: "The wrong diagnosis",
    body: "PR #1321 said that a real payment settled and the ledger never saw it. That conclusion went beyond the observation.",
  },
  {
    label: "About 20 minutes later",
    body: "A repeat read reported settlements:1, all_time:1 and records_unreadable:0. That proved the write was visible and separately exposed that a zero-value test had been counted in all_time.",
  },
  {
    label: "Permanent correction",
    body: "Correction C-2026-0905-05 records the error. The original commit remains visible and the correction travels beside it.",
  },
];

const controls = [
  {
    title: "Recording failures are explicit",
    body: "The settlement recorder had swallowed KV write errors. It now returns stored:true or stored:false with a reason, so a failed write cannot masquerade as an empty ledger.",
  },
  {
    title: "Zero-value tests are excluded from buyers",
    body: "A zero-value settlement from a throwaway wallet had been counted as an outside buyer. Records now carry zero_value, because no wallet allowlist can enumerate every ephemeral test key.",
  },
  {
    title: "The grant and the observation are separate",
    body: "A confirmed facilitator settlement may still deliver the paid response if internal recording fails. The recording gap is retained for operators and is not rewritten as a payer-facing settlement fact.",
  },
  {
    title: "Claims require a repeat read",
    body: "A single list read is insufficient evidence of absence on an eventually consistent store. A negative operational claim now needs a repeat observation or a narrower label.",
  },
];

export default function PostmortemX402() {
  useEffect(() => {
    setPageMetadata({
      title:
        "X402 settlement postmortem — the record was not lost | Council of AI",
      description:
        "CSOAI's public correction of an incorrect x402 settlement diagnosis, the defects the investigation found, and the controls added afterward.",
      openGraphTitle: article.headline,
      openGraphDescription: article.description,
      openGraphType: "article",
    });
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 via-white to-white text-slate-950">
      <Helmet>
        <script type="application/ld+json">{JSON.stringify(article)}</script>
      </Helmet>

      <article className="mx-auto max-w-4xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
        <nav aria-label="Breadcrumb" className="text-sm text-slate-600">
          <Link
            href="/"
            className="underline decoration-slate-300 underline-offset-4 hover:text-emerald-800"
          >
            Council of AI
          </Link>
          <span aria-hidden="true" className="px-2">
            /
          </span>
          <span>Postmortems</span>
        </nav>

        <header className="mt-8">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-700">
            Public correction · 5 September 2026
          </p>
          <h1 className="mt-4 max-w-3xl text-3xl font-black leading-tight tracking-tight sm:text-5xl">
            The x402 record that was never lost — and the claim that was wrong.
          </h1>
          <p className="mt-6 max-w-3xl text-base leading-7 text-slate-700 sm:text-lg sm:leading-8">
            We published an incorrect diagnosis of our own payment rail. The
            settlement was recorded; our first read happened before the list
            view had converged. This page preserves the mistake, the evidence
            that corrected it and the controls the investigation produced.
          </p>
        </header>

        <section
          aria-labelledby="finding-heading"
          className="mt-10 rounded-2xl border border-emerald-700/20 bg-white p-5 shadow-sm sm:p-7"
        >
          <p className="font-mono text-xs font-bold uppercase tracking-wider text-emerald-800">
            Correction C-2026-0905-05
          </p>
          <h2
            id="finding-heading"
            className="mt-3 text-xl font-extrabold sm:text-2xl"
          >
            What the evidence establishes
          </h2>
          <p className="mt-3 leading-7 text-slate-700">
            The settlement was written. A read six seconds later did not show
            it. A repeat read about twenty minutes later did. The missing first
            result was evidence of an early read, not evidence of a lost
            payment.
          </p>
          <div className="mt-5 flex flex-wrap gap-3 text-sm font-semibold">
            <a
              href="/api/corrections"
              className="rounded-full bg-emerald-700 px-4 py-2 text-white hover:bg-emerald-800 focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:ring-offset-2"
            >
              Read the corrections ledger
            </a>
            <a
              href="https://github.com/CSOAI-ORG/councilof-ai/pull/1321"
              rel="noreferrer"
              target="_blank"
              className="rounded-full border border-slate-300 px-4 py-2 text-slate-800 hover:border-emerald-700 hover:text-emerald-800 focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:ring-offset-2"
            >
              Inspect PR #1321
              <span className="sr-only"> (opens in a new tab)</span>
            </a>
          </div>
        </section>

        <section aria-labelledby="timeline-heading" className="mt-14">
          <h2
            id="timeline-heading"
            className="text-2xl font-black tracking-tight sm:text-3xl"
          >
            Observation timeline
          </h2>
          <ol className="mt-6 grid gap-4">
            {timeline.map((item, index) => (
              <li
                key={item.label}
                className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6"
              >
                <div className="flex items-start gap-4">
                  <span
                    aria-hidden="true"
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-100 font-mono text-sm font-bold text-emerald-900"
                  >
                    {index + 1}
                  </span>
                  <div>
                    <h3 className="font-extrabold text-slate-950">
                      {item.label}
                    </h3>
                    <p className="mt-2 leading-7 text-slate-700">{item.body}</p>
                  </div>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <section aria-labelledby="controls-heading" className="mt-14">
          <h2
            id="controls-heading"
            className="text-2xl font-black tracking-tight sm:text-3xl"
          >
            Controls that remain after the correction
          </h2>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {controls.map((control) => (
              <section
                key={control.title}
                className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6"
              >
                <h3 className="font-extrabold text-slate-950">
                  {control.title}
                </h3>
                <p className="mt-2 leading-7 text-slate-700">{control.body}</p>
              </section>
            ))}
          </div>
        </section>

        <section
          aria-labelledby="current-heading"
          className="mt-14 rounded-2xl bg-slate-950 p-5 text-slate-100 sm:p-7"
        >
          <p className="font-mono text-xs font-bold uppercase tracking-wider text-emerald-300">
            Read current state from the system
          </p>
          <h2
            id="current-heading"
            className="mt-3 text-xl font-extrabold sm:text-2xl"
          >
            This postmortem does not freeze today’s counts.
          </h2>
          <p className="mt-3 leading-7 text-slate-300">
            Buyer, settlement and catalogue state can change. The first-party
            endpoints below remain the current records. A 402 challenge is an
            offer; it is not proof of settlement or delivery.
          </p>
          <ul className="mt-5 grid gap-3 text-sm sm:grid-cols-3">
            <li>
              <a
                className="block break-words rounded-xl border border-slate-700 p-3 font-mono text-emerald-300 hover:border-emerald-400"
                href="/.well-known/x402.json"
              >
                /.well-known/x402.json
              </a>
            </li>
            <li>
              <a
                className="block break-words rounded-xl border border-slate-700 p-3 font-mono text-emerald-300 hover:border-emerald-400"
                href="/api/revenue"
              >
                /api/revenue
              </a>
            </li>
            <li>
              <a
                className="block break-words rounded-xl border border-slate-700 p-3 font-mono text-emerald-300 hover:border-emerald-400"
                href="/feeds/receipts.xml"
              >
                /feeds/receipts.xml
              </a>
            </li>
          </ul>
        </section>

        <footer className="mt-12 border-t border-slate-200 pt-7 text-sm leading-6 text-slate-600">
          <p>
            Measurement, not certification. Corrections remain public.{" "}
            <Link
              href="/doctrine"
              className="font-semibold text-emerald-800 underline underline-offset-4"
            >
              Read the doctrine
            </Link>
            <span aria-hidden="true"> · </span>
            <Link
              href="/events/three-root-ceremony"
              className="font-semibold text-emerald-800 underline underline-offset-4"
            >
              Inspect the public-root record
            </Link>
          </p>
        </footer>
      </article>
    </div>
  );
}
