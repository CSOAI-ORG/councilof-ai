/**
 * /spec/signed-receipts — the canonical home of the A2A extension specification signed-receipts/v1.
 *
 * The specification text is rendered from client/src/data/signed-receipts-v1-SPEC.md, which is
 * byte-identical to the served public/spec/signed-receipts/v1/SPEC.md and to the copy pinned in
 * huggingface.co/datasets/csoai/councilof-ai-source at commit 96bf3a07 (held equal by
 * SignedReceiptsSpec.test.ts). Never edit the text here; a new draft is a new file.
 *
 * The one sentence about third-party use is the one verified on 27 Sep 2026 against the npm
 * tarball @fractalai/pqc-agent-receipts-conformance@0.3.1 (README, vectors/a2a-receipt-ml-dsa-65.json,
 * src/profiles.mjs). Nothing stronger is said: no adoption, endorsement or partnership.
 */
import { useEffect, type ReactNode } from "react";
import { Link } from "wouter";
import ReactMarkdown from "react-markdown";
import { setMetaDescription } from "@/lib/utils";
import PlainEmail from "@/components/PlainEmail";
import SPEC from "@/data/signed-receipts-v1-SPEC.md?raw";

const TITLE = "signed-receipts/v1 specification (A2A extension) | Council of AI";
const DESCRIPTION =
  "Canonical home of signed-receipts/v1: a did:web key-trust convention for A2A card signing plus signed task-outcome receipts, with reference code.";

const BASE = "/spec/signed-receipts/v1";
const FILES = [
  { href: `${BASE}/SPEC.md`, name: "SPEC.md", what: "the specification, draft 0.2 (the text on this page)" },
  { href: `${BASE}/interceptor.py`, name: "interceptor.py", what: "reference implementation: signs and verifies receipts" },
  { href: `${BASE}/test_interceptor.py`, name: "test_interceptor.py", what: "its regression suite (python3 test_interceptor.py)" },
];
const PINNED =
  "https://huggingface.co/datasets/csoai/councilof-ai-source/tree/96bf3a07d4f944e9a9ed577e329ef10e20d38dfc/contributions/a2a-signed-receipts/f80de2731ceb";

const A = ({ href, children }: { href: string; children: ReactNode }) => (
  <a href={href} className="font-medium text-slate-900 underline underline-offset-4">
    {children}
  </a>
);

export default function SignedReceiptsSpec() {
  useEffect(() => {
    document.title = TITLE;
    setMetaDescription(DESCRIPTION);
  }, []);

  return (
    <article data-testid="spec-signed-receipts" className="mx-auto max-w-3xl px-4 py-12 sm:py-16">
      <nav aria-label="Breadcrumb" className="text-sm text-slate-600">
        <Link href="/">Home</Link> › <span>Specifications</span> › <span>signed-receipts/v1</span>
      </nav>
      <h1 className="mt-4 text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">signed-receipts/v1</h1>
      <p className="mt-4 leading-relaxed text-slate-700">
        An A2A extension. It adds a <code className="rounded bg-slate-100 px-1">did:web</code> key-trust convention for AgentCard
        signing (A2A §8.4) and a signed receipt object an agent can attach to a task outcome. This page is the specification's
        canonical address. It is published by Council of AI (CSOAI Ltd) under the Apache-2.0 licence.
      </p>

      <section aria-labelledby="files" className="mt-8 rounded-lg border border-slate-200 bg-slate-50 p-5">
        <h2 id="files" className="text-xl font-bold text-slate-900">Files</h2>
        <ul className="mt-3 list-disc space-y-1.5 pl-5 text-slate-700">
          {FILES.map((f) => (
            <li key={f.href}>
              <A href={f.href}>{f.name}</A>: {f.what}
            </li>
          ))}
        </ul>
        <p className="mt-3 text-sm leading-relaxed text-slate-700">
          The same bytes are pinned in our source mirror at <A href={PINNED}>councilof-ai-source @ 96bf3a07</A>. Earlier
          references to the GitHub repository <code className="rounded bg-white px-1">CSOAI-ORG/a2a-signed-receipts</code> do not
          resolve at present; this page replaces them. The extension URI itself is{" "}
          <A href="/a2a/extensions/signed-receipts/v1/">https://councilof.ai/a2a/extensions/signed-receipts/v1</A>.
        </p>
      </section>

      <section aria-labelledby="use" className="mt-8">
        <h2 id="use" className="text-xl font-bold text-slate-900">Third-party use</h2>
        <p className="mt-3 leading-relaxed text-slate-700">
          The independent conformance suite <code className="rounded bg-slate-100 px-1">@fractalai/pqc-agent-receipts-conformance</code>{" "}
          (npm 0.3.1) includes a profile, <code className="rounded bg-slate-100 px-1">a2a-receipt-ml-dsa-65</code>, that reuses the
          CSOAI <code className="rounded bg-slate-100 px-1">signed-receipts/v1</code> receipt object with an ML-DSA-65 signature.
        </p>
      </section>

      <section aria-labelledby="spec" className="mt-10 border-t border-slate-200 pt-8">
        <h2 id="spec" className="text-xl font-bold text-slate-900">Specification text</h2>
        <p className="mt-2 text-sm text-slate-600">
          Reproduced from <A href={`${BASE}/SPEC.md`}>SPEC.md</A> without changes.
        </p>
        <div className="mt-4 leading-relaxed text-slate-800">
          <ReactMarkdown
            components={{
              h1: ({ children }) => <h3 className="mt-6 text-2xl font-bold text-slate-900">{children}</h3>,
              h2: ({ children }) => <h3 className="mt-8 text-lg font-bold text-slate-900">{children}</h3>,
              h3: ({ children }) => <h4 className="mt-6 font-semibold text-slate-900">{children}</h4>,
              p: ({ children }) => <p className="mt-3">{children}</p>,
              ul: ({ children }) => <ul className="mt-3 list-disc space-y-1.5 pl-5">{children}</ul>,
              ol: ({ children }) => <ol className="mt-3 list-decimal space-y-1.5 pl-5">{children}</ol>,
              pre: ({ children }) => (
                <pre tabIndex={0} className="mt-3 overflow-x-auto rounded-lg bg-slate-100 p-4 text-sm text-slate-900">
                  {children}
                </pre>
              ),
              code: ({ children }) => <code className="rounded bg-slate-100 px-1 text-[0.9em]">{children}</code>,
              a: ({ href, children }) => <A href={String(href ?? "")}>{children}</A>,
            }}
          >
            {SPEC}
          </ReactMarkdown>
        </div>
      </section>

      <h2 className="mt-10 text-xl font-bold text-slate-900">Questions and corrections</h2>
      <p className="mt-3 leading-relaxed text-slate-700">
        To report an error in the specification or the reference code, email{" "}
        <PlainEmail className="underline underline-offset-4" subject="signed-receipts/v1" />. Dated corrections go to our{" "}
        <Link href="/corrections/" className="underline underline-offset-4">corrections ledger</Link>.
      </p>
    </article>
  );
}
