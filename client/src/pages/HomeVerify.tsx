/**
 * Home — the front door, rebuilt 2026-09-22.
 *
 * THE ORDER IS THE ARGUMENT. A reader landing cold gets, in this order: what we do and what is
 * measured right now (HomeHero, off the live board); why this one is different, with a live
 * proof under every claim (HomeStrengths); every door in the business grouped by the question
 * that brings someone here (HomeNavigator); the board itself (HomeGspcTable); the worst score we
 * publish, verified in their own browser (HomeWeakScore); the data doors and the machine
 * addresses (HomeMachineSurface); how far the work travels and how much of it holds up
 * (HomeReach); the nine tools (ToolStack); the long-form answers to funding, limits, offline
 * verification, our own errors and the moving law (LivingStages); and the films and reviewed
 * reading last, for a reader who is still here.
 *
 * WHAT WAS RETIRED FROM THIS PAGE, AND WHY (align, do not delete — every component still exists
 * and still ships where it is mounted elsewhere):
 *   · HeroSlides — a seven-slide auto-rotating carousel as the first screen. Six of its seven
 *     claims are never seen, its first frame ("Measured, not modelled") teaches a stranger
 *     nothing, and one slide typed a count ("9 killed bets") the page could not read live.
 *     HomeHero replaces it with one composed screen whose every figure is off /api/gspc.
 *   · HomeCinematicWorlds — a second three-film band whose copy restated ToolStack ("Nine
 *     products. Each tile opens a page that exists today.") and whose third film is also
 *     embedded inside LivingStages. One film band per page.
 *   · The four numbered buttons ("1 · Explore measurements … 4 · Access supported feeds") —
 *     HomeNavigator answers the same intent with five reader questions and every door behind
 *     them, each href checked live.
 *   · HomeEvidenceShowcase's participation grid — its nine hand-written records are a third
 *     copy of the participation story on one page, and the live manifest behind the
 *     participation band has 28 rows with evidence for each. The band is mounted with
 *     sections="reading" so its reviewed-reading half still ships and nothing is lost.
 *   · HomeEvidenceShowcase's withdrawal record — showWithdrawn={false}, on the owner's ruling
 *     of 2026-09-22. A visitor's first impression of a measurement body cannot be a notice
 *     that our own material is under review. It is not hidden: the record is still served on
 *     its own route and still reachable from the refutation ledger, which is where a reader
 *     looking for what we got wrong goes, and the rule that a withdrawn entry can never be
 *     promoted as ready reading is untouched.
 *   · The seven-stage distribution funnel — it stays published in full at /api/footprint. Four
 *     of its seven stages can only say UNMEASURED today, and a column of absences is not what a
 *     first-time reader should be given; the front door carries the stages with something to
 *     say, under a heading that says what they mean.
 *
 * ONE COUNT LINE, AND IT IS IN THE FIRST SCREEN. totals.public_count is printed once on this
 * page (ruling of 2026-09-16). It moved from the middle of HomeGspcTable into HomeHero, where a
 * cold reader actually meets it; the table is mounted with showPublicCount={false} so there is
 * still exactly one.
 *
 * NO NUMBER ON THIS PAGE IS TYPED. Board figures come from GET /api/gspc, evidence figures from
 * /api/state and /root.json, the ledger count from /api/corrections, the ten population figures
 * from each door's own free preview, the door and tool counts from /.well-known/x402.json, and
 * distribution from whatever LiveCounters renders. Each one shows "—" until it lands and says so
 * in words if it never does.
 */
import { useEffect, useState } from "react";
import { Link } from "wouter";
import MembershipStrip from "@/components/MembershipStrip";
import HomeComposer from "@/components/home/HomeComposer";
import ToolStack from "@/components/home/ToolStack";
import LivingStages from "@/components/home/LivingStages";
import HomeFilms from "@/components/home/HomeFilms";
import HomeGspcTable from "@/components/home/HomeGspcTable";
import HomeEvidenceShowcase from "@/components/home/HomeEvidenceShowcase";
import HomeHero from "@/components/home/HomeHero";
import HomeStrengths from "@/components/home/HomeStrengths";
import HomeNavigator from "@/components/home/HomeNavigator";
import HomeWeakScore from "@/components/home/HomeWeakScore";
import HomeMachineSurface from "@/components/home/HomeMachineSurface";
import HomeReach from "@/components/home/HomeReach";
import {
  useCorrections,
  useEstateState,
  usePopulationDoors,
  usePublicRoot,
  useX402Manifest,
} from "@/components/home/useHomeReads";
import { gspcDatasetLd } from "@/lib/datasetSchema";
import { setMetaDescription } from "@/lib/utils";

/**
 * schema.org for the front door. Four nodes an answer engine can use without reading the page:
 * who we are, what the software does, the board as a Dataset (DERIVED from the axis registry, so
 * no bank is asserted that the single source of truth does not carry), and the five questions a
 * reader arrives with, answered. No prices, no ratings, no conformity claim.
 */
const HOME_LD = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": "https://councilof.ai/#org",
      name: "Council of AI",
      legalName: "CSOAI Ltd",
      url: "https://councilof.ai",
      identifier: "UK Companies House 16939677",
      description:
        "Independent measurement of how AI systems behave. Every result is published as an Ed25519-signed record anyone can re-verify for free. Measurement, not certification: no conformity mark is issued and no accreditation chain stands behind it.",
      email: "contact@csoai.org",
      address: {
        "@type": "PostalAddress",
        streetAddress: "3rd Floor, 86–90 Paul Street",
        addressLocality: "London",
        postalCode: "EC2A 4NE",
        addressCountry: "GB",
      },
      sameAs: [
        "https://github.com/CSOAI-ORG",
        "https://huggingface.co/csoai",
        "https://www.wikidata.org/wiki/Q141128616",
        "https://orcid.org/0009-0001-3869-1068",
      ],
    },
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
            text: "It runs AI systems against frozen, published tests, grades every answer by a fixed rule rather than by another AI, and publishes each result as an Ed25519-signed record. The live board is at https://councilof.ai/api/gspc.",
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
  const [axis, setAxis] = useState<string | null>(null);

  // One shared read per endpoint, consumed by several bands. See useHomeReads.
  const corrections = useCorrections();
  const root = usePublicRoot();
  const estate = useEstateState();
  const doors = usePopulationDoors();
  const manifest = useX402Manifest();

  useEffect(() => {
    document.title = "Council of AI — independent measurement of AI systems, signed and free to re-check";
    setMetaDescription(
      "We measure how AI systems behave against frozen, published tests, sign every result, and publish it where anyone can re-verify it for free. Read the live board, check a record yourself, and see every claim we have corrected.",
    );
  }, []);

  return (
    <div data-testid="home-verify">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(HOME_LD) }} />

      <HomeHero />
      <HomeStrengths corrections={corrections} root={root} ots={doors["ots-proofs"]?.payload ?? null} />
      <HomeNavigator />

      {/* The board: every row, every word, every number off GET /api/gspc at render time. */}
      <section
        id="board"
        aria-labelledby="home-board-h"
        className="surface-base section-y scroll-mt-20 border-t border-border"
      >
        <div className="section-shell">
          <HomeGspcTable heading="The living board" highlight={axis} onSelect={setAxis} showPublicCount={false} />

          <div className="mt-16 rounded-3xl border border-border bg-card p-6 shadow-[0_20px_44px_-32px_rgba(4,18,12,.45)] sm:p-9">
            <h3 className="text-2xl font-black tracking-tight text-foreground">
              Ask it a question, or paste a record.
            </h3>
            <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-muted-foreground">
              Name an axis and the board jumps to it. Paste a signed record and it is checked right
              here. Nothing leaves this device either way.
            </p>
            <HomeComposer onAskAxis={setAxis} />
          </div>
        </div>
      </section>

      <HomeWeakScore />
      <HomeMachineSurface doors={doors} manifest={manifest} />
      <HomeReach state={estate} />

      {/*
        Participation, with room to be read (owner, 2026-09-22). This was a single wrapping line
        of badge pills; it is the standards and institutional record — 28 entries, each with its
        own evidence, its own date and its own statement of what it does NOT prove — and it is
        one of the few things about a measurement body that an outsider can check without
        reading a single score. The grouped variant renders every row under its own heading.
      */}
      <section
        id="participation"
        aria-labelledby="participation-h"
        className="surface-sunken section-y border-t border-border"
        data-testid="home-participation"
      >
        <div className="section-shell">
          <p className="t-kicker text-emerald-700 dark:text-emerald-300">In the room, on the record</p>
          {/* The band is labelled by ITS OWN heading. MembershipStrip renders a second heading
              of its own ("Where we take part") as the list label; pointing aria-labelledby at
              that one made a screen reader announce the section by the sub-label. */}
          <h2 id="participation-h" className="t-band mt-4 max-w-3xl text-foreground">
            The standards that will govern this are being written now. We are in those rooms.
          </h2>
          <p className="t-lede measure mt-5 text-muted-foreground">
            Standards bodies, public registries, scholarly identifiers and filings on the public
            record. Every entry below names what it proves, what it does not prove, and the
            evidence you can open for yourself — because a membership logo with nothing behind it
            is the exact thing this business exists to make unnecessary.
          </p>
        </div>
        <MembershipStrip variant="home" />
      </section>

      <ToolStack />
      <LivingStages />
      <HomeFilms />

      <section className="surface-base section-y border-t border-border">
        <div className="section-shell">
          <HomeEvidenceShowcase sections="reading" showWithdrawn={false} />
          <p className="mt-12 border-t border-border pt-8 text-[14px] leading-relaxed text-muted-foreground">
            Still looking for something?{" "}
            <Link href="/library" className="font-bold text-emerald-700 underline underline-offset-4 dark:text-emerald-300">
              The library holds every page this estate has published
            </Link>
            , by subject and dated — nothing is deleted when it is superseded.
          </p>
        </div>
      </section>
    </div>
  );
}
