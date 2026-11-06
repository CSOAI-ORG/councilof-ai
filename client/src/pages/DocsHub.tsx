import type { ReactNode } from "react";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BookOpen,
  Terminal,
  ShieldCheck,
  BarChart3,
  Database,
  Receipt,
  ExternalLink,
} from "lucide-react";

/**
 * /docs — the documentation hub.
 *
 * WHY THIS EXISTS. The legacy docs page was withdrawn (2026) because it mixed
 * mock data with live claims — the withdrawal notice said so plainly. Visitors
 * kept hitting a tombstone at the highest-intent URL on the site. This hub
 * links ONLY surfaces that are live today, each labelled with what it is.
 * No mock data, no live-claim mixing, no prices (HO.2: the rail quote lives
 * in the 402 challenge; verification is free forever).
 */

const MCP_ADD = "claude mcp add --transport http council-of-ai https://councilof.ai/mcp";
const STDIO_ADD = "npx -y csoai-gspc-mcp";

function CodeLine({ text }: { text: string }) {
  return (
    <pre className="mt-2 overflow-x-auto rounded-md bg-muted px-3 py-2 text-xs leading-relaxed">
      <code>{text}</code>
    </pre>
  );
}

function ExtA({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a href={href} className="underline decoration-dotted underline-offset-2" target="_blank" rel="noreferrer">
      {children}
      <ExternalLink className="ml-1 inline-block h-3 w-3 align-[-1px]" />
    </a>
  );
}

function InA({ to, children }: { to: string; children: ReactNode }) {
  return (
    <Link to={to} className="underline decoration-dotted underline-offset-2">
      {children}
    </Link>
  );
}

export default function DocsHub() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="text-3xl font-semibold tracking-tight">Documentation</h1>
      <p className="mt-2 max-w-2xl text-muted-foreground">
        Every public surface, linked from one hub. The legacy docs page was
        withdrawn because it mixed mock data with live claims; this page links
        only what is live today. Measurement, never certification — and
        verification stays free forever.
      </p>

      <div className="mt-8 grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Terminal className="h-4 w-4" /> Connect an agent
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm">
            <p>
              Streamable HTTP door — the free tools cost nothing; metered tools quote at the 402 challenge:
            </p>
            <CodeLine text={MCP_ADD} />
            <p className="mt-3">Or stdio via npm:</p>
            <CodeLine text={STDIO_ADD} />
            <p className="mt-3">
              <InA to="/connect/">/connect</InA> — both doors, an A2A agent
              card, and client-config recipes for dozens of MCP hosts.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <BarChart3 className="h-4 w-4" /> Call the public API
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm">
            <p>
              The living board is keyless, CORS-open, and free:{" "}
              <InA to="/api-docs/">/api-docs</InA> documents{" "}
              <code className="rounded bg-muted px-1">GET /api/gspc</code> with
              curl / Python / JS examples.
            </p>
            <CodeLine text={"curl https://councilof.ai/api/gspc?axis=safety"} />
            <p className="mt-3">
              Machine-readable spec:{" "}
              <ExtA href="https://councilof.ai/openapi.json">/openapi.json</ExtA>{" "}
              (OpenAPI 3.1).
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <ShieldCheck className="h-4 w-4" /> Verify signed evidence
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm">
            <p>
              <InA to="/gspc-verify">/gspc-verify</InA> — paste any card (or its
              64-hex id) and the browser recomputes the hash and the Ed25519
              signature. No account, no key.
            </p>
            <p className="mt-3">
              Do it yourself, byte for byte:{" "}
              <ExtA href="https://councilof.ai/signed/HOW-TO-VERIFY.md">
                /signed/HOW-TO-VERIFY.md
              </ExtA>{" "}
              (key pinning, canonicalization rules, copy-paste Python).
            </p>
            <p className="mt-3">
              Public Merkle root:{" "}
              <ExtA href="https://councilof.ai/root.json">/root.json</ExtA> ·
              inclusion proofs:{" "}
              <ExtA href="https://councilof.ai/api/proof?sha=">/api/proof?sha=…</ExtA>
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <BookOpen className="h-4 w-4" /> Read the board
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm">
            <p>
              <InA to="/gspc">/gspc</InA> — the board itself.{" "}
              <InA to="/methodology/">/methodology</InA> — fleets, frozen banks,
              deterministic grading, separation tests.{" "}
              <InA to="/honesty/">/honesty</InA> — measurement scope and limitations.{" "}
              <InA to="/corrections">/corrections</InA> — the full public ledger
              of what we published and got wrong.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Database className="h-4 w-4" /> Data and mirrors
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm">
            <p>
              <ExtA href="https://huggingface.co/csoai">Hugging Face org</ExtA>{" "}
              — 145+ datasets incl. per-item rows and the evidence index.{" "}
              <ExtA href="https://pypi.org/project/csoai-gspc/">
                PyPI: csoai-gspc
              </ExtA>{" "}
              ·{" "}
              <ExtA href="https://www.npmjs.com/package/csoai-gspc-mcp">
                npm: csoai-gspc-mcp
              </ExtA>
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Receipt className="h-4 w-4" /> Metered evidence and commissioned work
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm">
            <p>
              Metered endpoints sell issuance, assembly and independent
              signatures — never a grade, never a verdict. The authoritative
              amount for any call is the one printed in its live 402 challenge;
              this site shows no prices by rule.
            </p>
            <p className="mt-3">
              Catalog of every metered endpoint, each with its live-quote link:{" "}
              <InA to="/metered">/metered</InA>.{" "}
              Overview of the rail:{" "}
              <InA to="/dashboard?task=pricing-overview&tab=measured">
                Council OS → pricing overview
              </InA>
              . Invoiced commissioned runs: <InA to="/contact">/contact</InA>.
            </p>
          </CardContent>
        </Card>
      </div>

      <p className="mt-8 text-xs text-muted-foreground">
        Status of every surface above: <InA to="/status">/status</InA>. Found a
        dead link or a claim that does not read back?{" "}
        <InA to="/contact">Tell us</InA> — it becomes a corrections entry.
      </p>
    </div>
  );
}
