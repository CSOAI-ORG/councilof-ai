import { Link } from "wouter";

/**
 * /products — the signed-evidence product family, packaged as ONE door.
 *
 * Everything here rides the same engine: Ed25519 over canonical JSON (not JCS — see /signed/HOW-TO-VERIFY.md),
 * three-state verdicts (pass / fail / UNMEASURED), every public number from
 * a live API. The free rail is stated before anything sellable, because that
 * is the order the estate actually works in: verification is free forever,
 * a grade is never sold, and there are no public prices on this page or any
 * other. We measure — we do not certify, and no product below is a
 * conformity mark.
 */

const ENGINE = [
  { k: "Signed", v: "Ed25519 over canonical JSON (not JCS — see /signed/HOW-TO-VERIFY.md). Every published card carries its signature bytes, the public key and the preimage rule, and verifies offline with the zero-dependency verifier at /signed/verify-card.mjs — no account, no permission." },
  { k: "Three-state", v: "pass / fail / UNMEASURED — what we cannot measure is published, not hidden" },
  { k: "Live-sourced", v: "board numbers from GET /api/gspc, card-chain numbers from GET /api/state — both carry the artifact and the date they were read from. No page types a count." },
  { k: "Method-bound", v: "an unparsed response is UNMEASURED, never scored wrong · no model judges another · nothing reaches the board below n=30 usable items · a lead that is not statistically separated is a tie, including when it is ours" },
];

const FREE_RAIL = [
  { name: "Verify a card", href: "/gspc-verify", what: "Check any signed verdict offline. Free forever, for anyone." },
  { name: "The live board", href: "/gspc-scoreboard", what: "Every quotable axis, measured or honestly UNMEASURED." },
  { name: "The API", href: "/api/gspc", what: "The same board, machine-readable. Agents welcome.", external: true },
  { name: "The method", href: "/methodology", what: "The frozen rules every number above is computed under." },
];

const PRODUCTS = [
  {
    name: "Risk classification",
    href: "/assess",
    tag: "Free, self-serve",
    what: "Describe your system in text and a deterministic EU AI Act decision table returns the Annex III tier and the gaps against a fixed Art 9–15/50 control set. It never contacts your endpoint and it is not a bench run. Free, no account, yours to publish or not.",
  },
  {
    name: "GPAI Evidence Pack",
    href: "/gpai-evidence",
    tag: "EU AI Act",
    what: "Independent third-party evidence for the AI Office — prove, don't assert. GPAI provider duties have applied since 2 August 2025.",
  },
  {
    name: "CRA Readiness Kit",
    href: "/cra-readiness",
    tag: "Cyber Resilience Act",
    what: "The 24h / 72h / 14-day ENISA reporting runbook and the signed-SBOM workflow, as a template and tooling — not legal advice. CRA reporting obligations start 11 September 2026.",
  },
  {
    name: "Distribution integrity",
    href: "/distribution-integrity",
    tag: "Financial axes",
    what: "Represented is not distributed. The coverage layer over tokenized real-world assets — UNMEASURED stated first, never a credit rating.",
  },
  {
    name: "White-label verify embed",
    href: "/embed",
    tag: "For your site",
    what: "A self-verifying badge: WebCrypto checks the Ed25519 signature in the reader's own browser. Green only when the bytes are true.",
  },
  {
    name: "Legacy on-ramp",
    href: "/cobolbridge",
    tag: "CobolBridge",
    what: "Modernization lineage (DORA · Basel · SOX) carried into signed compliance evidence. Pathway status: UNMEASURED, and it says so.",
  },
  {
    name: "Council Academy",
    href: "/academy",
    tag: "Training",
    what: "A record that a course was completed. It attests learning, never conformity, carries no regulatory status, and is not an accreditation.",
  },
  {
    name: "Council OS",
    href: "/?lobby=home",
    tag: "The workspace",
    what: "One glass over the whole rail — board, verify, models, library, workbench — with a concierge that answers from published measurement or refuses.",
  },
];

const AUDIENCES = [
  { who: "Regulators & the public", deal: "Everything, free, forever. Boards, cards, proofs, the API. No account, no gate." },
  { who: "AI providers", deal: "Evidence packs and signed assessments — independent third-party measurement you can hand to a supervisor." },
  { who: "Financial & enterprise", deal: "The coverage data layer, continuous attestation, and the legacy on-ramp — evidence that survives an audit." },
  { who: "Platforms & sites", deal: "The white-label embed — your pages carry verdicts that verify themselves in the reader's browser." },
];

export default function Products() {
  return (
    <main className="mx-auto max-w-5xl px-5 py-14 text-slate-100 sm:px-8">
      <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-emerald-400">
        Council of AI — the product family
      </p>
      <h1 className="mt-3 max-w-3xl text-4xl font-extrabold leading-tight sm:text-5xl">
        One signed rail. Everything on this page rides it.
      </h1>
      <p className="mt-5 max-w-3xl text-lg leading-relaxed text-slate-300">
        We measure AI systems against the rules that govern them, sign the result, and publish what
        we cannot yet measure. Every product below is the same engine pointed at a different
        obligation — none of them is a certification, and no grade is ever sold.
      </p>

      {/* the engine */}
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
      </section>

      {/* free rail first — the order the estate works in */}
      <section aria-labelledby="free-h" className="mt-12">
        <h2 id="free-h" className="text-xl font-bold text-emerald-300">Free forever, before anything else</h2>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-400">
          Verification is free forever. A grade is never sold. Regulators and the public pay nothing,
          ever — this rail is the point of the whole estate, and the products below exist to fund it.
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

      {/* the family */}
      <section aria-labelledby="family-h" className="mt-12">
        <h2 id="family-h" className="text-xl font-bold text-emerald-300">The family</h2>
        <ul className="mt-4 grid gap-4 sm:grid-cols-2">
          {PRODUCTS.map((p) => (
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

      {/* who it serves */}
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

      {/* the boundary */}
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
            reason — anchoring, C2PA conformance, post-quantum signing and XRPL mainnet are all
            planned rather than live, and each has a row with its status at{" "}
            <Link href="/claims-register" className="underline">the claims register</Link>.
          </li>
        </ul>
      </section>

      <div className="mt-12 flex flex-wrap gap-3">
        <Link
          href="/contact"
          className="rounded-xl bg-emerald-500 px-6 py-3 font-semibold text-emerald-950 transition hover:bg-emerald-400"
        >
          Talk to us
        </Link>
        <Link
          href="/gspc-verify"
          className="rounded-xl border border-slate-100/20 px-6 py-3 font-semibold text-slate-100 transition hover:border-emerald-400/50"
        >
          Verify a card — free
        </Link>
      </div>
    </main>
  );
}
