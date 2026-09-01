import { useEffect } from "react";
import { setMetaDescription } from "@/lib/utils";

/**
 * /firewall-charter — the Measurement/Remediation Firewall Charter.
 * One page, publicly stated, so the independence rule is a published commitment
 * rather than an internal policy. Doctrine sources: ISO/IEC 17021-1 §5.2.5,
 * SOX §201, CRA Regulation (EC) 1060/2009 Art 6(4) — every regime encodes the
 * same rule: the entity that measures cannot also fix what it measures for the
 * same client and keep calling its output independent.
 */

const PRINCIPLES: { title: string; body: string }[] = [
  {
    title: "1 · We measure and sign. We never operate the fixer.",
    body:
      "Council of AI publishes machine-readable findings and remediation recipes. Any provider — including unaffiliated third parties — may implement fixes. Council of AI does not sell, operate, or prioritise remediation services for anything it measures.",
  },
  {
    title: "2 · Re-measurement is free and unpurchasable.",
    body:
      "After any fix, by any provider, re-measurement runs on the same free queue as everyone else. It cannot be bought, expedited, or prioritised by payment. No payment metadata ever reaches the measurement or signing path.",
  },
  {
    title: "3 · Nobody we rank ever pays us.",
    body:
      "No measured or ranked entity pays Council of AI for measurement, placement, cadence, or visibility. Evidence products are sold only to observers — insurers, procurement, researchers, regulators — never to the measured.",
  },
  {
    title: "4 · The signing key is isolated.",
    body:
      "The Ed25519 signing key lives on an isolated signing node. It is never reachable from any payment system, engagement telemetry, remediation tool, worker process, or public-facing surface. A signature attests a sealed measurement and nothing else.",
  },
  {
    title: "5 · Affiliated services are disclosed, never preferred.",
    body:
      "If an affiliated product (for example, any service operated by the same ownership) offers remediation, the affiliation is disclosed at the point of engagement, it receives no ranking or priority preference, and its customers are re-measured on the same free queue as everyone else.",
  },
  {
    title: "6 · Engagement fills the funnel; only sealed measurement fills the board.",
    body:
      "Usage and demand signals may inform which systems get measured and how the product evolves. They never influence how anything scores, a score's value, board ordering, or MEASURED/UNMEASURED state. Sealed instruments are the sole source of signed scores.",
  },
  {
    title: "7 · Corrections are published, never silently edited.",
    body:
      "When we are wrong, the correction is appended and signed; the original stays. History is append-only. A measurement body that can quietly rewrite its own record is not a measurement body.",
  },
];

export default function FirewallCharter() {
  useEffect(() => {
    document.title = "Measurement/Remediation Firewall Charter | Council of AI";
    setMetaDescription("The Measurement/Remediation Firewall Charter: Council of AI (CSOAI LTD, UK 16939677) measures and signs evidence but never sells remediation on what it ranks — the conflict-of-interest firewall, in full.");
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 via-white to-white">
      <div className="mx-auto max-w-3xl px-6 py-16">
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-emerald-600">
          Council of AI — published commitment
        </p>
        <h1 className="mt-3 text-4xl font-black leading-tight text-gray-900">
          The Measurement/Remediation Firewall Charter
        </h1>
        <p className="mt-4 text-lg text-gray-600">
          The auditor-independence canon — ISO/IEC 17021-1 §5.2.5, SOX §201, the Credit Rating
          Agency Regulation Art 6(4) — encodes one rule in three regimes:{" "}
          <strong className="text-gray-900">
            the entity that measures cannot also fix what it measures and keep calling its output
            independent.
          </strong>{" "}
          This page is our version of that rule, stated publicly so it can be held against us.
        </p>

        <div className="mt-10 space-y-6">
          {PRINCIPLES.map((p) => (
            <section key={p.title} className="rounded-xl border border-emerald-600/15 bg-white p-5 shadow-sm">
              <h2 className="text-base font-extrabold text-gray-900">{p.title}</h2>
              <p className="mt-2 text-[15px] leading-relaxed text-gray-600">{p.body}</p>
            </section>
          ))}
        </div>

        <div className="mt-10 rounded-xl bg-emerald-600/5 border border-emerald-600/20 p-5">
          <p className="text-sm leading-relaxed text-gray-700">
            <strong>Register.</strong> Council of AI is a measurement body, not a certification,
            accreditation, or notified body. Measurement is not endorsement. Verification of any
            signed record is free forever, for everyone —{" "}
            <a href="/gspc-verify" className="font-semibold text-emerald-700 underline">
              verify a card
            </a>
            {" · "}
            <a href="/doctrine" className="font-semibold text-emerald-700 underline">
              doctrine
            </a>
            . Charter v1.0 · published 2026-08-19 · corrections to this charter are themselves
            appended, never silently edited.
          </p>
        </div>
      </div>
    </div>
  );
}
