import { useEffect } from "react";
import { Link, useRoute, useSearch } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ExternalLink, Copy } from "lucide-react";
import {
  findRouter,
  LAYER_META,
  CAPABILITY_LABELS,
  type RouterEntry,
} from "@/data/eunomia-router";
import { StackHonestyBanner } from "@/components/StackHonestyBanner";
import {
  apiDocFor,
  instrumentViewHref,
  openInstrumentInLobby,
  type InstrumentView,
} from "@/lib/instrument-routes";

const VIEWS: { id: InstrumentView; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "api", label: "API" },
  { id: "mcp", label: "MCP" },
  { id: "agui", label: "AG-UI" },
  { id: "playground", label: "Playground" },
];

function CodeBlock({ code }: { code: string }) {
  return (
    <pre className="overflow-x-auto rounded-lg border border-white/10 bg-black/40 p-4 text-xs text-emerald-100 font-mono">
      <code>{code}</code>
    </pre>
  );
}

function InstrumentDetail({ item, view }: { item: RouterEntry; view: InstrumentView }) {
  const doc = apiDocFor(item);

  const runPlayground = () => openInstrumentInLobby(item);

  const copyUri = () => {
    void navigator.clipboard?.writeText(item.eunomiaUri);
  };

  return (
    <article className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <header className="mb-8">
        <Badge variant="outline" className="mb-3 border-white/20 text-slate-400">
          {LAYER_META[item.layer].label} layer
        </Badge>
        <h1 className="text-3xl font-bold text-white">{item.name}</h1>
        <button
          type="button"
          onClick={copyUri}
          className="mt-2 flex items-center gap-2 text-sm font-mono text-emerald-400 hover:text-emerald-300"
        >
          {item.eunomiaUri}
          <Copy className="h-3.5 w-3.5" />
        </button>

        {/* OpenRouter: Compare | Playground | Get API Key → Eunomia: Compare | Playground | MCP | AG-UI */}
        <div className="mt-6 flex flex-wrap gap-2">
          <Link href="/competitors">
            <Button variant="outline" size="sm" className="border-white/15 text-slate-300">
              Compare
            </Button>
          </Link>
          <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700" onClick={runPlayground}>
            Council OS
          </Button>
          <Link href={instrumentViewHref(item, "mcp")}>
            <Button variant="outline" size="sm" className="border-emerald-500/40 text-emerald-400">
              MCP
            </Button>
          </Link>
          <Link href={instrumentViewHref(item, "agui")}>
            <Button variant="outline" size="sm" className="border-emerald-500/40 text-emerald-400">
              AG-UI
            </Button>
          </Link>
        </div>

        <p className="mt-6 text-slate-400 leading-relaxed">{item.description}</p>

        <dl className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
          <div>
            <dt className="text-[10px] uppercase tracking-wide text-slate-600">Layer</dt>
            <dd className="text-white mt-0.5">{LAYER_META[item.layer].label}</dd>
          </div>
          <div>
            <dt className="text-[10px] uppercase tracking-wide text-slate-600">Scope</dt>
            <dd className="text-white mt-0.5">{item.scope}</dd>
          </div>
          <div>
            <dt className="text-[10px] uppercase tracking-wide text-slate-600">Pricing</dt>
            <dd className="text-white mt-0.5">
              {item.pricing === "free" ? "Free" : item.pricing === "payg" ? "PAYG" : "Artefact"}
            </dd>
          </div>
          <div>
            <dt className="text-[10px] uppercase tracking-wide text-slate-600">Capabilities</dt>
            <dd className="text-white mt-0.5 text-xs">
              {item.capabilities.map((c) => CAPABILITY_LABELS[c]).join(", ")}
            </dd>
          </div>
        </dl>

        {item.repoUrl && (
          <a
            href={item.repoUrl}
            target="_blank"
            rel="noreferrer"
            className="mt-4 inline-flex items-center gap-1 text-xs text-emerald-400 hover:underline"
          >
            {item.repoUrl.replace("https://github.com/", "")} <ExternalLink className="h-3 w-3" />
          </a>
        )}
      </header>

      <nav className="flex flex-wrap gap-1 border-b border-white/10 mb-8" aria-label="Instrument views">
        {VIEWS.map((v) => (
          <Link key={v.id} href={instrumentViewHref(item, v.id)}>
            <a
              className={
                `px-4 py-2 text-sm border-b-2 -mb-px transition ` +
                (view === v.id
                  ? "border-emerald-500 text-emerald-400"
                  : "border-transparent text-slate-500 hover:text-slate-300")
              }
            >
              {v.label}
            </a>
          </Link>
        ))}
      </nav>

      <div className="prose prose-invert max-w-none text-sm">
        {view === "overview" && (
          <section>
            <h2 className="text-lg font-semibold text-white">What it routes</h2>
            <p className="text-slate-400">{item.blurb}</p>
            {item.endpoint && (
              <p className="mt-4 text-slate-400">
                Primary endpoint: <code className="text-emerald-300">{item.endpoint}</code>
              </p>
            )}
            <h2 className="text-lg font-semibold text-white mt-8">Quick start</h2>
            <p className="text-slate-400">
              Like OpenRouter&apos;s model page, pick how you connect — REST API, MCP tool, or AG-UI SSE stream.
              This is a routing table entry, not a compliance PDF.
            </p>
            <div className="mt-4 grid sm:grid-cols-3 gap-3 not-prose">
              {(["api", "mcp", "agui"] as const).map((v) => (
                <Link key={v} href={instrumentViewHref(item, v)}>
                  <a className="block rounded-lg border border-white/10 p-4 hover:border-emerald-500/30 transition">
                    <strong className="text-white uppercase text-xs">{v}</strong>
                    <span className="block mt-1 text-xs text-slate-500">
                      {v === "api" && "HTTP + curl"}
                      {v === "mcp" && "Tool in mcp.json"}
                      {v === "agui" && "SSE + HITL"}
                    </span>
                  </a>
                </Link>
              ))}
            </div>
          </section>
        )}

        {view === "api" && (
          <section>
            <h2 className="text-lg font-semibold text-white">API</h2>
            <p className="text-slate-400">
              OpenRouter shows &quot;Get API Key&quot; here. Eunomia Layer-0 read paths are public — no key required.
              POST routes may rate-limit; verification never does.
            </p>
            <h3 className="text-sm font-semibold text-white mt-6">Eunomia URI</h3>
            <CodeBlock code={doc.eunomiaUri} />
            <h3 className="text-sm font-semibold text-white mt-6">Endpoint</h3>
            <p>
              <code className="text-amber-300">{doc.method}</code>{" "}
              <code className="text-emerald-300">{doc.endpoint}</code>
            </p>
            <h3 className="text-sm font-semibold text-white mt-6">curl</h3>
            <CodeBlock code={doc.curl} />
          </section>
        )}

        {view === "mcp" && (
          <section>
            <h2 className="text-lg font-semibold text-white">MCP</h2>
            <p className="text-slate-400">
              Where OpenRouter routes to model providers, Eunomia exposes measured tools on the Layer-0 MCP spine.
              Repo slug: <code>{item.mcpSlug ?? "—"}</code>
            </p>
            <h3 className="text-sm font-semibold text-white mt-6">MCP server</h3>
            <CodeBlock code={doc.mcpServer} />
            <h3 className="text-sm font-semibold text-white mt-6">Tool</h3>
            <CodeBlock code={doc.mcpTool} />
            {item.mcpSlug && (
              <Link href={`/mcp/${item.mcpSlug}`}>
                <a className="mt-4 inline-block text-sm text-emerald-400 hover:underline">
                  View in MCP fleet →
                </a>
              </Link>
            )}
          </section>
        )}

        {view === "agui" && (
          <section>
            <h2 className="text-lg font-semibold text-white">AG-UI wire</h2>
            <p className="text-slate-400">
              AG-UI replaces opaque chat with a signed event stream — RUN_*, TOOL_CALL_*, HITL consent
              checkpoints. Handle for this route: <code className="text-emerald-300">{item.slug}</code>
            </p>
            <div className="mt-4 not-prose">
              <StackHonestyBanner
                showStats={false}
                note="AG-UI Lane 2 requires AGUI_WIRE_URL on Cloudflare. Without it, Council OS falls back to POST /api/chat."
              />
            </div>
            <h3 className="text-sm font-semibold text-white mt-6">1. Open session</h3>
            <CodeBlock code={doc.aguiSession} />
            <h3 className="text-sm font-semibold text-white mt-6">2. Run (SSE)</h3>
            <CodeBlock code={doc.aguiRun} />
            <h3 className="text-sm font-semibold text-white mt-6">3. Consent (HITL)</h3>
            <CodeBlock
              code={`curl -sS -X POST https://councilof.ai/api/agui/session/{session_id}/consent?decision=approve`}
            />
            <Button className="mt-6 bg-emerald-600 hover:bg-emerald-700" onClick={runPlayground}>
              Run in Council OS (handle={item.slug})
            </Button>
          </section>
        )}

        {view === "playground" && (
          <section>
            <h2 className="text-lg font-semibold text-white">Playground</h2>
            <p className="text-slate-400">
              Runs in the Council Lobby — stream, consent, and ledger stay visible. Your click, never mine.
            </p>
            <Button className="mt-4 bg-emerald-600 hover:bg-emerald-700" onClick={runPlayground}>
              Run {item.name} in Council OS
            </Button>
            <p className="mt-3 text-xs text-slate-500">
              Streams via AG-UI when wired · else published measurement via /api/chat · consent lock on seed prompt
            </p>
          </section>
        )}
      </div>
    </article>
  );
}

export default function InstrumentDetailPage() {
  const [, params] = useRoute("/instruments/:layer/:slug");
  const searchString = useSearch();
  const urlParams = new URLSearchParams(searchString);
  const layer = params?.layer ?? "";
  const slug = params?.slug ?? "";
  const item = findRouter(layer, slug);

  const raw = urlParams.get("view") || "overview";
  const view = (
    ["overview", "api", "mcp", "agui", "playground"].includes(raw) ? raw : "overview"
  ) as InstrumentView;

  useEffect(() => {
    document.title = item
      ? `${item.name} — Eunomia Router | Council of AI`
      : "Route not found | Council of AI";
  }, [item]);

  if (!item) {
    return (
      <div className="min-h-screen bg-[#04070d] flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <h1 className="text-2xl font-bold text-white mb-2">Route not found</h1>
          <p className="text-slate-400 mb-6">
            No routing rule matches <code className="text-emerald-400">/{layer}/{slug}</code>
          </p>
          <Link href="/instruments">
            <Button className="bg-emerald-600 hover:bg-emerald-700">Browse all routes</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#04070d] text-slate-200">
      <div className="border-b border-white/8 bg-[#080c14]">
        <div className="mx-auto max-w-4xl px-4 py-4">
          <Link href="/instruments">
            <a className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-emerald-400">
              <ArrowLeft className="h-4 w-4" /> All routing rules
            </a>
          </Link>
        </div>
      </div>
      <InstrumentDetail item={item} view={view} />
    </div>
  );
}
