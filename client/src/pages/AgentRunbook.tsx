import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Copy, CheckCircle, Terminal, Bot, ArrowRight } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { StackHonestyBanner } from "@/components/StackHonestyBanner";
import { STACK_STATS } from "@/lib/stackHonesty";
import { openLobby } from "@/lib/lobbyLink";
import CouncilOsPageShell from "@/components/os/CouncilOsPageShell";

const PROBES = [
  {
    id: "gspc",
    title: "GSPC board",
    desc: "13 measured core axes — keyless, CORS-open",
    cmd: "curl -sS https://councilof.ai/api/gspc | jq '.totals'",
  },
  {
    id: "instruments",
    title: "Eunomia router",
    desc: `${STACK_STATS.mcpServers} MCP routing rules`,
    cmd: "curl -sS https://councilof.ai/api/instruments | jq '.stats'",
  },
  {
    id: "anatomy",
    title: "Finance anatomy",
    desc: "Honest engine-axis map — MEASURED / SPEC / DESIGN",
    cmd: "curl -sS https://councilof.ai/api/finance/anatomy | jq '.financial_axes'",
  },
  {
    id: "bond",
    title: "Axis 18 crossing",
    desc: "Synthetic COBOL→JSON→attestation (MEASURED pilot)",
    cmd: "curl -sS https://councilof.ai/api/finance/bond-crossing | jq '.register, .attestation.content_hash'",
  },
  {
    id: "signal",
    title: "SOV Signal Index",
    desc: "Regulation × crosswalk × GSPC × arena sim — composed, not fused",
    cmd: "curl -sS https://councilof.ai/api/signal | jq '.schema, .totals, .signals[0].registers'",
  },
  {
    id: "cross",
    title: "Divergence layer",
    desc: "Law × measured AI × reported human baseline",
    cmd: "curl -sS https://councilof.ai/api/cross | jq '.schema, .rows[0].axis'",
  },
  {
    id: "agui",
    title: "AG-UI wire",
    desc: "503 until AGUI_WIRE_URL — then 200 + session_id",
    cmd: "curl -sS -X POST 'https://councilof.ai/api/agui/session?handle=probe'",
  },
  {
    id: "settle",
    title: "Settlement stub",
    desc: "Envelope shape — attestation + x402 layers (202 stub)",
    cmd: `curl -sS -X POST https://councilof.ai/api/finance/settle \\
  -H 'Content-Type: application/json' \\
  -d '{"instruction_id":"probe-001","cobol_job_id":"BATCH-SYNTH"}' | jq '.status'`,
  },
];

const LANES = [
  { n: 1, name: "Pane commands", detail: "Local tab switch — no model, no network" },
  { n: 2, name: "AG-UI SSE", detail: "/api/agui → AGUI_WIRE_URL — streaming + HITL consent" },
  { n: 3, name: "POST /api/chat", detail: "Published measurement or honest refuse" },
];

export default function AgentRunbook() {
  const [copied, setCopied] = useState<string | null>(null);

  const copy = (text: string, id: string) => {
    void navigator.clipboard.writeText(text);
    setCopied(id);
    toast.success("Copied");
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <CouncilOsPageShell
      title="Agents & API"
      subtitle="curl-first runbook — GSPC, instruments, AG-UI SSE, bond crossing"
      className="min-h-screen bg-[#04070d] text-slate-200"
    >
      <header className="border-b border-white/8 bg-[#080c14]">
        <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
          <div className="flex items-center gap-2 text-emerald-400 text-xs uppercase tracking-[0.2em] mb-4">
            <Bot className="h-4 w-4" />
            Agent runbook
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white">
            curl-first — agents eat in days, not years
          </h1>
          <p className="mt-4 max-w-2xl text-sm sm:text-base leading-relaxed text-slate-400">
            Keyless machine surfaces for the OpenRouter of governance. Prefer live JSON over this page —
            numbers change on the API. Measurement, not certification.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button
              className="bg-emerald-600 hover:bg-emerald-700"
              onClick={() =>
                openLobby({
                  task: "eunomia-router",
                  aguiHandle: "lobby",
                })
              }
            >
              Open Council OS
            </Button>
            <Link href="/dashboard">
              <Button variant="outline" className="border-white/15 text-slate-300">
                Council software (DSH)
              </Button>
            </Link>
            <Link href="/api-docs">
              <Button variant="outline" className="border-white/15 text-slate-300">
                GSPC API docs
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 space-y-8">
        <StackHonestyBanner />

        <section>
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Terminal className="h-5 w-5 text-emerald-400" />
            30-second probe
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {PROBES.map((p) => (
              <Card key={p.id} className="border-white/10 bg-white/5">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-white">{p.title}</CardTitle>
                  <p className="text-xs text-slate-500">{p.desc}</p>
                </CardHeader>
                <CardContent>
                  <pre className="overflow-x-auto rounded-lg border border-white/10 bg-black/40 p-3 text-[11px] font-mono text-emerald-100">
                    {p.cmd}
                  </pre>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="mt-2 h-7 text-xs text-slate-400"
                    onClick={() => copy(p.cmd, p.id)}
                  >
                    {copied === p.id ? (
                      <CheckCircle className="h-3 w-3 mr-1 text-emerald-400" />
                    ) : (
                      <Copy className="h-3 w-3 mr-1" />
                    )}
                    Copy
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white mb-4">Council OS — three lanes</h2>
          <ol className="space-y-3">
            {LANES.map((l) => (
              <li
                key={l.n}
                className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm"
              >
                <span className="font-mono text-emerald-400">Lane {l.n}</span>
                <span className="mx-2 text-white font-medium">{l.name}</span>
                <span className="text-slate-500">— {l.detail}</span>
              </li>
            ))}
          </ol>
        </section>

        <section className="rounded-xl border border-violet-500/30 bg-violet-950/20 p-6">
          <h2 className="text-lg font-semibold text-violet-200 mb-2">SovOS — two heads, one body</h2>
          <ul className="text-sm text-slate-400 space-y-2">
            <li>
              <strong className="text-white">CSOAI</strong> (body) — measurement, insurers, government
            </li>
            <li>
              <strong className="text-white">MEOK</strong> (head) — arenas, NPC wallets, eval volume
            </li>
            <li>
              <strong className="text-white">Eunomia</strong> — <code className="text-xs">eunomia://</code> URI per
              crossing · {STACK_STATS.mcpServers} MCP rules
            </li>
          </ul>
          <Link href="/engine-axis">
            <span className="mt-4 inline-flex items-center gap-1 text-sm text-emerald-400 hover:underline">
              Engine axis map <ArrowRight className="h-3 w-3" />
            </span>
          </Link>
        </section>

        <section className="text-xs text-slate-500 border-t border-white/10 pt-6">
          <p>
            <Link href="/receipt-spec" className="text-emerald-400 hover:underline">
              RECEIPT-SPEC-0.1
            </Link>
            {" · "}
            <Link href="/ownership" className="text-emerald-400 hover:underline">
              100-move plan
            </Link>
            {" · "}
            Markdown:{" "}
            <a href="/docs/agent-runbook.md" className="text-emerald-400 hover:underline">
              /docs/agent-runbook.md
            </a>
            {" · "}
            <a href="/llms.txt" className="text-emerald-400 hover:underline">
              llms.txt
            </a>
          </p>
        </section>
      </div>
    </CouncilOsPageShell>
  );
}
