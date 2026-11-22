/**
 * AboutRecord — /about/: what Council of AI does, one plain claim per row, with the proof beside it.
 *
 * Owner, 21 Nov 2026: the site must read as a measurement body with standing, which means plain
 * claims, each with a live proof link beside it, and no hedging where we have evidence.
 *
 * NOTHING HERE TYPES A FIGURE THAT A LIVE SOURCE OWNS. The board sentence is GET /api/gspc
 * totals.public_count (useBoardCount), the card counts are GET /api/state card_chain
 * (useEstateFacts), the ledger size is the rows GET /api/corrections served (correctionsSummary,
 * the same reader the home page uses), and the download figure is CSOAI's own by_entity row of
 * /interop/distribution-latest.json by the home page's rule (distributionRead). A source that has
 * not answered prints its sentence without the figure. Nothing is substituted for it.
 *
 * The standards rows are third-party records, each read live on 2026-11-21: the IETF Datatracker
 * (both drafts Active; "referenced by" lists three drafts by one other author), w3c-cg/aikr#25
 * (merged 2026-11-08, built on the 2026-10-11 public-aikr post), x402-foundation/x402#4127 (open),
 * the C2PA membership page (CSOAI LTD under Contributor Members) and the W3C participant pages
 * behind /memberships/. A row is removed, not reworded, when its record stops saying it.
 *
 * Holds kept (/api/corrections C-2026-1120-01, -02, -03): no rate or row from a subject-axis bank,
 * nothing from the governance axis, nothing from the 28 Oct claim re-read.
 */
import { useCorrections, useDistributionArtifact, type DistributionArtifact } from "@/components/home/useHomeReads";
import { correctionsSummary, type CorrectionsPayload, type ReadState } from "@/components/home/homeReads";
import { distributionRead } from "@/components/home/HomeDistribution";

export type ProofLink = { label: string; href: string };
export type RecordRow = { id: string; title: string; body: string; proof: ProofLink[] };

export interface RecordInputs {
  /** totals.public_count, only when it came off the live board. */
  boardCount: string | null;
  cards: { valid: number; published: number; keys: number } | null;
  corrections: ReadState<CorrectionsPayload>;
  distribution: ReadState<DistributionArtifact>;
  now?: number;
}

const nf = new Intl.NumberFormat("en-GB");
const day = (iso: string) =>
  new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(iso));

const DATATRACKER = "https://datatracker.ietf.org/doc";

/** Dated third-party records. Each href answered 200 and said what its row says on 2026-11-21. */
export const STANDARDS_ROWS: RecordRow[] = [
  {
    id: "ietf",
    title: "IETF.",
    body:
      "Our two Internet-Drafts on the IETF Datatracker are draft-templeman-scitt-measurement-capsule and draft-templeman-scitt-framing-space, and three Internet-Drafts by another author cite them.",
    proof: [
      { label: "capsule draft", href: `${DATATRACKER}/draft-templeman-scitt-measurement-capsule/` },
      { label: "framing-space draft", href: `${DATATRACKER}/draft-templeman-scitt-framing-space/` },
      { label: "drafts citing the capsule draft", href: `${DATATRACKER}/draft-templeman-scitt-measurement-capsule/referencedby/` },
      { label: "drafts citing the framing-space draft", href: `${DATATRACKER}/draft-templeman-scitt-framing-space/referencedby/` },
    ],
  },
  {
    id: "w3c",
    title: "W3C.",
    body:
      "On 11 October 2026 we proposed key and evidence states on the AI KR Community Group list. A participant built a runnable test set on that proposal, and the group merged it on 8 November 2026. We take part in three W3C Community Groups.",
    proof: [
      { label: "the proposal", href: "https://lists.w3.org/Archives/Public/public-aikr/2026Oct/0002.html" },
      { label: "the merged test set", href: "https://github.com/w3c-cg/aikr/pull/25" },
      { label: "where we take part", href: "/memberships/" },
    ],
  },
  {
    id: "x402",
    title: "x402.",
    body:
      "Our proposal for optional verifiable measurement references is open on the x402 Foundation's repository, and other implementers have replied.",
    proof: [{ label: "the proposal thread", href: "https://github.com/x402-foundation/x402/issues/4127" }],
  },
  {
    id: "c2pa",
    title: "C2PA.",
    body: "CSOAI Ltd is a C2PA Contributor Member.",
    proof: [{ label: "C2PA member list", href: "https://c2pa.org/membership/" }],
  },
];

/** The rows as printed, from whatever the live sources have answered so far. */
export function recordRows({ boardCount, cards, corrections, distribution, now }: RecordInputs): RecordRow[] {
  const ledger = corrections.kind === "ready" ? correctionsSummary(corrections.payload) : null;
  const census = distribution.kind === "ready" ? distributionRead(distribution.payload, now) : null;
  const signed = ledger?.signatureState === "VALID";
  const census_line = census
    ? `CSOAI's own packages have ${census.partial ? "at least " : ""}${nf.format(census.csoai.lifetime.value)} gross downloads since first release, from ${census.csoai.lifetime.covered} of ${census.csoai.lifetime.attempted} package counters, in the ${census.stale ? "out-of-date " : ""}census dated ${day(census.asOf)}.`
    : "No download figure is shown until the census of CSOAI's own packages can be read.";
  return [
    {
      id: "measure",
      title: "What we measure.",
      body: "AI models, AI agents and the systems they call, on frozen test banks with deterministic grading.",
      proof: [
        { label: "the method", href: "/methodology/" },
        { label: "the board", href: "/board/" },
      ],
    },
    {
      id: "board",
      title: "The live board.",
      body: boardCount
        ? `${boardCount}, read from the board's own endpoint as this page loads.`
        : "The current count is read from the board's own endpoint.",
      proof: [{ label: "GET /api/gspc", href: "/api/gspc" }],
    },
    {
      id: "signed",
      title: "Signed records, free to check.",
      body: `${
        cards
          ? `${cards.valid} of ${cards.published} published measurement cards verify against our Ed25519 ${cards.keys === 1 ? "key" : "keys"}, published under did:web:csoai.org.`
          : "Our published measurement cards carry Ed25519 signatures under did:web:csoai.org."
      } Anyone can check a card in the browser, with no account.`,
      proof: [
        { label: "verifier", href: "/gspc-verify/" },
        { label: "public keys", href: "/.well-known/did.json" },
        { label: "GET /api/state", href: "/api/state" },
      ],
    },
    {
      id: "corrections",
      title: "Corrections in public.",
      // Every entry carries what_was_wrong and what_changed (or its older name, fix); how_caught is
      // empty on some (12 of 97 on 2026-11-21), so the sentence says "where that was recorded".
      body: ledger
        ? `The ledger's ${ledger.entries} entries each say what was wrong and what changed, and how it was caught where that was recorded. ${signed ? "The ledger itself is signed." : `The ledger's signature reads ${ledger.signatureState}.`}`
        : "Each entry in the ledger says what was wrong and what changed, and how it was caught where that was recorded.",
      proof: [
        { label: "GET /api/corrections", href: "/api/corrections" },
        { label: "the ledger page", href: "/corrections/" },
      ],
    },
    {
      id: "distribution",
      title: "Distribution.",
      body: `${census_line} A download is distribution, not adoption, and MEOK AI Labs' packages are counted separately and never added.`,
      proof: [{ label: "the census", href: "/interop/distribution-latest.json" }],
    },
  ];
}

function Proof({ links }: { links: ProofLink[] }) {
  return (
    <span className="text-gray-400">
      {" "}Proof:{" "}
      {links.map((l, i) => (
        <span key={l.href}>
          {i > 0 ? " · " : null}
          <a
            href={l.href}
            className="text-emerald-300 underline underline-offset-4"
            rel={l.href.startsWith("https://") ? "noopener noreferrer" : undefined}
          >
            {l.label}
          </a>
        </span>
      ))}
    </span>
  );
}

export default function AboutRecord({
  boardCount,
  cards,
  corrections: injectedCorrections,
  distribution: injectedDistribution,
  now,
}: {
  boardCount: string | null;
  cards: RecordInputs["cards"];
  corrections?: ReadState<CorrectionsPayload>;
  distribution?: ReadState<DistributionArtifact>;
  now?: number;
}) {
  const corrections = useCorrections(injectedCorrections);
  const distribution = useDistributionArtifact(injectedDistribution);
  const rows = recordRows({ boardCount, cards, corrections, distribution, now });
  return (
    <section aria-labelledby="about-record-h" className="mb-10 border-t border-white/20 pt-8" data-testid="about-record">
      <h2 id="about-record-h" className="text-2xl font-bold mb-5 text-white">
        What we do, with the proof
      </h2>
      <ul className="space-y-4 text-base leading-relaxed text-gray-300">
        {rows.map((r) => (
          <li key={r.id} data-record={r.id}>
            <strong className="text-white">{r.title}</strong> {r.body}
            <Proof links={r.proof} />
          </li>
        ))}
        <li data-record="standards">
          <strong className="text-white">Standards work.</strong>
          <ul className="mt-2 space-y-2 border-l border-white/20 pl-4">
            {STANDARDS_ROWS.map((r) => (
              <li key={r.id} data-record={r.id}>
                <strong className="text-white">{r.title}</strong> {r.body}
                <Proof links={r.proof} />
              </li>
            ))}
          </ul>
        </li>
      </ul>
    </section>
  );
}
