import { useMemo } from "react";
import { LOBBY_TABS } from "@/components/lobby/tabs";
import { type LobbyTaskId } from "@/lib/lobbyLink";
import { useBoardCount } from "@/lib/boardCount";
import { EUNOMIA_AXES } from "@/data/eunomia";
import type { LobbyTabId } from "@/components/lobby/tabs";
import HomeUnderstand from "./HomeUnderstand";

/**
 * ToolStack — nine sections, one per thing this place actually does.
 *
 * WHY IT EXISTS. The front door used to open on a 13-slide scroll-world and then a
 * two-column "the problem we fix" panel that named the problem once, in the abstract.
 * A stranger reached the bottom of the page knowing the doctrine and not knowing what
 * they could DO here. This band answers the other question: nine tools, each with the
 * pain it removes stated in the reader's words, and a door that opens the tool.
 *
 * EACH TILE IS A REAL PAGE HREF. Board and OS go to /os?lobby=board or
 * /os?lobby=home. Verify is /gspc-verify. Assess, evidence, embed, report,
 * insurers, registers are pages. No /?lobby= dump and no openLobby intercept.
 *
 * NINE, NOT NINE-ISH. Every tile below has a destination a stranger can reach today.
 * A tool with no destination is not on this band at all, and a tool whose destination
 * is real but conditional (a sign-in, a small item set) says so on its own face —
 * `note` is a first-class field, not a disclaimer bolted on. The alternative, a tile
 * that promises a surface that does not exist, is the exact defect this instrument
 * exists to catch, committed on our own front door.
 *
 * NO NUMBER IS TYPED HERE. The board tile quotes totals.public_count off GET /api/gspc
 * (via useBoardCount, which reports whether it is holding a live read or the last
 * recorded one). The OS tile counts the rail registry. The register tile reads its row
 * out of the register data. If a tool has no honest number it shows none.
 */

type Door =
  | { kind: "pane"; pane: LobbyTabId }
  | { kind: "task"; task: LobbyTaskId }
  | { kind: "route"; path: string };

interface Tool {
  id: string;
  family: string;
  name: string;
  /** What it does, in a sentence someone outside this industry can read. */
  what: string;
  /** The pain it removes, stated as the reader's problem rather than our feature. */
  pain: string;
  /** A standing condition or limit on the tool. Shown on the tile, never hidden. */
  note?: string;
  /** Short ticks a stranger can scan. Benefits, never invented counts. */
  ticks: string[];
  image: string;
  alt: string;
  /**
   * object-position for the 16:9 crop. The plates are drawn at wildly different
   * aspects (1110x445, 1220x240, 1024x576), so a centred cover crop can cut a
   * baked-in label in half — and an alt that describes text the reader can only
   * see half of is a small lie. Set this where the subject is not centred.
   */
  objectPosition?: string;
  /** Where in Council OS the tile opens. */
  door: Door;
}

const TOOLS: Tool[] = [
  {
    id: "tool-os",
    family: "The workspace",
    name: "Council OS",
    what:
      "One window that opens every surface here — the board, the verifier, the assessment, the evidence pack — without a second tab or a second login.",
    pain:
      "Otherwise each answer lives on a different page, and nothing you find on one is usable on the next.",
    ticks: [
      "Board, verify, get measured and the evidence pack in one window.",
      "No second tab and no second login.",
      "Every pane is a real page you can open today.",
    ],
    image: "/images/band/hardened.png",
    alt: "A field of pale solids joined by a lattice of green light",
    door: { kind: "route", path: "/os?lobby=home" },
  },
  {
    id: "tool-board",
    family: "GSPC · the living board",
    name: "The living board",
    what:
      "Every slot we publish about how AI systems behave, with the measurement behind it — and a visibly empty cell wherever there is no measurement.",
    pain:
      "Otherwise you compare suppliers on scorecards that quietly leave out the tests they did badly on.",
    ticks: [
      "A filled cell is a measurement. A dash is honest emptiness.",
      "Counts come from living GET /api/gspc — never typed into the page.",
      "A TIE stays a TIE. It is never dressed up as a win.",
    ],
    image: "/images/detail/board_arena_detail.jpg",
    alt: "Clay people and pale humanoids facing each other across an arena under beams of light",
    door: { kind: "pane", pane: "board" },
  },
  {
    id: "tool-verify",
    family: "Free forever",
    name: "Verify a card",
    what:
      "Paste a signed measurement record and your own browser recomputes its hash and checks the signature. Nothing is sent to us, and nothing needs our permission.",
    pain:
      "Otherwise checking somebody's AI claim means trusting the company that made the claim.",
    ticks: [
      "Your browser recomputes the hash and checks Ed25519.",
      "Nothing is sent to us. Nothing needs our permission.",
      "Three states only: VALID · INVALID · UNCHECKABLE.",
    ],
    note: "No account and no fee, permanently.",
    image: "/images/method/receipt.png",
    alt: "A pale slab split by green light, stamped “Ed25519 Verified”",
    door: { kind: "pane", pane: "verify" },
  },
  {
    id: "tool-measured",
    family: "Your own system",
    name: "Get measured",
    what:
      "We run your system against the frozen, published tests that apply to it and hand you a small signed record you keep — the scores, the sample size behind each one, and the slots we could not fill.",
    pain:
      "Otherwise you hand a buyer a policy document where they asked for evidence.",
    ticks: [
      "Frozen, published tests — the target does not move after you sit.",
      "You keep the signed card. Publishing it is your decision.",
      "Slots we could not fill stay empty and are named.",
    ],
    // NOT "sign-in required": /assess is wrapped in RequireAuth, but RequireAuth
    // carries an explicit isPublicMeasure() carve-out for exactly this route
    // (components/RequireAuth.tsx) — "Get measured is free and needs no account".
    // Verified in the pane before this line was written.
    note: "Free, and no account. The card is yours; publishing it is your decision.",
    image: "/images/detail/evidence_vault_detail.jpg",
    alt: "Clay figures pointing at a card reading “3KB credential” in front of an open vault",
    door: { kind: "pane", pane: "measured" },
  },
  {
    id: "tool-gpai",
    family: "EU AI Act · GPAI",
    name: "GPAI evidence pack",
    what:
      "Builds the evidence index for one general-purpose AI system: the live rows that exist, the published banks they resolve to, and the gaps, named rather than skipped.",
    pain:
      "GPAI duties have been in force since 2 August 2025, and most providers have only their own paperwork to show for them.",
    ticks: [
      "Live rows that exist, the banks they resolve to, and the gaps.",
      "Gaps are named rather than skipped.",
      "Independent evidence — not a conformity mark, and not legal advice.",
    ],
    note: "Independent evidence. Not a conformity mark, and not legal advice.",
    image: "/images/method/ast.png",
    alt: "A block of carved statute breaking apart into a branching tree of true/false conditions",
    door: { kind: "pane", pane: "evidence" },
  },
  {
    id: "tool-embed",
    family: "For your own site",
    name: "Embed and white-label kit",
    what:
      "Builds a badge or card you can paste into your own site that re-checks its own signature in each reader's browser — it goes green only when the bytes are true.",
    pain:
      "Otherwise the people reading your site still have to take your word for the result.",
    ticks: [
      "A badge that goes green only when the bytes are true.",
      "Each reader's browser re-checks the signature.",
      "Built only from what is actually on the board.",
    ],
    note: "Built only from what is actually on the board. Free forever.",
    image: "/images/method/foundry.png",
    alt: "A pale moulded form lifting out of a split block of clay on a beam of green light",
    door: { kind: "pane", pane: "embed" },
  },
  {
    id: "tool-insurers",
    family: "Underwriting",
    name: "Insurance evidence rail",
    what:
      "The measured rows, the honestly empty ones, and third-party reported figures — kept in three separate columns and never blended into a single number an underwriter could mistake for a rating.",
    pain:
      "Otherwise AI exposure is priced off a questionnaire the applicant filled in about itself, and nothing updates between binding and renewal.",
    ticks: [
      "Measured, empty and reported figures stay in three separate columns.",
      "Nothing is blended into a single number an underwriter could mistake for a rating.",
      "We measure. We do not price risk.",
    ],
    note: "We measure. We do not price risk, and we take no share of anything written on the back of a card.",
    image: "/images/detail/liveness_drift_detail.jpg",
    alt: "An hourglass weighing a stale seal against a re-attested current one, fed by EUR-Lex and legislation.gov.uk ribbons",
    door: { kind: "task", task: "insurer-rail" },
  },
  {
    id: "tool-registers",
    family: "Financial and legacy systems",
    name: "Specialist registers",
    what:
      "A separate board for money and mainframes: whether a COBOL copybook off a bond desk can be turned into an attestable record, whether an underwriting rule reads as covered or excluded — one row per instrument, each with its own item count.",
    pain:
      "Otherwise the systems that actually run a bond desk or a claims book sit outside every AI measurement anybody publishes.",
    ticks: [
      "One row per instrument, each with its own item count.",
      "COBOL copybook and underwriting-rule rows sit beside the public board.",
      "A specialist register is still measurement — never a certificate.",
    ],
    image: "/images/loop/four-states.png",
    alt: "Specimens sealed in glass tubes, turning from grey clay to a lit green core",
    door: { kind: "task", task: "specialist-registers" },
  },
  {
    id: "tool-report",
    family: "Open to everyone",
    name: "Report an incident",
    what:
      "A public form for AI behaviour that looks wrong. The intake hands you a signed acknowledgement of exactly what you filed, and whatever we act on is measured and signed like everything else here.",
    pain:
      "Otherwise a harm disappears into a supplier's private support queue and nobody outside it ever learns it happened.",
    ticks: [
      "A public form for AI behaviour that looks wrong.",
      "You get a signed acknowledgement of exactly what you filed.",
      "Whatever we act on is measured and signed like everything else here.",
    ],
    note: "Anyone can file one. No account, and no charge.",
    image: "/images/loop/outcry.png",
    objectPosition: "left center",
    alt: "A raw jagged signal trace behind a glass panel labelled “unstructured outcry”",
    door: { kind: "pane", pane: "watchdog" },
  },
];

export function hrefFor(door: Door): string {
  if (door.kind === "route") return door.path;
  if (door.kind === "pane") {
    if (door.pane === "verify") return "/gspc-verify";
    if (door.pane === "measured" || door.pane === "ras" || door.pane === "assess") return "/assess";
    if (door.pane === "evidence") return "/evidence-rail";
    if (door.pane === "embed") return "/embed";
    if (door.pane === "watchdog") return "/report";
    if (door.pane === "cards" || door.pane === "harness" || door.pane === "space") {
      return `/os?lobby=${door.pane}`;
    }
    return "/os?lobby=board";
  }
  if (door.task === "insurer-rail") return "/insurers";
  if (door.task === "specialist-registers") return "/registers";
  if (
    door.task === "pricing-overview" ||
    door.task === "enterprise-start" ||
    door.task === "get-measured"
  ) {
    return "/assess";
  }
  return "/os?lobby=board";
}

/** The live figure a tile is entitled to show, or null when it has none. */
function useLiveFigures() {
  const board = useBoardCount();
  const registers = useMemo(() => {
    // Read the bond row out of the register data rather than typing its numbers.
    const bond = EUNOMIA_AXES.find((a) => a.axis === "bond-router");
    if (!bond || bond.status !== "MEASURED") return null;
    return `bond desk · COBOL copybook → attestation · MEASURED on ${bond.n} graded items`;
  }, []);

  return {
    "tool-os": {
      value: `${LOBBY_TABS.length} panes in the rail`,
      source: "counted from the Council OS rail registry",
    },
    "tool-board": {
      value: board.public_count,
      source: board.live
        ? "live from GET /api/gspc"
        : "last recorded read — if it disagrees, the endpoint wins",
    },
    "tool-registers": registers
      ? { value: registers, source: "read from the published register rows" }
      : null,
  } as Record<string, { value: string; source: string } | null | undefined>;
}

function Tile({ tool, figure }: { tool: Tool; figure?: { value: string; source: string } | null }) {
  const href = hrefFor(tool.door);
  return (
    <article id={tool.id} aria-labelledby={`${tool.id}-name`} className="h-full">
      <a
        href={href}
        className="card-quiet group flex h-full flex-col overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2"
      >
        <img
          src={tool.image}
          alt={tool.alt}
          loading="lazy"
          decoding="async"
          width={1376}
          height={774}
          style={tool.objectPosition ? { objectPosition: tool.objectPosition } : undefined}
          className="aspect-[16/9] w-full bg-emerald-500/[0.06] object-cover transition-transform duration-500 motion-safe:group-hover:scale-[1.03]"
        />
        <div className="flex flex-1 flex-col gap-3 p-6">
          <span className="t-kicker text-emerald-700 dark:text-emerald-300">{tool.family}</span>
          <h3 id={`${tool.id}-name`} className="t-card text-lg text-foreground group-hover:text-emerald-700 dark:group-hover:text-emerald-300">
            {tool.name}
          </h3>
          <p className="t-body text-foreground/80">{tool.what}</p>
          <p className="t-body text-muted-foreground">{tool.pain}</p>
          <HomeUnderstand items={tool.ticks} />

          {figure && (
            <p className="mt-auto rounded-xl border border-emerald-500/30 bg-emerald-500/[0.08] px-3 py-2 text-[13px] font-semibold leading-snug text-emerald-900 dark:text-emerald-200">
              {figure.value}
              <span className="mt-0.5 block text-[11px] font-medium text-emerald-800/75 dark:text-emerald-300/80">
                {figure.source}
              </span>
            </p>
          )}

          {tool.note && (
            <p className={`text-[12.5px] font-medium leading-snug text-muted-foreground ${figure ? "" : "mt-auto"}`}>
              {tool.note}
            </p>
          )}

          <span className="mt-3 inline-flex items-center gap-1.5 text-sm font-extrabold text-emerald-700 dark:text-emerald-300">
            Open in Council OS
            <span aria-hidden className="transition-transform group-hover:translate-x-0.5">→</span>
          </span>
        </div>
      </a>
    </article>
  );
}

export default function ToolStack() {
  const figures = useLiveFigures();
  return (
    <section id="what-we-fix" aria-labelledby="what-we-fix-title" className="surface-sunken section-y">
      <div className="section-shell">
        <p className="t-kicker text-center text-emerald-700 dark:text-emerald-300">Nine products</p>
        <h2 id="what-we-fix-title" className="t-section mt-4 text-center text-foreground">
          What you can actually do here
        </h2>
        <p className="t-lede measure measure-center mt-5 text-center text-muted-foreground">
          Independent measurement body. We run AI systems against frozen published tests, sign the
          result, and leave empty cells empty. Nine doors, each a real page.
        </p>
        <div className="mx-auto mt-8 max-w-3xl rounded-2xl border border-emerald-200/70 bg-emerald-50/60 px-5 py-4">
          <HomeUnderstand
            title="Why these nine, and not a catalogue"
            items={[
              "Each tile opens a page that exists today. A tool with no destination is not on this band.",
              "Empty cells stay empty. We do not invent a figure to fill a gap.",
              { kind: "usp", text: "We measure. We do not sell a rank, a certificate, or a placement." },
            ]}
          />
        </div>


        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {TOOLS.map((t) => (
            <Tile key={t.id} tool={t} figure={figures[t.id]} />
          ))}
        </div>
      </div>
    </section>
  );
}
