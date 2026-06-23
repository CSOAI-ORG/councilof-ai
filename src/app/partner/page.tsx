import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Partner Program — CSOAI Layer 0",
  description:
    "Integrate CSOAI trust infrastructure into your platform. Reseller and technical partner programs for cloud providers, payment gateways, and agent frameworks.",
  alternates: { canonical: "/partner" },
  openGraph: {
    title: "Partner Program — CSOAI Layer 0",
    description:
      "Integrate CSOAI trust infrastructure into your platform. Reseller and technical partner programs.",
  },
};

const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "CSOAI",
  url: "https://csoai.org",
  sameAs: ["https://github.com/csoai-org"],
};

export default function PartnerPage() {
  return (
    <div className="min-h-screen bg-slate-950 px-6 py-20 text-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
      />
      <div className="mx-auto max-w-3xl text-center">
        <h1 className="mb-6 text-4xl font-black tracking-tighter sm:text-5xl">
          Layer 0 Partner Program
        </h1>
        <p className="mb-12 text-lg text-slate-400">
          Integrate CSOAI trust infrastructure into your platform. For cloud providers, payment
          gateways, and agent frameworks.
        </p>

        <div className="grid gap-8 sm:grid-cols-2">
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-8 text-left">
            <h3 className="mb-3 text-xl font-bold text-emerald-400">Reseller Partners</h3>
            <p className="mb-8 text-slate-400">
              Sell Layer 0 Certification to your clients and earn 30% recurring commission.
            </p>
            <Link
              href="/contact"
              className="block rounded-lg bg-emerald-500 px-6 py-3 text-center text-sm font-bold text-slate-950 transition hover:bg-emerald-400"
            >
              Apply Now
            </Link>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-8 text-left">
            <h3 className="mb-3 text-xl font-bold text-emerald-400">Technical Partners</h3>
            <p className="mb-8 text-slate-400">
              Build native &quot;Compliance Pre-Check&quot; tunnels for your protocol (A2A/x402).
            </p>
            <Link
              href="/contact"
              className="block rounded-lg bg-emerald-500 px-6 py-3 text-center text-sm font-bold text-slate-950 transition hover:bg-emerald-400"
            >
              Get SDK Access
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
