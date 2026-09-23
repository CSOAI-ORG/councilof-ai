/**
 * HomeNavigator — the whole business, grouped the way a reader thinks, one click from here.
 *
 * WHAT IT REPLACED. Four numbered buttons: "1 · Explore measurements", "2 · See what changed",
 * "3 · Verify evidence", "4 · Access supported feeds". A first-time reader cannot tell what a
 * "supported feed" is, the numbering implied an order nobody follows, and four doors is not this
 * business — the estate has a board, a verifier, a ledger, ten data doors, a tool surface, a
 * participation record and a library behind it, and none of that was reachable from the front
 * door without hunting.
 *
 * FIVE QUESTIONS, NOT EIGHT SECTORS. The library taxonomy is how the archive is ORGANISED; it is
 * not how a stranger arrives. They arrive with one of five questions — what have you measured,
 * how do I check it, can I use it, what have you got wrong, and who are you — so those are the
 * columns, and the library itself is one of the doors inside the last one.
 *
 * EVERY HREF WAS CHECKED. Each destination below returned 200 on the live site on 2026-09-22
 * (following the trailing-slash redirect the edge serves). A door that does not open has no
 * business on the front page — that is the same defect this instrument exists to catch.
 */
import { Link } from "wouter";

export interface NavLink {
  href: string;
  label: string;
  /** What the reader gets, in their words. One line, never a feature name. */
  what: string;
  /** JSON, a raw artifact or an off-site page — opened directly rather than routed. */
  raw?: boolean;
}

export interface NavGroup {
  id: string;
  question: string;
  lede: string;
  links: NavLink[];
}

export const NAV_GROUPS: NavGroup[] = [
  {
    id: "see",
    question: "What have you measured?",
    lede: "The results, and the tests behind them.",
    links: [
      { href: "#board", label: "The living board", what: "every slot, its sample size and whether a result separated" },
      { href: "/dashboard?tab=board", label: "The full board in one window", what: "the same board with every pane beside it" },
      { href: "/methodology", label: "How a measurement is made", what: "frozen tests, rule-based grading, no model judging another" },
      { href: "/benchmark-index", label: "Other people's figures, kept apart", what: "published studies shown beside ours and never averaged in" },
      { href: "/gspc-arena", label: "Watch two systems take the same test", what: "the head-to-head, decided by a fixed rule" },
    ],
  },
  {
    id: "check",
    question: "How do I check it?",
    lede: "Everything you need to disbelieve us.",
    links: [
      { href: "/gspc-verify", label: "Verify a record", what: "paste one; your browser does the maths, nothing is sent to us" },
      { href: "/signed/HOW-TO-VERIFY.md", label: "The rule, written out", what: "do it offline in your own language, without our code", raw: true },
      { href: "/root.json", label: "The signed evidence root", what: "one signed fingerprint covering every published record", raw: true },
      { href: "/.well-known/did.json", label: "Our public key", what: "pin this first — a record that signs itself proves nothing", raw: true },
      { href: "/honesty", label: "What we hold back, and why", what: "the limits, stated by us before anyone else states them" },
    ],
  },
  {
    id: "use",
    question: "Can I use it?",
    lede: "Free to read. Metered where we do work for you.",
    links: [
      { href: "/quickstart", label: "Start in five minutes", what: "the first call, the first record, the first check" },
      { href: "#machine-surface", label: "The data doors", what: "ten published populations, each with a free preview" },
      { href: "/tools", label: "Tools for the editor you already use", what: "ask the live board from inside your own assistant" },
      { href: "/api-docs", label: "The API", what: "every endpoint, its shape and what it will not claim" },
      { href: "/contact?arm=run", label: "Ask about measuring your system", what: "a scoped run is arranged by enquiry; the receipt-only API does not start one" },
      { href: "/embed", label: "Put a record on your own site", what: "a badge that re-checks its own signature in each reader's browser" },
    ],
  },
  {
    id: "changed",
    question: "What have you got wrong?",
    lede: "The uncomfortable half, kept in public.",
    links: [
      { href: "/refutation-ledger", label: "The corrections ledger", what: "what was wrong, how it was caught, what changed, dated" },
      { href: "/press", label: "The change record", what: "what moved on this estate and when" },
      { href: "/claims-register", label: "Claims we are holding ourselves to", what: "our own public claims, captured and waiting to be measured" },
      { href: "/eu-ai-act", label: "What the law does next", what: "dated obligations read from the primary sources" },
    ],
  },
  {
    id: "who",
    question: "Who are you?",
    lede: "A UK company, and a short list of things we refuse to be.",
    links: [
      { href: "/about", label: "About us", what: "who is behind this and how it is paid for" },
      { href: "/memberships", label: "Where we take part", what: "every participation record, each linked to its evidence" },
      { href: "/library", label: "The library", what: "the full archive, by subject, nothing deleted" },
      { href: "/contact", label: "Contact", what: "one address, and what we will and will not answer" },
    ],
  },
];

function Column({ group }: { group: NavGroup }) {
  return (
    <div data-nav-group={group.id}>
      <h3 className="text-lg font-black leading-tight tracking-tight text-foreground">{group.question}</h3>
      <p className="mt-1.5 text-[13px] font-semibold text-emerald-700 dark:text-emerald-300">{group.lede}</p>
      <ul className="mt-5 space-y-4 border-t border-border pt-5">
        {group.links.map((l) => {
          const inner = (
            <>
              <span className="block text-[14.5px] font-bold leading-snug text-foreground group-hover:text-emerald-700 dark:group-hover:text-emerald-300">
                {l.label}
              </span>
              <span className="mt-1 block text-[13px] leading-snug text-muted-foreground">{l.what}</span>
            </>
          );
          return (
            <li key={l.href + l.label}>
              {l.raw || l.href.startsWith("#") ? (
                <a href={l.href} className="group block">
                  {inner}
                </a>
              ) : (
                <Link href={l.href} className="group block">
                  {inner}
                </Link>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export default function HomeNavigator() {
  return (
    <section
      id="navigate"
      aria-labelledby="navigate-h"
      className="surface-base section-y border-t border-border"
      data-testid="home-navigator"
    >
      <div className="section-shell">
        <p className="t-kicker text-emerald-700 dark:text-emerald-300">Everything, one click away</p>
        <h2 id="navigate-h" className="t-band mt-4 max-w-3xl text-foreground">
          Five questions. Every door behind them.
        </h2>
        <p className="t-lede measure mt-5 text-muted-foreground">
          Nothing on this estate is more than one click from here. If a link below did not open, it
          would not be on this page.
        </p>
        <div className="mt-12 grid gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {NAV_GROUPS.map((g) => (
            <Column key={g.id} group={g} />
          ))}
        </div>
      </div>
    </section>
  );
}
