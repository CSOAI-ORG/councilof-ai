/**
 * THE ANCHORING CLAIM — one sentence, used everywhere the topic appears.
 *
 * Why this file exists.
 * The site previously carried two statements that were each true of a different
 * thing but read as a contradiction when a visitor met both:
 *   (a) "nothing is anchored to a blockchain … OpenTimestamps anchoring is on the
 *       roadmap, not yet wired"  — true of the CARD TRUST PATH, and
 *   (b) /xrpl-attest, which demonstrably attaches signed evidence to the XRP Ledger
 *       — true of a SEPARATE devnet capability proof.
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
  "that path; our XRP Ledger work is a separate, devnet-proven demonstration of attaching " +
  "that same signed evidence on-ledger, and mainnet is planned, not live.";

/** Short badge form for nav entries and link descriptions that mention the ledger. */
export const XRPL_STATUS_LABEL = "devnet-proven; mainnet planned";

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
  "“Layer 0” here means our foundational verification layer — identity, signing " +
  "and attestation beneath governed AI. It is not a blockchain Layer-0 protocol, and it is " +
  "not an interoperability substrate for blockchains.";
