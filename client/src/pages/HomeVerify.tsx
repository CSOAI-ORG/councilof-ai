/**
 * Home - the front door, rebuilt 2026-09-30 on the owner's review of the live page.
 *
 * WHAT THE OWNER FOUND (30 Sep): confusing, duplicated content; none of our images; the live
 * board not on the page; the company line sitting mid-page; and the fleets tile ("14") read as
 * a model count when we have measured far more models than that (the figure was
 * totals.model_fleets, a count of model-comparison AXES).
 *
 * THE ORDER IS THE ARGUMENT, and each figure is printed once:
 *   1. HomeHero         - what we do, in one sentence, over one image. No figures.
 *   2. LiveBoardGlance  - the live GSPC board: every axis with its state, the count line with its
 *                         separation line, and the model count (derived from the signed cards by
 *                         scripts/build-models-measured.mjs; list at /models-measured/).
 *   3. HomeSteps        - how it works, which is also what makes it different: measure, sign,
 *                         re-check, correct. Four sections, four of our own images, no figures.
 *   4. HomeWaysIn       - Ask, Connect, Verify, and a line each for the buyer, the developer,
 *                         the regulator and the agent.
 *   5. Proof strip      - four live figures from GET /api/momentum, then "More numbers".
 *   6. Company strip    - the accountable entity and "Who we are".
 *
 * WHAT LEFT THE FRONT DOOR, AND WHERE IT WENT (align, do not delete): the full momentum band,
 * HomeProof, HomeCredibility, HomeWeakScore, the separation explanation, the memberships and the
 * participation record, and the "keep going" hand-off all moved to /about/#numbers
 * (client/src/components/about/AboutNumbers.tsx). The composer and the talk panel stay on
 * /dashboard, where "Ask" leads. Bands retired on 2026-09-23 remain on /how-we-work.
 *
 * NO NUMBER ON THIS PAGE IS TYPED. Board figures come from GET /api/gspc, the model count from
 * /interop/models-measured.json, the proof figures from GET /api/momentum. Each shows an em dash
 * (or nothing) until it lands and says so in words if it never does.
 */
import { useEffect } from "react";
import { Link } from "wouter";
import HomeHero from "@/components/home/HomeHero";
import LiveBoardGlance from "@/components/home/LiveBoardGlance";
import HomeSteps from "@/components/home/HomeSteps";
import HomeWaysIn from "@/components/home/HomeWaysIn";
import MomentumStrip from "@/components/momentum/MomentumStrip";
import { gspcDatasetLd } from "@/lib/datasetSchema";
import { setMetaDescription } from "@/lib/utils";

/** The proof strip: the four figures a first-time visitor cares about. The rest are on /about/#numbers. */
export const HOME_PROOF_IDS = ["signed_cards", "corrections", "mcp_tools", "hf_datasets"];

/**
 * schema.org for the front door. Four nodes an answer engine can use without reading the page:
 * who we are, what the software does, the board as a Dataset (DERIVED from the axis registry, so
 * no bank is asserted that the single source of truth does not carry), and the five questions a
 * reader arrives with, answered. No prices, no ratings, no conformity claim.
 */
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
    document.title = "Council of AI — independent measurement of AI systems, signed and free to re-check";
    setMetaDescription(
      "We measure how AI systems behave against frozen, published tests and publish checkable evidence. Issued measurement cards are signed; unsigned supporting runs are labelled. Read the live board and corrections ledger.",
    );
  }, []);

  return (
    <div data-testid="home-verify">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(HOME_LD) }} />

      <HomeHero />
      <LiveBoardGlance />
      <HomeSteps />
      <HomeWaysIn />

      {/* Proof: four live figures a first-time visitor can open at the source. Everything else is
          behind "More numbers", on /about/#numbers. The board's own figures are in the board band
          above and are not repeated here. */}
      <section aria-label="Live figures" className="surface-sunken border-t border-border" data-testid="home-proof-strip">
        <div className="section-shell pb-10 pt-2 sm:pb-14">
          <MomentumStrip variant="panel" title="The work, counted live at the source" ids={HOME_PROOF_IDS} />
          <a
            href="/about/#numbers"
            className="inline-flex min-h-11 items-center text-base font-bold text-emerald-800 underline underline-offset-4 dark:text-emerald-300"
            data-testid="home-more-numbers"
          >
            More numbers →
          </a>
        </div>
      </section>

      {/* The accountable entity: always visible, never mid-flow (owner, 30 Sep 2026). */}
      <section aria-label="Who runs Council of AI" className="surface-base border-t border-border" data-testid="home-company-strip">
        <div className="section-shell flex flex-col gap-3 py-8 sm:flex-row sm:items-center sm:justify-between">
          <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground" data-testid="home-accountable-entity">
            Council of AI is operated by CSOAI Ltd (UK Companies House 16939677), founded by Nicholas Templeman. We
            measure; we do not certify, and verification is free.
          </p>
          <div className="flex flex-wrap gap-x-6 text-sm font-bold">
            <Link href="/about/" className="inline-flex min-h-11 items-center text-emerald-800 underline underline-offset-4 dark:text-emerald-300">
              Who we are →
            </Link>
            <Link href="/how-we-work" className="inline-flex min-h-11 items-center text-emerald-800 underline underline-offset-4 dark:text-emerald-300">
              How we work →
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
