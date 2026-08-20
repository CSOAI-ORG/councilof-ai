import { useEffect } from "react";
import { setMetaDescription } from "@/lib/utils";
import { Band, Caveat, PageHero, Panel, PanelGrid } from "@/components/pagekit/PageKit";

/**
 * /firewall-charter — the Measurement/Remediation Firewall Charter.
 * One page, publicly stated, so the independence rule is a published commitment
 * rather than an internal policy. Doctrine sources: ISO/IEC 17021-1 §5.2.5,
 * SOX §201, CRA Regulation (EC) 1060/2009 Art 6(4) — every regime encodes the
 * same rule: the entity that measures cannot also fix what it measures for the
 * same client and keep calling its output independent.
 *
 * Design: the homepage scroll-world language via components/pagekit/PageKit.
 */

const PRINCIPLES: { n: string; title: string; body: string }[] = [
  {
    n: "01",
    title: "We measure and sign. We never operate the fixer.",
    body:
      "Council of AI publishes machine-readable findings and remediation recipes. Any provider — including unaffiliated third parties — may implement the fix. Council of AI does not sell, operate, or prioritise remediation services for anything it measures.",
  },
  {
    n: "02",
    title: "Re-measurement is free, and cannot be bought.",
    body:
      "After any fix, by any provider, re-measurement runs on the same free queue as everyone else. It cannot be purchased, expedited, or prioritised by payment. No payment metadata ever reaches the measurement or signing path.",
  },
  {
    n: "03",
    title: "Nobody we rank ever pays us.",
    body:
      "No measured or ranked entity pays Council of AI for measurement, placement, cadence, or visibility. Evidence products are sold only to observers — insurers, procurement teams, researchers, regulators — never to the measured.",
  },
  {
    n: "04",
    title: "The signing key is isolated.",
    body:
      "The Ed25519 signing key lives on an isolated signing node. It is never reachable from any payment system, engagement telemetry, remediation tool, worker process, or public-facing surface. A signature attests a sealed measurement and nothing else.",
  },
  {
    n: "05",
    title: "Affiliated services are disclosed, never preferred.",
    body:
      "If an affiliated product — for example any service under the same ownership — offers remediation, the affiliation is disclosed at the point of engagement, it receives no ranking or priority preference, and its customers are re-measured on the same free queue as everyone else.",
  },
  {
    n: "06",
    title: "Engagement fills the funnel; only sealed measurement fills the board.",
    body:
      "Usage and demand signals may inform which systems get measured and how the product evolves. They never influence how anything scores, what a score is worth, board ordering, or MEASURED / UNMEASURED state. Sealed instruments are the sole source of signed scores.",
  },
  {
    n: "07",
    title: "Corrections are published, never silently edited.",
    body:
      "When we are wrong, the correction is appended and signed; the original stays where it was. History is append-only. A measurement body that can quietly rewrite its own record is not a measurement body.",
  },
];

export default function FirewallCharter() {
  useEffect(() => {
    document.title = "Measurement/Remediation Firewall Charter | Council of AI";
    setMetaDescription("The Measurement/Remediation Firewall Charter: Council of AI (CSOAI LTD, UK 16939677) measures and signs evidence but never sells remediation on what it ranks — the conflict-of-interest firewall, in full.");
  }, []);

  return (
    <div className="min-h-screen bg-white">
      <PageHero
        kicker="Council of AI — a published commitment"
        title={
          <>
            We measure. We never sell you the fix.
          </>
        }
        lede={
          <>
            Auditor independence encodes one rule across three regimes — ISO/IEC 17021-1 §5.2.5, SOX
            §201, and the Credit Rating Agency Regulation Art 6(4):{" "}
            <strong className="text-gray-900">
              the body that measures cannot also fix what it measures and keep calling the output
              independent.
            </strong>{" "}
            This is our version of that rule, written down in public so it can be held against us.
          </>
        }
        image={{ src: "/images/secure_evidence_vault.jpg", alt: "A sealed vault holding signed evidence cards, guarded and apart from everything else" }}
        contentRight
        points={[
          { tag: "pain", text: "Most AI assurance vendors grade you, then quote you for the remediation. The grade is the sales lead." },
          { tag: "benefit", text: "Findings you can hand to any provider — or your own team — with no commercial hook attached." },
          { tag: "usp", text: "Re-measurement after a fix is free and unpurchasable. Nobody we rank ever pays us." },
        ]}
        actions={[
          { href: "/gspc-verify", label: "Verify a signed card" },
          { href: "/honesty", label: "See where we fail", tone: "ghost" },
        ]}
      />

      <Band
        tone="tint"
        kicker="The charter · v1.0 · published 2026-08-19"
        title={<>Seven commitments, each one falsifiable.</>}
        lede={
          <>
            None of these is a value statement. Each describes a mechanism you could catch us
            breaking — which is the only kind of commitment worth publishing.
          </>
        }
      >
        <PanelGrid cols={2}>
          {PRINCIPLES.map((p) => (
            <Panel key={p.n}>
              <span className="font-mono text-xs font-bold tracking-[0.2em] text-emerald-600">{p.n}</span>
              <h2 className="mt-2 text-xl font-black leading-snug tracking-tight text-gray-900">{p.title}</h2>
              <p className="mt-3 text-[15px] leading-relaxed text-gray-600">{p.body}</p>
            </Panel>
          ))}
        </PanelGrid>
      </Band>

      <Band width="prose">
        <Caveat title="The register — what Council of AI is not">
          <p>
            Council of AI is a <strong>measurement body</strong>. It is not a certification body, not
            an accreditation body, and not a notified body. It issues no conformity mark and no
            approval. Measurement is not endorsement, and a signed record says what a system did on a
            published test — nothing more.
          </p>
          <p>
            Verification of any signed record is free forever, for everyone —{" "}
            <a href="/gspc-verify" className="font-semibold underline">
              verify a card
            </a>
            . Charter v1.0, published 2026-08-19. Corrections to this charter are themselves
            appended, never silently edited.
          </p>
        </Caveat>
      </Band>
    </div>
  );
}
