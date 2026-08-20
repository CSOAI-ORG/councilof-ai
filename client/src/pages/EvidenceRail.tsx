import { DeckPage } from "@/components/scrollworld";
import { EVIDENCE_RAIL_HERO, EVIDENCE_RAIL_SLIDES, EVIDENCE_RAIL_NOT_CLAIMED, EVIDENCE_RAIL_RELATED } from "@/data/deckWorlds/evidenceRail";

/** /evidence-rail — the independent evidence layer. See evidenceRail.ts for the fact-check log. */
export default function EvidenceRail() {
  return (
    <DeckPage
      title="The independent evidence rail | Council of AI"
      description="An AI measurement layer that signs evidence instead of selling evaluations: deterministic grading, Ed25519 signatures over a SHA-256 hash chain, delta cards when the law moves, and no money taken from anything we rank."
      hero={EVIDENCE_RAIL_HERO}
      slides={EVIDENCE_RAIL_SLIDES}
      notClaimed={EVIDENCE_RAIL_NOT_CLAIMED}
      related={EVIDENCE_RAIL_RELATED}
      jsonLd={{
        "@context": "https://schema.org",
        "@type": "Article",
        headline: "The independent evidence rail for AI",
        publisher: { "@type": "Organization", name: "CSOAI Ltd", url: "https://councilof.ai", identifier: "UK Companies House 16939677" },
        about: "An independent, signed measurement layer for AI behaviour.",
      }}
    />
  );
}
