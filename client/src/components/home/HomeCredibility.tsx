/**
 * HomeCredibility — the six things a stranger has to be able to check, in one screen.
 *
 * WHY THIS BAND EXISTS. It replaces HomeStrengths on the front door. HomeStrengths says the same
 * six things and says them well, but it says them in six essay cards ~1,995px tall, which on a
 * 27,743px page meant the credibility argument was told to whoever was still reading and to
 * nobody else. The full version is not deleted: it opens /how-we-work, linked from the foot of
 * this band. This is the summary; that is the argument.
 *
 * EVERY FIGURE IS READ, NOT TYPED. The board count and the separation split come from
 * GET /api/gspc, the verified-record count from /api/state, the ledger count from
 * /api/corrections, the timestamp split from the OpenTimestamps door's own free preview, and the
 * participation count from the committed memberships manifest that scripts/memberships-check.mjs
 * re-fetches. A tile whose read has not landed shows an em dash; a tile whose read FAILED says so
 * in words. No tile ever shows a zero it did not read — absence and zero are different facts and
 * this band is the one place on the page where confusing them would be fatal.
 *
 * THE COUNT LINE IS NOT HERE. totals.public_count is printed exactly once per page, in HomeHero
 * (ruling of 2026-09-16). This band's first tile carries the SEPARATION split instead, which is
 * the qualifier on that count rather than a second copy of it.
 */
import { Link } from "wouter";
import { MEMBERSHIPS } from "@/components/MembershipStrip";
import { useGspcBoard } from "../board/useGspcBoard";
import { separationRead } from "./HomeHero";
import {
  correctionsSummary,
  otsSplit,
  signedCardsVerified,
  type CorrectionsPayload,
  type PopPreview,
  type ReadState,
  type StatePayload,
} from "./homeReads";

/** One tile. `figure` is null while a read is in flight or after it failed. */
export interface CredibilityTile {
  id: string;
  /** The claim, as a reader would put it. */
  claim: string;
  /** The live figure that backs the claim, already formatted — or null. */
  figure: string | null;
  /** What the figure counts. Printed under it, always. */
  unit: string;
  /** The honest limit of the claim. Never omitted, never softened. */
  caveat: string;
  href: string;
  cta: string;
  /** Set when the read failed, so the tile can say why rather than show a dash. */
  failure?: string;
}

const nf = new Intl.NumberFormat("en-GB");

/**
 * The weakest fleet mean the board publishes, and the axis it belongs to.
 *
 * WHY A REAL FIGURE AND NOT A DASH. Every other tile in this band prints "—" while its read is
 * in flight, so "—" means "not read yet" in this page's own grammar. A tile that shows it
 * permanently would be saying a read had failed when nothing had failed. The honest version of
 * "our worst results are published" is the worst published result, read live: the lowest
 * fleet_mean across the measured model-comparison axes. Fact axes have no fleet and therefore no
 * fleet_mean, so they are skipped rather than counted as zero.
 */
export function weakestFleetMean(
  axes: { axis?: string; kind?: string; status?: string; fleet_mean?: unknown }[] | null,
): { axis: string; mean: number } | null {
  if (!Array.isArray(axes)) return null;
  let worst: { axis: string; mean: number } | null = null;
  for (const a of axes) {
    if (a.kind !== "model-comparison" || a.status !== "MEASURED") continue;
    const m = a.fleet_mean;
    if (typeof m !== "number" || !Number.isFinite(m)) continue;
    if (!worst || m < worst.mean) worst = { axis: String(a.axis ?? "unnamed"), mean: m };
  }
  return worst;
}

/**
 * The six tiles, derived from the five reads. Pure, so a test can pin every sentence against a
 * fixed payload with no network.
 */
export function credibilityTiles(input: {
  board: {
    data: { totals?: Record<string, unknown>; axes?: Parameters<typeof weakestFleetMean>[0] } | null;
    error: string | null;
  };
  state: ReadState<StatePayload>;
  corrections: ReadState<CorrectionsPayload>;
  ots: PopPreview | null;
  memberships: { rows: number; asOf: string };
}): CredibilityTile[] {
  const sep = separationRead(input.board.data as never);
  const cards = input.state.kind === "ready" ? signedCardsVerified(input.state.payload) : null;
  const ledger = input.corrections.kind === "ready" ? correctionsSummary(input.corrections.payload) : null;
  const ots = otsSplit(input.ots);
  const weak = weakestFleetMean(
    (input.board.data as { axes?: Parameters<typeof weakestFleetMean>[0] } | null)?.axes ?? null,
  );

  return [
    {
      id: "separation",
      claim: "We say what the board cannot yet tell apart",
      figure: sep ? `${sep.separated} of ${sep.comparison}` : null,
      unit: sep
        ? `model-comparison axes separated a leader — ${sep.ties} tied, ${sep.untested} untested`
        : "separation, over the model-comparison axes",
      caveat:
        "A slot is MEASURED when a run sits behind it. That is not a finding that the axis told two models apart, and we do not print it as one.",
      href: "#board",
      cta: "Read the board, row by row",
      failure: input.board.error ?? undefined,
    },
    {
      id: "recheck",
      claim: "Anyone can re-check our signed cards, for nothing",
      figure: cards ? nf.format(cards.value) : null,
      unit: cards ? `signed records verified — kind: ${cards.kind}` : "signed records verified",
      caveat:
        "Pin our public key, recompute the hash, check the signature. It runs offline, needs no account, and it is free forever. Verification is never sold.",
      href: "/gspc-verify",
      cta: "Check a record in your browser",
      failure: input.state.kind === "failed" ? input.state.reason : undefined,
    },
    {
      id: "weak",
      claim: "Our worst results are published beside our best",
      figure: weak ? weak.mean.toFixed(2) : null,
      unit: weak
        ? `the lowest fleet mean on the board — the ${weak.axis} axis, published like every other`
        : "the lowest fleet mean on the board",
      caveat:
        "A measurement body that publishes only its wins is a marketing department. One of our own low scores is further down this page as a signed card; supporting runs elsewhere may be unsigned and are labelled as such.",
      href: "#weak-score",
      cta: "See one of our own low scores",
      failure: input.board.error ?? undefined,
    },
    {
      id: "corrections",
      claim: "Every claim we got wrong is written down",
      figure: ledger ? nf.format(ledger.entries) : null,
      unit: ledger ? `corrections published — ledger signature: ${ledger.signatureState}` : "corrections published",
      caveat:
        "What was wrong, how it was caught, what changed, dated. Signed records are superseded, never quietly edited — editing the bytes would break the signature that makes them checkable.",
      href: "/api/corrections",
      cta: "Read the corrections ledger",
      failure: input.corrections.kind === "failed" ? input.corrections.reason : undefined,
    },
    {
      id: "timestamped",
      claim: "Timestamp proofs show what is attested and what is pending",
      figure: ots ? nf.format(ots.attested) : null,
      unit: ots
        ? `proofs containing Bitcoin block-header attestations — ${ots.pending} calendar-pending, of ${ots.total}`
        : "OpenTimestamps proofs",
      caveat:
        "The manifest parses proof bytes; it does not independently check the block headers against a Bitcoin node or verify every named subject file. A pending proof is a submission, not an anchor.",
      href: "/api/pop/ots-proofs?preview=1",
      cta: "View the free timestamp preview",
    },
    {
      id: "standards",
      claim: "We take part where the rules are being written",
      figure: nf.format(input.memberships.rows),
      unit: `participation records, each linked to its own evidence (manifest ${input.memberships.asOf})`,
      caveat:
        "Participation is not endorsement and a listing is not adoption. We hold no certification under any scheme, and we show no other body's logo to imply one.",
      href: "#participation",
      cta: "See every record, and what it does not prove",
    },
  ];
}

function Tile({ tile }: { tile: CredibilityTile }) {
  const internal = tile.href.startsWith("/") && !tile.href.startsWith("/api/");
  const label = (
    <>
      {tile.cta} <span aria-hidden="true">→</span>
    </>
  );
  return (
    <div
      className="group flex flex-col border-t border-border pt-5"
      data-testid={`credibility-${tile.id}`}
    >
      <h3 className="text-[17px] font-black leading-snug tracking-tight text-foreground">{tile.claim}</h3>

      {tile.failure ? (
        <p className="mt-4 rounded-xl border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-[12.5px] leading-relaxed text-amber-900 dark:text-amber-100">
          This read did not land — {tile.failure}. Nothing is shown in its place.
        </p>
      ) : tile.figure !== null ? (
        <p className="mt-4 font-mono text-[26px] font-black leading-none tracking-tight text-emerald-700 tabular-nums dark:text-emerald-300">
          {tile.figure}
        </p>
      ) : (
        <p className="mt-4 font-mono text-[26px] font-black leading-none tracking-tight text-muted-foreground/50">—</p>
      )}
      <p className="mt-2 text-[12.5px] font-semibold leading-snug text-muted-foreground">{tile.unit}</p>

      <p className="mt-4 flex-1 text-[13.5px] leading-relaxed text-muted-foreground">{tile.caveat}</p>

      {internal ? (
        <Link
          href={tile.href}
          className="mt-5 text-[13px] font-bold text-emerald-700 underline underline-offset-4 dark:text-emerald-300"
        >
          {label}
        </Link>
      ) : (
        <a
          href={tile.href}
          className="mt-5 text-[13px] font-bold text-emerald-700 underline underline-offset-4 dark:text-emerald-300"
        >
          {label}
        </a>
      )}
    </div>
  );
}

export default function HomeCredibility({
  state,
  corrections,
  ots = null,
}: {
  state: ReadState<StatePayload>;
  corrections: ReadState<CorrectionsPayload>;
  ots?: PopPreview | null;
}) {
  const board = useGspcBoard();
  const tiles = credibilityTiles({
    board: { data: board.data, error: board.error },
    state,
    corrections,
    ots,
    memberships: { rows: MEMBERSHIPS.rows.length, asOf: MEMBERSHIPS.as_of },
  });

  return (
    <section
      id="why-trust-this"
      aria-labelledby="credibility-h"
      className="surface-sunken section-y scroll-mt-20 border-t border-border"
      data-testid="home-credibility"
    >
      <div className="section-shell">
        <p className="t-kicker text-emerald-700 dark:text-emerald-300">Why you can check us rather than believe us</p>
        <h2 id="credibility-h" className="t-band mt-4 max-w-3xl text-foreground">
          Six things you can verify about this business before you trust a single number on it.
        </h2>
        <p className="t-lede measure mt-5 text-muted-foreground">
          The six figures in this section are read from their owning public sources as this page
          loads. If a read fails, we say so rather than substitute a number. Open each source to
          check its date and limits before citing it.
        </p>

        <div className="mt-10 grid gap-x-8 gap-y-9 sm:grid-cols-2 lg:grid-cols-3">
          {tiles.map((t) => (
            <Tile key={t.id} tile={t} />
          ))}
        </div>

        <p className="mt-8 text-[13.5px] leading-relaxed text-muted-foreground">
          The long version of this argument — the method, the machine surface, the films, and the
          answers on funding, limits and offline verification —{" "}
          <Link
            href="/how-we-work"
            className="font-bold text-emerald-700 underline underline-offset-4 dark:text-emerald-300"
          >
            is kept in full on one page
          </Link>
          . Nothing was deleted to shorten this one.
        </p>
      </div>
    </section>
  );
}
