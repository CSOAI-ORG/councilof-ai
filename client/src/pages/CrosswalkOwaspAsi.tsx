import { useEffect, type ReactNode } from "react";
import { Link } from "wouter";
import raw from "../../../public/crosswalks/owasp-asi.json";

// /crosswalks/owasp-asi — which of our checks observe evidence relevant to each item of the OWASP
// Top 10 for Agentic Applications (ASI01–ASI10) and of the OWASP MCP Top 10 (beta).
//
// Everything on this page is rendered from public/crosswalks/owasp-asi.json, which
// scripts/crosswalks/build-owasp-asi.mjs derives from scripts/crosswalks/owasp-asi.source.json.
// Edit the source file, re-run the producer, never this page. The DIRECT / PARTIAL / NOT MEASURED
// counts are derived by the producer; the census tallies are read from committed record files.

type Row = { check: string; check_name: string; strength: string; rationale: string; live: string[] };
type Item = { id: string; title: string; strength: string; rows: Row[]; note?: string };
type Crosswalk = { reference: string; reference_title: string; counts: Record<string, number>; items: Item[] };
type Ref = {
  id: string;
  short: string;
  title: string;
  publisher: string;
  version: string;
  document_date: string | null;
  published: string | null;
  status: string;
  licence: string;
  licence_url: string;
  licence_note?: string;
  attribution: string;
  urls: { resource?: string; announcement?: string; pdf?: string; project?: string; index_pinned?: string };
  fetched: { at: string; pdf_sha256?: string; index_commit?: string };
};
type Observed = {
  source_file: string;
  as_of: string;
  unit: string;
  n?: number;
  tried?: number;
  with_verdict?: number;
  states: Record<string, number>;
  served_unsigned_not_verified?: number;
};
type Check = { id: string; name: string; family: string; kind: string; observes: string; live: string[]; observed?: Observed };

type Data = {
  url: string;
  json: string;
  edited: string;
  generated_from: { path: string; sha256: string };
  statements: string[];
  strength_scale: Record<"DIRECT" | "PARTIAL" | "NOT_MEASURED", string>;
  item_strength_rule: string;
  live_check_rule: string;
  references: Ref[];
  crosswalks: Crosswalk[];
  checks: Check[];
  unmapped: { check?: string; axis?: string; reason: string }[];
  capsule_adapters: { adapter: string; carries: string[]; record: string; reason?: string }[];
  prior_art: { where: string; what: string }[];
};

const data = raw as unknown as Data;
const CROSSWALKS = data.crosswalks;
const CHECKS = data.checks;
const REFS = data.references;
const refOf = (id: string) => REFS.find((r) => r.id === id)!;

const LABEL: Record<string, string> = { DIRECT: "Direct", PARTIAL: "Partial", NOT_MEASURED: "Not measured" };
const BADGE: Record<string, string> = {
  DIRECT: "border-emerald-700 bg-emerald-50 text-emerald-900",
  PARTIAL: "border-sky-700 bg-sky-50 text-sky-900",
  NOT_MEASURED: "border-slate-400 bg-slate-100 text-slate-800",
};

const Badge = ({ s }: { s: string }) => (
  <span className={`inline-block shrink-0 rounded border px-2 py-0.5 text-xs font-semibold uppercase tracking-wide ${BADGE[s]}`}>
    {LABEL[s]}
  </span>
);

const A = ({ href, children }: { href: string; children: ReactNode }) => (
  <a href={href} className="break-words font-medium text-emerald-800 underline underline-offset-2 hover:decoration-2">
    {children}
  </a>
);

function Section({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section aria-labelledby={id} className="mt-12">
      <h2 id={id} className="text-2xl font-bold tracking-tight">
        {title}
      </h2>
      <div className="mt-3 space-y-3 text-[17px] leading-relaxed text-slate-800">{children}</div>
    </section>
  );
}

const fmtStates = (o: Observed) =>
  Object.entries(o.states)
    .map(([k, v]) => `${k.replace(/_/g, " ")} ${v}`)
    .join(" · ");

function ObservedLine({ o }: { o: Observed }) {
  const total = o.with_verdict ?? o.n;
  return (
    <p className="text-sm text-slate-700">
      Recorded {o.as_of.slice(0, 10)}: {total} {o.unit}
      {o.tried ? ` with a verdict, of ${o.tried} tried` : ""} — {fmtStates(o)}
      {o.served_unsigned_not_verified != null ? ` · ${o.served_unsigned_not_verified} further cards served unsigned` : ""}.
      Read from <A href={o.source_file}>{o.source_file}</A>.
    </p>
  );
}

function ItemCard({ it }: { it: Item }) {
  return (
    <li className="rounded-lg border border-slate-200 bg-white p-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="text-lg font-semibold">
          <span className="font-mono text-base text-slate-700">{it.id}</span> {it.title}
        </h3>
        <Badge s={it.strength} />
      </div>
      {it.rows.length ? (
        <ul className="mt-3 space-y-3">
          {it.rows.map((r) => (
            <li key={r.check} className="border-l-2 border-slate-200 pl-3">
              <div className="flex flex-wrap items-baseline gap-2">
                <a href={`#check-${r.check}`} className="font-medium text-slate-900 underline underline-offset-2">
                  {r.check_name}
                </a>
                <Badge s={r.strength} />
              </div>
              <p className="mt-1 text-[15px] leading-relaxed text-slate-700">{r.rationale}</p>
              <p className="mt-1 text-sm text-slate-600">
                Live data:{" "}
                {r.live.map((l, i) => (
                  <span key={l}>
                    {i ? ", " : ""}
                    <A href={l}>{l}</A>
                  </span>
                ))}
              </p>
            </li>
          ))}
        </ul>
      ) : null}
      {it.note ? <p className="mt-3 text-[15px] leading-relaxed text-slate-700">{it.note}</p> : null}
    </li>
  );
}

function Counts({ c }: { c: Record<string, number> }) {
  return (
    <p className="text-[15px] text-slate-700">
      {c.DIRECT} direct · {c.PARTIAL} partial · {c.NOT_MEASURED} not measured
    </p>
  );
}

const LD = {
  "@context": "https://schema.org",
  "@type": "Dataset",
  name: "Crosswalk: OWASP Agentic Top 10 and MCP Top 10 to Council of AI checks",
  description:
    "Which Council of AI checks observe evidence relevant to each OWASP ASI and MCP Top 10 item, with strength and live data links. A map of what is measured, not a compliance claim and not endorsed by OWASP.",
  url: data.url,
  license: "https://creativecommons.org/licenses/by-sa/4.0/",
  distribution: [{ "@type": "DataDownload", encodingFormat: "application/json", contentUrl: data.json }],
  creator: { "@type": "Organization", name: "CSOAI Ltd", url: "https://councilof.ai" },
};

export default function CrosswalkOwaspAsi() {
  useEffect(() => {
    document.title = "OWASP Agentic Top 10 crosswalk: what we measure | Council of AI";
  }, []);

  const asi = CROSSWALKS.find((c) => c.reference === "owasp-asi-2026")!;
  const mcp = CROSSWALKS.find((c) => c.reference === "owasp-mcp-top10-2025")!;
  const asiRef = refOf("owasp-asi-2026");
  const mcpRef = refOf("owasp-mcp-top10-2025");
  const byId = new Map(CHECKS.map((c) => [c.id, c]));

  return (
    <div className="min-h-screen bg-[#fafaf7] text-[#0c1a12]">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(LD) }} />
      <div className="mx-auto max-w-3xl px-4 py-14 sm:px-5">
        <p className="text-xs font-semibold uppercase tracking-widest text-emerald-800">Crosswalk</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
          The OWASP Agentic Top 10, against what we actually measure
        </h1>
        <p className="mt-4 text-lg leading-relaxed text-slate-700">
          For each item of the{" "}
          <A href={asiRef.urls.resource}>{asiRef.title}</A> (ASI01 to ASI10) and of the{" "}
          <A href={mcpRef.urls.project}>{mcpRef.title}</A>, this page lists which of our checks observe evidence relevant
          to it, how closely, and where the data is. Items none of our checks reach are marked not measured.
        </p>

        <div className="mt-6 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-[15px] leading-relaxed text-amber-950">
          <ul className="list-disc space-y-1 pl-5">
            {data.statements.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
        </div>

        <Section id="summary" title="Summary">
          <p>
            <strong>{asiRef.short}</strong> ({asiRef.version}, {asiRef.document_date}):
          </p>
          <Counts c={asi.counts} />
          <p>
            <strong>{mcpRef.short}</strong> (beta, IDs suffixed :2025):
          </p>
          <Counts c={mcp.counts} />
          <p className="text-[15px] text-slate-700">
            These are counts of how many items our checks reach, not a rating of anything. The same numbers, and every row
            below, are in <A href="/crosswalks/owasp-asi.json">/crosswalks/owasp-asi.json</A>.
          </p>
        </Section>

        <Section id="strength" title="How to read the strength">
          <dl className="space-y-3">
            {(["DIRECT", "PARTIAL", "NOT_MEASURED"] as const).map((k) => (
              <div key={k}>
                <dt>
                  <Badge s={k} />
                </dt>
                <dd className="mt-1 text-[15px] text-slate-700">{data.strength_scale[k]}</dd>
              </div>
            ))}
          </dl>
          <p className="text-[15px] text-slate-700">{data.item_strength_rule}</p>
        </Section>

        <Section id="asi" title={`${asiRef.short} (${asiRef.version})`}>
          <ol className="space-y-4">
            {asi.items.map((it) => (
              <ItemCard key={it.id} it={it} />
            ))}
          </ol>
        </Section>

        <Section id="mcp" title={`${mcpRef.short} (beta)`}>
          <p className="text-[15px] text-slate-700">{mcpRef.status}</p>
          <ol className="space-y-4">
            {mcp.items.map((it) => (
              <ItemCard key={it.id} it={it} />
            ))}
          </ol>
        </Section>

        <Section id="checks" title="The checks">
          <p className="text-[15px] text-slate-700">{data.live_check_rule}</p>
          <ul className="space-y-4">
            {CHECKS.map((c) => (
              <li key={c.id} id={`check-${c.id}`} className="scroll-mt-20 rounded-lg border border-slate-200 bg-white p-4">
                <h3 className="font-semibold">{c.name}</h3>
                <p className="mt-1 text-[15px] leading-relaxed text-slate-700">{c.observes}</p>
                {c.observed ? <ObservedLine o={c.observed} /> : null}
                <p className="mt-1 text-sm text-slate-600">
                  Live data:{" "}
                  {c.live.map((l, i) => (
                    <span key={l}>
                      {i ? ", " : ""}
                      <A href={l}>{l}</A>
                    </span>
                  ))}
                </p>
              </li>
            ))}
          </ul>
          <p className="text-[15px] text-slate-700">
            The census checks are published as signed measurement capsules, one adapter per kind; see{" "}
            <Link href="/measurement-capsules/" className="font-medium text-emerald-800 underline underline-offset-2">
              measurement capsules
            </Link>
            .
          </p>
          <ul className="list-disc space-y-1 pl-5 text-[15px] text-slate-700">
            {data.capsule_adapters.map((a) => (
              <li key={a.adapter}>
                <code>{a.adapter}</code>:{" "}
                {a.carries.length ? `carries ${a.carries.map((c) => byId.get(c)?.name ?? c).join("; ")}` : a.reason}{" "}
                (<A href={a.record}>record</A>)
              </li>
            ))}
          </ul>
        </Section>

        <Section id="unmapped" title="What we measure that maps to neither list">
          <ul className="list-disc space-y-1 pl-5 text-[15px] text-slate-700">
            {data.unmapped.map((u) => (
              <li key={u.check ?? u.axis}>
                <strong>{u.check ? byId.get(u.check)?.name : `${u.axis} axis`}</strong>: {u.reason}
                {u.axis ? (
                  <>
                    {" "}
                    (<A href={`/api/gspc?axis=${u.axis}`}>live</A>)
                  </>
                ) : null}
              </li>
            ))}
          </ul>
        </Section>

        <Section id="sources" title="Sources and licences">
          {REFS.map((r) => (
            <div key={r.id} className="space-y-1 text-[15px] text-slate-700">
              <p>
                <strong>{r.title}</strong>, {r.publisher}. Version {r.version}
                {r.document_date ? `, ${r.document_date}` : ""}
                {r.published ? `, published ${r.published}` : ""}. {r.status}.
              </p>
              <p>
                Links: <A href={r.urls.resource ?? r.urls.project}>{r.urls.resource ? "resource page" : "project"}</A>
                {r.urls.announcement ? (
                  <>
                    , <A href={r.urls.announcement}>announcement</A>
                  </>
                ) : null}
                {r.urls.pdf ? (
                  <>
                    , <A href={r.urls.pdf}>PDF</A> (SHA-256 <code className="break-all">{r.fetched.pdf_sha256}</code>)
                  </>
                ) : null}
                {r.urls.index_pinned ? (
                  <>
                    , <A href={r.urls.index_pinned}>list at commit {r.fetched.index_commit?.slice(0, 12)}</A>
                  </>
                ) : null}
                . Read on {r.fetched.at.slice(0, 10)}.
              </p>
              <p>
                {r.attribution} Licence: <A href={r.licence_url}>{r.licence}</A>.{r.licence_note ? ` ${r.licence_note}` : ""}
              </p>
            </div>
          ))}
          <p className="text-[15px] text-slate-700">
            Our mapping, strengths and rationale are published under{" "}
            <A href="https://creativecommons.org/licenses/by-sa/4.0/">CC BY-SA 4.0</A>. OWASP is a trademark of the OWASP
            Foundation; its use here identifies the source lists and implies no affiliation.
          </p>
        </Section>

        <Section id="prior" title="Other OWASP pages on this site">
          <ul className="list-disc space-y-1 pl-5 text-[15px] text-slate-700">
            {data.prior_art.map((p) => (
              <li key={p.where}>
                {p.where.startsWith("/") ? <A href={p.where}>{p.where}</A> : <code>{p.where}</code>}: {p.what}
              </li>
            ))}
          </ul>
        </Section>

        <p className="mt-12 border-t border-slate-200 pt-4 text-sm text-slate-600">
          Edited {data.edited}. Generated from <code>{data.generated_from.path}</code> (SHA-256{" "}
          {data.generated_from.sha256.slice(0, 16)}…). Think a row is wrong? Email{" "}
          <a href="mailto:nicholas@csoai.org" className="font-medium text-emerald-800 underline underline-offset-2">
            nicholas@csoai.org
          </a>
          ; changes are recorded in the{" "}
          <Link href="/corrections/" className="font-medium text-emerald-800 underline underline-offset-2">
            corrections ledger
          </Link>
          . See also{" "}
          <Link href="/methodology/" className="font-medium text-emerald-800 underline underline-offset-2">
            methodology
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
