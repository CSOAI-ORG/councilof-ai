import { Link } from "wouter";
import EmptySlots from "@/components/EmptySlots";
import GovernanceTerminal from "@/components/GovernanceTerminal";
import HealthInventory from "@/components/HealthInventory";
import HealthTerms from "@/components/HealthTerms";
import PermissionlessRevenue from "@/components/PermissionlessRevenue";
import PlaybookAudit from "@/components/PlaybookAudit";
import ProductFill from "@/components/ProductFill";
import SovExternalAudit from "@/components/SovExternalAudit";
import { useBoardCount } from "@/lib/boardCount";

/**
 * /products — four SKUs, one workspace (Council OS).
 *
 * Eats the 2026-08-26 product-family page (engine, free rail, boundary) and
 * the 2026-08-28 Series A packaging canon. Does not add a fifth commercial
 * door. GPAI / CRA / financial / academy remain modules under Ledger or OS.
 *
 * Public prices stay off this page (owner ruling 2026-08-26). Paid SKUs:
 * on enquiry via /licensing-agreement.
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
    name: "Run / re-attest",
    href: "/assess",
    tag: "Enquiry",
    what: "We measure the named system again when the law or the model moves. Get measured is the lead. Paid is the re-attest loop.",
  },
  {
    id: "ledger",
    name: "Ledger",
    href: "/contact?arm=ledger",
    tag: "Enquiry",
    what: "Signed evidence feed and packs for insurers and procurement. Never a purchased public rank.",
  },
  {
    id: "data",
    name: "Data",
    href: "/contact?arm=data",
    tag: "Enquiry",
    what: "Licensed corpus: traces, preference pairs, safety incidents. A vendor may buy data. A vendor can never buy a score.",
  },
] as const;

const ENGINE = [
  { k: "Signed", v: "Ed25519 over canonical JSON (not JCS — see /signed/HOW-TO-VERIFY.md). Every published card carries its signature bytes, the public key and the preimage rule, and verifies offline with the zero-dependency verifier at /signed/verify-card.mjs — no account, no permission." },
  { k: "Three-state", v: "pass / fail / UNMEASURED — what we cannot measure is published, not hidden" },
  { k: "Live-sourced", v: "board numbers from GET /api/gspc, card-chain numbers from GET /api/state — both carry the artifact and the date they were read from. No page types a count." },
  {
    k: "Method-bound",
    v: "unparsed counts incorrect · no model judges another · no model-comparison axis is quoted below n=30, and an axis whose n counts something other than bank items says what it counts",
  },
];

const FREE_RAIL = [
  { name: "Verify a card", href: "/gspc-verify", what: "Check any signed verdict offline. Free forever, for anyone." },
  { name: "The live board", href: "/gspc-scoreboard", what: "Every quotable axis, measured or honestly UNMEASURED." },
  { name: "The API", href: "/api/gspc", what: "The same board, machine-readable. Agents welcome.", external: true },
  { name: "The method", href: "/methodology", what: "The frozen rules every number above is computed under." },
  { name: "Metered for agents", href: "/pricing-free", what: "Three artefacts an agent can buy over HTTP 402 (USDC on Base) — issuance, assembly, cadence. Never a grade." },
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
    what: "A self-verifying badge: WebCrypto checks the Ed25519 signature in the reader's own browser. Green only when the bytes are true.",
  },
  {
    name: "Distribution integrity",
    href: "/distribution-integrity",
    tag: "Financial axis",
    what: "Represented is not distributed. Coverage layer over tokenized real-world assets — UNMEASURED stated first, never a credit rating.",
  },
  {
    name: "Legacy on-ramp",
    href: "/cobolbridge",
    tag: "In build",
    what: "COBOL lineage into signed evidence — in build. Apex 522. Pathway UNMEASURED until a signed card exists.",
  },
  {
    name: "Council Academy",
    href: "/academy",
    tag: "Training",
    what: "A record that a course was completed. It attests learning, never conformity, and is not an accreditation.",
  },
  {
    name: "Get measured",
    href: "/dashboard?tab=measured",
    tag: "Free card",
    what: "We run your system against the frozen tests that apply to it and hand you a signed record you keep. Publishing it is your decision.",
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
    <main className="mx-auto max-w-5xl px-5 py-14 text-slate-100 sm:px-8">
      <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-emerald-400">
        Council of AI — verify free, three arms on enquiry
      </p>
      <h1 className="mt-3 max-w-3xl text-4xl font-extrabold leading-tight sm:text-4xl">
        Verify is free. Three things invoice.
      </h1>
      <p className="mt-5 max-w-3xl text-lg leading-relaxed text-slate-300">
        We measure AI systems against frozen, published tests, sign the result, and
        sell the evidence — never the score, never a certificate, never to anyone we rank.
      </p>

      <section aria-labelledby="sku-h" className="mt-12">
        <h2 id="sku-h" className="text-xl font-bold text-emerald-300">The four SKUs</h2>
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

      <ProductFill tone="dark" />
      <HealthInventory tone="dark" />
      <HealthTerms tone="dark" />
      <GovernanceTerminal tone="dark" />
      <PermissionlessRevenue tone="dark" />
      <SovExternalAudit tone="dark" />
      <PlaybookAudit tone="dark" />
      <EmptySlots tone="dark" />

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
          <li>No public prices, here or anywhere: verification is free forever, and a grade is never sold.</li>
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
    </main>
    </div>
  );
}
