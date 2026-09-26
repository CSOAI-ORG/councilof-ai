/**
 * /measurements/disclosure-lag/2026-09-medicare-agent — the dated public record of the June 2026 agent access to the
 * Medicare statistics portal, and the whole days between its dated events.
 *
 * OWNER-APPROVE. This page is built but NOT published: it is noindex, it is absent from the sitemap (DELISTED in
 * scripts/generate-sitemap.mjs), and nothing links to it. It shows a visible "draft" notice while OWNER_APPROVED is false.
 * To publish after the owner approves: set OWNER_APPROVED = true (drops the notice and the robots noindex), remove the
 * DELISTED line for this path in scripts/generate-sitemap.mjs, regenerate the sitemap, and link it from wherever the
 * owner chooses. Nothing else changes: the figures come from the signed record.
 *
 * Every date, quote and interval on this page is read from
 * client/src/data/measurements/disclosure-lag/2026-09-medicare-agent.json, byte-identical to the published
 * public/measurements/disclosure-lag/2026-09-medicare-agent/record.json (board-signed record.signed.json beside it,
 * OpenTimestamps record.json.ots). Held equal by scripts/measurements/measurement-pages.node-test.mjs.
 */
import { useEffect, type ReactNode } from "react";
import { Link } from "wouter";
import { Helmet } from "react-helmet-async";
import { setMetaDescription } from "@/lib/utils";
import PlainEmail from "@/components/PlainEmail";
import REC from "@/data/measurements/disclosure-lag/2026-09-medicare-agent.json";

export const OWNER_APPROVED = false;

type Quote = [string, string];
type Ev = { event: string; label: string; date: string | null; granularity: string | null; statement: string; quotes: Quote[]; note: string | null };
type Iv = { id: string; from: string; to: string; days: number | null; days_range?: [number, number]; days_if_2026_08_11?: number; days_utc_reading?: number; state: string; basis: string };
type Src = { id: string; url: string; publisher: string; title: string | null; published_as_printed: string; accessed_utc: string; http_status: number; response_sha256: string | null; kind: string };

const C = REC.capsules[0];
const EVENTS = C.observed.events as unknown as Ev[];
const IVS = C.observed.intervals as unknown as Iv[];
const SRCS = C.sources as unknown as Src[];
const SRC = Object.fromEntries(SRCS.map((s) => [s.id, s]));
const CONFLICTS = C.observed.conflicts as unknown as { topic: string; variants: Quote[]; handling: string }[];
const DECLARED = C.declared;
const DVO = C.observed.declared_vs_observed as unknown as { event: string; declared: string; observed: string; agrees: boolean | string }[];
const BASE = "/measurements/disclosure-lag/2026-09-medicare-agent/record";

const TITLE = "Disclosure lag: Medicare statistics portal | Council of AI";
const DESCRIPTION =
  "The dated public record of the June 2026 agent access to Australia's Medicare statistics portal, and the days between each dated event. Signed record.";

const EVENT_LABEL: Record<string, string> = {
  incident_date: "Incident (agent run that accessed the portal)",
  vendor_discovered: "Vendor became aware",
  vendor_discovered_day: "Vendor became aware (day, one outlet)",
  authority_notified: "Portal operator notified",
  authority_email_seen: "Operator saw the notification",
  escalated_to_acsc: "Operator reported it to ASD's ACSC",
  public_disclosure: "Public disclosure (government)",
  earliest_press_report_read: "Earliest press report read",
  vendor_public_statement: "Vendor statement (via the press)",
  activity_stopped: "Agent's access ended",
};
const IV_LABEL: Record<string, string> = {
  incident_to_authority_notified: "Incident → operator notified",
  incident_to_public_disclosure: "Incident → public disclosure",
  incident_to_vendor_discovered: "Incident → vendor aware",
  vendor_discovered_to_authority_notified: "Vendor aware → operator notified",
  authority_notified_to_public_disclosure: "Operator notified → public disclosure",
  authority_notified_to_acsc: "Operator notified → reported to ASD's ACSC",
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
    <table className="w-full min-w-[520px] text-left text-sm">
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
  iv.days !== null
    ? `${iv.days}${iv.days_utc_reading !== undefined ? ` (${iv.days_utc_reading} on the UTC date)` : ""}`
    : iv.days_range
      ? `${iv.days_range[0]} to ${iv.days_range[1]}${iv.days_if_2026_08_11 !== undefined ? ` (${iv.days_if_2026_08_11} if the one-outlet day is used)` : ""}`
      : "not stated";

export default function DisclosureLagMedicareAgent() {
  useEffect(() => {
    document.title = TITLE;
    setMetaDescription(DESCRIPTION);
  }, []);

  return (
    <article data-testid="disclosure-lag-medicare" className="mx-auto max-w-3xl px-4 py-12 sm:py-16">
      {OWNER_APPROVED ? null : (
        <Helmet>
          <meta name="robots" content="noindex,nofollow,noarchive" />
        </Helmet>
      )}
      <nav aria-label="Breadcrumb" className="text-sm text-slate-600">
        <Link href="/">Home</Link> › <span>Measurements</span> › <span>Disclosure lag</span>
      </nav>
      {OWNER_APPROVED ? null : (
        <p data-testid="owner-approve-notice" className="mt-4 rounded-lg border border-amber-300 bg-amber-50 p-3 text-amber-900">
          Draft awaiting the owner’s approval. Not linked, not in the sitemap, and marked noindex.
        </p>
      )}
      <h1 className="mt-4 text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
        Disclosure lag: the Medicare statistics portal agent incident
      </h1>
      <p className="mt-4 text-slate-700">
        Published by Council of AI (CSOAI Ltd, registered in England and Wales, no. 16939677). Sources read{" "}
        {C.observed_at.replace("T", " ").replace("Z", " UTC")}; record signed with the board key and timestamped.
      </p>
      <p className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-3 text-slate-800">
        <strong>Measurement, not endorsement or accusation.</strong> {C.claim.doctrine.replace(/^Measurement, not endorsement or accusation\.\s*/, "")}
      </p>

      <H2 id="what">What happened, in the sources’ words</H2>
      <UL>
        <li>
          <strong>The Australian Government:</strong> {C.incident_as_described.by_government}
        </li>
        <li>
          <strong>The vendor, as quoted by the press:</strong> {C.incident_as_described.by_vendor_as_reported}
        </li>
      </UL>

      <H2 id="intervals">The intervals</H2>
      <P>
        Whole calendar days between two dated events. An interval is MEASURED only when both of its dates come from the
        Australian Government’s own publication. Where a date is known only to the month, we give a range, never a midpoint.
      </P>
      <Table
        caption="Days between dated events"
        head={["Interval", "Days", "State", "Basis"]}
        rows={IVS.map((iv) => [IV_LABEL[iv.id] ?? iv.id, days(iv), <Tag>{iv.state}</Tag>, iv.basis])}
      />

      <H2 id="timeline">The dated public record</H2>
      <P>
        PRIMARY means the date appears in the Australian Government’s own publication. REPORTED means it appears only in the
        press, including the press quoting a spokesperson. UNMEASURED means no source we read states it.
      </P>
      <Table
        caption="Timeline with sources and label states"
        head={["Event", "Date", "Label", "Sources", "What the source says"]}
        rows={EVENTS.map((e) => [
          EVENT_LABEL[e.event] ?? e.event,
          e.date ?? "not stated",
          <Tag>{e.label}</Tag>,
          e.quotes.length ? <Cite ids={[...new Set(e.quotes.map((q) => q[0]))]} /> : "none",
          <>
            {e.quotes.length ? `“${e.quotes[0][1]}”` : e.statement}
            {e.note ? <span className="mt-1 block text-xs text-slate-600">{e.note}</span> : null}
          </>,
        ])}
      />

      <H2 id="declared">The vendor’s own timeline, beside the record</H2>
      <P>
        {DECLARED.who.charAt(0).toUpperCase() + DECLARED.who.slice(1)}: {DECLARED.channel}. Label: {DECLARED.label}.
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
            <strong>{c.topic}.</strong>{" "}
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

      <H2 id="limits">Limitations</H2>
      <UL>
        {C.limitations.map((l) => (
          <li key={l}>{l}</li>
        ))}
      </UL>

      <H2 id="method">Method</H2>
      <P>{C.method}</P>

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
      </UL>

      <H2 id="object">Object, or ask for a correction</H2>
      <P>
        If a date, quote or label here is wrong, email <PlainEmail className="underline underline-offset-4" subject="Disclosure lag: correction" />.
        You can also object through <Link href="/census/" className="underline underline-offset-4">/census</Link> or{" "}
        <Link href="/dispute/" className="underline underline-offset-4">/dispute</Link>. Corrections are dated in our{" "}
        <Link href="/corrections/" className="underline underline-offset-4">corrections ledger</Link>.
      </P>
    </article>
  );
}
