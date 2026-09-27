/**
 * /how-we-work — the depth that used to be the bottom two thirds of the front door.
 *
 * WHY THIS PAGE EXISTS. On 2026-09-23 the home page measured 27,743px on a 1280px desktop and
 * 47,757px on a 390px phone — twenty-six and fifty-three screens. Everything below the board was
 * therefore being published to almost nobody, which is the mechanical reason the owner could say
 * the lower sections "have been the same for months": nothing that no one reaches ever gets
 * reported as stale. Shortening the front door only helps if the material survives, so it is
 * moved here rather than cut — the estate's align-don't-delete rule, applied to bands instead of
 * routes.
 *
 * WHAT MOVED HERE, AND FROM WHERE (all eight were mounted ONLY on HomeVerify, so this page is
 * the whole of their public surface now — check here before assuming any of them was deleted):
 *   · HomeStrengths        — the six-card credibility argument, in full. The front door now
 *                            carries a six-tile summary of the same six claims (HomeCredibility)
 *                            and links here for the argument.
 *   · HomeMachineSurface   — the ten population doors and the machine addresses.
 *   · HomeReach            — how far the work travels and how much of it holds up.
 *   · ToolStack            — the nine products.
 *   · LivingStages         — funding, limits, offline verification, our own errors, the moving law.
 *   · HomeFilms            — the three films.
 *   · HomeEvidenceShowcase — the reviewed reading list (sections="reading", showWithdrawn={false},
 *                            both props carried over unchanged from the owner's 2026-09-22 ruling).
 *   · HomeNavigator        — the five-question directory of every door on the estate.
 *
 * NOTHING ON THIS PAGE IS TYPED EITHER. It makes the same live reads the home page makes, through
 * the same shared hooks in useHomeReads, so a figure here and the same figure on the front door
 * come from one request and can never disagree.
 */
import { useEffect } from "react";
import { Link } from "wouter";
import HomeDistribution from "@/components/home/HomeDistribution";
import HomeEvidenceShowcase from "@/components/home/HomeEvidenceShowcase";
import HomeFilms from "@/components/home/HomeFilms";
import HomeMachineSurface from "@/components/home/HomeMachineSurface";
import HomeNavigator from "@/components/home/HomeNavigator";
import HomeReach from "@/components/home/HomeReach";
import HomeStrengths from "@/components/home/HomeStrengths";
import LivingStages from "@/components/home/LivingStages";
import ToolStack from "@/components/home/ToolStack";
import {
  useCorrections,
  useEstateState,
  usePopulationDoors,
  usePublicRoot,
  useX402Manifest,
} from "@/components/home/useHomeReads";
import { setMetaDescription } from "@/lib/utils";

export default function HowWeWork() {
  const corrections = useCorrections();
  const root = usePublicRoot();
  const estate = useEstateState();
  const doors = usePopulationDoors();
  const manifest = useX402Manifest();

  useEffect(() => {
    document.title = "How Council of AI works — the method, the doors, and the limits we publish";
    setMetaDescription(
      "The full version of the argument on our front door: how a measurement is made, what the machine surface serves, what we have got wrong, and what we still cannot measure. Every figure read live from the endpoint that owns it.",
    );
  }, []);

  return (
    <div data-testid="how-we-work">
      <section className="surface-ink section-y border-b border-border">
        <div className="section-shell">
          {/* surface-ink is dark in BOTH schemes, so this band takes the ink tokens, not the
              theme tokens (text-foreground / emerald-700 resolved to dark-on-dark in light mode).
              t-band, as on /reach: t-page is not a defined type step, so the h1 rendered at body size. */}
          <p className="t-kicker ink-kicker">The long version</p>
          <h1 className="t-band mt-4 max-w-4xl text-[color:var(--ink-foreground)]">
            How this works, at the length it actually takes.
          </h1>
          <p className="t-lede measure mt-6 ink-muted">
            The front door gives you six checkable facts and the board. This page is everything
            underneath them: how a measurement is made and who pays for it, every machine address
            and data door we serve, the nine products, what we have got wrong, and the questions we
            cannot answer yet. Every figure is read live as this page loads — nothing here is typed
            into the page.
          </p>
          <p className="mt-6 text-[13.5px] leading-relaxed ink-muted">
            <Link href="/" className="font-bold ink-kicker underline underline-offset-4">
              Back to the board
            </Link>
            {" · "}
            <Link
              href="/library"
              className="font-bold ink-kicker underline underline-offset-4"
            >
              The library holds every page this estate has published
            </Link>
          </p>
        </div>
      </section>

      <HomeStrengths corrections={corrections} root={root} ots={doors["ots-proofs"]?.payload ?? null} />
      <HomeMachineSurface doors={doors} manifest={manifest} />
      <HomeReach state={estate} />
      {/* Moved from the front door on 2026-09-27 (align, do not delete): the pod distribution census. */}
      <HomeDistribution />
      <ToolStack />
      <LivingStages />
      <HomeFilms />

      <section className="surface-base section-y border-t border-border">
        <div className="section-shell">
          <HomeEvidenceShowcase sections="reading" showWithdrawn={false} />
        </div>
      </section>

      <HomeNavigator />
    </div>
  );
}
