/**
 * Two-speed GSPC — census everything, run only unique lineages.
 *
 * Bind, do not vendor. SCITT, IETF, OWASP, Microsoft CCF and OpenTelemetry
 * ride as attachments on a GSPC cell. They never write MEASURED. The Hugging
 * Face corpus is the public record of what was signed. Article 50 observation
 * screens a model card for transparency readiness; a breach usually depends
 * on the deployed system, provider and use — not the weights alone.
 */

import { JOINED_SPECS } from "@/data/joinedSpecs";

export type SpeedId = "static" | "dynamic";
export type AttachWrite = "measured" | "never-measured";

export type SpeedLane = {
  id: SpeedId;
  title: string;
  does: string;
  never: string;
};

export type AttachRow = {
  id: string;
  title: string;
  write: AttachWrite;
  status: "live" | "pin" | "gated" | "err" | "planned";
  href: string;
  does: string;
  never: string;
};

export type HfRecord = {
  id: string;
  href: string;
  role: string;
  status: "planted" | "next";
};

export const TWO_SPEED_RULING =
  "Statically census everything without downloading weights. Dynamically run only unique, licence-eligible, technically runnable lineages.";

export const TWO_SPEED_LANES: SpeedLane[] = [
  {
    id: "static",
    title: "Speed 0 — static census",
    does: "Hub API metadata: repo id, revision, licence tag, gated flag, files list, claimed lineage. No weight download. Every discovered subject gets one eligibility state.",
    never: "A GSPC grade. A Hub listing is DISCOVERED. Do not stamp MEASURED.",
  },
  {
    id: "dynamic",
    title: "Speed 1 — unique lineage run",
    does: "One load per weight-manifest digest. Eligible axes share the load. Quotable only after intake, practice screen and a bolted instrument.",
    never: "A run of every quant, adapter and :latest alias as if they were independent models.",
  },
];

export const REG_OBSERVE = {
  plugin_does:
    "Screen a public model or dataset card for documentation: marking mention, training-data summary, GPAI status, licence text. Unknown stays unknown.",
  plugin_never:
    "An Article 50 breach finding against weights alone. A GSPC-M score. Auto-email. A fused OWASP-plus-Microsoft-plus-GSPC grade.",
  art50_boundary:
    "An Article 50 breach usually depends on the deployed system, the provider and the use context — not the weights a Hub repo hosts.",
} as const;

export const HF_RECORD: HfRecord[] = [
  {
    id: "gspc-board",
    href: "https://huggingface.co/datasets/csoai/gspc-board",
    role: "Living board mirror. Not a grade.",
    status: "planted",
  },
  {
    id: "hub-queue",
    href: "https://huggingface.co/datasets/csoai/hub-queue",
    role: "Census / eligibility queue. DISCOVERED only.",
    status: "planted",
  },
  {
    id: "living-catalog",
    href: "https://huggingface.co/datasets/csoai/living-catalog",
    role: "Dated catalogue. Discovery, not a sweep engine.",
    status: "planted",
  },
  {
    id: "gspc-gov",
    href: "https://huggingface.co/datasets/csoai/gspc-gov",
    role: "Canonical governance bank. Never build a bank URL from an axis name.",
    status: "planted",
  },
  {
    id: "gspc-subjects",
    href: "https://huggingface.co/csoai",
    role: "Frozen cohort manifests, lineages, eligibility. Next — do not invent the repo until the census is signed.",
    status: "next",
  },
  {
    id: "gspc-results",
    href: "https://huggingface.co/csoai",
    role: "Partitioned Parquet: subject digest / axis / instrument / run. The scale record.",
    status: "next",
  },
  {
    id: "gspc-cards",
    href: "https://huggingface.co/csoai",
    role: "Compact signed cards and the correction chain.",
    status: "next",
  },
  {
    id: "gspc-evidence",
    href: "https://huggingface.co/csoai",
    role: "Evidence bundle manifests. The 3 KB card is the index, not the evidence.",
    status: "next",
  },
];

export const ATTACH_ROWS: AttachRow[] = [
  {
    id: "gspc-cell",
    title: "GSPC cell",
    write: "measured",
    status: "live",
    href: "https://councilof.ai/api/gspc",
    does: "The only MEASURED write. Subject digest × axis × instrument × n.",
    never: "A fused score from OWASP, Microsoft, SCITT or a plugin.",
  },
  {
    id: "scitt",
    title: "IETF SCITT (RFC 9943)",
    write: "never-measured",
    status: "planned",
    href: "https://councilof.ai/.well-known/scitt.json",
    does: "Register the signed statement when a transparency service exists. Receipt of registration.",
    never: "Our log. Certification. A GSPC grade.",
  },
  {
    id: "microsoft-ccf",
    title: "Microsoft SCITT / CCF",
    write: "never-measured",
    status: "gated",
    href: "https://github.com/microsoft/scitt-ccf-ledger",
    does: "Call their TS when one is stood up. Pin pyscitt. Do not vendor the tree.",
    never: "MEASURED. A Microsoft-approved stamp.",
  },
  {
    id: "owasp-crosswalk",
    title: "OWASP LLM pair-gap",
    write: "never-measured",
    status: "pin",
    href: "https://councilof.ai/east-west",
    does: "Label a GSPC axis against an OWASP LLM / agentic item as a pair-gap. Jail is the closest live behavioural overlap.",
    never: "A 23rd GSPC axis. An OWASP MCP catalogue as this product. A fused OWASP+GSPC score.",
  },
  {
    id: "plugin-read",
    title: "GSPC plugin",
    write: "never-measured",
    status: "live",
    href: "https://councilof.ai/mcp",
    does: "Read the board and verify a card while a run is happening.",
    never: "Chat harvest. A feed of new scores into the coverage index.",
  },
  {
    id: "reg-observe",
    title: "Regulatory observation",
    write: "never-measured",
    status: "planned",
    href: "https://councilof.ai/article-50",
    does: "Documentation triage on the public card. Readiness, not breach.",
    never: "An Article 50 finding against weights alone.",
  },
  {
    id: "otel",
    title: "OpenTelemetry harness spans",
    write: "never-measured",
    status: "gated",
    href: "https://councilof.ai/harness",
    does: "Spans of our workers: load, parse, cost, retry.",
    never: "Partner traces. A bank score.",
  },
  {
    id: "ailuminate",
    title: "MLCommons AILuminate",
    write: "never-measured",
    status: "pin",
    href: "https://mlcommons.org/ailuminate/",
    does: "Chat-risk benchmark as an attachment. AILuminate for chat; GSPC for the rest of the stack.",
    never: "A 23rd axis. An importer that writes MEASURED. A fused GSPC+AILuminate grade.",
  },
  {
    id: "pyrit",
    title: "Microsoft PyRIT",
    write: "never-measured",
    status: "pin",
    href: "https://github.com/Azure/PyRIT",
    does: "Adversarial conversations can feed the jail instrument’s evidence pack.",
    never: "Keyword-refusal scoring as a signed card. A Microsoft-approved GSPC grade.",
  },
  {
    id: "promptfoo",
    title: "Promptfoo red-team",
    write: "never-measured",
    status: "pin",
    href: "https://www.promptfoo.dev/",
    does: "YAML attack sets as an attachment on a bolted safety/jail run.",
    never: "llm-rubric as the verdict. Auto-generate a GSPC card from eval JSON.",
  },
];

export function joinedPins(): { name: string; status: string; kind: string; write: "never-measured" }[] {
  return JOINED_SPECS.filter((s) => s.kind !== "product").map((s) => ({
    name: s.name,
    status: s.status,
    kind: s.kind,
    write: "never-measured" as const,
  }));
}

export function attachThatWriteMeasured(): AttachRow[] {
  return ATTACH_ROWS.filter((r) => r.write === "measured");
}

export function hfPlanted(): HfRecord[] {
  return HF_RECORD.filter((r) => r.status === "planted");
}
