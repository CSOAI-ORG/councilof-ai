/**
 * GSPC N-sites flags — one signed receipt, many drop points.
 *
 * There is no honest shortcut to millions of model runs. Hugging Face lists
 * more than two million models; a 2,200-subject cohort is a dated eligibility
 * set, not “all Hugging Face.” Full minimum coverage at 2,200 × 15 axes × n=30
 * is 990,000 responses (~644 million tokens under the planning assumption).
 * That is why census, digest dedup, staged promotion and independent reruns
 * come before any sweep.
 *
 * A flag is a pointer to a receipt we already publish. It is not a new score,
 * not a certificate, and not a reason to mint one CSOAI repo per external model.
 */

export type FlagStatus = "planted" | "next" | "do-not";
export type FlagKind = "receipt" | "discovery" | "regulation" | "compute" | "registry";

export type NSiteFlag = {
  id: string;
  title: string;
  status: FlagStatus;
  kind: FlagKind;
  href: string;
  plant: string;
  note: string;
  snippet?: string;
};

export const NSITES_RULING =
  "Win through immutable coverage and independent reproduction — not mass uploads.";

export const NSITES_PUBLIC_CLAIM =
  "2,200 discovered artefacts in a dated cohort; X licence-eligible; Y unique immutable weight lineages; Z measured across N GSPC axes.";

export const NSITES_ENVELOPE = {
  cohort: 2200,
  measured_axes: 15,
  n: 30,
  responses: 990_000,
  tokens_approx: 644_000_000,
  assumption: "650 tokens per response — planning envelope, not a quotation",
} as const;

export const NSITES_BOOTSTRAP = [
  "Card v2 plus subject, instrument, run and evidence manifests",
  "Signed 2,200-subject cohort census — metadata, not inference",
  "Sandboxed worker and a separate signer",
  "Canonical Hugging Face Parquet corpus",
  "Hundred unique weight lineages at A+++, then one independent rerun",
  "Kaggle benchmark tasks only after cost and reproducibility gates",
] as const;

export const PLUGIN_HARVEST = {
  plugin_reads: "Public board, four MCP tools, signed cards. Consent first.",
  plugin_never: [
    "user chat bodies",
    "covert telemetry",
    "a 23rd axis",
    "an Article 50 compliance stamp",
  ],
  art50_is:
    "A separate documentation/triage object: does the card mention marking, training-data summary, or GPAI status? Unknown stays unknown. A breach usually depends on the deployed system, provider and use — not the weights alone.",
  art50_is_not:
    "A GSPC-M behavioural score, automatic remediation, or “this model is Article 50 compliant.”",
  publisher_path:
    "After a real signed cell: optional discussion or pull request on the exact repo, with badge, card and rerun link. No mass mail, no mass-PR.",
  regulator_path:
    "Regulators pull the public signed corpus and the unmeasured-frontier inventory. Do not send unsolicited dossiers.",
} as const;

export const HF_BADGE_SNIPPET =
  "[![CSOAI-GSPC — measurement, not certification](https://councilof.ai/api/badge?style=hf&size=md)](https://councilof.ai/gspc-verify)";

export const EMBED_SNIPPET = `<script src="https://councilof.ai/embed.js"
        data-org="Council of AI" data-brand="#059669"
        data-verify="https://councilof.ai/gspc-verify"
        data-size="md"></script>`;

export const MCP_SNIPPET = `{
  "mcpServers": {
    "gspc": {
      "url": "https://councilof.ai/mcp"
    }
  }
}`;

export const PLUGIN_SNIPPET = "grok plugin install CSOAI-ORG/councilof-ai#plugins/gspc";

export const NPM_SNIPPET = "npx -y csoai-gspc-mcp";

/** Every N-site mill uses Inference Providers. Weights stay on the Hub. */
export const HF_INFERENCE_SNIPPET = `base_url=https://router.huggingface.co/v1
# model = <hub-slug>:<provider>  e.g. Qwen/Qwen3-8B:featherless-ai
Authorization: Bearer $HF_INFERENCE_TOKEN
# GHA secrets: HF_TOKEN (Hub write) · HF_INFERENCE_TOKEN (Providers mill)
# workflows: public-root · census-delta · public-root-watcher · hf-fin-shells`;

/** GSPC Space printer — not a mill product. POST /v1/measure is 404 by design. */
export const GSPC_NODE_SNIPPET = `GET https://csoai-gspc-node.hf.space/health
writes_board: false
# POST /v1/measure is 404 by design. Do not mill.
# Never writes GET /api/gspc. A listing is not MEASURED.`;

/** Canonical mill for every N-site drop. Census is Hub API. Inference is this rail. */
export const NSITES_MILL_METHOD = {
  id: "hf-inference-rail",
  title: "Hugging Face Inference Providers",
  base_url: "https://router.huggingface.co/v1",
  model: "<hub-slug>:<provider>",
  authorization: "Bearer $HF_INFERENCE_TOKEN",
  hub_write_secret: "HF_TOKEN",
  mill_secret: "HF_INFERENCE_TOKEN",
  workflows: [
    "public-root",
    "census-delta",
    "public-root-watcher",
    "hf-fin-shells",
  ],
  never: [
    "local Ollama weight pulls",
    "ZeroGPU as the fleet batch engine",
    "laptop mill of Hub weights",
  ],
  snippet: HF_INFERENCE_SNIPPET,
} as const;

export const PUBLISHER_DISCUSSION_SNIPPET = `CSOAI published a GSPC measurement for this exact revision — a per-axis passport, not approval.

Verify: https://councilof.ai/gspc-verify
${HF_BADGE_SNIPPET}

Unknown stays unknown. A rank is never sold.`;
