#!/usr/bin/env node
/**
 * Producer for the A2A card's capabilities.extensions block.
 *
 * WHY (2026-09-06). The card advertised signed-receipts/v1 with a description reading
 * "Ed25519-signed task-outcome receipts plus a did:web key-trust convention" — which a reader takes
 * as "this agent attaches signed receipts". It does not. functions/api/a2a.ts says so in its own
 * header: "Not signed-receipts/v1: no receipt is attached until a server-side key exists to sign
 * one, and the card does not declare that extension until it is actually emitted." The code stated
 * the invariant; the card broke it. Probed live: POST /api/a2a returns a message with parts and no
 * receipt of any kind.
 *
 * Declaring an extension is not dishonest — required:false means "we know this extension", and we
 * authored the draft. Describing it as though it is emitted IS. So each entry now carries its STATE
 * in the first clause, and this script is what writes it, from what is true rather than what was
 * typed once.
 *
 *   node scripts/agent-card-extensions.mjs [--dry]
 * Then regenerate the signing input: python3 scripts/adapters/agent_card_jws.py
 */
import { readFileSync, writeFileSync, existsSync, readdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const CARD = resolve(ROOT, "public/.well-known/agent-card.json");
const ALIAS = resolve(ROOT, "public/.well-known/agent.json");
const A2A_SRC = resolve(ROOT, "functions/api/a2a.ts");
const EXT_DIR = resolve(ROOT, "public/a2a/extensions");
const DRY = process.argv.includes("--dry");

const a2a = existsSync(A2A_SRC) ? readFileSync(A2A_SRC, "utf8") : "";
const X402_SRC = new URL("../functions/api/_x402.ts", import.meta.url).pathname;
const x402 = existsSync(X402_SRC) ? readFileSync(X402_SRC, "utf8") : "";

/**
 * Is the extension EMITTED by the door, or PUBLISHED as a draft we authored?
 * Read from the door's source, not assumed: an extension is emitted only if the handler actually
 * attaches it to a response.
 */
function stateOf(slug) {
  const emits = new RegExp(`(receipt|${slug})\\s*[:=][^\\n]*attach|attachReceipt|signedReceipt`, "i").test(a2a);
  return emits ? "EMITTED" : "PUBLISHED-NOT-EMITTED";
}

/**
 * TWO DIFFERENT RECEIPTS, ON TWO DIFFERENT RAILS, and conflating them would put a false
 * capability on the card:
 *
 *   signed-receipts/v1   an A2A TASK-OUTCOME receipt attached to a message response. a2a.ts
 *                        attaches none, and stateOf() reads that from its source.
 *   offer-and-receipt    an x402 SETTLEMENT receipt on the HTTP 402 doors. Landed in #1663.
 *
 * The second was about to be typed EMITTED, because everything that is not signed-receipts took
 * that branch unconditionally. A state nobody derives is a state nobody can falsify, which is the
 * defect this whole function exists to prevent — so it is read from the settlement path's source
 * the same way. _x402.ts must actually import the signer and the extension emitter.
 */
function x402ReceiptState() {
  const imports = /import\s*\{[^}]*\bsignReceipt\b[^}]*\}\s*from\s*"\.\/_x402_receipt"/.test(x402);
  const emits = /receiptExtension\s*\(/.test(x402);
  return imports && emits ? "EMITTED" : "PUBLISHED-NOT-EMITTED";
}

const EXTENSIONS = [
  {
    slug: "signed-receipts",
    uri: "https://councilof.ai/a2a/extensions/signed-receipts/v1/",
    required: false,
    lead: (state) =>
      state === "EMITTED"
        ? "Ed25519-signed task-outcome receipts, attached to responses from this agent."
        : "A DRAFT WE PUBLISH AND DO NOT YET EMIT: this agent attaches no receipt to a response today. "
        + "Declared because we author the specification, not because the door implements it.",
    tail:
      "Ed25519-signed task-outcome receipts plus a did:web key-trust convention for AgentCard signing "
      + "(A2A v1.0 §8.4). A receipt is evidence of what was claimed, not a certification, and a "
      + "signature over it is an integrity claim rather than a truth claim.",
  },
  {
    slug: "x402",
    uri: "https://councilof.ai/.well-known/x402.json",
    required: false,
    lead: () => "x402 discovery index for the agent pay rail (also GET /api/x402).",
    tail:
      // /feeds/receipts.xml was named here while it existed only on an unmerged branch. An agent
      // card is read by strangers, and a URL on it that 404s is a worse claim than a missing one:
      // it is the deployed-vs-written gap, published. What IS checkable is the chain — the
      // settlements are on Base with transaction hashes, and anyone can verify those without us.
      "Free door amount 0 at /api/free-door. Verification stays free. payTo is merchant not payer. "
      + "Self-settle is not revenue. Settlement is PROVEN on Base mainnet: transaction hashes are "
      + "published in docs/product/SETTLED-DOORS and verifiable on chain by anyone, independently "
      + "of this server. Measurement credential, never a grade.",
  },
  {
    // ADDED TO THE PRODUCER, 2026-09-06, because it was added to the ARTEFACT by #1663 and this
    // script rewrites capabilities.extensions WHOLESALE. The next regeneration would have deleted
    // a landed extension declaration with nothing reporting it — the artefact-and-producer rule
    // biting in the direction that removes work rather than the one that duplicates it.
    //
    // Text is #1663's own, unchanged: it was reviewed and merged, and it is careful about exactly
    // the thing that matters — a receipt proves this server signed those bytes, never that money
    // moved.
    slug: "offer-and-receipt",
    uri: "https://github.com/x402-foundation/x402/blob/69652a69798f0b08f95bef33318896e36e210f7e/specs/extensions/extension-offer-and-receipt.md",
    required: false,
    lead: (state) =>
      state === "EMITTED"
        ? "x402 Offer & Receipt extension (v0.6), JWS profile."
        : "x402 Offer & Receipt extension (v0.6), JWS profile — PUBLISHED, NOT EMITTED: the"
          + " settlement path does not currently sign, so treat the paragraph below as the"
          + " intended shape rather than what this server does today.",
    tail:
      "Every HTTP 402 this agent's doors emit carries a server-signed offer committing to the "
      + "terms in each accepts[] entry; every settled response carries a signed receipt. Format "
      + "jws, alg EdDSA, kid did:web:csoai.org#board-attestation-1, resolvable at "
      + "https://csoai.org/.well-known/did.json (an authorization mechanism the extension names "
      + "in section 4.5.1). eip712 is NOT emitted: the edge holds one Ed25519 key and no secp256k1 "
      + "signer, and a format we cannot produce is better declared missing than faked. A receipt "
      + "proves this server signed those bytes; it is not by itself proof that money moved, and "
      + "the transaction field, when present, is a claim to check against the chain.",
  },
];

const published = existsSync(EXT_DIR) ? readdirSync(EXT_DIR) : [];
const out = EXTENSIONS.map((e) => {
  const state = e.slug === "signed-receipts" ? stateOf(e.slug)
    : e.slug === "offer-and-receipt" ? x402ReceiptState()
    : "EMITTED";
  return { uri: e.uri, required: e.required, description: `${e.lead(state)} ${e.tail}`.replace(/\s+/g, " ").trim() };
});

const card = JSON.parse(readFileSync(CARD, "utf8"));
const before = JSON.stringify(card.capabilities.extensions);
card.capabilities.extensions = out;
const after = JSON.stringify(out);

console.log(`  extensions: ${out.length}   published dirs: ${published.join(", ") || "none"}`);
for (const e of out) console.log(`    ${e.uri}\n      ${e.description.slice(0, 96)}…`);
if (before === after) { console.log("  unchanged"); process.exit(0); }
if (DRY) { console.log("  --dry: nothing written"); process.exit(0); }
const blob = JSON.stringify(card, null, 2) + "\n";
writeFileSync(CARD, blob);
// the alias must serve the SAME BYTES; a card that differs by path is two cards
writeFileSync(ALIAS, blob);
console.log("  wrote agent-card.json and agent.json (same bytes)");
console.log("  NEXT: python3 scripts/adapters/agent_card_jws.py   # the signing input describes the card that is served");
