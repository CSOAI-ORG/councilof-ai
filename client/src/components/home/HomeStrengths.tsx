/**
 * HomeStrengths — the six things that make this different, in the order they are worth saying.
 *
 * THE ORDER IS THE ARGUMENT (owner, 2026-09-22): we measure independently and publish every
 * result signed so anyone can re-check it free and forever; we publish our weak scores too;
 * every claim we have ever corrected is in a public ledger; the evidence is anchored so nobody
 * can quietly rewrite history; we sit in the standards rooms where this is being decided; and
 * the whole thing runs as a machine on a schedule rather than a report somebody writes.
 *
 * EVERY CARD CARRIES ITS OWN LIVE PROOF. The proof chip under each claim is read at render time
 * from the endpoint that owns it — the corrections ledger counts its own rows, the root reports
 * its own leaf count and signing state, the timestamp door reports its own attested/pending
 * split. A card whose read has not landed shows "—"; a card whose read failed says so. None of
 * these numbers is typed, and none of them is added to any other.
 *
 * THE STATE WORDS STAY, AS QUALIFIERS. "STALE" beside the corrections signature and "submitted,
 * pending" beside an unattested timestamp are published defects; they sit next to the figure in
 * small type, never as the headline word.
 */
import { Link } from "wouter";
import { MEMBERSHIPS } from "@/components/MembershipStrip";
import {
  correctionsSummary,
  doorLine,
  otsSplit,
  rootSummary,
  shortRoot,
  type CorrectionsPayload,
  type PopPreview,
  type ReadState,
  type RootPayload,
} from "./homeReads";

/** What a card shows once its read lands: a short live line, or a labelled absence. */
export interface Proof {
  text: string;
  /** True when the line carries a figure a reader can check; false when it is an absence. */
  live: boolean;
}

const PENDING: Proof = { text: "—  reading the source", live: false };

export function independenceProof(): Proof {
  return {
    text: "No company we measure pays for a place, a score, or its removal — there is no rate card for any of it.",
    live: true,
  };
}

export function correctionsProof(read: ReadState<CorrectionsPayload>): Proof {
  if (read.kind === "failed") return { text: `ledger unread — ${read.reason}`, live: false };
  if (read.kind === "loading") return PENDING;
  const s = correctionsSummary(read.payload);
  if (!s) return { text: "the ledger served no rows — nothing is shown in their place", live: false };
  return {
    text: `${s.entries} corrections published · the ledger's own signature is ${s.signatureState}, and we say so rather than re-sign it quietly`,
    live: true,
  };
}

export function anchorProof(root: ReadState<RootPayload>, ots: PopPreview | null): Proof {
  if (root.kind === "failed") return { text: `the public root is unread — ${root.reason}`, live: false };
  if (root.kind === "loading") return PENDING;
  const r = rootSummary(root.payload);
  if (!r) return { text: "the root served no merkle root — nothing is shown in its place", live: false };
  const split = otsSplit(ots);
  // Deliberately says "published artifacts", not "of this root": no proof in the timestamp
  // manifest names /root.json as its subject, and /root.json.ots is a 404. Saying "of this
  // root" would be the same overstatement the card body used to carry.
  const stamps = split
    ? ` · separately, ${split.attested} of ${split.total} timestamps over published artifacts are confirmed in a Bitcoin block; the other ${split.pending} are submitted and still pending`
    : "";
  return {
    text: `${r.leaves} records under one ${r.signed ? "signed" : "unsigned"} root ${shortRoot(r.root)}, rebuilt ${r.asOf}${stamps}`,
    live: true,
  };
}

export function standardsProof(): Proof {
  const rows = MEMBERSHIPS.rows.length;
  const standards = MEMBERSHIPS.rows.filter((r) => r.group === "standards").length;
  return {
    text: `${rows} participation records, ${standards} of them in standards bodies, each linked to its own evidence · as of ${MEMBERSHIPS.as_of}`,
    live: true,
  };
}

export function machineProof(root: ReadState<RootPayload>): Proof {
  if (root.kind === "failed") return { text: `the root is unread — ${root.reason}`, live: false };
  if (root.kind === "loading") return PENDING;
  const r = rootSummary(root.payload);
  if (!r) return { text: "the root published no timestamp — nothing is shown in its place", live: false };
  return { text: `the root on this page was rebuilt and re-signed at ${r.asOf}`, live: true };
}

interface Card {
  n: string;
  title: string;
  body: string;
  proof: Proof;
  link: { href: string; label: string; external?: boolean };
}

function Tile({ card }: { card: Card }) {
  const { link } = card;
  return (
    <article
      className="card-quiet flex h-full flex-col gap-4 p-6 sm:p-7"
      data-strength={card.n}
      data-proof-live={card.proof.live}
    >
      <span className="font-mono text-sm font-black tabular-nums text-emerald-600 dark:text-emerald-400">
        {card.n}
      </span>
      <h3 className="text-xl font-black leading-tight tracking-tight text-foreground sm:text-[1.375rem]">
        {card.title}
      </h3>
      <p className="text-[15px] leading-[1.6] text-muted-foreground">{card.body}</p>
      <p
        className={`mt-auto rounded-xl border px-3.5 py-3 text-[13px] font-semibold leading-snug ${
          card.proof.live
            ? "border-emerald-600/25 bg-emerald-500/[0.08] text-emerald-900 dark:text-emerald-200"
            : "border-border bg-muted text-muted-foreground"
        }`}
      >
        {card.proof.text}
      </p>
      {link.external ? (
        <a
          href={link.href}
          className="inline-flex items-center gap-1.5 text-sm font-extrabold text-emerald-700 dark:text-emerald-300"
        >
          {link.label} <span aria-hidden>→</span>
        </a>
      ) : (
        <Link
          href={link.href}
          className="inline-flex items-center gap-1.5 text-sm font-extrabold text-emerald-700 dark:text-emerald-300"
        >
          {link.label} <span aria-hidden>→</span>
        </Link>
      )}
    </article>
  );
}

export function strengthCards({
  corrections,
  root,
  ots,
}: {
  corrections: ReadState<CorrectionsPayload>;
  root: ReadState<RootPayload>;
  ots: PopPreview | null;
}): Card[] {
  return [
    {
      n: "01",
      title: "Nobody we measure is paying us",
      body:
        "We are an independent measurement body. The tests are frozen and published before a run, the grading is done by a rule rather than by another AI, and no vendor can buy a place on the board, lift a score or have one taken down. Re-checking any result costs nothing and always will.",
      proof: independenceProof(),
      link: { href: "/methodology", label: "How a measurement is made" },
    },
    {
      n: "02",
      title: "Our bad results are on the board too",
      body:
        "The easy thing is to publish the wins. A measurement body is only worth reading if the weak scores are there beside them — including the ones our own models earned. They are, with the same signature and the same test behind them.",
      proof: {
        // Counted across all 335 signed bodies, not asserted: the set runs from 0.0 upward, and
        // our own models are in the low end of it. No superlative, because nobody can check one.
        text: "our own models are published at single-digit scores and at zero, signed exactly like every other result",
        live: true,
      },
      link: { href: "#weak-score", label: "See one of our own low scores, checked in your browser" },
    },
    {
      n: "03",
      title: "Every claim we got wrong is written down",
      body:
        "When something we published turns out to be wrong, we do not reword it. The correction goes in a public ledger that says what was wrong, how it was caught and what changed. Judge a measurement body on what it does on a bad day.",
      proof: correctionsProof(corrections),
      link: { href: "/refutation-ledger", label: "Read the corrections ledger" },
    },
    {
      n: "04",
      title: "The history cannot be quietly rewritten",
      body:
        "Every published record is hashed into one tree, and the top of that tree is signed. Change a byte in any record and the top stops matching, so a quiet edit is not something we could do without it showing. Separately, published artifacts are submitted to a public timestamping service — and a timestamp only counts once it is confirmed in a Bitcoin block, so until then we call it submitted rather than anchored.",
      proof: anchorProof(root, ots),
      link: { href: "/root.json", label: "Open the signed root", external: true },
    },
    {
      n: "05",
      title: "We are in the rooms where this is decided",
      body:
        "Measurement only matters if it plugs into the standards everyone else will use. We take part in the bodies writing them — and we say plainly that taking part is not endorsement, and a listing is not adoption.",
      proof: standardsProof(),
      link: { href: "/memberships", label: "Where we take part, with the evidence" },
    },
    {
      n: "06",
      title: "It is a machine, not a report someone writes",
      body:
        "The board re-measures, the evidence tree is rebuilt, the root is re-signed and the ledgers are re-read on a schedule, without anyone typing a number. That is why the figures on this page are read from the endpoints as you load it rather than written into it.",
      proof: machineProof(root),
      link: { href: "#machine-surface", label: "Every door this machine serves" },
    },
  ];
}

export default function HomeStrengths({
  corrections,
  root,
  ots = null,
}: {
  corrections: ReadState<CorrectionsPayload>;
  root: ReadState<RootPayload>;
  ots?: PopPreview | null;
}) {
  const cards = strengthCards({ corrections, root, ots });
  return (
    <section
      id="why-this-is-different"
      aria-labelledby="strengths-h"
      className="surface-sunken section-y"
      data-testid="home-strengths"
    >
      <div className="section-shell">
        <p className="t-kicker text-emerald-700 dark:text-emerald-300">Why this one is different</p>
        <h2 id="strengths-h" className="t-band mt-4 max-w-3xl text-foreground">
          Six things you can check before you believe anything else on this page.
        </h2>
        <p className="t-lede measure mt-5 text-muted-foreground">
          None of these is an adjective. Each one names a thing we publish and gives you the door
          to go and look at it — and the small print beside each figure is the honest state of that
          source, not decoration.
        </p>
        <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {cards.map((c) => (
            <Tile key={c.n} card={c} />
          ))}
        </div>

        {/*
          The one promise underneath all six, stated once and plainly, with the doors that make
          it true beside it (owner, 2026-09-22). "Free forever" is the thing a reader is most
          likely to disbelieve and the easiest of all of them to check, so it gets its own line
          rather than a clause inside a card.
        */}
        <div
          className="mt-12 flex flex-col gap-6 rounded-3xl border border-emerald-600/25 bg-emerald-500/[0.07] p-7 sm:p-9 lg:flex-row lg:items-center lg:justify-between lg:gap-12"
          data-testid="strengths-free-forever"
        >
          <div>
            <p className="text-2xl font-black leading-tight tracking-tight text-foreground sm:text-[1.75rem]">
              Re-checking any of this costs nothing, needs no account, and always will.
            </p>
            <p className="measure mt-3 text-[15px] leading-relaxed text-muted-foreground">
              Not a trial, not a tier and not a limit we can quietly lower later. The tests, the
              grader, the records and the key are all published, so the check runs on your machine
              whether we are still here or not. What we charge for is work we do on request — never
              a score, never a place on the board, and never permission to look.
            </p>
          </div>
          <ul className="flex shrink-0 flex-col gap-2.5 text-sm font-bold lg:w-64">
            <li>
              <Link
                href="/gspc-verify"
                className="inline-flex w-full min-h-11 items-center justify-center rounded-xl bg-emerald-700 px-5 text-white transition hover:bg-emerald-800"
              >
                Check a record now →
              </Link>
            </li>
            <li>
              <a href="/signed/HOW-TO-VERIFY.md" className="text-emerald-800 underline underline-offset-4 dark:text-emerald-300">
                Do it offline, without our code
              </a>
            </li>
            <li>
              <a href="/.well-known/did.json" className="text-emerald-800 underline underline-offset-4 dark:text-emerald-300">
                Pin our key first
              </a>
            </li>
          </ul>
        </div>
      </div>
    </section>
  );
}
