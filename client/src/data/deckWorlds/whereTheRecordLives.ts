import type { Slide } from "@/components/scrollworld";

/**
 * WHERE THE RECORD LIVES — owner deck ("The Indestructible Record"),
 * fact-checked into the scroll-world at /where-the-record-lives.
 *
 * WHAT THIS PAGE IS: an honest account of redundancy. Our published record sits on
 * hosts we do not control, so no single removal — including one by us — erases it.
 * That is a real and useful property. It is not indestructibility, and this page is
 * careful about the difference.
 *
 * EVERY MIRROR ON THIS PAGE WAS CHECKED LIVE (HTTP 200) BEFORE PUBLICATION:
 *   doi.org/10.5281/zenodo.21991104 · huggingface.co/csoai · pypi.org/project/csoai
 *   pypi.org/project/inspect-signed-receipt · github.com/CSOAI-ORG/councilof-ai
 *   wikidata.org/wiki/Q141128616 · councilof.ai/.well-known/did.json
 *
 * CORRECTIONS APPLIED TO THE SOURCE DECK:
 *  1. Deck title "The Indestructible Record" — DROPPED. Nothing we publish is
 *     indestructible. Copies on independent hosts are harder to remove than one copy,
 *     which is the actual, smaller claim, and it is the one this page makes.
 *  2. Deck subtitle "Censorship-Resistant Distribution & Verification Architecture"
 *     and slide 4 "three architectural pillars ensuring COMPLETE censorship
 *     resistance" — DROPPED. This is the same claim family as the
 *     durability claim already retracted in DR-0007, where the measured effective independence
 *     was 1.21 against three nominal legs. We do not get to re-make it with different
 *     nouns. Redundancy is described; resistance is not asserted.
 *  3. Deck slide 4 "SWHID & DOI: The Immutable Anchor" — SWHID DROPPED ENTIRELY. There
 *     is no Software Heritage identifier anywhere in this codebase; searching for it
 *     returns nothing. A pillar that does not exist is not a pillar. "Immutable" is
 *     also dropped: a Zenodo DOI is an external archival anchor we do not control,
 *     which is the useful property, and it is not the same word.
 *  4. RETAINED because both are real and both were verified: multi-host publication
 *     (the mirrors listed above, each returning 200), and browser-side verification
 *     with no server call, which an outside auditor exercised and confirmed runs.
 */

export const RECORD_HERO = {
  kicker: "Redundancy, stated exactly",
  title: "If this site disappeared tomorrow, the record would not",
  lede:
    "A measurement is only worth something if it outlives the organisation that made it — including the case where that organisation is the problem. Our published record is mirrored on hosts we do not control, so no single takedown removes it. This page says precisely what that does and does not buy you.",
  bg: {
    src: "/images/record/loop-hero.png",
    alt: "A grey sphere and a green crystalline solid resting apart on a pale surface, joined by a thin line",
  },
  actions: [
    { href: "/gspc-verify", label: "Verify a card yourself", primary: true },
    { href: "https://doi.org/10.5281/zenodo.21991104", label: "The archived board (DOI)" },
  ],
};

export const RECORD_SLIDES: Slide[] = [
  {
    kicker: "The failure this guards against",
    title: "One host, one takedown, no record",
    body:
      "Most assurance evidence lives in exactly one place: the assessor's portal. That is convenient right up until the assessor changes the file, loses it, goes out of business, or has a reason to want the finding gone. If the only copy of a result is held by the party the result is about — or by the party that produced it — then the result is a courtesy, not evidence. The fix is not to promise better behaviour. It is to put copies where nobody, us included, can quietly reach them.",
    points: [
      { tag: "pain", text: "Evidence held in one portal can be edited or withdrawn without trace" },
      { tag: "pain", text: "\"Trust our archive\" is the claim least worth trusting" },
      { tag: "benefit", text: "Copies on independent hosts remove the single point of removal" },
      { tag: "usp", text: "Including removal by us — that is the point, not a side effect" },
    ],
  },
  {
    kicker: "How it actually works",
    title: "Publish widely, verify locally, anchor externally",
    body:
      "Three mechanisms, all of them ordinary and all of them checkable. We publish the same signed artefacts to several independent hosts. Verification runs in your browser against the trust root, with no call to us — so checking a card does not depend on our servers being up or our goodwill lasting. And the board is deposited with an external archive that issues a permanent identifier we do not administer. None of that is exotic. It is just refusing to be the only copy.",
    image: {
      src: "/images/record/tripartite.png",
      alt: "A branching white structure holding a green faceted stone at its centre, labelled as the signed result",
    },
    points: [
      { tag: "benefit", text: "Published to Hugging Face, PyPI, GitHub and Zenodo — each checked live" },
      { tag: "benefit", text: "Verification is client-side: no account, no server call, no permission" },
      { tag: "benefit", text: "DOI 10.5281/zenodo.21991104 — an archival identifier we do not control" },
      { tag: "usp", text: "Wikidata Q141128616 and Companies House 16939677 for the entity itself" },
    ],
  },
  {
    kicker: "The honest limit",
    title: "This is redundancy. It is not indestructibility.",
    body:
      "Copies on several hosts are harder to remove than one copy. That is the whole claim, and it is worth having. It is not the same as being censorship-proof: every host here has terms, a jurisdiction and an off switch, and a determined actor with legal reach could pressure several of them. We have made that mistake in public before — we published a claim that three nominally independent legs would survive each other's failure, measured the effective independence at 1.21 against those three legs, and withdrew it in DR-0007. We are not going to re-make it with different nouns.",
    points: [
      { tag: "pain", text: "Every mirror has terms, a jurisdiction, and an off switch" },
      { tag: "pain", text: "Independent hosts are not independent failure modes — we measured that once and were wrong" },
      { tag: "benefit", text: "What survives is a real, small, checkable property: no single takedown" },
      { tag: "usp", text: "The retraction is published, not buried — see the corrections ledger" },
    ],
    href: "/honesty",
    cta: "Read what we got wrong",
  },
];

export const RECORD_NOT_CLAIMED = [
  "We do not claim the record is indestructible. It is mirrored. Those are different words and the difference matters.",
  "We do not claim censorship resistance. Every host we publish to has terms of service, a jurisdiction and the ability to remove content, and an actor with enough legal reach could pressure more than one of them.",
  "We do not claim independent hosts give independent failure modes. We published a claim of exactly that shape once, measured the effective independence at 1.21 against three nominal legs, and withdrew it in DR-0007. That retraction stands and this page is bound by it.",
  "We do not have a Software Heritage identifier. The source deck listed SWHID as one of three pillars; there is no SWHID anywhere in this codebase, so it is not on this page.",
  "We do not describe the DOI as immutable. It is an archival identifier administered by someone else, which is the useful property — not permanence we can promise on their behalf.",
  "We do not claim the mirrors are complete or continuously monitored. Each link on this page returned HTTP 200 when the page was written; that is a check, not a guarantee, and there is no uptime claim attached to it.",
];

export const RECORD_RELATED = [
  { href: "/gspc-verify", label: "Verify a card", what: "Client-side verification — no account, no server call." },
  { href: "/honesty", label: "The honesty gate", what: "Our own errors, including the claim withdrawn in DR-0007." },
  { href: "/statute-to-predicate", label: "From statute to predicate", what: "What is inside the record before it is signed." },
  { href: "/trust-center", label: "Trust center", what: "The real hosting posture, without borrowed multi-region claims." },
];
