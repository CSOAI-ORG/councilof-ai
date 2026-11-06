import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Coins, Unlock, ExternalLink } from "lucide-react";

/**
 * /metered — the metered-evidence catalog (a storefront without prices).
 *
 * DOCTRINE (HO.2, ruled): this page renders NO amounts. The authoritative
 * amount for any call is the one printed in its live 402 challenge — the
 * challenge IS the quote. Every row links to that live quote (the endpoint's
 * /preview door). Verification stays free forever. We sell issuance,
 * assembly, independent signatures and cadence — never a grade, never a
 * verdict, never a place on the board.
 */

type Row = { route: string; name: string; blurb: string; type: "data" | "probe" | "audit" };

const ROWS: Row[] = [
  { route: "/api/signed-data-feed", name: "Signed data feed", blurb: "Four-stream assembled public-series artifact, signed.", type: "data" },
  { route: "/api/proof", name: "Merkle inclusion proof", blurb: "Proof that a sha256 is a leaf of the live public root.", type: "data" },
  { route: "/api/receipts/batch", name: "Receipt batch", blurb: "Historical batch of signed measurement leaves with inclusion paths, plus the root index for the window.", type: "data" },
  { route: "/api/feeds/provider-diff", name: "Provider diff feed", blurb: "What changed across provider surfaces, as a feed.", type: "data" },
  { route: "/api/wrapper/changes", name: "Wrapper parity changes", blurb: "Change feed for wrapped-asset parity surfaces.", type: "data" },
  { route: "/api/wrapper/asset/usdc", name: "Wrapper parity — USDC", blurb: "Wrapped-asset parity state: read, not rated.", type: "data" },
  { route: "/api/wrapper/asset/usdt", name: "Wrapper parity — USDT", blurb: "Wrapped-asset parity state: read, not rated.", type: "data" },
  { route: "/api/wrapper/asset/dai", name: "Wrapper parity — DAI", blurb: "Wrapped-asset parity state: read, not rated.", type: "data" },
  { route: "/api/pop/stablecoins", name: "Proof-of-publication — stablecoins", blurb: "Snapshot feed tying claims to published bytes.", type: "data" },
  { route: "/api/pop/swift", name: "Proof-of-publication — SWIFT", blurb: "Snapshot feed tying claims to published bytes.", type: "data" },
  { route: "/api/pop/xrpl", name: "Proof-of-publication — XRPL", blurb: "Snapshot feed tying claims to published bytes.", type: "data" },
  { route: "/api/pop/x402-bazaar", name: "Proof-of-publication — x402 bazaar", blurb: "Snapshot feed tying claims to published bytes.", type: "data" },
  { route: "/api/pop/mcp-registry", name: "Proof-of-publication — MCP registry", blurb: "Snapshot feed tying claims to published bytes.", type: "data" },
  { route: "/api/pop/a2a", name: "Proof-of-publication — A2A", blurb: "Snapshot feed tying claims to published bytes.", type: "data" },
  { route: "/api/pop/ots-proofs", name: "Proof-of-publication — OTS proofs", blurb: "Snapshot feed tying claims to published bytes.", type: "data" },
  { route: "/api/pop/layer0", name: "Proof-of-publication — layer0", blurb: "Snapshot feed tying claims to published bytes.", type: "data" },
  { route: "/api/pop/corrections", name: "Proof-of-publication — corrections", blurb: "Snapshot feed tying claims to published bytes.", type: "data" },
  { route: "/api/pop/claim-watch", name: "Proof-of-publication — claim watch", blurb: "Snapshot feed tying claims to published bytes.", type: "data" },
  { route: "/api/request-attestation", name: "Commission a measurement receipt", blurb: "One signed card-v0 receipt for a named subject on the frozen bank; re-serves every signed card already on file.", type: "probe" },
  { route: "/api/rwa/evidence", name: "XRPL issued-asset evidence", blurb: "Deterministic on-ledger state: issuer flags, Domain, the two-way toml check, holder reads — every raw fetch hashed.", type: "probe" },
  { route: "/api/wrapper", name: "Wrapper parity probe", blurb: "Point-in-time parity probe of a wrapper surface.", type: "probe" },
  { route: "/api/measurement/fresh-capsule", name: "Fresh measurement capsule", blurb: "Commission a fresh capsule into the anchored index.", type: "probe" },
  { route: "/api/art50/marking-evidence", name: "Marking evidence (Article 50)", blurb: "Which machine-readable marks (C2PA, IPTC) the named methods detect in your bytes, right now. Evidence, never a conformity opinion.", type: "probe" },
  { route: "/api/ras/mcp-probe", name: "MCP server probe", blurb: "Handshake-level probe of one MCP endpoint.", type: "probe" },
  { route: "/api/ras/x402-check", name: "x402 resource check", blurb: "Does the resource answer a correct 402 challenge — or is it phantom.", type: "probe" },
  { route: "/api/ras/supply", name: "Supply evidence probe", blurb: "Point-in-time supply-state probe.", type: "probe" },
  { route: "/api/evidence-bundle", name: "Obligation evidence bundle", blurb: "Signed cards + retained inclusion proofs + an OSCAL wrapper + an assembly manifest, scoped to one obligation (article-50, article-53, dora, cra). Evidence for review — not a determination.", type: "audit" },
];

const FREE_DOORS = [
  { href: "https://councilof.ai/api/gspc", label: "GET /api/gspc", note: "the living board — keyless, CORS-open" },
  { href: "https://councilof.ai/gspc-verify", label: "/gspc-verify", note: "verify any card in the browser, no account" },
  { href: "https://councilof.ai/root.json", label: "/root.json", note: "the signed public Merkle root" },
  { href: "https://councilof.ai/signed/HOW-TO-VERIFY.md", label: "HOW-TO-VERIFY.md", note: "recompute every signature yourself" },
  { href: "https://councilof.ai/mcp/free", label: "/mcp/free", note: "the free-only MCP door — no sign-in or payment" },
];

const TYPE_LABEL: Record<Row["type"], string> = {
  data: "data artifact",
  probe: "probe artifact",
  audit: "audit artifact",
};

export default function X402Catalog() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="text-3xl font-semibold tracking-tight">Metered evidence catalog</h1>
      <p className="mt-2 max-w-3xl text-muted-foreground">
        Machine-payable evidence over the x402 rail (USDC on Base). No account,
        no contract, no minimum: your agent gets a 402 challenge, pays the exact
        amount printed in it, and receives a signed artifact. This page shows no
        prices by rule — <strong>the challenge is the quote.</strong> Follow any
        "live quote" link to read the real challenge for that endpoint right now.
      </p>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Coins className="h-4 w-4" /> What a metered call sells
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Issuance, assembly, an independent signature, cadence. Never a
            grade, a score, a pass/fail verdict, or a place on the board — the
            invariant is enforced in code, not in copy. A settled receipt
            unlocks the artifact; verification of every artifact stays free.
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Unlock className="h-4 w-4" /> Free doors (forever)
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm">
            <ul className="space-y-1">
              {FREE_DOORS.map((d) => (
                <li key={d.href}>
                  <a href={d.href} target="_blank" rel="noreferrer" className="font-medium underline decoration-dotted underline-offset-2">
                    {d.label}
                    <ExternalLink className="ml-1 inline-block h-3 w-3 align-[-1px]" />
                  </a>
                  <span className="text-muted-foreground"> — {d.note}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      <h2 className="mt-10 text-xl font-semibold tracking-tight">Metered endpoints</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Each row: what the artifact is, and its live quote. The rail and
        settlement details are published machine-first at{" "}
        <a href="https://councilof.ai/.well-known/x402.json" className="underline decoration-dotted underline-offset-2">
          /.well-known/x402.json
        </a>.
      </p>
      <div className="mt-4 overflow-x-auto rounded-lg border">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b bg-muted/50 text-left">
              <th className="px-3 py-2 font-medium">Endpoint</th>
              <th className="px-3 py-2 font-medium">What you get</th>
              <th className="px-3 py-2 font-medium">Kind</th>
              <th className="px-3 py-2 font-medium">Live quote</th>
            </tr>
          </thead>
          <tbody>
            {ROWS.map((r) => (
              <tr key={r.route} className="border-b align-top last:border-b-0">
                <td className="px-3 py-2 font-mono text-xs">{r.route}</td>
                <td className="px-3 py-2">
                  <span className="font-medium">{r.name}</span>
                  <span className="block text-muted-foreground">{r.blurb}</span>
                </td>
                <td className="px-3 py-2">
                  <Badge variant="outline">{TYPE_LABEL[r.type]}</Badge>
                </td>
                <td className="px-3 py-2 whitespace-nowrap">
                  <a
                    href={"https://councilof.ai" + r.route + "/preview"}
                    target="_blank"
                    rel="noreferrer"
                    className="underline decoration-dotted underline-offset-2"
                    title={"Read the live 402 challenge for " + r.route + " — the challenge is the quote"}
                  >
                    quote
                    <ExternalLink className="ml-1 inline-block h-3 w-3 align-[-1px]" />
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="mt-8 text-xs text-muted-foreground">
        A listing proves distribution, not value: what every buyer received is
        a signed artifact any third party can verify for free. Invoiced
        commissioned runs (larger banks, custom obligations) are scoped through{" "}
        <a href="https://councilof.ai/contact" className="underline decoration-dotted underline-offset-2">/contact</a>.
      </p>
    </div>
  );
}
