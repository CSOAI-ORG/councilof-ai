import { DeckPage } from "@/components/scrollworld";
import { METROLOGY_HERO, METROLOGY_SLIDES, METROLOGY_NOT_CLAIMED, METROLOGY_RELATED } from "@/data/deckWorlds/metrology";

/** /metrology — games as calibrated measurement instruments. Published DOCTRINE, not shipped product. See metrology.ts. */
export default function Metrology() {
  return (
    <DeckPage
      title="The metrology apparatus | Council of AI"
      description="Games as calibrated measurement instruments: why procedurally generated, novel-per-eval, seed-deterministic environments resist contamination — a published Council of AI doctrine, with what runs today separated from what is design."
      hero={METROLOGY_HERO}
      slides={METROLOGY_SLIDES}
      notClaimed={METROLOGY_NOT_CLAIMED}
      related={METROLOGY_RELATED}
      jsonLd={{
        "@context": "https://schema.org",
        "@type": "Article",
        headline: "The metrology apparatus — games as calibrated measurement instruments for frontier AI",
        publisher: { "@type": "Organization", name: "CSOAI Ltd", url: "https://councilof.ai", identifier: "UK Companies House 16939677" },
        about: "Procedurally generated, deterministic interactive environments as contamination-resistant measurement instruments.",
      }}
    />
  );
}
