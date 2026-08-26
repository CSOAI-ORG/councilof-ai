#!/usr/bin/env node
/**
 * gspc-verify — offline verifier for GSPC measurement cards.
 *
 * This command NEVER opens a network connection. Everything it needs is a file you already
 * have: the cards, the index, the profile carrying the pinned key. Fetch those once, however
 * you like; verification afterwards works on a plane, in an air-gapped room, or in five years
 * when councilof.ai no longer resolves. Evidence that needs a live service to be checkable is
 * not evidence — the service could withdraw it.
 *
 * EXIT CODES (a positive result is never returned on a path that did not complete)
 *   0  every card VALID, and the set is self-consistent and complete
 *   1  at least one card INVALID
 *   2  at least one card UNCHECKABLE, or the command could not run
 *   3  every card VALID, but the SET is incomplete or disagrees with its index
 */

import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, extname } from "node:path";
import { verifyCard, analyseSet, analyseChain } from "../src/verify.mjs";
import { pubkeyFromDidDocument } from "../src/did.mjs";
import { defaultProfile } from "../src/index.mjs";

const USAGE = `gspc-verify — verify GSPC measurement cards offline

  gspc-verify <card.json | directory> ...

Options
  --index <file>          also check the card index against the cards you hold
  --chain <file>          walk a published chain manifest and report exactly what it
                          attests: which positions are signed for, and which are only
                          asserted in an unsigned file
  --profile <file>        verification profile to use (default: the bundled CSOAI profile)
  --pubkey <hex>          pin this raw Ed25519 public key instead of the profile's
  --did-document <file>   pin the key found in a LOCAL DID document
  --key-id <id>           which verificationMethod to take (default: #card-attestation-1)
  --json                  machine-readable results on stdout
  --quiet                 print only the summary line
  -h, --help              this text

Exit: 0 all valid and complete · 1 any INVALID · 2 any UNCHECKABLE or usage error
      3 all cards valid but the set is incomplete
`;

function die(msg) {
  process.stderr.write(`gspc-verify: ${msg}\n`);
  process.exit(2);
}

function parseArgs(argv) {
  const o = { paths: [], json: false, quiet: false, keyId: "#card-attestation-1" };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    const need = () => argv[++i] ?? die(`${a} needs a value`);
    if (a === "-h" || a === "--help") { process.stdout.write(USAGE); process.exit(0); }
    else if (a === "--json") o.json = true;
    else if (a === "--quiet") o.quiet = true;
    else if (a === "--index") o.index = need();
    else if (a === "--chain") o.chain = need();
    else if (a === "--profile") o.profile = need();
    else if (a === "--pubkey") o.pubkey = need();
    else if (a === "--did-document") o.did = need();
    else if (a === "--key-id") o.keyId = need();
    else if (a.startsWith("-")) die(`unknown option ${a}`);
    else o.paths.push(a);
  }
  return o;
}

function collect(paths) {
  const files = [];
  for (const p of paths) {
    let st;
    try { st = statSync(p); } catch { die(`cannot read ${p}`); }
    if (st.isDirectory()) {
      // Braces are load-bearing: without them the `else` binds to the inner `if` and every
      // single-file invocation silently collects nothing. That bug shipped once and was
      // caught only because a test asserted the exit code AND the reason for it.
      for (const f of readdirSync(p).sort())
        if (extname(f) === ".json") files.push(join(p, f));
    } else {
      files.push(p);
    }
  }
  return files;
}

const opts = parseArgs(process.argv.slice(2));
if (!opts.paths.length) { process.stderr.write(USAGE); process.exit(2); }

let profile;
try {
  profile = opts.profile ? JSON.parse(readFileSync(opts.profile, "utf8")) : defaultProfile();
} catch (e) { die(`cannot load profile: ${e.message}`); }

if (opts.did) {
  try {
    profile.pinnedPubkeyHex = pubkeyFromDidDocument(JSON.parse(readFileSync(opts.did, "utf8")), opts.keyId);
    profile.pinnedKeyId = opts.keyId;
  } catch (e) { die(`cannot take a key from ${opts.did}: ${e.message}`); }
}
if (opts.pubkey) {
  if (!/^[0-9a-f]{64}$/.test(opts.pubkey)) die("--pubkey must be 64 lowercase hex characters");
  profile.pinnedPubkeyHex = opts.pubkey;
  profile.pinnedKeyId = "(supplied on the command line)";
}

const files = collect(opts.paths);
if (!files.length) die("no .json files found in the given paths");

const results = [];
const cards = [];
for (const f of files) {
  let card;
  try {
    card = JSON.parse(readFileSync(f, "utf8"));
  } catch (e) {
    // Unparseable input is UNCHECKABLE. It is not a forgery claim: we never got far enough.
    results.push({ file: f, state: "UNCHECKABLE", code: "UNREADABLE", reason: `not parseable JSON: ${e.message}` });
    continue;
  }
  const r = await verifyCard(card, profile);
  if (r.state === "VALID") cards.push(card);
  results.push({ file: f, ...r });
}

let chain = null;
if (opts.chain) {
  try { chain = JSON.parse(readFileSync(opts.chain, "utf8")); } catch (e) { die(`cannot read chain manifest: ${e.message}`); }
}

let set = null;
if (opts.index) {
  let index;
  try { index = JSON.parse(readFileSync(opts.index, "utf8")); } catch (e) { die(`cannot read index: ${e.message}`); }
  set = analyseSet(cards, index, profile, chain);
} else if (files.length > 1 || chain) {
  set = analyseSet(cards, null, profile, chain);
}

const chainReport = chain ? analyseChain(cards, chain, profile) : null;

const tally = { VALID: 0, INVALID: 0, UNCHECKABLE: 0 };
for (const r of results) tally[r.state]++;

// Some findings describe the evidence; others describe only the copy you happen to hold.
// Holding a subset is not a defect in what was published, so it does not change the exit code.
const INFORMATIONAL = new Set(["INDEX_UNSIGNED", "CHAIN_UNSIGNED", "BODY_NOT_HELD"]);
const allFindings = [...(set ? set.findings : []), ...(chainReport ? chainReport.findings : [])];
const blockingSetFindings = allFindings.filter((f) => !INFORMATIONAL.has(f.code));

if (opts.json) {
  process.stdout.write(JSON.stringify({
    profile: { id: profile.id, pinnedPubkeyHex: profile.pinnedPubkeyHex, pinnedKeyId: profile.pinnedKeyId },
    tally, results, set, chain: chainReport,
  }, null, 2) + "\n");
} else {
  if (!opts.quiet) {
    process.stdout.write(`pinned key ${profile.pinnedPubkeyHex}  (${profile.pinnedKeyId})\n`);
    for (const r of results)
      if (r.state !== "VALID")
        process.stdout.write(`  ${r.state.padEnd(11)} ${r.code.padEnd(22)} ${r.file}\n                          ${r.reason}\n`);
  }
  process.stdout.write(`VALID ${tally.VALID} · INVALID ${tally.INVALID} · UNCHECKABLE ${tally.UNCHECKABLE}\n`);
  if (chainReport) {
    const c = chainReport;
    process.stdout.write(
      `manifest: ${c.positions} positions, walk ${c.walkLength}${c.reachesGenesis ? " to genesis" : " DID NOT REACH GENESIS"}; ` +
        `${c.bodiesHeld}/${c.bodiesDeclaredPublished} published bodies held; ` +
        `${c.withheld.total} withheld (${c.withheld.attestedBySignedPrev} attested by a signed prev, ` +
        `${c.withheld.assertedOnly} asserted only)\n`,
    );
  }
  if (set)
    process.stdout.write(`held cards: ${set.nCards}, ${set.tips.length} run(s), local links ${set.chainComplete ? "all resolve" : "INCOMPLETE"}\n`);
  // Findings are grouped and capped. A verifier that buries its one interesting finding under
  // 288 identical lines has technically reported it and practically hidden it. Nothing is
  // dropped: --json always carries every finding.
  {
    const byCode = new Map();
    for (const f of allFindings) (byCode.get(f.code) ?? byCode.set(f.code, []).get(f.code)).push(f.detail);
    for (const [code, details] of byCode) {
      for (const d of details.slice(0, 5)) process.stdout.write(`  ${code.padEnd(22)} ${d}\n`);
      if (details.length > 5)
        process.stdout.write(`  ${code.padEnd(22)} … and ${details.length - 5} more (use --json for all)\n`);
    }
  }
}

if (tally.INVALID) process.exit(1);
if (tally.UNCHECKABLE) process.exit(2);
if (blockingSetFindings.length) process.exit(3);
process.exit(0);
