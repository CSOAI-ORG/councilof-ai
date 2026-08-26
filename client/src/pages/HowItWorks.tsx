import { useEffect } from "react";

/**
 * How measurement actually runs. Not a certificate. We do not remediate.
 * Do not hardcode GSPC axis or model counts — live totals at GET /api/gspc.
 * Byzantine / supermajority consensus was retracted (DR-0007). Ties are ties.
 */
const STEPS = [
  {
    n: 1,
    title: "Describe the system",
    body: "At /assess you describe the system — purpose, domain, or a URL — as text. Free, and no account is required. Verification is free forever and a grade is never sold.",
    href: "/assess",
    label: "Get measured",
  },
  {
    n: 2,
    title: "A keyword classifier runs",
    body: "The assess function is a deterministic EU AI Act keyword classifier (Annex III / Art 5). It does not fetch or probe an endpoint and it is not a GSPC bench run.",
    href: "/assess",
    label: "Open /assess",
  },
  {
    n: 3,
    title: "You get a signed card",
    body: "The artefact carries the tier, the gaps against the fixed Art 9–15/50 control set, and what could not be determined. Empty cells stay empty. It is signed with Ed25519 when the signing key is provisioned, and when it is not the report says alg: UNSIGNED out loud rather than showing you a signature that is not there — so you can always see exactly what you hold. Verify is free at /gspc-verify.",
    href: "/gspc-verify",
    label: "Verify a record",
  },
  {
    n: 4,
    title: "A bench run is a different thing, and is not yet self-serve",
    body: "The classifier reads your description; it never contacts your system, so it cannot tell you how your model behaves. A GSPC bench run — your system answering a frozen, published bank, graded by deterministic code, ending in a card that joins the signed chain — is arranged with us directly. The honest reason it is not a button is capacity, not policy.",
    href: "/contact",
    label: "Ask about a bench run",
  },
  {
    n: 5,
    title: "The living board is separate",
    body: "Published GSPC totals live at GET /api/gspc, and the card-chain counts at GET /api/state. We do not type axis, card or model counts into this page. Ties are ties. Empty cells stay empty.",
    href: "/api/gspc",
    label: "GET /api/gspc",
  },
];

export default function HowItWorks() {
  useEffect(() => {
    document.title = "How it works — measure, sign, leave empty cells empty | CSOAI";
  }, []);
  return (
    <div className="min-h-screen bg-white">
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-emerald-900 to-teal-900 text-white py-16">
        <div className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(700px 380px at 80% -10%, rgba(45,212,191,.22), transparent 60%)" }} />
        <div className="relative max-w-5xl mx-auto px-6">
          <p className="font-mono text-[11px] uppercase tracking-[2px] text-emerald-300/80">CSOAI — how it works</p>
          <h1 className="mt-3 text-4xl sm:text-5xl font-black tracking-tight">From a description to a signed card</h1>
          <p className="mt-4 max-w-2xl text-lg text-emerald-50/90">
            We measure, sign, and publish what we cannot measure. The card is not a certificate, not a conformity mark, and not legal advice. We measure against regulation — we do not enforce it, and only a regulator can. We do not remediate.
          </p>
        </div>
      </section>
      <section className="max-w-4xl mx-auto px-6 py-12">
        <ol className="relative border-l-2 border-emerald-200 pl-8 space-y-8">
          {STEPS.map((s) => (
            <li key={s.n} className="relative">
              <span className="absolute -left-[42px] flex h-8 w-8 items-center justify-center rounded-full bg-emerald-600 text-sm font-black text-white">{s.n}</span>
              <div className="text-lg font-bold text-gray-900">{s.title}</div>
              <p className="mt-1 text-gray-600 leading-relaxed">{s.body}</p>
              <a href={s.href} className="mt-2 inline-block text-sm font-bold text-emerald-700 hover:text-emerald-600">{s.label} -&gt;</a>
            </li>
          ))}
        </ol>
        <div className="mt-10 rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-center">
          <div className="text-xl font-black text-emerald-900">Ready to get measured?</div>
          <p className="mx-auto mt-2 max-w-xl text-sm text-emerald-900/80">
            No public prices. A grade is never sold. Verify is free forever.
          </p>
          <a href="/assess" className="mt-4 inline-block rounded-xl bg-emerald-600 px-6 py-3 text-sm font-bold text-white hover:bg-emerald-500">Get measured -&gt;</a>
        </div>
      </section>
    </div>
  );
}
