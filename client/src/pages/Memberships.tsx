import { useEffect } from "react";
import { Link } from "wouter";
import { setMetaDescription } from "@/lib/utils";
import FaqBlock from "@/components/FaqBlock";
import MembershipStrip, { HONESTY_LINE, KIND_LABEL, MEMBERSHIPS, evidenceHref, groupedRows } from "@/components/MembershipStrip";

/**
 * /memberships — every body Council of AI takes part in, with the evidence and the two columns
 * that keep it honest: what the entry proves and what it does not.
 *
 * Every fact on this page is read from public/interop/memberships.json. Nothing is typed here:
 * not a date, not a standing, not a count. The manifest is committed, unsigned (and says so), and
 * scripts/memberships-check.mjs re-fetches every public evidence URL and fails when one stops
 * naming us. The FAQ below is the same rows again, in the form an answer engine lifts, so the
 * question "is Council of AI a member of X" is answered by the row that carries the evidence
 * and never by a sentence that could drift from it.
 */

const CANONICAL = "https://councilof.ai/memberships";

export default function Memberships() {
  const m = MEMBERSHIPS;
  const groups = groupedRows(m);
  const faq = m.rows.filter((r) => r.question && r.answer).map((r) => ({ q: r.question as string, a: r.answer as string }));

  useEffect(() => {
    document.title = "Where Council of AI takes part, and what each listing does not mean";
    setMetaDescription(
      "Every standards body, registry, scholarly identifier and regulatory filing Council of AI takes part in, each with a link to its evidence, the date, what it proves and what it does not. Participation is not endorsement; a listing is not adoption.",
    );
  }, []);

  const articleLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: "Where Council of AI takes part, and what each listing does not mean",
    datePublished: "2026-09-22",
    dateModified: m.as_of,
    url: CANONICAL,
    publisher: { "@type": "Organization", name: "CSOAI Ltd", url: "https://councilof.ai", identifier: "UK Companies House 16939677" },
    author: { "@type": "Organization", name: "CSOAI Ltd", url: "https://councilof.ai" },
    description:
      "A manifest of the bodies Council of AI takes part in, with evidence links, dates, and for each entry what it proves and what it does not prove. Participation is not endorsement, and a listing is not adoption.",
  };

  return (
    <div data-testid="memberships-page">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleLd).replace(/</g, "\\u003c") }} />

      <section className="mx-auto max-w-6xl px-4 py-12 sm:py-16">
        <nav aria-label="Breadcrumb" className="text-sm text-slate-500">
          <Link href="/">Home</Link> › <span>Where we take part</span>
        </nav>
        <h1 className="mt-4 text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
          Where Council of AI takes part, and what each listing does not mean
        </h1>
        <p className="mt-5 max-w-3xl text-lg leading-relaxed text-slate-700" data-testid="memberships-answer">
          Council of AI (CSOAI Ltd) takes part in standards bodies as a participant or member, publishes into open
          registries and archives, holds scholarly identifiers, and files comments with regulators. Each entry below
          links to the page that proves it, or names the dated mailbox record when that is the only evidence, and
          says in its own row what it does not prove. {HONESTY_LINE}
        </p>
        <p className="mt-3 max-w-3xl text-sm text-slate-600">
          Machine-readable: <a className="underline underline-offset-4" href="/interop/memberships.json">/interop/memberships.json</a>{" "}
          (schema {m.schema}, as of <time dateTime={m.as_of}>{m.as_of}</time>, {m.signed ? "signed" : "unsigned — it says so in the file"}).
          Re-checked by <code>scripts/memberships-check.mjs</code>, which fails when any public evidence URL stops answering with our name.
        </p>
      </section>

      <MembershipStrip variant="home" />

      <section className="mx-auto max-w-6xl px-4 py-12 sm:py-16" aria-labelledby="memberships-table-h">
        <h2 id="memberships-table-h" className="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
          Every entry, with what it proves and what it does not
        </h2>
        {groups.map((g) => (
          <div key={g.id} className="mt-8">
            <h3 className="text-lg font-bold text-slate-900">{g.label}</h3>
            <div className="mt-3 overflow-x-auto rounded-2xl border border-slate-200 bg-white">
              <table className="w-full min-w-[56rem] border-collapse text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-600">
                  <tr>
                    <th scope="col" className="px-3 py-2">Body</th>
                    <th scope="col" className="px-3 py-2">Standing</th>
                    <th scope="col" className="px-3 py-2">Since</th>
                    <th scope="col" className="px-3 py-2">Evidence</th>
                    <th scope="col" className="px-3 py-2">What it proves</th>
                    <th scope="col" className="px-3 py-2">What it does not prove</th>
                    <th scope="col" className="px-3 py-2">State</th>
                  </tr>
                </thead>
                <tbody>
                  {g.rows.map((r) => (
                    <tr key={r.id} id={r.id} className="scroll-mt-24 border-t border-slate-200 align-top">
                      <th scope="row" className="px-3 py-3 font-semibold text-slate-900">{r.org}</th>
                      <td className="px-3 py-3">{KIND_LABEL[r.kind]}</td>
                      <td className="px-3 py-3 whitespace-nowrap">
                        {r.since ? <time dateTime={r.since}>{r.since}</time> : <span className="text-slate-500">—</span>}
                        {r.since_basis && <div className="mt-1 max-w-[16rem] whitespace-normal text-xs text-slate-500">{r.since_basis}</div>}
                      </td>
                      <td className="px-3 py-3">
                        {r.evidence_kind === "public_url" ? (
                          <a href={r.evidence} rel="noopener noreferrer" className="break-all text-emerald-800 underline underline-offset-4">{r.evidence}</a>
                        ) : (
                          <span>
                            <span className="rounded bg-slate-100 px-1 text-xs text-slate-700">private evidence</span>{" "}
                            <span className="text-slate-700">{r.evidence}</span>
                          </span>
                        )}
                        <div className="mt-1 text-xs text-slate-500">{r.evidence_kind.replace("_", " ")}{r.verified_on ? ` · checked ${r.verified_on}` : ""}</div>
                      </td>
                      <td className="px-3 py-3 text-slate-800">{r.what_it_proves}</td>
                      <td className="px-3 py-3 text-slate-800">{r.what_it_does_not_prove}</td>
                      <td className="px-3 py-3 whitespace-nowrap">
                        <span className={r.state === "VERIFIED" ? "rounded bg-emerald-100 px-1.5 py-0.5 text-xs font-semibold text-emerald-900" : "rounded bg-amber-100 px-1.5 py-0.5 text-xs font-semibold text-amber-900"}>
                          {r.state}
                        </span>
                        {r.deadline && <div className="mt-1 text-xs text-slate-500">closes {r.deadline}</div>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
        <p className="mt-6 max-w-3xl text-sm text-slate-600">
          States follow the evidence. VERIFIED means the public URL answered with our name on the day checked, or a dated
          mailbox record exists and the row says the evidence is private. PENDING means an application or filing that
          has not been granted or submitted; it claims nothing. Rows with a link marked private evidence point at{" "}
          <Link href="/memberships" className="underline underline-offset-4">this page</Link>, not at a third party, because there is no third-party page to point at.
        </p>
      </section>

      {faq.length > 0 && (
        <FaqBlock
          title="What each entry does and does not mean"
          intro="Each answer is the manifest row again, in plain words. If a row and an answer ever disagree, the row is right and the answer is the defect."
          items={faq}
          openCount={faq.length}
        />
      )}

      <section className="mx-auto max-w-6xl px-4 py-12" aria-labelledby="memberships-method-h">
        <h2 id="memberships-method-h" className="text-xl font-bold text-slate-900">How this page is kept honest</h2>
        <ul className="mt-3 max-w-3xl list-disc space-y-2 pl-6 text-sm text-slate-700">
          <li>One committed manifest, <a className="underline underline-offset-4" href="/interop/memberships.json">/interop/memberships.json</a>, is the only source for the strip on the home page, the footer line, this table and the FAQ.</li>
          <li>A row exists only when a stranger can open its evidence, or a dated, message-identified mail exists and the row says so. Bodies with neither are named in the manifest's <code>excluded</code> list with the reason.</li>
          <li><code>scripts/memberships-check.mjs</code> re-fetches every public evidence URL and exits non-zero when one stops answering 200 with our name; its <code>--selftest</code> proves it goes red on a bogus row.</li>
          <li>Nothing here is a score. We measure AI systems; we do not grade the bodies we take part in, and they do not grade us by listing us.</li>
        </ul>
      </section>
    </div>
  );
}

export { evidenceHref };
