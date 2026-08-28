"use client";

import { useState } from "react";
import {
  Shield,
  Package,
  Terminal,
  Copy,
  Check,
  ExternalLink,
  Code,
  Layers,
  Cpu,
  Lock,
  Download,
  CheckCircle2,
  FileCode,
  Zap,
  Activity,
  Database,
  Coins,
  Globe,
  Radio,
  FileCheck2,
  Scale
} from "lucide-react";

interface ProductItem {
  id: string;
  name: string;
  category: "Products" | "Datasets" | "RWA Assets" | "Tooling & SDKs" | "Interop Chains";
  status: "LIVE" | "MEASURED" | "DECLARED SLOT" | "SIGNED";
  href: string;
  description: string;
  meta: string;
  badge: string;
  actionText?: string;
  copyableCmd?: string;
}

const LIVING_CATALOG: ProductItem[] = [
  // Products & Endpoints
  {
    id: "prod-1",
    name: "ClaimGuard",
    category: "Products",
    status: "LIVE",
    href: "/verify",
    description: "Deterministic claim-vs-signed-artifact checking engine against frozen test preimages and published Ed25519 receipts.",
    meta: "Alg: Ed25519 · SHA-256 Preimage",
    badge: "Verification Tool",
    actionText: "Launch ClaimGuard"
  },
  {
    id: "prod-2",
    name: "Council OS Cockpit",
    category: "Products",
    status: "LIVE",
    href: "/os",
    description: "Sovereign AI governance operating cockpit with real-time model probing, 3KB card issuance, and BFT consensus deliberation.",
    meta: "BFT 23/33 Quorum · Port :3090",
    badge: "Core OS",
    actionText: "Launch Cockpit"
  },
  {
    id: "prod-3",
    name: "AI Readiness Assessment (RAS)",
    category: "Products",
    status: "LIVE",
    href: "/assess",
    description: "Deterministic 5-minute statutory compliance assessment mapping systems against EU AI Act, NIST AI RMF, and ISO 42001.",
    meta: "113 Articles · Annex III Classifiers",
    badge: "Statutory Tool",
    actionText: "Run Assessment"
  },
  {
    id: "prod-4",
    name: "Article 50 C2PA Evidence Pack",
    category: "Products",
    status: "LIVE",
    href: "/verify",
    description: "Automated cryptographic marking durability attestation verifying machine-readable provenance under EU AI Act Article 50.",
    meta: "C2PA v2.1 · Synthetic Content Mark",
    badge: "Provenance Pack",
    actionText: "Inspect Pack"
  },
  {
    id: "prod-5",
    name: "East-West Trust Gauge",
    category: "Products",
    status: "LIVE",
    href: "/os",
    description: "Cross-border governance rail mapping pairwise model behavioral variance across Western (EU/US/UK) and Eastern (TC260) standards.",
    meta: "Cross-Regime Mappings · 6 Axes",
    badge: "Trust Rail",
    actionText: "View Gauge"
  },

  // Tooling & SDKs
  {
    id: "tool-1",
    name: "inspect-signed-receipt",
    category: "Tooling & SDKs",
    status: "LIVE",
    href: "https://pypi.org/project/inspect-signed-receipt/",
    description: "Offline cryptographic verification tool for Ed25519-signed 3KB measurement cards and SHA-256 canonical preimages.",
    meta: "Distribution: PyPI · Python 3.9+",
    badge: "CLI Utility",
    copyableCmd: "pip install inspect-signed-receipt",
    actionText: "PyPI Package"
  },
  {
    id: "tool-2",
    name: "csoai (Official Python SDK)",
    category: "Tooling & SDKs",
    status: "LIVE",
    href: "https://pypi.org/project/csoai/",
    description: "Official Python SDK for integrating GSPC evaluation harnesses, BFT multi-agent voting, and C2PA manifest assertions.",
    meta: "Distribution: PyPI · v1.2.0",
    badge: "Python SDK",
    copyableCmd: "pip install csoai",
    actionText: "PyPI Package"
  },
  {
    id: "tool-3",
    name: "proofof-ai-mcp",
    category: "Tooling & SDKs",
    status: "LIVE",
    href: "https://pypi.org/project/proofof-ai-mcp/",
    description: "FastMCP compliance server enabling Claude Desktop, Cursor, and Windsurf to execute real-time statutory evaluations.",
    meta: "Distribution: PyPI · uvx Support",
    badge: "MCP Server",
    copyableCmd: "pip install proofof-ai-mcp",
    actionText: "PyPI Package"
  },
  {
    id: "tool-4",
    name: "@meok-labs/ai-sdk",
    category: "Tooling & SDKs",
    status: "LIVE",
    href: "https://github.com/CSOAI-ORG",
    description: "TypeScript client library for interacting with Sovereign OS gateways, BFT consensus voting, and XRPL on-chain verification.",
    meta: "Distribution: npm · Node/Browser",
    badge: "TypeScript SDK",
    copyableCmd: "npm install @meok-labs/ai-sdk",
    actionText: "GitHub Repo"
  },
  {
    id: "tool-5",
    name: "DeepSeek Harness (DSH)",
    category: "Tooling & SDKs",
    status: "LIVE",
    href: "http://127.0.0.1:3090/",
    description: "Multi-model reasoning orchestration console supporting 1M context deliberation across RunPod GPU clusters and local Ollama.",
    meta: "Runtime: Node / Port :3090",
    badge: "Core Engine",
    copyableCmd: "npx @deepseek-ai/dsh web --port 3090",
    actionText: "Launch Local DSH"
  },

  // Datasets (HuggingFace csoai/)
  {
    id: "ds-1",
    name: "csoai/gspc-gov",
    category: "Datasets",
    status: "MEASURED",
    href: "https://huggingface.co/datasets/csoai/gspc-gov",
    description: "237 frozen public benchmark items from the AI Act Evaluation Benchmark (NCSR Demokritos, arXiv:2603.09435).",
    meta: "n=237 · Wilson [0.639, 0.755] · Separated Leader",
    badge: "GovBench Bank",
    actionText: "HuggingFace Split"
  },
  {
    id: "ds-2",
    name: "csoai/gspc-agi",
    category: "Datasets",
    status: "MEASURED",
    href: "https://huggingface.co/datasets/csoai/gspc-agi",
    description: "Paired calibrated safety refusal prompts evaluating boundary defense without over-refusal of lawful inquiries.",
    meta: "n=36 · Fleet Mean: 73.2% · DefBench",
    badge: "Safety Bank",
    actionText: "HuggingFace Split"
  },
  {
    id: "ds-3",
    name: "csoai/gspc-prv",
    category: "Datasets",
    status: "MEASURED",
    href: "https://huggingface.co/datasets/csoai/gspc-prv",
    description: "Article 50 synthetic marking and C2PA validity testing splits measuring cryptographic manifest durability under transform.",
    meta: "n=32 · Validity Principle Anchor",
    badge: "Provenance Bank",
    actionText: "HuggingFace Split"
  },
  {
    id: "ds-4",
    name: "csoai/gspc-jail-goldbank",
    category: "Datasets",
    status: "MEASURED",
    href: "https://huggingface.co/datasets/csoai/gspc-jail-goldbank",
    description: "71-cell frozen gold bank (38 escape attempts / 33 benign controls) for benchmarking zero-false-positive jailbreak detectors.",
    meta: "n=71 · Best Zero-FP Recall: 23.7%",
    badge: "GoldBank Jail",
    actionText: "HuggingFace Split"
  },

  // RWA Institutional Assets (XRPL & Ethereum)
  {
    id: "rwa-1",
    name: "RLUSD (Ripple USD)",
    category: "RWA Assets",
    status: "MEASURED",
    href: "/os",
    description: "XRPL Mainnet Issuer: rMxCKbEDwqr76QuheSUMdEGf4B9xJ8m5De. Flag facts: RequireAuth=false, NoFreeze=true, Domain=ripple.com.",
    meta: "On-Chain Read: Mainnet · Devnet Carrier",
    badge: "Stablecoin RWA",
    actionText: "Inspect Account"
  },
  {
    id: "rwa-2",
    name: "Ondo OUSG (US Treasuries)",
    category: "RWA Assets",
    status: "MEASURED",
    href: "/os",
    description: "XRPL Mainnet Issuer: rHuiXXjHLpMP8ZE9sSQU5aADQVWDwv6h5p. Flag facts: RequireAuth=false, NoFreeze=false, Domain=ondo.finance.",
    meta: "On-Chain Read: Mainnet · Short-Term Treasuries",
    badge: "Treasury RWA",
    actionText: "Inspect Account"
  },
  {
    id: "rwa-3",
    name: "OpenEden TBILL (TBL)",
    category: "RWA Assets",
    status: "MEASURED",
    href: "/os",
    description: "XRPL Mainnet Issuer: rJNE2NNz83GJYtWVLwMvchDWEon3huWnFn. Flag facts: RequireAuth=false, NoFreeze=true, Domain=openeden.com.",
    meta: "On-Chain Read: Mainnet · Tokenized T-Bills",
    badge: "Treasury RWA",
    actionText: "Inspect Account"
  },
  {
    id: "rwa-4",
    name: "Archax x abrdn MMF",
    category: "RWA Assets",
    status: "MEASURED",
    href: "/os",
    description: "XRPL Mainnet Issuer: rKCu4CucpepQ6N89c8T5GuX2jkxzCST18Q. Flag facts: RequireAuth=false, NoFreeze=false, Domain=archax.com.",
    meta: "On-Chain Read: Mainnet · Money Market Fund",
    badge: "Fund RWA",
    actionText: "Inspect Account"
  },
  {
    id: "rwa-5",
    name: "Braza Bank USDB & BBRL",
    category: "RWA Assets",
    status: "MEASURED",
    href: "/os",
    description: "XRPL Mainnet Issuers: rB3y9EPnq1ZrZP3aXgfyfdXQThzdXMrLMc & rH5CJsqvNqZGxrMyGaqLEoMWRYcVTAPZMt. Domain: tokens.brazacripto.com.br.",
    meta: "On-Chain Read: Mainnet · FX & Banking RWA",
    badge: "Bank RWA",
    actionText: "Inspect Account"
  },
  {
    id: "rwa-6",
    name: "10 Catalogued Institutional Assets",
    category: "RWA Assets",
    status: "DECLARED SLOT",
    href: "/os",
    description: "10 institutional tokenized assets mapped in the registry pending public issuer root address location and formal audit.",
    meta: "Scope Gap · Openly Declared Slots",
    badge: "Registry Scope",
    actionText: "View Scope"
  },

  // Interop Chains & Attestations
  {
    id: "chain-1",
    name: "MCP Security Scorecards (311 Servers)",
    category: "Interop Chains",
    status: "SIGNED",
    href: "/os",
    description: "Signed security scorecards across 311 FastMCP tool servers measuring tool call fidelity, permission bounding, and latency.",
    meta: "311 Signed Entries · /interop/mcp-security-scorecard.json",
    badge: "Scorecard Corpus",
    actionText: "Inspect Manifest"
  },
  {
    id: "chain-2",
    name: "Ethereum Attestation Service (EAS) Batch",
    category: "Interop Chains",
    status: "SIGNED",
    href: "/os",
    description: "Off-chain EAS attestation schemas and signed payloads ready for Base & Ethereum Mainnet dispute anchoring.",
    meta: "3 Ready Payloads · /interop/eas-attestation-batch.json",
    badge: "EAS Schema",
    actionText: "Inspect Schema"
  },
  {
    id: "chain-3",
    name: "Frozen Attestation Corpus (150 Cards)",
    category: "Interop Chains",
    status: "SIGNED",
    href: "/verify",
    description: "Canonical frozen floor of 150 Ed25519-signed 3KB measurement cards validated with zero-network WebCrypto preimages.",
    meta: "did:web:councilof.ai · SHA-256 Preimages",
    badge: "Signed Corpus",
    actionText: "Verify Cards"
  }
];

export default function CataloguePage() {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const handleCopy = (id: string, cmd: string) => {
    navigator.clipboard.writeText(cmd);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredItems = LIVING_CATALOG.filter((item) => {
    const matchesCategory = filterCategory === "ALL" || item.category === filterCategory;
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          item.meta.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 space-y-12">
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-400 text-xs font-semibold">
          <Radio className="w-3.5 h-3.5" />
          The Single Machine-Readable Registry
        </div>
        <h1 className="text-4xl sm:text-5xl font-black tracking-tight">
          Living Product & <span className="bg-gradient-to-r from-brand-400 to-indigo-400 bg-clip-text text-transparent">Artifact Catalogue</span>
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
          The living catalogue of all sites, endpoints, datasets, on-chain RWA registries, and signed cryptographic manifests. Measured, not certified.
        </p>
      </div>

      {/* Live State Summary Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 rounded-2xl bg-card border border-border text-center font-mono text-xs">
        <div>
          <span className="text-muted-foreground block text-[11px]">LIVING AXES</span>
          <span className="text-foreground font-bold text-base">22 Total · 15 Measured</span>
        </div>
        <div>
          <span className="text-muted-foreground block text-[11px]">RWA INSTRUMENTS</span>
          <span className="text-amber-400 font-bold text-base">6 Measured · 16 Catalogued</span>
        </div>
        <div>
          <span className="text-muted-foreground block text-[11px]">SIGNED CARDS</span>
          <span className="text-emerald-400 font-bold text-base">150 Frozen Floor</span>
        </div>
        <div>
          <span className="text-muted-foreground block text-[11px]">FASTMCP MESH</span>
          <span className="text-indigo-400 font-bold text-base">341 Servers Active</span>
        </div>
      </div>

      {/* Filter and Search Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex flex-wrap gap-2">
          {["ALL", "Products", "Tooling & SDKs", "Datasets", "RWA Assets", "Interop Chains"].map((cat) => (
            <button
              key={cat}
              onClick={() => setFilterCategory(cat)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                filterCategory === cat
                  ? "gradient-brand text-white shadow-md shadow-brand-500/20"
                  : "bg-card border border-border text-muted-foreground hover:text-foreground hover:bg-accent"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <input
          type="text"
          placeholder="Search catalogue items..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="px-4 py-2 rounded-xl bg-card border border-border text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-brand-400 w-full sm:w-64"
        />
      </div>

      {/* Catalogue Cards Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredItems.map((item) => (
          <div
            key={item.id}
            className="rounded-2xl bg-card border border-border p-6 shadow-sm hover:border-brand-500/50 transition-all flex flex-col justify-between space-y-4"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded bg-brand-500/10 text-brand-400 font-mono">
                  {item.badge}
                </span>
                <span
                  className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded ${
                    item.status === "LIVE" || item.status === "MEASURED" || item.status === "SIGNED"
                      ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                      : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                  }`}
                >
                  {item.status}
                </span>
              </div>

              <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                {item.name}
              </h3>

              <p className="text-xs text-muted-foreground leading-relaxed">
                {item.description}
              </p>

              {item.copyableCmd && (
                <div className="flex items-center justify-between p-2 rounded-lg bg-background border border-border font-mono text-[11px] text-slate-200">
                  <span className="truncate mr-2">{item.copyableCmd}</span>
                  <button
                    onClick={() => handleCopy(item.id, item.copyableCmd!)}
                    className="p-1 rounded hover:bg-accent text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"
                    title="Copy command"
                  >
                    {copiedId === item.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              )}

              <div className="text-[11px] font-mono text-slate-400 pt-1">
                {item.meta}
              </div>
            </div>

            <div className="pt-3 border-t border-border flex items-center justify-between">
              <a
                href={item.href}
                target={item.href.startsWith("http") ? "_blank" : "_self"}
                rel="noopener noreferrer"
                className="text-xs font-semibold text-brand-400 hover:text-brand-300 inline-flex items-center gap-1 transition-colors"
              >
                {item.actionText || "Explore"} <ExternalLink className="w-3 h-3" />
              </a>
              <span className="text-[10px] text-muted-foreground font-mono">
                did:web:councilof.ai
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* FastMCP Configuration Section */}
      <div className="rounded-3xl bg-card border border-border p-8 shadow-xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold mb-2">
              <Terminal className="w-3.5 h-3.5" />
              Developer Integration
            </div>
            <h3 className="text-xl font-bold text-foreground">
              Add ProofOf.AI FastMCP to Cursor & Claude Desktop
            </h3>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Directly wire our 341 governance tools into your local AI workflow in 30 seconds.
            </p>
          </div>
          <span className="text-xs font-mono px-3 py-1 rounded bg-slate-800 text-slate-300">
            mcp_servers.json
          </span>
        </div>

        <pre className="p-4 rounded-xl bg-background border border-border text-xs font-mono text-slate-300 overflow-x-auto">
{`{
  "mcpServers": {
    "proofof-ai": {
      "command": "uvx",
      "args": ["proofof-ai-mcp", "--gateway", "http://localhost:3000"],
      "env": {
        "CSOAI_DID": "did:web:councilof.ai#board-attestation-1"
      }
    }
  }
}`}
        </pre>
      </div>
    </div>
  );
}
