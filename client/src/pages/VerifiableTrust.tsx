import { DeckPage } from "@/components/scrollworld";
import { VERIFIABLE_TRUST_HERO, VERIFIABLE_TRUST_SLIDES, VERIFIABLE_TRUST_NOT_CLAIMED, VERIFIABLE_TRUST_RELATED } from "@/data/deckWorlds/verifiableTrust";

/** /verifiable-trust — negative space and the refutation ledger. See verifiableTrust.ts for the fact-check log. */
export default function VerifiableTrust() {
  return (
    <DeckPage
      title="The science of verifiable trust | Council of AI"
      description="What we refuse to measure is why the rest can be believed: the honesty gate, honest ties, unmeasured cells, and a public append-only ledger of our own retractions — including the consensus claim we withdrew about ourselves."
      hero={VERIFIABLE_TRUST_HERO}
      slides={VERIFIABLE_TRUST_SLIDES}
      notClaimed={VERIFIABLE_TRUST_NOT_CLAIMED}
      related={VERIFIABLE_TRUST_RELATED}
      jsonLd={{
        "@context": "https://schema.org",
        "@type": "Article",
        headline: "The science of verifiable trust — negative space and the refutation ledger",
        publisher: { "@type": "Organization", name: "CSOAI Ltd", url: "https://councilof.ai", identifier: "UK Companies House 16939677" },
        about: "Measurement discipline: honesty gating, honest ties, and published retractions.",
      }}
    />
  );
}
