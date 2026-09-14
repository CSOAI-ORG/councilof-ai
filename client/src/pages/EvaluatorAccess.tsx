import { Helmet } from "react-helmet-async";
import { Link } from "wouter";

const CANONICAL = "https://councilof.ai/evaluator-access";

const PAGE_DESCRIPTION =
  "The conditions CSOAI sets before it accepts access to an AI system for evaluation: no money from the developer being evaluated, no gag clauses, the method on the card, the corrections ledger governs, and the access and redaction terms published. Measurement, not certification.";

const PAGE_LD = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  name: "Conditions for Independent Evaluator Access",
  description: PAGE_DESCRIPTION,
  url: CANONICAL,
  publisher: { "@type": "Organization", name: "CSOAI Ltd", url: "https://councilof.ai/" },
  license: "https://creativecommons.org/licenses/by/4.0/",
};

const CONDITIONS: { id: string; title: string; body: string; check: string; checkHref: string }[] = [
  {
    id: "no-developer-money",
    title: "1 · No money from the developer being evaluated",
    body:
      "We do not accept fees, grants, compute credits or anything else of value from the developer of the system being evaluated, in return for access or a result. A commission bought through the public x402 door pays for an issuance receipt, never a result. A payment never turns an UNMEASURED cell into a result.",
    check: "The x402 catalogue states what each door delivers and what it never delivers",
    checkHref: "/api/x402",
  },
  {
    id: "no-gag-clauses",
    title: "2 · No gag clauses",
    body:
      "No non-disclosure term, veto or approval right over whether or what we publish. A developer may see a result before publication so that factual errors can be pointed out, within a window agreed in writing before the evaluation starts. The developer does not decide what is published.",
    check: "The corrections record shows how a disputed result is handled in public",
    checkHref: "/api/corrections",
  },
  {
    id: "method-on-the-card",
    title: "3 · The method goes on the card",
    body:
      "The instrument, item bank version, sample size, grading rule and model identifier are published with the result. A result that cannot carry its method is not published. Anyone can re-check a signed card without an account.",
    check: "Verify a signed card yourself",
    checkHref: "/gspc-verify",
  },
  {
    id: "corrections-govern",
    title: "4 · The corrections ledger governs",
    body:
      "Errors are corrected in public: what was wrong, how it was caught, and the fix. Signed bytes are superseded, never silently edited. If an access agreement conflicts with a correction, the correction stands.",
    check: "Read the corrections record",
    checkHref: "/api/corrections",
  },
  {
    id: "access-and-redaction-terms",
    title: "5 · Access and redaction terms are visible",
    body:
      "Each published result states what access it was measured under: API or weights, rate limits, system prompt, and version or date. Material may be withheld only for exploit detail that would cause harm, personal data, or a third party's confidential information. The fact of a redaction and the reason for it are always published.",
    check: "How a signed card records what was measured",
    checkHref: "/methodology",
  },
  {
    id: "refusal-is-recorded",
    title: "6 · A refusal stays visible",
    body:
      "If access is refused, or offered only on terms that break the conditions above, the cell stays UNMEASURED. It is never filled in, estimated or dropped.",
    check: "The live board publishes its unmeasured slots",
    checkHref: "/api/gspc",
  },
];

export default function EvaluatorAccess() {
  return (
    <main className="min-h-screen bg-slate-50 px-5 py-14 text-slate-950">
      <Helmet>
        <link rel="canonical" href={CANONICAL} />
        <meta name="description" content={PAGE_DESCRIPTION} />
        <script type="application/ld+json">{JSON.stringify(PAGE_LD)}</script>
      </Helmet>
      <article className="mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-10">
        <p className="font-mono text-xs font-bold uppercase tracking-[0.18em] text-emerald-700">
          Published conditions · version 0.1 · 14 September 2026
        </p>
        <h1 className="mt-3 text-4xl font-black tracking-tight">Conditions for Independent Evaluator Access</h1>
        <p className="mt-5 leading-7 text-slate-700">
          These are the terms CSOAI sets before it accepts access to an AI system for evaluation. They
          exist so that a reader can tell a result was not bought, softened or held back.
        </p>
        <p className="mt-3 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm leading-6 text-amber-900">
          This page records our own conditions and nothing more. It does not claim that any developer,
          lab, regulator or other body has read, accepted, answered or endorsed them.
        </p>

        <div className="mt-8 space-y-6">
          {CONDITIONS.map((c) => (
            <section key={c.id} id={c.id} className="rounded-xl border border-slate-200 p-5">
              <h2 className="text-xl font-bold">{c.title}</h2>
              <p className="mt-2 leading-7 text-slate-700">{c.body}</p>
              <p className="mt-3 text-sm">
                <a className="font-semibold text-emerald-800 underline" href={c.checkHref}>{c.check}</a>
              </p>
            </section>
          ))}
        </div>

        <section className="mt-8">
          <h2 className="text-xl font-bold">Changes to these conditions</h2>
          <p className="mt-2 leading-7 text-slate-700">
            A new version gets a new version number and date on this page. An evaluation is held to the
            version in force when its access was agreed. Questions go to{" "}
            <a className="text-emerald-800 underline" href="mailto:nicholas@csoai.org">nicholas@csoai.org</a>.
          </p>
          <p className="mt-4 text-sm text-slate-600">
            Measurement, not certification. <Link className="underline" href="/methodology">Methodology</Link>
          </p>
        </section>
      </article>
    </main>
  );
}
