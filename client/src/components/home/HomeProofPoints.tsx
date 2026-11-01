import { Link } from "wouter";

export interface ProofPoint {
  id: string;
  title: string;
  body: string;
  href: string;
  link: string;
}

/** Nine concrete reasons to trust the work, each with a route to its public proof. */
export const PROOF_POINTS: ProofPoint[] = [
  {
    id: "frozen-tests",
    title: "Frozen, published tests",
    body: "The questions and grading target are published before a run, so they do not move after the answers arrive.",
    href: "/methodology",
    link: "Read the measurement method",
  },
  {
    id: "fixed-rules",
    title: "Fixed rules, not AI judging AI",
    body: "Deterministic grading reads the answers against the published rule rather than asking another model for an opinion.",
    href: "/methodology",
    link: "See how grading works",
  },
  {
    id: "signed-evidence",
    title: "Signed evidence",
    body: "Issued measurement records carry an Ed25519 signature, so changed bytes can be detected instead of quietly accepted.",
    href: "/signed/HOW-TO-VERIFY.md",
    link: "Inspect the signing method",
  },
  {
    id: "free-verification",
    title: "Verification is free",
    body: "Use the browser verifier without an account or a fee, and read exactly what its result does and does not establish.",
    href: "/gspc-verify",
    link: "Check a record yourself",
  },
  {
    id: "visible-gaps",
    title: "Gaps and ties stay visible",
    body: "A tie stays a tie. An untested or unmeasured slot stays labelled instead of becoming a zero or a made-up winner.",
    href: "/board",
    link: "Read the board states",
  },
  {
    id: "corrections",
    title: "Corrections are public and dated",
    body: "When something changes, the ledger records what was wrong and what changed; signed history is superseded, not edited.",
    href: "/corrections/",
    link: "Open the corrections ledger",
  },
  {
    id: "own-models",
    title: "Our own models are listed apart",
    body: "Council models are identified separately and are not blended into the count of independent models measured.",
    href: "/models-measured/",
    link: "Inspect the model list",
  },
  {
    id: "human-agent-access",
    title: "Made for people and machines",
    body: "Read the same public evidence through web pages, downloadable data, APIs, MCP and documented agent tools.",
    href: "/connect/",
    link: "Choose a connection",
  },
  {
    id: "accountable-company",
    title: "An accountable UK company",
    body: "Council of AI is operated by CSOAI Ltd, registered in the UK as company 16939677. Measurement, not certification.",
    href: "/about/",
    link: "Meet the organisation",
  },
];

export default function HomeProofPoints() {
  return (
    <section aria-labelledby="home-proof-points-h" className="surface-base section-y border-t border-border" data-testid="home-proof-points">
      <div className="section-shell">
        <div className="max-w-3xl">
          <p className="t-kicker text-emerald-800 dark:text-emerald-300">Nine reasons to look closer</p>
          <h2 id="home-proof-points-h" className="t-band mt-3 text-foreground">Trust is something you can inspect.</h2>
          <p className="t-lede mt-4 text-muted-foreground">No superlatives and no mystery scores. These are the working safeguards behind the measurements, with the evidence one click away.</p>
        </div>
        <ol className="mt-10 grid list-none gap-px overflow-hidden rounded-3xl border border-border bg-border p-0 md:grid-cols-2 lg:grid-cols-3">
          {PROOF_POINTS.map((point, index) => (
            <li key={point.id} className="flex min-h-64 flex-col bg-card p-6 sm:p-7" data-proof-point={point.id}>
              <span className="font-mono text-xs font-black tabular-nums text-emerald-700 dark:text-emerald-400">{String(index + 1).padStart(2, "0")}</span>
              <h3 className="mt-4 text-xl font-black leading-tight tracking-tight text-foreground">{point.title}</h3>
              <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">{point.body}</p>
              <Link href={point.href} className="mt-auto inline-flex min-h-11 items-end pt-4 text-sm font-extrabold text-emerald-800 underline decoration-emerald-600/30 underline-offset-4 hover:decoration-emerald-600 dark:text-emerald-300">
                {point.link} →
              </Link>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
