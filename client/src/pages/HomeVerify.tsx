/** Council of AI front door: one proposition, one results surface, distinct next steps. */
import { useEffect } from "react";
import HomeHero from "@/components/home/HomeHero";
import HomeResults from "@/components/home/HomeResults";
import HomeProducts from "@/components/home/HomeProducts";
import HomeEvidence from "@/components/home/HomeEvidence";
import HomeDevelopers from "@/components/home/HomeDevelopers";
import HomeUpdates from "@/components/home/HomeUpdates";
import { gspcDatasetLd } from "@/lib/datasetSchema";
import { setMetaDescription } from "@/lib/utils";
import "@/styles/home-page.css";

// Retained for source consumers; the detailed proof figures remain on /about/#numbers.
export const HOME_PROOF_IDS = [
  "signed_cards",
  "corrections",
  "mcp_tools",
  "hf_datasets",
];

const HOME_LD = {
  "@context": "https://schema.org",
  "@graph": [
    // The Organization is declared once, in client/index.html; this graph refers to it by @id so the
    // page never carries two versions of the company that disagree.
    { "@id": "https://councilof.ai/#org" },
    {
      "@type": "SoftwareApplication",
      name: "Council of AI — the living board and the record verifier",
      url: "https://councilof.ai/",
      applicationCategory: "DeveloperApplication",
      operatingSystem: "Web",
      publisher: { "@id": "https://councilof.ai/#org" },
      description:
        "Read the live measurement board (GET /api/gspc) and re-verify signed measurement records in the browser. Verification is free and always will be; a rank is never sold. Measurement, not certification.",
    },
    gspcDatasetLd(false),
    {
      "@type": "FAQPage",
      mainEntity: [
        {
          "@type": "Question",
          name: "What does Council of AI actually do?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "It runs AI systems against frozen, published tests and grades answers by fixed rules rather than by another AI. Issued measurement cards are Ed25519-signed; supporting runs are labelled when unsigned. The live board is at https://councilof.ai/api/gspc.",
          },
        },
        {
          "@type": "Question",
          name: "Can I check a result without trusting Council of AI?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Yes, and that is the point. Pin the public key from https://councilof.ai/.well-known/did.json, recompute the record's id from the SHA-256 of its canonical body, then check the Ed25519 signature over those same bytes. It runs offline, needs no account and no permission, and it is free forever.",
          },
        },
        {
          "@type": "Question",
          name: "Does Council of AI certify AI systems?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "No. It issues no certificate and no conformity mark, there is no accreditation chain behind it, and it cannot approve, ban, clear or fine anything. It measures, signs the measurement, and publishes what it could not measure.",
          },
        },
        {
          "@type": "Question",
          name: "What happens when Council of AI gets something wrong?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "The correction is published in a public ledger at https://councilof.ai/api/corrections saying what was wrong, how it was caught and what changed. Signed records are superseded rather than edited, because editing signed bytes would break the signature that makes them checkable.",
          },
        },
        {
          "@type": "Question",
          name: "How does an AI agent use this?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "The board is GET https://councilof.ai/api/gspc, the tool surface is POST https://councilof.ai/mcp, the agent card is at /.well-known/agent.json, the metered doors and their free previews are listed in /.well-known/x402.json, the public keys are at /.well-known/did.json, and a plain-language description of the site is at /llms.txt.",
          },
        },
      ],
    },
  ],
};

export default function HomeVerify() {
  useEffect(() => {
    document.title = "Independent AI measurement & evidence — Council of AI";
    setMetaDescription(
      "Explore published measurements of AI models and agents, inspect the evidence and verify signed records. Independent measurement, public corrections and free verification.",
    );
  }, []);

  return (
    <div className="home-page" data-testid="home-verify">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(HOME_LD) }}
      />
      <HomeHero />
      <HomeResults />
      <HomeProducts />
      <HomeEvidence />
      <HomeDevelopers />
      <HomeUpdates />
    </div>
  );
}
