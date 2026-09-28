/**
 * /measurements/disclosure-lag/2026-09-gemini-evaluation — the dated public record of the May 2026 access to three
 * outside organisations' systems by a Gemini model during a third-party cyber evaluation, and the whole days between its
 * dated events. Second record in the disclosure-lag series (the first: /measurements/disclosure-lag/2026-09-medicare-agent).
 *
 * Published on the owner's approval (28 Sep 2026): indexable, listed in the sitemap by scripts/generate-sitemap.mjs.
 * It was built earlier the same day behind a draft gate (robots-excluded, delisted); that gate is removed, and the signed
 * record is unchanged, so its `publication` field still reads PRIVATE (the page says so under "How to verify").
 *
 * Every date, quote and interval on this page is read from
 * client/src/data/measurements/disclosure-lag/2026-09-gemini-evaluation.json, byte-identical to the published
 * public/measurements/disclosure-lag/2026-09-gemini-evaluation/record.json (board-signed record.signed.json beside it,
 * OpenTimestamps record.json.ots). Held equal by scripts/measurements/measurement-pages.node-test.mjs.
 */
import { useEffect, type ReactNode } from "react";
import { Link } from "wouter";
import { setMetaDescription } from "@/lib/utils";
import PlainEmail from "@/components/PlainEmail";
import REC from "@/data/measurements/disclosure-lag/2026-09-gemini-evaluation.json";

type Quote = [string, string];
type Ev = { event: string; label: string; date: string | null; granularity: string | null; statement: string; quotes: Quote[]; note: string | null };
type Iv = { id: string; from: string; to: string; days: number | null; days_range?: [number, number]; state: string; basis: string };
type Src = { id: string; url: string; publisher: string; title: string | null; published_as_printed: string; accessed_utc: string; http_status: number; response_sha256: string | null; kind: string };

const C = REC.capsules[0];
const EVENTS = C.observed.events as unknown as Ev[];
const IVS = C.observed.intervals as unknown as Iv[];
const SRCS = C.sources as unknown as Src[];
const CONFLICTS = C.observed.conflicts as unknown as { topic: string; variants: Quote[]; handling: string }[];
const DECLARED = C.declared;
const REASON = C.declared.stated_reason_for_timing as unknown as Quote[];
const DVO = C.observed.declared_vs_observed as unknown as { event: string; declared: string; observed: string; agrees: boolean | string }[];
const BASE = "/measurements/disclosure-lag/2026-09-gemini-evaluation/record";

const TITLE = "Disclosure lag: Gemini cyber evaluation | Council of AI";
const DESCRIPTION =
  "The dated public record of the May 2026 access to three outside systems during a Gemini cyber evaluation, and the days between each dated event.";

const EVENT_LABEL: Record<string, string> = {
  incident_date: "Incident (access to the three outside systems)",
  vendor_notified: "Testing firm told the vendor",
  affected_entities_notified: "Affected organisations told",
  authorities_notified: "Federal authorities told",
  testing_firm_post: "Testing firm's own post (names no customer)",
  press_inquiry: "Press inquiry to the vendor",
  public_disclosure: "First public record naming the vendor",
  earliest_press_report_read: "Earliest press report read",
  vendor_public_statement: "Vendor statement (via the press)",
  activity_stopped: "Model's access ended",
};
const IV_LABEL: Record<string, string> = {
  incident_to_vendor_notified: "Incident → vendor told",
  vendor_notified_to_public_disclosure: "Vendor told → public disclosure",
  incident_to_public_disclosure: "Incident → public disclosure",
  vendor_notified_to_affected_entities_notified: "Vendor told → affected organisations told",
  vendor_notified_to_authorities_notified: "Vendor told → federal authorities told",
  press_inquiry_to_public_disclosure: "Press inquiry → public disclosure",
  incident_to_activity_stopped: "Incident → access ended",
};

const H2 = ({ id, children }: { id: string; children: ReactNode }) => (
  <h2 id={id} className="mt-12 scroll-mt-20 text-2xl font-bold tracking-tight text-slate-900">
    {children}
  </h2>
);
const P = ({ children }: { children: ReactNode }) => <p className="mt-3 leading-relaxed text-slate-700">{children}</p>;
const UL = ({ children }: { children: ReactNode }) => <ul className="mt-3 list-disc space-y-1.5 pl-5 leading-relaxed text-slate-700">{children}</ul>;
const A = ({ href, children }: { href: string; children: ReactNode }) => (
  <a className="underline underline-offset-4" href={href} rel="noopener noreferrer">
    {children}
  </a>
);
const Code = ({ children }: { children: ReactNode }) => <code className="break-all rounded bg-slate-100 px-1 text-[0.9em]">{children}</code>;
const Table = ({ caption, head, rows }: { caption: string; head: string[]; rows: ReactNode[][] }) => (
  <div role="region" aria-label={caption} tabIndex={0} className="mt-4 overflow-x-auto rounded-lg border border-slate-200 focus:outline focus:outline-2 focus:outline-slate-500">
    <table className="w-full min-w-[720px] text-left text-sm">
      <caption className="sr-only">{caption}</caption>
      <thead className="bg-slate-50 text-slate-700">
        <tr>
          {head.map((h) => (
            <th key={h} scope="col" className="px-3 py-2 font-semibold">
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((r, i) => (
          <tr key={i} className="border-t border-slate-200 align-top">
            {r.map((c, j) => (
              <td key={j} className="px-3 py-2 text-slate-700">
                {c}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);
const Tag = ({ children }: { children: ReactNode }) => <code className="whitespace-nowrap rounded bg-slate-100 px-1 text-xs">{children}</code>;
const Cite = ({ ids }: { ids: string[] }) => (
  <>
    {ids.map((id, i) => (
      <span key={id}>
        {i ? ", " : ""}
        <a className="underline underline-offset-4" href={`#src-${id}`}>
          {id}
        </a>
      </span>
    ))}
  </>
);
const days = (iv: Iv) =>
  iv.days !== null ? `${iv.days}` : iv.days_range ? `${iv.days_range[0]} to ${iv.days_range[1]}` : "not stated";

export default function DisclosureLagGeminiEvaluation() {
  useEffect(() => {
    document.title = TITLE;
    setMetaDescription(DESCRIPTION);
  }, []);

  return (
    <article data-testid="disclosure-lag-gemini-evaluation" className="mx-auto max-w-3xl px-4 py-12 sm:py-16">
      <nav aria-label="Breadcrumb" className="text-sm text-slate-600">
        <Link href="/">Home</Link> › <span>Measurements</span> › <span>Disclosure lag</span>
      </nav>
      <h1 className="mt-4 text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
        Disclosure lag: the Gemini cyber-evaluation access to three outside systems
      </h1>
      <p className="mt-4 text-slate-700">
        Published by Council of AI (CSOAI Ltd, registered in England and Wales, no. 16939677). Sources read{" "}
        {C.observed_at.replace("T", " ").replace("Z", " UTC")}; record signed with the board key and timestamped.
      </p>
      <p className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-3 text-slate-800">
        <strong>Measurement, not endorsement or accusation.</strong> {C.claim.doctrine.replace(/^Measurement, not endorsement or accusation\.\s*/, "")}
      </p>
      <p data-testid="scope-statement" className="mt-3 rounded-lg border border-slate-200 bg-white p-3 text-slate-800">
        <strong>What this measures, and what it does not.</strong> Only the intervals between dated events in the public
        record: whole days from one published date to the next. It makes no claim about anyone’s intent, about the causes of
        the incident, or about the security of any system. The labels PRIMARY, REPORTED and UNMEASURED on every row say where
        each date comes from.
      </p>

      <H2 id="what">What happened, in the sources’ words</H2>
      <UL>
        <li>
          <strong>The vendor, as quoted by the press:</strong> {C.incident_as_described.by_vendor_as_reported}
        </li>
        <li>
          <strong>The testing firm:</strong> {C.incident_as_described.by_testing_firm}
        </li>
      </UL>

      <H2 id="intervals">The intervals</H2>
      <P>
        Whole calendar days between two dated events. An interval would be MEASURED only if both of its dates came from a
        publication by the vendor, the testing firm, an affected organisation or an authority. None does here, so no interval is
        MEASURED. Where a date is known only to the month, we give a range, never a midpoint. Where no source gives a date, the
        interval is UNMEASURED.
      </P>
      <P>{C.measurement_state_note}</P>
      <Table
        caption="Days between dated events"
        head={["Interval", "Days", "State", "Basis"]}
        rows={IVS.map((iv) => [IV_LABEL[iv.id] ?? iv.id, days(iv), <Tag>{iv.state}</Tag>, iv.basis])}
      />

      <H2 id="timeline">The dated public record</H2>
      <P>
        PRIMARY means the date appears in a publication by the vendor, the testing firm, an affected organisation or an
        authority. REPORTED means it appears only in the press, including the press quoting a spokesperson or an executive.
        UNMEASURED means no source we read states it.
      </P>
      <Table
        caption="Timeline with sources and label states"
        head={["Event", "Date", "Label", "Sources", "What the source says"]}
        rows={EVENTS.map((e) => [
          EVENT_LABEL[e.event] ?? e.event,
          <span className="whitespace-nowrap">{e.date ?? "not stated"}</span>,
          <Tag>{e.label}</Tag>,
          e.quotes.length ? <Cite ids={[...new Set(e.quotes.map((q) => q[0]))]} /> : "none",
          <>
            {e.quotes.length ? `“${e.quotes[0][1]}”` : e.statement}
            {e.quotes.length ? <span className="mt-1 block text-xs text-slate-600">{e.statement}</span> : null}
            {e.note ? <span className="mt-1 block text-xs text-slate-600">{e.note}</span> : null}
          </>,
        ])}
      />

      <H2 id="declared">The vendor’s own timeline, beside the record</H2>
      <P>
        {DECLARED.who.charAt(0).toUpperCase() + DECLARED.who.slice(1)}: {DECLARED.channel}. Label: {DECLARED.label}.
      </P>
      <P>
        The vendor’s stated reason for the timing, as reported:{" "}
        {REASON.map(([id, q]) => (
          <span key={id}>
            “{q}” (<Cite ids={[id]} />).
          </span>
        ))}
      </P>
      <Table
        caption="Declared versus observed"
        head={["Event", "Declared by the vendor (as reported)", "Observed in the public record", "Agree?"]}
        rows={DVO.map((d) => [EVENT_LABEL[d.event] ?? d.event, d.declared, d.observed, d.agrees === true ? "yes" : d.agrees === false ? "no" : String(d.agrees)])}
      />

      <H2 id="conflicts">Where sources differ</H2>
      <UL>
        {CONFLICTS.map((c) => (
          <li key={c.topic}>
            <strong>{c.topic.charAt(0).toUpperCase() + c.topic.slice(1)}.</strong>{" "}
            {c.variants.map(([id, t], i) => (
              <span key={id + i}>
                {i ? " Against: " : ""}
                {t} (<Cite ids={[id]} />).
              </span>
            ))}{" "}
            Handling: {c.handling}.
          </li>
        ))}
      </UL>

      <H2 id="not-established">What this record does not establish</H2>
      <UL>
        {C.not_established.map((l) => (
          <li key={l}>{l}</li>
        ))}
      </UL>

      <H2 id="limits">Limitations</H2>
      <UL>
        {C.limitations.map((l) => (
          <li key={l}>{l}</li>
        ))}
      </UL>

      <H2 id="method">Method</H2>
      <P>{C.method}</P>
      <P>{C.quote_check}.</P>

      <H2 id="sources">Sources</H2>
      <Table
        caption="Sources with access time and response hash"
        head={["Id", "Publisher and title", "Published (as printed)", "Read (UTC)", "sha256 of what we read"]}
        rows={SRCS.map((s) => [
          <span id={`src-${s.id}`} className="scroll-mt-20">
            {s.id}
          </span>,
          <>
            <A href={s.url}>{s.publisher}</A>
            {s.title ? <span className="block text-xs text-slate-600">{s.title}</span> : null}
          </>,
          s.published_as_printed,
          s.accessed_utc.replace("T", " ").replace("Z", ""),
          s.response_sha256 ? <Code>{s.response_sha256.slice(0, 16)}…</Code> : `not read (HTTP ${s.http_status})`,
        ])}
      />

      <H2 id="verify">How to verify</H2>
      <UL>
        <li>
          Record: <A href={`${BASE}.json`}>record.json</A>. Signature: <A href={`${BASE}.signed.json`}>record.signed.json</A>.
          Timestamp: <A href={`${BASE}.json.ots`}>record.json.ots</A> (an OpenTimestamps calendar commitment until Bitcoin confirms it).
        </li>
        <li>
          Check the signature. Canonicalise the <Code>payload</Code>: JSON, keys sorted, no whitespace, UTF-8. Its sha256 must
          equal <Code>signature.payload_sha256</Code>, and <Code>payload.artifact.sha256</Code> must equal the sha256 of
          record.json. Then verify <Code>sig_ed25519</Code> with the Ed25519 key <Code>#board-attestation-1</Code> in{" "}
          <A href="https://csoai.org/.well-known/did.json">csoai.org/.well-known/did.json</A>.
        </li>
        <li>
          Each quote above appears word for word in the page bytes we read. The sha256 of those bytes is in the sources table.
          Pages change, so a later read may differ.
        </li>
        <li>Capsule id: <Code>{C.capsule_id}</Code>. {REC.capsule_id_rule}.</li>
        <li>
          The record’s <Code>publication</Code> field reads “{C.publication}” because the record was signed before the owner
          approved publication. We publish the signed bytes unchanged rather than re-sign them.
        </li>
      </UL>

      <H2 id="reply">Right of reply, objections and corrections</H2>
      <P>{C.right_of_reply}</P>
      <P>
        Email <PlainEmail className="underline underline-offset-4" subject="Disclosure lag: reply or correction" />.
        You can also object through <Link href="/census/" className="underline underline-offset-4">/census</Link> or{" "}
        <Link href="/dispute/" className="underline underline-offset-4">/dispute</Link>. Corrections are dated in our{" "}
        <Link href="/corrections/" className="underline underline-offset-4">corrections ledger</Link>.
      </P>
    </article>
  );
}
