/**
 * play — the "Council OS — local play" gallery data.
 *
 * THE HONESTY RULE FOR THIS FILE, AND IT IS THE WHOLE POINT OF IT.
 * Play gallery cards are preview-only until live routes ship. The arena wrapper exists
 * only as a local package; no match, duel or swarm run is running on this site
 * for anyone to join. So:
 *
 *   - `route` is set ONLY where a real route in client/src/App.tsx already
 *     serves a real page. It is a page you READ, never a match you play.
 *   - Everything else is `status: "in-build"` and renders as
 *     "Not yet playable — in build". It gets no link, because a link would
 *     imply a destination that does not exist.
 *
 * If you add a card here, the default is "in-build". A card only earns a route
 * when you have opened that route yourself and seen a real page answer.
 */

export type PlayStatus = "route" | "in-build";

export interface PlayCard {
  id: string;
  title: string;
  /** What the card is, said plainly. Never "play now" for something you cannot. */
  blurb: string;
  /** Branded art already in public/images. */
  image: string;
  /** Real alt text — these are content images, not decoration. */
  alt: string;
  status: PlayStatus;
  /** Present only when status === "route". Framed in the centre pane. */
  route?: string;
  /** The honest caption under the status chip. Always rendered. */
  reality: string;
}

export const PLAY_CARDS: PlayCard[] = [
  {
    id: "coliseum",
    title: "The Coliseum",
    blurb: "Frontier systems measured against frozen statutory text by deterministic rules.",
    image: "/images/coliseum_hero_arena.jpg",
    alt: "Clay figures and green verification seals gathered in a marble arena",
    status: "route",
    route: "/coliseum",
    reality: "Opens the real page in the centre pane. It is a story surface you read — not a match you play.",
  },
  {
    id: "logic-duel",
    title: "Logic Duel — human vs AI",
    blurb: "A human and a model answering the same graded items, side by side.",
    image: "/images/coliseum_logic_duel.jpg",
    alt: "A human and an AI facing each other across a chessboard in the arena",
    status: "in-build",
    reality: "In build — no live match route on councilof.ai yet.",
  },
  {
    id: "swarm-clash",
    title: "Swarm Clash",
    blurb: "Many agents against one governed boundary, scored on what the boundary held.",
    image: "/images/coliseum_swarm_clash.jpg",
    alt: "A swarm of green shards clashing with clay scientists raising shields",
    status: "in-build",
    reality: "In build — arena wrapper is local preview only.",
  },
  {
    id: "humans-vs-humanoids",
    title: "Humans vs Humanoids",
    blurb: "Human oversight held against embodied agents, with the stop recorded.",
    image: "/images/coliseum_humans_vs_humanoids.jpg",
    alt: "Humans directing AI figures with beams of light, keeping oversight",
    status: "in-build",
    reality: "No playable route. A dramatised proof-of-concept page exists elsewhere on the site; it is a scripted demonstration, not a match, so it is not linked from here.",
  },
  {
    id: "literacy",
    title: "Literacy Training Arena",
    blurb: "Learning how these systems behave, and what a measurement does and what a measurement does not say.",
    image: "/images/literacy_training_arena.jpg",
    alt: "People learning how AI behaves inside a training arena",
    status: "route",
    route: "/academy",
    reality: "Opens Council Academy in the centre pane. Course completion attests training, not conformity.",
  },
  {
    id: "compliance-training",
    title: "Compliance Training World",
    blurb: "Industry quests — bank, insurance, equity, bond, cross-border — with signed attestations.",
    image: "/images/literacy_training_arena.jpg",
    alt: "Compliance training quests across regulated industries",
    status: "route",
    route: "/compliance-training-world/catalog.html",
    reality: "Opens the live quest catalog in the centre pane. Training attests completion — not certification.",
  },
  {
    id: "council-town",
    title: "Council Town",
    blurb: "The agent-town simulation — citizens, quests, and local play on a separate deploy.",
    image: "/images/coliseum_hero_arena.jpg",
    alt: "A stylised town square for Council Town",
    status: "route",
    route: "https://council-town.pages.dev",
    reality: "Opens Council Town in the centre pane (external deploy). Local XP on /os stays in this browser only.",
  },
];

/** The standing notice above the gallery. Rendered every time, never dismissible. */
export const PLAY_NOTICE =
  "Play gallery previews on councilof.ai. Where a card opens a route, that route is a " +
  "page to read. Cards marked “Not yet playable — in build” have no live destination yet, and are " +
  "shown so the roadmap is visible rather than implied.";
