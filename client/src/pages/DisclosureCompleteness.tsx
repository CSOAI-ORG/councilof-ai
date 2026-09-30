/**
 * /measurements/disclosure-completeness — what four public AI benchmark artifacts state about themselves: whether their
 * rows carry a logs pointer, a date or a sample size, how long a dataset takes to publish, and whether two catalogues
 * declare the same context length. Lane L2 (consume -> signed public measurement), first set 2026-09-30.
 *
 * Every figure on this page is read from client/src/data/measurements/disclosure-completeness/latest.set.json, which is
 * byte-identical to the newest published public/interop/disclosure-completeness-<date>/set.json (held equal by
 * scripts/measurements/measurement-pages.node-test.mjs). Each record beside it is signed by the board key
 * (record.signed.json) and timestamped (record.json.ots). No number here is typed by hand, and none ranks a model or a
 * platform: these are counts of what each artifact states.
 */
import { useEffect, type ReactNode } from "react";
import { Link } from "wouter";
import { setMetaDescription } from "@/lib/utils";
import SET from "@/data/measurements/disclosure-completeness/latest.set.json";
import SETS from "@/data/measurements/disclosure-completeness/sets.json";

type Frac = { numerator: number; denominator: number; value: number | null };
type Row = {
  record_id: string;
  measure: string;
  kind: string;
  title: string;
  answer: string;
  path: string;
  sha256: string;
  signed: string;
  as_of: string;
  headline: Record<string, unknown>;
  unmeasured_count: number;
  source: { name: string; publisher: string; urls: string[] };
  licence: { upstream: Record<string, unknown>; our_record: string; note?: string; attribution_required?: string };
};

const ROWS = SET.records as unknown as Row[];
const BASE = `/interop/${SET.set}`;
const TITLE = "Disclosure completeness of public AI benchmark artifacts | Council of AI";
const DESCRIPTION =
  "What four public AI benchmark artifacts state about themselves: logs pointers, dates, sample sizes, publication lag, declared context length. Signed records.";

const n = (v: unknown) => (typeof v === "number" ? v.toLocaleString("en-GB") : "UNMEASURED");
const pct = (f: Frac | undefined) =>
  f && typeof f.value === "number" ? `${(f.value * 100).toFixed(1)}%` : "UNMEASURED";
const H2 = ({ id, children }: { id: string; children: ReactNode }) => (
  <h2 id={id} className="mt-10 scroll-mt-20 text-xl font-bold text-slate-900">
    {children}
  </h2>
);
const P = ({ children }: { children: ReactNode }) => <p className="mt-3 leading-relaxed text-slate-700">{children}</p>;
const Code = ({ children }: { children: ReactNode }) => (
  <code className="break-all rounded bg-slate-100 px-1 text-[0.9em]">{children}</code>
);
const Fig = ({ k, v }: { k: string; v: string }) => (
  <div className="rounded-lg border border-slate-200 p-3">
    <p className="text-sm text-slate-600">{k}</p>
    <p className="mt-1 text-lg font-bold text-slate-900">{v}</p>
  </div>
);

/** The figures shown for one record, read from its headline. Nothing is computed here but a percentage. */
function figures(r: Row): [string, string][] {
  const h = r.headline as Record<string, any>;
  switch (r.measure) {
    case "swebench.logs_pointer_share":
      return [
        ["Entries", n(h.entries)],
        ["State a logs pointer", `${n(h.logs_pointer_stated)} (${pct(h.share_logs_stated)})`],
        ["Pointers that resolve", String(h.logs_pointer_resolves)],
      ];
    case "epoch.date_and_n_stated":
      return [
        ["Result rows (files)", `${n(h.rows)} (${n(h.files)})`],
        ["State a result date", `${n(h.rows_stating_date?.numerator)} (${pct(h.rows_stating_date)})`],
        ["State a sample size (n)", `${n(h.rows_stating_n?.numerator)} (${pct(h.rows_stating_n)})`],
        ["State both", `${n(h.rows_stating_both?.numerator)} (${pct(h.rows_stating_both)})`],
      ];
    case "lmarena.publish_lag_and_n":
      return [
        ["Configs (lag measured on)", `${n(h.configs)} (${n(h.configs_with_lag_measured)})`],
        ["Rows stating n", `${n(h.rows_stating_n)} of ${n(h.rows)}`],
        ["Lag, stated as-of date to push", `${h.lag_hours_lower_min ?? "UNMEASURED"} to ${h.lag_hours_upper_max ?? "UNMEASURED"} h`],
      ];
    case "openrouter_hf.declared_field_agreement":
      return [
        ["Models naming a Hugging Face repo", n(h.models_naming_a_hf_repo)],
        ["Context length: agree / differ / UNMEASURED", `${n(h.context_length?.AGREE)} / ${n(h.context_length?.MISMATCH)} / ${n(h.context_length?.UNMEASURED)}`],
        ["Licence agreement UNMEASURED", n(h.licence?.UNMEASURED)],
      ];
    default:
      return [];
  }
}

export default function DisclosureCompleteness() {
  useEffect(() => {
    document.title = TITLE;
    setMetaDescription(DESCRIPTION);
  }, []);
  const earlier = (SETS.sets as { date: string; set: string }[]).filter((s) => s.set !== SET.set);

  return (
    <article data-testid="disclosure-completeness" className="mx-auto max-w-3xl px-4 py-12 sm:py-16">
      <nav aria-label="Breadcrumb" className="text-sm text-slate-600">
        <Link href="/">Home</Link> › <span>Measurements</span> › <span>Disclosure completeness</span>
      </nav>
      <h1 className="mt-4 text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
        What public benchmark artifacts say about themselves
      </h1>
      <p className="mt-2 text-lg text-slate-700">Four signed measurements, set of {SET.date}.</p>
      <p className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-3 text-slate-800">
        <strong>We count what each artifact states, not how good the models in it are.</strong> These records do not rank,
        grade or compare any model or platform, and they are not certifications. Where we did not measure something, the
        record says UNMEASURED and gives no number.
      </p>

      <H2 id="records">The records</H2>
      {ROWS.map((r) => (
        <section key={r.record_id} data-testid={`dc-record-${r.measure}`} className="mt-6 rounded-xl border border-slate-200 p-4">
          <h3 className="text-lg font-semibold text-slate-900">{r.title}</h3>
          <p className="mt-1 text-sm text-slate-600">
            Source: {r.source.name} ({r.source.publisher}).{" "}
            <a className="break-all underline underline-offset-4" href={r.source.urls[0]} rel="noreferrer noopener" target="_blank">
              {r.source.urls[0]}
            </a>
          </p>
          <P>{r.answer}</P>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {figures(r).map(([k, v]) => (
              <Fig key={k} k={k} v={v} />
            ))}
          </div>
          <p className="mt-3 text-sm text-slate-600">
            Inputs read up to {r.as_of.replace("T", " ").replace("Z", " UTC")}. Items the record lists as UNMEASURED:{" "}
            {r.unmeasured_count}.{" "}
            {r.licence.attribution_required ? <>Attribution: {r.licence.attribution_required}. </> : null}
            {r.licence.note ? <>{r.licence.note} </> : null}
            Our record: {r.licence.our_record}.
          </p>
          <p className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm">
            <a className="underline underline-offset-4" href={`${BASE}/${r.path}`}>record.json</a>
            <a className="underline underline-offset-4" href={`${BASE}/${r.signed}`}>signature</a>
            <a className="underline underline-offset-4" href={`${BASE}/${r.path}.ots`}>timestamp (.ots)</a>
          </p>
        </section>
      ))}

      <H2 id="verify">How to check them</H2>
      <P>
        Each <Code>record.signed.json</Code> signs the sha256 of its <Code>record.json</Code> with the board key{" "}
        <Code>did:web:csoai.org#board-attestation-1</Code>. Download the set (<a className="underline underline-offset-4" href={`${BASE}/set.json`}>set.json</a>,{" "}
        <a className="underline underline-offset-4" href={`${BASE}/verify.py`}>verify.py</a>,{" "}
        <a className="underline underline-offset-4" href={`${BASE}/method/adapters.py`}>method/adapters.py</a> and the four record folders) and run{" "}
        <Code>python3 verify.py</Code>. It checks every record's bytes and signature against the key in{" "}
        <a className="underline underline-offset-4" href="https://csoai.org/.well-known/did.json">csoai.org/.well-known/did.json</a>.
      </P>
      <P>
        Each record pins every input by sha256 and pins the measurement code by sha256. With the same input bytes,{" "}
        <Code>python3 verify.py --recompute DIR</Code> re-runs each measurement and compares the result field by field. We do
        not republish the inputs, because their licences differ; each record names where they came from.
      </P>

      <H2 id="cadence">How often</H2>
      <P>
        Our consumer loop reads these sources on their own schedules and re-computes the measurements each day. A new dated
        set is signed and published only when an input or the method changed, and only through the same signing and release
        gates as this one.
      </P>
      {earlier.length > 0 ? (
        <ul className="mt-3 list-disc space-y-1 pl-5 text-slate-700">
          {earlier.map((s) => (
            <li key={s.set}>
              <a className="underline underline-offset-4" href={`/interop/${s.set}/set.json`}>{s.date}</a>
            </li>
          ))}
        </ul>
      ) : (
        <P>This is the first set.</P>
      )}
      <P>
        Something wrong? Every correction goes on the <Link href="/corrections" className="underline underline-offset-4">corrections ledger</Link>.
        Related: <Link href="/benchmark-index" className="underline underline-offset-4">the benchmark index</Link>.
      </P>
    </article>
  );
}
