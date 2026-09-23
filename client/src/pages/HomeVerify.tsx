/**
 * Home - the front door, shortened 2026-09-23.
 *
 * THE MEASUREMENT THAT CAUSED THIS REWRITE. On 2026-09-23 this page rendered 27,743px tall at
 * 1280px and 47,757px at 390px - twenty-six and fifty-three screens. That is the mechanical
 * reason the owner could say the lower sections had "been the same for months": a band almost
 * nobody reaches is a band whose staleness nobody reports. Shortening the page is therefore not
 * cosmetic; it is what makes the lower material maintainable at all.
 *
 * THE ORDER IS THE ARGUMENT, and it is now five bands:
 *   1. HomeHero        - what we do, for whom, and what is measured right now, off the live board.
 *   2. HomeCredibility - the six things a stranger can check about us before trusting a number,
 *                        each with a live figure behind it.
 *   3. The board       - every row, every word, every number off GET /api/gspc at render time,
 *                        with the composer under it.
 *   4. HomeWeakScore   - one of our own low scores, verified in the reader's own browser.
 *   5. Participation   - the standards record, as text with evidence, never as a logo row.
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
 * count from /api/state, the ledger count from /api/corrections, the timestamp split from the
 * OpenTimestamps door's own free preview, and the participation count from the committed
 * memberships manifest. Each shows an em dash until it lands and says so in words if it never does.
 */
import { useEffect, useState } from "react";
import { Link } from "wouter";
import MembershipStrip from "@/components/MembershipStrip";
import HomeComposer from "@/components/home/HomeComposer";
import HomeGspcTable from "@/components/home/HomeGspcTable";
import HomeHero from "@/components/home/HomeHero";
import HomeCredibility from "@/components/home/HomeCredibility";
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
  // The front door now makes THREE reads, not five: /root.json and /.well-known/x402.json were
  // only ever needed by HomeStrengths and HomeMachineSurface, and both of those moved to
  // /how-we-work, which makes the same reads through the same shared hooks.
  const corrections = useCorrections();
  const estate = useEstateState();
  const doors = usePopulationDoors();

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
                href: "/api/corrections",
                title: "What we got wrong",
                body:
                  "The public ledger: what was wrong, how it was caught, what changed, and the date. Signed records are superseded, never edited.",
              },
              {
                href: "/memberships",
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
