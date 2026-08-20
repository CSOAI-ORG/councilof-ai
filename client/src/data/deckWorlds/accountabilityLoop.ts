import type { Slide } from "@/components/scrollworld";

/**
 * THE ACCOUNTABILITY LOOP — owner deck ("The Trustless Accountability Loop"),
 * fact-checked into the scroll-world at /accountability-loop.
 *
 * WHAT THIS PAGE IS: a published DESIGN for turning a member of the public's report
 * about an AI system into evidence a market surveillance authority could actually act
 * on — without publishing an allegation about a named company before that company has
 * been told and given a reply.
 *
 * WHAT RUNS TODAY: state 1 only. The public intake exists. Escrow, the reply window
 * and the complaint compiler do not — grep for "escrow", "right of reply", "72-hour"
 * and "Article 85" across this repository returns zero implementation hits, and the
 * honesty band says so in plain sight.
 *
 * SOURCE ART: deck slides cut to their label-free region at build time
 * (public/images/loop/) and badged, the same treatment as /images/infographics/crop/.
 *
 * CORRECTIONS APPLIED TO THE SOURCE DECK:
 *  1. Deck title "The Trustless Accountability Loop" — DROPPED. "Trustless" is
 *     consensus-marketing vocabulary and sits next to the fault-tolerance claim this
 *     organisation has already publicly retracted (DR-0007). Nothing here is trustless;
 *     it is checkable, which is a different and smaller word.
 *  2. Deck subtitle "Translating Crowdsourced Governance into Statutory Enforcement"
 *     and slide 3 "bridging human experience and statutory enforcement" — DROPPED.
 *     "We measure. We do not certify, accredit, ENFORCE, endorse" is on the homepage.
 *     A page promising enforcement contradicts the boundary band directly.
 *  3. Deck slide 3 "a decentralized, LEGALLY BINDING translation layer" — DROPPED. We
 *     cannot make anything legally binding. A complaint package is a document.
 *  4. Deck slide 3 state 4 "programmatic bundling into LEGAL STANDING" — CORRECTED.
 *     Standing is conferred by law, not by our bundler. Article 85 of the EU AI Act
 *     gives any natural or legal person the right to lodge a complaint with a market
 *     surveillance authority; what a compiler can do is assemble that complaint well.
 *  5. Deck slide 6 "Private-to-parties channel ESTABLISHES duty/interest privilege" —
 *     DROPPED. Qualified privilege is a defence a court decides on the facts, and it is
 *     jurisdiction-specific. We describe the design intent (do not publish before the
 *     subject has replied) and make no claim about its legal effect.
 *  6. Deck slide 2 "Market Surveillance Authorities cannot initiate Article 99
 *     enforcement on raw internet noise" — SOFTENED to what we can support: an
 *     authority needs evidence it can act on, and an anonymous forum post is not that.
 *     The confident negative about what an MSA can or cannot do is not ours to assert.
 *  7. Every state after intake is labelled DESIGN, because it is. The deck presents
 *     four states as though all four run.
 *  8. RETAINED because they are correct and are the strongest part of the deck: the
 *     three failure modes of open-submission reporting (defamation exposure, no due
 *     process, no evidentiary standing), and the four-state shape itself.
 */

export const LOOP_HERO = {
  kicker: "A published design — one state of it runs",
  title: "A complaint that a regulator can act on is not the same as an angry post",
  lede:
    "Open-submission incident databases fail in three predictable ways: they expose the reporter and the host to defamation, they convict a provider before anyone has checked, and they produce something no authority can actually open a case on. This page sets out the design we think answers all three — and marks plainly which part of it exists today.",
  bg: {
    src: "/images/loop/outcry.png",
    alt: "Three metal pillars under a glass panel showing an unstructured signal trace",
  },
  actions: [
    { href: "/watchdog/report", label: "The public intake", primary: true },
    { href: "/honesty", label: "How we treat our own errors" },
  ],
};

export const LOOP_SLIDES: Slide[] = [
  {
    kicker: "The problem",
    title: "Three ways a public incident database goes wrong",
    body:
      "The first is legal: a database that publishes an allegation about a named company the moment it arrives puts both the reporter and the host in front of a defamation claim, and the reporter usually has the least protection of anyone involved. The second is procedural: naming a provider before anyone has checked convicts them by audience, and it contaminates the neutrality of whoever is meant to measure them afterwards. The third is practical: an authority needs evidence it can open a case on, and an anonymous post is not that.",
    points: [
      { tag: "pain", text: "Defamation exposure lands on the reporter and the host, not the platform that caused it" },
      { tag: "pain", text: "Publishing first destroys the neutrality of the measurement that should follow" },
      { tag: "pain", text: "Raw reports are not in a shape an authority can act on" },
      { tag: "usp", text: "The fix is not more moderation — it is a different pipeline shape" },
    ],
  },
  {
    kicker: "The design",
    title: "Four states, and only the first one runs today",
    body:
      "A report moves through four states. SIGNAL is intake: someone describes behaviour they saw. SHIELDED holds the allegation in escrow so it is not public while it is unverified. CHALLENGED gives the named provider a fixed reply window before anything is published — the subject hears it from us before they read it. ACTIONABLE assembles what survives into a complaint package a market surveillance authority can open. Today, only SIGNAL exists. The other three are design, and we would rather say that than let the diagram imply otherwise.",
    image: {
      src: "/images/loop/four-states.png",
      alt: "Four sealed glass cylinders holding, in turn, a rough sphere, a boxed sphere, a locked cube and a resolved gem",
    },
    points: [
      { tag: "benefit", text: "SIGNAL — the public intake. This runs." },
      { tag: "benefit", text: "SHIELDED — allegation held, not published. Design." },
      { tag: "benefit", text: "CHALLENGED — the provider gets a reply window first. Design." },
      { tag: "benefit", text: "ACTIONABLE — assembled into a complaint package. Design." },
    ],
  },
  {
    kicker: "Why the reply window is the whole point",
    title: "The subject hears it from us before they read it",
    body:
      "Every structural safeguard that keeps an independent body credible while it publishes uncomfortable findings comes back to the same thing: notice before publication, and a real chance to reply. It is the difference between an instrument and a pillory. It is also the difference between a finding an authority can use and one a lawyer can dismantle. We are not claiming this creates any legal protection for us — that is a matter for a court, on the facts, in a jurisdiction. We are saying it is the right way to behave, and that we would rather be slow than be a rumour mill.",
    points: [
      { tag: "usp", text: "Nothing about a named system is published before its provider has been notified" },
      { tag: "benefit", text: "A correction is a new record; the original is never quietly deleted" },
      { tag: "pain", text: "We make no claim about the legal effect of any of this — that is for a court" },
    ],
    href: "/watchdog/report",
    cta: "See the intake",
  },
  {
    kicker: "What comes out",
    title: "Article 85 gives the right. A compiler would make it usable.",
    body:
      "Article 85 of the EU AI Act gives any natural or legal person the right to lodge a complaint with a market surveillance authority. The right already exists; what is missing is that most people cannot assemble a complaint an authority can open — the provision it engages, the system and version, what was observed, when, and what evidence supports it. A compiler that produces that package is a document generator, not a grant of standing, and this page does not pretend otherwise.",
    points: [
      { tag: "benefit", text: "The right to complain is statutory and already exists" },
      { tag: "pain", text: "A compiler assembles a document; it confers nothing" },
      { tag: "usp", text: "Measurement stays separate: we produce evidence, an authority decides" },
    ],
  },
];

export const LOOP_NOT_CLAIMED = [
  "We do not claim this loop is built. State one — the public intake — exists. Escrow, the reply window and the complaint compiler do not: searching this repository for escrow, right-of-reply, 72-hour and Article 85 returns no implementation.",
  "We do not enforce anything, and we are not a route to enforcement. We measure and publish; a market surveillance authority decides what to do. The boundary is on our homepage and this page does not move it.",
  "We do not make anything legally binding, and we do not confer legal standing. Article 85 confers the right to complain; a compiler would only assemble the document.",
  "We do not claim that holding an allegation in escrow creates qualified privilege or any other legal protection. That is decided by a court, on the facts, and differs by jurisdiction. We describe the behaviour, not its legal effect.",
  "We do not assert what a market surveillance authority can or cannot act on. We say only that an anonymous report is not usually in a shape that supports a case.",
  "We do not publish a public incident register today. The register at /watchdog/report is deliberately empty, because an empty register is honest and a populated illustrative one is not.",
  "We do not describe this as trustless. Nothing here removes the need to trust someone; it makes what we did checkable, which is a smaller and more defensible claim.",
];

export const LOOP_RELATED = [
  { href: "/watchdog/report", label: "The public intake", what: "Where a report starts — state one, the part that runs." },
  { href: "/honesty", label: "The honesty gate", what: "How we treat findings against ourselves." },
  { href: "/statute-to-predicate", label: "From statute to predicate", what: "How a provision becomes a test a stranger can run." },
  { href: "/firewall-charter", label: "The firewall charter", what: "We measure and sign; we never operate the fix." },
];
