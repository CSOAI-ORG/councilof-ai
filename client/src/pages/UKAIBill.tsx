/**
 * /frameworks/uk-ai-bill — what UK law says about AI today.
 *
 * Correction, 6 Oct 2026. This page was a framework landing template for a "UK AI Bill" that
 * quoted a fine for non-compliance, an enforcement deadline, a risk-class scheme and an
 * exam. No enacted UK law sets any of them; the fine was invented. The UK has no
 * AI-specific statute in force, so it has no AI-specific penalty regime. The page now says
 * that plainly, names the existing law and regulators that do apply, and quotes no figure
 * it cannot source. The URL is kept because other pages and the Library link it.
 */
import { Link } from "wouter";

const EXISTING_LAW: { area: string; law: string; regulator: string }[] = [
  { area: "Personal data", law: "UK GDPR and the Data Protection Act 2018", regulator: "Information Commissioner's Office (ICO)" },
  { area: "Discrimination", law: "Equality Act 2010", regulator: "Equality and Human Rights Commission" },
  { area: "Consumers and competition", law: "Consumer protection and competition law", regulator: "Competition and Markets Authority (CMA)" },
  { area: "Financial services", law: "Financial services regulation", regulator: "Financial Conduct Authority (FCA)" },
  { area: "Online services", law: "Online Safety Act 2023", regulator: "Ofcom" },
  { area: "Medical devices, including software", law: "Medical devices regulation", regulator: "Medicines and Healthcare products Regulatory Agency (MHRA)" },
];

const PRINCIPLES = [
  "Safety, security and robustness",
  "Appropriate transparency and explainability",
  "Fairness",
  "Accountability and governance",
  "Contestability and redress",
];

export default function UKAIBillPage() {
  return (
    <div className="min-h-screen bg-white text-gray-900">
      <section className="border-b border-gray-200 bg-slate-50">
        <div className="mx-auto max-w-4xl px-5 py-14">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-gray-600">United Kingdom</p>
          <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">
            UK AI regulation: no AI-specific statute is in force
          </h1>
          <p className="mt-4 text-lg leading-relaxed text-gray-700">
            The United Kingdom has no enacted AI-specific Act, so it has no AI-specific penalty regime and no
            AI-specific enforcement deadline. AI systems are covered by existing law, enforced by existing regulators.
          </p>
          <p className="mt-4 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900" data-testid="uk-correction">
            Correction (6 October 2026): this page used to quote a fine and an enforcement deadline for a
            &ldquo;UK AI Bill&rdquo;. No enacted UK law sets either, so both have been removed.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-5 py-10">
        <h2 className="text-xl font-bold">Where things stand</h2>
        <ul className="mt-4 list-disc space-y-3 pl-5 leading-relaxed text-gray-700">
          <li>No AI-specific Act of Parliament is in force.</li>
          <li>
            Bills about AI have been introduced in Parliament as proposals, including private members&rsquo; bills in
            the House of Lords. A bill is not law until it receives Royal Assent, and no such bill sets a penalty that
            applies to anyone today.
          </li>
          <li>
            Government policy, set out in the 2023 white paper <em>A pro-innovation approach to AI regulation</em>,
            asks existing regulators to apply five cross-sector principles within the powers they already have. The
            principles are not statutory:
            <ul className="mt-2 list-[circle] space-y-1 pl-5">
              {PRINCIPLES.map((p) => (
                <li key={p}>{p}</li>
              ))}
            </ul>
          </li>
        </ul>
      </section>

      <section className="mx-auto max-w-4xl px-5 pb-10">
        <h2 className="text-xl font-bold">What already applies to an AI system in the UK</h2>
        <p className="mt-2 text-gray-700">
          Each of these laws has its own regulator and its own enforcement. Their penalties are set by each law, not by
          an AI statute, and we do not restate them here.
        </p>
        <div className="mt-4 overflow-x-auto rounded-xl border border-gray-200">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead className="border-b border-gray-200 bg-gray-50 text-xs uppercase tracking-wide text-gray-600">
              <tr>
                <th className="px-4 py-2 font-semibold">Area</th>
                <th className="px-4 py-2 font-semibold">Law</th>
                <th className="px-4 py-2 font-semibold">Regulator</th>
              </tr>
            </thead>
            <tbody>
              {EXISTING_LAW.map((r) => (
                <tr key={r.area} className="border-b border-gray-100 align-top">
                  <td className="px-4 py-2 font-semibold">{r.area}</td>
                  <td className="px-4 py-2 text-gray-700">{r.law}</td>
                  <td className="px-4 py-2 text-gray-700">{r.regulator}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-5 pb-10">
        <h2 className="text-xl font-bold">What Council of AI does here</h2>
        <p className="mt-2 leading-relaxed text-gray-700">
          We measure AI systems against published rules and sign the result. We do not certify, and nothing on this
          page is legal advice or a compliance determination. Verification is free.
        </p>
        <div className="mt-4 flex flex-wrap gap-3 text-sm">
          <Link href="/dashboard?tab=board" className="rounded-lg bg-emerald-700 px-4 py-2 font-semibold text-white hover:bg-emerald-800">
            Open the measured board
          </Link>
          <Link href="/gspc-verify" className="rounded-lg border border-gray-300 px-4 py-2 font-semibold text-gray-800 hover:border-gray-500">
            Verify a signed card
          </Link>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-5 pb-16">
        <h2 className="text-sm font-bold uppercase tracking-wide text-gray-600">Primary sources</h2>
        <ul className="mt-2 space-y-1 text-sm">
          <li>
            <a className="text-emerald-700 underline" href="https://www.gov.uk/government/publications/ai-regulation-a-pro-innovation-approach" rel="noopener">
              GOV.UK: A pro-innovation approach to AI regulation
            </a>
          </li>
          <li>
            <a className="text-emerald-700 underline" href="https://bills.parliament.uk/" rel="noopener">
              UK Parliament: Bills before Parliament (status of any AI bill)
            </a>
          </li>
        </ul>
      </section>
    </div>
  );
}
