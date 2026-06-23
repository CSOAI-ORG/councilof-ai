"use client";

import Link from "next/link";

const TIERS = [
  {
    name: "Free",
    price: "£0",
    period: "forever",
    description: "10 audits/day, public scorecards, and open-source MCP tooling.",
    features: [
      "EU AI Act readiness scorecard",
      "10 MCP calls per day",
      "Public verification URL",
      "Community Discord access",
    ],
    cta: "Start Free",
    href: "https://proofof.ai",
    highlight: false,
  },
  {
    name: "Solo",
    price: "£49",
    period: "/mo",
    description: "Self-serve Article 50 chatbot and disclosure compliance for startups and solo builders.",
    features: [
      "Article 50 chatbot disclosure",
      "25 native-language strings",
      "Basic watermarking audit",
      "Self-serve dashboard",
      "Email support",
    ],
    cta: "Get Solo",
    href: "https://app.csoai.org/signup", // Self-serve signup in the app dashboard
    highlight: false,
  },
  {
    name: "Pro",
    price: "£199",
    period: "/mo",
    description: "Signed attestations, unlimited audits, and priority council access.",
    features: [
      "Unlimited compliance audits",
      "Ed25519-signed attestations",
      "Public verify pages",
      "Monthly regression checks",
      "API key + tier access",
    ],
    cta: "Get Pro",
    href: "https://buy.stripe.com/00wfZjbcw9ACcIBfL28k91K",
    highlight: true,
  },
  {
    name: "Article 50 Kit",
    price: "£999",
    period: "one-time",
    description: "Emergency transparency docs + MCP Pro tier for the EU AI Act Article 50 cliff.",
    features: [
      "Article 50 technical documentation",
      "25 native-language disclosure strings",
      "C2PA-2.0 manifest templates",
      "MCP Pro tier (12 months)",
      "Post-market monitoring plan",
    ],
    cta: "Secure Compliance",
    href: "https://buy.stripe.com/4gMcN7a8s6oq0ZTaqI8k91Z",
    highlight: false,
  },
  {
    name: "Watchdog Cert",
    price: "£4,950",
    period: "one-time",
    description: "Full third-party CSOAI certification with auditor-verifiable offline proof.",
    features: [
      "Full gap analysis + remediation plan",
      "CEASAI-aligned certification",
      "Auditor-verifiable offline signature",
      "48-hour turnaround option",
      "12 months of Pro monitoring",
    ],
    cta: "Book Certification",
    href: "https://buy.stripe.com/cNieVf0xS7sueQJfL28k91G",
    highlight: false,
  },
];

export default function Pricing() {
  return (
    <div className="min-h-screen bg-slate-950 text-white selection:bg-emerald-500/30">
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-16">
          <h1 className="text-4xl sm:text-5xl font-black mb-4 tracking-tight">
            Simple pricing for sovereign AI safety
          </h1>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto">
            Start free. Upgrade when you need signed proof. Every paid tier includes a public,
            verifier-friendly compliance trail.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {TIERS.map((tier) => (
            <div
              key={tier.name}
              className={`relative rounded-2xl p-6 flex flex-col border ${
                tier.highlight
                  ? "bg-emerald-500/10 border-emerald-500"
                  : "bg-white/5 border-white/10"
              }`}
            >
              {tier.highlight && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-emerald-500 text-slate-950 text-[10px] font-black tracking-widest uppercase">
                  Most Popular
                </span>
              )}
              <div className="text-sm text-slate-400 uppercase tracking-widest mb-2">
                {tier.name}
              </div>
              <div className="text-4xl font-black mb-1">
                {tier.price}
                <span className="text-base font-medium text-slate-500">{tier.period}</span>
              </div>
              <p className="text-sm text-slate-400 mb-6 flex-grow">{tier.description}</p>
              <ul className="space-y-2 mb-6">
                {tier.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2 text-sm text-slate-300">
                    <span className="text-emerald-400 mt-0.5">✓</span>
                    {feature}
                  </li>
                ))}
              </ul>
              <a
                href={tier.href}
                target="_blank"
                rel="noopener noreferrer"
                className={`block text-center px-5 py-3 rounded-xl font-bold transition ${
                  tier.highlight
                    ? "bg-emerald-500 hover:bg-emerald-600 text-slate-950"
                    : "bg-white/5 hover:bg-white/10 text-white border border-white/10"
                }`}
              >
                {tier.cta}
              </a>
            </div>
          ))}
        </div>

        <div className="mt-16 text-center">
          <p className="text-slate-500 text-sm mb-4">
            Need a custom enterprise council, resale partnership, or white-label certification?
          </p>
          <Link
            href="mailto:hello@meok.ai"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white font-medium transition border border-white/10"
          >
            Contact hello@meok.ai
          </Link>
        </div>
      </main>
    </div>
  );
}
