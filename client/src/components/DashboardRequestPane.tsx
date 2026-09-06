import {
  ArrowRight,
  ClipboardCheck,
  ShieldAlert,
} from "lucide-react";
import { Link } from "wouter";
import { useSearch } from "wouter";
import { Button } from "@/components/ui/button";

export const REQUEST_ATTESTATION_CONTRACT = {
  tool: "commission_card",
  route: "/api/request-attestation",
  requestState: "PAYMENT_REQUIRED",
  deliveredState: "DELIVERED",
  freshRunState: "UNMEASURED",
  verifyRoute: "/gspc-verify",
} as const;

export default function DashboardRequestPane() {
  const search = useSearch();
  const params = new URLSearchParams(
    search.startsWith("?") ? search.slice(1) : search,
  );
  const isPricingOverview = params.get("task") === "pricing-overview";
  return (
    <section
      className="mx-auto max-w-6xl px-5 py-7 sm:px-8"
      aria-labelledby="request-attestation-title"
    >
      <div className="rounded-2xl border border-emerald-900/10 bg-[linear-gradient(135deg,#04120c_0%,#073b2b_100%)] p-6 text-white shadow-sm sm:p-7">
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div className="max-w-3xl">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-200">
              Council of AI · Paid assessment
            </p>
            <h1
              id="request-attestation-title"
              className="mt-2 text-3xl font-semibold tracking-tight"
            >
              Paid assessment — booking not live
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-emerald-50/80">
              Coming — Paddle. Waitlist only. No price on this page until Nick names one. A signed pack enquiry is an enquiry, never a bought rank. Public verify stays free at /gspc-verify. Never a grade. Never Stripe. Never free RAS.
            </p>
            {isPricingOverview ? (
              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-emerald-50/80">
                Pricing overview: waitlist and enquiry only until Nick names a price. Verify stays free. A grade is never sold. Never Stripe. Never free RAS.
              </p>
            ) : null}
          </div>
          <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-right">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-emerald-200/70">
              Booking desk
            </p>
            <code className="mt-1 block text-xs text-white">Coming — Paddle</code>
            <code className="mt-0.5 block text-[10px] text-emerald-100/70">
              no seats · no Stripe
            </code>
          </div>
        </div>
        <div className="mt-5">
          <Button disabled={true} aria-disabled="true" className="bg-emerald-400/40 text-[#03110b] cursor-not-allowed">
            Coming — Paddle
          </Button>
        </div>
      </div>

      <div className="mt-5 grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(16rem,.42fr)]">
        <div className="flex items-start gap-3 rounded-xl border border-emerald-800/15 bg-emerald-50/55 p-4">
          <ClipboardCheck
            className="mt-0.5 h-4 w-4 shrink-0 text-emerald-800"
            aria-hidden="true"
          />
          <div>
            <p className="text-xs font-semibold text-emerald-950">
              Waitlist / enquiry only
            </p>
            <p className="mt-1 text-[11px] leading-relaxed text-emerald-950/80">
              Coming — Paddle. No seats. No Stripe. No invented £. Waitlist/enquiry only until Nick names price. Verify free. Measurement credential, never a grade.
              The older <code className="font-mono text-[10px]">POST /api/assess</code> classifier does not fetch the system and must not substitute for a measurement.
            </p>
          </div>
        </div>

        <Link
          href={REQUEST_ATTESTATION_CONTRACT.verifyRoute}
          className="group flex items-center justify-between gap-3 rounded-xl border border-border bg-card p-4 transition hover:border-emerald-700/35 hover:shadow-sm"
        >
          <span>
            <span className="block text-xs font-semibold text-foreground">
              Public verify stays free
            </span>
            <span className="mt-1 block text-[11px] leading-relaxed text-muted-foreground">
              /gspc-verify — free, never a bought rank.
            </span>
          </span>
          <ArrowRight
            className="h-4 w-4 shrink-0 text-emerald-800 transition group-hover:translate-x-0.5"
            aria-hidden="true"
          />
        </Link>
      </div>

      <aside className="mt-5 flex items-start gap-3 rounded-xl border border-amber-800/20 bg-amber-50/70 p-4">
        <ShieldAlert
          className="mt-0.5 h-4 w-4 shrink-0 text-amber-900"
          aria-hidden="true"
        />
        <div>
          <p className="text-xs font-semibold text-amber-950">
            Never free RAS. Never Stripe. Never MetaMask checkout on this desk.
          </p>
          <p className="mt-1 text-[11px] leading-relaxed text-amber-950/80">
            Contract pointer <code className="font-mono text-[10px]">{REQUEST_ATTESTATION_CONTRACT.tool}</code> / <code className="font-mono text-[10px]">{REQUEST_ATTESTATION_CONTRACT.route}</code> remains for agents; human booking is Coming — Paddle when wired. Payment never creates a MEASURED cell. A fresh run remains UNMEASURED until a published run actually exists. States PAYMENT_REQUIRED and DELIVERED are not live checkout on this page.
          </p>
        </div>
      </aside>
    </section>
  );
}
