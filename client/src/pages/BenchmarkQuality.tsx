import { useEffect, useState } from "react";
import { Link } from "wouter";
import { ExternalLink, CheckCircle2, XCircle, HelpCircle, ShieldAlert, Scale } from "lucide-react";
import { setMetaDescription } from "@/lib/utils";

/**
 * BenchmarkQuality — the public face of the benchmark-quality register.
 *
 * Everything on this page is rendered LIVE from /api/benchmark-quality. Not one predicate
 * result, evidence string, source URL or fetch date is hard-coded here — if the endpoint is
 * unreachable the page says so and shows nothing, rather than falling back to a stale copy
 * that would look identical and be a lie.
 *
 * The disclosure chips (unsolicited · no subject participation · public artifacts only · not a
 * certification) follow the EU credit-rating convention: the conditions under which an
 * unsolicited assessment was produced are disclosed ON the assessment, at the same prominence
 * as the assessment itself — not buried in a methodology annexe.
 */

type PredicateResult = "PASS" | "FAIL" | "UNKNOWN";

interface Predicate {
  id: string;
  group: string;
  question: string;
  pass_means: string;
  result: PredicateResult;
  evidence: string;
  source_url: string;
  fetched: string;
  unknown_reason?: string;
}

interface Artifact { key: string; url: string; fetched: string; what: string }

interface Record_ {
  id: string;
  benchmark: string;
  publisher: string;
  homepage: string;
  scorer_kind: string;
  record_type: string;
  not_a_certification: boolean;
  endorsement: string;
  authored_by: string;
  solicited: boolean;
  subject_participation: string;
  access: string;
  assessed_on: string;
  claim: string;
  artifacts: Artifact[];
  tally: { checked: number; pass: number; fail: number; unknown: number };
  predicates: Predicate[];
}

interface Register {
  schema: string;
  assessed_on: string;
  method: string;
  impartiality_policy: string;
  impartiality: {
    enforced_in_code: boolean;
    enforced_by: string;
    excluded_subjects: Array<{ id: string; label: string; pattern: string }>;
    blocked_count: number;
  };
  notice_policy: {
    window_days: number;
    procedure: string;
    right_of_reply: string;
    corrections: string;
    applies_to: string;
    first_publication_state: string;
  };
  result_semantics: Record<string, string>;
  totals: { records: number; predicates_per_record: number; pass: number; fail: number; unknown: number; checked: number; note: string };
  records: Record_[];
  limitations: string[];
  license: string;
  site_attestation?: { signer?: string; alg?: string; sig?: string; error?: string };
}

const GROUP_LABEL: Record<string, string> = {
  contamination_resistance: "Contamination resistance",
  reproducibility: "Reproducibility",
  statistical_rigour: "Statistical rigour",
  scoring_transparency: "Scoring transparency",
  governance_coi: "Governance & conflict of interest",
  item_quality: "Item quality",
  licensing: "Licensing",
  saturation_discrimination: "Saturation & discrimination",
  failure_disclosure: "Failure disclosure",
};

const GROUP_ORDER = Object.keys(GROUP_LABEL);

/**
 * JSON-LD. Every statement below is true of the artifact it describes: the register exists at
 * that URL, carries that licence, is authored by CSOAI Ltd, and lists exactly these subjects.
 * KEEP THE SUBJECT LIST IN STEP with functions/api/benchmark-quality.ts — a name here that the
 * endpoint does not serve would be an untrue assertion in structured data.
 */
const SUBJECTS_LD = [
  { name: "MMLU (Measuring Massive Multitask Language Understanding)", url: "https://github.com/hendrycks/test", creator: "Hendrycks et al. / CAIS" },
  { name: "BIG-bench (Beyond the Imitation Game)", url: "https://github.com/google/BIG-bench", creator: "Google and collaborating authors" },
  { name: "SWE-bench", url: "https://www.swebench.com", creator: "SWE-bench team (Princeton NLP lineage)" },
  { name: "GPQA (Graduate-Level Google-Proof Q&A)", url: "https://huggingface.co/datasets/Idavidrein/gpqa", creator: "Rein et al." },
  { name: "LiveBench", url: "https://livebench.ai", creator: "LiveBench authors" },
  { name: "LMArena (Arena) model leaderboard", url: "https://arena.ai", creator: "Arena / LMArena" },
];

const PAGE_LD = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebPage",
      "@id": "https://councilof.ai/benchmark-quality#page",
      url: "https://councilof.ai/benchmark-quality",
      name: "Benchmark-quality register — the process integrity of third-party AI benchmarks",
      description:
        "A public register recording what third-party AI benchmarks disclose about contamination control, reproducibility, statistical rigour, scoring, governance, item quality, licensing and corrections. Each predicate is answered from a named public artifact on a stated date. Unsolicited, no subject participation, not a certification.",
      isPartOf: { "@type": "WebSite", name: "Council of AI", url: "https://councilof.ai" },
      publisher: {
        "@type": "Organization",
        name: "Council of AI",
        legalName: "CSOAI Ltd",
        url: "https://councilof.ai",
        identifier: "UK Companies House 16939677",
      },
    },
    {
      "@type": "Dataset",
      "@id": "https://councilof.ai/api/benchmark-quality#dataset",
      name: "Benchmark-quality register",
      description:
        "Deterministic predicates recording the disclosed process integrity of third-party AI benchmarks. Every predicate result carries the URL fetched and the date it was fetched; a predicate that could not be checked is recorded as UNKNOWN with its reason. No language model scored any predicate.",
      url: "https://councilof.ai/api/benchmark-quality",
      distribution: {
        "@type": "DataDownload",
        encodingFormat: "application/json",
        contentUrl: "https://councilof.ai/api/benchmark-quality",
      },
      license: "https://creativecommons.org/licenses/by/4.0/",
      isAccessibleForFree: true,
      creator: {
        "@type": "Organization",
        name: "Council of AI",
        legalName: "CSOAI Ltd",
        url: "https://councilof.ai",
        identifier: "UK Companies House 16939677",
      },
      variableMeasured: GROUP_ORDER.map((g) => ({ "@type": "PropertyValue", name: GROUP_LABEL[g] })),
    },
    {
      "@type": "ItemList",
      "@id": "https://councilof.ai/benchmark-quality#subjects",
      name: "Third-party AI benchmarks recorded on the Council of AI benchmark-quality register",
      description:
        "The benchmarks whose public artifacts were fetched and read for this register. Listing is unsolicited and implies no endorsement, approval, or certification of any listed benchmark.",
      numberOfItems: SUBJECTS_LD.length,
      itemListOrder: "https://schema.org/ItemListUnordered",
      itemListElement: SUBJECTS_LD.map((s, i) => ({
        "@type": "ListItem",
        position: i + 1,
        item: { "@type": "CreativeWork", name: s.name, url: s.url, creator: { "@type": "Organization", name: s.creator } },
      })),
    },
  ],
};

function ResultChip({ r }: { r: PredicateResult }) {
  if (r === "PASS")
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-bold uppercase tracking-wide text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300">
        <CheckCircle2 className="h-3.5 w-3.5" aria-hidden /> Pass
      </span>
    );
  if (r === "FAIL")
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-100 px-2.5 py-1 text-xs font-bold uppercase tracking-wide text-rose-800 dark:bg-rose-900/50 dark:text-rose-300">
        <XCircle className="h-3.5 w-3.5" aria-hidden /> Fail
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-bold uppercase tracking-wide text-amber-900 dark:bg-amber-900/50 dark:text-amber-300">
      <HelpCircle className="h-3.5 w-3.5" aria-hidden /> Unknown
    </span>
  );
}

function Flag({ label, value }: { label: string; value: string }) {
  return (
    <span className="inline-flex items-baseline gap-1.5 rounded-md border border-indigo-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-indigo-900 dark:border-indigo-800 dark:bg-gray-900 dark:text-indigo-200">
      <span className="uppercase tracking-wide text-indigo-500 dark:text-indigo-400">{label}</span>
      <span>{value}</span>
    </span>
  );
}

export default function BenchmarkQuality() {
  const [reg, setReg] = useState<Register | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    document.title = "Benchmark-quality register — deterministic predicates on third-party AI benchmarks | Council of AI";
    setMetaDescription(
      "A live, signed register recording what third-party AI benchmarks — MMLU, BIG-bench, SWE-bench, GPQA, LiveBench, LMArena — actually disclose about contamination control, reproducibility, statistical rigour, scoring, governance, item quality and corrections. Deterministic predicates, no model judgment, every answer carrying the URL and date it was read from. Unsolicited; not a certification.",
    );
  }, []);

  useEffect(() => {
    fetch("/api/benchmark-quality")
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then(setReg)
      .catch((e) => setErr(String(e)));
  }, []);

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(PAGE_LD) }} />

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header className="border-b border-gray-200 bg-gradient-to-br from-white via-indigo-50 to-indigo-100 dark:border-gray-800 dark:from-gray-900 dark:via-gray-900 dark:to-indigo-950">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-indigo-700 dark:text-indigo-400">
            Benchmark-quality register{reg ? ` · assessed ${reg.assessed_on}` : ""}
          </p>
          <h1 className="mt-3 text-4xl font-black tracking-tight text-gray-900 dark:text-white sm:text-4xl">
            We measure the instruments too.
          </h1>
          <p className="mt-5 max-w-3xl text-lg leading-relaxed text-gray-700 dark:text-gray-300">
            Everyone argues about which model tops which leaderboard. Almost nobody asks whether the
            leaderboard is built well enough to settle the argument. This register asks — with{" "}
            <strong>deterministic predicates</strong>, answered from a benchmark's own public
            artifacts, each one carrying the URL it was read from and the date it was read.
          </p>
          <p className="mt-4 max-w-3xl text-base leading-relaxed text-gray-600 dark:text-gray-400">
            No language model judged anything here. A register that graded other benchmarks on
            scoring transparency by asking a model for its opinion would fail its own predicate on
            the first row.
          </p>

          <div className="mt-7 flex flex-wrap gap-2">
            <Flag label="Record type" value="measured current state" />
            <Flag label="Solicited" value="no" />
            <Flag label="Subject participation" value="none" />
            <Flag label="Access" value="public artifacts only" />
            <Flag label="Endorsement" value="none" />
            <Flag label="Certification" value="not a certification" />
            <Flag label="Model judgment" value="none" />
          </div>

          <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm font-semibold">
            <a
              href="/api/benchmark-quality"
              className="inline-flex items-center gap-1.5 text-indigo-700 underline underline-offset-4 hover:text-indigo-900 dark:text-indigo-300"
            >
              The signed JSON <ExternalLink className="h-3.5 w-3.5" aria-hidden />
            </a>
            <Link href="/benchmark-index" className="text-gray-700 underline underline-offset-4 hover:text-gray-900 dark:text-gray-300">
              What those benchmarks report →
            </Link>
            <Link href="/honesty" className="text-gray-700 underline underline-offset-4 hover:text-gray-900 dark:text-gray-300">
              Our own losses →
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-14">
        {/* ── The impartiality firewall ─────────────────────────────────────── */}
        <section className="rounded-2xl border-2 border-indigo-200 bg-indigo-50 p-8 dark:border-indigo-800 dark:bg-indigo-950/40">
          <h2 className="flex items-center gap-2.5 text-xl font-black tracking-tight text-gray-900 dark:text-white">
            <Scale className="h-5 w-5 text-indigo-700 dark:text-indigo-400" aria-hidden />
            We are not on this register, and we cannot be
          </h2>
          <p className="mt-4 max-w-4xl leading-relaxed text-gray-700 dark:text-gray-300">
            {reg
              ? reg.impartiality_policy
              : "Council of AI does not assess its own instruments on this register. The exclusion is enforced in the code that builds the payload, not merely promised in prose."}
          </p>
          {reg && (
            <div className="mt-5 rounded-xl border border-indigo-200 bg-white p-5 text-sm dark:border-indigo-900 dark:bg-gray-900">
              <p className="font-bold text-gray-900 dark:text-white">
                Enforced in code — {reg.impartiality.enforced_by}
              </p>
              <ul className="mt-3 space-y-1.5 text-gray-700 dark:text-gray-300">
                {reg.impartiality.excluded_subjects.map((e) => (
                  <li key={e.id}>
                    <span className="font-semibold">{e.label}</span>{" "}
                    <code className="rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                      /{e.pattern}/i
                    </code>
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-gray-600 dark:text-gray-400">
                Records removed by the firewall on this build: <strong>{reg.impartiality.blocked_count}</strong>.
              </p>
            </div>
          )}
        </section>

        {/* ── States ───────────────────────────────────────────────────────── */}
        {err && (
          <p className="mt-10 rounded-xl border border-rose-300 bg-rose-50 p-6 text-rose-900 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-200">
            The register endpoint could not be read ({err}). Nothing is shown rather than a cached
            copy — a stale register that looked live would be the exact failure this page exists to
            refuse.
          </p>
        )}
        {!reg && !err && <p className="mt-10 text-gray-500 dark:text-gray-400">Reading the register…</p>}

        {reg && (
          <>
            {/* ── Totals ──────────────────────────────────────────────────── */}
            <section className="mt-12">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {[
                  { k: "Benchmarks recorded", v: reg.totals.records },
                  { k: "Predicates answered", v: reg.totals.checked },
                  { k: "Recorded UNKNOWN", v: reg.totals.unknown },
                  { k: "Predicates per record", v: reg.totals.predicates_per_record },
                ].map((c) => (
                  <div key={c.k} className="rounded-xl border border-gray-200 bg-gray-50 p-6 dark:border-gray-800 dark:bg-gray-900">
                    <p className="text-3xl font-black text-gray-900 dark:text-white">{c.v}</p>
                    <p className="mt-1 text-xs font-bold uppercase tracking-wide text-gray-500 dark:text-gray-400">{c.k}</p>
                  </div>
                ))}
              </div>
              <p className="mt-4 max-w-4xl text-sm leading-relaxed text-gray-600 dark:text-gray-400">{reg.totals.note}</p>
            </section>

            {/* ── What the three results mean ─────────────────────────────── */}
            <section className="mt-12 rounded-2xl border border-gray-200 bg-white p-8 dark:border-gray-800 dark:bg-gray-950">
              <h2 className="text-xl font-black tracking-tight text-gray-900 dark:text-white">
                Three results, and the third one is real
              </h2>
              <dl className="mt-5 grid gap-6 md:grid-cols-3">
                {(["PASS", "FAIL", "UNKNOWN"] as PredicateResult[]).map((k) => (
                  <div key={k}>
                    <dt className="mb-2">
                      <ResultChip r={k} />
                    </dt>
                    <dd className="text-sm leading-relaxed text-gray-700 dark:text-gray-300">{reg.result_semantics[k]}</dd>
                  </div>
                ))}
              </dl>
            </section>

            {/* ── Records ─────────────────────────────────────────────────── */}
            <section className="mt-16 space-y-14">
              <h2 className="text-2xl font-black tracking-tight text-gray-900 dark:text-white">The records</h2>

              {reg.records.map((rec) => (
                <article key={rec.id} className="rounded-2xl border-2 border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-950">
                  <div className="border-b border-gray-200 bg-gray-50 p-8 dark:border-gray-800 dark:bg-gray-900">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <h3 className="text-2xl font-black tracking-tight text-gray-900 dark:text-white">{rec.benchmark}</h3>
                        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                          {rec.publisher} ·{" "}
                          <a href={rec.homepage} rel="nofollow noopener" className="underline underline-offset-2 hover:text-gray-900 dark:hover:text-white">
                            {rec.homepage.replace(/^https?:\/\//, "")}
                          </a>
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300">
                          {rec.tally.pass} pass
                        </span>
                        <span className="rounded-full bg-rose-100 px-3 py-1 text-xs font-bold text-rose-800 dark:bg-rose-900/50 dark:text-rose-300">
                          {rec.tally.fail} fail
                        </span>
                        <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-900 dark:bg-amber-900/50 dark:text-amber-300">
                          {rec.tally.unknown} unknown
                        </span>
                      </div>
                    </div>

                    {/* Disclosure row — the EU credit-rating convention: the conditions of an
                        unsolicited assessment are disclosed ON the assessment. */}
                    <div className="mt-5 flex flex-wrap gap-2">
                      <Flag label="Record type" value={rec.record_type} />
                      <Flag label="Solicited" value={rec.solicited ? "yes" : "no"} />
                      <Flag label="Subject participation" value={rec.subject_participation} />
                      <Flag label="Access" value={rec.access.replace(/_/g, " ")} />
                      <Flag label="Endorsement" value={rec.endorsement} />
                      <Flag label="Certification" value={rec.not_a_certification ? "not a certification" : "—"} />
                      <Flag label="Authored by" value={rec.authored_by} />
                    </div>

                    <p className="mt-5 rounded-xl border-l-4 border-indigo-400 bg-indigo-50 p-4 text-sm leading-relaxed text-gray-800 dark:border-indigo-600 dark:bg-indigo-950/40 dark:text-gray-200">
                      <span className="font-bold">The claim, in full: </span>
                      {rec.claim}
                    </p>

                    <p className="mt-4 text-sm text-gray-700 dark:text-gray-300">
                      <span className="font-bold">What produces the score: </span>
                      {rec.scorer_kind}
                    </p>

                    <div className="mt-5">
                      <p className="text-xs font-bold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                        Artifacts fetched
                      </p>
                      <ul className="mt-2 space-y-1.5 text-sm">
                        {rec.artifacts.map((a) => (
                          <li key={a.key} className="text-gray-700 dark:text-gray-300">
                            <a href={a.url} rel="nofollow noopener" className="font-mono text-xs text-indigo-700 underline underline-offset-2 dark:text-indigo-300">
                              {a.url}
                            </a>{" "}
                            <span className="text-gray-500 dark:text-gray-400">— {a.what} · fetched {a.fetched}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Predicate table, grouped */}
                  <div className="p-8">
                    {GROUP_ORDER.filter((g) => rec.predicates.some((p) => p.group === g)).map((g) => (
                      <div key={g} className="mb-10 last:mb-0">
                        <h4 className="text-sm font-black uppercase tracking-[0.15em] text-indigo-700 dark:text-indigo-400">
                          {GROUP_LABEL[g]}
                        </h4>
                        <div className="mt-4 overflow-x-auto">
                          <table className="w-full min-w-[46rem] border-collapse text-left text-sm">
                            <thead>
                              <tr className="border-b border-gray-200 dark:border-gray-800">
                                <th scope="col" className="w-[34%] py-2 pr-4 text-xs font-bold uppercase tracking-wide text-gray-500 dark:text-gray-400">Predicate</th>
                                <th scope="col" className="w-[10%] py-2 pr-4 text-xs font-bold uppercase tracking-wide text-gray-500 dark:text-gray-400">Result</th>
                                <th scope="col" className="w-[36%] py-2 pr-4 text-xs font-bold uppercase tracking-wide text-gray-500 dark:text-gray-400">What was read</th>
                                <th scope="col" className="w-[20%] py-2 text-xs font-bold uppercase tracking-wide text-gray-500 dark:text-gray-400">Source · fetched</th>
                              </tr>
                            </thead>
                            <tbody>
                              {rec.predicates
                                .filter((p) => p.group === g)
                                .map((p) => (
                                  <tr key={p.id} className="border-b border-gray-100 align-top dark:border-gray-900">
                                    <td className="py-4 pr-4">
                                      <p className="font-semibold text-gray-900 dark:text-white">{p.question}</p>
                                      <p className="mt-1 font-mono text-[11px] text-gray-400 dark:text-gray-500">{p.id}</p>
                                    </td>
                                    <td className="py-4 pr-4">
                                      <ResultChip r={p.result} />
                                    </td>
                                    <td className="py-4 pr-4 leading-relaxed text-gray-700 dark:text-gray-300">
                                      {p.evidence}
                                      {p.unknown_reason && (
                                        <span className="mt-2 block rounded-md bg-amber-50 p-2 text-[13px] text-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
                                          <strong>Why unknown: </strong>
                                          {p.unknown_reason}
                                        </span>
                                      )}
                                    </td>
                                    <td className="py-4">
                                      <a href={p.source_url} rel="nofollow noopener" className="break-all font-mono text-[11px] text-indigo-700 underline underline-offset-2 dark:text-indigo-300">
                                        {p.source_url}
                                      </a>
                                      <span className="mt-1 block text-xs text-gray-500 dark:text-gray-400">fetched {p.fetched}</span>
                                    </td>
                                  </tr>
                                ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    ))}
                  </div>
                </article>
              ))}
            </section>

            {/* ── Notice and right of reply ───────────────────────────────── */}
            <section className="mt-16 rounded-2xl border-2 border-amber-300 bg-amber-50 p-8 dark:border-amber-800 dark:bg-amber-950/30">
              <h2 className="flex items-center gap-2.5 text-xl font-black tracking-tight text-gray-900 dark:text-white">
                <ShieldAlert className="h-5 w-5 text-amber-700 dark:text-amber-400" aria-hidden />
                {reg.notice_policy.window_days}-day notice, and a right of reply
              </h2>
              <p className="mt-4 max-w-4xl leading-relaxed text-gray-800 dark:text-gray-200">{reg.notice_policy.procedure}</p>
              <p className="mt-3 max-w-4xl text-sm leading-relaxed text-gray-700 dark:text-gray-300">
                {reg.notice_policy.first_publication_state}
              </p>
              <p className="mt-4 text-sm font-semibold">
                <Link href="/contact" className="text-amber-800 underline underline-offset-4 dark:text-amber-300">
                  Exercise the right of reply →
                </Link>
                <a href={reg.notice_policy.corrections} className="ml-6 text-amber-800 underline underline-offset-4 dark:text-amber-300">
                  The corrections ledger →
                </a>
              </p>
            </section>

            {/* ── Limitations ─────────────────────────────────────────────── */}
            <section className="mt-12 rounded-2xl border border-gray-200 bg-gray-50 p-8 dark:border-gray-800 dark:bg-gray-900">
              <h2 className="text-xl font-black tracking-tight text-gray-900 dark:text-white">
                What this register does not tell you
              </h2>
              <ul className="mt-5 space-y-4">
                {reg.limitations.map((l) => (
                  <li key={l} className="flex gap-3 leading-relaxed text-gray-700 dark:text-gray-300">
                    <span aria-hidden className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-gray-400 dark:bg-gray-600" />
                    <span>{l}</span>
                  </li>
                ))}
              </ul>
            </section>

            {/* ── Provenance ──────────────────────────────────────────────── */}
            <section className="mt-12 rounded-2xl border border-gray-200 p-8 dark:border-gray-800">
              <h2 className="text-lg font-black tracking-tight text-gray-900 dark:text-white">Provenance of this page</h2>
              <p className="mt-3 max-w-4xl text-sm leading-relaxed text-gray-700 dark:text-gray-300">
                Everything above is rendered live from{" "}
                <a href="/api/benchmark-quality" className="text-indigo-700 underline underline-offset-2 dark:text-indigo-300">
                  /api/benchmark-quality
                </a>{" "}
                (schema <code className="font-mono text-xs">{reg.schema}</code>, licence {reg.license}). The payload
                is signed at the edge with the board key published in{" "}
                <a href="/.well-known/did.json" className="text-indigo-700 underline underline-offset-2 dark:text-indigo-300">
                  did.json
                </a>
                , so a stranger can verify the register they fetched is the register we published — without
                trusting us.{" "}
                {reg.site_attestation?.sig
                  ? `This response carried a signature from ${reg.site_attestation.signer}.`
                  : reg.site_attestation?.error
                    ? "This response carried no signature: the signing key is present but unusable, and the fault is surfaced rather than faked."
                    : "This response carried no signature — the signing key is not provisioned on this environment. An absent signature is honest; a fabricated one would not be."}
              </p>
              <p className="mt-4 text-sm font-semibold">
                <Link href="/benchmark-index" className="text-indigo-700 underline underline-offset-4 dark:text-indigo-300">
                  See what these benchmarks report about models →
                </Link>
              </p>
            </section>
          </>
        )}
      </main>
    </div>
  );
}
