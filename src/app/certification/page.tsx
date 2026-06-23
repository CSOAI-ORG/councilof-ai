import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "CASA Certification — CSOAI",
  description:
    "Industry-standard AI safety certification programme by CSOAI. Demonstrate your organisation's commitment to responsible AI governance with internationally recognised credentials.",
  openGraph: {
    title: "CASA Certification — CSOAI",
    description:
      "The gold standard in AI safety certification. Choose Foundation, Professional, or Enterprise certification tiers.",
    images: ["/api/og?title=CASA%20Certification&desc=AI%20safety%20certification%20by%20CSOAI"],
  },
  alternates: { canonical: "/certification" },
};

const productSchema = {
  "@context": "https://schema.org",
  "@type": "Product",
  name: "CASA Certification",
  description:
    "Industry-standard AI safety certification programme by CSOAI. Demonstrate your organisation's commitment to responsible AI governance with internationally recognised credentials.",
  brand: {
    "@type": "Organization",
    name: "CSOAI",
  },
  offers: {
    "@type": "Offer",
    priceCurrency: "GBP",
    price: "4999",
    availability: "https://schema.org/InStock",
    url: "https://csoai.org/certification",
  },
};

const tiers = [
  {
    emoji: "🥉",
    name: "CASA Foundation",
    price: "$4,999",
    description:
      "Essential AI governance baseline. Ideal for startups and SMEs beginning their AI safety journey.",
    features: [
      "Core governance assessment",
      "Risk register template",
      "12-month validity",
      "Digital badge & certificate",
      "Listed in CSOAI registry",
    ],
    cta: "Start Exam",
    href: "https://app.csoai.org/certification/exam",
    featured: false,
  },
  {
    emoji: "🥈",
    name: "CASA Professional",
    price: "$14,999",
    description:
      "Comprehensive AI safety certification. Full ISO 42001 alignment with ongoing support.",
    features: [
      "Everything in Foundation",
      "Full 52-article charter audit",
      "ISO 42001 crosswalk report",
      "Quarterly review calls",
      "24-month validity",
      "Priority listing in registry",
    ],
    cta: "Apply Now",
    href: "/contact",
    featured: true,
  },
  {
    emoji: "🥇",
    name: "CASA Enterprise",
    price: "Custom",
    description:
      "Government & large enterprise grade. Full Byzantine consensus integration and dedicated support.",
    features: [
      "Everything in Professional",
      "Byzantine consensus layer",
      "Dedicated governance officer",
      "Multi-framework crosswalk",
      "36-month validity",
      "White-glove onboarding",
    ],
    cta: "Contact Sales",
    href: "/contact",
    featured: false,
  },
];

const steps = [
  {
    number: "1",
    title: "Application",
    text: "Submit your organisation profile and current AI governance status",
  },
  {
    number: "2",
    title: "Assessment",
    text: "Our auditors review against the 52-article charter framework",
  },
  {
    number: "3",
    title: "Remediation",
    text: "Address any gaps with our guided implementation support",
  },
  {
    number: "4",
    title: "Certification",
    text: "Receive your CASA certification and digital trust badge",
  },
];

const standards = ["ISO 42001", "NIST AI RMF", "EU AI Act", "IEEE 7000", "UK AISI"];

const faqs = [
  {
    question: "What happens if I fail?",
    answer:
      "You receive a detailed gap report and can retake the exam once at no extra cost within 30 days.",
  },
  {
    question: "How long is the certification valid?",
    answer:
      "CASA Foundation is valid for 12 months, Professional for 24 months, and Enterprise for 36 months. All tiers include a streamlined renewal process.",
  },
  {
    question: "Is the audit conducted remotely?",
    answer:
      "Yes — our auditors can conduct the full assessment remotely via secure video calls and document review. On-site options are available for Enterprise clients.",
  },
];

const testimonials = [
  {
    quote:
      "CSOAI's CASA certification gave our board the language and framework we needed to govern AI responsibly.",
    author: "— Director of Risk, Global Bank",
  },
  {
    quote:
      "The audit was rigorous, fair, and genuinely improved our safety posture.",
    author: "— CTO, HealthTech Startup",
  },
];

export default function CertificationPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }}
      />

      <div className="min-h-screen bg-slate-950 text-white">
        <section className="mx-auto max-w-6xl px-4 pb-20 pt-32 text-center">
          <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-emerald-400">
            CSOAI Certification Programme
          </span>
          <h1 className="mb-6 text-4xl font-black tracking-tighter sm:text-6xl">
            <span className="gradient-text">CASA Certification</span>
          </h1>
          <p className="mx-auto mb-10 max-w-2xl text-lg leading-relaxed text-slate-300">
            The gold standard in AI safety certification. Demonstrate your organisation&apos;s
            commitment to responsible AI governance with internationally recognised credentials.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="https://app.csoai.org/certification/exam"
              className="inline-flex rounded-lg bg-emerald-500 px-6 py-3 text-sm font-bold text-slate-950 transition hover:bg-emerald-400"
            >
              Take the Certification Exam
            </Link>
            <Link
              href="/pricing"
              className="inline-flex rounded-lg border-2 border-emerald-500 px-6 py-3 text-sm font-bold text-emerald-400 transition hover:bg-emerald-500 hover:text-slate-950"
            >
              View Pricing
            </Link>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-20">
          <span className="mb-4 block text-[10px] font-black uppercase tracking-widest text-emerald-400">
            Certification Tiers
          </span>
          <h2 className="mb-12 text-3xl font-black tracking-tight sm:text-4xl">
            <span className="gradient-accent">Choose Your Level</span>
          </h2>
          <div className="grid gap-6 md:grid-cols-3">
            {tiers.map((tier) => (
              <div
                key={tier.name}
                className={`relative rounded-2xl border bg-white/[0.03] p-8 text-center transition hover:-translate-y-2 hover:border-emerald-500/30 hover:bg-white/[0.05] ${
                  tier.featured ? "border-emerald-500/40" : "border-white/10"
                }`}
              >
                {tier.featured && (
                  <div className="absolute right-0 top-0 translate-x-8 translate-y-4 rotate-45 bg-gradient-to-r from-emerald-500 to-emerald-300 px-8 py-1 text-[10px] font-bold text-slate-950">
                    POPULAR
                  </div>
                )}
                <div className="mb-4 text-4xl">{tier.emoji}</div>
                <h3 className="mb-2 text-xl font-bold text-white">{tier.name}</h3>
                <div className="mb-4 text-3xl font-black text-emerald-400">{tier.price}</div>
                <p className="mb-6 text-sm text-slate-400">{tier.description}</p>
                <ul className="mb-8 space-y-2 text-left text-sm text-slate-300">
                  {tier.features.map((feature, idx) => (
                    <li
                      key={feature}
                      className={`border-b border-white/5 py-2 ${
                        idx === tier.features.length - 1 ? "border-b-0" : ""
                      }`}
                    >
                      ✓ {feature}
                    </li>
                  ))}
                </ul>
                <Link
                  href={tier.href}
                  className={`block rounded-lg px-6 py-3 text-sm font-bold transition ${
                    tier.featured
                      ? "bg-emerald-500 text-slate-950 hover:bg-emerald-400"
                      : "border-2 border-emerald-500 text-emerald-400 hover:bg-emerald-500 hover:text-slate-950"
                  }`}
                >
                  {tier.cta}
                </Link>
              </div>
            ))}
          </div>
        </section>

        <section className="bg-emerald-500/[0.03] py-20">
          <div className="mx-auto max-w-6xl px-4">
            <span className="mb-4 block text-[10px] font-black uppercase tracking-widest text-emerald-400">
              Certification Process
            </span>
            <h2 className="mb-16 text-3xl font-black tracking-tight sm:text-4xl">
              <span className="gradient-accent">How It Works</span>
            </h2>
            <div className="relative">
              <div className="absolute left-[12.5%] right-[12.5%] top-[30px] hidden h-0.5 bg-gradient-to-r from-emerald-500 to-emerald-300 opacity-40 md:block" />
              <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
                {steps.map((step) => (
                  <div key={step.number} className="relative z-10 text-center">
                    <div className="mx-auto mb-4 flex h-[60px] w-[60px] items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-emerald-300 text-lg font-black text-slate-950 shadow-[0_0_0_4px_rgba(16,185,129,0.15)]">
                      {step.number}
                    </div>
                    <h4 className="mb-2 text-base font-bold text-white">{step.title}</h4>
                    <p className="text-sm text-slate-400">{step.text}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-16 text-center">
          <span className="mb-6 block text-[10px] font-black uppercase tracking-widest text-emerald-400">
            Aligned With Global Standards
          </span>
          <div className="flex flex-wrap justify-center gap-4 opacity-80">
            {standards.map((standard) => (
              <span
                key={standard}
                className="rounded-lg border border-white/10 bg-white/[0.03] px-4 py-2 text-sm font-semibold text-white"
              >
                {standard}
              </span>
            ))}
          </div>
        </section>

        <section className="bg-emerald-500/[0.03] py-20">
          <div className="mx-auto max-w-6xl px-4">
            <span className="mb-4 block text-[10px] font-black uppercase tracking-widest text-emerald-400">
              Common Questions
            </span>
            <h2 className="mb-12 text-3xl font-black tracking-tight sm:text-4xl">
              <span className="gradient-accent">Certification FAQ</span>
            </h2>
            <div className="mx-auto max-w-3xl space-y-4">
              {faqs.map((faq) => (
                <details
                  key={faq.question}
                  className="rounded-xl border border-white/10 bg-white/[0.03] p-4 open:bg-white/[0.05]"
                >
                  <summary className="cursor-pointer font-semibold text-white">{faq.question}</summary>
                  <p className="mt-3 text-sm leading-relaxed text-slate-300">{faq.answer}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-20">
          <span className="mb-4 block text-[10px] font-black uppercase tracking-widest text-emerald-400">
            Trusted by Leaders
          </span>
          <h2 className="mb-12 text-3xl font-black tracking-tight sm:text-4xl">
            <span className="gradient-accent">What Our Clients Say</span>
          </h2>
          <div className="grid gap-6 md:grid-cols-2">
            {testimonials.map((t) => (
              <div
                key={t.author}
                className="rounded-2xl border border-white/10 bg-white/[0.03] p-8 transition hover:-translate-y-1 hover:border-emerald-500/30"
              >
                <p className="mb-4 italic text-slate-300">&ldquo;{t.quote}&rdquo;</p>
                <div className="font-bold text-white">{t.author}</div>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 pb-20">
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-8 text-center sm:p-12">
            <h2 className="mb-4 text-3xl font-black tracking-tight sm:text-4xl">
              <span className="gradient-accent">Ready to Get Certified?</span>
            </h2>
            <p className="mx-auto mb-8 max-w-xl text-slate-300">
              Join 200+ organisations that trust CSOAI for their AI safety governance.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link
                href="https://app.csoai.org/certification/exam"
                className="inline-flex rounded-lg bg-emerald-500 px-6 py-3 text-sm font-bold text-slate-950 transition hover:bg-emerald-400"
              >
                Take the Certification Exam
              </Link>
              <Link
                href="/case-studies"
                className="inline-flex rounded-lg border-2 border-emerald-500 px-6 py-3 text-sm font-bold text-emerald-400 transition hover:bg-emerald-500 hover:text-slate-950"
              >
                See Case Studies
              </Link>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
