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

/**
 * Is the extension EMITTED by the door, or PUBLISHED as a draft we authored?
 * Read from the door's source, not assumed: an extension is emitted only if the handler actually
 * attaches it to a response.
 */
function stateOf(slug) {
  const emits = new RegExp(`(receipt|${slug})\\s*[:=][^\\n]*attach|attachReceipt|signedReceipt`, "i").test(a2a);
  return emits ? "EMITTED" : "PUBLISHED-NOT-EMITTED";
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
      "Free door amount 0 at /api/free-door. Verification stays free. payTo is merchant not payer. "
      + "Self-settle is not revenue. Settlement is PROVEN on Base mainnet — settled receipts are "
      + "published at /feeds/receipts.xml, each carrying its transaction. Measurement credential, "
      + "never a grade.",
  },
];

const published = existsSync(EXT_DIR) ? readdirSync(EXT_DIR) : [];
const out = EXTENSIONS.map((e) => {
  const state = e.slug === "signed-receipts" ? stateOf(e.slug) : "EMITTED";
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
