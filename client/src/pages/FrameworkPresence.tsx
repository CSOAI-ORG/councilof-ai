import { Helmet } from "react-helmet-async";
import register from "@/data/framework-presence.json";

/**
 * /frameworks — frontier-safety framework presence register (G2.6 rebuild).
 *
 * This page measures PRESENCE and PROVENANCE of published frontier-safety
 * frameworks at major AI labs. Every row is backed by an official URL fetched
 * on the verification date recorded in the data file; the HTTP status is part
 * of the record. Rows that cannot be verified exactly are omitted or shown as
 * empty chairs — never asserted.
 *
 * Voice law: we never say a lab is "unsafe", "compliant" or "certified".
 * An empty chair is a presence/absence measurement, not a safety finding.
 */

interface PublishedRow {
  lab: string;
  framework: string;
  official_url: string;
  http_status: number;
  verified_via: string;
  as_of: string;
  version?: string;
  date?: string;
  source_note: string;
}

interface EmptyChairRow {
  lab: string;
  statement: string;
  as_of: string;
  checked_urls: Array<{ url: string; http_status: number; note: string }>;
  site_search: string;
}

const published = register.published as PublishedRow[];
const emptyChairs = register.empty_chairs as EmptyChairRow[];

export default function FrameworkPresence() {
  return (
    <main className="min-h-screen bg-slate-950 px-5 py-16 text-slate-100">
      <Helmet>
        <title>Frontier framework presence register | Council of AI</title>
        <meta
          name="description"
          content="A presence register of published frontier-safety frameworks at major AI labs — every row backed by an official URL fetched and status-checked on the verification date. Empty chairs record a bounded absence search, never a safety verdict."
        />
      </Helmet>
      <section className="mx-auto max-w-4xl">
        <p className="font-mono text-xs uppercase tracking-[0.22em] text-emerald-300">
          Measurement, not certification · verified as of {register.verified_as_of}
        </p>
        <h1 className="mt-3 text-4xl font-black tracking-tight">
          Frontier-safety framework presence register
        </h1>
        <p className="mt-4 leading-7 text-slate-300">
          Which major AI labs publish a frontier-safety framework — and exactly where it
          lives. We measure the presence and provenance of published commitments, never
          their quality; absence of a published framework is not a finding of unsafe
          practice. Every row below is backed by an official URL we fetched ourselves on{" "}
          {register.verified_as_of}; the HTTP status is part of the record. A row we cannot
          verify exactly is omitted or shown as an empty chair — never asserted.
        </p>

        <h2 className="mt-10 text-xl font-bold text-slate-100">Bounded method</h2>
        <p className="mt-2 text-sm leading-6 text-slate-400">{register.method}</p>

        <h2 className="mt-10 text-xl font-bold text-slate-100">
          Published frameworks ({published.length})
        </h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-700 text-xs uppercase tracking-wider text-slate-400">
                <th className="py-2 pr-4">Lab</th>
                <th className="py-2 pr-4">Framework</th>
                <th className="py-2 pr-4">Version / date at source</th>
                <th className="py-2 pr-4">HTTP</th>
                <th className="py-2">Official URL</th>
              </tr>
            </thead>
            <tbody>
              {published.map((r) => (
                <tr key={r.lab} className="border-b border-slate-800 align-top">
                  <td className="py-3 pr-4 font-semibold text-slate-100">{r.lab}</td>
                  <td className="py-3 pr-4 text-slate-300">{r.framework}</td>
                  <td className="py-3 pr-4 text-slate-300">
                    {r.version ? <span>{r.version}</span> : null}
                    {r.version && r.date ? <span> · </span> : null}
                    {r.date ? <span>{r.date}</span> : null}
                    {!r.version && !r.date ? (
                      <span className="text-slate-500">not stated at source</span>
                    ) : null}
                  </td>
                  <td className="py-3 pr-4 font-mono text-emerald-200">{r.http_status}</td>
                  <td className="py-3">
                    <a
                      href={r.official_url}
                      target="_blank"
                      rel="noreferrer"
                      className="font-mono text-xs text-emerald-300 underline break-all hover:text-emerald-200"
                    >
                      {r.official_url}
                    </a>
                    <p className="mt-1 text-xs leading-5 text-slate-500">{r.source_note}</p>
                    <p className="mt-1 text-xs text-slate-600">
                      Verified {r.as_of} via {r.verified_via}.
                    </p>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <h2 className="mt-12 text-xl font-bold text-slate-100">
          Empty chairs ({emptyChairs.length})
        </h2>
        <p className="mt-2 text-sm leading-6 text-slate-400">
          An empty chair records exactly what we checked and found absent. It is a
          presence/absence measurement, not a safety finding: a lab may govern frontier
          risk through documents we did not find, through channels outside its public
          site, or not at all — this register does not distinguish those cases.
        </p>
        <div className="mt-4 grid gap-4">
          {emptyChairs.map((r) => (
            <div
              key={r.lab}
              className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5"
            >
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h3 className="text-base font-bold text-slate-100">{r.lab}</h3>
                <span className="rounded-full border border-gray-300 bg-gray-100 px-2.5 py-0.5 font-mono text-[11px] uppercase tracking-wider text-gray-600">
                  empty chair
                </span>
              </div>
              <p className="mt-2 text-sm text-slate-300">
                {r.lab}: {r.statement} (as of {r.as_of}).
              </p>
              <ul className="mt-3 space-y-1.5">
                {r.checked_urls.map((c) => (
                  <li key={c.url} className="text-xs leading-5 text-slate-400">
                    <span className="font-mono text-emerald-200">{c.http_status}</span>{" "}
                    <a
                      href={c.url}
                      target="_blank"
                      rel="noreferrer"
                      className="font-mono text-emerald-300/80 underline break-all hover:text-emerald-200"
                    >
                      {c.url}
                    </a>{" "}
                    — {c.note}
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-xs leading-5 text-slate-500">{r.site_search}</p>
            </div>
          ))}
        </div>

        <h2 className="mt-12 text-xl font-bold text-slate-100">Corrections</h2>
        <p className="mt-2 text-sm leading-6 text-slate-400">
          If a lab publishes a framework, moves a document, or we recorded a row wrongly,
          corrections are appended, never silently edited. Rows carry their verification
          date and HTTP status so a later, better measurement can be added next to them.
          Report a correction through the{" "}
          <a href="/refutation-ledger" className="text-emerald-300 underline hover:text-emerald-200">
            refutation ledger
          </a>
          .
        </p>
      </section>
    </main>
  );
}
