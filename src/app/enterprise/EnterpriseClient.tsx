"use client";

import { useState } from "react";
import Link from "next/link";

const plans = [
  {
    name: "Startup",
    description: "Up to 50 employees",
    monthly: "$499/mo",
    annual: "$399/mo",
    features: [
      "5 AI systems monitored",
      "CASA Foundation prep",
      "Basic compliance dashboard",
      "Email support",
    ],
    cta: "Get Started",
    href: "/contact",
    highlighted: false,
  },
  {
    name: "Growth",
    description: "Up to 500 employees",
    monthly: "$1,999/mo",
    annual: "$1,599/mo",
    features: [
      "25 AI systems monitored",
      "CASA Professional prep",
      "Full compliance dashboard",
      "Multi-framework crosswalks",
      "Dedicated CSM",
    ],
    cta: "Apply Now",
    href: "/contact",
    highlighted: true,
  },
  {
    name: "Enterprise",
    description: "Unlimited scale",
    price: "Custom",
    features: [
      "Unlimited AI systems",
      "Byzantine consensus layer",
      "On-premise deployment",
      "Custom integrations",
      "24/7 priority support",
    ],
    cta: "Contact Sales",
    href: "/contact",
    highlighted: false,
  },
];

const buyButtons = [
  {
    title: "Enterprise Compliance",
    price: "£1,499/month",
    description:
      "AI system audits across EU AI Act, DORA, NIS2, CRA. White-label your own evidence pages. SLA + dedicated CSOAI engineer.",
    href: "https://buy.stripe.com/28E7sNdkEeUW5g96as8k91U",
    cta: "Subscribe Enterprise →",
    border: "border-[#c9a84c]",
    text: "text-[#c9a84c]",
    bg: "bg-[#c9a84c]",
    note: "Cancel anytime · Volume discount for 5+ systems · CSOAI LTD",
  },
  {
    title: "Pro Compliance",
    price: "£199/month",
    description:
      "Up to 50 AI system audits per month. Dashboard of all attested systems. Charter-mapped risk classification. Watchdog Certificate on demand.",
    href: "https://buy.stripe.com/eVq14p1BWcMO4c59mE8k91T",
    cta: "Subscribe Pro →",
    border: "border-[#10B981]",
    text: "text-[#10B981]",
    bg: "bg-[#10B981]",
    note: "Free 7-day trial · Cancel anytime · CSOAI LTD",
  },
  {
    title: "Watchdog Certificate",
    price: "£4,950 one-time",
    description:
      "One signed certificate per AI system, valid for the lifetime of the cert. White-label option. Branded to your company.",
    href: "https://buy.stripe.com/9B6dRb2G0eUWcIBaqI8k91Y",
    cta: "Buy Watchdog Cert →",
    border: "border-[#FBBF24]",
    text: "text-[#FBBF24]",
    bg: "bg-[#FBBF24]",
    note: null,
  },
  {
    title: "Audit-Prep Bundle",
    price: "£4,950 one-time",
    description:
      "Pre-audit readiness package: full gap analysis, remediation plan, mock audit, signed deliverables.",
    href: "https://buy.stripe.com/28E6oJ94ofZ0aAt1Uc8k91X",
    cta: "Buy Audit-Prep →",
    border: "border-[#14B8A6]",
    text: "text-[#14B8A6]",
    bg: "bg-[#14B8A6]",
    note: null,
  },
];

export default function EnterpriseClient() {
  const [billing, setBilling] = useState<"monthly" | "annual">("monthly");

  return (
    <>
      {/* Pricing */}
      <section className="bg-emerald-500/[0.03] py-20">
        <div className="mx-auto max-w-6xl px-4">
          <div className="mb-4 text-center text-[10px] font-black uppercase tracking-widest text-emerald-400">
            Pricing
          </div>
          <h2 className="mb-6 text-center text-3xl font-black tracking-tight sm:text-4xl">
            <span className="gradient-accent">Enterprise Plans</span>
          </h2>

          <div className="mb-10 flex justify-center">
            <div className="flex rounded-full border border-white/10 bg-white/[0.03] p-1">
              <button
                type="button"
                onClick={() => setBilling("monthly")}
                className={`rounded-full px-6 py-2 text-sm font-bold transition ${
                  billing === "monthly"
                    ? "bg-emerald-500 text-slate-950"
                    : "text-slate-300 hover:text-white"
                }`}
              >
                Monthly
              </button>
              <button
                type="button"
                onClick={() => setBilling("annual")}
                className={`rounded-full px-6 py-2 text-sm font-bold transition ${
                  billing === "annual"
                    ? "bg-emerald-500 text-slate-950"
                    : "text-slate-300 hover:text-white"
                }`}
              >
                Annual{" "}
                <span className="ml-1 text-xs text-emerald-400">Save 20%</span>
              </button>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`rounded-2xl border bg-white/[0.03] p-8 text-center transition hover:-translate-y-2 hover:border-emerald-500/30 hover:bg-white/[0.05] ${
                  plan.highlighted ? "border-emerald-500/40" : "border-white/10"
                }`}
              >
                <h3 className="mb-2 text-xl font-bold text-white">{plan.name}</h3>
                <p className="mb-6 text-sm text-slate-400">{plan.description}</p>
                <div className="mb-6 text-3xl font-black text-emerald-400">
                  {plan.price ?? (billing === "monthly" ? plan.monthly : plan.annual)}
                </div>
                <ul className="mb-8 space-y-2 text-left text-sm text-slate-300">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2">
                      <span className="text-emerald-400">✓</span>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  href={plan.href}
                  className={`inline-flex w-full items-center justify-center rounded-lg px-6 py-3 text-sm font-bold transition ${
                    plan.highlighted
                      ? "bg-emerald-500 text-slate-950 hover:bg-emerald-400"
                      : "border border-emerald-500/50 text-emerald-400 hover:bg-emerald-500/10"
                  }`}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stripe Buy Buttons */}
      <section className="mx-auto max-w-6xl px-4 py-20">
        <h2 className="mb-10 text-center text-2xl font-black tracking-tight sm:text-3xl">
          <span className="gradient-accent">Take Action Now</span>
        </h2>
        <div className="mx-auto max-w-2xl space-y-8">
          {buyButtons.map((btn) => (
            <div
              key={btn.title}
              className={`rounded-2xl border-2 ${btn.border} bg-white/[0.03] p-8 text-center`}
            >
              <h3 className={`mb-2 text-xl font-bold ${btn.text}`}>
                {btn.title} — {btn.price}
              </h3>
              <p className="mb-6 text-slate-300">{btn.description}</p>
              <a
                href={btn.href}
                target="_blank"
                rel="noopener noreferrer"
                className={`inline-block rounded-lg ${btn.bg} px-8 py-3 text-sm font-bold uppercase tracking-widest text-slate-950 transition hover:opacity-90`}
              >
                {btn.cta}
              </a>
              {btn.note && <p className="mt-4 text-xs text-slate-400">{btn.note}</p>}
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
