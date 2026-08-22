import { DeckPage } from "@/components/scrollworld";
import {
  PREDICATE_HERO,
  PREDICATE_SLIDES,
  PREDICATE_NOT_CLAIMED,
  PREDICATE_RELATED,
} from "@/data/deckWorlds/predicateCompiler";

/** /statute-to-predicate — how a frozen provision becomes a boolean a stranger can run. See predicateCompiler.ts for the corrections applied to the source deck. */
export default function StatuteToPredicate() {
  return (
    <DeckPage
      title="From statute to predicate — how a law becomes a test | Council of AI"
      description="How Council of AI turns a frozen statutory provision into a deterministic boolean predicate: the frozen statute corpus, structural extraction, the Article 14 worked example, and the Ed25519-signed record it produces. Measurement, not certification."
      hero={PREDICATE_HERO}
      slides={PREDICATE_SLIDES}
      notClaimed={PREDICATE_NOT_CLAIMED}
      related={PREDICATE_RELATED}
      jsonLd={{
        "@context": "https://schema.org",
        "@type": "TechArticle",
        headline: "From statute to predicate — compiling a legal provision into a deterministic test",
        publisher: {
          "@type": "Organization",
          name: "CSOAI Ltd",
          url: "https://councilof.ai",
          identifier: "UK Companies House 16939677",
        },
        about:
          "Deterministic predicate authoring: parsing frozen statutory provisions into boolean conditions, evaluated without any model in the scoring path, and signed with Ed25519 over RFC-8785 canonical JSON.",
        proficiencyLevel: "Expert",
      }}
    />
  );
}