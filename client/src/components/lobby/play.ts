/**
 * play — the "Council OS — local play" gallery data.
 *
 * THE HONESTY RULE FOR THIS FILE, AND IT IS THE WHOLE POINT OF IT.
 * Play gallery cards are preview-only until live routes ship. The arena wrapper exists
 * only as a local package; no match, duel or swarm run is running on this site
 * for anyone to join. So:
 *
 *   - `route` is set ONLY where a real destination already answers on this site
 *     (an App.tsx route, or a real static page like /gspc-quests.html). Most are
 *     pages you READ; a card may claim "playable now" only when its destination
 *     was actually played end-to-end (quests: played and graded 2026-08-27).
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
  /** Status-chip wording for a live route. Defaults to "opens a page"; a card may
   *  say "playable now" ONLY when the destination is genuinely interactive. */
  chip?: string;
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
    id: "gspc-quests",
    title: "GSPC Quests — answer what the models answered",
    blurb:
      "Six axis-scoped quests from the banked GSPC items. Your answers are read by the same " +
      "deterministic regex and scored by the same macro-F1 rule used to measure every model.",
    // Reuses the duel art deliberately: this is the graded-items half of that idea,
    // playable today — the live match half stays honestly in-build below.
    image: "/images/coliseum_logic_duel.jpg",
    alt: "A human and an AI facing each other across a chessboard in the arena",
    status: "route",
    route: "/gspc-quests.html",
    chip: "playable now",
    reality:
      "Opens the real quest page in the centre pane. You actually play: pick a quest, answer its " +
      "items, and the page grades you with the model's own grader, beside the model's published " +
      "figure. Your score stays in this browser — nothing is recorded or sent anywhere.",
  },
  {
    id: "logic-duel",
    title: "Logic Duel — human vs AI",
    blurb: "A human and a model answering the same graded items, side by side.",
    image: "/images/coliseum_logic_duel.jpg",
    alt: "A human and an AI facing each other across a chessboard in the arena",
    status: "in-build",
    reality:
      "In build — no live match route on councilof.ai yet, and no real human-vs-AI play trial has " +
      "been recorded by anyone. The board's in-lane human-vs-ai figure measures how often a MODEL " +
      "agrees with a human answer key — not a human playing live. Until a human actually plays, " +
      "this card stays honest and unplayable.",
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
    blurb: "Learning how these systems behave, and what a measurement does and does not say.",
    image: "/images/literacy_training_arena.jpg",
    alt: "People learning how AI behaves inside a training arena",
    status: "route",
    route: "/academy",
    reality: "Opens Council Academy in the centre pane. Course completion attests training, not conformity.",
  },
];

/** The standing notice above the gallery. Rendered every time, never dismissible. */
export const PLAY_NOTICE =
  "Play gallery previews on councilof.ai. Where a card opens a route, the card says what kind of " +
  "destination it is — one is a quest page you actually play, the rest are pages you read. Cards " +
  "marked “Not yet playable — in build” have no live destination yet, and are shown so the roadmap " +
  "is visible rather than implied.";
