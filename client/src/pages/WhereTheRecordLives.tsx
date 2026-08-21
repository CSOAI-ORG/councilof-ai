import { DeckPage } from "@/components/scrollworld";
import { RECORD_HERO, RECORD_SLIDES, RECORD_NOT_CLAIMED, RECORD_RELATED } from "@/data/deckWorlds/whereTheRecordLives";

/** /where-the-record-lives — mirror redundancy, stated exactly. Not indestructibility. See whereTheRecordLives.ts. */
export default function WhereTheRecordLives() {
  return (
    <DeckPage
      title="Where the record lives — mirrored, not indestructible | Council of AI"
      description="Council of AI publishes the same signed artefacts to independent hosts — Hugging Face, PyPI, GitHub and a Zenodo DOI — so no single takedown removes the record, including one by us. Verification runs in your browser with no server call. This is redundancy, not censorship resistance, and the page says so."
      hero={RECORD_HERO}
      slides={RECORD_SLIDES}
      notClaimed={RECORD_NOT_CLAIMED}
      related={RECORD_RELATED}
      jsonLd={{
        "@context": "https://schema.org",
        "@type": "Article",
        headline: "Where the record lives — multi-host publication, client-side verification, external archival anchor",
        publisher: { "@type": "Organization", name: "CSOAI Ltd", url: "https://councilof.ai", identifier: "UK Companies House 16939677" },
        about: "Redundant publication of signed measurement records across independent hosts, with browser-side verification and a Zenodo DOI as an external archival anchor.",
      }}
    />
  );
}
