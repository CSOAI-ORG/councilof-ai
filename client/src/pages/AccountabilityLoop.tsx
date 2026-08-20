import { DeckPage } from "@/components/scrollworld";
import { LOOP_HERO, LOOP_SLIDES, LOOP_NOT_CLAIMED, LOOP_RELATED } from "@/data/deckWorlds/accountabilityLoop";

/** /accountability-loop — public report to actionable complaint. State one runs; the rest is design. See accountabilityLoop.ts. */
export default function AccountabilityLoop() {
  return (
    <DeckPage
      title="The accountability loop — from a public report to a complaint a regulator can open | Council of AI"
      description="A published design for turning a member of the public's report about an AI system into evidence a market surveillance authority can act on, without publishing an allegation before the provider has been notified and given a reply. State one runs; escrow, the reply window and the complaint compiler are design."
      hero={LOOP_HERO}
      slides={LOOP_SLIDES}
      notClaimed={LOOP_NOT_CLAIMED}
      related={LOOP_RELATED}
      jsonLd={{
        "@context": "https://schema.org",
        "@type": "Article",
        headline: "The accountability loop — notice before publication, and a complaint an authority can open",
        publisher: { "@type": "Organization", name: "CSOAI Ltd", url: "https://councilof.ai", identifier: "UK Companies House 16939677" },
        about: "Public AI incident reporting designed around notice and right of reply, and the EU AI Act Article 85 right to lodge a complaint with a market surveillance authority.",
      }}
    />
  );
}
