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

export const NSITES_FLAGS: NSiteFlag[] = [
  {
    id: "hf-badge",
    title: "Hugging Face badge",
    status: "planted",
    kind: "receipt",
    href: "https://councilof.ai/api/badge?style=hf&size=md",
    plant: "Any README or model card that may link a measurement, never a certificate.",
    note: "Pill says CSOAI-GSPC. Right-hand text is a measurement state.",
    snippet: HF_BADGE_SNIPPET,
  },
  {
    id: "embed-js",
    title: "Embed kit",
    status: "planted",
    kind: "receipt",
    href: "https://councilof.ai/embed.js",
    plant: "Partner pages that want a live count from GET /api/gspc.",
    note: "Unavailable on failure. Never says certified.",
    snippet: EMBED_SNIPPET,
  },
  {
    id: "mcp-http",
    title: "MCP HTTP door",
    status: "planted",
    kind: "receipt",
    href: "https://councilof.ai/mcp",
    plant: "Claude, Cursor, Kimi, Grok — one JSON, four tools.",
    note: "board_totals · get_axis · verify_card · list_cards. No 23rd axis.",
    snippet: MCP_SNIPPET,
  },
  {
    id: "mcp-well-known",
    title: "MCP well-known",
    status: "planted",
    kind: "registry",
    href: "https://councilof.ai/.well-known/mcp.json",
    plant: "Layer-0 discovery. Agents fetch this, they do not scrape HTML.",
    note: "Official registry id io.github.CSOAI-ORG/gspc v1.0.3.",
    snippet: "https://councilof.ai/.well-known/mcp.json",
  },
  {
    id: "mcp-official-registry",
    title: "Official MCP registry",
    status: "planted",
    kind: "registry",
    href: "https://registry.modelcontextprotocol.io",
    plant: "The one public MCP index we already occupy.",
    note: "io.github.CSOAI-ORG/gspc. Do not invent a second first-party server.",
    snippet: "io.github.CSOAI-ORG/gspc",
  },
  {
    id: "plugin-gspc",
    title: "Grok / Cursor plugin",
    status: "planted",
    kind: "receipt",
    href: "https://github.com/CSOAI-ORG/councilof-ai/tree/master/plugins/gspc",
    plant: "Hosts that install from GitHub source. Consent first. No --trust until accepted.",
    note: "Same four tools. Does not harvest chats or mint regulation scores.",
    snippet: PLUGIN_SNIPPET,
  },
  {
    id: "npm-sdk",
    title: "npm stdio SDK",
    status: "planted",
    kind: "receipt",
    href: "https://www.npmjs.com/package/csoai-gspc-mcp",
    plant: "claude mcp add gspc -- npx -y csoai-gspc-mcp",
    note: "Same four tools as HTTP /mcp.",
    snippet: NPM_SNIPPET,
  },
  {
    id: "agent-card",
    title: "A2A agent card",
    status: "planted",
    kind: "registry",
    href: "https://councilof.ai/.well-known/agent-card.json",
    plant: "A2A discovery. Task service is still planned.",
    note: "HTTP doors are not an A2A task service. MCP is not a supportedInterface.",
    snippet: "https://councilof.ai/.well-known/agent-card.json",
  },
  {
    id: "x402-well-known",
    title: "x402 price card",
    status: "planted",
    kind: "registry",
    href: "https://councilof.ai/.well-known/x402.json",
    plant: "Agents that already speak HTTP 402.",
    note: "Challenge exists. Settlement is not complete: payTo is null. Payment never buys rank.",
    snippet: "https://councilof.ai/.well-known/x402.json",
  },
  {
    id: "did-web",
    title: "did:web trust root",
    status: "planted",
    kind: "receipt",
    href: "https://csoai.org/.well-known/did.json",
    plant: "Anyone verifying a card without talking to us.",
    note: "Pin did:web:csoai.org#card-attestation-1. A freshly made key is invalid.",
    snippet: "https://csoai.org/.well-known/did.json",
  },
  {
    id: "board-api",
    title: "CSOAI-GSPC API",
    status: "planted",
    kind: "receipt",
    href: "https://councilof.ai/api/gspc",
    plant: "Every machine that needs the dated public count.",
    note: "Quote totals.public_count. 22 axis · 15 measured. Empty stays empty.",
    snippet: "https://councilof.ai/api/gspc",
  },
  {
    id: "verify-page",
    title: "Verify a card",
    status: "planted",
    kind: "receipt",
    href: "https://councilof.ai/gspc-verify",
    plant: "Humans with a PDF and no plugin.",
    note: "Browser WebCrypto. Nothing uploaded. Free forever.",
    snippet: "https://councilof.ai/gspc-verify",
  },
  {
    id: "zenodo-doi",
    title: "Methodology DOI",
    status: "planted",
    kind: "discovery",
    href: "https://doi.org/10.5281/zenodo.21991104",
    plant: "Papers, notebooks and grant packs that must cite the instrument.",
    note: "Citation snapshot. Not a mutable working board.",
    snippet: "10.5281/zenodo.21991104",
  },
  {
    id: "hf-collection",
    title: "HF collection",
    status: "planted",
    kind: "discovery",
    href: "https://huggingface.co/collections/csoai/gspc-board-verify-flywheel-queue-banks-6a92a75986947dfa9d5306b5",
    plant: "The Hub discovery surface we already occupy.",
    note: "Board · verify · flywheel · queue · banks. One collection, not one repo per model.",
    snippet:
      "https://huggingface.co/collections/csoai/gspc-board-verify-flywheel-queue-banks-6a92a75986947dfa9d5306b5",
  },
  {
    id: "hf-gspc-board",
    title: "HF board dataset",
    status: "planted",
    kind: "discovery",
    href: "https://huggingface.co/datasets/csoai/gspc-board",
    plant: "Canonical Hub mirror of CSOAI-GSPC.",
    note: "A Hub listing is not a GSPC grade.",
    snippet: "https://huggingface.co/datasets/csoai/gspc-board",
  },
  {
    id: "hf-banks",
    title: "Published GSPC banks",
    status: "planted",
    kind: "discovery",
    href: "https://huggingface.co/datasets/csoai/gspc-gov",
    plant: "Practice and reproduction banks already on the Hub.",
    note: "Governance is csoai/gspc-gov. Never build a bank URL from an axis name. Private aliases stay private.",
    snippet: "https://huggingface.co/datasets/csoai/gspc-gov",
  },
  {
    id: "hf-hub-queue",
    title: "Hub queue",
    status: "planted",
    kind: "discovery",
    href: "https://huggingface.co/datasets/csoai/hub-queue",
    plant: "Census / eligibility queue. Not a results table.",
    note: "Listing is DISCOVERED. Do not stamp MEASURED.",
    snippet: "https://huggingface.co/datasets/csoai/hub-queue",
  },
  {
    id: "hf-living-catalog",
    title: "Living catalog",
    status: "planted",
    kind: "discovery",
    href: "https://huggingface.co/datasets/csoai/living-catalog",
    plant: "Hub + Space pair for the dated catalogue.",
    note: "Discovery, not a sweep engine.",
    snippet: "https://huggingface.co/datasets/csoai/living-catalog",
  },
  {
    id: "hf-east-west",
    title: "East-West",
    status: "planted",
    kind: "discovery",
    href: "https://huggingface.co/datasets/csoai/east-west",
    plant: "Cross-regime pair-gap dataset and Space.",
    note: "One signed measurement, every regime mapped. Never a fused grade.",
    snippet: "https://huggingface.co/datasets/csoai/east-west",
  },
  {
    id: "hf-flywheel",
    title: "Flywheel Space",
    status: "planted",
    kind: "discovery",
    href: "https://huggingface.co/spaces/csoai/gspc-flywheel",
    plant: "Find a published card. Not an evaluator.",
    note: "Interactive demo quota is not the fleet batch engine.",
    snippet: "https://huggingface.co/spaces/csoai/gspc-flywheel",
  },
  {
    id: "hf-verify-space",
    title: "Verify Space",
    status: "planted",
    kind: "discovery",
    href: "https://huggingface.co/spaces/csoai/gspc-verify",
    plant: "Hub-native verify door next to the site verifier.",
    note: "Same receipt, second drop point.",
    snippet: "https://huggingface.co/spaces/csoai/gspc-verify",
  },
  {
    id: "hf-board-space",
    title: "Board Space",
    status: "planted",
    kind: "discovery",
    href: "https://huggingface.co/spaces/csoai/gspc-board",
    plant: "Hub-native CSOAI-GSPC — axes, leaderboards, published record, coverage, limitations.",
    note: "GET /api/gspc remains the feed. Planted queue is DISCOVERED. Speed 0 pagination and Card v2 lineage binding are next, not done.",
    snippet: "https://huggingface.co/spaces/csoai/gspc-board",
  },
  {
    id: "hf-regulator-findings",
    title: "Regulator-findings dataset",
    status: "planted",
    kind: "regulation",
    href: "https://huggingface.co/datasets/csoai/white-label-eu-ai-act-regulator-findings",
    plant: "Public documentation corpus. Pull, do not spam.",
    note: "Not a per-model Article 50 verdict.",
    snippet: "https://huggingface.co/datasets/csoai/white-label-eu-ai-act-regulator-findings",
  },
  {
    id: "article-50-page",
    title: "Article 50 desk",
    status: "planted",
    kind: "regulation",
    href: "https://councilof.ai/article-50",
    plant: "Transparency obligations for this site and the dated cliff.",
    note: "A GSPC model run is not an Article 50 audit.",
    snippet: "https://councilof.ai/article-50",
  },
  {
    id: "article-50-pack",
    title: "Article 50 evidence pack",
    status: "planted",
    kind: "regulation",
    href: "https://councilof.ai/packs/eu-article-50",
    plant: "Signed alternative-means pack for our own surfaces.",
    note: "Payment may buy assembly. It never buys a passing result.",
    snippet: "https://councilof.ai/packs/eu-article-50",
  },
  {
    id: "gspc-art5-bank",
    title: "art5 bank",
    status: "planted",
    kind: "regulation",
    href: "https://huggingface.co/datasets/csoai/gspc-art5",
    plant: "Behavioural bank already on the Hub. Not a legal opinion.",
    note: "NCII/CSAM corpus is never handled by CSOAI.",
    snippet: "https://huggingface.co/datasets/csoai/gspc-art5",
  },
  {
    id: "kaggle-benchmark",
    title: "Kaggle Community Benchmark",
    status: "next",
    kind: "compute",
    href: "https://www.kaggle.com/docs/benchmarks",
    plant: "Encode each GSPC axis as a task after the 100-lineage A+++ gate.",
    note: "Supported model set is platform-defined. One organisational account. No shared logins.",
  },
  {
    id: "kaggle-notebook",
    title: "Kaggle reference notebook",
    status: "next",
    kind: "compute",
    href: "https://www.kaggle.com/docs/notebooks",
    plant: "One public “rerun this card” notebook. Not a disguised cluster.",
    note: "Kaggle prohibits multiple active accounts and shared operation.",
  },
  {
    id: "modelscope-method",
    title: "ModelScope methodology mirror",
    status: "next",
    kind: "discovery",
    href: "https://www.modelscope.cn",
    plant: "Native mirror of methods, datasets and a demo — not a second board.",
    note: "Free xGPU is demo capacity, not a fleet SLA.",
  },
  {
    id: "zenodo-cohort",
    title: "Zenodo cohort snapshot",
    status: "next",
    kind: "discovery",
    href: "https://doi.org/10.5281/zenodo.21991104",
    plant: "Dated eligibility manifest + methods once the census is signed.",
    note: "Methodology DOI is already planted. The 2,200-subject snapshot is not.",
  },
  {
    id: "ghcr-harness",
    title: "GHCR harness pin",
    status: "next",
    kind: "compute",
    href: "https://github.com/CSOAI-ORG/councilof-ai",
    plant: "Signed container digest for strangers who rerun a card.",
    note: "Do not attach self-hosted GPU runners to public pull requests.",
  },
  {
    id: "publisher-discussion",
    title: "Publisher discussion after a signed cell",
    status: "next",
    kind: "discovery",
    href: "https://huggingface.co/csoai",
    plant: "One optional thread on the exact model revision that was measured.",
    note: "Badge + verify + rerun. Label Council-run vs independently reproduced. No mass-PR.",
    snippet: PUBLISHER_DISCUSSION_SNIPPET,
  },
  {
    id: "openml-later",
    title: "OpenML run archive",
    status: "next",
    kind: "discovery",
    href: "https://docs.openml.org/benchmark/",
    plant: "Classical / tabular GSPC-D later. Not the generative-LLM execution layer.",
    note: "Permissionless archive, different community.",
  },
  {
    id: "a2a-task-service",
    title: "A2A task service",
    status: "next",
    kind: "registry",
    href: "https://councilof.ai/.well-known/agent-card.json",
    plant: "Real message/task operations once the card is honest.",
    note: "Discovery card is planted. Task service is planned. Protocol version must be Major.Minor.",
  },
  {
    id: "mass-upload",
    title: "One CSOAI repo per external model",
    status: "do-not",
    kind: "discovery",
    href: "https://huggingface.co/docs/hub/storage-limits",
    plant: "Never. Publish the canonical record in the GSPC corpus.",
    note: "Duplicate repositories manufacture footprint, not coverage.",
  },
  {
    id: "share-quotas",
    title: "Shared or multiplied free accounts",
    status: "do-not",
    kind: "compute",
    href: "https://www.kaggle.com/terms",
    plant: "Never. One organisational identity per platform.",
    note: "Kaggle and Colab prohibit multiple active accounts and shared operation.",
  },
  {
    id: "plugin-harvest",
    title: "Plugin as a telemetry collector",
    status: "do-not",
    kind: "receipt",
    href: "https://github.com/CSOAI-ORG/councilof-ai/tree/master/plugins/gspc",
    plant: "Never. The plugin reads the public board.",
    note: "No chat bodies, no silent regulation scoring, no 23rd axis.",
  },
  {
    id: "auto-email",
    title: "Auto-email every model author",
    status: "do-not",
    kind: "regulation",
    href: "https://councilof.ai/article-50",
    plant: "Never. Optional discussion on the exact repo after a signed cell.",
    note: "Council measures and publishes. It does not remediate other people’s models.",
  },
  {
    id: "art50-stamp",
    title: "Article 50 compliant stamp",
    status: "do-not",
    kind: "regulation",
    href: "https://councilof.ai/article-50",
    plant: "Never. Documentation triage may record unknown.",
    note: "A behavioural run does not establish EU transparency marking.",
  },
  {
    id: "full-sweep",
    title: "Launch the 2,200-model sweep now",
    status: "do-not",
    kind: "compute",
    href: "https://councilof.ai/api/gspc",
    plant: "Never before card v2, census, sandbox, signer and one external rerun.",
    note: "Otherwise the estate manufactures thousands of signed statements that still do not tell a stranger what was measured.",
  },
  {
    id: "metamask-not-signer",
    title: "MetaMask is not the signer",
    status: "planted",
    kind: "receipt",
    href: "https://councilof.ai/gspc-greenfield-playbook.md",
    plant: "Wallet copy. x402 payTo is not BOARD_SIGN_KEY. Treasury is not the signer.",
    note: "MetaMask is not connected as the mill signer. BOARD_SIGN_KEY stays on Pages / GHA OIDC.",
    snippet: "MetaMask is not connected. Treasury is not the signer. Payment does not mint MEASURED.",
  },
  {
    id: "hf-inference-rail",
    title: "HF Inference Providers mill",
    status: "planted",
    kind: "compute",
    href: "https://router.huggingface.co/v1/models",
    plant: "Every N-site mill: router.huggingface.co/v1, not local weight pulls. GHA secrets.HF_TOKEN + secrets.HF_INFERENCE_TOKEN.",
    note: "31/40 FLEET-B slugs have a live provider. Token needs Inference Providers scope. Listing is not MEASURED. ZeroGPU is still not the fleet SLA.",
    snippet: HF_INFERENCE_SNIPPET,
  },
  {
    id: "gspc-hf-node",
    title: "GSPC Hugging Face inference node",
    status: "planted",
    kind: "compute",
    href: "https://csoai-gspc-node.hf.space/v1/models",
    plant: "Instrument Space printer. writes_board false. POST /v1/measure is 404 by design. Do not mill.",
    note: "Not a mill product. Does not write GET /api/gspc. Fail-closed: 404.",
    snippet: GSPC_NODE_SNIPPET,
  },
  {
    id: "zerogpu-fleet",
    title: "ZeroGPU as the fleet batch engine",
    status: "do-not",
    kind: "compute",
    href: "https://huggingface.co/docs/hub/spaces-gpus",
    plant: "Never. Interactive demos only. Batch mill is Inference Providers + Jobs/paid workers.",
    note: "Spaces ZeroGPU is not an SLA for 990k responses.",
  },
  {
    id: "queue-as-measured",
    title: "Stamp hub-queue MEASURED",
    status: "do-not",
    kind: "discovery",
    href: "https://huggingface.co/datasets/csoai/hub-queue",
    plant: "Never. A listing is DISCOVERED until a signed cell exists.",
    note: "Two labelled numbers stay labelled. Empty stays empty.",
  },
  {
    id: "scored-millions",
    title: "Claim we scored two million models",
    status: "do-not",
    kind: "discovery",
    href: "https://huggingface.co/datasets/csoai/hub-queue",
    plant: "Never. Millions are DISCOVERED by census. MEASURED is unique lineages.",
    note: "A Hub listing is not a GSPC grade. Permissionless after 100/100 A+++ still does not invent that sentence.",
  },
];

export function flagsByStatus(status: FlagStatus): NSiteFlag[] {
  return NSITES_FLAGS.filter((f) => f.status === status);
}

export function plantedSnippetCount(): number {
  return NSITES_FLAGS.filter((f) => f.status === "planted" && f.snippet).length;
}
