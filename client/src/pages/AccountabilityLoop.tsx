import { DeckPage } from "@/components/scrollworld";
import {
  LOOP_HERO,
  LOOP_SLIDES,
  LOOP_NOT_CLAIMED,
  LOOP_RELATED,
} from "@/data/deckWorlds/accountabilityLoop";

/** /accountability-loop — public report to actionable complaint. Proposed design; incident intake remains closed. See accountabilityLoop.ts. */
export default function AccountabilityLoop() {
  return (
    <DeckPage
      title="The accountability loop: a proposed evidence workflow | Council of AI"
      description="A proposed workflow for private intake, review, reply and referenced evidence. Public incident intake is closed; inspect current claim records and corrections."
      hero={LOOP_HERO}
      slides={LOOP_SLIDES}
      notClaimed={LOOP_NOT_CLAIMED}
      related={LOOP_RELATED}
      jsonLd={{
        "@context": "https://schema.org",
        "@type": "Article",
        headline: "The accountability loop: a proposed evidence workflow",
        publisher: {
          "@type": "Organization",
          name: "CSOAI Ltd",
          url: "https://councilof.ai",
          identifier: "UK Companies House 16939677",
        },
        about:
          "Public AI incident reporting designed around notice and right of reply, and the EU AI Act Article 85 right to lodge a complaint with a market surveillance authority.",
      }}
    />
  );
}
