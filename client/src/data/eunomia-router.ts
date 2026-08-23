/**
 * Eunomia Router — governance instrument routing table (not LLM proxy routing).
 *
 * {STACK_STATS.mcpServers} MCP servers catalogued. {HIVE.length} hive frameworks.
 * Not "compliance tools" — routing table entries.
 */
import { HIVE, type HiveFramework } from "@/data/hive-frameworks";
import { STACK_STATS } from "@/lib/stackHonesty";
import { AXES } from "@/lib/gspcAxes";
import mcpRegistry from "@/data/mcpRegistry.json";
import { BOND_OPENINGS } from "@/data/bond-venturi";

export type RouterLayer = "framework" | "regulation" | "law" | "benchmark" | "compute";

export type RouterCapability =
  | "stream"
  | "hitl"
  | "signed"
  | "grounded"
  | "live"
  | "offline-verify"
  | "consent"
  | "attest"
  | "bill";

export type RouterEntry = {
  id: string;
  slug: string;
  name: string;
  layer: RouterLayer;
  /** eunomia://compliance/iso42001 — the civilization URI, not the repo slug */
  eunomiaUri: string;
  provider: string;
  scope: string;
  description: string;
  blurb: string;
  capabilities: RouterCapability[];
  pricing: "free" | "payg" | "artefact";
  endpoint?: string;
  href?: string;
  mcpSlug?: string;
  repoUrl?: string;
  runPrompt?: string;
  featured?: boolean;
  tags: string[];
};

export const LAYER_META: Record<
  RouterLayer,
  { label: string; headline: string; eunomiaPrefix: string }
> = {
  framework: {
    label: "Framework",
    headline: "Identity, safety probes, consensus — route before execution",
    eunomiaPrefix: "eunomia://safety",
  },
  regulation: {
    label: "Regulation",
    headline: `${HIVE.length}-framework hive crosswalk — regulation IS the router table`,
    eunomiaPrefix: "eunomia://compliance",
  },
  law: {
    label: "Law",
    headline: "Evidence routing — C2PA chains, not post-hoc PDFs",
    eunomiaPrefix: "eunomia://law",
  },
  benchmark: {
    label: "Benchmark",
    headline: "Measured axes — models routed through reality, not scorecards",
    eunomiaPrefix: "eunomia://benchmark",
  },
  compute: {
    label: "Compute",
    headline: "Trust-based pricing — per verified execution, not per token",
    eunomiaPrefix: "eunomia://compute",
  },
};

export const CAPABILITY_LABELS: Record<RouterCapability, string> = {
  stream: "SSE stream",
  hitl: "HITL consent",
  signed: "Signed cell",
  grounded: "Grounded answer",
  live: "Live rail",
  "offline-verify": "Offline verify",
  consent: "Consent checkpoint",
  attest: "C2PA attestation",
  bill: "PAYG billing",
};

/** The five kernel routers — already shipping, now named. */
export const KERNEL_ROUTERS: RouterEntry[] = [
  {
    id: "identity.did-verify",
    slug: "did-verify",
    name: "Agent identity & trust",
    layer: "framework",
    eunomiaUri: "eunomia://identity/did-verify",
    provider: "CSOAI-ORG",
    scope: "DIDs · VCs · reputation · agent passports",
    description:
      "Agent Identity MCP — DIDs, verifiable credentials, reputation scoring. Routes which agent is allowed to call which framework.",
    blurb: "Identity routing — not a tool, a gate.",
    capabilities: ["signed", "offline-verify", "grounded"],
    pricing: "free",
    mcpSlug: "agent-identity-trust-mcp",
    repoUrl: "https://github.com/CSOAI-ORG/agent-identity-trust-mcp",
    runPrompt: "How does agent identity routing work — DIDs, reputation, and which frameworks an agent may call?",
    featured: true,
    tags: ["identity", "did", "a2a", "trust"],
  },
  {
    id: "safety.care-ethics",
    slug: "care-ethics",
    name: "Care membrane",
    layer: "framework",
    eunomiaUri: "eunomia://safety/care-ethics",
    provider: "CSOAI-ORG",
    scope: "16-probe care ethics harness",
    description:
      "AI Safety evaluation: care scoring, threat detection, burnout analysis, relationship prediction. Routes whether a request passes relational ethics before execution.",
    blurb: "Safety routing — probe before you proceed.",
    capabilities: ["live", "grounded", "signed"],
    pricing: "free",
    mcpSlug: "care-membrane-mcp",
    repoUrl: "https://github.com/CSOAI-ORG/care-membrane-mcp",
    runPrompt: "What does the care membrane probe check before a request is routed to execution?",
    featured: true,
    tags: ["safety", "care", "ethics", "probe"],
  },
  {
    id: "consensus.bft-vote",
    slug: "bft-vote",
    name: "BFT progress council",
    layer: "framework",
    eunomiaUri: "eunomia://consensus/bft-vote",
    provider: "CSOAI-ORG",
    scope: "5-voter Byzantine council",
    description:
      "Progress Council MCP — 5-voter council halts agentic loops when no real progress is happening. Consensus routing — which framework decision survives adversarial vote.",
    blurb: "Consensus routing — stop infinite spins.",
    capabilities: ["stream", "hitl", "live"],
    pricing: "free",
    mcpSlug: "bft-progress-council-mcp",
    repoUrl: "https://github.com/CSOAI-ORG/bft-progress-council-mcp",
    runPrompt: "How does the BFT progress council decide when to halt an agentic loop?",
    featured: true,
    tags: ["consensus", "bft", "council", "a2a"],
  },
  {
    id: "compliance.iso42001",
    slug: "iso-42001",
    name: "ISO 42001 AIMS",
    layer: "regulation",
    eunomiaUri: "eunomia://compliance/iso42001",
    provider: "CSOAI-ORG",
    scope: "AIMS assessment · lifecycle governance",
    description:
      "ISO 42001 AI Management System compliance MCP — AIMS assessment, risk management, AI lifecycle governance, certification readiness.",
    blurb: "Regulation-as-routing — intercept and route through the correct compliance pathway.",
    capabilities: ["grounded", "signed", "stream"],
    pricing: "payg",
    mcpSlug: "iso-42001-ai-mcp",
    repoUrl: "https://github.com/CSOAI-ORG/iso-42001-ai-mcp",
    href: "/frameworks/iso-42001",
    runPrompt: "Route an AI system assessment through ISO 42001 AIMS — what is checked at each stage?",
    featured: true,
    tags: ["iso-42001", "aims", "compliance", "certification"],
  },
  {
    id: "law.provenance",
    slug: "provenance",
    name: "Proof of AI",
    layer: "law",
    eunomiaUri: "eunomia://law/provenance",
    provider: "CSOAI-ORG",
    scope: "C2PA · media forensics · deepfake detection",
    description:
      "AI content verification & deepfake detection — media forensics, synthetic media detection, C2PA-compliant provenance chains. Evidence routing for court-admissible attestation.",
    blurb: "Law executed through the same pipe as compute.",
    capabilities: ["attest", "signed", "offline-verify"],
    pricing: "free",
    mcpSlug: "proofof-ai-mcp",
    repoUrl: "https://github.com/CSOAI-ORG/proofof-ai-mcp",
    runPrompt: "How does a C2PA provenance chain prove an AI decision was compliant?",
    featured: true,
    tags: ["c2pa", "provenance", "law", "evidence"],
  },
];

export const COMPUTE_ROUTERS: RouterEntry[] = [
  {
    id: "compute.local-ollama",
    slug: "local-ollama",
    name: "Local Ollama (DIY)",
    layer: "compute",
    eunomiaUri: "eunomia://compute/local-ollama",
    provider: "MEOK",
    scope: "Hot/warm tier · your hardware",
    description:
      "Run open-source models on your own PC via Ollama. Zero inference cost — Eunomia still routes through identity, care-ethics, and attestation layers. Data never leaves your machine unless you opt in.",
    blurb: "DIY compute — OpenRouter cannot do this. We wrap your local model in governance routing.",
    capabilities: ["signed", "offline-verify", "consent"],
    pricing: "free",
    endpoint: "http://localhost:11434/v1",
    href: "/payg",
    runPrompt: "How do I connect a local Ollama model to the Eunomia router while keeping Layer-0 attestation?",
    featured: true,
    tags: ["ollama", "local", "diy", "offline", "self-hosted"],
  },
  {
    id: "compute.runpod-hosted",
    slug: "runpod-hosted",
    name: "RunPod hosted OSS",
    layer: "compute",
    eunomiaUri: "eunomia://compute/runpod-hosted",
    provider: "MEOK",
    scope: "GPU pods · AG-UI wire · arena",
    description:
      "Rent open-source models on RunPod without the ops pain — we provision the pod, wire AG-UI SSE, and route through compliance. Commission on verified execution, not raw tokens.",
    blurb: "Hosted OSS — we take out the pain of running Llama, Qwen, Gemma yourself.",
    capabilities: ["stream", "hitl", "signed", "bill"],
    pricing: "payg",
    endpoint: "POST /api/agui/session",
    href: "/payg",
    runPrompt: "What does the RunPod-hosted open-source route include — model, governance probes, and attestation?",
    featured: true,
    tags: ["runpod", "hosted", "gpu", "oss", "agentic"],
  },
  {
    id: "compute.payg",
    slug: "payg",
    name: "PAYG agent rail",
    layer: "compute",
    eunomiaUri: "eunomia://compute/payg",
    provider: "Council",
    scope: "100 free calls/day · signed cards",
    description:
      "Pay-per-verified-execution. One key across every published instrument. Every call returns a 3KB Ed25519-signed, hash-chained measurement card.",
    blurb: "Trust-based pricing — not per token, per verified call.",
    capabilities: ["signed", "bill", "stream"],
    pricing: "payg",
    endpoint: "POST /api/assess",
    href: "/payg",
    featured: true,
    tags: ["payg", "billing", "usdc", "stripe"],
  },
  {
    id: "compute.gspc-read",
    slug: "gspc-read",
    name: "GSPC board read",
    layer: "compute",
    eunomiaUri: "eunomia://compute/gspc-read",
    provider: "Layer-0",
    scope: "13 GSPC axes · live board",
    description: "Read the living GSPC board from GET /api/gspc. Returns accuracy, n, leader, Wilson interval per axis.",
    blurb: "Free Layer-0 read — empty cells stay empty.",
    capabilities: ["live", "grounded", "signed"],
    pricing: "free",
    endpoint: "GET /api/gspc",
    runPrompt: "Query the governance axis on the live GSPC rail and show what is published.",
    featured: true,
    tags: ["gspc", "board", "measurement"],
  },
];

const CORPUS_REGULATIONS: { id: string; label: string; provisions: number; jurisdiction: string }[] = [
  { id: "EU-AI-ACT", label: "EU AI Act (Regulation (EU) 2024/1689)", provisions: 113, jurisdiction: "EU" },
  { id: "EU-CRA", label: "EU Cyber Resilience Act", provisions: 71, jurisdiction: "EU" },
  { id: "EU-DORA", label: "DORA (Regulation (EU) 2022/2554)", provisions: 68, jurisdiction: "EU" },
  { id: "EU-NIS2", label: "NIS2 Directive", provisions: 48, jurisdiction: "EU" },
  { id: "UK-GDPR", label: "UK GDPR", provisions: 99, jurisdiction: "UK" },
];

function hiveToRouter(h: HiveFramework): RouterEntry {
  const path = h.slug.replace(/-/g, "");
  return {
    id: `regulation.${h.slug}`,
    slug: h.slug,
    name: h.name,
    layer: "regulation",
    eunomiaUri: `eunomia://compliance/${path}`,
    provider: h.authority,
    scope: `${h.status} · ${h.effective}`,
    description: h.summary,
    blurb: h.whoMustComply.slice(0, 2).join("; "),
    capabilities: ["grounded", "signed"],
    pricing: "free",
    href: `/frameworks/${h.slug}`,
    mcpSlug: h.mcp[0],
    runPrompt: `Which obligations under ${h.name} apply to a high-risk AI system? Cite only published material.`,
    tags: [...h.sectors.slice(0, 3).map((s) => s.toLowerCase()), h.status.toLowerCase(), "crosswalk"],
  };
}

function axisToRouter(axis: (typeof AXES)[0]): RouterEntry {
  return {
    id: `benchmark.${axis.axis}`,
    slug: axis.axis,
    name: `${axis.bench} — ${axis.axis}`,
    layer: "benchmark",
    eunomiaUri: `eunomia://benchmark/${axis.axis}`,
    provider: "GSPC",
    scope: `${axis.instrument} · n=${axis.n}`,
    description: `${axis.task}. Status: ${axis.status}. ${axis.note ?? ""}`.trim(),
    blurb: axis.status === "MEASURED" ? "Measured on frozen bank — deterministic grader." : "Unmeasured — honestly empty.",
    capabilities: ["live", "signed", "grounded"],
    pricing: "free",
    endpoint: "GET /api/gspc",
    href: "/gspc-scoreboard",
    runPrompt: `What is published on the GSPC ${axis.axis} axis — accuracy, n, and separation?`,
    featured: axis.axis === "governance" || axis.axis === "safety",
    tags: [axis.bench.toLowerCase(), axis.axis, axis.status.toLowerCase()],
  };
}

type McpServer = {
  slug: string;
  name: string;
  description: string;
  url: string;
  category: string;
  frameworks: string[];
};

function mcpSlugToEunomia(slug: string, category: string): string {
  const base = slug.replace(/-mcp$/, "").replace(/-/g, "");
  if (category.includes("Safety")) return `eunomia://safety/${base}`;
  if (category.includes("Compliance")) return `eunomia://compliance/${base}`;
  if (category.includes("Agent")) return `eunomia://identity/${base}`;
  if (category.includes("Payment")) return `eunomia://compute/${base}`;
  return `eunomia://route/${base}`;
}

function mcpToRouter(s: McpServer): RouterEntry {
  const layer: RouterLayer = s.category.includes("Compliance")
    ? "regulation"
    : s.category.includes("Safety")
      ? "framework"
      : s.category.includes("Agent")
        ? "framework"
        : s.category.includes("Payment")
          ? "compute"
          : "framework";
  return {
    id: `mcp.${s.slug}`,
    slug: s.slug,
    name: s.name,
    layer,
    eunomiaUri: mcpSlugToEunomia(s.slug, s.category),
    provider: "CSOAI-ORG",
    scope: s.category,
    description: s.description,
    blurb: s.frameworks.length ? `Crosswalk: ${s.frameworks.join(", ")}` : "Routing table entry",
    capabilities: ["stream", "signed"],
    pricing: "payg",
    mcpSlug: s.slug,
    repoUrl: s.url,
    href: `/mcp/${s.slug}`,
    tags: [...s.frameworks.map((f) => f.toLowerCase()), s.category.toLowerCase().split(" ")[0]],
  };
}

export const REGULATION_ROUTERS: RouterEntry[] = [
  ...HIVE.map(hiveToRouter),
  ...CORPUS_REGULATIONS.map((c) => ({
    id: `corpus.${c.id}`,
    slug: c.id.toLowerCase().replace(/_/g, "-"),
    name: c.label,
    layer: "regulation" as const,
    eunomiaUri: `eunomia://compliance/${c.id.toLowerCase().replace(/_/g, "")}`,
    provider: c.jurisdiction,
    scope: `${c.provisions} provisions · corpus-watch`,
    description: `Live statute hash watch — ${c.label}. Drift flagged when provision text changes.`,
    blurb: "Regulation router — corpus drift watcher",
    capabilities: ["live", "signed", "grounded"] as RouterCapability[],
    pricing: "free" as const,
    endpoint: "GET /api/corpus-watch/status",
    href: "/status/corpus-watch",
    tags: [c.jurisdiction.toLowerCase(), "corpus-watch", "drift"],
  })),
];

export const BENCHMARK_ROUTERS: RouterEntry[] = AXES.map(axisToRouter);

export const MCP_ROUTERS: RouterEntry[] = ((mcpRegistry.servers as McpServer[]) || []).map(mcpToRouter);

export const FINANCE_ROUTERS: RouterEntry[] = BOND_OPENINGS.map((o) => ({
  id: `finance.${o.slug}`,
  slug: o.slug,
  name: o.title,
  layer: "compute",
  eunomiaUri: o.eunomiaUri,
  provider: "Eunomia Finance",
  scope: "Bond venturi · COBOL → A2A",
  description: o.solution,
  blurb: o.revenue,
  capabilities: ["signed", "attest", "bill", "offline-verify"],
  pricing: "payg",
  href: o.href,
  mcpSlug: o.mcpSlugs[0],
  featured: o.id === "opening-1" || o.id === "opening-2",
  tags: ["bond", "finance", "cobol", "a2a", "settlement"],
}));

export const ROUTER_STATS = {
  mcpServers: STACK_STATS.mcpServers,
  hiveFrameworks: STACK_STATS.hiveFrameworks,
  mcpFrameworkTags: STACK_STATS.mcpFrameworkTags,
  layers: STACK_STATS.routerLayers,
  mcpRegistryCapturedAt: STACK_STATS.mcpRegistryCapturedAt,
};

export function allRouters(): RouterEntry[] {
  const seen = new Set<string>();
  const out: RouterEntry[] = [];
  const add = (r: RouterEntry) => {
    if (seen.has(r.id)) return;
    seen.add(r.id);
    out.push(r);
  };
  KERNEL_ROUTERS.forEach(add);
  COMPUTE_ROUTERS.forEach(add);
  FINANCE_ROUTERS.forEach(add);
  REGULATION_ROUTERS.forEach(add);
  BENCHMARK_ROUTERS.forEach(add);
  MCP_ROUTERS.forEach(add);
  return out;
}

export function findRouter(layer: string, slug: string): RouterEntry | undefined {
  return allRouters().find((r) => r.layer === layer && r.slug === slug);
}

export function featuredRouters(): RouterEntry[] {
  return allRouters().filter((r) => r.featured);
}

export type SortId = "featured" | "name" | "layer";

export const SORT_OPTIONS: { id: SortId; label: string }[] = [
  { id: "featured", label: "Featured" },
  { id: "name", label: "Name A–Z" },
  { id: "layer", label: "Layer" },
];

const LAYER_ORDER: Record<RouterLayer, number> = {
  framework: 0,
  regulation: 1,
  law: 2,
  benchmark: 3,
  compute: 4,
};

export function filterRouters(
  items: RouterEntry[],
  opts: {
    q: string;
    layer: RouterLayer | "all";
    capability: RouterCapability | "all";
  },
): RouterEntry[] {
  const q = opts.q.trim().toLowerCase();
  return items.filter((item) => {
    if (opts.layer !== "all" && item.layer !== opts.layer) return false;
    if (opts.capability !== "all" && !item.capabilities.includes(opts.capability)) return false;
    if (!q) return true;
    const hay = [
      item.name,
      item.slug,
      item.eunomiaUri,
      item.description,
      item.blurb,
      item.scope,
      ...item.tags,
    ]
      .join(" ")
      .toLowerCase();
    return hay.includes(q);
  });
}

export function sortRouters(items: RouterEntry[], sort: SortId): RouterEntry[] {
  const copy = [...items];
  if (sort === "featured") {
    return copy.sort((a, b) => Number(b.featured) - Number(a.featured) || a.name.localeCompare(b.name));
  }
  if (sort === "layer") {
    return copy.sort(
      (a, b) => LAYER_ORDER[a.layer] - LAYER_ORDER[b.layer] || a.name.localeCompare(b.name),
    );
  }
  return copy.sort((a, b) => a.name.localeCompare(b.name));
}

/** Example composite route from the Eunomia kernel spec */
export const EUNOMIA_EXAMPLE_ROUTE =
  "eunomia://muckaway.ai/uk-haulage/eu-ai-act-level-3/care-ethics-pass";
