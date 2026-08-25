import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Shield, Ban, Layers } from "lucide-react";

/**
 * Option A — white-label / “Powered by Council OS” attestation licensing.
 * Measurement opinions only. Attestation ≠ tokenization ≠ ownership.
 * Pricing pending published ruling — no invented list prices as MEASURED.
 * Canon: docs/EAT_DSH_ALIGNMENT.md · compass wf-b01660de
 */

const MESSAGING_LOCK =
  "Attestations are independent, cryptographically verifiable opinions/measurements about an asset. They are not tokens, NFTs, or ownership claims. They do not tokenize anything and confer no title.";

const SHAPES = [
  {
    title: "Embed our signed verdicts",
    body: "Your product shows Council OS / GSPC cards. We still sign (Ed25519). “Powered by Council OS” badge. Child API keys for partners.",
  },
  {
    title: "License the engine; we countersign",
    body: "You run the methodology instance in your environment. Our signature remains the credibility anchor — Chainlink-style independent verification inside your stack.",
  },
];

const METERS = [
  { label: "Enterprise license", note: "Engine + white-label front-end · quote-based" },
  { label: "Per signed verdict", note: "Consumption unit = the metered card / API call" },
  { label: "Dashboard seats", note: "Human operators on AG-UI cards · not a grade fee" },
  { label: "Self-serve API", note: "Low tier to seed adoption · pricing pending ruling" },
];

const NEVER = [
  "Never sell a score, grade, or placement",
  "Never claim an attestation tokenizes or confers rights",
  "Never mint ownership instruments (that is a regulated issuer’s job)",
  "Never invent list prices before a published ruling",
];

export default function PoweredBy() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-16">
      <div className="mb-12 text-center">
        <Badge variant="secondary" className="mb-4">
          Option A · white-label attestation · not tokenization
        </Badge>
        <h1 className="text-4xl font-extrabold tracking-tight md:text-5xl">
          Powered by <span className="text-primary">Council OS</span>
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
          License the measurement engine and AG-UI cards. Embed signed verdicts in your product —
          or run the methodology yourself while we countersign. Stays in the opinion/measurement lane.
        </p>
      </div>

      <Card className="mb-10 border-amber-500/30 bg-amber-500/5 p-6">
        <h2 className="mb-2 flex items-center gap-2 text-lg font-bold">
          <Ban className="h-5 w-5 text-amber-600" aria-hidden />
          Messaging lock
        </h2>
        <p className="text-sm leading-relaxed text-muted-foreground">{MESSAGING_LOCK}</p>
        <p className="mt-3 text-xs text-muted-foreground">
          Canon:{" "}
          <a href="/competitors" className="underline">
            /competitors
          </a>{" "}
          RWA EAT · <code className="text-xs">docs/EAT_DSH_ALIGNMENT.md</code>
        </p>
      </Card>

      <h2 className="mb-4 flex items-center gap-2 text-xl font-bold">
        <Layers className="h-5 w-5 text-primary" aria-hidden />
        Two licensing shapes
      </h2>
      <div className="mb-12 grid gap-4 md:grid-cols-2">
        {SHAPES.map((s) => (
          <Card key={s.title} className="p-6">
            <h3 className="font-bold">{s.title}</h3>
            <p className="mt-2 text-sm text-muted-foreground">{s.body}</p>
          </Card>
        ))}
      </div>

      <h2 className="mb-4 flex items-center gap-2 text-xl font-bold">
        <Shield className="h-5 w-5 text-primary" aria-hidden />
        What we meter
      </h2>
      <p className="mb-4 text-sm text-muted-foreground">
        Machine-access and seat pricing are pending a published ruling — not yet set. Order-of-magnitude
        market bands (enterprise compliance data) are indicative only, not our quotes or MEASURED revenue.
      </p>
      <div className="mb-12 grid gap-4 sm:grid-cols-2">
        {METERS.map((m) => (
          <Card key={m.label} className="p-5">
            <div className="font-extrabold">{m.label}</div>
            <div className="mt-1 text-xs font-medium text-muted-foreground">Pricing pending ruling</div>
            <p className="mt-2 text-sm text-muted-foreground">{m.note}</p>
          </Card>
        ))}
      </div>

      <Card className="mb-10 p-6">
        <h2 className="mb-3 flex items-center gap-2 text-lg font-bold">
          <Check className="h-5 w-5 text-primary" aria-hidden />
          Hard “never”
        </h2>
        <ul className="space-y-2 text-sm text-muted-foreground">
          {NEVER.map((n) => (
            <li key={n}>• {n}</li>
          ))}
        </ul>
      </Card>

      <div className="flex flex-wrap justify-center gap-3">
        <Button asChild>
          <a href="/start">Talk design partnership →</a>
        </Button>
        <Button asChild variant="outline">
          <a href="/payg">Agent PAYG rail →</a>
        </Button>
        <Button asChild variant="outline">
          <a href="/competitors">RWA EAT targets →</a>
        </Button>
        <Button asChild variant="outline">
          <a href="/mcp">MCP tools →</a>
        </Button>
      </div>

      <p className="mt-10 text-center text-xs text-muted-foreground">
        Tokenization-as-a-service (Option B) is partner-only with a regulated issuer/transfer agent — not this page.
        Becoming the issuer (Option C) is out of near-term scope.
      </p>
    </div>
  );
}
