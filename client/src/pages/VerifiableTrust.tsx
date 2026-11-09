import { DeckPage } from "@/components/scrollworld";
import { VERIFIABLE_TRUST_HERO, VERIFIABLE_TRUST_SLIDES, VERIFIABLE_TRUST_NOT_CLAIMED, VERIFIABLE_TRUST_RELATED } from "@/data/deckWorlds/verifiableTrust";

/** /verifiable-trust — negative space and the refutation ledger. See verifiableTrust.ts for the fact-check log. */
export default function VerifiableTrust() {
  return (
    <DeckPage
      title="The science of verifiable trust | Council of AI"
      description="Explore Council of AI measurement methods, source records, verification boundaries, comparison limits and published corrections."
      hero={VERIFIABLE_TRUST_HERO}
      slides={VERIFIABLE_TRUST_SLIDES}
      notClaimed={VERIFIABLE_TRUST_NOT_CLAIMED}
      related={VERIFIABLE_TRUST_RELATED}
      jsonLd={{
        "@context": "https://schema.org",
        "@type": "Article",
        headline: "Verifiable measurement methods, source records and corrections",
        publisher: { "@type": "Organization", name: "CSOAI Ltd", url: "https://councilof.ai", identifier: "UK Companies House 16939677" },
        about: "Measurement discipline: honesty gating, honest ties, and published retractions.",
      }}
    />
  );
}
