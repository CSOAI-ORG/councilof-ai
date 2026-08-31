/**
 * THE ANCHORING CLAIM — one sentence, used everywhere the topic appears.
 *
 * Why this file exists.
 * The site previously carried two statements that were each true of a different
 * thing but read as a contradiction when a visitor met both:
 *   (a) "nothing is anchored to a blockchain … OpenTimestamps anchoring is on the
 *       roadmap, not yet wired"  — true of the CARD TRUST PATH, and
 *   (b) /xrpl-attest — once a DEVNET capability proof; living feed is now a
 *       reader of GET /root.json (unsigned leaves, NO_LAPTOP_SIGN). GET /api/xrpl
 *       is a reader of that root (writes_board false). Historical DEVNET hashes
 *       are not this feed.
 * An Ed25519 signature is not a blockchain timestamp anchor. Both statements stand,
 * but only if the distinction is stated in the same breath. So it always is: every
 * surface that touches the topic renders ANCHORING_CLAIM, and nothing paraphrases it.
 *
 * Rule for future edits: change the sentence HERE or not at all. If a surface needs
 * different words, that surface is making a different claim and needs its own evidence.
 */

/** The canonical, load-bearing sentence. Do not paraphrase at call sites. */
export const ANCHORING_CLAIM =
  "A card's trust path is an Ed25519 signature over a SHA-256 hash chain, verifiable " +
  "offline against did:web:csoai.org — no blockchain and no timestamp authority sits in " +
  "that path. The /xrpl-attest page is a reader of GET /root.json (unsigned leaves, " +
  "NO_LAPTOP_SIGN). GET /api/xrpl is a reader of that root (writes_board false, live " +
  "locked 16, same merkle). Historical DEVNET Payment-memo / CredentialCreate hashes " +
  "are not this feed. XLS-70 Credentials are live on XRPL mainnet as an allowlist " +
  "primitive; we are not issuing GSPC grades on-ledger.";

/** Short badge form for nav entries and link descriptions that mention the ledger. */
export const XRPL_STATUS_LABEL = "public-root reader — not a grade";

/**
 * Plain-language disambiguation for the term "Layer 0".
 *
 * "Layer 0" has a hard, established meaning in blockchain (a Polkadot/Cosmos-style
 * interoperability substrate beneath L1s). We use it as a metaphor for the verification
 * floor beneath governed AI. Because we also publish XRP Ledger work, a reader could
 * reasonably infer a protocol claim we cannot substantiate. So wherever the term is
 * introduced to a reader, this disambiguation is shown with it.
 */
export const LAYER0_DISAMBIGUATION =
  "\u201cLayer 0\u201d here means our foundational verification layer — identity, signing " +
  "and attestation beneath governed AI. It is not a blockchain Layer-0 protocol, and it is " +
  "not an interoperability substrate for blockchains.";
