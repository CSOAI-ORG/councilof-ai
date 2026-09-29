/**
 * Home - the front door, shortened 2026-09-23.
 *
 * THE MEASUREMENT THAT CAUSED THIS REWRITE. On 2026-09-23 this page rendered 27,743px tall at
 * 1280px and 47,757px at 390px - twenty-six and fifty-three screens. That is the mechanical
 * reason the owner could say the lower sections had "been the same for months": a band almost
 * nobody reaches is a band whose staleness nobody reports. Shortening the page is therefore not
 * cosmetic; it is what makes the lower material maintainable at all.
 *
 * THE ORDER IS THE ARGUMENT, with a compact distribution evidence band before the board:
 *   1. HomeHero        - what we do, for whom, and what is measured right now, off the live board.
 *   2. HomeCredibility - the six things a stranger can check about us before trusting a number,
 *                        each with a live figure behind it.
 *   2a. MomentumStrip  - live, sourced, dated figures from GET /api/momentum (added 2026-09-27):
 *                        PyPI and Hugging Face downloads, capsules, census rows, the board, the
 *                        signed cards, the corrections ledger, tools and doors. Each links to its
 *                        source; a figure whose source fails is left out, never zeroed.
 *   2b. Where we take part - one featured membership band; it links to the complete
 *                        evidence record at /memberships rather than rendering that catalogue twice.
 *   2c. HomeProof      - anchors a stranger can open, third-party listings verified on the read,
 *                        and the latest dated public work.
 *   3. (HomeDistribution moved to /how-we-work on 2026-09-27: its artifact is the pod census that
 *      stopped refreshing on 24 Sep and printed "out of date" on the front door; the PyPI figure
 *      now comes from the daily record behind /api/momentum.)
 *   4. The board       - every row, every word, every number off GET /api/gspc at render time,
 *                        with the composer under it.
 *   5. HomeWeakScore   - one of our own low scores, verified in the reader's own browser.
 *   6. The full participation catalogue lives at /memberships; it is not duplicated below.
 *   Then a six-card hand-off to the pages that hold everything else.
 *
 * WHAT WAS RETIRED FROM THIS PAGE AND WHERE IT WENT (align, do not delete). All eight bands
 * below were mounted ONLY here, so each would have been deleted by removal. They are now the
 * whole of /how-we-work (client/src/pages/HowWeWork.tsx), which makes the same live reads through
 * the same shared hooks: HomeStrengths, HomeMachineSurface, HomeReach, ToolStack, LivingStages,
 * HomeFilms, HomeEvidenceShowcase (reading) and HomeNavigator. HomeStrengths' six claims are not
 * lost from the front door either - HomeCredibility carries all six in summary and links to the
 * full argument.
 *
 * ONE COUNT LINE, AND IT IS IN THE FIRST SCREEN. totals.public_count is printed once on this page
 * (ruling of 2026-09-16), in HomeHero; the table is mounted with showPublicCount={false}.
 *
 * MEASURED IS NOT SEPARATED, and the first screen now says so. The public count means a run
 * exists behind every declared slot. It does NOT mean the axes told models apart: across the
 * model-comparison axes the board's own totals report separated_leads, ties and
 * untested_separations, and HomeHero prints all three beside the count. That block reads the four
 * separation fields live or renders nothing - it never assumes a zero it did not read.
 *
 * NO NUMBER ON THIS PAGE IS TYPED. Board figures come from GET /api/gspc, the verified-record
 * count from /api/state, the ledger count from /api/corrections, package counters from
 * /interop/distribution-latest.json, the timestamp split from the OpenTimestamps door's own free preview, and the participation count from the committed
 * memberships manifest. Each shows an em dash until it lands and says so in words if it never does.
 */
import { useEffect, useState } from "react";
import { Link } from "wouter";
import MembershipStrip from "@/components/MembershipStrip";
import HomeComposer from "@/components/home/HomeComposer";
import HomeGspcTable from "@/components/home/HomeGspcTable";
import HomeHero from "@/components/home/HomeHero";
import HomeCredibility from "@/components/home/HomeCredibility";
import MomentumStrip from "@/components/momentum/MomentumStrip";
import HomeProof from "@/components/momentum/HomeProof";
import HomeWeakScore from "@/components/home/HomeWeakScore";
import { useCorrections, useEstateState, usePopulationDoors } from "@/components/home/useHomeReads";
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
  const [axis, setAxis] = useState<string | null>(null);

  // One shared read per endpoint, consumed by several bands. See useHomeReads.
  // The front door now makes THREE reads, not five: /root.json and /.well-known/x402.json were
  // only ever needed by HomeStrengths and HomeMachineSurface, and both of those moved to
  // /how-we-work, which makes the same reads through the same shared hooks.
  const corrections = useCorrections();
  const estate = useEstateState();
  const doors = usePopulationDoors();

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
      <MomentumStrip />

      {/* Where we take part - high on the page (owner, 2026-09-27). Featured memberships as cards,
          every other body as one chip; the full record with what each entry does NOT prove stays in
          the participation band further down and on /memberships. */}
      <section
        id="take-part"
        aria-labelledby="take-part-h"
        className="surface-sunken section-y-sm border-t border-border"
        data-testid="home-take-part"
      >
        <div className="section-shell">
          <p className="t-kicker text-emerald-700 dark:text-emerald-300">Where we take part</p>
          <h2 id="take-part-h" className="t-section mt-3 max-w-3xl text-foreground">
            Members of the bodies writing the standards for secure AI, content provenance and digital identity.
          </h2>
          <MembershipStrip variant="featured" />
        </div>
      </section>

      <HomeProof />

      <HomeCredibility
        state={estate}
        corrections={corrections}
        ots={doors["ots-proofs"]?.payload ?? null}
      />

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


      <section className="surface-base section-y border-t border-border">
        <div className="section-shell">
          <p className="t-kicker text-emerald-700 dark:text-emerald-300">Keep going</p>
          <h2 className="t-band mt-4 max-w-3xl text-foreground">
            That is the whole front door. Everything else is one click, not one scroll.
          </h2>
          <p className="t-lede measure mt-5 text-muted-foreground">
            This page used to run to twenty-six screens on a desktop and fifty-three on a phone.
            None of it was deleted to shorten it — the bands below the board now have pages of
            their own, and the full archive is where it always was.
          </p>
          <ul className="mt-9 grid list-none gap-4 p-0 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                href: "/how-we-work",
                title: "How this works, in full",
                body:
                  "The method and who pays for it, the machine surface and every data door, the nine products, the films, and the answers on funding, limits and our own errors.",
              },
              {
                href: "/gspc-verify",
                title: "Check a record yourself",
                body:
                  "Paste a signed record and your own browser does the maths. Nothing leaves the device, no account, free forever.",
              },
              {
                href: "/methodology",
                title: "How a measurement is made",
                body:
                  "Frozen tests published before the run, graded by a rule rather than by another AI, with unparsed answers counted as incorrect.",
              },
              {
                href: "/corrections/",
                title: "What we got wrong",
                body:
                  "The public ledger: what was wrong, how it was caught, what changed, and the date. Signed records are superseded, never edited.",
              },
              {
                href: "/claim-maintenance/",
                title: "How a claim is kept current",
                body:
                  "The claim-maintenance specification we publish and follow: how a published claim is re-read, retired or corrected, with its DOI.",
              },
              {
                href: "/traction/",
                title: "Where this stands",
                body:
                  "Operating evidence, stated plainly: what runs today and what is still early. Downloads and founder-funded tests are never shown as customers.",
              },
              {
                href: "/open-source/",
                title: "Open source",
                body:
                  "What we publish as open source and under which licence, so the instruments can be run without us.",
              },
              {
                href: "/memberships/",
                title: "Where we take part",
                body:
                  "Every participation record with its evidence, and a plain statement of what each one does not prove. We hold no certification under any scheme.",
              },
              {
                href: "/library",
                title: "The library",
                body:
                  "Every page this estate has published, by subject and dated. Nothing is deleted when it is superseded.",
              },
            ].map((d) => {
              const inner = (
                <>
                  <span className="block text-[16px] font-black leading-snug tracking-tight text-foreground">
                    {d.title} <span aria-hidden="true">→</span>
                  </span>
                  <span className="mt-2 block text-[13.5px] leading-relaxed text-muted-foreground">{d.body}</span>
                </>
              );
              const cls =
                "block h-full rounded-2xl border border-border bg-card p-5 transition hover:border-emerald-600/40 hover:shadow-[0_18px_40px_-34px_rgba(4,18,12,.5)]";
              return (
                <li key={d.href}>
                  {d.href.startsWith("/api/") ? (
                    <a href={d.href} className={cls}>
                      {inner}
                    </a>
                  ) : (
                    <Link href={d.href} className={cls}>
                      {inner}
                    </Link>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      </section>

    </div>
  );
}
