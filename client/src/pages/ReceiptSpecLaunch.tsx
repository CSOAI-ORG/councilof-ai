import { Link } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowRight, FileText } from "lucide-react";

/**
 * Phase 5 move #81 — launch post for RECEIPT-SPEC-0.1.
 */
export default function ReceiptSpecLaunch() {
  return (
    <article className="min-h-screen bg-background">
      <div className="container max-w-2xl py-16">
        <Badge variant="outline" className="mb-4">
          23 August 2026 · Standards
        </Badge>
        <h1 className="text-4xl font-bold tracking-tight mb-4">
          We published the receipt — so governance measurement has a format, not just a slogan
        </h1>
        <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
          RECEIPT-SPEC-0.1 defines the CSOAI agent measurement card: ~3KB JSON, Ed25519-signed,
          stranger-verifiable, aligned with SCITT (RFC 9943). This is how a field gets owned — not by
          claiming monopoly, but by publishing the envelope everyone else must cite.
        </p>

        <div className="prose prose-neutral dark:prose-invert max-w-none space-y-6">
          <h2>What shipped</h2>
          <ul>
            <li>
              <strong>RECEIPT-SPEC-0.1</strong> — media type, canonicalization, score vector, 3-path verify
            </li>
            <li>
              <strong>JSON Schema</strong> at{" "}
              <code>/.well-known/schemas/agent-measurement-card.schema.json</code>
            </li>
            <li>
              <strong>Live estate</strong> — 13 measured GSPC axes, 291 MCP routes, honesty register, DSH =
              Council OS
            </li>
          </ul>

          <h2>Art 50 and SB 315 — buyer-side, ready today</h2>
          <p>
            EU AI Act Article 50 transparency duties are live (2 Aug 2026). US state laws (including
            California SB 315-style deployer obligations) push evidence to the buyer. A measurement card
            is deployer due diligence you can verify in 60 seconds — not a conformity mark from a body
            with something to sell.
          </p>

          <h2>Measurement, not certification</h2>
          <p>
            The spec says what it does not claim: no safety verdict, no compliance certificate, no
            timestamp authority until honestly wired. Empty cells stay empty. Corrections append; they
            never silently edit.
          </p>

          <h2>The Y-axis</h2>
          <p>
            GRC platforms sell the checkbox. Model routers sell the token. We sell the{" "}
            <em>receipt</em> — the signed observation on a frozen instrument. That is a different axis,
            and it compounds: every routed execution can emit a card; every arena round feeds eval data;
            every insurer prices against cells that verify offline.
          </p>
        </div>

        <div className="mt-10 flex flex-wrap gap-3">
          <Link href="/receipt-spec">
            <Button className="gap-2">
              <FileText className="h-4 w-4" />
              Read RECEIPT-SPEC-0.1
            </Button>
          </Link>
          <Link href="/agent-runbook">
            <Button variant="outline" className="gap-2">
              Agent runbook
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          <Link href="/gspc-verify">
            <Button variant="outline">Verify a card</Button>
          </Link>
        </div>

        <p className="mt-12 text-sm text-muted-foreground border-t pt-6">
          CSOAI Ltd · UK Companies House 16939677 ·{" "}
          <Link href="/ownership" className="text-primary hover:underline">
            100-move ownership plan
          </Link>
        </p>
      </div>
    </article>
  );
}
