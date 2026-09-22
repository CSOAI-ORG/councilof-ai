import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link } from "wouter";

/**
 * /claim-maintenance — the category page.
 *
 * Claim maintenance is a named thing with a written specification, a live register and runnable
 * code. This page states the category, links all three, and says plainly what it does not do.
 *
 * NOTHING HERE IS TYPED. Every count on this page is read from GET /api/claims/register at
 * render time and labelled with that register's as_of. A number typed into a page is a number
 * nothing retires, and a register whose whole point is "we count what exists" would be the worst
 * possible place to start freezing one.
 */
const CANONICAL = "https://councilof.ai/claim-maintenance/";
const SPEC = "/spec/claim-maintenance/v0.1/";
const SPEC_MD = "/spec/claim-maintenance/v0.1/claim-maintenance-v0.1.md";
const SPEC_INDEX = "/spec/claim-maintenance/";
const SPEC_SCHEMA = "/spec/claim-maintenance/v0.1/schema/claim-artifact-v0.1.schema.json";
const REGISTER = "/api/claims/register";
const REGISTER_STATIC = "/spec/claim-maintenance/register.json";
const IMPL = "https://github.com/CSOAI-ORG/councilof-ai/blob/master/scripts/claim-capture.mjs";
const CORRECTIONS = "/api/corrections";
/** The archival deposit. A DOI makes a document citable and permanent; it does not make it right. */
const DOI = "10.5281/zenodo.22901782";
const DOI_URL = "https://doi.org/10.5281/zenodo.22901782";
const CONCEPT_DOI_URL = "https://doi.org/10.5281/zenodo.22901781";

const PAGE_DESCRIPTION =
  "Claim maintenance: the continuous, independent observation of the public claims an organisation makes about itself — captured verbatim with source and date, hashed and timestamped, re-read on a schedule, every observed change recorded, and measured only where public evidence can settle it. Specification, live register and runnable code from Council of AI.";

const STATES: Array<[string, string]> = [
  ["CLAIM_CAPTURED", "Read from its public source, recorded verbatim, hashed, dated and scheduled for re-reading. Nothing has been measured."],
  ["CLAIM_MEASURED", "A measurement against public evidence exists beside the claim, with its window, denominator, method and result. Not a verdict — the claim and the measurement sit side by side and the reader does the subtraction."],
  ["UNMEASURED", "In scope, settleable in principle by public evidence, and not yet measured. A first-class state, published as prominently as any other."],
  ["UNCHECKABLE", "No public evidence can settle it. A statement about the evidence available, never about the subject."],
];

const PAGE_LD = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  name: "Claim maintenance",
  description: PAGE_DESCRIPTION,
  url: CANONICAL,
  inLanguage: "en",
  publisher: {
    "@type": "Organization",
    name: "CSOAI Ltd",
    url: "https://councilof.ai",
    identifier: "UK Companies House 16939677",
  },
  mainEntity: {
    "@type": "DefinedTerm",
    name: "claim maintenance",
    description:
      "The continuous, independent observation of the public claims an organisation makes about itself or its products: capturing each claim verbatim with its source and date, hashing and timestamping it so the record cannot be quietly rewritten, re-reading it on a schedule, recording every observed change without alleging anything, and measuring the claim against public evidence where and only where public evidence can settle it.",
    inDefinedTermSet: {
      "@type": "DefinedTermSet",
      name: "Claim Maintenance, version 0.1",
      url: "https://councilof.ai" + SPEC,
    },
    url: CANONICAL,
  },
  significantLink: [
    "https://councilof.ai" + SPEC,
    "https://councilof.ai" + REGISTER,
    IMPL,
    "https://councilof.ai" + CORRECTIONS,
  ],
  license: "https://creativecommons.org/publicdomain/zero/1.0/",
  citation: {
    "@type": "CreativeWork",
    name: "Claim Maintenance, version 0.1",
    identifier: "https://doi.org/10.5281/zenodo.22901782",
    url: "https://councilof.ai/spec/claim-maintenance/v0.1/",
  },
};

type SubjectRow = {
  subject: string;
  identifier: string;
  source: string | null;
  claim_count: number;
  states: Record<string, number>;
  first_captured: string | null;
  last_read: string | null;
  next_scheduled_read: string | null;
  next_scheduled_read_state: string;
  registry_url: string;
  timestamp_state: string;
};
type Register = {
  as_of?: string;
  totals?: { subjects: number; claims: number; registries: number; by_state: Record<string, number> };
  subjects?: SubjectRow[];
  disclosures?: Array<{ registry_id: string; quoted: string; disclosure: string }>;
};

const day = (iso: string | null | undefined) => (iso ? String(iso).slice(0, 10) : null);

function Code({ children }: { children: string }) {
  return (
    <pre className="mt-4 overflow-x-auto rounded-lg border border-slate-800 bg-slate-950 px-4 py-3 text-xs leading-6 text-slate-100">
      <code>{children}</code>
    </pre>
  );
}

export default function ClaimMaintenance() {
  const [reg, setReg] = useState<Register | null | undefined>(undefined);

  useEffect(() => {
    const ac = new AbortController();
    const read = (u: string) =>
      fetch(u, { signal: ac.signal, headers: { accept: "application/json" } }).then((r) =>
        r.ok ? r.json() : Promise.reject(new Error(String(r.status))),
      );
    // The door first, then the static bytes it serves. They are the same bytes by construction
    // (functions/api/claims/register.ts imports this file), so the fallback cannot disagree with
    // the door — and the page still renders the register where Functions are not running, which
    // is how the prerendered snapshot a crawler reads gets the table rather than an error state.
    read(REGISTER)
      .catch(() => read(REGISTER_STATIC))
      .then((j) => setReg(j as Register))
      .catch(() => setReg(null));
    return () => ac.abort();
  }, []);

  const subjects = reg?.subjects ?? [];
  const asOf = day(reg?.as_of);

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <Helmet>
        <title>Claim maintenance — the specification, the register, and the code | Council of AI</title>
        <meta name="description" content={PAGE_DESCRIPTION} />
        <meta property="og:title" content="Claim maintenance" />
        <meta property="og:description" content={PAGE_DESCRIPTION} />
        <meta property="og:url" content={CANONICAL} />
        <script type="application/ld+json">{JSON.stringify(PAGE_LD)}</script>
      </Helmet>

      <header className="border-b border-slate-800 bg-slate-950 text-slate-100">
        <div className="mx-auto max-w-4xl px-5 py-14">
          <p className="text-xs font-semibold uppercase tracking-widest text-emerald-400">A named category, with a written specification</p>
          <h1 className="mt-3 text-4xl font-bold leading-tight">Claim maintenance</h1>
          <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-300">
            The continuous, independent observation of the public claims an organisation makes about itself or its
            products: capturing each claim verbatim with its source and date, hashing and timestamping it so the
            record cannot be quietly rewritten, re-reading it on a schedule, recording every observed change without
            alleging anything, and measuring the claim against public evidence where — and only where — public
            evidence can settle it.
          </p>
          <div className="mt-7 flex flex-wrap gap-3 text-sm font-semibold">
            <a className="rounded-lg bg-emerald-400 px-4 py-2.5 text-slate-950 hover:bg-emerald-300" href={SPEC}>Read the specification (v0.1)</a>
            <a className="rounded-lg border border-slate-700 px-4 py-2.5 text-slate-200 hover:border-emerald-400 hover:text-emerald-300" href={REGISTER}>The register (JSON)</a>
            <a className="rounded-lg border border-slate-700 px-4 py-2.5 text-slate-200 hover:border-emerald-400 hover:text-emerald-300" href={IMPL}>Run the code</a>
          </div>
          <p className="mt-5 text-sm text-slate-400">
            The specification is dedicated to the public domain under CC0 1.0 — adopt it, fork it or translate it
            without asking us. The reference implementation is MIT. Archived with a persistent identifier we do not
            control: <a className="underline" href={DOI_URL}>{DOI}</a> (
            <a className="underline" href={CONCEPT_DOI_URL}>all versions</a>). A DOI makes a document citable and
            permanent; it does not make it right.
          </p>
          <p className="mt-3 text-sm text-slate-400">
            Cite as: Council of AI. <em>Claim Maintenance, version 0.1.</em> CSOAI Ltd, 2026-09-22.{" "}
            <a className="underline" href={DOI_URL}>{DOI_URL}</a>
          </p>
        </div>
      </header>

      <section aria-labelledby="not" className="mx-auto max-w-4xl px-5 py-12">
        <h2 id="not" className="text-2xl font-bold">What this does not do</h2>
        <p className="mt-3 leading-7 text-slate-700">
          Said first, because the category is easy to mistake for four older ones and because the discipline is the
          product.
        </p>
        <ul className="mt-5 space-y-3 text-slate-700">
          <li><strong className="text-slate-900">It is not fact-checking.</strong> No verdict is reached about any claim. Where public evidence exists, the claim and the measured value are published side by side; where it does not, that is said plainly.</li>
          <li><strong className="text-slate-900">It is not certification.</strong> No mark, badge, seal or grade arises from any state. There is nothing here to pass or fail, and nobody may display one.</li>
          <li><strong className="text-slate-900">It is not auditing.</strong> No engagement, no agreed scope, no access to non-public records, no opinion addressed to anyone.</li>
          <li><strong className="text-slate-900">It is not reputation scoring.</strong> No score, rank or index may be derived from the state counts. The states describe the evidence available, not the claimant.</li>
          <li><strong className="text-slate-900">It is not adversarial journalism.</strong> No theory of anyone's intent is held or implied. The subject-selection rule is published, because that is the one place an agenda can hide.</li>
          <li><strong className="text-slate-900">It asserts no falsity about anyone.</strong> Nothing published here states or implies that a claim is false, misleading or dishonest — and a listing is neither an endorsement nor an accusation.</li>
        </ul>
      </section>

      <section aria-labelledby="states" className="border-y border-slate-200 bg-slate-50">
        <div className="mx-auto max-w-4xl px-5 py-12">
          <h2 id="states" className="text-2xl font-bold">Four states, and only four</h2>
          <dl className="mt-6 space-y-5">
            {STATES.map(([name, meaning]) => (
              <div key={name}>
                <dt className="font-mono text-sm font-semibold text-emerald-800">{name}</dt>
                <dd className="mt-1 leading-7 text-slate-700">{meaning}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-6 leading-7 text-slate-700">
            The boundary that makes this honest is the one between an <em>observed change</em> and a <em>finding</em>.
            An observed change is: the bytes at this URL differ from the bytes recorded at the previous read. That is
            the whole statement. A finding is: a measurement was performed and produced this value, over this window,
            with this denominator, by this method. A record of the first is never written in the vocabulary of the
            second, and never in the vocabulary of motive.
          </p>
        </div>
      </section>

      <section aria-labelledby="register" className="mx-auto max-w-4xl px-5 py-12">
        <h2 id="register" className="text-2xl font-bold">The register — every subject we maintain claims on</h2>
        <p className="mt-3 leading-7 text-slate-700">
          Generated from the registry files on disk, never hand-listed, and counting what exists rather than what we
          wish existed. A small register that grows is worth more than a padded one.
          {asOf && <> This page is showing the register as of <span className="font-mono">{asOf}</span>.</>}
        </p>

        {reg === undefined && <p className="mt-5 text-sm text-slate-500">Reading the live register…</p>}
        {reg === null && (
          <p className="mt-5 text-sm text-amber-700">
            The register did not load in this browser. It is served directly at{" "}
            <a className="underline" href={REGISTER}>{REGISTER}</a> and as static bytes at{" "}
            <a className="underline" href={REGISTER_STATIC}>{REGISTER_STATIC}</a>.
          </p>
        )}

        {subjects.length > 0 && (
          <div className="mt-6 overflow-x-auto rounded-lg border border-slate-200">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-100 text-xs uppercase tracking-wide text-slate-600">
                <tr>
                  <th scope="col" className="px-4 py-3">Subject</th>
                  <th scope="col" className="px-4 py-3">Claims</th>
                  <th scope="col" className="px-4 py-3">States</th>
                  <th scope="col" className="px-4 py-3">First captured</th>
                  <th scope="col" className="px-4 py-3">Last read</th>
                  <th scope="col" className="px-4 py-3">Next read</th>
                  <th scope="col" className="px-4 py-3">Registry</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {subjects.map((s) => (
                  <tr key={s.identifier + s.subject}>
                    <td className="px-4 py-3 font-medium text-slate-900">{s.subject}</td>
                    <td className="px-4 py-3 tabular-nums">{s.claim_count}</td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-600">
                      {Object.entries(s.states)
                        .filter(([, n]) => n > 0)
                        .map(([k, n]) => `${k} ${n}`)
                        .join(" · ")}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs">{day(s.first_captured) ?? "—"}</td>
                    <td className="px-4 py-3 font-mono text-xs">{day(s.last_read) ?? "—"}</td>
                    <td className="px-4 py-3 font-mono text-xs">
                      {s.next_scheduled_read_state === "SCHEDULED" ? day(s.next_scheduled_read) : "UNSCHEDULED"}
                    </td>
                    <td className="px-4 py-3">
                      <a className="underline decoration-emerald-600 underline-offset-4" href={s.registry_url}>artifact</a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {reg?.disclosures && reg.disclosures.length > 0 && (
          <div className="mt-6 rounded-lg border border-amber-300 bg-amber-50 px-4 py-4 text-sm text-amber-900">
            <p className="font-semibold">Disclosed about our own records</p>
            <ul className="mt-2 space-y-2">
              {reg.disclosures.map((d) => (
                <li key={d.registry_id}>
                  <span className="font-mono text-xs">{d.registry_id}</span> — quoted: “{d.quoted}”. {d.disclosure}
                </li>
              ))}
            </ul>
          </div>
        )}

        <p className="mt-6 text-sm text-slate-600">
          Machine-readable: <a className="underline" href={REGISTER}>{REGISTER}</a> ·{" "}
          <a className="underline" href={REGISTER_STATIC}>static bytes</a>. Filter with{" "}
          <code className="font-mono text-xs">?subject=</code> or <code className="font-mono text-xs">?state=</code>.
        </p>
      </section>

      <section aria-labelledby="run" className="border-y border-slate-200 bg-slate-50">
        <div className="mx-auto max-w-4xl px-5 py-12">
          <h2 id="run" className="text-2xl font-bold">Run it yourself — including against us</h2>
          <p className="mt-3 leading-7 text-slate-700">
            A specification with no runnable implementation is a manifesto. This one captures a claim from any public
            page, extracts the visible text by the rules in §6.3, computes the digests, writes a conforming artifact,
            and verifies one. It has no dependencies. The verifier rejects an artifact whose bytes have been altered
            after the digest was taken — including a rewritten evidence URL, which is the field that has historically
            sat outside the hash.
          </p>
          <Code>{`git clone https://github.com/CSOAI-ORG/councilof-ai && cd councilof-ai

node scripts/claim-capture.mjs --url https://example.com/ \\
  --subject "Example Corp" --identifier example.com --identifier-kind domain \\
  --claim "market leader powering the majority of the sector" \\
  --plan "majority = >50%; capture weekly against the public breakdown" \\
  --out artifact.json

node scripts/claim-capture.mjs --verify artifact.json`}</Code>
          <p className="mt-4 leading-7 text-slate-700">
            Verification answers whether these bytes are internally consistent and conform to the state machine. It
            never answers whether a claim is true, and a sound signature over a measurement performed wrongly is a
            sound signature over a wrong number.
          </p>
          <p className="mt-4 text-sm text-slate-600">
            Artifact schema: <a className="underline" href={SPEC_SCHEMA}>claim-artifact-v0.1.schema.json</a> ·
            Specification as Markdown: <a className="underline" href={SPEC_MD}>claim-maintenance-v0.1.md</a> ·
            All versions: <a className="underline" href={SPEC_INDEX}>{SPEC_INDEX}</a>
          </p>
        </div>
      </section>

      <section aria-labelledby="elsewhere" className="mx-auto max-w-4xl px-5 py-12">
        <h2 id="elsewhere" className="text-2xl font-bold">Where the rest of the record lives</h2>
        <ul className="mt-5 space-y-3 text-slate-700">
          <li>
            <a className="underline decoration-emerald-600 underline-offset-4" href={CORRECTIONS}>The corrections ledger</a> — what we
            got wrong, how it was caught, and the fix, dated. A body that observes other people's claims and does not
            publish its own errors is asking to be trusted rather than checked.
          </li>
          <li>
            <Link href="/claims-register.json" className="underline decoration-emerald-600 underline-offset-4">Our own claims register</Link>{" "}
            — the claims <em>we</em> make about our own capabilities, with the status each has earned. A separate
            document from the register above, and deliberately so: one is what we say about ourselves, the other is
            what we observe about others.
          </li>
          <li>
            <Link href="/methodology" className="underline decoration-emerald-600 underline-offset-4">How we measure</Link> — the
            measurement discipline this specification borrows its vocabulary from. We measure; we do not certify.
          </li>
        </ul>
        <p className="mt-8 rounded-lg border border-slate-200 bg-slate-50 px-4 py-4 text-sm leading-6 text-slate-700">
          If a record here does not match what you can check, that is a defect and we want it. Write to{" "}
          <a className="underline" href="mailto:nicholas@csoai.org">nicholas@csoai.org</a>; corrections are published at{" "}
          <a className="underline" href={CORRECTIONS}>{CORRECTIONS}</a>, where anyone can read them.
        </p>
      </section>
    </div>
  );
}
