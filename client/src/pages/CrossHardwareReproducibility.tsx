/**
 * /research/cross-hardware-reproducibility/ — the human page for the preprint "Same model, same
 * prompts, different answers" and its public dataset.
 *
 * NO NUMBER ON THIS PAGE IS WRITTEN IN SOURCE. Every figure is read in the browser from the
 * dataset's own numbers file (paper/numbers.json, the file the paper's script generates and the
 * dataset regenerates byte for byte), and the signed Merkle roots from the dataset's capsule
 * records, at one pinned Hugging Face commit. Anything that cannot be read says so; nothing is
 * filled in. Aggregates only: no score, grade or ranking of any model, company or vendor.
 */
import { useEffect, useState, type ReactNode } from "react";
import { Link } from "wouter";
import { setMetaDescription } from "@/lib/utils";
import PlainEmail from "@/components/PlainEmail";

const TITLE = "Cross-hardware reproducibility of LLM evaluation results | Council of AI";
const DESCRIPTION =
  "Preprint and open dataset: the same model, prompts and settings re-run on a second GPU runtime and compared item by item. Check every number yourself.";

const HF = "https://huggingface.co";
const DS = "csoai/cross-hardware-reproducibility";
/** The dataset commit whose files this page reads. A later commit does not change what is shown. */
const REV = "57f1166fc8f19bec96c3fa78feb24a3c79ff2b47";
const DS_URL = `${HF}/datasets/${DS}`;
const PDF_URL = `${HF}/datasets/${DS}/resolve/main/paper/paper.pdf`;
const SRC_URL = `${HF}/datasets/${DS}/resolve/main/paper/paper-source.tar.gz`;
const raw = (p: string) => `${HF}/datasets/${DS}/resolve/${REV}/${p}`;
const blob = (p: string) => `${HF}/datasets/${DS}/blob/${REV}/${p}`;

type Numbers = Record<string, number | string>;
type Record_ = { merkle_root?: string; n_capsules?: number };
type Loaded = { n: Numbers; sha256: string | null };

async function sha256Hex(buf: ArrayBuffer): Promise<string | null> {
  try {
    const d = await crypto.subtle.digest("SHA-256", buf);
    return Array.from(new Uint8Array(d), (b) => b.toString(16).padStart(2, "0")).join("");
  } catch {
    return null;
  }
}

async function loadNumbers(): Promise<Loaded> {
  const r = await fetch(raw("paper/numbers.json"));
  if (!r.ok) throw new Error(`numbers.json answered ${r.status}`);
  const buf = await r.arrayBuffer();
  return { n: JSON.parse(new TextDecoder().decode(buf)) as Numbers, sha256: await sha256Hex(buf) };
}

async function loadRoots(): Promise<Record_[]> {
  return Promise.all(
    ["capsules/batch1/record.json", "capsules/batch2/record.json"].map(async (p) => {
      const r = await fetch(raw(p));
      if (!r.ok) throw new Error(`${p} answered ${r.status}`);
      return (await r.json()) as Record_;
    }),
  );
}

const A = "underline underline-offset-4";

export default function CrossHardwareReproducibility() {
  const [data, setData] = useState<Loaded | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [roots, setRoots] = useState<Record_[] | null>(null);
  const [rootsErr, setRootsErr] = useState<string | null>(null);

  useEffect(() => {
    document.title = TITLE;
    setMetaDescription(DESCRIPTION);
    loadNumbers().then(setData, (e) => setErr((e as Error).message));
    loadRoots().then(setRoots, (e) => setRootsErr((e as Error).message));
  }, []);

  const N = data?.n;
  /** One value from numbers.json, formatted; a missing value reads as a dash, never a guess. */
  const v = (k: string): string => {
    const x = N?.[k];
    if (typeof x === "number") return x.toLocaleString("en-GB");
    if (typeof x === "string") return x.replace("--", "–");
    return "—";
  };
  const Fig = ({ label, children, id }: { label: string; children: ReactNode; id: string }) => (
    <div className="rounded-lg border border-slate-300 bg-white p-4">
      <dt className="text-sm font-semibold text-slate-700">{label}</dt>
      <dd data-testid={id} className="mt-1 text-slate-900">{children}</dd>
    </div>
  );

  return (
    <div data-testid="xhw-page" className="mx-auto max-w-3xl px-4 py-10 sm:py-14">
      <nav aria-label="Breadcrumb" className="text-sm text-slate-600">
        <Link href="/">Home</Link> › <Link href="/research-transparency/">Research</Link> › <span>Cross-hardware reproducibility</span>
      </nav>
      <p className="mt-4 text-sm font-semibold uppercase tracking-wide text-slate-600">Preprint · September 2026</p>
      <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
        Same model, same prompts, different answers
      </h1>
      <p className="mt-2 text-lg text-slate-800">Item-level cross-hardware reproducibility of LLM evaluation results</p>
      <p className="mt-3 text-slate-700">Nicholas Templeman, CSOAI Ltd (Council of AI), United Kingdom.</p>

      <div className="mt-5 flex flex-wrap gap-3">
        <a data-testid="pdf-link" href={PDF_URL} className="rounded-md bg-slate-900 px-4 py-2 font-semibold text-white hover:bg-slate-700">
          Read the preprint (PDF)
        </a>
        <a data-testid="dataset-link" href={DS_URL} className="rounded-md border border-slate-400 px-4 py-2 font-semibold text-slate-900 hover:bg-slate-100">
          The dataset on Hugging Face
        </a>
        <a href={SRC_URL} className="rounded-md border border-slate-400 px-4 py-2 font-semibold text-slate-900 hover:bg-slate-100">
          LaTeX source and scripts
        </a>
      </div>

      <p data-testid="doctrine" className="mt-6 rounded-md border border-slate-300 bg-slate-50 p-3 text-sm text-slate-800">
        <strong className="font-semibold">Measurement, not certification.</strong> This work measures whether a published evaluation
        result survives a change of machine. It scores no model, company, GPU vendor or cloud provider, and it does not say which
        runtime is right. None of the models is a CSOAI model. Everything below is an aggregate over all of them.
      </p>

      <section aria-labelledby="abstract-heading" className="mt-10" aria-busy={!data && !err}>
        <h2 id="abstract-heading" className="text-xl font-bold text-slate-900">Abstract</h2>
        <p className="mt-3 leading-relaxed text-slate-700">
          Evaluation results for large language models are usually published as totals: a model answered <em>k</em> of{" "}
          <em>n</em> items correctly. We ask whether those results are a property of the model, the prompts and the grader, or
          also of the machine that ran them. We re-ran {v("all_cards")} published evaluation results (“cards”), covering{" "}
          {v("all_models")} open-weight models on {v("all_axes")} evaluation axes and {v("all_n")} items, on a second runtime: a
          Kaggle Tesla T4 instead of the RunPod RTX 3090 that produced them, with the same model manifest digest, the same prompts
          and item banks (pinned by SHA-256), the same instrument, and fixed greedy decoding.
        </p>
        <p className="mt-3 leading-relaxed text-slate-700">
          Raw outputs were byte-identical on {v("all_raw_eq_pct")}% of items; grades agreed on {v("all_grade_eq_pct")}%. The{" "}
          {v("all_flips")} grade flips went in both directions ({v("all_flips_up")} up, {v("all_flips_down")} down) and so mostly
          cancel in totals: {v("all_admit_count")} cards reproduced their total exactly, but on {v("all_agg_only")} of those an
          item's grade had changed. Only {v("all_itemwise")} cards were grade-identical item by item. A further {v("all_swaps")}{" "}
          items kept their grade but swapped between “parse error” and “wrong answer”, which changes the denominator of the
          reported accuracy. Re-running the T4 job on the same T4 was not byte-deterministic for {v("rep_nonident_cards")} of{" "}
          {v("rep_cards")} cards. Grade flips arise overwhelmingly when the two runtimes diverge on the first generated token.
        </p>
        <p className="mt-3 leading-relaxed text-slate-700">
          We argue that evaluation results should be admitted for publication only on item-level agreement across independent
          runtimes, that the runtime must be reported with every result, and that totals alone cannot establish
          reproducibility. The per-item data for all three runs, the runtime declarations and the signed Merkle roots that bind
          them are public.
        </p>
      </section>

      <section aria-labelledby="figures-heading" className="mt-10">
        <h2 id="figures-heading" className="text-xl font-bold text-slate-900">Key figures</h2>
        <div aria-live="polite">
          {err ? (
            <p className="mt-3 text-slate-800">
              The numbers file could not be read from Hugging Face just now ({err}). Nothing is shown in its place; open{" "}
              <a className={A} href={blob("paper/numbers.json")}>paper/numbers.json</a> directly.
            </p>
          ) : !N ? (
            <p className="mt-3 text-slate-700">Reading the dataset's numbers file…</p>
          ) : (
            <>
              <p className="mt-3 text-slate-700">
                RTX 3090 against Tesla T4, same digest, prompts and decode settings. Read from{" "}
                <a className={A} href={blob("paper/numbers.json")}>paper/numbers.json</a> at dataset commit{" "}
                <code>{REV.slice(0, 8)}</code>
                {data?.sha256 ? (
                  <>
                    ; SHA-256 computed in your browser: <code className="break-all text-xs">{data.sha256}</code>
                  </>
                ) : null}
                .
              </p>
              <dl data-testid="key-figures" className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Fig id="fig-scope" label="Compared">
                  <strong>{v("all_cards")}</strong> cards · {v("all_models")} models · {v("all_axes")} axes · {v("all_n")} items
                </Fig>
                <Fig id="fig-raw" label="Raw output byte-identical">
                  <strong>{v("all_raw_eq_pct")}%</strong> of items ({v("all_raw_eq")} of {v("all_n")})
                </Fig>
                <Fig id="fig-grade" label="Same grade on both runtimes">
                  <strong>{v("all_grade_eq_pct")}%</strong> of items ({v("all_grade_eq")} of {v("all_n")})
                </Fig>
                <Fig id="fig-flips" label="Grade flips">
                  <strong>{v("all_flips")}</strong> ({v("all_flip_rate_pct")}%, 95% CI {v("all_flip_rate_ci")}%): {v("all_flips_up")} up,{" "}
                  {v("all_flips_down")} down; sign test p = {v("sign_test_p")}
                </Fig>
                <Fig id="fig-totals" label="Totals reproduced exactly">
                  <strong>{v("all_admit_count")}</strong> of {v("all_cards")} cards, of which {v("all_agg_only")} hid a changed item
                </Fig>
                <Fig id="fig-itemwise" label="Same grade on every item">
                  <strong>{v("all_itemwise")}</strong> of {v("all_cards")} cards
                </Fig>
                <Fig id="fig-swaps" label="Parse error ↔ wrong answer swaps">
                  <strong>{v("all_swaps")}</strong> items on {v("swap_cards")} cards (grade unchanged, denominator changed)
                </Fig>
                <Fig id="fig-repeat" label="Same T4, run twice">
                  <strong>{v("rep_nonident_cards")}</strong> of {v("rep_cards")} cards not byte-identical; {v("rep_count_diff_cards")} changed
                  their totals
                </Fig>
              </dl>
              <p className="mt-4 text-slate-700">
                Under an admission rule that requires the same totals <em>and</em> the same grade on every item,{" "}
                <strong>{v("all_admit_item")}</strong> of {v("all_cards")} cards pass, against {v("all_admit_count")} under a
                totals-only rule. For items whose grade flipped, the median length of the common prefix of the two outputs is{" "}
                {v("prefix_flip_median")} characters: the runtimes disagree on the first token, which in a label task is the answer.
              </p>
            </>
          )}
        </div>
      </section>

      <section aria-labelledby="not-heading" className="mt-10">
        <h2 id="not-heading" className="text-xl font-bold text-slate-900">What this does not show</h2>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-slate-700">
          <li>
            <strong>Not a ranking.</strong> Flips run both ways in near-equal numbers; neither runtime is “better”, and no model,
            company or vendor is scored.
          </li>
          <li>
            <strong>Not a cause.</strong> GPU architecture, GPU count, driver, flash-attention setting and possibly the server
            build all differ between the runtimes, and several primary-side values were not recorded. Effects are attributed to
            the runtime as a whole.
          </li>
          <li>
            <strong>Not other engines or larger models.</strong> One serving engine (Ollama with llama.cpp), single-request
            serving, small to mid-size quantized open-weight models.
          </li>
          <li>
            <strong>Not a third runtime.</strong> A Tesla P100 reproduction was queued while the analysis was prepared. It has not
            been admitted or signed, and no result from it is reported.
          </li>
          <li>
            <strong>Not independent.</strong> All runs are ours. The data and signed roots let anyone re-check the comparison; a
            reproduction by a different operator would be stronger evidence.
          </li>
        </ul>
      </section>

      <section aria-labelledby="verify-heading" className="mt-10">
        <h2 id="verify-heading" className="text-xl font-bold text-slate-900">How to verify</h2>
        <p className="mt-2 text-slate-700">Download the dataset, then run its offline verifier:</p>
        <pre className="mt-3 overflow-x-auto whitespace-pre-wrap break-all rounded bg-slate-100 p-3 text-xs text-slate-900">
{`pip install -U cryptography huggingface_hub
hf download ${DS} --repo-type dataset --local-dir xhw
cd xhw && python3 verify.py`}
        </pre>
        <p className="mt-2 text-slate-700">
          It checks the capsule hashes, the RFC 6962 Merkle roots, the Ed25519 signatures against the board key in{" "}
          <a className={A} href="https://csoai.org/.well-known/did.json">csoai.org/.well-known/did.json</a>, that the per-item data
          matches what the signed declarations bind, that recounting it reproduces every card's declared counts, and every file
          against <code>manifest.jsonl</code>. It prints <code>ALL CHECKS PASS</code> only if all of them do.
        </p>
        <p className="mt-3 text-slate-700">To regenerate every number and table in the paper from the dataset alone:</p>
        <pre className="mt-3 overflow-x-auto whitespace-pre-wrap break-all rounded bg-slate-100 p-3 text-xs text-slate-900">
{`python3 code/figures/from_dataset.py --dataset . --work /tmp/xhw
python3 code/figures/make_figures.py --decl /tmp/xhw/decl-nemo \\
  --decl /tmp/xhw/decl-batch2 --items /tmp/xhw/items
cmp code/build/numbers.json paper/numbers.json`}
        </pre>
        <h3 className="mt-5 text-base font-bold text-slate-900">Signed roots</h3>
        <p className="mt-1 text-slate-700">
          The runtime declarations are bound into two signed batches of measurement capsules, signed under{" "}
          <code>did:web:csoai.org#board-attestation-1</code>. Read from the dataset's capsule records:
        </p>
        <div aria-live="polite">
          {rootsErr ? (
            <p className="mt-2 text-slate-800">
              The capsule records could not be read just now ({rootsErr}); see <a className={A} href={blob("capsules")}>capsules/</a>.
            </p>
          ) : !roots ? (
            <p className="mt-2 text-slate-700">Reading the capsule records…</p>
          ) : (
            <dl data-testid="signed-roots" className="mt-3 grid grid-cols-1 gap-x-4 gap-y-2 text-sm sm:grid-cols-[auto_1fr]">
              {roots.map((r, i) => (
                <div key={i} className="contents">
                  <dt className="font-semibold text-slate-900">
                    Batch {i + 1}
                    {typeof r.n_capsules === "number" ? ` (${r.n_capsules.toLocaleString("en-GB")} capsules)` : ""}
                  </dt>
                  <dd className="break-all font-mono text-slate-800">{r.merkle_root ?? "not stated"}</dd>
                </div>
              ))}
            </dl>
          )}
        </div>
        <p className="mt-3 text-slate-700">
          The same kind of record is published daily in the{" "}
          <Link href="/measurement-capsules/" className={A}>measurement capsules</Link> index.
        </p>
      </section>

      <section aria-labelledby="cite-heading" className="mt-10">
        <h2 id="cite-heading" className="text-xl font-bold text-slate-900">Licence and citation</h2>
        <p className="mt-2 text-slate-700">
          Paper and data: CC BY 4.0. Model outputs are included as research evidence; each model remains under its own licence.
          The analysis code and draft text were produced with AI assistance; every number is recomputed from the published
          per-item data by the included scripts, and the author is responsible for the content.
        </p>
        <pre className="mt-3 overflow-x-auto whitespace-pre-wrap break-all rounded bg-slate-100 p-3 text-xs text-slate-900">
{`@misc{templeman2026crosshardware,
  title  = {Same model, same prompts, different answers: item-level
            cross-hardware reproducibility of LLM evaluation results},
  author = {Templeman, Nicholas},
  year   = {2026},
  note   = {CSOAI Ltd (Council of AI). Preprint and data:
            https://huggingface.co/datasets/${DS}}
}`}
        </pre>
      </section>

      <section aria-labelledby="object-heading" className="mt-10">
        <h2 id="object-heading" className="text-xl font-bold text-slate-900">Corrections and objections</h2>
        <p className="mt-2 text-slate-700">
          If you think something in the paper or the data is wrong, or you want a specific output withheld, see{" "}
          <Link href="/census/" className={`font-semibold ${A}`}>how to object</Link> or email{" "}
          <PlainEmail className={A} subject="Cross-hardware reproducibility" />. A correction is published as a new, linked
          version and dated in the <Link href="/corrections/" className={A}>corrections ledger</Link>; signed files are never
          edited in place.
        </p>
      </section>
    </div>
  );
}
