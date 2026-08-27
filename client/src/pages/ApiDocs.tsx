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

/**
 * /api-docs — the REAL public API.
 *
 * There is one public, keyless endpoint: councilof.ai/api/gspc. It returns the
 * living GSPC board (schema csoai.gspc-axes/0.5) — the exact shape served by
 * functions/api/gspc.ts. Slot counts live in totals.public_count. No accounts,
 * no API keys, no /v1/* SaaS surface, no tiers. Everything here is recomputable
 * from the published harness.
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

  const curlExample = `# The living board (keyless — no auth header). Counts: totals.public_count
curl https://councilof.ai/api/gspc

# A single axis
curl "https://councilof.ai/api/gspc?axis=governance"

# An unknown axis returns 404 with the list of known axis
curl "https://councilof.ai/api/gspc?axis=nope"
# => { "error": "unknown axis", "known": [ "governance", "safety", ... ] }`;

  const pythonExample = `import urllib.request, json

# No API key. The endpoint is public and CORS-open.
with urllib.request.urlopen("https://councilof.ai/api/gspc") as r:
    board = json.load(r)

print(board["schema"])            # csoai.gspc-axes/0.5
print(board["doi"])               # 10.5281/zenodo.21991104
print(board["totals"]["axis"], "axis")
print(board["totals"]["separated_leads"], "separated,",
      board["totals"]["ties"], "ties")

# A separated lead is a real, statistically distinguished result;
# a TIE is a point-estimate lead only. Ties are not wins.
for a in board["axis"]:
    if a["separation"] == "SEPARATED":
        print(a["axis"], a["accuracy"], "p=", a["separation_p"])`;

  const javascriptExample = `// Browser or Node — no key, CORS is open.
const board = await fetch("https://councilof.ai/api/gspc").then((r) => r.json());

console.log(board.schema);        // "csoai.gspc-axes/0.5"
console.log(board.totals);        // { axis, measured_axes, items, separated_leads, ties, ... }

// One axis:
const gov = await fetch("https://councilof.ai/api/gspc?axis=governance")
  .then((r) => r.json());
console.log(gov.axes[0].separation, gov.axes[0].separation_p);`;

  const responseExample = `{
  "schema": "csoai.gspc-axes/0.5",
  "issuer": "CSOAI Ltd (GB, Companies House 16939677)",
  "doi": "10.5281/zenodo.21991104",
  "measured_on": {
    "model": "fleet and date live on the payload — not typed on this page",
    "date": "see measured_on.date",
    "grading": "deterministic grading; item count lives on the payload"
  },
  "totals": {
    "public_count": "<derived: N measured of M quotable>",
    "measured_axes": "<derived>",
    "quotable_axes": "<derived>",
    "items": "<sum of per-axis n>",
    "separated_leads": "<derived>",
    "ties": "<derived>",
    "untested_separations": "<derived>"
  },
  "axis": [
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
    // ... remaining axis
  ],
  "measured_in_lane": [ /* in-lane instrument-honesty, human-vs-ai — not the board */ ],
  "limitations": [ "N of the measured axis show a statistically separated leader ...", "..." ]
}`;

  const FIELDS = [
    { f: "schema", d: "Always csoai.gspc-axes/0.5 — the payload contract version." },
    { f: "issuer", d: "CSOAI Ltd (GB, Companies House 16939677)." },
    { f: "doi", d: "10.5281/zenodo.21991104 — the citable dataset record. Axis counts live in the payload." },
    { f: "totals.public_count / measured_axes / quotable_axes", d: "Derived from the payload (MEASURED axis with a completed separation test, vs all quotable MEASURED rows). Jail is MEASURED; living-board separation is TIE (not a separated leader). Read the live numbers — do not type them here." },
    { f: "totals.separated_leads / ties", d: "Separated (McNemar p<0.05 on discordant items), ties, and untested. A TIE is not a win. These counts move — read them from the live payload, not from this page." },
    { f: "totals.items", d: "Sum of per-axis n across the selection. Read the live number from the payload." },
    { f: "axes[].n / accuracy / interval", d: "Per-axis item count, the LEADER's accuracy, and its Wilson 95% CI where n is honestly independent." },
    { f: "axes[].separation / separation_p", d: "SEPARATED, TIE or UNTESTED, with the McNemar exact p on discordant pairs vs the best base model where the test has run." },
    { f: "axes[].fleet_mean / mean_harm", d: "The axis's measured-fleet mean, and (canonical axis only) the severity-weighted failure mass the accuracy hides." },
    { f: "axes[].per_model", d: "Jail only: the verbatim per-model rows from the signed living board (TP/FP/TN/FN, precision, recall)." },
    { f: "measured_in_lane", d: "In-lane instrument-honesty and human-vs-ai — served for honesty; NOT board-quotable and never counted in totals." },
    { f: "measured_on.living_stamp", d: "The living-board stamp for jail and the in-lane measurements. MARKED UNVERIFIABLE 2026-08-26: it carries an Ed25519 signature, but no published bytes reproduce it (58,184 readings attempted, 0 verified), two different signatures exist for the same stamp, and its signer is not among the keys in did.json. It publishes verification_state UNVERIFIABLE and must not be treated as a valid attestation. The attestations that DO verify are site_attestation on this payload (#board-attestation-1) and the 150 cards (#card-attestation-1)." },
    { f: "axes[].unparsed_rate", d: "Share of responses no label could be read from — reported, never scored as a wrong answer." },
    { f: "axes[].status", d: "MEASURED / UNMEASURED / DRAFT / SPEC / PLANNED. UNMEASURED is reported with its n, never hidden." },
  ];

  return (
    <div className="min-h-screen bg-background">
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
              living board as JSON. Slot counts live in totals.public_count.
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
                { method: "GET", endpoint: "/api/gspc", desc: "The living board (counts in totals.public_count)" },
                { method: "GET", endpoint: "/api/gspc?axis=<name>", desc: "One axis (404 lists known axis)" },
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
                  detector-interop, art5-safeguard, swarm, affect, jail.
                </p>
              </div>
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
                ties are not wins, and we do not publish a typed win-count.
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
              <Link href="/leaderboard">
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
