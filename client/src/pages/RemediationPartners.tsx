/**
 * /remediation-partners — the firebreak page.
 * Council of AI measures. Independent remediation providers fix.
 * CSOAI has zero ownership, zero referral fees, zero control.
 * This page IS the public declaration of the separation.
 */
import { Link } from "wouter";
import { Shield, CheckCircle, ArrowRight, ExternalLink } from "lucide-react";

const DOCTRINE = `Council of AI (CSOAI Ltd, UK 16939677) is a measurement body. We issue
verified measurement credentials — 3KB Ed25519-signed cards that tell you how your AI
behaved against frozen, published benchmarks. We do not fix the AI. We do not consult on
remediation. We do not take a fee, a kickback, or equity from any remediation provider.
The providers listed here are independent — they simply use our cards as input.`;

const HOW_IT_WORKS = [
  { step: "1", title: "Get measured", body: "Send us your AI system. We run it against our frozen instruments and issue a signed measurement card — every axis, every CI, every signature verifiable without an account." },
  { step: "2", title: "Understand the card", body: "The card tells you what your AI did, not what someone says it did. Each axis carries accuracy, n, 95% CI, and an Ed25519 signature. The card IS the ground truth." },
  { step: "3", title: "Choose a fixer (or fix it yourself)", body: "Any provider below — or your own team — can read the card and map every finding to a remediation plan. The card is the input. You own the output." },
  { step: "4", title: "Re-attest", body: "Come back next month. We re-measure and issue a delta card. Your evidence stays current. Your fixer's work is measured by the same instrument that found the gaps." },
];

const RULES = [
  "We take no referral fee from any provider listed here.",
  "We hold no equity in any provider listed here.",
  "Providers are ranked by independent measurement, not commercial relationship.",
  "A provider can be removed from this page by failing a re-attest — nobody can buy their way on or off.",
  "The routing rule is mechanical: the top-ranked model on each axis, whichever it is, at the time of measurement.",
];

// Empty providers list — the architecture is the product, not the directory.
// Providers are added only after they demonstrate: (a) they can read a card,
// (b) they map findings to a fix plan, (c) they use the public verify endpoint.
const PROVIDERS: { name: string; url: string; region: string; note: string }[] = [
  // Example entry — uncomment when a provider passes verification:
  // { name: "Example Remediation Ltd", url: "https://example.com", region: "UK/EU", note: "Verified: can read cards, can map findings to fix plans." },
];

export default function RemediationPartners() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <section className="border-b border-gray-100 bg-gradient-to-b from-emerald-50 to-white">
        <div className="mx-auto max-w-4xl px-6 py-20">
          <span className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-600">
            Measurement body, not a remediation shop
          </span>
          <h1 className="mt-4 text-4xl font-black text-gray-900 sm:text-4xl">
            We measure.<br />
            <span className="text-emerald-500">You choose who fixes it.</span>
          </h1>
          <p className="mt-5 max-w-2xl text-lg text-gray-500 leading-relaxed">
            {DOCTRINE}
          </p>
        </div>
      </section>

      {/* How it works */}
      <section className="py-16 px-6 bg-white">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-3xl font-extrabold text-center text-gray-900">How it works</h2>
          <div className="mt-10 grid gap-6 sm:grid-cols-2">
            {HOW_IT_WORKS.map(h => (
              <div key={h.step} className="rounded-2xl border border-gray-100 bg-white p-6">
                <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 text-sm font-extrabold">
                  {h.step}
                </span>
                <h3 className="mt-3 text-lg font-extrabold text-gray-900">{h.title}</h3>
                <p className="mt-2 text-sm text-gray-500 leading-relaxed">{h.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* The rules */}
      <section className="py-16 px-6 bg-gray-50">
        <div className="mx-auto max-w-4xl">
          <div className="flex items-center gap-3 mb-8">
            <Shield className="w-6 h-6 text-emerald-500" />
            <h2 className="text-3xl font-extrabold text-gray-900">The five rules that keep us honest</h2>
          </div>
          <ul className="space-y-4">
            {RULES.map((r, i) => (
              <li key={i} className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-emerald-500 mt-0.5 shrink-0" />
                <span className="text-gray-700">{r}</span>
              </li>
            ))}
          </ul>
          <p className="mt-6 text-sm text-gray-400 italic">
            These rules are published. Anyone can audit them. If we ever break one, the market finds out —
            and the measurement board becomes a liability rather than an asset. That is the discipline.
          </p>
        </div>
      </section>

      {/* Providers directory */}
      <section className="py-16 px-6 bg-white">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-3xl font-extrabold text-center text-gray-900">Independent remediation providers</h2>
          <p className="mt-3 text-center text-gray-500 max-w-xl mx-auto">
            These providers use CSOAI measurement cards as input. They are independently owned and operated.
            CSOAI has no financial interest in any of them.
          </p>
          {PROVIDERS.length === 0 ? (
            <div className="mt-10 rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-10 text-center">
              <p className="text-lg font-bold text-gray-500">No providers listed yet.</p>
              <p className="mt-2 text-sm text-gray-400 max-w-md mx-auto">
                This page will list providers as they demonstrate the ability to read a CSOAI measurement card,
                map findings to a fix plan, and use our public verify endpoint. Interested in being listed?
              </p>
              <a href="mailto:verify@csoai.org" className="mt-4 inline-flex items-center gap-2 text-emerald-600 font-bold hover:underline">
                Email us <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          ) : (
            <div className="mt-10 grid gap-4 sm:grid-cols-2">
              {PROVIDERS.map(p => (
                <a key={p.name} href={p.url} target="_blank" rel="noopener"
                   className="rounded-2xl border border-gray-100 bg-white p-5 hover:shadow-lg hover:border-emerald-200 transition-all">
                  <h3 className="font-extrabold text-gray-900">{p.name}</h3>
                  <p className="mt-1 text-xs text-emerald-600 font-semibold">{p.region}</p>
                  <p className="mt-2 text-sm text-gray-500">{p.note}</p>
                </a>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* CTAs */}
      <section className="py-12 px-6 bg-emerald-50">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="text-2xl font-extrabold text-gray-900">Want to become a listed provider?</h2>
          <p className="mt-2 text-gray-500">Email us at verify@csoai.org with the subject "Provider listing". We'll send the verification steps.</p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link href="/assess" className="rounded-xl bg-emerald-500 px-5 py-2.5 text-sm font-extrabold text-white hover:bg-emerald-400">
              Get measured first <ArrowRight className="inline w-3 h-3 ml-1" />
            </Link>
            <Link href="/gspc-verify" className="rounded-xl border-2 border-emerald-200 bg-white px-5 py-2.5 text-sm font-bold text-emerald-700 hover:bg-emerald-50">
              Verify a card
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}