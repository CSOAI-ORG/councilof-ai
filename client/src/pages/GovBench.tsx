import { useEffect } from "react";
import { SovCard } from "@/components/SovCard";
import CesiumPortalCard from "@/components/CesiumPortalCard";
import { Link } from "wouter";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import FaqBlock from "@/components/FaqBlock";
import SpotInfographic from "@/components/SpotInfographic";
import { LANE4 } from "@/data/lane4Content";

const L4 = LANE4["govbench"];
import {
  BarChart3, AlertTriangle, ExternalLink, Database, ShieldCheck, XCircle,
} from "lucide-react";

/**
 * GovBench — the public benchmark page.
 *
 * Every number here comes from a published artefact in the govbench dataset. Where a result
 * is negative or unresolved, it is stated as plainly as the positive one — that is the whole
 * proposition, and it is also the only durable moat: a larger lab will not publish the
 * experiment that refutes its own architecture.
 *
 * Do not add a number to this page that is not in benchmark-results/ and on HuggingFace.
 */

const HF = "https://huggingface.co/datasets/Nicholastempleman/govbench";
const HF_ITEMS = "https://huggingface.co/datasets/Nicholastempleman/govbench-items";
const SPACE = "https://nicholastempleman-sov33-benchmark.static.hf.space";

/**
 * Re-measured 2026-07-29 on ONE self-consistent run of 193 items, with per-item rows retained
 * and a CLUSTER-ROBUST interval (items inside a dimension share a rubric and grader, so
 * sd/√n overstated precision — design effect 1.92, effective n ≈ 100 of 193).
 *
 * The previous table was a splice: its three rows summed to 186 and came from an earlier run,
 * while the total above them came from a 195-item run. These rows partition their own run —
 * 6 + 14 + 173 = 193 — which is the only way a layer table means anything.
 *
 * The gate row is the retraction. It previously read +34.84 and was the largest number in the
 * estate. Source: benchmark-results/layer_attribution.json.
 */
const LAYERS = [
  { layer: "Deterministic gate", n: 6, delta: "−20.00", ci: "[−65.26, +25.26]", good: false },
  { layer: "Knowledge base", n: 14, delta: "+19.64", ci: "[+9.24, +30.04]", good: true },
  { layer: "Tuned model", n: 173, delta: "+6.50", ci: "[+1.06, +11.95]", good: true },
];

const REFUTED = [
  {
    claim: "The deterministic gate is the strongest component of the pipeline",
    result: "Δ −20.00",
    ci: "[−65.26, +25.26]",
    verdict:
      "Retracted 2026-07-29. Previously published as +34.84 — the largest number we had. " +
      "Re-measured on a clean run it fires 6 times, not 31, and adds nothing: the base model " +
      "already refuses all four plain-harm items, and its only measurable effects are two " +
      "false blocks. The earlier figure was measured on a gate that had overfitted to its own " +
      "battery; fixing the overfitting removed the benefit.",
  },
  {
    claim: "Per-dimension expert routing beats one good model",
    result: "Δ +0.90",
    ci: "[-1.99, +3.79]",
    verdict: "No effect. Routing ships OFF.",
  },
  {
    claim: "Retrieving statute text improves answers (ungated)",
    result: "Δ -9.16",
    ci: "[-17.64, -0.69]",
    verdict: "Significant harm.",
  },
  {
    claim: "…with a relevance gate added",
    result: "Δ -5.26",
    ci: "[-12.66, +2.13]",
    verdict: "Harm removed, benefit not shown. Retrieval ships OFF.",
  },
];

const DATASET_LD = {
  "@context": "https://schema.org",
  "@type": "Dataset",
  name: "GovBench — open AI governance benchmark",
  description:
    "A deterministic AI governance benchmark that publishes its own limits: per-item rows, cluster-robust intervals, and negative/retracted results stated as plainly as positive ones. Every published number traces to an artefact on Hugging Face.",
  license: "https://www.apache.org/licenses/LICENSE-2.0",
  creator: { "@type": "Organization", name: "Council of AI", legalName: "CSOAI Ltd", url: "https://councilof.ai/" },
  isAccessibleForFree: true,
  url: "https://councilof.ai/govbench",
  sameAs: [HF, HF_ITEMS],
  distribution: [
    { "@type": "DataDownload", encodingFormat: "application/json", contentUrl: HF },
    { "@type": "DataDownload", encodingFormat: "application/json", contentUrl: HF_ITEMS },
  ],
};

export default function GovBench() {
  useEffect(() => {
    document.title = "GovBench — an AI governance benchmark that publishes its own limits | CSOAI";
    const sc = document.createElement("script");
    sc.type = "application/ld+json";
    sc.setAttribute("data-page-schema", "dataset");
    sc.text = JSON.stringify(DATASET_LD);
    document.head.appendChild(sc);
    return () => { try { document.head.removeChild(sc); } catch { /* gone */ } };
  }, []);
  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      {/* Hero */}
      <div className="bg-gradient-to-br from-white via-emerald-50 to-emerald-100 dark:from-gray-900 dark:via-gray-800 dark:to-emerald-950 py-20">
        <div className="container max-w-5xl">
          <Badge className="mb-4 bg-emerald-600 hover:bg-emerald-600">Open benchmark · Apache-2.0</Badge>
          <h1 className="text-4xl sm:text-5xl font-black tracking-tighter mb-6 text-gray-900 dark:text-white">
            GovBench
          </h1>
          <p className="text-xl text-gray-700 dark:text-gray-300 max-w-3xl mb-8">
            An AI-governance benchmark that publishes its own resolution limit — and the
            experiments that refute its own architecture.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button asChild className="bg-emerald-600 hover:bg-emerald-700">
              <a href={SPACE} target="_blank" rel="noopener noreferrer">
                View the live leaderboard <ExternalLink className="ml-2 h-4 w-4" />
              </a>
            </Button>
            <Button asChild variant="outline">
              <a href={HF_ITEMS} target="_blank" rel="noopener noreferrer">
                <Database className="mr-2 h-4 w-4" /> Get the data
              </a>
            </Button>
          </div>
          <div className="mt-8 max-w-xl">
            <SovCard compact />
          </div>
          <div className="mt-6 max-w-xl">
            <CesiumPortalCard lens="csoai" preset="global" />
          </div>
        </div>
      </div>

      <div className="container max-w-5xl py-16 space-y-14">
        {/* The limit, stated first and deliberately */}
        <Card className="border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30 p-6">
          <div className="flex gap-3">
            <AlertTriangle className="h-6 w-6 text-amber-700 dark:text-amber-500 shrink-0 mt-0.5" />
            <div>
              <h2 className="text-xl font-bold text-amber-900 dark:text-amber-200 mb-2">
                0 of 15 scored dimensions have a resolved winner
              </h2>
              <p className="text-sm text-amber-900/90 dark:text-amber-200/90 mb-3">
                Every dimension is statistically tied across all 10 models on Wilson intervals.
                At current item counts the minimum detectable effect is <strong>≈63 points</strong>,
                and observed margins are 1–15. MMLU's own floor is 100 items per subject; Miller
                (arXiv:2411.00640) puts it at ~1,000 per comparison.
              </p>
              <p className="text-sm font-semibold text-amber-900 dark:text-amber-200">
                So: do not rank models on these numbers. Use them to find failure cases.
              </p>
            </div>
          </div>
        </Card>

        {/* What is measured */}
        <section>
          <h2 className="text-3xl font-bold mb-3 text-gray-900 dark:text-white">
            What is actually measured
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-3xl">
            Not a model — the composed pipeline (gate → retrieve → answer → verify → attest →
            mark) against the same items answered by a raw base model. n=193, paired, judged by
            an analysis written <em>before</em> the run existed.
          </p>
          <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-3xl text-sm">
            Intervals are <strong>cluster-robust</strong>. Items inside a dimension share a
            rubric and a grader, so treating 193 items as 193 independent draws overstates
            precision — the measured design effect is <strong>1.92</strong>, giving an honest
            effective n of <strong>≈100</strong>. Every row below is computed from the same run
            and they partition it: 6 + 14 + 173 = 193.
          </p>

          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-gray-900 text-left">
                  <tr>
                    <th className="p-3 font-semibold">Layer</th>
                    <th className="p-3 font-semibold">n</th>
                    <th className="p-3 font-semibold">Δ vs base</th>
                    <th className="p-3 font-semibold">95% CI</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {LAYERS.map((l) => (
                    <tr key={l.layer}>
                      <td className="p-3">{l.layer}</td>
                      <td className="p-3 tabular-nums text-gray-500">{l.n}</td>
                      <td className={`p-3 tabular-nums font-semibold ${
                        l.good ? "text-emerald-700 dark:text-emerald-400" : "text-rose-600"}`}>
                        {l.delta}
                      </td>
                      <td className="p-3 tabular-nums text-gray-500">{l.ci}</td>
                    </tr>
                  ))}
                  <tr className="bg-emerald-50 dark:bg-emerald-950/40 font-bold">
                    <td className="p-3">Whole system</td>
                    <td className="p-3 tabular-nums">193</td>
                    <td className="p-3 tabular-nums text-emerald-700 dark:text-emerald-400">+6.63</td>
                    <td className="p-3 tabular-nums">[+1.05, +12.21]</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </Card>
          <p className="text-xs text-gray-500 mt-3">
            Wins 55 · losses 25 · ties 113 · sign test p=0.0011. Dropping the single largest
            item moves the headline to +6.15, so it does not rest on one case.
          </p>
        </section>

        {/* The refutations — the actual proposition */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <XCircle className="h-6 w-6 text-rose-600" />
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
              Experiments that refuted our own architecture
            </h2>
          </div>
          <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-3xl">
            Published because a benchmark that only reports its wins is worth less than one that
            reports the controls killing its own thesis. Both of these were built, measured, and
            switched off.
          </p>
          <div className="space-y-3">
            {REFUTED.map((r) => (
              <Card key={r.claim} className="p-4 border-l-4 border-l-rose-500">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <span className="font-medium text-gray-900 dark:text-white">{r.claim}</span>
                  <span className="tabular-nums text-sm">
                    <strong className="text-rose-600">{r.result}</strong>{" "}
                    <span className="text-gray-500">{r.ci}</span>
                  </span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{r.verdict}</p>
              </Card>
            ))}
          </div>
        </section>

        {/* Honesty register */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <ShieldCheck className="h-6 w-6 text-emerald-600" />
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">What this is not</h2>
          </div>
          <Card className="p-6 space-y-3 text-sm text-gray-700 dark:text-gray-300">
            <p>
              <strong>This governs provenance, not correctness.</strong> The pipeline has shipped
              a wrong legal answer carrying a valid EU AI Act Article 50 marking and a clean
              signed receipt. An attested answer is <em>attested</em>, never <em>verified</em> —
              different word, different guarantee.
            </p>
            <p>
              <strong>UNCERTIFIED is the default.</strong> No competent authority exists to confer
              EU AI Act conformity, so neither can we. Nothing here is a certification.
            </p>
            <p>
              <strong>The models tested are system-prompt variants over one shared base</strong>,
              not separately trained weights — which is precisely why the routing experiment above
              came back null.
            </p>
          </Card>
        </section>

        {/* Run it */}
        <section>
          <h2 className="text-3xl font-bold mb-3 text-gray-900 dark:text-white">Run it yourself</h2>
          <pre className="bg-gray-900 text-gray-100 rounded-lg p-4 overflow-x-auto text-sm">
            <code>{`pip install inspect-ai
inspect eval govbench_inspect.py --model ollama/qwen2.5:0.5b`}</code>
          </pre>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-3">
            Failed runs are recorded as <strong>absent</strong>, never as zero — a model we could
            not reach is missing from the board, not scored badly on it.
          </p>
          <div className="flex flex-wrap gap-4 mt-6 text-sm">
            <a className="text-emerald-700 dark:text-emerald-400 hover:underline" href={HF_ITEMS}
               target="_blank" rel="noopener noreferrer">
              193 items, 26 dimensions →
            </a>
            <a className="text-emerald-700 dark:text-emerald-400 hover:underline" href={HF}
               target="_blank" rel="noopener noreferrer">
              Results, tooling and raw JSON →
            </a>
            <Link className="text-emerald-700 dark:text-emerald-400 hover:underline" href="/trust-center">
              Trust &amp; methodology →
            </Link>
          </div>
        </section>

        <SpotInfographic title={L4.spotTitle} stats={L4.spotStats} source={L4.spotSource} />
        <FaqBlock title={L4.faqTitle} intro={L4.faqIntro} items={L4.faq} />
      </div>
    </div>
  );
}
