/**
 * AboutNumbers — /about/#numbers: the technical detail that left the front door on 30 Sep 2026.
 *
 * Owner: the home page must be end-user focused; the momentum figures, the corrections and card
 * counts, the method caveats and the separation explanation belong on About or deeper pages,
 * linked from home ("More numbers →", "What the states mean →"). Nothing here was deleted from
 * the estate; every band below was on the home page until that date and is mounted here now.
 *
 * NOTHING IS TYPED. The separation block reads the four fields off GET /api/gspc or prints
 * nothing; MomentumStrip reads GET /api/momentum; HomeCredibility reads /api/state,
 * /api/corrections and the OpenTimestamps door; the memberships come from the committed manifest.
 */
import { Link } from "wouter";
import MomentumStrip from "@/components/momentum/MomentumStrip";
import HomeProof from "@/components/momentum/HomeProof";
import HomeCredibility from "@/components/home/HomeCredibility";
import HomeWeakScore from "@/components/home/HomeWeakScore";
import MembershipStrip from "@/components/MembershipStrip";
import { useCorrections, useEstateState, usePopulationDoors } from "@/components/home/useHomeReads";
import { useGspcBoard } from "@/components/board/useGspcBoard";
import { separationRead } from "@/components/home/LiveBoardGlance";

export const DEEPER: { href: string; title: string; body: string }[] = [
  {
    href: "/how-we-work",
    title: "How this works, in full",
    body: "The method and who pays for it, the machine surface and every data door, the products, the films, and the answers on funding, limits and our own errors.",
  },
  {
    href: "/models-measured/",
    title: "Every model we have measured",
    body: "The list behind the model count on the home page, derived from the signed cards, with our own models listed apart.",
  },
  {
    href: "/methodology",
    title: "How a measurement is made",
    body: "Frozen tests published before the run, graded by a rule rather than by another AI, with unparsed answers counted as incorrect.",
  },
  {
    href: "/corrections/",
    title: "What we got wrong",
    body: "The public ledger: what was wrong, how it was caught, what changed, and the date. Signed records are superseded, never edited.",
  },
  {
    href: "/claim-maintenance/",
    title: "How a claim is kept current",
    body: "The claim-maintenance specification we publish and follow: how a published claim is re-read, retired or corrected.",
  },
  {
    href: "/traction/",
    title: "Where this stands",
    body: "Operating evidence, stated plainly: what runs today and what is still early. Downloads and founder-funded tests are never shown as customers.",
  },
  {
    href: "/open-source/",
    title: "Open source",
    body: "What we publish as open source and under which licence, so the instruments can be run without us.",
  },
  {
    href: "/memberships/",
    title: "Where we take part",
    body: "Every participation record with its evidence, and a plain statement of what each one does not prove. We hold no certification under any scheme.",
  },
  {
    href: "/library",
    title: "The library",
    body: "Every page this estate has published, by subject and dated. Nothing is deleted when it is superseded.",
  },
];

function Separation() {
  const { data } = useGspcBoard();
  const sep = separationRead(data);
  if (!sep) return null;
  return (
    <div className="mt-8 max-w-3xl rounded-2xl border border-amber-500/40 bg-amber-50 px-5 py-4 dark:bg-amber-950/30" data-testid="about-separation">
      <p className="text-[15px] font-bold text-amber-950 dark:text-amber-100">Measurement coverage and ranking power are different determinations.</p>
      <p className="mt-2 text-sm leading-relaxed text-amber-950/90 dark:text-amber-100/85">
        A slot on the board counts as measured when a real run sits behind it. On model-comparison axes, separation asks
        a different question: whether any public leader is statistically distinguishable from its fleet. Across the{" "}
        <span className="font-mono font-bold">{sep.comparison}</span> model-comparison axes the current state is{" "}
        <span className="font-mono font-bold">{sep.separated}</span> separated,{" "}
        <span className="font-mono font-bold">{sep.ties}</span> TIE and{" "}
        <span className="font-mono font-bold">{sep.untested}</span> UNTESTED. TIE means the evidence does not justify a
        hierarchy; UNTESTED means no separation test is published yet. The deterministic fact-run axes measure public
        records by rule and have no model leader by design. These states are why the board can publish full measurement
        coverage without manufacturing a ranking.
      </p>
    </div>
  );
}

export default function AboutNumbers() {
  const corrections = useCorrections();
  const estate = useEstateState();
  const doors = usePopulationDoors();
  return (
    <div id="numbers" className="scroll-mt-20" data-testid="about-numbers">
      <section aria-labelledby="about-numbers-h" className="surface-base section-y-sm border-t border-border">
        <div className="section-shell">
          <p className="t-kicker text-emerald-800 dark:text-emerald-300">The numbers, in full</p>
          <h2 id="about-numbers-h" className="t-band mt-3 max-w-3xl text-foreground">
            Every figure, where it comes from, and what it does not mean.
          </h2>
          <p className="t-lede measure mt-4 text-muted-foreground">
            The home page shows a handful of figures. This is the rest, each read live from the source it names.
          </p>
          <Separation />
        </div>
      </section>

      <MomentumStrip />
      <HomeProof />
      <HomeCredibility state={estate} corrections={corrections} ots={doors["ots-proofs"]?.payload ?? null} />
      <HomeWeakScore />

      <section aria-labelledby="participation-h" className="cv-auto surface-sunken section-y border-t border-border" data-testid="home-participation">
        <div className="section-shell">
          <p className="t-kicker text-emerald-800 dark:text-emerald-300">In the room, on the record</p>
          <h2 id="participation-h" className="t-band mt-4 max-w-3xl text-foreground">
            The standards that will govern this are being written now. We are in those rooms.
          </h2>
          <p className="t-lede measure mt-5 text-muted-foreground">
            Standards bodies, public registries, scholarly identifiers and filings on the public record. Every entry names
            what it proves, what it does not prove, and the evidence you can open for yourself.
          </p>
          <MembershipStrip variant="featured" />
        </div>
        <MembershipStrip variant="home" />
      </section>

      <section aria-labelledby="deeper-h" className="cv-auto surface-base section-y border-t border-border">
        <div className="section-shell">
          <p className="t-kicker text-emerald-800 dark:text-emerald-300">Go deeper</p>
          <h2 id="deeper-h" className="t-band mt-4 max-w-3xl text-foreground">
            Everything else is one click away.
          </h2>
          <ul className="mt-9 grid list-none gap-4 p-0 sm:grid-cols-2 lg:grid-cols-3">
            {DEEPER.map((d) => (
              <li key={d.href}>
                <Link
                  href={d.href}
                  className="block h-full rounded-2xl border border-border bg-card p-5 transition hover:border-emerald-600/40 hover:shadow-[0_18px_40px_-34px_rgba(4,18,12,.5)]"
                >
                  <span className="block text-base font-black leading-snug tracking-tight text-foreground">
                    {d.title} <span aria-hidden="true">→</span>
                  </span>
                  <span className="mt-2 block text-sm leading-relaxed text-muted-foreground">{d.body}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
}
