/** Council of AI front door: one proposition, one results surface, distinct next steps. */
import { HomeWatchdog, HomeLearningJourney, HomeJourneyQuestions } from "@/components/home/HomePublicJourney";
import HomeHero from "@/components/home/HomeHero";
import HomeResults from "@/components/home/HomeResults";
import HomeMine from "@/components/home/HomeMine";
import HomeProducts from "@/components/home/HomeProducts";
import HomeEvidence from "@/components/home/HomeEvidence";
import HomeDevelopers from "@/components/home/HomeDevelopers";
import HomeUpdates from "@/components/home/HomeUpdates";
import { gspcDatasetLd } from "@/lib/datasetSchema";
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
  ],
};

export default function HomeVerify() {
  return (
    <div className="home-page" data-testid="home-verify">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(HOME_LD) }}
      />
      <HomeHero />
      <HomeWatchdog />
      <HomeResults />
      {/* The live board strip + daily-report/newsletter band (owner-verified 1 Nov;
          restored 2026-11-09 after the journey rebuild dropped them). */}
      <HomeMine />
      <HomeProducts />
      <HomeLearningJourney />
      <HomeEvidence />
      <HomeDevelopers />
      <HomeJourneyQuestions />
      <HomeUpdates />
    </div>
  );
}
