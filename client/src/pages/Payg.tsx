import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Zap, Coins } from "lucide-react";

// PAYG (pay-per-call / x402) landing — restores councilof.ai/payg (was 404).
// Pairs the two pricing axes: subscription (see /pricing) OR pay-per-call here.
// NOTE for lane: wire the real per-top-up Stripe Payment Links + the x402/USDC rail.
// The previous static page used the known mis-wired shared Stripe link — do NOT reuse it.

const TOPUPS = [
  { price: "£10", calls: "≈ 200 calls", popular: false },
  { price: "£50", calls: "≈ 1,000 calls", popular: true },
  { price: "£200", calls: "≈ 4,000 calls", popular: false },
];

const MCPS = ["EU AI Act", "DORA", "NIS2", "CRA", "CSRD", "GDPR", "ISO 42001"];

export default function Payg() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-16">
      <div className="text-center mb-12">
        <Badge variant="secondary" className="mb-4">Pay-per-call · No subscription</Badge>
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">
          One key. Seven compliance MCPs. <span className="text-primary">£0.05 per call.</span>
        </h1>
        <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
          Top up once. Deduct per tool call across every MEOK compliance MCP — no monthly bill,
          no rate limit until the balance hits zero. The agent-native alternative to a £/mo seat.
        </p>
        <div className="mt-5 flex flex-wrap justify-center gap-2">
          {MCPS.map((m) => (
            <Badge key={m} variant="outline">{m}</Badge>
          ))}
        </div>
      </div>

      {/* Top-ups */}
      <div className="grid md:grid-cols-3 gap-4 mb-14">
        {TOPUPS.map((t) => (
          <Card key={t.price} className={`p-6 flex flex-col items-center text-center ${t.popular ? "border-primary ring-1 ring-primary" : ""}`}>
            {t.popular && <Badge className="mb-2">Most popular</Badge>}
            <div className="text-4xl font-extrabold">{t.price}</div>
            <div className="text-sm text-muted-foreground mt-1 mb-4">{t.calls} @ £0.05 each</div>
            <Button asChild className="w-full">
              <a href="/billing">Top up {t.price} →</a>
            </Button>
          </Card>
        ))}
      </div>

      {/* Setup */}
      <Card className="p-6 mb-10">
        <h2 className="text-xl font-bold mb-3 flex items-center gap-2"><Zap className="h-5 w-5 text-primary" /> Setup in 30 seconds</h2>
        <pre className="bg-muted rounded-lg p-4 text-sm overflow-x-auto">
{`export MEOK_PAYG_KEY="topup_xxxxxxxxxxxxxxxx"
pip install -U eu-ai-act-compliance-mcp nis2-compliance-mcp dora-compliance-mcp
# Every tool call now deducts £0.05 from your balance.
# When the balance hits zero, the tool returns a top-up URL.`}
        </pre>
      </Card>

      {/* Why PAYG */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card className="p-6">
          <h3 className="font-bold mb-3 flex items-center gap-2"><Check className="h-5 w-5 text-primary" /> Why pay-per-call</h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>• Works across all 7 compliance MCPs with one key</li>
            <li>• Same token across machines and CI</li>
            <li>• Balance never expires; top up any time</li>
            <li>• 1,000–10,000× cheaper than legacy GRC for low volume</li>
          </ul>
        </Card>
        <Card className="p-6">
          <h3 className="font-bold mb-3 flex items-center gap-2"><Coins className="h-5 w-5 text-primary" /> Two rails</h3>
          <p className="text-sm text-muted-foreground">
            Top up with <strong>Stripe</strong> (card) or <strong>USDC on Base L2</strong> via x402 for
            agent-to-agent payments. Every call is metered and the result is Ed25519-signed —
            so your auditor verifies the proof independently.
          </p>
        </Card>
      </div>

      <p className="text-center text-sm text-muted-foreground mt-10">
        Prefer a fixed monthly plan? See <a href="/pricing" className="underline">subscription pricing →</a>
      </p>
    </div>
  );
}
