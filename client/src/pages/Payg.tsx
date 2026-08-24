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
        </p>
      </div>
    </div>
  );
}
