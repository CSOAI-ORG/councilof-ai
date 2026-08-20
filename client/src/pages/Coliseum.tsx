import { DeckPage } from "@/components/scrollworld";
import { COLISEUM_HERO, COLISEUM_SLIDES, COLISEUM_NOT_CLAIMED, COLISEUM_RELATED } from "@/data/deckWorlds/coliseum";

/** /coliseum — the arena story as a scroll-world. Source deck fact-checked; see coliseum.ts. */
export default function Coliseum() {
  return (
    <DeckPage
      title="The Coliseum of AI | Council of AI"
      description="Frontier AI systems measured against frozen statutory text by deterministic rules — never by another model. Signed, recomputable results from Council of AI (CSOAI LTD, UK 16939677). Measurement, not certification."
      hero={COLISEUM_HERO}
      slides={COLISEUM_SLIDES}
      notClaimed={COLISEUM_NOT_CLAIMED}
      related={COLISEUM_RELATED}
      jsonLd={{
        "@context": "https://schema.org",
        "@type": "Article",
        headline: "The Coliseum of AI — measuring frontier systems against statutory law",
        publisher: { "@type": "Organization", name: "CSOAI Ltd", url: "https://councilof.ai", identifier: "UK Companies House 16939677" },
        about: "Deterministic measurement of AI behaviour against frozen statutory provisions.",
      }}
    />
  );
}
