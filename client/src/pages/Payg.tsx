import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Zap, Coins } from "lucide-react";

const PRICING_STATUS = "Machine-access pricing is pending a published ruling — not yet set";

const TIERS = [
  { label: "Free daily", note: "100 free calls/day per key" },
  { label: "Standard card", note: "signed + hash-chained", popular: true },
  { label: "Deep bundles", note: "governance · safety+provenance · full spectrum" },
];

const INSTRUMENTS = ["Governance", "Safety", "Provenance", "Continuity", "Conformance", "Openness", "Full spectrum"];

export default function Payg() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-16">
      <div className="text-center mb-12">
        <Badge variant="secondary" className="mb-4">Agent rail · pay-per-call · no subscription</Badge>
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">
          One key. Every instrument. <span className="text-primary">Signed measurement cards.</span>
        </h1>
        <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
          100 free calls a day, then metered machine-access. {PRICING_STATUS}.
          Every call returns a 3KB Ed25519-signed, hash-chained card your auditor verifies
          independently. Metered, balance never expires, no monthly seat.
        </p>
        <div className="mt-5 flex flex-wrap justify-center gap-2">
          {INSTRUMENTS.map((m) => (
            <Badge key={m} variant="outline">{m}</Badge>
          ))}
        </div>
      </div>
      <div className="grid md:grid-cols-3 gap-4 mb-14">
        {TIERS.map((t) => (
          <Card key={t.label} className={`p-6 flex flex-col items-center text-center ${t.popular ? "border-primary ring-1 ring-primary" : ""}`}>
            {t.popular && <Badge className="mb-2">Most used</Badge>}
            <div className="text-lg font-extrabold">{t.label}</div>
            <div className="text-xs font-medium text-muted-foreground mt-2">Pricing pending ruling</div>
            <div className="text-xs text-muted-foreground mt-1 mb-4">{t.note}</div>
            <Button asChild className="w-full">
              <a href="/start">Get a free key →</a>
            </Button>
          </Card>
        ))}
      </div>
      <Card className="p-6 mt-10 border-amber-400/40">
        <h2 className="text-xl font-bold mb-2">East-West packs — pricing pending a published ruling</h2>
        <p className="text-sm text-muted-foreground">
          Crosswalk evidence packs are data. Bridge tooling is a license. Scores and rankings are £0 forever.
          Regulators consume signed streams at £0 forever. No ranked entity pays or is paid in either direction.
          The owner pricing ruling is unpublished — this page will not invent a number.
        </p>
        <p className="text-sm mt-3">
          <a href="/east-west/pricing" className="underline">Read the East-West doctrine →</a>
        </p>
      </Card>
    </div>
  );
}
