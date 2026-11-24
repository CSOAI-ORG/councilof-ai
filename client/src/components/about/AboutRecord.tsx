/**
 * AboutRecord — /about/: what Council of AI does, one plain claim per row, with the proof beside it.
 *
 * Owner, 21 Nov 2026: the site must read as a measurement body, with plain claims and a live proof
 * link beside each one. The rows make the same claims, in the same order and on the same sources,
 * as the home hero (HERO_PROOF in client/src/components/home/HomeHero.tsx) and the lead of
 * /llms.txt, so the front door tells one story.
 *
 * NO ROW PRINTS A FIGURE. Every figure belongs to the source behind its link, and the live counters
 * beside this record (LiveModelCount, HeroStatsBar) read theirs from the endpoints that own them.
 * So nothing here can freeze a board count, quote a held row (/api/corrections C-2026-1120-01,
 * -02, -03) or compute a download figure of its own. Download figures are printed only where the
 * census is read: the home page's distribution band and /interop/distribution-latest.json.
 *
 * The bodies Council of AI takes part in are the next block on the page (MembershipStrip, read from
 * /interop/memberships.json), so this record links to them and does not repeat them.
 */
export type ProofLink = { label: string; href: string };
export type RecordRow = { id: string; title: string; body: string; proof: ProofLink[] };

const DATATRACKER = "https://datatracker.ietf.org/doc";

/** Each href answered 200 and said what its row says on 2026-11-24. */
export const RECORD_ROWS: RecordRow[] = [
  {
    id: "measure",
    title: "What we measure.",
    body: "AI models, AI agents and the systems they call, on frozen test banks with fixed grading rules.",
    proof: [
      { label: "the method", href: "/methodology/" },
      { label: "GET /api/gspc", href: "/api/gspc" },
    ],
  },
  {
    id: "board",
    title: "The live board.",
    body: "The results are on a live board, free to read, and its counts are read from the board's own endpoint.",
    proof: [{ label: "GET /api/gspc", href: "/api/gspc" }],
  },
  {
    id: "signed",
    title: "Signed records, free to check.",
    body: "Anyone can re-check our signed records for free in the browser, against our published Ed25519 keys and with no account.",
    proof: [
      { label: "verifier", href: "/gspc-verify/" },
      { label: "public keys", href: "/.well-known/did.json" },
    ],
  },
  {
    id: "corrections",
    title: "Corrections in public.",
    body: "Our corrections are published in a signed ledger, and each entry says what was wrong and what changed.",
    proof: [
      { label: "GET /api/corrections", href: "/api/corrections" },
      { label: "the ledger page", href: "/corrections/" },
    ],
  },
  {
    id: "distribution",
    title: "Distribution.",
    body: "We publish a dated census of downloads of our own packages. A download is distribution, not adoption, and MEOK AI Labs' packages are counted separately and never added to ours.",
    proof: [{ label: "the census", href: "/interop/distribution-latest.json" }],
  },
  {
    id: "standards",
    title: "Standards work.",
    body: "Another author's Internet-Drafts cite our IETF Internet-Drafts. The bodies we take part in follow below, each with our role and the evidence for it.",
    proof: [
      { label: "drafts citing the framing-space draft", href: `${DATATRACKER}/draft-templeman-scitt-framing-space/referencedby/` },
      { label: "drafts citing the capsule draft", href: `${DATATRACKER}/draft-templeman-scitt-measurement-capsule/referencedby/` },
      { label: "where we take part", href: "/memberships/" },
    ],
  },
];

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

export default function AboutRecord() {
  return (
    <section aria-labelledby="about-record-h" className="mb-10 border-t border-white/20 pt-8" data-testid="about-record">
      <h2 id="about-record-h" className="text-2xl font-bold mb-5 text-white">
        What we do, with the proof
      </h2>
      <ul className="space-y-4 text-base leading-relaxed text-gray-300">
        {RECORD_ROWS.map((r) => (
          <li key={r.id} data-record={r.id}>
            <strong className="text-white">{r.title}</strong> {r.body}
            <Proof links={r.proof} />
          </li>
        ))}
      </ul>
    </section>
  );
}
