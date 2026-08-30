/**
 * Millions of models, two speeds, one permissionless gate.
 *
 * Hugging Face lists more than two million model repos. There is no honest
 * shortcut to millions of full-n inferences. The way to cover the Hub is a
 * Speed 0 census (metadata + LFS sha256, no weight download) plus Speed 1
 * runs of unique licence-eligible lineages. 100/100 A+++ is the quality
 * bar that unlocks permissionless flags — not a sold rank, not “we scored
 * two million models.”
 *
 * Live probes 2026-08-30: GET /api/models paginates with a Link cursor
 * (anonymous ratelimit ~500 / 300s). GET /api/models/{id}?blobs=true
 * returns siblings[].lfs.sha256 without downloading weights (gpt2 and
 * Qwen/Qwen3.8-27B confirmed). Planted hub-queue is 2,410 named ids,
 * status_all UNMEASURED, as_of 2026-08-29. Living-catalog holds 154
 * discovery items. Do not invent a live Hub total: X-Total-Count is
 * advertised but not returned on the list endpoint.
 */

export type Eligibility =
  | "ELIGIBLE"
  | "DUPLICATE-DIGEST"
  | "GATED"
  | "LICENCE-BLOCKED"
  | "UNSUPPORTED"
  | "OVER-BUDGET"
  | "UNSAFE-ARTEFACT"
  | "UNRESOLVABLE"
  | "WITHDRAWN";

export type ListingState = "DISCOVERED";

export type GateCriterion = {
  id: string;
  title: string;
  must: string;
};

export type CensusStep = {
  id: string;
  title: string;
  does: string;
};

export type UnlockLane = {
  id: string;
  title: string;
  does: string;
};

export const HUNDRED_RULING =
  "Cover millions by census. Unlock permissionless flags at 100 unique lineages done 100/100 A+++.";

export const MILLIONS_PUBLIC_CLAIM =
  "N discovered artefacts in a dated Hub walk; X licence-eligible; Y unique immutable weight lineages; Z measured across M GSPC axes.";

export const MILLIONS_NEVER_CLAIM =
  "We scored two million models. We measured all Hugging Face. Hub-queue is MEASURED.";

export const PLANTED_QUEUE = {
  href: "https://huggingface.co/datasets/csoai/hub-queue",
  kind: "csoai.hub-queue/0.1",
  n: 2410,
  status_all: "UNMEASURED",
  n_measured: 0,
  as_of: "2026-08-29T09:40:48Z",
  filter: "huggingface Hub list_models(sort=downloads, limit=2410)",
} as const;

export const PLANTED_CATALOG = {
  href: "https://huggingface.co/datasets/csoai/living-catalog",
  schema: "csoai.living-catalog/1",
  items: 154,
} as const;

export const HUB_LISTING = {
  list: "GET https://huggingface.co/api/models — Link-cursor pagination; huggingface_hub.list_models() is the same door.",
  digest:
    "GET https://huggingface.co/api/models/{id}?blobs=true — siblings[].lfs.sha256 without a weight download. Equivalent: model_info(id, files_metadata=True).",
  rate: "Anonymous Hub API ~500 requests / 300s. Listing millions of ids is hours. Digesting millions of repos is weeks. Inferencing millions is not the path.",
  mcp_limit:
    "HF MCP search max 1,000; trending ls max 20. Those are discovery. They are not the census rail.",
  no_total:
    "Do not invent a live Hub integer. Quote “more than two million model repos” until a signed census writes a dated count.",
} as const;

export const ELIGIBILITY_STATES: { id: Eligibility; means: string }[] = [
  { id: "ELIGIBLE", means: "Licence-ok, ungated or authorised, technically runnable, unique digest." },
  { id: "DUPLICATE-DIGEST", means: "Same weight-manifest digest as an earlier subject. Count once." },
  { id: "GATED", means: "Host requires access we do not have. Stay DISCOVERED." },
  { id: "LICENCE-BLOCKED", means: "Licence forbids this measurement or republication." },
  { id: "UNSUPPORTED", means: "Architecture or artefact type we cannot load honestly." },
  { id: "OVER-BUDGET", means: "Runnable but outside the signed cost envelope for this batch." },
  { id: "UNSAFE-ARTEFACT", means: "Refused before load. Safety of the file, not a jail score." },
  { id: "UNRESOLVABLE", means: "Missing blobs, broken index, or Hub 404 at the pinned revision." },
  { id: "WITHDRAWN", means: "Publisher removed or replaced the revision after we listed it." },
];

export const CENSUS_STEPS: CensusStep[] = [
  {
    id: "walk-ids",
    title: "Walk every repo id",
    does: "Paginate GET /api/models. Record id, revision, tags, gated, licence, pipeline_tag, downloads. No weights.",
  },
  {
    id: "priority-digest",
    title: "Priority-queue LFS digests",
    does: "blobs=true first for ungated text-generation and high-download lineages. Fold shard sha256 into one weight-manifest digest.",
  },
  {
    id: "eligibility",
    title: "One eligibility state each",
    does: "Assign ELIGIBLE or a named block. A listing stays DISCOVERED. Never stamp MEASURED from metadata.",
  },
  {
    id: "sign-census",
    title: "Sign the dated walk",
    does: "Publish counts + manifests to the Hugging Face corpus after Card v2. Do not invent csoai/gspc-subjects until that census is signed.",
  },
];

export const HUNDRED_TARGET = 100;

export const HUNDRED_ENVELOPE = {
  lineages: 100,
  measured_axes: 15,
  n: 30,
  responses: 45_000,
  tokens_approx: 29_250_000,
  assumption: "650 tokens per response — planning envelope, not a quotation",
} as const;

export const A_PLUS_PLUS_PLUS: GateCriterion[] = [
  {
    id: "unique-digest",
    title: "Unique weight lineage",
    must: "One subject per weight-manifest digest. Not a Hub repo count. Not :latest. Not a quant mirror.",
  },
  {
    id: "licence-runnable",
    title: "Licence-eligible and runnable",
    must: "Eligibility is ELIGIBLE. Gated, blocked or unsupported rows do not fill the 100.",
  },
  {
    id: "card-v2",
    title: "Card v2",
    must: "Immutable subject binding. Instrument, run and evidence manifests exist.",
  },
  {
    id: "evidence",
    title: "Evidence available",
    must: "The 3 KB card is the index. A stranger can fetch the bundle.",
  },
  {
    id: "verify",
    title: "Verify pass",
    must: "Browser WebCrypto / verify_card accepts the card against the planted did:web pin.",
  },
  {
    id: "rerun",
    title: "Independent rerun sample",
    must: "At least one second-provider or external rerun on the same digest. Label Council-run vs reproduced.",
  },
  {
    id: "axes",
    title: "Honest axis set",
    must: "The 15 measured instruments where they exist. Remaining slots stay UNMEASURED. Jail is the MEASURED floor, not an arena door.",
  },
];

export const PERMISSIONLESS_UNLOCKS: UnlockLane[] = [
  {
    id: "flags",
    title: "Plant the remaining flags",
    does: "Same receipts on Kaggle, ModelScope, Zenodo, GHCR, A2A — no second product meeting.",
  },
  {
    id: "census-refresh",
    title: "Refresh the Hub census",
    does: "Walk new and changed repos. Keep listings DISCOVERED. Dedup by digest.",
  },
  {
    id: "publisher",
    title: "Publisher discussion",
    does: "Optional thread on the exact measured revision. Badge + verify + rerun. No mass-PR.",
  },
  {
    id: "next-batch",
    title: "Next unique-lineage batches",
    does: "Measure the next ELIGIBLE digests in signed envelopes. Coverage grows by lineage, not by repo spray.",
  },
];

export const PERMISSIONLESS_NEVER = [
  "A 2-million-model inference sweep",
  "Stamping hub-queue or living-catalog MEASURED",
  "Mass mail or mass-PR to Hub authors",
  "Shared Kaggle / Colab / ZeroGPU quotas",
  "A fused SOV grade or a sold rank",
  "Claiming every declared axis is measured, or “all Hugging Face measured”",
] as const;

export function hundredResponses(): number {
  return HUNDRED_ENVELOPE.lineages * HUNDRED_ENVELOPE.measured_axes * HUNDRED_ENVELOPE.n;
}

export function gateComplete(done: number): boolean {
  return done >= HUNDRED_TARGET;
}

export function publicCensusLine(input: {
  discovered: number;
  eligible: number;
  unique: number;
  measured: number;
  axes: number;
}): string {
  return `${input.discovered} discovered artefacts in a dated Hub walk; ${input.eligible} licence-eligible; ${input.unique} unique immutable weight lineages; ${input.measured} measured across ${input.axes} GSPC axes.`;
}
