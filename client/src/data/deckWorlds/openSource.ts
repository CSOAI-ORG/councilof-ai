import type { Slide } from "@/components/scrollworld";

/**
 * THE CSOAI OPEN-SOURCE FRAMEWORK — owner deck, fact-checked into /open-source.
 *
 * CORRECTIONS APPLIED TO THE SOURCE DECK:
 *  1. Deck slide 11 "Generations are natively compliant at the exact millisecond of
 *     creation" — FLATLY CONTRADICTED BY OUR OWN MEASUREMENT. provbench (public/packs/
 *     eu-article-50/provbench.body) measured 0 of 20 marked assets surviving ordinary
 *     transforms (0 of 180 measured cells), and records that our signing certificate
 *     chains to a PRIVATE ROOT CA that is not on the C2PA trust list, so
 *     issuer_resolvable is 0% by construction. Rewritten to say what we measured.
 *  2. Every adoption counter — "2.6k+ stars", "22,000+ GitHub stars", "150+ production
 *     orgs", "A2A v1.0 adopted April 9, 2026", "SEP-1865", "~11KB footprint", "July 2026
 *     MCP specification update" — DROPPED. None is evidenced by a file or endpoint here,
 *     and an unverifiable counter does not ship.
 *  3. Deck slide 6 "Active contributor to the DIF Creator Assertions Working Group" —
 *     no membership record in this repo. Rewritten to what is checkable: we publish
 *     tooling, test vectors and a resolvable did:web, and we do not claim a seat.
 *  4. Deck slide 9's example manifest ("Ed25518Signature2018", invented DIDs and UUIDs)
 *     — NOT REPRODUCED. A fabricated example manifest on a provenance page is exactly
 *     the failure mode this page exists to argue against. The structure is described
 *     instead, and the reader is pointed at the real signed artefacts.
 *  5. Deck slide 5's hardware specifics ("12-around-1", 12 LoRA adapters, Qwen3-4B) —
 *     kept only as DESIGN, explicitly labelled, with no throughput or capacity claim.
 *  6. "Ed25519 ... post-quantum" framing elsewhere in the estate — ML-DSA-65 (FIPS-204)
 *     is BUILT, NOT SHIPPED (client/src/data/chain.ts). Said plainly.
 */

export const OPEN_SOURCE_HERO = {
  kicker: "The open-source framework",
  title: "We invent no protocols. We assemble the ones that already work — in the open.",
  lede:
    "Every layer of the measurement rail is an existing, permissively licensed standard wired together and published: model-context tooling, agent-to-agent messaging, decentralised identity, and content provenance. You can read the parts, swap them, or rebuild the whole thing without us.",
  bg: {
    src: "/images/coliseum_swarm_clash.jpg",
    alt: "Many small components wired together into one working assembly",
  },
  actions: [
    { href: "/trust-center", label: "See what we are built on", primary: true },
    { href: "/methodology", label: "Read the method" },
  ],
};

export const OPEN_SOURCE_SLIDES: Slide[] = [
  {
    kicker: "The principle",
    title: "Nothing here is a protocol we made up",
    body:
      "A measurement rail that depends on a private format is not a rail — it is a lock-in with a nice diagram. So every layer is an existing open standard under a permissive licence, assembled rather than invented. If we disappear tomorrow, the pieces keep working and someone else can run the same instrument.",
    points: [
      { tag: "pain", text: "Assurance tooling that only works while you keep paying the vendor" },
      { tag: "pain", text: "Bespoke formats nobody else can read, verify or fork" },
      { tag: "benefit", text: "Open standards end to end — no proprietary wire format anywhere" },
      { tag: "usp", text: "Every dependency is named with its licence, in public" },
    ],
    href: "/trust-center",
    cta: "Read the dependency list",
    video: { src: "/videos/csoai-architecture.mp4", poster: "/videos/csoai-architecture.jpg", title: "How Council of AI is built — the architecture" },
  },
  {
    kicker: "The spine",
    title: "One gateway in front of many tools",
    body:
      "Measurement needs to reach a lot of small, boring capabilities: fetch a provision, hash a corpus, run a grader, check a signature. Rather than one monolith, those sit behind a single aggregating gateway that routes into protected namespaces and holds downstream credentials so the agent layer never sees them. It is deliberately unglamorous infrastructure.",
    points: [
      { tag: "pain", text: "Every integration means another key pasted into another agent" },
      { tag: "benefit", text: "One endpoint in front of many tools, with namespace isolation" },
      { tag: "benefit", text: "Downstream credentials are held at the gateway, not handed to models" },
      { tag: "usp", text: "Stateless by design, so scaling never depends on sticky sessions" },
    ],
    bg: {
      src: "/images/secure_evidence_vault.jpg",
      alt: "A vault of signed artefacts behind a single guarded gateway",
    },
  },
  {
    kicker: "Two directions, two protocols",
    title: "Vertical for tools, horizontal for agents",
    body:
      "The two protocol families do different jobs and it is worth not blurring them. The model-context layer runs vertically — one agent reaching down into typed tools. The agent-to-agent layer runs horizontally — separate services finding each other and delegating, each identified by a signed agent card served from a well-known URL. Mixing them up is how architectures rot.",
    points: [
      { tag: "pain", text: "\"Agent platforms\" that fuse tool-calling and federation into one bespoke blob" },
      { tag: "benefit", text: "Tool invocation and agent federation stay separable and replaceable" },
      { tag: "benefit", text: "Identity is a signed card at a published address, not a shared secret" },
      { tag: "usp", text: "Both layers are public standards — your agents can talk to ours without a contract" },
    ],
  },
  {
    kicker: "The cryptographic root",
    title: "The key comes from the domain, not from us",
    body:
      "Everything downstream hangs on one resolvable anchor: the DID document published at csoai.org, which carries the Ed25519 public keys used to sign boards and cards. You fetch it from the domain itself — there is no key exchange, no account, and nothing to ask us for. And the separation matters as much as the key: identity assertions are kept out of the measurement engine, so who you are can never move what the instrument says.",
    points: [
      { tag: "pain", text: "Verification that requires an account with the party being verified" },
      { tag: "benefit", text: "Public keys resolvable straight from the domain" },
      { tag: "benefit", text: "Identity and measurement stay strictly separated" },
      { tag: "usp", text: "We sign the measurement — we never sign a certification, because we issue none" },
    ],
    href: "/gspc-verify",
    cta: "Resolve the key yourself",
    bg: {
      src: "/images/verifiable_evidence_card.jpg",
      alt: "Hands holding a signed evidence card reading verified: true",
    },
  },
  {
    kicker: "Signing at the edge",
    title: "The private key never travels",
    body:
      "The obvious way to build this is also the wrong one: ship telemetry to a central service and let it sign. That puts a key on the wire and a single point of compromise in the middle. Instead the signing runs client-side in a worker thread, and only finished, verifiable envelopes cross the network. A small, boring command-line kernel does the same job locally.",
    points: [
      { tag: "pain", text: "Central signing services concentrate every key into one target" },
      { tag: "benefit", text: "Signatures are produced where the data is, not where the vendor is" },
      { tag: "benefit", text: "Only verifiable envelopes cross the network" },
      { tag: "usp", text: "Signing today is Ed25519; the ML-DSA-65 (FIPS-204) signer is built but not shipped, and we will say so until it is" },
    ],
  },
  {
    kicker: "Content provenance",
    title: "Marking generated content — and what we measured about it",
    body:
      "Article 50(2) of the EU AI Act requires machine-readable marking of synthetic content, and the C2PA manifest is the standard way to do it: a signed, hashed JSON-LD record of who made a thing, with what, and from which ingredients. Then we measured whether marking survives contact with the real world. It largely did not: across our published provenance bench, none of the marked assets kept a verifiable manifest through ordinary compression and re-encoding. We published that result rather than the diagram.",
    points: [
      { tag: "pain", text: "Metadata manifests are routinely stripped by compression, re-encoding and social transit" },
      { tag: "pain", text: "A marking pipeline can be correct at creation and worthless three hops later" },
      { tag: "benefit", text: "A measured survival rate instead of a compliance promise" },
      { tag: "usp", text: "We published our own marking failing, including that our test certificate is not on the C2PA trust list" },
    ],
    href: "/evidence",
    cta: "Read the provenance bench",
    bg: {
      src: "/images/liveness_drift_engine.jpg",
      alt: "An asset passing through compression and re-encoding stages, its marking degrading",
    },
  },
  {
    kicker: "Soft binding",
    title: "If the manifest is stripped, the asset should still be findable",
    body:
      "The answer the standards community is converging on is a durable payload carried in the content itself, so a stripped file can still be matched back to its signed manifest. That is the right direction and we contribute tooling and test vectors to it. It is not, today, a solved problem — and a page that told you it was would be doing the thing this whole site exists to stop.",
    points: [
      { tag: "pain", text: "A stripped file is an orphan: no manifest, no provenance, no recourse" },
      { tag: "benefit", text: "Durable payloads that can survive the transforms metadata does not" },
      { tag: "usp", text: "We contribute running code and test vectors, and we publish where it still fails" },
    ],
    image: {
      src: "/images/literacy_training_arena.jpg",
      alt: "Content moving through transformation stages while its provenance mark is tested",
    },
  },
  {
    kicker: "The whole path",
    title: "Input, compute, identity, output — all four in the open",
    body:
      "A request comes in over an open event wire. It is routed into the agent ring for the actual work. The action is signed client-side against the key published at csoai.org. The result leaves wrapped in a provenance manifest. Four steps, four public standards, no proprietary link in the chain — and a measured account of which links are strong and which are not yet.",
    points: [
      { tag: "benefit", text: "Every stage is an open standard you can inspect or replace" },
      { tag: "benefit", text: "The ring topology is published as design, with no capacity claim attached" },
      { tag: "usp", text: "Where a link is weak we publish the measurement, not the roadmap slide" },
    ],
    href: "/methodology",
    cta: "Read the method",
  },
];

export const OPEN_SOURCE_NOT_CLAIMED = [
  "We do not claim generated content is \"natively compliant at the millisecond of creation\". Our own provenance bench measured 0 of 20 marked assets surviving ordinary transforms (0 of 180 measured cells), and our test certificate chains to a private root that is not on the C2PA trust list — so issuer resolution is 0% there by construction.",
  "We do not claim membership of, or a seat on, any standards working group. We publish tooling, test vectors and a resolvable did:web; anything beyond that would need a record we do not have.",
  "We do not publish adoption counters for the components we build on — star counts, org counts, adoption dates. Those numbers are not ours to evidence, so they are not on this page.",
  "We do not claim post-quantum signing. Signing is Ed25519 today; the ML-DSA-65 (FIPS-204) signer is built but not shipped, and the label will change only in the commit that ships it.",
  "We do not reproduce an example manifest with invented identifiers. If you want to see a real one, verify a real card.",
];

export const OPEN_SOURCE_RELATED = [
  { href: "/trust-center", label: "What we are built on", what: "Every dependency, named, with its licence." },
  { href: "/gspc-verify", label: "Verify a card", what: "Resolve the key from the domain and check a signature yourself." },
  { href: "/evidence", label: "The evidence hub", what: "Where the provenance bench and the collected evidence live." },
  { href: "/methodology", label: "The method", what: "Deterministic predicates, n≥30, and what we refuse to score." },
];
