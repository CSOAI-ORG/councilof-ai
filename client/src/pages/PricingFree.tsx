import { useEffect } from "react";
import { Link } from "wouter";
import { setMetaDescription } from "@/lib/utils";

/**
 * /pricing-free — how the free rail and the metered rail fit together.
 *
 * Doctrine (owner rulings): verification is free forever; a grade is never sold; we measure and
 * never certify; no SaaS tiers, no card checkout, no public prices. Agents pay per ARTEFACT over
 * x402 (HTTP 402, USDC on Base, straight to the estate wallet). The amount for any artefact lives
 * ONLY inside that artefact's 402 challenge — this page names no number, by design (brand gate).
 */

const FREE = [
  { name: "Verify any card", href: "/gspc-verify", what: "Your browser recomputes the hash and checks the Ed25519 signature. Nothing is sent to us. No account. Free forever." },
  { name: "The live board", href: "/gspc-scoreboard", what: "Every quotable axis, measured or honestly UNMEASURED." },
  { name: "The API", href: "/api/gspc", what: "The same board, machine-readable. Agents welcome.", external: true },
  { name: "The public root + one inclusion proof", href: "/root.json", what: "root.json is never paywalled; one inclusion proof per call is free at /api/proof?sha=.", external: true },
  { name: "Signed enforcement record", href: "/api/fines", what: "First-Fine Watch, signed. Regulators and the public read every signed stream free.", external: true },
  { name: "The method", href: "/methodology", what: "The frozen rules every number is computed under." },
];

export const TIERS = [
  {
    id: "issuance",
    name: "Tier 1 — Commission a signed card",
    resource: "/api/request-attestation?subject=<id>&axis=<slug>",
    get: "One card-v0 receipt (≤3KB), Ed25519-signed under the board-attestation key, citing your settlement and re-serving every signed measurement card already on file for that subject.",
    never: "A payment never mints a MEASURED cell. Fresh cells appear only when a published run exists.",
  },
  {
    id: "evidence_bundle",
    name: "Tier 2 — Evidence bundle for an obligation",
    resource: "/api/evidence-bundle?obligation=article-50|article-53|dora|cra&subject=<s>&bundle=1",
    get: "OSCAL 1.1.0 assessment-results assembled from already-signed cards (observations, relevant-to), one signed manifest card, and the existing signed Article 50 pack where it applies.",
    never: "No finding says satisfied or not-satisfied. Your auditor keeps the compliance call. Not a conformity mark.",
  },
  {
    id: "data_feed",
    name: "Tier 3 — Signed data feed",
    resource: "/api/eunomia-data?feed=1",
    get: "One feed document: the signed signals index, the signed First-Fine Watch, root.json and the card index — every block carrying its published signature.",
    never: "Data, never a score product. Never a ranking. Never a rating.",
  },
] as const;

const STEPS = [
  { k: "1 · Ask", v: "GET the resource. You get HTTP 402 with an accepts[] entry: scheme exact, USDC on Base, the receiving address, and the amount for that artefact. The same body carries a free preview of what already exists, so nobody buys blind." },
  { k: "2 · Pay", v: "Any x402 client (for example @x402/fetch) signs a USDC transfer authorisation for exactly that amount and retries with the X-PAYMENT header. Funds go straight to the estate wallet; there is no card form, no account, no subscription." },
  { k: "3 · Settle", v: "We hand the receipt to a facilitator to verify and settle on-chain. Until settlement succeeds, nothing is granted — a header is not a payment." },
  { k: "4 · Receive", v: "The artefact returns with an X-PAYMENT-RESPONSE echo of the settlement. Verify it free at /gspc-verify, today or in ten years, without asking us." },
];

const RULES = [
  { k: "Measurement, not certification", v: "CSOAI LTD is an independent measurement body. It issues measurements and signed attestations, never certificates of conformity." },
  { k: "A grade is never sold", v: "No tier sells a score, a rank, a pass/fail, or a place on the board. You pay for issuance, assembly and a durable independent signature — never for the answer." },
  { k: "Recomputable for free", v: "Every artefact stands on public bytes. Whoever holds the card and the published key can recompute it with no service contact." },
  { k: "No financial instrument", v: "No token, no credit, no cash-settled index. An attestation is a signed opinion about an asset; it tokenises nothing and confers no ownership." },
  { k: "Open source", v: "The rail, the verifier and the schemas are Apache-2.0 / CC-BY in the public repo. Fork them." },
];

export default function PricingFree() {
  useEffect(() => {
    setMetaDescription(
      "Verification is free forever. Agents pay per signed artefact over x402 (USDC on Base) — issuance, assembly, cadence. A grade is never sold. Measurement, not certification.",
    );
  }, []);

  return (
    <div className="min-h-screen bg-[#03110b]">
      <main className="mx-auto max-w-5xl px-5 py-14 text-slate-100 sm:px-8">
        <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-emerald-400">Council of AI — the free rail and the metered rail</p>
        <h1 className="mt-3 max-w-3xl text-4xl font-extrabold leading-tight">Verification is free forever. Agents pay per artefact.</h1>
        <p className="mt-5 max-w-3xl text-lg leading-relaxed text-slate-300">
          Everything you need to check us is free and always will be. What an agent can buy is work with a signature on it —
          a commissioned card, an assembled evidence bundle, a feed pull — settled machine-to-machine over HTTP 402 in USDC on Base.
          No tiers, no seats, no checkout page. The amount for any artefact appears only inside its own 402 challenge.
        </p>

        <section aria-labelledby="free-h" className="mt-12">
          <h2 id="free-h" className="text-xl font-bold text-emerald-300">Free forever</h2>
          <ul className="mt-4 grid gap-4 sm:grid-cols-2">
            {FREE.map((f) => (
              <li key={f.href} className="rounded-2xl border border-emerald-400/30 bg-emerald-950/40 p-5">
                {f.external ? (
                  <a href={f.href} className="text-lg font-bold text-slate-100 underline-offset-2 hover:underline">{f.name}</a>
                ) : (
                  <Link href={f.href} className="text-lg font-bold text-slate-100 underline-offset-2 hover:underline">{f.name}</Link>
                )}
                <p className="mt-2 text-sm leading-relaxed text-slate-400">{f.what}</p>
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="tiers-h" className="mt-12">
          <h2 id="tiers-h" className="text-xl font-bold text-emerald-300">Metered for agents — three artefacts</h2>
          <p className="mt-2 text-sm text-slate-400">
            Each resource answers a plain GET with a free preview and a 402. Machine catalog:{" "}
            <a href="/api/x402" className="text-emerald-300 underline-offset-2 hover:underline">/api/x402</a> · discovery:{" "}
            <a href="/.well-known/x402.json" className="text-emerald-300 underline-offset-2 hover:underline">/.well-known/x402.json</a>
          </p>
          <ul className="mt-4 space-y-4">
            {TIERS.map((t) => (
              <li key={t.id} className="rounded-2xl border border-emerald-400/30 bg-emerald-950/40 p-5" data-testid={`tier-${t.id}`}>
                <h3 className="text-lg font-bold text-slate-100">{t.name}</h3>
                <p className="mt-1 break-all font-mono text-[12px] text-emerald-300">{t.resource}</p>
                <p className="mt-3 text-sm leading-relaxed text-slate-300"><span className="font-semibold text-slate-100">You get:</span> {t.get}</p>
                <p className="mt-2 text-sm leading-relaxed text-slate-400"><span className="font-semibold text-slate-200">Never:</span> {t.never}</p>
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="how-h" className="mt-12">
          <h2 id="how-h" className="text-xl font-bold text-emerald-300">How a 402 works here</h2>
          <dl className="mt-4 grid gap-3 sm:grid-cols-2">
            {STEPS.map((s) => (
              <div key={s.k} className="rounded-2xl border border-emerald-400/20 bg-emerald-950/40 p-4">
                <dt className="font-mono text-[11px] uppercase tracking-wider text-emerald-400">{s.k}</dt>
                <dd className="mt-1 text-sm leading-relaxed text-slate-300">{s.v}</dd>
              </div>
            ))}
          </dl>
          <pre className="mt-4 overflow-x-auto rounded-2xl border border-emerald-400/20 bg-black/40 p-4 font-mono text-[12px] leading-relaxed text-slate-300">
{`curl -i "https://councilof.ai/api/request-attestation?subject=<model-id>"
# HTTP/1.1 402 Payment Required
# PAYMENT-REQUIRED: <base64 x402 v2 challenge>
# { "accepts": [{ "scheme": "exact", "network": "eip155:8453", "asset": "<USDC on Base>",
#                 "payTo": "<estate wallet>", "amount": "<atomic USDC>" }],
#   "csoai": { "preview": { "signed_cards_on_file": … }, "rail": { "mode": … } } }`}
          </pre>
          <p className="mt-3 text-sm text-slate-400">
            The rail reports its own state at <a href="/api/x402" className="text-emerald-300 underline-offset-2 hover:underline">/api/x402</a> (challenge-only until a facilitator is provisioned; live after) and its settled totals — null until a receipt actually settles, never a typed zero — at{" "}
            <a href="/api/revenue" className="text-emerald-300 underline-offset-2 hover:underline">/api/revenue</a>.
          </p>
        </section>

        <section aria-labelledby="rules-h" className="mt-12">
          <h2 id="rules-h" className="text-xl font-bold text-emerald-300">The lines we do not cross</h2>
          <dl className="mt-4 grid gap-3 sm:grid-cols-2">
            {RULES.map((r) => (
              <div key={r.k} className="rounded-2xl border border-emerald-400/20 bg-emerald-950/40 p-4">
                <dt className="font-mono text-[11px] uppercase tracking-wider text-emerald-400">{r.k}</dt>
                <dd className="mt-1 text-sm leading-relaxed text-slate-300">{r.v}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section aria-labelledby="human-h" className="mt-12">
          <h2 id="human-h" className="text-xl font-bold text-emerald-300">Not an agent?</h2>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-300">
            Humans and institutions use the same artefacts on enquiry — a design-partner engagement invoices from CSOAI LTD, and the deliverable is still a signed card anyone can recompute.
            Start at <Link href="/products" className="text-emerald-300 underline-offset-2 hover:underline">/products</Link> or write to nicholas@csoai.org.
          </p>
        </section>
      </main>
    </div>
  );
}
