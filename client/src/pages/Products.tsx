import { Link } from "wouter";
import { toolSummary } from "@/lib/mcpTools";
import { useBoardCount } from "@/lib/boardCount";
import { BUYING_ENQUIRIES } from "@/lib/buying";

/**
 * /products — four SKUs, one workspace (Council OS).
 *
 * Eats the 2026-08-26 product-family page (engine, free rail, boundary) and
 * the 2026-08-28 product packaging canon. Does not add a fifth commercial
 * door. GPAI / CRA / financial / academy remain modules under Ledger or OS.
 *
 * Public prices stay off this page (owner ruling 2026-08-26). Machine jobs
 * disclose their amount in the live 402 challenge; enterprise Ledger and Data
 * work remain on enquiry.
 */

export const SKUS = [
  {
    id: "verify",
    name: "Verify",
    href: "/gspc-verify",
    tag: "Free forever",
    what: "Paste a signed card. Your browser recomputes the hash and checks the Ed25519 signature. Nothing is sent to us. No account.",
  },
  {
    id: "run",
    name: "Request attestation",
    href: "/dashboard?tab=measured",
    tag: "Scoped commission",
    what: "Name a subject and optional axis. The paid route returns a commission receipt and re-serves signed cards already on file; it does not promise an instant fresh measurement.",
  },
  {
    id: "ledger",
    name: "Ledger",
    href: "/contact?arm=ledger",
    tag: "Enquiry",
    what: "Evidence products for a named subject or period: Article 50 marking-check packs, published evidence bundles and provider-diff feeds. Scope and invoice terms are agreed by email.",
  },
  {
    id: "data",
    name: "Data",
    href: "/contact?arm=data",
    tag: "Enquiry",
    what: "Discuss reuse of a named published dataset. Licence rights, source permissions and commercial terms depend on the component and version. A data enquiry does not reserve or license a corpus. A vendor can never buy a score.",
  },
] as const;

const ENGINE = [
  { k: "Signed", v: "Ed25519 over canonical JSON (not JCS — see /signed/HOW-TO-VERIFY.md). Every published card carries its signature bytes, the public key and the preimage rule, and verifies offline with the zero-dependency verifier at /signed/verify-card.mjs — no account, no permission." },
  { k: "Result status", v: "pass / fail / UNMEASURED, with measurement status and verification status reported separately" },
  { k: "Live-sourced", v: "Board and card-chain figures are read from the published APIs, with source records and measurement dates." },
  {
    k: "Method-bound",
    v: "unparsed counts incorrect · no model judges another · no model-comparison axis is quoted below n=30, and an axis whose n counts something other than bank items says what it counts",
  },
];

const FREE_RAIL = [
  { name: "Verify a card", href: "/gspc-verify", what: "Check any signed verdict offline. Free forever, for anyone." },
  { name: "The live board", href: "/gspc-scoreboard", what: "Living board GET /api/gspc — counts derived from the committed axis arrays. Check GET /api/state for whether the preserved signed board snapshot agrees with those live rows." },
  { name: "The API", href: "/api/gspc", what: "The same board, machine-readable. Agents welcome.", external: true },
  { name: "The method", href: "/methodology", what: "The frozen rules every number above is computed under." },
  { name: "Explore services and pricing", href: "/dashboard?task=pricing-overview&tab=measured", what: "Free verification, existing RWA or Article 50 evidence, provider history, or a scoped commission. Paid routes disclose the exact amount only in their live 402 challenge." },
  { name: "Live board badge", href: "/badge/board.svg", what: "One SVG that re-renders from the live board — embed it anywhere, it never types a number." },
  
];

const MODULES = [
  {
    name: "GPAI Evidence Pack",
    href: "/gpai-evidence",
    tag: "Ledger module",
    what: "Independent third-party evidence a GPAI provider can hand the AI Office. Evidence, never a conformity mark.",
  },
  {
    name: "CRA Readiness Kit",
    href: "/cra-readiness",
    tag: "Ledger module",
    what: "The 24h / 72h / 14-day ENISA reporting runbook and the signed-SBOM workflow — template and tooling, not legal advice.",
  },
  {
    name: "Insurance evidence rail",
    href: "/insurers",
    tag: "Ledger module",
    what: "Measured, reported, and empty cells in three columns. We do not price risk and we take no share of anything written on a card.",
  },
  {
    name: "White-label embed",
    href: "/embed",
    tag: "Verify module",
    what: "A self-verifying badge: WebCrypto checks the Ed25519 signature in the reader's own browser. Check integrity and signature status separately. A valid result does not establish truth, freshness or compliance.",
  },
  {
    name: "Distribution integrity",
    href: "/distribution-integrity",
    tag: "Financial axis",
    what: "Represented is not distributed. Coverage layer over tokenized real-world assets — board financial axes are MEASURED (GET /api/gspc); this module is not a credit rating.",
  },
  {
    name: "Legacy on-ramp",
    href: "/cobolbridge",
    tag: "In build",
    what: "COBOL lineage into signed evidence — in development. UNMEASURED until a signed card exists.",
  },
  {
    name: "Council Academy",
    href: "/academy",
    tag: "Training",
    what: "A record that a course was completed. It attests learning, never conformity, and is not an accreditation.",
  },
  {
    name: "Request a scoped attestation",
    href: "/dashboard?tab=measured",
    tag: "Commission",
    what: "Commission a receipt for a named subject and inspect signed measurements already on file. A fresh run remains UNMEASURED until a published run exists.",
  },
];

const AUDIENCES = [
  { who: "Anyone", deal: "Verify and Council OS. Free, loginless, forever." },
  { who: "Insurers & relying parties", deal: "Council Ledger — a feed you can price against, from a body that will never underwrite." },
  { who: "Deployers & GPAI teams", deal: "An evidence pack for a system you asked us to measure. Not a purchased public rank." },
  { who: "Researchers & AI teams", deal: "Council Data — licensed traces. Data, never a score." },
  { who: "Regulators & the public", deal: "The whole public rail, free. Boards, cards, proofs, the API." },
  { who: "Partner sites", deal: "The white-label embed. Partner branding does not change the evidence." },
];

export default function Products() {
  const board = useBoardCount();
  return (
    <div className="min-h-screen bg-[#03110b]">
    <section className="mx-auto max-w-5xl px-5 py-14 text-slate-100 sm:px-8">
      <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-emerald-400">
        Council of AI — verification, measurement and evidence services
      </p>
      <h1 className="mt-3 max-w-3xl text-4xl font-extrabold leading-tight sm:text-4xl">
        Verify for free. Choose the work you need.
      </h1>
      <p className="mt-5 max-w-3xl text-lg leading-relaxed text-slate-300">
        Retrieve existing evidence, inspect provider history, or discuss a scoped
        measurement requirement. Each service identifies its deliverable and coverage.
        Payment does not change a measurement result.
      </p>

      <section aria-labelledby="products-buying-h" className="mt-8 rounded-2xl border border-emerald-400/30 bg-emerald-950/30 p-6">
        <h2 id="products-buying-h" className="text-xl font-bold">Ask for a defined evidence product</h2>
        <p className="mt-3 max-w-3xl leading-7 text-slate-300">These existing products can be discussed for a GBP invoice. Name the subject, dates and intended use; we confirm the available deliverable and terms before an order. Each link prepares an enquiry.</p>
        <div className="mt-4 flex flex-wrap gap-3">{BUYING_ENQUIRIES.map((product) => <Link key={product.product} href={product.href} className="inline-flex min-h-11 items-center rounded-lg border border-emerald-400/50 px-4 py-2 font-semibold text-emerald-200 hover:bg-emerald-400/10">{product.label}</Link>)}</div>
        <Link href="/services/#services-scope-h" className="mt-4 inline-flex min-h-11 items-center font-semibold text-emerald-300 underline">What to agree in the written scope</Link>
      </section>

      {/* Live runtime doors and verification surfaces */}
      <section aria-label="Runtime and verification surfaces" className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <a className="rounded-xl border border-emerald-400/25 bg-emerald-950/40 p-4 hover:border-emerald-300/60" href="/mcp">
          <p className="font-mono text-sm text-emerald-100">MCP Endpoint</p>
          <p className="mt-1 text-xs text-emerald-200/80">{toolSummary()}</p>
          <p className="mt-1 text-[11px] text-emerald-300/60">POST /mcp · Streamable HTTP</p>
        </a>
        <a className="rounded-xl border border-emerald-400/25 bg-emerald-950/40 p-4 hover:border-emerald-300/60" href="https://councilof.ai/api/gspc" target="_blank" rel="noreferrer">
          <p className="font-mono text-sm text-emerald-100">REST JSON API</p>
          <p className="mt-1 text-xs text-emerald-200/80">GET /api/gspc · /api/state · /api/corrections</p>
          <p className="mt-1 text-[11px] text-emerald-300/60">application/json · CORS open</p>
        </a>
        <Link className="rounded-xl border border-emerald-400/25 bg-emerald-950/40 p-4 hover:border-emerald-300/60" href="/gspc-verify">
          <p className="font-mono text-sm text-emerald-100">Offline Verifier</p>
          <p className="mt-1 text-xs text-emerald-200/80">Check Ed25519 signatures locally in your browser</p>
          <p className="mt-1 text-[11px] text-emerald-300/60">Zero account · /gspc-verify</p>
        </Link>
        <Link className="rounded-xl border border-emerald-400/25 bg-emerald-950/40 p-4 hover:border-emerald-300/60" href="/dashboard">
          <p className="font-mono text-sm text-emerald-100">Council OS</p>
          <p className="mt-1 text-xs text-emerald-200/80">Inspect live boards, evidence packs & review lanes</p>
          <p className="mt-1 text-[11px] text-emerald-300/60">Unified workspace · /dashboard</p>
        </Link>
      </section>
      <details className="mt-4 rounded-xl border border-emerald-400/15 bg-emerald-950/25 px-4 py-2.5 text-xs text-slate-300">
        <summary className="cursor-pointer font-semibold text-emerald-200 hover:underline">
          Experimental &amp; historical client prototypes
        </summary>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          <a className="rounded-lg border border-emerald-400/20 bg-emerald-950/40 p-3 hover:border-emerald-300/50" href="/extension/">
            <p className="font-mono text-emerald-100">Browser extension source</p>
            <p className="mt-1 text-emerald-200/75">No browser-store install claimed — unpacked rc zip with SHA256SUMS.</p>
          </a>
          <div className="rounded-lg border border-emerald-400/20 bg-emerald-950/40 p-3">
            <p className="font-mono text-emerald-100">Grok integration source</p>
            <p className="mt-1 text-emerald-200/75">Source, not a store listing.</p>
          </div>
          <div className="rounded-lg border border-emerald-400/20 bg-emerald-950/40 p-3">
            <p className="font-mono text-emerald-100">Hermes integration notes</p>
            <p className="mt-1 text-emerald-200/75">No public installation package.</p>
          </div>
        </div>
      </details>

      <section aria-labelledby="sku-h" className="mt-12">
        <h2 id="sku-h" className="text-xl font-bold text-emerald-300">
          {/* DERIVED, because this page's own ENGINE block says "No page types a count" and this
              heading typed one. Four is right today; it is right because SKUS has four entries,
              not because the word was typed. Add a fifth and the heading follows instead of lying. */}
          Our {SKUS.length} products and services
        </h2>
        <ul className="mt-4 grid gap-4 sm:grid-cols-2">
          {SKUS.map((p) => (
            <li key={p.id}>
              <Link
                href={p.href}
                className="block h-full rounded-2xl border border-emerald-400/30 bg-emerald-950/40 p-5 transition hover:border-emerald-400/60 hover:bg-emerald-950/60"
              >
                <div className="flex items-baseline justify-between gap-3">
                  <span className="text-lg font-bold text-slate-100">{p.name}</span>
                  <span className="shrink-0 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-emerald-300">
                    {p.tag}
                  </span>
                </div>
                <p className="mt-2 text-sm leading-relaxed text-slate-400">{p.what}</p>
              </Link>
            </li>
          ))}
        </ul>
      </section>


      <section aria-labelledby="engine-h" className="mt-12">
        <h2 id="engine-h" className="text-xl font-bold text-emerald-300">The engine</h2>
        <dl className="mt-4 grid gap-3 sm:grid-cols-2">
          {ENGINE.map((e) => (
            <div key={e.k} className="rounded-2xl border border-emerald-400/20 bg-emerald-950/40 p-4">
              <dt className="font-mono text-[11px] uppercase tracking-wider text-emerald-400">{e.k}</dt>
              <dd className="mt-1 text-sm leading-relaxed text-slate-300">{e.v}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-4 text-sm leading-relaxed text-slate-400">
          The board this rail publishes today:{" "}
          <span className="font-semibold text-emerald-300">{board.public_count}</span>{" "}
          {board.live && board.measured_on ? (
            <span className="text-slate-300" data-testid="products-board-measured-on">
              (measured on {board.measured_on}){" "}
            </span>
          ) : null}
          {board.live ? (
            <span className="text-slate-500">— read from GET /api/gspc as this page loaded.</span>
          ) : (
            <span className="text-slate-500">
              — the last recorded observation in the facts ledger. The live board could not be read,
              and a dated observation is shown rather than a fabricated number; GET /api/gspc wins.
            </span>
          )}{" "}
          <span className="text-slate-400">{board.count_grammar}</span>
        </p>
      </section>

      <section aria-labelledby="free-h" className="mt-12">
        <h2 id="free-h" className="text-xl font-bold text-emerald-300">Free forever, before anything else</h2>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-400">
          Verification is free forever. A grade is never sold. Regulators and the public pay nothing.
          Paid SKUs fund the rail; they do not replace it.
        </p>
        <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {FREE_RAIL.map((f) => (
            <li key={f.href}>
              {f.external ? (
                <a href={f.href} className="block h-full rounded-2xl border border-slate-100/10 bg-white/[0.03] p-4 transition hover:border-emerald-400/40">
                  <span className="font-semibold text-slate-100">{f.name}</span>
                  <span className="mt-1 block text-[13px] leading-relaxed text-slate-400">{f.what}</span>
                </a>
              ) : (
                <Link href={f.href} className="block h-full rounded-2xl border border-slate-100/10 bg-white/[0.03] p-4 transition hover:border-emerald-400/40">
                  <span className="font-semibold text-slate-100">{f.name}</span>
                  <span className="mt-1 block text-[13px] leading-relaxed text-slate-400">{f.what}</span>
                </Link>
              )}
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="mod-h" className="mt-12">
        <h2 id="mod-h" className="text-xl font-bold text-emerald-300">Modules (not extra products)</h2>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-400">
          These are panes of Council OS or packs under Council Ledger. They are not a fifth SKU.
        </p>
        <ul className="mt-4 grid gap-4 sm:grid-cols-2">
          {MODULES.map((p) => (
            <li key={p.href}>
              <Link
                href={p.href}
                className="block h-full rounded-2xl border border-slate-100/10 bg-white/[0.03] p-5 transition hover:border-emerald-400/40 hover:bg-white/[0.05]"
              >
                <div className="flex items-baseline justify-between gap-3">
                  <span className="text-lg font-bold text-slate-100">{p.name}</span>
                  <span className="shrink-0 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-emerald-300">
                    {p.tag}
                  </span>
                </div>
                <p className="mt-2 text-sm leading-relaxed text-slate-400">{p.what}</p>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="aud-h" className="mt-12">
        <h2 id="aud-h" className="text-xl font-bold text-emerald-300">Who it serves</h2>
        <ul className="mt-4 grid gap-3 sm:grid-cols-2">
          {AUDIENCES.map((a) => (
            <li key={a.who} className="rounded-2xl border border-slate-100/10 bg-white/[0.03] p-4">
              <span className="font-semibold text-slate-100">{a.who}</span>
              <span className="mt-1 block text-[13px] leading-relaxed text-slate-400">{a.deal}</span>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="bound-h" className="mt-12 rounded-2xl border border-amber-400/25 bg-amber-950/20 p-6">
        <h2 id="bound-h" className="text-base font-bold text-amber-300">The boundary, stated plainly</h2>
        <ul className="mt-3 space-y-1.5 text-sm leading-relaxed text-slate-300">
          <li>We measure. We do not certify, and nothing here is a conformity assessment or a conformity mark.</li>
          <li>UNMEASURED is a first-class answer — it appears on this page and on the board wherever it is true.</li>
          <li>Paid x402 operations disclose their terms in the payment challenge. Verification is free; a grade is never sold.</li>
          <li>Determinations of legal compliance remain with the competent authorities, always.</li>
          <li>
            We measure against regulation; we do not enforce it. We cannot approve, ban, fine or
            clear any system, and we are not a notified body under the EU AI Act or anything else.
          </li>
          <li>
            Where a capability is not there yet we say &quot;not yet available&quot; and give the
            reason — see{" "}
            <Link href="/claims-register" className="underline">the claims register</Link>.
          </li>
        </ul>
      </section>

      <div className="mt-12 flex flex-wrap gap-3">
        <Link
          href="/gspc-verify"
          className="rounded-xl bg-emerald-500 px-6 py-3 font-semibold text-emerald-950 transition hover:bg-emerald-400"
        >
          Verify a card — free
        </Link>
        <Link
          href="/contact?arm=ledger"
          className="rounded-xl border border-slate-100/20 px-6 py-3 font-semibold text-slate-100 transition hover:border-emerald-400/50"
        >
          Enquire for Ledger or Data
        </Link>
      </div>
    </section>
    </div>
  );
}
