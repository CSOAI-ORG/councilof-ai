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
  Activity
} from "lucide-react";

interface PackageItem {
  id: string;
  name: string;
  category: "SDK" | "CLI" | "MCP" | "Core Engine";
  distribution: "PyPI" | "npm" | "Docker" | "Binary";
  installCmd: string;
  description: string;
  version: string;
  link: string;
  tags: string[];
}

const PACKAGES: PackageItem[] = [
  {
    id: "pkg-1",
    name: "inspect-signed-receipt",
    category: "CLI",
    distribution: "PyPI",
    installCmd: "pip install inspect-signed-receipt",
    description: "Offline cryptographic verification tool for Ed25519-signed 3KB measurement cards and SHA-256 canonical preimages.",
    version: "v0.4.2",
    link: "https://pypi.org/project/inspect-signed-receipt/",
    tags: ["Ed25519", "Preimage", "Audit-Ready", "Zero-Network"]
  },
  {
    id: "pkg-2",
    name: "csoai",
    category: "SDK",
    distribution: "PyPI",
    installCmd: "pip install csoai",
    description: "Official Python SDK for integrating GSPC evaluation harnesses, BFT multi-agent voting, and C2PA manifest assertions.",
    version: "v1.2.0",
    link: "https://pypi.org/project/csoai/",
    tags: ["Python 3.10+", "Evaluation", "BFT-Voting", "Telemetry"]
  },
  {
    id: "pkg-3",
    name: "proofof-ai-mcp",
    category: "MCP",
    distribution: "PyPI",
    installCmd: "pip install proofof-ai-mcp",
    description: "FastMCP compliance server enabling Claude Desktop, Cursor, and Windsurf to execute real-time EU AI Act risk evaluations.",
    version: "v0.9.1",
    link: "https://pypi.org/project/proofof-ai-mcp/",
    tags: ["FastMCP", "Cursor", "Claude-Desktop", "Windsurf"]
  },
  {
    id: "pkg-4",
    name: "@meok-labs/ai-sdk",
    category: "SDK",
    distribution: "npm",
    installCmd: "npm install @meok-labs/ai-sdk",
    description: "TypeScript/Node.js client library for interacting with Sovereign OS gateways and verifying on-chain XRPL receipts.",
    version: "v2.1.4",
    link: "https://github.com/CSOAI-ORG",
    tags: ["TypeScript", "Node.js", "WebCrypto", "XRPL"]
  },
  {
    id: "pkg-5",
    name: "deepseek-harness (DSH)",
    category: "Core Engine",
    distribution: "Binary",
    installCmd: "npx @deepseek-ai/dsh web --port 3090",
    description: "Multi-model reasoning orchestration console supporting 1M context deliberation across RunPod GPU clusters and local Ollama.",
    version: "v3.8.0",
    link: "http://127.0.0.1:3090/",
    tags: ["Multi-Agent", "Local-Ollama", "A100-Cluster", "Port 3090"]
  },
  {
    id: "pkg-6",
    name: "csoai-mesh-gateway",
    category: "MCP",
    distribution: "Docker",
    installCmd: "docker run -p 3000:3000 csoai/mesh-gateway:latest",
    description: "High-throughput proxy gateway managing and load-balancing 341 FastMCP tool servers with sub-50ms p99 latency bounds.",
    version: "v1.0.4",
    link: "https://github.com/CSOAI-ORG",
    tags: ["341 MCPs", "p99 < 50ms", "Liveness-Drift", "Docker"]
  }
];

export default function CataloguePage() {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>("ALL");

  const handleCopy = (id: string, cmd: string) => {
    navigator.clipboard.writeText(cmd);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredPackages = filterCategory === "ALL" 
    ? PACKAGES 
    : PACKAGES.filter(p => p.category === filterCategory);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 space-y-12">
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-400 text-xs font-semibold">
          <Package className="w-3.5 h-3.5" />
          Packaged Product & Developer Ecosystem
        </div>
        <h1 className="text-4xl sm:text-5xl font-black tracking-tight">
          Tools, SDKs & <span className="bg-gradient-to-r from-brand-400 to-indigo-400 bg-clip-text text-transparent">Packaged Infrastructure</span>
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
          Explore our open-source toolchain: PyPI packages, TypeScript SDKs, FastMCP servers, and sovereign multi-agent deliberation engines.
        </p>
      </div>

      {/* Category Filter Tabs */}
      <div className="flex justify-center gap-2 overflow-x-auto pb-2">
        {["ALL", "SDK", "CLI", "MCP", "Core Engine"].map((cat) => (
          <button
            key={cat}
            onClick={() => setFilterCategory(cat)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              filterCategory === cat
                ? "gradient-brand text-white shadow-md shadow-brand-500/20"
                : "bg-card border border-border text-muted-foreground hover:text-foreground hover:bg-accent"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Product & Package Cards Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredPackages.map((pkg) => (
          <div
            key={pkg.id}
            className="rounded-2xl bg-card border border-border p-6 shadow-sm hover:border-brand-500/50 transition-all flex flex-col justify-between space-y-5"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded bg-brand-500/10 text-brand-400 font-mono">
                  {pkg.category} &bull; {pkg.distribution}
                </span>
                <span className="text-xs font-mono text-muted-foreground">{pkg.version}</span>
              </div>

              <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                <Package className="w-4 h-4 text-brand-400" />
                {pkg.name}
              </h3>

              <p className="text-xs text-muted-foreground leading-relaxed">
                {pkg.description}
              </p>

              {/* Install snippet box */}
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-background border border-border font-mono text-xs text-slate-200">
                <span className="truncate mr-2">{pkg.installCmd}</span>
                <button
                  onClick={() => handleCopy(pkg.id, pkg.installCmd)}
                  className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"
                  title="Copy command"
                >
                  {copiedId === pkg.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>

              {/* Tags */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                {pkg.tags.map((tag, i) => (
                  <span key={i} className="text-[10px] px-2 py-0.5 rounded bg-accent text-muted-foreground font-mono">
                    #{tag}
                  </span>
                ))}
              </div>
            </div>

            <div className="pt-3 border-t border-border flex items-center justify-between">
              <a
                href={pkg.link}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-semibold text-brand-400 hover:text-brand-300 inline-flex items-center gap-1.5 transition-colors"
              >
                Package Documentation <ExternalLink className="w-3 h-3" />
              </a>
              <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Signed
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* FastMCP Interactive Config Section */}
      <div className="rounded-3xl bg-card border border-border p-8 shadow-xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold mb-2">
              <Terminal className="w-3.5 h-3.5" />
              IDE & Agent Integration
            </div>
            <h3 className="text-xl font-bold text-foreground">
              Add ProofOf.AI MCP to Cursor, Windsurf & Claude Desktop
            </h3>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Directly wire our 341 governance tools into your local AI coding assistant in 30 seconds.
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
