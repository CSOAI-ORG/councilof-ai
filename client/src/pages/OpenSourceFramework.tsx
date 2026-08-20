import { DeckPage } from "@/components/scrollworld";
import { OPEN_SOURCE_HERO, OPEN_SOURCE_SLIDES, OPEN_SOURCE_NOT_CLAIMED, OPEN_SOURCE_RELATED } from "@/data/deckWorlds/openSource";

/** /open-source — the open-standards architecture as a scroll-world. See openSource.ts for the fact-check log. */
export default function OpenSourceFramework() {
  return (
    <DeckPage
      title="The open-source framework | Council of AI"
      description="Council of AI invents no protocols: the measurement rail is assembled from open, permissively licensed standards — model-context tooling, agent-to-agent messaging, decentralised identity and C2PA provenance — with the measured limits of each published."
      hero={OPEN_SOURCE_HERO}
      slides={OPEN_SOURCE_SLIDES}
      notClaimed={OPEN_SOURCE_NOT_CLAIMED}
      related={OPEN_SOURCE_RELATED}
      jsonLd={{
        "@context": "https://schema.org",
        "@type": "TechArticle",
        headline: "The Council of AI open-source framework",
        publisher: { "@type": "Organization", name: "CSOAI Ltd", url: "https://councilof.ai", identifier: "UK Companies House 16939677" },
        about: "Open standards used to build an independent AI measurement rail.",
      }}
    />
  );
}
