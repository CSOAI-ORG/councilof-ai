import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Advisory Services — CSOAI",
  description:
    "Expert AI governance consultancy from CSOAI. Regulatory strategy, board readiness, technical implementation, audit preparation, red teaming, and training.",
  openGraph: {
    title: "Advisory Services — CSOAI",
    description:
      "From regulatory strategy to technical implementation — our governance advisors help you navigate the AI safety landscape with confidence.",
    images: ["/api/og?title=Advisory%20Services&desc=AI%20governance%20consultancy%20by%20CSOAI"],
  },
  alternates: { canonical: "/advisory" },
};

const serviceSchema = {
  "@context": "https://schema.org",
  "@type": "Service",
  name: "CSOAI Advisory Services",
  provider: {
    "@type": "Organization",
    name: "CSOAI",
    url: "https://csoai.org",
  },
  description:
    "Expert AI governance consultancy covering regulatory strategy, board readiness, technical implementation, audit preparation, red teaming, and training.",
  areaServed: "Global",
  url: "https://csoai.org/advisory",
};

const services = [
  {
    emoji: "🎯",
    title: "Regulatory Strategy",
    description:
      "Navigate EU AI Act, NIST AI RMF, and emerging frameworks. We map your current state to compliance requirements.",
    price: "From $2,500/engagement",
  },
  {
    emoji: "🏛️",
    title: "Board Readiness",
    description:
      "Prepare your board and C-suite for AI governance oversight. Risk reporting, liability frameworks, and fiduciary guidance.",
    price: "From $5,000/engagement",
  },
  {
    emoji: "⚙️",
    title: "Technical Implementation",
    description:
      "Deploy AI monitoring, bias detection, explainability tooling, and safety testing pipelines across your ML infrastructure.",
    price: "From $10,000/engagement",
  },
  {
    emoji: "📋",
    title: "Audit Preparation",
    description:
      "Get CASA certification-ready with mock audits, gap analysis, and remediation planning. 95% first-attempt pass rate.",
    price: null,
  },
  {
    emoji: "🔬",
    title: "Red Team Operations",
    description:
      "Adversarial testing of your AI systems through certified red team operators. Find vulnerabilities before others do.",
    price: null,
  },
  {
    emoji: "📚",
    title: "Training & Culture",
    description:
      "Bespoke AI safety training programmes for every level. From developer workshops to executive briefings.",
    price: null,
  },
];

const process = [
  {
    number: "1",
    title: "Discovery",
    text: "We map your AI landscape — systems, stakeholders, risks, and existing controls.",
  },
  {
    number: "2",
    title: "Assessment",
    text: "We identify gaps against the 52-article charter and your target regulatory frameworks.",
  },
  {
    number: "3",
    title: "Roadmap",
    text: "We deliver a prioritised action plan with clear milestones, owners, and success metrics.",
  },
];

export default function AdvisoryPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceSchema) }}
      />

      <div className="min-h-screen bg-slate-950 text-white">
        <section className="mx-auto max-w-6xl px-4 pb-20 pt-32 text-center">
          <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-emerald-400">
            Expert Guidance
          </span>
          <h1 className="mb-6 text-4xl font-black tracking-tighter sm:text-6xl">
            <span className="gradient-text">Advisory Services</span>
          </h1>
          <p className="mx-auto mb-10 max-w-2xl text-lg leading-relaxed text-slate-300">
            From regulatory strategy to technical implementation — our governance advisors help you
            navigate the AI safety landscape with confidence.
          </p>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-12">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {services.map((service) => (
              <div
                key={service.title}
                className="rounded-2xl border border-white/10 bg-white/[0.03] p-8 transition hover:-translate-y-2 hover:border-emerald-500/30 hover:bg-white/[0.05]"
              >
                <div className="mb-4 text-4xl">{service.emoji}</div>
                <h3 className="mb-2 text-xl font-bold text-white">{service.title}</h3>
                <p className="mb-4 text-sm leading-relaxed text-slate-400">
                  {service.description}
                </p>
                {service.price && (
                  <div className="text-lg font-bold text-emerald-400">{service.price}</div>
                )}
              </div>
            ))}
          </div>
        </section>

        <section className="bg-emerald-500/[0.03] py-20">
          <div className="mx-auto max-w-6xl px-4">
            <span className="mb-4 block text-center text-[10px] font-black uppercase tracking-widest text-emerald-400">
              How We Work
            </span>
            <h2 className="mb-16 text-center text-3xl font-black tracking-tight sm:text-4xl">
              <span className="gradient-accent">Our Process</span>
            </h2>
            <div className="grid gap-8 md:grid-cols-3">
              {process.map((step) => (
                <div
                  key={step.number}
                  className="rounded-2xl border border-white/10 bg-white/[0.03] p-8 text-center transition hover:border-emerald-500/30"
                >
                  <div className="mx-auto mb-4 flex h-[60px] w-[60px] items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-emerald-300 text-lg font-black text-slate-950 shadow-[0_0_0_4px_rgba(16,185,129,0.15)]">
                    {step.number}
                  </div>
                  <h4 className="mb-2 text-base font-bold text-white">{step.title}</h4>
                  <p className="text-sm text-slate-400">{step.text}</p>
                </div>
              ))}
            </div>

            <div className="mx-auto mt-10 max-w-3xl rounded-2xl border border-white/10 bg-white/[0.03] p-8 transition hover:border-emerald-500/30">
              <div className="flex flex-col items-center gap-6 sm:flex-row">
                <div className="text-5xl">📈</div>
                <div className="text-center sm:text-left">
                  <div className="mb-1 text-[10px] font-black uppercase tracking-widest text-emerald-400">
                    Case Study
                  </div>
                  <h3 className="mb-2 text-xl font-bold text-white">Fortune 500 Retailer</h3>
                  <p className="text-sm text-slate-400">
                    Reduced AI governance gaps by 70% in 90 days using the CASA framework.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-4xl px-4 py-20 text-center">
          <h2 className="mb-4 text-3xl font-black tracking-tight sm:text-4xl">
            <span className="gradient-accent">Book a Free Consultation</span>
          </h2>
          <p className="mx-auto mb-8 max-w-xl text-slate-300">
            30-minute discovery call with a senior governance advisor. No obligation.
          </p>
          <Link
            href="/contact"
            className="inline-flex rounded-lg bg-emerald-500 px-8 py-4 text-sm font-bold text-slate-950 transition hover:bg-emerald-400"
          >
            Schedule Call
          </Link>
        </section>
      </div>
    </>
  );
}
