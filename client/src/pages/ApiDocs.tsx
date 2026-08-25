import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Code,
  FileJson,
  Copy,
  CheckCircle,
  Terminal,
  Globe,
  ArrowRight,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import CouncilOsInnerNav from "@/components/os/CouncilOsInnerNav";

/**
 * /api-docs — the REAL public API.
 *
 * There is one public, keyless endpoint: councilof.ai/api/gspc. It returns the
 * GSPC 14-slot board, "13 measured of 14" (schema csoai.gspc-axes/0.5) — the exact
 * shape served by functions/api/gspc.ts. No accounts, no API keys, no /v1/* SaaS
 * surface, no tiers. Everything here is recomputable from the published harness.
 */

const BASE = "https://councilof.ai/api/gspc";

export default function ApiDocs() {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const copyToClipboard = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(id);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const curlExample = `# The whole 14-slot board (keyless — no auth header)
curl https://councilof.ai/api/gspc

# A single axis
curl "https://councilof.ai/api/gspc?axis=governance"

# An unknown axis returns 404 with the list of known axes
curl "https://councilof.ai/api/gspc?axis=nope"
# => { "error": "unknown axis", "known": [ "governance", "safety", ... ] }`;

  const pythonExample = `import urllib.request, json

# No API key. The endpoint is public and CORS-open.
with urllib.request.urlopen("https://councilof.ai/api/gspc") as r:
    board = json.load(r)

print(board["schema"])            # csoai.gspc-axes/0.5
print(board["doi"])               # 10.5281/zenodo.21991104
print(board["totals"]["axes"], "axes")
print(board["totals"]["separated_leads"], "separated,",
      board["totals"]["ties"], "ties")

# A separated lead is a real, statistically distinguished result;
# a TIE is a point-estimate lead only. Ties are not wins.
for a in board["axes"]:
    if a["separation"] == "SEPARATED":
        print(a["axis"], a["accuracy"], "p=", a["separation_p"])`;

  const javascriptExample = `// Browser or Node — no key, CORS is open.
const board = await fetch("https://councilof.ai/api/gspc").then((r) => r.json());

console.log(board.schema);        // "csoai.gspc-axes/0.5"
console.log(board.totals);        // { axes, measured_axes, items, separated_leads, ties, ... }

// One axis:
const gov = await fetch("https://councilof.ai/api/gspc?axis=governance")
  .then((r) => r.json());
console.log(gov.axes[0].separation, gov.axes[0].separation_p);`;

  const responseExample = `{
  "schema": "csoai.gspc-axes/0.5",
  "issuer": "CSOAI Ltd (GB, Companies House 16939677)",
  "doi": "10.5281/zenodo.21991104",
  "measured_on": {
    "model": "13 canonical axes: 19-model fleet. Jail (slot 14): 7-model fleet",
    "date": "2026-08-12 (13 canonical axes) · 2026-08-18 (jail)",
    "grading": "deterministic grading on 15,580 per-item rows (0 transport errors)"
  },
  "totals": {
    "axes": 14,
    "measured_axes": 13,
    "quotable_axes": 14,
    "items": 887,
    "separated_leads": 4,
    "ties": 9,
    "untested_separations": 1
  },
  "axes": [
    {
      "axis": "governance",
      "bench": "GovBench",
      "task": "EU AI Act risk-tier classification",
      "n": 237,
      "accuracy": 0.700,
      "leader": "council specialist:governance-v3",
      "separation": "SEPARATED",
      "separation_p": 0.0086,
      "interval": [0.639, 0.755],
      "fleet_mean": 0.490,
      "macro_f1": 0.705,
      "unparsed_rate": 0.0386,
      "status": "MEASURED",
      "dataset": "csoai/gspc-gov"
    }
    // ... 13 more axes
  ],
  "measured_in_lane": [ /* slot15 (instrument-honesty), human-vs-ai — in-lane only, not the board */ ],
  "limitations": [ "3 of the 13 canonical axes show a statistically separated leader ...", "..." ]
}`;

  const FIELDS = [
    { f: "schema", d: "Always csoai.gspc-axes/0.5 — the payload contract version." },
    { f: "issuer", d: "CSOAI Ltd (GB, Companies House 16939677)." },
    { f: "doi", d: "10.5281/zenodo.21991104 — the citable dataset record (13 canonical axes)." },
    { f: "totals.axes / measured_axes", d: "The 14-slot board: 13 canonical axes (same fleet, rows and grader) + jail (slot 14; smaller fleet, stated on the axis)." },
    { f: "totals.separated_leads / ties", d: "4 separated (McNemar p<0.05 on discordant items), 9 ties, 1 untested (jail has no separation test yet). A TIE is not a win. These counts move — read them from the live payload, not from this page." },
    { f: "totals.items", d: "Sum of per-axis n across the selection (890 across the 14-slot board)." },
    { f: "axes[].n / accuracy / interval", d: "Per-axis item count, the LEADER's accuracy, and its Wilson 95% CI where n is honestly independent." },
    { f: "axes[].separation / separation_p", d: "SEPARATED, TIE or UNTESTED, with the McNemar exact p on discordant pairs vs the best base model where the test has run." },
    { f: "axes[].fleet_mean / mean_harm", d: "The axis's measured-fleet mean, and (canonical axes only) the severity-weighted failure mass the accuracy hides." },
    { f: "axes[].per_model", d: "Jail only: the verbatim per-model rows from the signed living board (TP/FP/TN/FN, precision, recall)." },
    { f: "measured_in_lane", d: "slot15 (instrument-honesty) and human-vs-ai — measured in-lane on 6 models under the internal living-board convention. Served for honesty; NOT board-quotable and never counted in totals." },
    { f: "measured_on.living_stamp", d: "The signed living-board stamp: Ed25519 signer, signature, and sig_input recipe for jail and the in-lane measurements." },
    { f: "axes[].unparsed_rate", d: "Share of responses no label could be read from — reported, never scored as a wrong answer." },
    { f: "axes[].status", d: "MEASURED / UNMEASURED / DRAFT / SPEC / PLANNED. UNMEASURED is reported with its n, never hidden." },
  ];

  return (
    <div className="min-h-screen bg-background">
      <CouncilOsInnerNav title="API docs" subtitle="Public endpoints — GSPC, ecosystem, assess, AG-UI wire" />
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/">
            <div className="flex items-center gap-2 cursor-pointer">
              <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xs">CSOAI</span>
              </div>
              <span className="font-semibold text-lg">API Documentation</span>
            </div>
          </Link>
          <div className="flex items-center gap-3">
            <a href={BASE} target="_blank" rel="noopener noreferrer">
              <Button size="sm" className="gap-2">
                Open /api/gspc <ArrowRight className="w-4 h-4" />
              </Button>
            </a>
          </div>
        </div>
      </nav>

      <div className="pt-24 pb-20 px-4">
        <div className="container mx-auto max-w-5xl">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
              <Globe className="w-4 h-4" />
              Public · keyless · CORS-open
            </div>
            <h1 className="text-4xl font-bold mb-4">The GSPC axis API</h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              One public endpoint returns the GSPC (Governance · Safety · Provenance · Continuity)
              14-slot measurement board — 13 measured of 14 — as JSON.
              No account, no API key, no tiers. Every number is recomputable from the
              published harness.
            </p>
          </div>

          {/* The endpoint */}
          <Card className="mb-12">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileJson className="w-5 h-5" />
                The endpoint
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-12 gap-4 p-3 bg-muted/50 rounded-lg font-medium text-sm">
                <div className="col-span-2">Method</div>
                <div className="col-span-6">Endpoint</div>
                <div className="col-span-4">Returns</div>
              </div>
              {[
                { method: "GET", endpoint: "/api/gspc", desc: "The full 14-slot board" },
                { method: "GET", endpoint: "/api/gspc?axis=<name>", desc: "One axis (404 lists known axes)" },
                { method: "GET", endpoint: "/api/instruments", desc: "Eunomia router index (291 MCP rules)" },
                { method: "GET", endpoint: "/api/finance/anatomy", desc: "Engine-axis map — MEASURED / SPEC / DESIGN per crossing" },
                { method: "GET", endpoint: "/api/finance/bond-crossing", desc: "Axis 18 synthetic crossing (MEASURED pilot)" },
                { method: "GET", endpoint: "/api/cross", desc: "Divergence layer — regulation × GSPC × reported baselines" },
                { method: "GET", endpoint: "/api/signal", desc: "SOV Signal Index — + crosswalk + MEOK arena leg (composed)" },
                { method: "GET", endpoint: "/api/receipt-spec", desc: "RECEIPT-SPEC-0.1 metadata" },
                { method: "POST", endpoint: "/api/agui/session?handle=<slug>", desc: "AG-UI wire session (503 until AGUI_WIRE_URL is set)" },
                { method: "GET", endpoint: "/api/agui/stream?session_id=<id>", desc: "AG-UI SSE stream — RUN_*, TEXT_MESSAGE_*, HITL consent" },
              ].map((api, i) => (
                <div key={i} className="grid grid-cols-12 gap-4 p-3 border-b last:border-0 text-sm">
                  <div className="col-span-2">
                    <span className="px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-700">
                      {api.method}
                    </span>
                  </div>
                  <div className="col-span-6 font-mono text-xs">{api.endpoint}</div>
                  <div className="col-span-4 text-muted-foreground">{api.desc}</div>
                </div>
              ))}
              <div className="mt-4 grid gap-2 text-sm text-muted-foreground">
                <p>
                  <strong className="text-foreground">Base URL:</strong>{" "}
                  <code className="text-xs">https://councilof.ai/api/gspc</code>
                </p>
                <p>
                  <strong className="text-foreground">Auth:</strong> none. The response sends{" "}
                  <code className="text-xs">access-control-allow-origin: *</code> and is cached
                  for 300s.
                </p>
                <p>
                  <strong className="text-foreground">Axes:</strong> governance, safety, provenance,
                  continuity, conformance, openness, machinery-conformity, care, cross-reality,
                  detector-interop, art5-safeguard, swarm, affect.
                </p>
                <p>
                  <strong className="text-foreground">Agents:</strong>{" "}
                  <Link href="/agent-runbook" className="text-primary hover:underline">
                    Agent runbook
                  </Link>
                  {" · "}
                  <Link href="/receipt-spec" className="text-primary hover:underline">
                    RECEIPT-SPEC-0.1
                  </Link>
                </p>
              </div>
            </CardContent>
          </Card>

          {/* AG-UI wire — Council OS Lane 2 */}
          <Card className="mb-12 border-l-4 border-l-violet-500">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Terminal className="w-5 h-5" />
                AG-UI wire (Council OS Lane 2)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-muted-foreground">
              <p>
                The Council Lobby runs three lanes: pane commands (local),{" "}
                <strong className="text-foreground">AG-UI SSE</strong> (streaming + HITL consent), and{" "}
                <strong className="text-foreground">POST /api/chat</strong> (published measurement or honest refuse).
                Lane 2 proxies same-origin through <code className="text-xs">/api/agui/*</code> to{" "}
                <code className="text-xs">AGUI_WIRE_URL</code> on Cloudflare Pages (RunPod wire, port 8785).
              </p>
              <div className="relative">
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute top-2 right-2 gap-2"
                  onClick={() =>
                    copyToClipboard(
                      `curl -sS -X POST 'https://councilof.ai/api/agui/session?handle=probe'\n# 503 + agui_wire_unconfigured until AGUI_WIRE_URL is set\n# 200 + session_id when live — then:\ncurl -sS -N 'https://councilof.ai/api/agui/stream?session_id=<id>'`,
                      "agui",
                    )
                  }
                >
                  {copiedCode === "agui" ? (
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </Button>
                <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-xs">
                  <code>{`# Start a session (instrument handle or probe slug)
curl -sS -X POST 'https://councilof.ai/api/agui/session?handle=probe'

# When AGUI_WIRE_URL is configured — SSE stream:
curl -sS -N 'https://councilof.ai/api/agui/stream?session_id=<session_id>'

# Unconfigured — honest 503, never the SPA shell:
# { "error": "agui_wire_unconfigured", "hint": "Set AGUI_WIRE_URL ..." }`}</code>
                </pre>
              </div>
              <p>
                Instrument pages seed handles via the Council OS lobby — see{" "}
                <Link href="/agent-runbook" className="text-primary hover:underline">
                  Agent runbook
                </Link>
                ,{" "}
                <Link href="/instruments" className="text-primary hover:underline">
                  Eunomia Router
                </Link>
                , and{" "}
                <Link href="/receipt-spec" className="text-primary hover:underline">
                  RECEIPT-SPEC-0.1
                </Link>
                . HITL consent checkpoints stay visible in the lobby thread; seeded prompts are typed, never auto-sent.
              </p>
            </CardContent>
          </Card>

          {/* Call it */}
          <Card className="mb-12">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Terminal className="w-5 h-5" />
                Call it
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="curl">
                <TabsList className="mb-4">
                  <TabsTrigger value="curl">cURL</TabsTrigger>
                  <TabsTrigger value="python">Python</TabsTrigger>
                  <TabsTrigger value="javascript">JavaScript</TabsTrigger>
                </TabsList>

                {[
                  { id: "curl", code: curlExample },
                  { id: "python", code: pythonExample },
                  { id: "javascript", code: javascriptExample },
                ].map(({ id, code }) => (
                  <TabsContent key={id} value={id}>
                    <div className="relative">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="absolute top-2 right-2 gap-2"
                        onClick={() => copyToClipboard(code, id)}
                      >
                        {copiedCode === id ? (
                          <CheckCircle className="w-4 h-4 text-green-600" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </Button>
                      <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
                        <code>{code}</code>
                      </pre>
                    </div>
                  </TabsContent>
                ))}
              </Tabs>
            </CardContent>
          </Card>

          {/* Response shape */}
          <Card className="mb-12">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Code className="w-5 h-5" />
                Response shape (schema csoai.gspc-axes/0.5)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative mb-6">
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute top-2 right-2 gap-2"
                  onClick={() => copyToClipboard(responseExample, "response")}
                >
                  {copiedCode === "response" ? (
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </Button>
                <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
                  <code>{responseExample}</code>
                </pre>
              </div>
              <div className="space-y-2">
                {FIELDS.map((row) => (
                  <div key={row.f} className="grid md:grid-cols-3 gap-2 text-sm border-b last:border-0 pb-2">
                    <code className="text-xs font-mono text-primary md:col-span-1">{row.f}</code>
                    <span className="text-muted-foreground md:col-span-2">{row.d}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* What it is not */}
          <Card className="mb-12 border-l-4 border-l-amber-500">
            <CardContent className="p-6 space-y-3 text-sm text-muted-foreground">
              <p>
                <strong className="text-foreground">There is no /v1/* SaaS API, no SDK to install,
                and no API key to request.</strong> This is a measurement body, not a platform:
                the public interface is a static, signed JSON board anyone can recompute.
              </p>
              <p>
                <strong className="text-foreground">Measurement, not certification.</strong> Every
                score is a deterministic grade of recorded model outputs on a frozen, published
                split. A TIE means the leader's point-estimate lead is not statistically separated —
                ties are not wins, and we do not publish &ldquo;our models win N of 13&rdquo;.
              </p>
              <p>
                Machine consumers should prefer the registries over crawls: the MCP Registry entry
                and the A2A agent card are the authoritative machine interfaces, and this endpoint
                is keyless and verifiable offline.
              </p>
            </CardContent>
          </Card>

          {/* CTA */}
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4">See the board it powers</h2>
            <div className="flex items-center justify-center gap-4">
              <Link href="/gspc-scoreboard">
                <Button size="lg" className="gap-2">
                  GSPC board v2 <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
              <Link href="/methodology">
                <Button size="lg" variant="outline" className="gap-2">
                  How it is measured
                </Button>
              </Link>
              <a href="https://github.com/CSOAI-ORG" target="_blank" rel="noopener noreferrer">
                <Button size="lg" variant="outline" className="gap-2">
                  <Globe className="w-4 h-4" />
                  Harness on GitHub
                </Button>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
