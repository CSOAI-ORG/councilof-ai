import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Agentic Finance & Payment Compliance — CSOAI",
  description:
    "Secure your agentic payments. CSOAI provides compliance pre-checks for x402, Stripe ACP, and Google AP2.",
  openGraph: {
    title: "Agentic Finance & Payment Compliance — CSOAI",
    description: "Real-time compliance pre-checks for x402, Stripe ACP, and agentic payments.",
    images: ["/api/og?title=Agentic%20Finance&desc=Payment%20compliance%20for%20AI%20agents"],
  },
  alternates: { canonical: "/finance" },
};

const features = [
  {
    title: "x402 Micropayments",
    description:
      "Verify Watchdog Certificates before executing HTTP-native 402 Payment Required transactions on the Coinbase network.",
  },
  {
    title: "Stripe ACP Integration",
    description:
      "The standard for Agentic Checkout. Our tunnel ensures your organization's spend policies are enforced at the moment of purchase.",
  },
  {
    title: "AML/KYC Enforcement",
    description:
      "Real-time AML screening for autonomous agents. Ensure every transaction meets global financial regulations automatically.",
  },
];

const schema = {
  "@context": "https://schema.org",
  "@type": "Service",
  name: "CSOAI Agentic Finance & Payment Compliance",
  provider: { "@type": "Organization", name: "CSOAI", url: "https://csoai.org" },
  description: "Compliance pre-checks for x402, Stripe ACP, and Google AP2 agentic payments.",
  areaServed: "Global",
  url: "https://csoai.org/finance",
};

export default function FinancePage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />

      <div className="min-h-screen bg-slate-950 text-white">
        <section className="mx-auto max-w-5xl px-4 pb-20 pt-32">
          <div className="mb-4 text-[10px] font-black uppercase tracking-[0.3em] text-emerald-400">
            Layer 0-E: Payments
          </div>
          <h1 className="mb-6 text-4xl font-black tracking-tighter sm:text-6xl lg:text-7xl">
            <span className="gradient-text">Secure Agentic Payments</span>
          </h1>
          <p className="mb-10 max-w-2xl text-xl leading-relaxed text-slate-400">
            Why let your agent spend money if it isn&apos;t compliant? CSOAI provides real-time
            compliance pre-checks for x402, Stripe ACP, and Google AP2.
          </p>
          <Link
            href="/pricing"
            className="inline-flex rounded-full bg-emerald-500 px-8 py-4 text-sm font-black uppercase tracking-widest text-slate-950 transition hover:bg-emerald-400"
          >
            Get Finance Pack
          </Link>
        </section>

        <section className="mx-auto max-w-5xl px-4 pb-20">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="rounded-2xl border border-white/10 bg-white/[0.03] p-8 transition hover:-translate-y-2 hover:border-emerald-500/30 hover:bg-white/[0.05]"
              >
                <h3 className="mb-3 text-xl font-bold text-emerald-400">{feature.title}</h3>
                <p className="text-sm leading-relaxed text-slate-400">{feature.description}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-4xl px-4 pb-32">
          <div className="rounded-[2rem] border border-emerald-500/30 bg-gradient-to-br from-white/[0.05] to-emerald-500/[0.05] p-10 text-center sm:p-16">
            <h2 className="mb-4 text-3xl font-black text-white sm:text-4xl">
              Ready to enable safe spending?
            </h2>
            <p className="mx-auto mb-8 max-w-xl text-slate-400">
              Join the leading financial institutions using CSOAI Layer 0 for agentic commerce.
            </p>
            <Link
              href="/contact"
              className="inline-flex rounded-full border-2 border-emerald-500 px-8 py-4 text-sm font-black uppercase tracking-widest text-emerald-400 transition hover:bg-emerald-500 hover:text-slate-950"
            >
              Schedule Demo
            </Link>
          </div>
        </section>
      </div>
    </>
  );
}
