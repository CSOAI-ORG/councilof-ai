#!/usr/bin/env node
// SPDX-License-Identifier: Apache-2.0
/**
 * claim-events-rederive.mjs — re-derive the claim-event feed's head from its bytes, independently.
 *
 *   node scripts/claims/claim-events-rederive.mjs --dir public/claims/events/v0.1
 *   node scripts/claims/claim-events-rederive.mjs --url https://councilof.ai
 *
 * INDEPENDENT on purpose: it imports nothing from functions/ or from the producer
 * (scripts/claims/claim_events_export.py). Node's own crypto, the chain rule as written in head.json
 * `rules.chain`, and one pinned key. A reader who distrusts this repo can read these ~150 lines.
 *
 * What it recomputes from events.jsonl alone, then compares with head.json:
 *   n_lines, sha256 of the whole file, sha256 of the last line, head_seq, first_at, last_at,
 *   and the per-subject line counts (subjects[].source_events/source_atoms are the PRIVATE source
 *   heads; the feed can only show how many of each were projected, which must not exceed them).
 * What it checks besides: every line canonical, seq = n, prev_sha256 = sha256(previous line bytes);
 * head.signed.json is Ed25519 over the canonical payload by did:web:csoai.org#board-attestation-1 and
 * its payload.artifact.sha256 is sha256(head.json bytes). With --dir, dated heads/ are chained too.
 *
 * Exit 0 = VERIFIES, 1 = DOES_NOT_VERIFY, 2 = could not read. Prints one JSON verdict.
 */
import { createHash, createPublicKey, verify } from "node:crypto";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

// did:web:csoai.org#board-attestation-1, raw Ed25519 public key. The same value is published in
// https://csoai.org/.well-known/did.json; pass --did-json <file> to cross-check it against a copy you fetched.
const BOARD_KEY_HEX = "9367cf59be9cb72bbc9796adf056201ec1c58adfeaa13f83b2c5b754d6c20170";
const BOARD_DID = "did:web:csoai.org#board-attestation-1";

const sha = (b) => createHash("sha256").update(b).digest("hex");
const canon = (v) => {
  const rec = (x) => Array.isArray(x) ? x.map(rec)
    : x && typeof x === "object" ? Object.fromEntries(Object.keys(x).sort().map((k) => [k, rec(x[k])])) : x;
  return JSON.stringify(rec(v));
};

/** opts.keyHex / opts.did exist for the test suite's own throwaway key; the CLI never sets them. */
export function rederive(feedBuf, headBuf, signedBuf, opts = {}) {
  const keyHex = opts.keyHex ?? BOARD_KEY_HEX, signerDid = opts.did ?? BOARD_DID;
  const checks = [];
  const ck = (check, ok, detail) => checks.push({ check, ok: !!ok, detail });
  const text = feedBuf.toString("utf8");
  ck("utf-8", Buffer.from(text, "utf8").equals(feedBuf), "events.jsonl round-trips as UTF-8");
  let lines = [];
  if (feedBuf.length) {
    ck("framing", text.endsWith("\n"), "file ends with one newline");
    lines = text.endsWith("\n") ? text.slice(0, -1).split("\n") : text.split("\n");
  }
  let prev = null, broken = null;
  const perSubject = {};
  const parsed = [];
  for (let i = 0; i < lines.length && broken === null; i++) {
    let o;
    try { o = JSON.parse(lines[i]); } catch { broken = `line ${i}: not JSON`; break; }
    if (canon(o) !== lines[i]) broken = `line ${i}: not canonical`;
    else if (o.seq !== i) broken = `line ${i}: seq ${o.seq}`;
    else if (o.prev_sha256 !== prev) broken = `line ${i}: prev_sha256 does not link`;
    prev = sha(Buffer.from(lines[i], "utf8"));
    parsed.push(o);
    const s = (perSubject[o.subject_sealed_id] ??= { event: 0, atoms: 0 });
    s[o.kind] = (s[o.kind] ?? 0) + 1;
  }
  ck("chain", broken === null, broken ?? `${lines.length} lines link`);

  let head = null;
  try { head = JSON.parse(headBuf.toString("utf8")); } catch { ck("head", false, "head.json is not JSON"); }
  if (head) {
    const f = head.feed ?? {};
    const derived = {
      n_lines: lines.length,
      bytes_sha256: sha(feedBuf),
      head_line_sha256: lines.length ? sha(Buffer.from(lines[lines.length - 1], "utf8")) : null,
      head_seq: lines.length - 1,
      first_at: parsed[0]?.at ?? null,
      last_at: parsed[parsed.length - 1]?.at ?? null,
    };
    for (const [k, v] of Object.entries(derived)) ck(`head.feed.${k}`, f[k] === v, `derived ${v}, head says ${f[k]}`);
    for (const s of head.subjects ?? []) {
      const got = perSubject[s.subject_sealed_id] ?? { event: 0, atoms: 0 };
      ck(`subject ${s.subject_sealed_id}`, got.event <= (s.source_events?.n_lines ?? -1) && got.atoms <= (s.source_atoms?.n_lines ?? -1),
        `feed projects ${got.event} event + ${got.atoms} atoms lines; source heads have ${s.source_events?.n_lines} + ${s.source_atoms?.n_lines}`);
    }
    const named = new Set((head.subjects ?? []).map((s) => s.subject_sealed_id));
    ck("every subject in the feed is in the head", Object.keys(perSubject).every((k) => named.has(k)), Object.keys(perSubject).join(",") || "(none)");
  }

  let env = null;
  try { env = JSON.parse(signedBuf.toString("utf8")); } catch { ck("signature", false, "head.signed.json is not JSON"); }
  if (env) {
    const p = env.payload ?? {}, s = env.signature ?? {};
    const c = Buffer.from(canon(p), "utf8");
    ck("signed payload digest", sha(c) === s.payload_sha256, `sha256(canonical payload) = ${sha(c)}`);
    ck("signer", s.did === signerDid, String(s.did));
    let ok = false;
    try {
      const key = createPublicKey({ key: Buffer.concat([Buffer.from("302a300506032b6570032100", "hex"), Buffer.from(keyHex, "hex")]), format: "der", type: "spki" });
      ok = verify(null, c, key, Buffer.from(String(s.sig_ed25519), "hex"));
    } catch { ok = false; }
    ck("Ed25519", ok, `over the canonical payload with ${keyHex.slice(0, 16)}…`);
    ck("signature pins head.json", p.artifact?.sha256 === sha(headBuf), `sha256(head.json) = ${sha(headBuf)}, signed = ${p.artifact?.sha256}`);
  }
  return { state: checks.every((c) => c.ok) ? "VERIFIES" : "DOES_NOT_VERIFY", n_lines: lines.length, checks };
}

/** Dated heads chain by prev_head.sha256; each dated head must be the bytes its own .signed.json pins. */
export function rederiveHeads(dir) {
  const hd = join(dir, "heads");
  if (!existsSync(hd)) return [];
  const checks = [];
  const dated = readdirSync(hd).filter((f) => /^\d{4}-\d{2}-\d{2}\.json$/.test(f)).sort();
  let prev = null;
  for (const f of dated) {
    const b = readFileSync(join(hd, f));
    const h = JSON.parse(b.toString("utf8"));
    const want = prev ? { date: prev.date, sha256: prev.sha } : null;
    checks.push({ check: `heads/${f} prev_head`, ok: JSON.stringify(h.prev_head ?? null) === JSON.stringify(want), detail: JSON.stringify(h.prev_head ?? null) });
    const sp = join(hd, f.replace(/\.json$/, ".signed.json"));
    if (existsSync(sp)) {
      const e = JSON.parse(readFileSync(sp, "utf8"));
      checks.push({ check: `heads/${f} signed`, ok: e.payload?.artifact?.sha256 === sha(b), detail: `pins ${e.payload?.artifact?.sha256}` });
    }
    prev = { date: f.slice(0, 10), sha: sha(b) };
  }
  return checks;
}

async function main() {
  const args = process.argv.slice(2);
  const opt = (k) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : null; };
  const dir = opt("--dir"), url = opt("--url"), didJson = opt("--did-json");
  let feed, head, signed;
  try {
    if (url) {
      const get = async (p) => { const r = await fetch(new URL(p, url)); if (!r.ok) throw new Error(`${p} HTTP ${r.status}`); return Buffer.from(await r.arrayBuffer()); };
      [feed, head, signed] = await Promise.all(["/claims/events/v0.1/events.jsonl", "/claims/events/v0.1/head.json", "/claims/events/v0.1/head.signed.json"].map(get));
    } else {
      const d = dir ?? "public/claims/events/v0.1";
      [feed, head, signed] = ["events.jsonl", "head.json", "head.signed.json"].map((f) => readFileSync(join(d, f)));
    }
  } catch (e) {
    console.log(JSON.stringify({ state: "UNREADABLE", detail: String(e.message ?? e) }));
    process.exit(2);
  }
  const v = rederive(feed, head, signed);
  if (!url) v.checks.push(...rederiveHeads(dir ?? "public/claims/events/v0.1"));
  if (didJson) {
    const doc = JSON.parse(readFileSync(didJson, "utf8"));
    const vm = (doc.verificationMethod ?? []).find((m) => String(m.id).endsWith("#board-attestation-1"));
    const x = vm?.publicKeyJwk?.x ? Buffer.from(vm.publicKeyJwk.x, "base64url").toString("hex") : null;
    v.checks.push({ check: "did.json cross-check", ok: x === BOARD_KEY_HEX, detail: `did.json key ${x}` });
  }
  v.state = v.checks.every((c) => c.ok) ? "VERIFIES" : "DOES_NOT_VERIFY";
  console.log(JSON.stringify(v, null, 1));
  process.exit(v.state === "VERIFIES" ? 0 : 1);
}

if (import.meta.url === `file://${process.argv[1]}`) main();
