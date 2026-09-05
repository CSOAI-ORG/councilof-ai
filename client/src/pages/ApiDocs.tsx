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
 * no API keys, no /v1/* SaaS surface, no tiers. Published measurement cards
 * carry their own verification/recomputation rules. The board also exposes
 * explicitly labelled aggregates for axes without public per-model cards.
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
print(board["totals"]["axes"], "axes")
print(board["totals"]["separated_leads"], "separated,",
      board["totals"]["ties"], "ties")

# separation is optional: deterministic-fact axes have no fleet comparison.
# A separated row may publish either a paired p-value or another stated basis.
for a in board.get("axes", []):
    if a.get("separation") != "SEPARATED":
        continue
    p = a.get("separation_p")
    basis = a.get("separation_basis")
    evidence = f"p={p}" if p is not None else (basis or "basis not published")
    print(a.get("axis"), a.get("accuracy"), evidence)`;

  const javascriptExample = `// Browser or Node — no key, CORS is open.
const board = await fetch("https://councilof.ai/api/gspc").then((r) => r.json());

console.log(board.schema);        // "csoai.gspc-axes/0.5"
console.log(board.totals);        // { axes, measured_axes, items, separated_leads, ties, ... }

// One axis:
const gov = await fetch("https://councilof.ai/api/gspc?axis=governance")
  .then((r) => r.json());
const firstAxis = gov.axes?.[0];
console.log({
  separation: firstAxis?.separation ?? "NOT_APPLICABLE",
  separation_p: firstAxis?.separation_p ?? null,
  separation_basis: firstAxis?.separation_basis ?? null,
});`;

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
    "public_count": "<derived: N axis · M measured>",
    "measured_axes": "<derived>",
    "quotable_axes": "<derived>",
    "items": "<sum of per-axis n>",
    "separated_leads": "<derived>",
    "ties": "<derived>",
    "untested_separations": "<derived>"
  },
  "axes": [
    {
      "axis": "safety",
      "family": "gspc",
      "kind": "model-comparison",
      "bench": "DefBench",
      "task": "calibrated refusal on paired requests",
      "n": 36,
      "accuracy": 0.944,
      "leader": "gemma3:12b (base model)",
      "separation": "TIE",
      "separation_p": 0.6875,
      "interval": [0.819, 0.985],
      "fleet_mean": 0.732,
      "macro_f1": 0.944,
      "unparsed_rate": 0.0541,
      "status": "MEASURED",
      "dataset": "csoai/gspc-agi"
    },
    {
      "axis": "reserve-attestation",
      "family": "financial",
      "kind": "deterministic-facts",
      "n": 16,
      "status": "MEASURED",
      "evidence_url": "/interop/financial-measure-run-reserve-attestation.json"
      // no leader, accuracy or separation: no fleet comparison applies
    }
    // ... remaining axes
  ],
  "measured_in_lane": [ /* in-lane instrument-honesty, human-vs-ai — not the board */ ],
  "site_attestation": {
    "attests": "integrity of this board snapshot as published by the site (NOT a re-measurement)",
    "signer": "did:web:csoai.org#board-attestation-1",
    "alg": "Ed25519",
    "sig": "<present only when the board signing key is healthy>"
  },
  "limitations": [ "Read the live, derived limitations supplied with the board.", "..." ]
}`;

  const FIELDS = [
    { f: "schema", d: "Always csoai.gspc-axes/0.5 — the payload contract version." },
    { f: "issuer", d: "CSOAI Ltd (GB, Companies House 16939677)." },
    { f: "doi", d: "10.5281/zenodo.21991104 — the citable dataset record. Axis counts live in the payload." },
    { f: "totals.public_count / measured_axes / quotable_axes", d: "Derived from axes[]: published slots, rows whose status is MEASURED, and quotable MEASURED rows. A measurement does not imply a public leader or a completed separation test. Read the live numbers — do not type them here." },
    { f: "totals.separated_leads / ties / untested_separations", d: "Derived only over measured model-comparison axes. A TIE is not a win; a deterministic-fact axis has no applicable separation test. These counts move — read them from the live payload." },
    { f: "totals.items", d: "Sum of per-axis n across the selection. Read the live number from the payload." },
    { f: "axes[].n / accuracy / interval", d: "n is the per-axis measurement size. accuracy and interval are optional leader fields on model-comparison rows; withheld-leader and deterministic-fact rows omit them rather than inventing zeroes." },
    { f: "axes[].separation / separation_p / separation_basis", d: "Optional. Model-comparison axes may publish SEPARATED, TIE or UNTESTED. A tested row may carry a McNemar exact p or a stated alternative basis. Deterministic-fact axes have no applicable separation field." },
    { f: "axes[].fleet_mean / mean_harm", d: "Optional fleet aggregates. They describe the published aggregate run; they are not presented as a per-model card or public-leader score when public_leader_state is set." },
    { f: "axes[].per_model", d: "Jail only: verbatim per-model rows associated with the living-board source (TP/FP/TN/FN, precision, recall). Check measured_on.living_stamp.verification_state before relying on its attestation." },
    { f: "measured_in_lane", d: "In-lane instrument-honesty and human-vs-ai — served for honesty; NOT board-quotable and never counted in totals." },
    { f: "axes[].public_leader_state", d: "When present, explains why a measured fleet aggregate has no public leader: EXCLUDED_OWN_MODEL or NO_SIGNED_CARD. Such an aggregate is not presented as a card-backed ranking." },
    { f: "measured_on.living_stamp", d: "Read verification_state from the response. The historical stamp remains explicitly UNVERIFIABLE; a replacement stamp is emitted only when the board signing key is healthy." },
    { f: "site_attestation", d: "Optional. When present and valid, it attests integrity of the board snapshot bytes under #board-attestation-1. It does not re-run a measurement or turn uncarded aggregates into card-backed records." },
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
              No account, no API key, no tiers. Published carded predicates carry a
              verification path; uncarded fleet aggregates are labelled and do not claim one.
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
                  detector-interop, art5-safeguard, swarm, affect, jail, provenance-controls,
                  reserve-attestation, regulatory-framework, distribution-integrity,
                  custody-disclosure, ai-adoption-components, labour-components,
                  humanoid-labour-index.
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
                the public interface is a keyless JSON board. A valid optional site attestation
                proves snapshot integrity; it does not prove that every aggregate is independently
                recomputable.
              </p>
              <p>
                <strong className="text-foreground">Measurement, not certification.</strong> A
                carded score is a deterministic grade of recorded model outputs on its published
                split and carries a card verification path. Uncarded fleet aggregates remain
                explicitly labelled and publish no leader. A TIE means the leader's point-estimate
                lead is not statistically separated — ties are not wins.
              </p>
              <p>
                Machine consumers should prefer the registries over crawls: the MCP Registry entry
                and the A2A agent card are the authoritative machine interfaces. This endpoint is
                keyless; the published card formats and inclusion proofs can be checked offline.
              </p>
            </CardContent>
          </Card>

          {/* CTA */}
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4">See the board it powers</h2>
            <div className="flex items-center justify-center gap-4">
              <Link href="/dashboard?tab=leaderboard">
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
