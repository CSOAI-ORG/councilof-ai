/**
 * Generates the frozen EvaluationResult conformance corpus.
 *
 * Every vector records the verdict a conformant verifier must return. The UNCHECKABLE cases are
 * the point of the corpus: they are what a two-state verifier gets wrong, by reporting "I could
 * not check this" as "this is forged".
 *
 * Deterministic: a fixed seed key and a fixed timestamp, so the corpus digest is stable and can
 * itself be pinned. Re-run only when adding cases; the manifest digest changing is a signal.
 */
import { writeFileSync, mkdirSync, readdirSync, readFileSync, rmSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createHash, sign as edSign, createPrivateKey, generateKeyPairSync } from "node:crypto";

const HERE = dirname(fileURLToPath(import.meta.url));
const OUT = join(HERE, "vectors");
rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });

const PREDICATE = "https://councilof.ai/attestations/evaluation-result/v1";
const STATEMENT = "https://in-toto.io/Statement/v1";
const AT = "2026-09-04T00:00:00Z";
const COMMIT = "a".repeat(40);

// Fixed keypair from a fixed seed so the corpus is byte-stable across runs.
const seed = Buffer.alloc(32, 7);
const der = Buffer.concat([Buffer.from("302e020100300506032b657004220420", "hex"), seed]);
const KEY = createPrivateKey({ key: der, format: "der", type: "pkcs8" });
const { publicKey: FOREIGN_PUB, privateKey: FOREIGN_KEY } = generateKeyPairSync("ed25519");

const canon = (v) => {
  if (v === null || typeof v !== "object") return JSON.stringify(v);
  if (Array.isArray(v)) return "[" + v.map(canon).join(",") + "]";
  return "{" + Object.keys(v).sort().map((k) => JSON.stringify(k) + ":" + canon(v[k])).join(",") + "}";
};
const sha256 = (s) => createHash("sha256").update(s).digest("hex");

function basePredicate(over = {}) {
  return {
    schemaVersion: "councilof.ai/evaluation-result/1",
    evaluatedAt: AT,
    harness: { name: "lm-evaluation-harness", version: "0.4.9", commit: COMMIT },
    items: { n: 500, digest: sha256("items"), heldOut: true },
    result: {
      metric: "exact_match", aggregation: "mean", value: 0.612, grading: "deterministic",
      interval: { kind: "wilson", low: 0.568, high: 0.654, confidence: 0.95 },
    },
    contamination: { checked: true, method: "n-gram overlap vs training index", found: false },
    establishes: ["This harness at this commit, over these 500 held-out items, scored 0.612."],
    doesNotEstablish: ["That the system scores 0.612 on any other item set."],
    ...over,
  };
}
function statement(predicate, subjectName = "system-under-test") {
  return {
    _type: STATEMENT,
    subject: [{ name: subjectName, digest: { sha256: sha256(subjectName) } }],
    predicateType: PREDICATE,
    predicate,
  };
}
function envelope(stmt, key = KEY) {
  const payload = Buffer.from(canon(stmt), "utf8");
  const pae = Buffer.concat([
    Buffer.from(`DSSEv1 ${"application/vnd.in-toto+json".length} application/vnd.in-toto+json ${payload.length} `, "utf8"),
    payload,
  ]);
  return {
    payloadType: "application/vnd.in-toto+json",
    payload: payload.toString("base64"),
    signatures: [{ keyid: "did:web:councilof.ai#eval-1", sig: edSign(null, pae, key).toString("base64") }],
  };
}

const cases = [];
const add = (id, verdict, why, env, note) => cases.push({ id, verdict, why, note, envelope: env });

// ---- VALID -------------------------------------------------------------
add("v001-genuine", "VALID", "well-formed, signed by the bound key", envelope(statement(basePredicate())));
add("v002-no-interval", "VALID", "an interval is optional; its absence claims nothing",
    envelope(statement(basePredicate({ result: { metric: "bleu", aggregation: "mean", value: 31.4, grading: "deterministic" } }))));
add("v003-held-out-absent", "VALID", "heldOut absent is unknown, not false — still a valid attestation",
    envelope(statement(basePredicate({ items: { n: 500, digest: sha256("items") } }))));
add("v004-model-judge", "VALID", "a model judge is admissible when declared as one",
    envelope(statement(basePredicate({ result: { metric: "helpfulness", aggregation: "mean", value: 0.71, grading: "model_judge" } }))));
add("v005-contamination-found", "VALID", "an honest positive contamination finding is still a valid attestation",
    envelope(statement(basePredicate({ contamination: { checked: true, method: "n-gram", found: true } }))));

// ---- INVALID: the bytes do not match the signature ---------------------
for (const [id, mutate, why] of [
  ["i001-tampered-value", (p) => { p.result.value = 0.99; }, "score raised after signing"],
  ["i002-tampered-n", (p) => { p.items.n = 5; }, "item count reduced after signing"],
  ["i003-tampered-commit", (p) => { p.harness.commit = "b".repeat(40); }, "harness pin swapped after signing"],
  // NOTE: this case must START without heldOut. Setting heldOut=true on a base that already
  // carries heldOut:true mutates nothing, the bytes are identical, the signature verifies, and
  // the vector asserts a tamper that never happened. Caught by the corpus on 2026-09-04.
  ["i004-tampered-heldout", (p) => { p.items = { n: p.items.n, digest: p.items.digest }; p.items.heldOut = true; },
   "a run that was not held out is asserted as held out after signing"],
  ["i005-tampered-limits", (p) => { p.doesNotEstablish = []; }, "stated limits stripped after signing"],
  ["i006-tampered-date", (p) => { p.evaluatedAt = "2026-01-01T00:00:00Z"; }, "run back-dated after signing"],
]) {
  const signedBase = id === "i004-tampered-heldout"
    ? basePredicate({ items: { n: 500, digest: sha256("items") } })   // signed WITHOUT heldOut
    : basePredicate();
  const stmt = statement(signedBase);
  const env = envelope(stmt);
  const tampered = JSON.parse(Buffer.from(env.payload, "base64").toString("utf8"));
  mutate(tampered.predicate);
  env.payload = Buffer.from(canon(tampered), "utf8").toString("base64");
  add(id, "INVALID", why, env);
}
add("i007-foreign-key", "INVALID", "signed by a key that is not the one bound to the issuer",
    envelope(statement(basePredicate()), FOREIGN_KEY));
{
  const env = envelope(statement(basePredicate()));
  env.signatures[0].sig = Buffer.from("not a signature").toString("base64");
  add("i008-garbage-signature", "INVALID", "signature bytes are not a signature", env);
}
{
  const env = envelope(statement(basePredicate()));
  const s = JSON.parse(Buffer.from(env.payload, "base64").toString("utf8"));
  s.predicateType = "https://example.org/some-other/v1";
  env.payload = Buffer.from(canon(s), "utf8").toString("base64");
  add("i009-predicate-swapped", "INVALID", "predicateType changed after signing", env);
}

// ---- UNCHECKABLE: the verifier could not evaluate the input ------------
// These are the cases a two-state verifier gets wrong.
{
  const env = envelope(statement(basePredicate()));
  env.signatures[0].keyid = "did:web:unresolvable.invalid#k1";
  add("u001-unresolvable-key", "UNCHECKABLE", "key cannot be resolved — not a forgery, an unanswered question", env);
}
{
  const env = envelope(statement(basePredicate()));
  env.payloadType = "application/vnd.some-future+cbor";
  add("u002-unknown-payload-type", "UNCHECKABLE", "payload type outside the profile's declared domain", env);
}
{
  const env = envelope(statement(basePredicate()));
  delete env.signatures;
  add("u003-no-signatures", "UNCHECKABLE", "nothing to check", env);
}
{
  const env = envelope(statement(basePredicate()));
  env.payload = "!!!not-base64!!!";
  add("u004-payload-not-base64", "UNCHECKABLE", "payload cannot be decoded, so it was never compared", env);
}
{
  const stmt = statement(basePredicate());
  stmt.predicateType = PREDICATE.replace("/v1", "/v99");
  add("u005-future-predicate-version", "UNCHECKABLE", "a version this verifier does not implement is not a failure", envelope(stmt));
}
{
  const env = envelope(statement(basePredicate()));
  env.signatures[0].sig = undefined;
  add("u006-signature-absent", "UNCHECKABLE", "a signature field present but empty is not a forged signature", env);
}
add("u007-not-a-statement", "UNCHECKABLE", "input is not an in-toto statement at all",
    { payloadType: "application/vnd.in-toto+json", payload: Buffer.from('{"hello":"world"}').toString("base64"), signatures: [] });

// ---- SCHEMA-REJECT: signature verifies, but the predicate is inadmissible
for (const [id, over, why] of [
  ["s001-truncated-commit", { harness: { name: "h", version: "1", commit: "abc1234" } }, "a truncated pin is not a pin"],
  ["s002-wilson-on-median", { result: { metric: "acc", aggregation: "median", value: 0.5, interval: { kind: "wilson", low: 0.4, high: 0.6, confidence: 0.95 } } }, "a proportion interval does not describe a median"],
  ["s003-no-establishes", { establishes: [] }, "a result that states nothing about what it supports"],
  ["s004-unknown-aggregation", { result: { metric: "acc", aggregation: "geomean", value: 0.5 } }, "aggregation outside the closed set"],
  ["s005-confidence-out-of-range", { result: { metric: "acc", aggregation: "mean", value: 0.5, interval: { kind: "wilson", low: 0.4, high: 0.6, confidence: 95 } } }, "confidence is a probability, not a percentage"],
  ["s006-zero-items", { items: { n: 0, digest: sha256("items") } }, "an evaluation over no items"],
]) {
  add(id, "INVALID", why, envelope(statement(basePredicate(over))), "schema violation; signature itself verifies");
}

// ---- CANONICALISATION EDGES -------------------------------------------
add("c001-unicode-in-name", "VALID", "non-ASCII in a subject name must survive canonicalisation",
    envelope(statement(basePredicate(), "modèle-sous-test")));
add("c002-key-order-irrelevant", "VALID", "key order must not change the signed bytes",
    envelope(statement(basePredicate())));
{
  const env = envelope(statement(basePredicate()));
  const s = JSON.parse(Buffer.from(env.payload, "base64").toString("utf8"));
  env.payload = Buffer.from(JSON.stringify(s, Object.keys(s).sort().reverse()), "utf8").toString("base64");
  add("c003-reserialised-differently", "INVALID", "re-serialising with different key order breaks the signature — canonical form is normative", env);
}
add("c004-value-precision", "VALID", "a float that round-trips must verify",
    envelope(statement(basePredicate({ result: { metric: "acc", aggregation: "mean", value: 0.1234567890123, grading: "deterministic" } }))));

// ---- REPLAY ------------------------------------------------------------
{
  const env = envelope(statement(basePredicate()));
  add("r001-replay-identical", "VALID", "an identical attestation replayed is still a true statement about that run; freshness is the consumer's problem", env,
      "Consumers that care about recency must carry their own staleness bound — see spec section 6.");
}
{
  const stmt = statement(basePredicate());
  const env = envelope(stmt);
  const s = JSON.parse(Buffer.from(env.payload, "base64").toString("utf8"));
  s.predicate.evaluatedAt = "2026-12-01T00:00:00Z";
  env.payload = Buffer.from(canon(s), "utf8").toString("base64");
  add("r002-replay-redated", "INVALID", "re-dating a replayed attestation breaks the signature", env);
}

// ---- write -------------------------------------------------------------
for (const c of cases) {
  writeFileSync(join(OUT, `${c.id}.json`), JSON.stringify({
    id: c.id, expect: c.verdict, why: c.why, ...(c.note ? { note: c.note } : {}), envelope: c.envelope,
  }, null, 2) + "\n");
}
const files = readdirSync(OUT).filter((f) => f.endsWith(".json") && f !== "manifest.json").sort();
const manifest = {
  corpus: "councilof.ai/evaluation-result/conformance/v1",
  predicateType: PREDICATE,
  generated_by: "test/make-eval-vectors.mjs (deterministic: fixed seed, fixed timestamp)",
  publicKey_ed25519_hex: KEY.export({ format: "jwk" }).x
    ? Buffer.from(KEY.export({ format: "jwk" }).x, "base64url").toString("hex") : null,
  counts: files.reduce((a, f) => { const v = JSON.parse(readFileSync(join(OUT, f), "utf8")).expect; a[v] = (a[v] || 0) + 1; return a; }, {}),
  total: files.length,
  vectors: files.map((f) => ({ file: f, sha256: sha256(readFileSync(join(OUT, f))) })),
};
manifest.corpus_sha256 = sha256(canon(manifest.vectors));
writeFileSync(join(OUT, "manifest.json"), JSON.stringify(manifest, null, 2) + "\n");
console.log(`  ${files.length} vectors`, JSON.stringify(manifest.counts));
console.log(`  corpus_sha256 ${manifest.corpus_sha256}`);
