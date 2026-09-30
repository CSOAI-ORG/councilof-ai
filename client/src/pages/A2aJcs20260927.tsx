/**
 * /interop/a2a-jcs-2026-09-27 — our canonicalisers run blind against the A2A TCK RFC 8785 vectors.
 *
 * Every count on this page is read from client/src/data/a2a-tck-jcs-2026-09-27.json, written by
 * scripts/interop/a2a_tck_jcs_summary.py from the unmodified a2a-tck runner's own records. Those
 * records are served beside the page (public/interop/a2a-jcs-2026-09-27/runs/) with their sha256,
 * and A2aJcs20260927.test.ts recounts them. To change a number, re-run the producer; never type one.
 */
import { useEffect, type ReactNode } from "react";
import { Link } from "wouter";
import { setMetaDescription } from "@/lib/utils";
import PlainEmail from "@/components/PlainEmail";
import DOC from "@/data/a2a-tck-jcs-2026-09-27.json";

type Target = { vectors: number; passed: number; failed: number; outcomes: Record<string, number> };
type Impl = { key: string; label: string; role: string; code: string; agent_card_path: boolean; record: string; record_sha256: string; targets: Record<string, Target> };
type Census = { run: string; cards_read: number; cards_whose_jcs_differs: number; signed_cards: number; signed_cards_whose_signing_input_changes: number; exposure: { float_values: number; in_defect_ranges: number; ints_beyond_2_53: number } };

const IMPLS = DOC.implementations as Impl[];
const CENSUS = DOC.census as Census[];
const DIR = "/interop/a2a-jcs-2026-09-27";
const CSI = "card-signing-input";

const TITLE = "A2A TCK RFC 8785 vectors: our results, 27 Sep 2026 | Council of AI";
const DESCRIPTION =
  "Our agent-card census verifier against the A2A TCK RFC 8785 vectors: results, the failure classes we found, and whether any census verdict changes.";

const impl = (k: string) => {
  const i = IMPLS.find((x) => x.key === k);
  if (!i) throw new Error(`a2a-jcs page: no implementation ${k}`);
  return i;
};
const outcomes = (t: Target) =>
  Object.entries(t.outcomes)
    .filter(([k]) => k !== "pass")
    .map(([k, n]) => `${n} ${k}`)
    .join(", ") || "none";

const P = ({ children }: { children: ReactNode }) => <p className="mt-3 leading-relaxed text-slate-700">{children}</p>;
const H2 = ({ id, children }: { id: string; children: ReactNode }) => (
  <h2 id={id} className="mt-10 scroll-mt-20 text-xl font-bold text-slate-900">
    {children}
  </h2>
);
const A = ({ href, children }: { href: string; children: ReactNode }) => (
  <a href={href} className="font-medium text-slate-900 underline underline-offset-4">
    {children}
  </a>
);
const C = ({ children }: { children: ReactNode }) => <code className="rounded bg-slate-100 px-1 text-[0.9em]">{children}</code>;

export default function A2aJcs20260927() {
  useEffect(() => {
    document.title = TITLE;
    setMetaDescription(DESCRIPTION);
  }, []);
  const probe = impl("probe").targets[CSI];
  const probe1x = impl("probe1x").targets[CSI];
  const latest = CENSUS[CENSUS.length - 1];
  const fz = DOC.fuzz;
  const fuzzTotal = Object.values(fz.cases_per_class as Record<string, number>).reduce((a, b) => a + b, 0);
  const fuzzDiv = Object.values(fz.census_verifier_divergences_before_fix as Record<string, number>).reduce((a, b) => a + b, 0);

  return (
    <article data-testid="a2a-jcs-2026-09-27" className="mx-auto max-w-3xl px-4 py-12 sm:py-16">
      <nav aria-label="Breadcrumb" className="text-sm text-slate-600">
        <Link href="/">Home</Link> › <a href="/interop/">Interop</a> › <span>A2A JCS vectors, 27 Sep 2026</span>
      </nav>
      <h1 className="mt-4 text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
        A2A TCK canonicalisation vectors: our results
      </h1>
      <p className="mt-4 text-slate-700">Run 27 September 2026 by Council of AI (CSOAI Ltd). Code tested: {DOC.tested_code}.</p>

      <section aria-labelledby="short" className="mt-8 rounded-lg border border-slate-200 bg-slate-50 p-5">
        <h2 id="short" className="text-xl font-bold text-slate-900">Short answer</h2>
        <ul className="mt-3 list-disc space-y-1.5 pl-5 leading-relaxed text-slate-700">
          <li>
            Our agent-card census verifier passes <strong>{probe.passed} of {probe.vectors}</strong> vectors on the 0.x rule path and{" "}
            <strong>{probe1x.passed} of {probe1x.vectors}</strong> on the 1.x path.
          </li>
          <li>
            Beyond the corpus it diverged silently from RFC 8785 on some numbers: {fuzzDiv.toLocaleString("en-GB")} of{" "}
            {fuzzTotal.toLocaleString("en-GB")} fuzz cases. Its canonicaliser is now <C>rfc8785.dumps</C>.
          </li>
          <li>
            <strong>No census verdict changes.</strong> In the latest run, {latest.signed_cards_whose_signing_input_changes} of{" "}
            {latest.signed_cards} signed cards have a different signing input under strict RFC 8785.
          </li>
        </ul>
      </section>

      <H2 id="vectors">The vectors</H2>
      <P>
        The corpus is the A2A TCK's proposed RFC 8785 (JCS) conformance set, <A href={DOC.vectors.pr}>a2aproject/a2a-tck #228</A>, which
        was {DOC.vectors.pr_state_when_run} when we ran it. Head: <C>{DOC.vectors.head}</C>. <C>MANIFEST.json</C> sha256{" "}
        <C>{DOC.vectors.manifest_sha256}</C>; corpus digest <C>{DOC.vectors.corpus_digest}</C>. The runner was the PR's{" "}
        {DOC.vectors.runner}, and it wrote every record linked below.
      </P>

      <H2 id="results">Results by implementation</H2>
      <P>
        Target <C>{CSI}</C> is the exact payload a JWS verifier checks. Target <C>rfc8785</C> is plain canonicalisation. An outcome
        other than pass is one of: <em>refused</em> (the code rejected input it should accept, which fails closed),{" "}
        <em>diverged</em> (it produced different bytes, silently) or <em>accepted</em> (it accepted input it should reject).
      </P>
      <div role="region" aria-label="Results by implementation" tabIndex={0} className="mt-4 overflow-x-auto rounded-lg border border-slate-200 focus:outline focus:outline-2 focus:outline-slate-500">
        <table className="w-full min-w-[560px] text-left text-sm">
          <caption className="sr-only">Pass counts per implementation and target, with the kinds of failure</caption>
          <thead className="bg-slate-50 text-slate-700">
            <tr>
              <th scope="col" className="px-3 py-2">Implementation</th>
              <th scope="col" className="px-3 py-2">{CSI}</th>
              <th scope="col" className="px-3 py-2">rfc8785</th>
              <th scope="col" className="px-3 py-2">Record</th>
            </tr>
          </thead>
          <tbody>
            {IMPLS.map((i) => (
              <tr key={i.key} className="border-t border-slate-200 align-top">
                <th scope="row" className="px-3 py-2 font-medium text-slate-900">
                  {i.label}
                  <span className="block text-xs font-normal text-slate-600">{i.role}</span>
                </th>
                {[CSI, "rfc8785"].map((t) => (
                  <td key={t} className="px-3 py-2 text-slate-700">
                    {i.targets[t].passed}/{i.targets[t].vectors}
                    <span className="block text-xs text-slate-600">not passed: {outcomes(i.targets[t])}</span>
                  </td>
                ))}
                <td className="px-3 py-2">
                  <A href={`${DIR}/${i.record}`}>{i.key}.json</A>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <P>
        Per-vector outcomes for every implementation: <A href={`${DIR}/runs/table.json`}>table.json</A>. The whole record, with each
        file's sha256: <A href={`${DIR}/summary.json`}>summary.json</A>.
      </P>

      <H2 id="classes">Failure classes, stated plainly</H2>
      <ul className="mt-3 list-disc space-y-2 pl-5 leading-relaxed text-slate-700">
        <li>
          <strong>Census verifier, beyond the corpus.</strong> A differential fuzz against <C>rfc8785</C> found silent divergences in
          three number ranges the corpus does not reach: a double with 1e-6 ≤ |x| &lt; 1e-4 was cut to six decimals (
          <C>1.5e-06</C> gave <C>0.000002</C>, not <C>0.0000015</C>); an integral double from 2^53 to 1e21 printed its exact binary
          value; an integer beyond 2^53 − 1 printed every digit, where RFC 8785 has no form for it. Record:{" "}
          <A href={`${DIR}/${fz.record}`}>fuzz_beyond_corpus.txt</A>.
        </li>
        <li>
          <strong>{impl("signer").label} and {impl("indep").label.toLowerCase()}.</strong> They refuse any float by design, and the
          signer also refuses keys outside the Basic Multilingual Plane. Refusal fails closed and never diverges silently. Our own card
          carries no floats. The signer passes {impl("signer").targets[CSI].passed} of {impl("signer").targets[CSI].vectors}; the
          verifier {impl("indep").targets[CSI].passed} of {impl("indep").targets[CSI].vectors}.
        </li>
        <li>
          <strong>{impl("ts").label}.</strong> It diverges on integer-like keys and accepts lone surrogates (
          {outcomes(impl("ts").targets[CSI])}). The three errored vectors are NaN and Infinity inputs that <C>JSON.parse</C> rejects
          before canonicalisation, which also fails closed. It affects one test over our own card.
        </li>
        <li>
          <strong>Sorted-keys JSON (GSPC Rule A)</strong> scores {impl("sorted_ascii").targets[CSI].passed} of{" "}
          {impl("sorted_ascii").targets[CSI].vectors}. That describes a different format, not a defect: its bytes define published
          card ids and it is not on the agent-card path, so it is not being moved to JCS.
        </li>
      </ul>

      <H2 id="census">Does any census verdict change?</H2>
      <P>
        No. A JWS verdict depends only on the protected header, the payload bytes and the key, so identical payload bytes mean an
        identical verdict. We recomputed every signed card's signing input under both rule paths, with our canonicaliser and with{" "}
        <C>rfc8785.dumps</C>, and compared the bytes.
      </P>
      <div role="region" aria-label="Census verdict-change check" tabIndex={0} className="mt-4 overflow-x-auto rounded-lg border border-slate-200 focus:outline focus:outline-2 focus:outline-slate-500">
        <table className="w-full min-w-[520px] text-left text-sm">
          <caption className="sr-only">Signing inputs that change under strict RFC 8785, per census run</caption>
          <thead className="bg-slate-50 text-slate-700">
            <tr>
              <th scope="col" className="px-3 py-2">Census run</th>
              <th scope="col" className="px-3 py-2">Cards read</th>
              <th scope="col" className="px-3 py-2">Signed cards</th>
              <th scope="col" className="px-3 py-2">Signing inputs that change</th>
              <th scope="col" className="px-3 py-2">Floats in defect ranges</th>
            </tr>
          </thead>
          <tbody>
            {CENSUS.map((c) => (
              <tr key={c.run} className="border-t border-slate-200">
                <th scope="row" className="px-3 py-2 font-medium text-slate-900">{c.run}</th>
                <td className="px-3 py-2 text-slate-700">{c.cards_read}</td>
                <td className="px-3 py-2 text-slate-700">{c.signed_cards}</td>
                <td className="px-3 py-2 text-slate-700">{c.signed_cards_whose_signing_input_changes}</td>
                <td className="px-3 py-2 text-slate-700">
                  {c.exposure.in_defect_ranges} of {c.exposure.float_values}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <P>{DOC.census_note}</P>

      <H2 id="fix">What we changed</H2>
      <P>
        The census verifier (<C>scripts/census/a2a-card-probe.py</C>) now canonicalises with <C>rfc8785.dumps</C>, one of the two
        oracles that produced the vectors. An input with no canonical form raises an error, which the verifier reports as UNCHECKABLE
        with a reason, never as FAILED. The patched verifier passes {impl("probe_patched").targets[CSI].passed} of{" "}
        {impl("probe_patched").targets[CSI].vectors} on both rule paths. New unit tests pin the three number classes above; each fails
        on the old code.
      </P>
      <P>
        Not changed here, and left for a decision: the TypeScript test canonicaliser, and number formatting in our card signer and its
        independent verifier. Both fail closed today.
      </P>

      <H2 id="contact">Questions and corrections</H2>
      <P>
        Email <PlainEmail className="underline underline-offset-4" subject="A2A JCS results" />. Dated corrections go to our{" "}
        <Link href="/corrections/" className="underline underline-offset-4">corrections ledger</Link>.
      </P>
    </article>
  );
}
