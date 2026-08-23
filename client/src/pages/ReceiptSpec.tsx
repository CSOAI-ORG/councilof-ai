import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, Download, ExternalLink, Shield, Bot } from "lucide-react";
import { StackHonestyBanner } from "@/components/StackHonestyBanner";
import { openLobby } from "@/lib/lobbyLink";

/**
 * /receipt-spec — RECEIPT-SPEC-0.1 public surface (Phase 1 move #1 + #4).
 */
export default function ReceiptSpec() {
  return (
    <div className="min-h-screen bg-[#04070d] text-slate-200">
      <header className="border-b border-white/8 bg-[#080c14]">
        <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
          <Badge className="mb-4 border-emerald-500/40 bg-emerald-950/40 text-emerald-300">
            RECEIPT-SPEC-0.1 · Published
          </Badge>
          <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
            Agent measurement card — the format that owns the field
          </h1>
          <p className="mt-4 text-slate-400 leading-relaxed">
            Media type <code className="text-emerald-400 text-sm">csoai.measurement-card/0.1</code>.
            Ed25519 canonical envelope · score vector · 3-path verification · independence doctrine.
            Measurement, not certification.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <a href="/docs/SOVOS/RECEIPT-SPEC-0.1.md" download>
              <Button className="bg-emerald-600 hover:bg-emerald-700 gap-2">
                <Download className="h-4 w-4" />
                Download spec
              </Button>
            </a>
            <a
              href="/.well-known/schemas/agent-measurement-card.schema.json"
              target="_blank"
              rel="noreferrer"
            >
              <Button variant="outline" className="border-white/15 text-slate-300 gap-2">
                <FileText className="h-4 w-4" />
                JSON Schema
              </Button>
            </a>
            <Link href="/gspc-verify">
              <Button variant="outline" className="border-white/15 text-slate-300 gap-2">
                <Shield className="h-4 w-4" />
                Verify a card
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 space-y-10">
        <StackHonestyBanner />

        <section className="prose prose-invert prose-sm max-w-none">
          <h2>Why this spec</h2>
          <p>
            OpenRouter owns model routing because they published the API everyone copied.{" "}
            <strong>RECEIPT-SPEC-0.1</strong> is the governance equivalent: the public measurement-card /
            signed-receipt format — media type, canonical JSON, Ed25519 envelope, score vector, axes
            (&quot;13 measured of 14&quot;), three verification paths, and alignment with RFC 9943/9942 + WEXP.
          </p>
          <p>Whoever defines the receipt format others adopt owns the field. We built it on the live estate.</p>

          <h2>Three-path verification</h2>
          <ol>
            <li>
              <strong>Browser</strong> — paste at{" "}
              <Link href="/gspc-verify" className="text-emerald-400">
                /gspc-verify
              </Link>{" "}
              (client-side WebCrypto)
            </li>
            <li>
              <strong>CLI</strong> — fetch <code>/.well-known/did.json</code>, recompute hash, verify Ed25519
            </li>
            <li>
              <strong>SCITT receipt</strong> — SCRAPI registration (planned; stated honestly in scitt.json)
            </li>
          </ol>

          <h2>Bindings</h2>
          <ul>
            <li>
              Schema:{" "}
              <a href="/.well-known/schemas/agent-measurement-card.schema.json" className="text-emerald-400">
                /.well-known/schemas/agent-measurement-card.schema.json
              </a>
            </li>
            <li>
              SCITT profile:{" "}
              <a href="/.well-known/scitt.json" className="text-emerald-400">
                /.well-known/scitt.json
              </a>
            </li>
            <li>Signer: <code>did:web:csoai.org#card-attestation-1</code></li>
            <li>
              Ownership plan:{" "}
              <a href="/docs/SOVOS/OWNERSHIP-100-MOVES-2026-08-23.md" className="text-emerald-400">
                100 moves
              </a>
            </li>
          </ul>

          <h2>Independence doctrine</h2>
          <p>
            Per the{" "}
            <Link href="/firewall-charter" className="text-emerald-400">
              Firewall Charter
            </Link>
            : we measure; we never fix what we measure. No conformity mark. Corrections append-only at{" "}
            <code>/api/corrections</code>. <code>timestamp_authority: none</code> until OTS is honestly wired.
          </p>
        </section>

        <section className="rounded-xl border border-violet-500/30 bg-violet-950/20 p-6">
          <h2 className="text-lg font-semibold text-violet-200 mb-2 flex items-center gap-2">
            <Bot className="h-5 w-5" />
            For agents
          </h2>
          <p className="text-sm text-slate-400 mb-4">
            curl the board, fetch the schema, verify without an account.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link href="/agent-runbook">
              <Button size="sm" className="bg-violet-700 hover:bg-violet-800">
                Agent runbook
              </Button>
            </Link>
            <a href="https://csoai.org/.well-known/did.json" target="_blank" rel="noreferrer">
              <Button size="sm" variant="outline" className="border-white/15 gap-1">
                did.json <ExternalLink className="h-3 w-3" />
              </Button>
            </a>
          </div>
        </section>
      </div>
    </div>
  );
}
