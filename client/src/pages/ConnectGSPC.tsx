import { useEffect, useState } from "react";
import { Link } from "wouter";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  MCP_NATIVE,
  NON_MCP,
  REGISTRIES,
  TEST_LINE,
  MCP_URL,
  STDIO_CMD,
  OPENAPI_URL,
  type PlatformCard,
  type ConfigBlock,
  type Gate,
} from "@/data/gspcInstall";

const TOOLS = [
  ["board_totals", "the live slot + measured counts"],
  ["get_axis", "one axis row (n, accuracy, interval, status)"],
  ["list_cards", "the signed-card index"],
  ["verify_card", "recompute a card's Ed25519 signature (three-state)"],
  ["get_root", "the public-root merkle head"],
  ["get_card", "one signed leaf by id"],
  ["verify_inclusion", "prove a leaf is under the root"],
] as const;

function CopyBlock({ block }: { block: ConfigBlock }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard?.writeText(block.code).then(
      () => {
        setCopied(true);
        setTimeout(() => setCopied(false), 1400);
      },
      () => {},
    );
  };
  return (
    <div className="mt-3">
      <div className="flex items-center justify-between mb-1">
        <span className="text-[11px] font-mono uppercase tracking-wide text-gray-500">{block.label}</span>
        <button
          type="button"
          onClick={copy}
          className="text-[11px] font-medium text-emerald-700 hover:text-emerald-900 border border-emerald-200 rounded px-2 py-0.5 bg-emerald-50"
        >
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre className="text-xs bg-slate-900 text-slate-100 rounded-lg p-3 overflow-x-auto leading-relaxed">
        <code>{block.code}</code>
      </pre>
    </div>
  );
}

function GateBadge({ gate }: { gate: Gate }) {
  const map: Record<Gate, { label: string; cls: string }> = {
    live: { label: "Live now — self-serve", cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
    paid: { label: "Self-serve · paid tier", cls: "bg-amber-50 text-amber-700 border-amber-200" },
    review: { label: "Review-gated", cls: "bg-slate-100 text-slate-600 border-slate-200" },
  };
  const m = map[gate];
  return <Badge className={`text-[10px] ${m.cls}`}>{m.label}</Badge>;
}

function PlatformBlock({ p }: { p: PlatformCard }) {
  return (
    <Card className="p-5 flex flex-col border hover:border-emerald-300 transition-colors">
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-bold text-base leading-tight">{p.name}</h3>
        <GateBadge gate={p.gate} />
      </div>
      <p className="text-sm text-gray-600 mt-1 leading-relaxed">{p.tagline}</p>
      {!p.verified && (
        <p className="mt-2 text-[11px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 rounded px-2 py-1">
          Unverified shape — confirm against the platform's current docs before relying on it.
        </p>
      )}
      {p.blocks.map((b, i) => (
        <CopyBlock key={i} block={b} />
      ))}
      {p.note && <p className="mt-3 text-xs text-gray-500 leading-relaxed">{p.note}</p>}
      <div className="mt-4 flex items-center justify-between gap-2 pt-3 border-t">
        <span className="text-[11px] text-emerald-700">{TEST_LINE}</span>
        <a
          href={p.docUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[11px] text-gray-400 hover:text-gray-600 shrink-0"
        >
          docs ↗
        </a>
      </div>
    </Card>
  );
}

export default function ConnectGSPC() {
  useEffect(() => {
    document.title = "Connect GSPC to your AI — every platform | CSOAI";
  }, []);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "TechArticle",
    headline: "Connect GSPC to your AI — the per-platform install matrix",
    about: "Adding the Council of AI GSPC measurement MCP server to any AI client",
    url: "https://councilof.ai/connect-gspc",
    isPartOf: { "@type": "WebSite", name: "Council of AI", url: "https://councilof.ai" },
    publisher: { "@type": "Organization", name: "CSOAI Ltd", url: "https://councilof.ai" },
    description:
      "Copy-paste configs to add the GSPC governance-measurement server (MCP, OpenAPI, function-calling) to Claude, Cursor, ChatGPT, Gemini, Grok, Perplexity, and any tool-calling AI. Measurement, not certification.",
  };

  return (
    <div className="min-h-screen bg-white">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* Hero */}
      <section className="bg-gradient-to-br from-slate-900 via-emerald-950 to-teal-900 text-white py-16">
        <div className="max-w-5xl mx-auto px-6">
          <p className="font-mono text-[11px] uppercase tracking-[2px] text-emerald-300/80">
            The verify-before-you-trust layer for the agent economy
          </p>
          <h1 className="mt-3 text-4xl sm:text-5xl font-black tracking-tight">Connect GSPC to your AI</h1>
          <p className="mt-4 max-w-2xl text-lg text-emerald-50/90">
            The Council of AI GSPC board is a standard MCP server, so it already works on every MCP client —
            and a plain OpenAPI/function tool covers the rest. Add it in about 30 seconds. Your AI can then
            read the live governance board and verify signed measurement cards on demand.
          </p>
          <p className="mt-3 max-w-2xl text-sm text-emerald-100/70">
            We <strong className="text-white">measure</strong>; we never certify. No conformity mark, no fee,
            no account. Every number is recomputable from its rows, and an <span className="font-mono">axis</span> with
            no run behind it stays published as UNMEASURED.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <a
              href={MCP_URL}
              className="rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-semibold text-sm px-4 py-2.5"
            >
              {MCP_URL}
            </a>
            <Link
              href="/gspc-verify"
              className="rounded-lg border border-emerald-300/40 text-emerald-50 hover:bg-white/10 text-sm px-4 py-2.5"
            >
              Verify a card →
            </Link>
          </div>
        </div>
      </section>

      {/* Layer-0 positioning + the 7 tools */}
      <section className="border-b bg-emerald-50/40">
        <div className="max-w-5xl mx-auto px-6 py-8 grid md:grid-cols-2 gap-8">
          <div>
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
              The one check every agent should run first
            </h2>
            <p className="text-sm text-gray-700 leading-relaxed">
              x402 is the payments rail; ERC-8004 is identity; GSPC is the <strong>trust layer</strong> underneath
              them — the independent, signed measurement an agent reads before it decides to trust a model.
              It is read-only and unauthenticated, so any agent can call it and no one is gated out.
            </p>
            <div className="mt-4 flex flex-wrap gap-2 text-[11px]">
              {["AI governance", "model safety", "EU AI Act", "agent verification", "MCP governance", "provenance", "Ed25519"].map(
                (k) => (
                  <span key={k} className="rounded-full bg-white border border-emerald-200 text-emerald-700 px-2.5 py-1">
                    {k}
                  </span>
                ),
              )}
            </div>
          </div>
          <div>
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
              Seven read-only tools (HTTP server)
            </h2>
            <ul className="space-y-1.5">
              {TOOLS.map(([name, desc], i) => (
                <li key={name} className="text-sm text-gray-700 flex gap-2">
                  <code className="font-mono text-emerald-700 shrink-0">{name}</code>
                  <span className="text-gray-500">
                    — {desc}
                    {i < 4 ? "" : " · HTTP only"}
                  </span>
                </li>
              ))}
            </ul>
            <p className="mt-2 text-[11px] text-gray-400">
              The stdio npm fallback (<code className="font-mono">csoai-gspc-mcp</code>) currently exposes the four
              board/card tools; the three public-root tools are on the HTTP endpoint.
            </p>
          </div>
        </div>
      </section>

      {/* MCP-native matrix */}
      <section className="max-w-6xl mx-auto px-6 py-12">
        <h2 className="text-2xl font-bold">MCP-native clients</h2>
        <p className="text-sm text-gray-600 mt-1">
          The server speaks streamable-HTTP at <code className="font-mono">{MCP_URL}</code>, with a stdio fallback
          (<code className="font-mono">{STDIO_CMD}</code>). Every config below was checked against the client's current docs.
        </p>
        <div className="grid md:grid-cols-2 gap-5 mt-6">
          {MCP_NATIVE.map((p) => (
            <PlatformBlock key={p.id} p={p} />
          ))}
        </div>
      </section>

      {/* Non-MCP matrix */}
      <section className="bg-slate-50 border-y">
        <div className="max-w-6xl mx-auto px-6 py-12">
          <h2 className="text-2xl font-bold">ChatGPT, Gemini, Grok, Perplexity + any tool-calling AI</h2>
          <p className="text-sm text-gray-600 mt-1">
            Where a platform speaks MCP, point it at the server. Where it doesn't, one canonical OpenAPI 3.1 spec
            (<a href={OPENAPI_URL} className="text-emerald-700 underline">gspc.json</a>) and a set of function-tool
            definitions cover it — read-only, no key.
          </p>
          <div className="grid md:grid-cols-2 gap-5 mt-6">
            {NON_MCP.map((p) => (
              <PlatformBlock key={p.id} p={p} />
            ))}
          </div>
        </div>
      </section>

      {/* Badge */}
      <section className="max-w-5xl mx-auto px-6 py-12">
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-6 flex flex-col sm:flex-row items-center gap-6">
          <div className="shrink-0">
            <div className="inline-flex items-center gap-2 rounded-lg bg-slate-900 text-white px-3 py-2 text-sm font-semibold">
              <span className="text-emerald-400">◆</span> Measured by the Council of AI
            </div>
            <p className="mt-1 text-center text-[10px] text-gray-400">links to /gspc-verify · not a conformity mark</p>
          </div>
          <div>
            <h2 className="text-lg font-bold">Show the badge</h2>
            <p className="text-sm text-gray-600 mt-1">
              If your model or agent is on the board, display the measurement badge. It links to the recomputable
              record at <Link href="/gspc-verify" className="text-emerald-700 underline">/gspc-verify</Link> — a
              statement of what was measured on a stated date, never a certification. Grab it from{" "}
              <Link href="/badge" className="text-emerald-700 underline">/badge</Link>.
            </p>
          </div>
        </div>
      </section>

      {/* Where it's listed */}
      <section className="bg-slate-50 border-t">
        <div className="max-w-5xl mx-auto px-6 py-12">
          <h2 className="text-2xl font-bold">Find GSPC in the registries</h2>
          <p className="text-sm text-gray-600 mt-1">
            Listed once, honestly, in each — one entry per registry, no gaming. Completeness and real installs are
            what move ranking, so every listing documents all seven tools and links to a live verify.
          </p>
          <div className="mt-6 overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="text-left text-gray-500 border-b">
                  <th className="py-2 pr-4 font-semibold">Registry</th>
                  <th className="py-2 pr-4 font-semibold">Status</th>
                  <th className="py-2 pr-4 font-semibold">Path</th>
                  <th className="py-2 font-semibold">Note</th>
                </tr>
              </thead>
              <tbody>
                {REGISTRIES.map((r) => (
                  <tr key={r.name} className="border-b border-gray-100 align-top">
                    <td className="py-2 pr-4 font-medium text-gray-800">{r.name}</td>
                    <td className="py-2 pr-4">
                      <Badge
                        className={
                          r.status === "listed"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px]"
                            : r.status === "submitted"
                              ? "bg-blue-50 text-blue-700 border-blue-200 text-[10px]"
                              : "bg-slate-100 text-slate-600 border-slate-200 text-[10px]"
                        }
                      >
                        {r.status}
                      </Badge>
                    </td>
                    <td className="py-2 pr-4 font-mono text-[11px] text-gray-500">{r.where}</td>
                    <td className="py-2 text-gray-600 text-xs">{r.note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-4 text-[11px] text-gray-400">
            "Listed" = live now. "Staged" = the exact submission is prepared and owner-gated (needs a sign-in or a
            maintainer's review). Being in the official MCP registry means downstream aggregators pick GSPC up on their own.
          </p>
        </div>
      </section>
    </div>
  );
}
