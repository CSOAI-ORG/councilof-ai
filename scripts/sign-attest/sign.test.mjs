/**
 * scripts/sign-attest/sign.mjs - what it will ask the board signer to sign, and what it will keep.
 *
 * No test here reaches the network or holds a real key. The signer, the OIDC token endpoint and
 * the DID document are one stubbed fetch; the "board key" is a throwaway Ed25519 key made in this
 * process. The payloads are real: the corrections attestation is the one the producer emits today
 * (child process, which makes no network call), and the ruling attestations are built by the
 * producer's own library from the records committed under public/signed/rulings.
 */
import { afterEach, describe, expect, it } from "vitest";
import { execFileSync, spawnSync } from "node:child_process";
import { createHash, generateKeyPairSync, sign as edSign } from "node:crypto";
import fs from "node:fs";
import http from "node:http";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  AUDIENCE, BOARD_DID, CLAIM_NAMES, DID_URL, FAILED_PREFIX, NO_OIDC, PINNED_KEY_HEX, SIGN_URL, USER_AGENT,
  canonSigner, decodePayloads, failureLines, freshnessDefect, isInstant, labelViolation, loadKinds, oneLine,
  pickClaims, quoteName, registryDefects, run, signOne, validatePayload, verifyRaw,
} from "./sign.mjs";
import { BOARD_ATTESTATION_DID, PAYLOAD_CAP_BYTES, canonicalBytes, signLabelViolation } from "../../functions/_lib/cardSign.ts";
import { LEDGER } from "../../functions/api/corrections.ts";
import {
  ATTESTATION_SCHEMA, BOARD_KEY_HEX, CLASSES, CONTENT_ID_RULE, INDEX_ATTESTATION_SCHEMA,
  INDEX_CONTENT_ID_RULE, SIGN_CAP, buildAttestation, buildIndexAttestation,
} from "../rulings/ruling-lib.mjs";

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const KINDS = loadKinds();
// The four limits, for a registry a test writes by hand.
const LIMITS = {
  max_payloads: KINDS.max_payloads, max_bytes: KINDS.max_bytes,
  signed_at_max_age_seconds: KINDS.signed_at_max_age_seconds, signed_at_max_ahead_seconds: KINDS.signed_at_max_ahead_seconds,
};
const clone = (o) => JSON.parse(JSON.stringify(o));
const sha256 = (s) => createHash("sha256").update(s, "utf8").digest("hex");
const b64 = (arr) => Buffer.from(JSON.stringify(arr), "utf8").toString("base64");
const refusal = (fn) => {
  try {
    fn();
  } catch (e) {
    return String(e.message);
  }
  return "";
};

const tmpDirs = [];
const tmp = () => {
  const d = fs.mkdtempSync(path.join(os.tmpdir(), "sign-attest-"));
  tmpDirs.push(d);
  return d;
};
afterEach(() => {
  while (tmpDirs.length) fs.rmSync(tmpDirs.pop(), { recursive: true, force: true });
});

// ---- real payloads -------------------------------------------------------------------------

/** The attestation the corrections producer emits today. The producer makes no network call here. */
function emittedCorrections() {
  const f = path.join(tmp(), "att.json");
  execFileSync(process.execPath, ["scripts/sign-corrections-ledger.mjs", "--emit-payload", f], { cwd: REPO, stdio: "pipe" });
  return JSON.parse(fs.readFileSync(f, "utf8"));
}
const RULINGS_DIR = path.join(REPO, "public/signed/rulings");
const rulingRecords = fs.readdirSync(RULINGS_DIR)
  .filter((f) => /^R-\d{4}-\d{4}-\d{2}\.json$/.test(f)).sort()
  .map((f) => JSON.parse(fs.readFileSync(path.join(RULINGS_DIR, f), "utf8")));
const rulingsIndex = JSON.parse(fs.readFileSync(path.join(RULINGS_DIR, "index.json"), "utf8"));
const SIGNED_AT = "2026-10-13T07:15:00Z";
const rulingAtt = (i = 0) => buildAttestation(rulingRecords[i], SIGNED_AT);
const indexAtt = () => buildIndexAttestation(rulingsIndex, SIGNED_AT);
const committedCorrections = () => clone(LEDGER.signature.attestation);

// A body shaped like a mill measurement card (key names of public/interop/mill-cards-signed/*).
// The values are placeholders; it describes no model and no measurement.
const cardShaped = () => ({
  kind: "gspc.measurement-card", axis: "example-axis", model: "example/not-a-model", issuer: "example",
  n: 30, accuracy: 0.5, status: "MEASURED", unmeasured: [], run_id: "example-run", signature_state: "SIGNED",
});

// ---- the stubbed network -------------------------------------------------------------------

const REQ_URL = "https://oidc.runner.invalid/token?api-version=2";
const REQ_TOKEN = "REQUEST-TOKEN-do-not-print-0123456789";
const TOKEN_MARK = "OIDC-SIGNATURE-SEGMENT-do-not-print";
const seg = (o) => Buffer.from(typeof o === "string" ? o : JSON.stringify(o), "utf8").toString("base64url");
const CLAIMS = {
  iss: "https://token.actions.githubusercontent.com",
  aud: AUDIENCE,
  sub: "repo:CSOAI-ORG/councilof-ai:ref:refs/heads/master",
  repository: "CSOAI-ORG/councilof-ai",
  job_workflow_ref: "CSOAI-ORG/councilof-ai/.github/workflows/hf-fin-shells-attest.yml@refs/heads/master",
  workflow_ref: "CSOAI-ORG/councilof-ai/.github/workflows/hf-fin-shells-attest.yml@refs/heads/master",
  workflow: "hf-fin-shells-attest",
  ref: "refs/heads/master",
  ref_type: "branch",
  sha: "c".repeat(40),
  event_name: "workflow_dispatch",
  repository_id: "1001",
  repository_owner_id: "2002",
  run_id: "424242",
  run_attempt: "1",
  iat: 1_760_000_000,
  exp: 1_760_000_300,
};
const makeJwt = (n) => `${seg({ alg: "RS256", kid: "stub" })}.${seg({ ...CLAIMS, jti: `stub-jti-${n}` })}.${seg(`${TOKEN_MARK}-${n}`)}`;

function keyPair() {
  const { publicKey, privateKey } = generateKeyPairSync("ed25519");
  const pubHex = publicKey.export({ format: "der", type: "spki" }).subarray(-32).toString("hex");
  return { privateKey, pubHex };
}

/**
 * One fetch for the three hosts. `opts` bends the signer's reply so a test can show a refusal:
 *   status, did, signerAuth, signWith (a different private key), editReply(reply, n), rawReply(n),
 *   editRaw(text, n) (the reply text after it is serialised), didKeyHex (what the DID document
 *   publishes), didDoc (the whole DID document, as text), failOn (the n-th sign call answers 401),
 *   signThrows (the sign call throws an error that quotes the request's Authorization header).
 */
function stubNetwork(key, opts = {}) {
  const calls = { total: 0, token: [], sign: [], did: 0, other: [] };
  const tokens = [];
  const fetchImpl = async (url, init = {}) => {
    calls.total += 1;
    const u = String(url);
    if (u.startsWith(REQ_URL.split("?")[0])) {
      calls.token.push({ url: u, headers: init.headers || {}, redirect: init.redirect });
      const t = makeJwt(calls.token.length);
      tokens.push(t);
      return new Response(JSON.stringify({ value: t }), { status: 200 });
    }
    if (u === DID_URL) {
      calls.did += 1;
      calls.didInit = init;
      if (opts.didDoc !== undefined) return new Response(opts.didDoc, { status: 200 });
      const x = Buffer.from(opts.didKeyHex || key.pubHex, "hex").toString("base64url");
      return new Response(JSON.stringify({
        id: "did:web:csoai.org",
        verificationMethod: [
          { id: "did:web:csoai.org#some-other-key", publicKeyJwk: { kty: "OKP", crv: "Ed25519", x: seg("0".repeat(32)) } },
          { id: BOARD_DID, publicKeyJwk: { kty: "OKP", crv: "Ed25519", x } },
        ],
      }), { status: 200 });
    }
    if (u === SIGN_URL) {
      const n = calls.sign.length + 1;
      const body = JSON.parse(init.body);
      calls.sign.push({ headers: init.headers || {}, body, method: init.method, redirect: init.redirect });
      if (opts.signThrows) throw new Error(`socket closed after sending authorization: ${init.headers.authorization}`);
      if (opts.failOn === n) return new Response(JSON.stringify({ error: "unauthorized", reason: "OIDC rejected", detail: "workflow" }), { status: 401 });
      if (opts.rawReply) return new Response(opts.rawReply(n), { status: opts.status ?? 200 });
      const canonical = canonSigner(body.payload);
      let reply = {
        schema: "csoai.board-sign/0.1",
        did: opts.did ?? BOARD_DID,
        sig_ed25519: edSign(null, Buffer.from(canonical, "utf8"), opts.signWith ?? key.privateKey).toString("hex"),
        payload_sha256: sha256(canonical),
        signer_auth: opts.signerAuth ?? "github-oidc",
        signed_at: "2026-10-13T07:15:01.123Z",
        note: "stub reply",
      };
      if (opts.editReply) reply = opts.editReply(reply, n) ?? reply;
      const text = JSON.stringify(reply, null, 2);
      return new Response(opts.editRaw ? opts.editRaw(text, n) : text, { status: opts.status ?? 200 });
    }
    calls.other.push(u);
    return new Response("not found", { status: 404 });
  };
  return { fetchImpl, calls, tokens };
}

const runEnv = (kind, payloads, extra = {}) => ({
  KIND: kind,
  PAYLOADS_B64: b64(payloads),
  BOARD_SIGN_URL: SIGN_URL,
  ACTIONS_ID_TOKEN_REQUEST_URL: REQ_URL,
  ACTIONS_ID_TOKEN_REQUEST_TOKEN: REQ_TOKEN,
  GITHUB_RUN_ID: "424242",
  GITHUB_RUN_ATTEMPT: "1",
  GITHUB_SHA: "c".repeat(40),
  GITHUB_REPOSITORY: "CSOAI-ORG/councilof-ai",
  GITHUB_WORKFLOW: "hf-fin-shells-attest",
  GITHUB_REF: "refs/heads/master",
  ...extra,
});

/** A job clock one minute after the first payload was dated, so a test's payloads are fresh. */
const clockFor = (payloads) => {
  const dated = payloads.find((p) => p && typeof p === "object" && isInstant(p.signed_at));
  return Date.parse(dated ? dated.signed_at : SIGNED_AT) + 60_000;
};

/**
 * Run with a stub; return what happened, including everything logged and everything written.
 * The job clock is opts.nowMs, or one minute after the first payload's signed_at.
 */
async function attempt(kind, payloads, opts = {}, envExtra = {}) {
  const key = opts.key ?? keyPair();
  const net = stubNetwork(key, opts);
  const outDir = path.join(tmp(), "out");
  const lines = [];
  let receipt = null;
  let error = "";
  const nowMs = opts.nowMs ?? clockFor(payloads);
  try {
    receipt = await run({
      env: runEnv(kind, payloads, envExtra), fetchImpl: opts.fetchImpl ? opts.fetchImpl(net) : net.fetchImpl, outDir,
      log: (l) => lines.push(String(l)), pinnedKeyHex: opts.pinnedKeyHex ?? key.pubHex, now: () => nowMs,
    });
  } catch (e) {
    error = String(e.message);
  }
  const files = fs.existsSync(outDir) ? fs.readdirSync(outDir).sort() : [];
  return { key, ...net, outDir, lines, receipt, error, files };
}

/** Everything a run printed, threw or wrote, as one text. */
const everythingSeen = (r) => [
  ...r.lines,
  r.error,
  JSON.stringify(r.receipt),
  ...r.files.map((f) => fs.readFileSync(path.join(r.outDir, f), "utf8")),
  ...r.files,
].join("\n");
/** No token, no part of a token and no request token is anywhere in what a run left behind. */
const tokenFree = (r) => {
  const seen = everythingSeen(r);
  expect(r.tokens.length).toBeGreaterThan(0);
  for (const t of r.tokens) {
    expect(seen).not.toContain(t);
    for (const part of t.split(".")) expect(seen).not.toContain(part);
  }
  expect(seen).not.toContain(REQ_TOKEN);
  expect(seen).not.toContain(TOKEN_MARK);
  expect(seen).not.toContain("add-mask");
};

// What a reader of a run log keys on: a runner command at the start of a line (leading spaces are
// trimmed by the runner), the runner's older "##[" command form anywhere, and this job's own
// record words at the start of a line.
const RECORD_WORD = /^(CHECKED|CLAIMS|SIGNED|WROTE)\b/;
const inert = (text, what = "") => {
  expect(text, what).not.toMatch(/[^\x20-\x7e\n]/); // printable ASCII and "\n", nothing else
  for (const line of text.split("\n")) {
    expect(line, what).not.toMatch(/^\s*::/);
    expect(line, what).not.toMatch(RECORD_WORD);
    expect(line, what).not.toContain("##[");
  }
};
const FORGED_SIGNED =
  `SIGNED kind=corrections schema=csoai.corrections-attestation/0.1 bytes=773 payload_sha256=${"a".repeat(64)} signer_auth=github-oidc signed_at=2026-10-13T07:15:01.123Z`;
// Names a hostile payload might give a key. The first is the one the review reproduced.
const HOSTILE_NAMES = [
  `x\n::error title=FORGED::${FORGED_SIGNED}\n::add-mask::refused\nCLAIMS {"job_workflow_ref":"forged"}`,
  "\n::error::x\nSIGNED y\nCLAIMS z",
  "x\r::warning::y\rSIGNED y",
  "x\r\nWROTE 1 signature(s) and receipt.json to /tmp",
  "x\u2028SIGNED y\u2029CLAIMS z\u0085CHECKED kind=corrections",
  "x\u001b[2K\u001b[1ASIGNED y",
  "##[error]x",
  "  ::notice::leading spaces",
  `${"x".repeat(500)}\nSIGNED y`,
];

// ---- tests ---------------------------------------------------------------------------------

describe("kinds.json - the registry", () => {
  it("is usable, holds exactly three kinds, and carries the four limits", () => {
    expect(registryDefects(KINDS)).toEqual([]);
    expect(Object.keys(KINDS.kinds).sort()).toEqual(["corrections", "ruling", "rulings-index"]);
    expect(KINDS.max_payloads).toBe(10);
    expect(KINDS.max_bytes).toBe(3072);
    expect(KINDS.signed_at_max_age_seconds).toBe(86400); // one day
    expect(KINDS.signed_at_max_ahead_seconds).toBe(300); // five minutes
    for (const lim of Object.keys(LIMITS)) {
      const without = clone(KINDS);
      delete without[lim];
      expect(registryDefects(without).join(" "), lim).toContain(`${lim} must be a positive integer`);
      expect(refusal(() => validatePayload("corrections", committedCorrections(), without)), lim).toMatch(/registry is not usable/);
    }
  });

  it("every kind dates itself with signed_at, and that key is held to a real time", () => {
    for (const [name, spec] of Object.entries(KINDS.kinds)) {
      expect(spec.keys, name).toContain("signed_at");
      expect(spec.instants, name).toEqual(["signed_at"]);
      expect(Object.keys(spec.patterns), name).not.toContain("signed_at");
    }
  });

  it("its cap, key and DID are the signer's and the producers' own", () => {
    expect(KINDS.max_bytes).toBe(PAYLOAD_CAP_BYTES);
    expect(KINDS.max_bytes).toBe(SIGN_CAP);
    expect(PINNED_KEY_HEX).toBe(BOARD_KEY_HEX);
    expect(BOARD_DID).toBe(BOARD_ATTESTATION_DID);
  });

  it("the ruling pins are the ruling library's constants, not a second copy that can drift", () => {
    const r = KINDS.kinds.ruling;
    expect(r.equals.schema).toBe(ATTESTATION_SCHEMA);
    expect(r.equals.content_id_rule).toBe(CONTENT_ID_RULE);
    expect(r.enums.class).toEqual(CLASSES);
    const x = KINDS.kinds["rulings-index"];
    expect(x.equals.schema).toBe(INDEX_ATTESTATION_SCHEMA);
    expect(x.equals.content_id_rule).toBe(INDEX_CONTENT_ID_RULE);
  });

  it("the key lists are the producers' key sets", () => {
    expect([...KINDS.kinds.corrections.keys].sort()).toEqual(Object.keys(committedCorrections()).sort());
    expect([...KINDS.kinds.ruling.keys].sort()).toEqual(Object.keys(rulingAtt()).sort());
    expect([...KINDS.kinds["rulings-index"].keys].sort()).toEqual(Object.keys(indexAtt()).sort());
    expect(KINDS.kinds.corrections.keys).toHaveLength(9);
    expect(KINDS.kinds.ruling.keys).toHaveLength(8);
    expect(KINDS.kinds["rulings-index"].keys).toHaveLength(6);
  });

  it("a registry with an unruled key, a doubly ruled key or an unanchored pattern is itself refused", () => {
    const noRule = clone(KINDS);
    noRule.kinds.corrections.keys.push("status");
    expect(registryDefects(noRule).join(" ")).toMatch(/key status has 0 rules/);
    expect(refusal(() => validatePayload("corrections", committedCorrections(), noRule))).toMatch(/registry is not usable/);

    const twoRules = clone(KINDS);
    twoRules.kinds.corrections.patterns.schema = "^.*$";
    expect(registryDefects(twoRules).join(" ")).toMatch(/key schema has 2 rules/);

    const loose = clone(KINDS);
    loose.kinds.corrections.patterns.content_id = "[0-9a-f]{64}";
    expect(registryDefects(loose).join(" ")).toMatch(/content_id is not anchored/);

    // An instant rule counts as a rule: once it is gone the key has none, and a second one is two.
    const undated = clone(KINDS);
    undated.kinds.ruling.instants = [];
    expect(registryDefects(undated).join(" ")).toMatch(/ruling: key signed_at has 0 rules/);
    const twice = clone(KINDS);
    twice.kinds.ruling.patterns.signed_at = "^.*$";
    expect(registryDefects(twice).join(" ")).toMatch(/ruling: key signed_at has 2 rules/);
  });
});

describe("the two rules copied from the signer stay equal to the signer's", () => {
  const samples = [
    { b: 1, a: "x" },
    { z: [3, { y: 1, x: [true, null] }], a: { c: "ü", b: "日本" } },
    { n: 1.5, m: -0, big: 9007199254740991, s: "a\"b\\c\n" },
    [],
    { nested: { deep: { deeper: { k: "v" } } } },
  ];
  it("canonSigner is functions/_lib/cardSign.ts canonicalBytes", () => {
    for (const s of samples) expect(canonSigner(s)).toBe(new TextDecoder().decode(canonicalBytes(s)));
    for (const p of [committedCorrections(), rulingAtt(), indexAtt()])
      expect(canonSigner(p)).toBe(new TextDecoder().decode(canonicalBytes(p)));
  });
  it("labelViolation is functions/_lib/cardSign.ts signLabelViolation", () => {
    const texts = [
      "a THIN card", "TEMPLATE", "one specimen", "a Specimen here", "thin banks", "NOTHING WITHIN",
      "/specimens/x", "THIN-ish", "xTHIN", "{\"note\":\"THIS object\"}", "",
    ];
    for (const t of texts) expect(labelViolation(t)).toBe(signLabelViolation(t));
    expect(labelViolation("a THIN card")).toBe("THIN");
    expect(labelViolation("thin banks")).toBe(null);
  });
});

describe("what passes", () => {
  it("the corrections attestation the producer emits today", { timeout: 30_000 }, () => {
    const att = emittedCorrections();
    const ok = validatePayload("corrections", att, KINDS);
    expect(ok.schema).toBe("csoai.corrections-attestation/0.1");
    expect(ok.payload_sha256).toBe(sha256(canonSigner(att)));
    expect(ok.bytes).toBe(Buffer.byteLength(canonSigner(att), "utf8"));
    expect(ok.bytes).toBeLessThanOrEqual(3072);
    // The producer described the ledger that is on disk.
    expect(att.entries).toBe(LEDGER.corrections.length);
    expect(att.latest_entry_id).toBe(LEDGER.corrections[0].id);
  });

  it("the corrections attestation already signed and committed on master", () => {
    expect(validatePayload("corrections", committedCorrections(), KINDS).schema).toBe("csoai.corrections-attestation/0.1");
  });

  it("a ruling attestation built by ruling-lib from every committed record, and each committed one", () => {
    expect(rulingRecords.length).toBeGreaterThanOrEqual(8);
    rulingRecords.forEach((r, i) => {
      expect(validatePayload("ruling", rulingAtt(i), KINDS).schema, r.ruling_id).toBe(ATTESTATION_SCHEMA);
      expect(validatePayload("ruling", clone(r.signature.attestation), KINDS).schema, r.ruling_id).toBe(ATTESTATION_SCHEMA);
    });
  });

  it("the index attestation built by ruling-lib from the committed index, and the committed one", () => {
    expect(validatePayload("rulings-index", indexAtt(), KINDS).schema).toBe(INDEX_ATTESTATION_SCHEMA);
    expect(validatePayload("rulings-index", clone(rulingsIndex.signature.attestation), KINDS).schema).toBe(INDEX_ATTESTATION_SCHEMA);
  });
});

describe("what is refused, before any network call", () => {
  const good = committedCorrections;

  it("an unknown kind", () => {
    expect(refusal(() => validatePayload("card", good(), KINDS))).toMatch(/unknown kind "card"/);
    expect(refusal(() => validatePayload("__proto__", good(), KINDS))).toMatch(/unknown kind/);
    expect(refusal(() => validatePayload(undefined, good(), KINDS))).toMatch(/unknown kind/);
  });

  it("one extra key (status: MEASURED)", () => {
    expect(refusal(() => validatePayload("corrections", { ...good(), status: "MEASURED" }, KINDS))).toBe('REFUSED kind=corrections: extra key(s): "status"');
    expect(refusal(() => validatePayload("ruling", { ...rulingAtt(), n: 30 }, KINDS))).toBe('REFUSED kind=ruling: extra key(s): "n"');
    expect(refusal(() => validatePayload("rulings-index", { ...indexAtt(), status: "MEASURED" }, KINDS))).toBe('REFUSED kind=rulings-index: extra key(s): "status"');
  });

  it("a missing key", () => {
    for (const k of KINDS.kinds.corrections.keys) {
      const p = good();
      delete p[k];
      expect(refusal(() => validatePayload("corrections", p, KINDS)), k).toMatch(new RegExp(`missing key\\(s\\): ${k}`));
    }
  });

  it("the note altered by one character", () => {
    const p = good();
    p.note = p.note.replace("Detached.", "Detached,");
    expect(p.note.length).toBe(good().note.length);
    expect(refusal(() => validatePayload("corrections", p, KINDS))).toMatch(/note is not the pinned value/);
    const q = good();
    q.content_id_rule += " ";
    expect(refusal(() => validatePayload("corrections", q, KINDS))).toMatch(/content_id_rule is not the pinned value/);
  });

  it("a mill-card-shaped body, with or without an attestation's schema label", () => {
    for (const kind of Object.keys(KINDS.kinds)) {
      expect(refusal(() => validatePayload(kind, cardShaped(), KINDS)), kind).toMatch(/extra key\(s\)/);
      const labelled = { ...cardShaped(), schema: KINDS.kinds[kind].equals.schema };
      const why = refusal(() => validatePayload(kind, labelled, KINDS));
      expect(why, kind).toMatch(/extra key\(s\): .*"status"/);
      expect(why, kind).toMatch(/missing key\(s\)/);
    }
  });

  it("a payload of another kind's schema", () => {
    expect(refusal(() => validatePayload("corrections", rulingAtt(), KINDS))).toMatch(/schema is not the pinned value/);
    expect(refusal(() => validatePayload("ruling", indexAtt(), KINDS))).toMatch(/schema is not the pinned value/);
    expect(refusal(() => validatePayload("rulings-index", rulingAtt(), KINDS))).toMatch(/schema is not the pinned value/);
    // Same nine keys, another kind's label: the key set alone is not enough either.
    expect(refusal(() => validatePayload("corrections", { ...good(), schema: ATTESTATION_SCHEMA }, KINDS))).toMatch(/schema is not the pinned value/);
  });

  it("a mistyped value under a correct key", () => {
    const bad = (patch, kind = "corrections", base = good()) => refusal(() => validatePayload(kind, { ...base, ...patch }, KINDS));
    expect(bad({ entries: "93" })).toMatch(/entries is not a non-negative integer/);
    expect(bad({ entries: 93.5 })).toMatch(/entries is not a non-negative integer/);
    expect(bad({ entries: -1 })).toMatch(/entries is not a non-negative integer/);
    expect(bad({ ledger_canonical_bytes: null })).toMatch(/ledger_canonical_bytes is not a non-negative integer/);
    expect(bad({ content_id: "B".repeat(64) })).toMatch(/content_id does not match/);
    expect(bad({ content_id: "b".repeat(63) })).toMatch(/content_id does not match/);
    expect(bad({ content_id: `${"b".repeat(64)}\n` })).toMatch(/content_id does not match/);
    expect(bad({ latest_entry_id: "C-2026-1013-1" })).toMatch(/latest_entry_id does not match/);
    expect(bad({ signed_at: "2026-10-13T07:15:00.000Z" })).toMatch(/signed_at is not a real UTC time/);
    expect(bad({ signed_at: 1760339700 })).toMatch(/signed_at is not a real UTC time/);
    expect(bad({ note: { text: good().note } })).toMatch(/note is not the pinned value/);
    expect(bad({ schema: ["csoai.corrections-attestation/0.1"] })).toMatch(/schema is not the pinned value/);
    expect(bad({ class: "MEASURED" }, "ruling", rulingAtt())).toMatch(/class is not one of/);
    expect(bad({ ruling_id: "R-2026-1013-001" }, "ruling", rulingAtt())).toMatch(/ruling_id does not match/);
    expect(bad({ decided_at: "yesterday" }, "ruling", rulingAtt())).toMatch(/decided_at does not match/);
    expect(bad({ count: "8" }, "rulings-index", indexAtt())).toMatch(/count is not a non-negative integer/);
    for (const notObject of [null, [], "x", 7]) expect(refusal(() => validatePayload("corrections", notObject, KINDS))).toMatch(/not a JSON object/);
  });

  it("an 11th payload, an empty list, and input that is not a list of objects", () => {
    const eleven = Array.from({ length: 11 }, () => good());
    expect(refusal(() => decodePayloads(b64(eleven), KINDS))).toMatch(/11 payloads in one run; the limit is 1 to 10/);
    expect(decodePayloads(b64(eleven.slice(0, 10)), KINDS)).toHaveLength(10);
    expect(refusal(() => decodePayloads(b64([]), KINDS))).toMatch(/0 payloads/);
    expect(refusal(() => decodePayloads(b64(good()), KINDS))).toMatch(/must be a JSON array/);
    expect(refusal(() => decodePayloads(b64([good(), "x"]), KINDS))).toMatch(/payload 2 is not a JSON object/);
    expect(refusal(() => decodePayloads("", KINDS))).toMatch(/PAYLOADS_B64 is empty/);
    expect(refusal(() => decodePayloads(undefined, KINDS))).toMatch(/PAYLOADS_B64 is empty/);
    expect(refusal(() => decodePayloads("not base64 !!", KINDS))).toMatch(/not standard base64/);
    expect(refusal(() => decodePayloads(Buffer.from("{not json").toString("base64"), KINDS))).toMatch(/does not decode to JSON/);
    expect(refusal(() => decodePayloads(Buffer.from([0xff, 0xfe, 0xfd]).toString("base64"), KINDS))).toMatch(/UTF-8/);
    // Line-wrapped base64 (what `base64` prints on Linux) is still read.
    expect(decodePayloads(b64([good()]).replace(/(.{76})/g, "$1\n"), KINDS)).toEqual([good()]);
  });

  it("more than 3,072 canonical bytes", () => {
    const why = refusal(() => validatePayload("corrections", { ...good(), note: "x".repeat(4000) }, KINDS));
    expect(why).toMatch(/canonical bytes exceeds the 3072 cap/);
    // The cap on its own, with a registry whose only rule would otherwise admit the value.
    const wide = { ...LIMITS, kinds: { wide: { keys: ["blob"], equals: {}, patterns: { blob: "^a+$" }, integers: [], enums: {} } } };
    expect(validatePayload("wide", { blob: "a".repeat(3072 - 11) }, wide).bytes).toBe(3072);
    expect(refusal(() => validatePayload("wide", { blob: "a".repeat(3072 - 10) }, wide))).toBe("REFUSED kind=wide: 3073 canonical bytes exceeds the 3072 cap");
  });

  it("a never-sign label", () => {
    expect(refusal(() => validatePayload("corrections", { ...good(), note: "a THIN card" }, KINDS))).toMatch(/never-sign label THIN/);
    const loose = { ...LIMITS, kinds: { loose: { keys: ["text"], equals: {}, patterns: { text: "^[ -~]+$" }, integers: [], enums: {} } } };
    expect(validatePayload("loose", { text: "thin banks and NOTHING else" }, loose).bytes).toBeGreaterThan(0);
    expect(refusal(() => validatePayload("loose", { text: "a TEMPLATE" }, loose))).toBe("REFUSED kind=loose: never-sign label TEMPLATE");
    expect(refusal(() => validatePayload("loose", { text: "one Specimen" }, loose))).toBe("REFUSED kind=loose: never-sign label Specimen");
  });

  it("run() makes zero network calls for any of them, even when only the last payload is bad", async () => {
    const cases = [
      ["card", [good()], /unknown kind/],
      ["corrections", [{ ...good(), status: "MEASURED" }], /extra key/],
      ["corrections", [good(), rulingAtt()], /payload 2 of 2: REFUSED kind=corrections/],
      ["corrections", [cardShaped()], /extra key/],
      ["corrections", Array.from({ length: 11 }, () => good()), /11 payloads/],
      ["corrections", [good(), good()], /same payload appears twice/],
      ["ruling", [rulingAtt(0), rulingAtt(1), { ...rulingAtt(2), class: "MEASURED" }], /payload 3 of 3/],
    ];
    for (const [kind, payloads, why] of cases) {
      const r = await attempt(kind, payloads);
      expect(r.error, String(why)).toMatch(why);
      expect(r.calls.total, String(why)).toBe(0);
      expect(r.files, String(why)).toEqual([]);
      expect(r.lines.filter((l) => l.startsWith("SIGNED")), String(why)).toEqual([]);
    }
  });
});

describe("text from a payload, an input or the network cannot start a log line", () => {
  const good = committedCorrections;
  const withKey = (name) => ({ ...good(), [name]: 1 });

  it("oneLine and quoteName: what they let through", () => {
    expect(oneLine("a\nb\rc\u2028d\u001be\u00e9")).toBe("a\\u000ab\\u000dc\\u2028d\\u001be\\u00e9");
    expect(oneLine("plain text, with: punctuation")).toBe("plain text, with: punctuation");
    expect(quoteName("status")).toBe('"status"');
    expect(quoteName("latest_entry-id.v2")).toBe('"latest_entry-id.v2"');
    expect(quoteName("a b")).toBe('"a\\u0020b"');
    expect(quoteName("::error::x")).toBe('"\\u003a\\u003aerror\\u003a\\u003ax"');
    expect(quoteName("##[error]")).toBe('"\\u0023\\u0023\\u005berror\\u005d"');
    expect(quoteName('q"q\\q')).toBe('"q\\u0022q\\u005cq"');
    expect(quoteName("x".repeat(81))).toBe(`"${"x".repeat(80)}" (+1 more characters)`);
    expect(quoteName(undefined)).toBe('"undefined"');
    for (const name of HOSTILE_NAMES) {
      expect(quoteName(name), name).toMatch(/^"[A-Za-z0-9_.\\-]*"( \(\+\d+ more characters\))?$/);
      expect(quoteName(name).length, name).toBeLessThanOrEqual(2 + 80 * 6 + 30);
    }
  });

  it("validatePayload: a hostile key name gives one inert line, with the name quoted and cut at 80", () => {
    for (const name of HOSTILE_NAMES) {
      const why = refusal(() => validatePayload("corrections", withKey(name), KINDS));
      expect(why.startsWith('REFUSED kind=corrections: extra key(s): "'), name).toBe(true);
      expect(why.split(/\r\n|\r|\n|\u2028|\u2029|\u0085/), name).toHaveLength(1);
      expect(why, name).not.toContain("::");
      expect(why, name).not.toContain(" SIGNED ");
      expect(why.length, name).toBeLessThan(700);
      inert(why, name);
    }
    // The review's own case, spelled out.
    expect(refusal(() => validatePayload("corrections", withKey("\n::error::x\nSIGNED y\nCLAIMS z"), KINDS)))
      .toBe('REFUSED kind=corrections: extra key(s): "\\u000a\\u003a\\u003aerror\\u003a\\u003ax\\u000aSIGNED\\u0020y\\u000aCLAIMS\\u0020z"');
  });

  it("many extra keys: twelve are named, the rest are counted", () => {
    const p = good();
    for (let i = 0; i < 40; i++) p[`k${String(i).padStart(2, "0")}\nSIGNED y`] = i;
    const why = refusal(() => validatePayload("corrections", p, KINDS));
    expect(why.match(/"k\d\d/g)).toHaveLength(12);
    expect(why).toMatch(/ and 28 more$/);
    inert(why);
  });

  it("a hostile value under any key is never echoed", () => {
    for (const [kind, base] of [["corrections", good()], ["ruling", rulingAtt()], ["rulings-index", indexAtt()]]) {
      for (const k of KINDS.kinds[kind].keys) {
        const why = refusal(() => validatePayload(kind, { ...base, [k]: HOSTILE_NAMES[0] }, KINDS));
        expect(why, `${kind}.${k}`).toMatch(new RegExp(`^REFUSED kind=${kind}: `));
        expect(why, `${kind}.${k}`).not.toContain("FORGED");
        expect(why.split("\n"), `${kind}.${k}`).toHaveLength(1);
        inert(why, `${kind}.${k}`);
      }
    }
    // A hostile kind is quoted the same way.
    const kindWhy = refusal(() => validatePayload("corrections\n::error::x\nSIGNED y", good(), KINDS));
    expect(kindWhy).toMatch(/^REFUSED: unknown kind "corrections\\u000a\\u003a\\u003aerror/);
    inert(kindWhy);
  });

  it("run(): one line per payload, each starting 'payload N of M', and no network call", async () => {
    const payloads = HOSTILE_NAMES.map(withKey);
    const r = await attempt("corrections", payloads);
    const got = r.error.split("\n");
    expect(got).toHaveLength(payloads.length);
    got.forEach((line, i) => expect(line.startsWith(`payload ${i + 1} of ${payloads.length}: REFUSED kind=corrections: extra key(s): "`), line).toBe(true));
    inert(r.error);
    expect(r.calls.total).toBe(0);
    expect(r.lines).toEqual([]);
    expect(r.files).toEqual([]);
    const unknown = await attempt("corrections\n::error::x\nSIGNED y", [good()]);
    expect(unknown.error.split("\n")).toHaveLength(1);
    inert(unknown.error);
    expect(unknown.calls.total).toBe(0);
  });

  it("the entry script, run as the job runs it: every line of the refusal starts FAILED, and nothing else is printed", { timeout: 30_000 }, () => {
    const spawn = (kind, payloads) => {
      const out = path.join(tmp(), "out");
      const env = {
        PATH: process.env.PATH, KIND: kind, PAYLOADS_B64: b64(payloads), BOARD_SIGN_URL: SIGN_URL, OUT_DIR: out,
        // A closed local port: had the script asked for a token, the refusal would say so.
        ACTIONS_ID_TOKEN_REQUEST_URL: "http://127.0.0.1:9/token?api-version=2", ACTIONS_ID_TOKEN_REQUEST_TOKEN: REQ_TOKEN,
      };
      const r = spawnSync(process.execPath, ["scripts/sign-attest/sign.mjs"], { cwd: REPO, env, encoding: "utf8" });
      expect(fs.existsSync(out)).toBe(false);
      return r;
    };
    const payloads = HOSTILE_NAMES.map(withKey);
    const r = spawn("corrections", payloads);
    expect(r.status).toBe(1);
    expect(r.stdout).toBe("");
    const got = r.stderr.split("\n");
    expect(got.pop()).toBe(""); // the output ends with one newline
    expect(got).toHaveLength(payloads.length);
    got.forEach((line, i) => expect(line.startsWith(`${FAILED_PREFIX}payload ${i + 1} of ${payloads.length}: REFUSED kind=corrections: extra key(s): "`), line).toBe(true));
    inert(r.stderr);
    expect(r.stderr).not.toContain(REQ_TOKEN);

    const k = spawn("corrections\n::error::x\nSIGNED y\nCLAIMS z", [good()]);
    expect(k.status).toBe(1);
    expect(k.stdout).toBe("");
    expect(k.stderr.split("\n")).toHaveLength(2);
    expect(k.stderr.startsWith(`${FAILED_PREFIX}REFUSED: unknown kind "corrections\\u000a`)).toBe(true);
    inert(k.stderr);
  });

  it("failureLines: the prefix is on every line, whatever the message holds", () => {
    const nasty = "a\n::error::b\n  ::warning::c\nSIGNED d\nCLAIMS {}\nWROTE 1\nCHECKED kind=x\nx ##[error]y\r::z\u2028CLAIMS q\n";
    const out = failureLines(nasty);
    const got = out.split("\n");
    expect(got).toHaveLength(nasty.split("\n").length);
    for (const line of got) expect(line.startsWith(FAILED_PREFIX), line).toBe(true);
    inert(out);
    expect(failureLines(NO_OIDC)).toBe(`FAILED: ${NO_OIDC}`);
    expect(FAILED_PREFIX).toBe("FAILED: ");
  });

  it("text from the signer is quoted: a reply cannot add a line either", async () => {
    const hostileReply = () => `busy\n${FORGED_SIGNED}\n::error::x\r\nCLAIMS {}`;
    const r = await attempt("corrections", [good()], { rawReply: hostileReply, status: 503 });
    const got = r.error.split("\n");
    expect(got).toHaveLength(2);
    expect(got[0]).toMatch(/^payload 1 of 1: board-sign answered HTTP 503 "busy\\n/);
    expect(got[1]).toMatch(/^nothing was written\. /);
    inert(r.error);
    inert(failureLines(r.error));
    expect(r.lines.filter((l) => RECORD_WORD.test(l)).map((l) => l.split(" ")[0])).toEqual(["CHECKED", "CLAIMS"]);
    // The same text inside a 200 reply that fails a check is quoted too, and cut at 80 characters.
    const ok200 = await attempt("corrections", [good()], { editReply: (reply) => ({ ...reply, did: hostileReply(), signer_auth: hostileReply() }) });
    expect(ok200.error.split("\n")).toHaveLength(2);
    inert(ok200.error);
  });
});

describe("signed_at must be a real time, close to this job's clock", () => {
  const NOW = Date.parse("2026-10-13T07:15:00Z");
  const dated = (iso, base = committedCorrections()) => ({ ...base, signed_at: iso });
  const why = (iso, nowMs = NOW) => refusal(() => validatePayload("corrections", dated(iso), KINDS, { nowMs }));

  it("isInstant: the shape, and a time that really happened", () => {
    for (const ok of ["2026-10-13T07:15:00Z", "2024-02-29T23:59:59Z", "1999-01-01T00:00:00Z", "2099-12-31T00:00:00Z"]) expect(isInstant(ok), ok).toBe(true);
    for (const no of [
      "2026-99-99T99:99:99Z", "2026-02-30T00:00:00Z", "2025-02-29T00:00:00Z", "2026-13-01T00:00:00Z", "2026-10-13T24:00:00Z",
      "2026-10-13T07:60:00Z", "2026-10-13T07:15:60Z", "2026-10-13T07:15:00.000Z", "2026-10-13T07:15:00+00:00", "2026-10-13 07:15:00Z",
      "2026-10-13T07:15:00Z\n", "2026-10-13", "", null, undefined, 1760339700, {}, ["2026-10-13T07:15:00Z"],
    ]) expect(isInstant(no), String(no)).toBe(false);
  });

  it("a time that never happened is refused with or without a clock, in every kind", () => {
    for (const never of ["2026-99-99T99:99:99Z", "2026-02-30T00:00:00Z", "2026-10-13T24:00:00Z"]) {
      expect(refusal(() => validatePayload("corrections", dated(never), KINDS)), never).toBe("REFUSED kind=corrections: signed_at is not a real UTC time written YYYY-MM-DDTHH:MM:SSZ");
      expect(refusal(() => validatePayload("ruling", dated(never, rulingAtt()), KINDS)), never).toMatch(/signed_at is not a real UTC time/);
      expect(refusal(() => validatePayload("rulings-index", dated(never, indexAtt()), KINDS)), never).toMatch(/signed_at is not a real UTC time/);
      // With a clock there is still one reason about signed_at, not two.
      expect(why(never).match(/signed_at/g), never).toHaveLength(1);
    }
  });

  it("with the job's clock: at most a day old, at most five minutes ahead", () => {
    expect(why("2026-10-13T07:15:00Z")).toBe("");
    expect(why("2026-10-12T07:15:00Z")).toBe(""); // a day old, to the second
    expect(why("2026-10-13T07:20:00Z")).toBe(""); // five minutes ahead, to the second
    expect(why("2026-10-12T07:14:59Z")).toBe("REFUSED kind=corrections: signed_at is 86401 seconds before this job's clock; the limit is 86400. Emit the payload again");
    expect(why("2026-10-13T07:20:01Z")).toBe("REFUSED kind=corrections: signed_at is 301 seconds ahead of this job's clock; the limit is 300");
    // The three dates the review tried.
    expect(why("1999-01-01T00:00:00Z")).toMatch(/signed_at is \d+ seconds before this job's clock/);
    expect(why("2099-01-01T00:00:00Z")).toMatch(/signed_at is \d+ seconds ahead of this job's clock/);
    expect(why("2026-99-99T99:99:99Z")).toMatch(/signed_at is not a real UTC time/);
    // The same rule for the other two kinds.
    for (const [kind, base] of [["ruling", rulingAtt()], ["rulings-index", indexAtt()]]) {
      expect(validatePayload(kind, dated("2026-10-13T07:00:00Z", base), KINDS, { nowMs: NOW }).kind).toBe(kind);
      expect(refusal(() => validatePayload(kind, dated("2026-10-11T07:00:00Z", base), KINDS, { nowMs: NOW })), kind).toMatch(/seconds before this job's clock/);
      expect(refusal(() => validatePayload(kind, dated("2026-10-13T08:00:00Z", base), KINDS, { nowMs: NOW })), kind).toMatch(/seconds ahead of this job's clock/);
    }
  });

  it("freshnessDefect fails closed: no limits, no clock, no date", () => {
    const p = dated("2026-10-13T07:15:00Z");
    expect(freshnessDefect(p, KINDS, NOW)).toBe(null);
    expect(freshnessDefect(p, { ...KINDS, signed_at_max_age_seconds: undefined }, NOW)).toMatch(/no signed_at limits/);
    expect(freshnessDefect(p, {}, NOW)).toMatch(/no signed_at limits/);
    expect(freshnessDefect(p, KINDS, NaN)).toMatch(/clock is unreadable/);
    expect(freshnessDefect(p, KINDS, undefined)).toMatch(/clock is unreadable/);
    const { signed_at: _gone, ...undatedPayload } = p;
    expect(freshnessDefect(undatedPayload, KINDS, NOW)).toMatch(/not a real UTC time/);
    expect(freshnessDefect(null, KINDS, NOW)).toMatch(/not a real UTC time/);
  });

  it("run() judges every payload by the clock before any network call", async () => {
    const cases = [
      ["1999-01-01T00:00:00Z", /payload 1 of 1: REFUSED kind=corrections: signed_at is \d+ seconds before this job's clock/],
      ["2099-01-01T00:00:00Z", /payload 1 of 1: REFUSED kind=corrections: signed_at is \d+ seconds ahead of this job's clock/],
      ["2026-99-99T99:99:99Z", /payload 1 of 1: REFUSED kind=corrections: signed_at is not a real UTC time/],
      ["2026-10-12T07:14:59Z", /signed_at is 86401 seconds before/],
    ];
    for (const [iso, reason] of cases) {
      const r = await attempt("corrections", [dated(iso)], { nowMs: NOW });
      expect(r.error, iso).toMatch(reason);
      expect(r.calls.total, iso).toBe(0);
      expect(r.files, iso).toEqual([]);
      expect(r.lines, iso).toEqual([]);
    }
    // Only the last of three is stale: still nothing is asked of anyone.
    const mixed = await attempt("ruling", [rulingAtt(0), rulingAtt(1), dated("2026-10-01T00:00:00Z", rulingAtt(2))]);
    expect(mixed.error).toMatch(/^payload 3 of 3: REFUSED kind=ruling: signed_at is \d+ seconds before this job's clock/);
    expect(mixed.calls.total).toBe(0);
    // A broken clock refuses everything.
    const noClock = await attempt("corrections", [dated("2026-10-13T07:15:00Z")], { nowMs: NaN });
    expect(noClock.error).toMatch(/clock is unreadable/);
    expect(noClock.calls.total).toBe(0);
  });

  it("with no clock passed, run() uses the real one", async () => {
    const key = keyPair();
    const go = async (payload) => {
      const net = stubNetwork(key);
      const outDir = path.join(tmp(), "out");
      let error = "";
      let receipt = null;
      try {
        receipt = await run({ env: runEnv("corrections", [payload]), fetchImpl: net.fetchImpl, outDir, log: () => {}, pinnedKeyHex: key.pubHex });
      } catch (e) {
        error = String(e.message);
      }
      return { error, receipt, net };
    };
    // A date long past: the real clock refuses it. (Not the committed attestation: on the day
    // the ledger is re-signed that one is fresh, and this test must not fail on that day.)
    const old = await go(dated("1999-01-01T00:00:00Z"));
    expect(old.error).toMatch(/signed_at is \d+ seconds before this job's clock; the limit is 86400/);
    expect(old.net.calls.total).toBe(0);
    // The same body dated now is signed, and the receipt records the clock it was judged by.
    const nowIso = new Date().toISOString().replace(/\.\d{3}Z$/, "Z");
    const fresh = await go(dated(nowIso));
    expect(fresh.error).toBe("");
    expect(fresh.receipt.signatures).toHaveLength(1);
    expect(Math.abs(Date.parse(fresh.receipt.checked_at) - Date.now())).toBeLessThan(60_000);
  });

  it("the producers date their payloads now, so their own output passes the real clock", { timeout: 30_000 }, () => {
    const att = emittedCorrections();
    expect(isInstant(att.signed_at)).toBe(true);
    expect(validatePayload("corrections", att, KINDS, { nowMs: Date.now() }).kind).toBe("corrections");
    expect(Math.abs(Date.now() - Date.parse(att.signed_at))).toBeLessThan(60_000);
  });
});

describe("no OIDC, no signature", () => {
  it("without the runner's two token variables: the named error and zero fetch calls", async () => {
    for (const drop of ["ACTIONS_ID_TOKEN_REQUEST_URL", "ACTIONS_ID_TOKEN_REQUEST_TOKEN"]) {
      const r = await attempt("corrections", [committedCorrections()], {}, { [drop]: "" });
      expect(r.error).toBe("OIDC unavailable - refuse laptop sign");
      expect(r.error).toBe(NO_OIDC);
      expect(r.calls.total).toBe(0);
      expect(r.files).toEqual([]);
    }
  });

  it("signOne alone refuses the same way and asks for no token", async () => {
    const key = keyPair();
    const net = stubNetwork(key);
    await expect(signOne({ payload: committedCorrections(), env: {}, fetchImpl: net.fetchImpl, pinnedKeyHex: key.pubHex, didKeyHex: key.pubHex }))
      .rejects.toThrow(NO_OIDC);
    expect(net.calls.token).toHaveLength(0);
    expect(net.calls.sign).toHaveLength(0);
  });

  it("the entry script, run on a machine with no runner variables, exits 1 and writes nothing", { timeout: 30_000 }, () => {
    const out = path.join(tmp(), "out");
    // The producer's own payload, dated now: this run is judged by the real clock.
    const env = { PATH: process.env.PATH, KIND: "corrections", PAYLOADS_B64: b64([emittedCorrections()]), OUT_DIR: out };
    const r = spawnSync(process.execPath, ["scripts/sign-attest/sign.mjs"], { cwd: REPO, env, encoding: "utf8" });
    expect(r.status).toBe(1);
    expect(r.stderr).toBe(`${FAILED_PREFIX}${NO_OIDC}\n`);
    expect(r.stdout).toMatch(/^CHECKED kind=corrections payloads=1 bytes=\d+ \(before any network call\)\n$/);
    expect(fs.existsSync(out)).toBe(false);
  });

  it("a token is never sent to another address", async () => {
    const elsewhere = { BOARD_SIGN_URL: "https://example.invalid/api/board-sign" };
    const r = await attempt("corrections", [committedCorrections()], {}, elsewhere);
    expect(r.error).toMatch(/BOARD_SIGN_URL must be https:\/\/councilof\.ai\/api\/board-sign/);
    expect(r.calls.total).toBe(0);
    // signOne holds the same rule on its own: no token is even requested.
    const key = keyPair();
    const net = stubNetwork(key);
    await expect(signOne({ payload: committedCorrections(), env: runEnv("corrections", [], elsewhere), fetchImpl: net.fetchImpl, pinnedKeyHex: key.pubHex }))
      .rejects.toThrow(/BOARD_SIGN_URL must be/);
    expect(net.calls.total).toBe(0);
  });
});

describe("pickClaims", () => {
  it("returns the printable claims and the lifetime, and nothing else", () => {
    const c = pickClaims(makeJwt(1));
    expect(Object.keys(c).sort()).toEqual([...CLAIM_NAMES, "exp_minus_iat"].sort());
    expect(CLAIM_NAMES).toEqual([
      "job_workflow_ref", "workflow_ref", "workflow", "ref", "ref_type", "sha", "event_name",
      "repository_id", "repository_owner_id", "run_id", "run_attempt", "aud",
    ]);
    expect(c.job_workflow_ref).toBe(CLAIMS.job_workflow_ref);
    expect(c.ref).toBe("refs/heads/master");
    expect(c.aud).toBe(AUDIENCE);
    expect(c.exp_minus_iat).toBe(300);
    expect(JSON.stringify(c)).not.toContain("stub-jti");
    expect(JSON.stringify(c)).not.toContain(TOKEN_MARK);
  });

  it("an absent or unprintable claim is null, and a non-token is refused without being echoed", () => {
    const odd = `${seg({ alg: "RS256" })}.${seg({ ref: { nested: true }, aud: ["a", "b"], iat: 5 })}.${seg("s")}`;
    const c = pickClaims(odd);
    expect(c.ref).toBe(null);
    expect(c.aud).toEqual(["a", "b"]);
    expect(c.workflow).toBe(null);
    expect(c.exp_minus_iat).toBe(null);
    for (const junk of ["", "opaque-static-bearer-value", "a.b", `x.${seg("not json")}.y`]) {
      const why = refusal(() => pickClaims(junk));
      expect(why).not.toBe("");
      if (junk) expect(why).not.toContain(junk);
    }
  });
});

describe("a reply that fails any check is not kept", () => {
  const one = () => [committedCorrections()];
  const nothingKept = (r) => {
    expect(r.files).toEqual([]);
    expect(fs.existsSync(r.outDir)).toBe(false);
    expect(r.receipt).toBe(null);
    expect(r.lines.filter((l) => l.startsWith("SIGNED"))).toEqual([]);
    expect(r.error).toMatch(/nothing was written/);
  };

  it("the signer hashed other bytes (digest mismatch)", async () => {
    const r = await attempt("corrections", one(), { editReply: (reply) => ({ ...reply, payload_sha256: "0".repeat(64) }) });
    expect(r.error).toMatch(/preimage disagreement/);
    expect(r.calls.sign).toHaveLength(1);
    nothingKept(r);
  });

  it("a signature from another key", async () => {
    const r = await attempt("corrections", one(), { signWith: keyPair().privateKey });
    expect(r.error).toMatch(/does not verify under the pinned board key/);
    nothingKept(r);
  });

  it("signer_auth other than github-oidc, even though the signature itself is good", async () => {
    const r = await attempt("corrections", one(), { signerAuth: "pod-token" });
    expect(r.error).toMatch(/signer_auth is "pod-token", expected "github-oidc"/);
    nothingKept(r);
    nothingKept(await attempt("corrections", one(), { editReply: (reply) => { delete reply.signer_auth; return reply; } }));
  });

  it("another DID, a non-200 answer, a reply that is not JSON, a reply with no signature", async () => {
    const did = await attempt("corrections", one(), { did: "did:web:csoai.org#card-attestation-1" });
    expect(did.error).toMatch(/the signer named "did:web:csoai\.org#card-attestation-1"/);
    nothingKept(did);
    const http = await attempt("corrections", one(), { failOn: 1 });
    expect(http.error).toMatch(/board-sign answered HTTP 401/);
    nothingKept(http);
    const html = await attempt("corrections", one(), { rawReply: () => "<html>busy</html>" });
    expect(html.error).toMatch(/reply is not JSON/);
    nothingKept(html);
    const nosig = await attempt("corrections", one(), { editReply: (reply) => ({ ...reply, sig_ed25519: "" }) });
    expect(nosig.error).toMatch(/no 64-byte hex signature/);
    nothingKept(nosig);
  });

  it("the DID document no longer publishes the pinned key: nothing is sent to the signer at all", async () => {
    const r = await attempt("corrections", one(), { didKeyHex: keyPair().pubHex });
    expect(r.error).toMatch(/not the pinned .*nothing was sent to the signer/);
    expect(r.calls.did).toBe(1);
    expect(r.calls.token).toHaveLength(0);
    expect(r.calls.sign).toHaveLength(0);
    expect(r.files).toEqual([]);
  });

  it("a DID document of the wrong shape stops the run in plain words, before any token is asked for", async () => {
    const boardKey = (x) => JSON.stringify({ verificationMethod: [null, 7, { id: 5 }, { id: BOARD_DID, publicKeyJwk: { x } }] });
    const cases = [
      ["<html>busy</html>", /did not return JSON/],
      ["null", /carries no verificationMethod list/],
      ["[]", /carries no verificationMethod list/],
      ['"text"', /carries no verificationMethod list/],
      [JSON.stringify({ verificationMethod: { find: 1 } }), /carries no verificationMethod list/],
      [JSON.stringify({ verificationMethod: [] }), /no 32-byte publicKeyJwk\.x/],
      [JSON.stringify({ verificationMethod: [{ id: "did:web:csoai.org#some-other-key", publicKeyJwk: { x: "A".repeat(43) } }] }), /no 32-byte publicKeyJwk\.x/],
      [JSON.stringify({ verificationMethod: [{ id: BOARD_DID }] }), /no 32-byte publicKeyJwk\.x/],
      [JSON.stringify({ verificationMethod: [{ id: BOARD_DID, publicKeyJwk: "x" }] }), /no 32-byte publicKeyJwk\.x/],
      [boardKey(12345), /no 32-byte publicKeyJwk\.x/],
      [boardKey({ nested: true }), /no 32-byte publicKeyJwk\.x/],
      [boardKey("short"), /no 32-byte publicKeyJwk\.x/],
      [boardKey(`${"A".repeat(42)}\n::error::x`), /no 32-byte publicKeyJwk\.x/],
    ];
    for (const [didDoc, reason] of cases) {
      const r = await attempt("corrections", one(), { didDoc });
      expect(r.error, didDoc).toMatch(reason);
      expect(r.error, didDoc).not.toMatch(/is not a function|Cannot read|undefined|must be of type/);
      expect(r.error.split("\n"), didDoc).toHaveLength(1);
      expect(r.calls.did, didDoc).toBe(1);
      expect(r.calls.token, didDoc).toHaveLength(0);
      expect(r.calls.sign, didDoc).toHaveLength(0);
      expect(r.files, didDoc).toEqual([]);
    }
    // The request for the DID document carries no credential.
    const ok = await attempt("corrections", one());
    expect(Object.keys(ok.calls.didInit.headers).sort()).toEqual(["accept", "user-agent"]);
  });

  it("a reply that repeats the job's token, or any part of it, is refused whole", async () => {
    const part = (n, i) => makeJwt(n).split(".")[i];
    const echoes = {
      "the whole token, as a request header would carry it": (reply, n) => ({ ...reply, caller: { authorization: `Bearer ${makeJwt(n)}` } }),
      "the signature part": (reply, n) => ({ ...reply, debug: part(n, 2) }),
      "the claims part": (reply, n) => ({ ...reply, debug: [part(n, 1)] }),
      "the header part": (reply, n) => ({ ...reply, note: `saw ${part(n, 0)}` }),
      "the runner's request token": (reply) => ({ ...reply, debug: REQ_TOKEN }),
    };
    for (const [what, editReply] of Object.entries(echoes)) {
      const r = await attempt("corrections", one(), { editReply });
      expect(r.error, what).toMatch(/payload 1 of 1: the board-sign reply repeats this job's token or a part of it; the reply is not kept/);
      nothingKept(r);
      tokenFree(r);
    }
    // The claims part written with JSON escapes: the reply text does not hold it, the parsed reply does.
    const escaped = await attempt("corrections", one(), {
      editReply: (reply, n) => ({ ...reply, debug: part(n, 1) }),
      editRaw: (text, n) => {
        const out = text.replace(/e/g, "\\u0065");
        expect(out).not.toContain(part(n, 1));
        expect(JSON.stringify(JSON.parse(out))).toContain(part(n, 1));
        return out;
      },
    });
    expect(escaped.error).toMatch(/repeats this job's token/);
    nothingKept(escaped);
    tokenFree(escaped);
    // The other way round: a key written twice. The parsed reply keeps the last value and holds
    // no token, but the text that would be written to the artifact does.
    const twice = await attempt("corrections", one(), {
      editRaw: (text, n) => {
        const out = text.replace(/^\{/, `{"debug":"${part(n, 2)}","debug":"overwritten",`);
        expect(JSON.stringify(JSON.parse(out))).not.toContain(part(n, 2));
        expect(out).toContain(part(n, 2));
        return out;
      },
    });
    expect(twice.error).toMatch(/repeats this job's token/);
    nothingKept(twice);
    tokenFree(twice);
    // In a run of two, the echo on the second discards the first as well.
    const second = await attempt("ruling", [rulingAtt(0), rulingAtt(1)], { editReply: (reply, n) => (n === 2 ? { ...reply, debug: part(n, 2) } : reply) });
    expect(second.error).toMatch(/payload 2 of 2: the board-sign reply repeats this job's token/);
    expect(second.files).toEqual([]);
    tokenFree(second);
    // A reply with an extra field that holds no credential is still kept, as received.
    const extra = await attempt("corrections", one(), { editReply: (reply) => ({ ...reply, caller: { workflow: "hf-fin-shells-attest", ref: "refs/heads/master" } }) });
    expect(extra.error).toBe("");
    expect(extra.files).toHaveLength(3);
    tokenFree(extra);
  });

  it("both altered-preimage controls are evaluated, and a verifier that cannot say no is refused", async () => {
    const key = keyPair();
    const env = runEnv("corrections", one());
    const good = await signOne({ payload: committedCorrections(), env, fetchImpl: stubNetwork(key).fetchImpl, pinnedKeyHex: key.pubHex });
    expect(good.controls).toEqual({ appended_space_rejected: true, changed_field_rejected: true });

    const seen = [];
    const yes = (msg) => { seen.push(msg); return true; };
    await expect(signOne({ payload: committedCorrections(), env, fetchImpl: stubNetwork(key).fetchImpl, pinnedKeyHex: key.pubHex, verifyImpl: yes }))
      .rejects.toThrow(/an altered preimage verified/);
    const canonical = canonSigner(committedCorrections());
    expect(seen).toHaveLength(3);
    expect(seen[0]).toBe(canonical);
    expect(seen[1]).toBe(`${canonical} `);
    expect(seen[2]).not.toBe(canonical);
    expect(JSON.parse(seen[2]).artifact).toBe(`${committedCorrections().artifact}x`);

    // The real verifier, asked directly: the signed bytes pass and each altered one fails.
    expect(verifyRaw(canonical, good.reply.sig_ed25519, key.pubHex)).toBe(true);
    expect(verifyRaw(`${canonical} `, good.reply.sig_ed25519, key.pubHex)).toBe(false);
    expect(verifyRaw(seen[2], good.reply.sig_ed25519, key.pubHex)).toBe(false);
    expect(verifyRaw(canonical, good.reply.sig_ed25519, keyPair().pubHex)).toBe(false);
    expect(verifyRaw(canonical, "zz", key.pubHex)).toBe(false);
  });

  it("the second of two payloads fails: neither is written, and the error names the signature already returned", async () => {
    const payloads = [rulingAtt(0), rulingAtt(1)];
    const r = await attempt("ruling", payloads, { failOn: 2 });
    expect(r.calls.sign).toHaveLength(2);
    expect(r.error).toMatch(/payload 2 of 2: board-sign answered HTTP 401/);
    expect(r.error).toContain(`discarded: ${sha256(canonSigner(payloads[0]))}`);
    expect(r.files).toEqual([]);
    expect(fs.existsSync(r.outDir)).toBe(false);
    // The log still records the signature that was issued before the failure.
    expect(r.lines.filter((l) => l.startsWith("SIGNED"))).toHaveLength(1);
  });

  it("an output directory that already holds files is refused before any network call", async () => {
    const key = keyPair();
    const net = stubNetwork(key);
    const outDir = tmp();
    fs.writeFileSync(path.join(outDir, "old.json"), "{}");
    await expect(run({ env: runEnv("corrections", one()), fetchImpl: net.fetchImpl, outDir, log: () => {}, pinnedKeyHex: key.pubHex, now: () => clockFor(one()) }))
      .rejects.toThrow(/is not empty/);
    expect(net.calls.total).toBe(0);
  });
});

describe("a reply that passes every check is kept, and the token is not", () => {

  it("one corrections payload: three files, a signature that verifies, one CLAIMS line, one SIGNED line", { timeout: 30_000 }, async () => {
    const att = emittedCorrections();
    const canonical = canonSigner(att);
    const digest = sha256(canonical);
    const r = await attempt("corrections", [att]);
    expect(r.error).toBe("");
    expect(r.files).toEqual([`1-${digest}.payload.json`, `${digest}.board-sign.json`, "receipt.json"].sort());

    // The payload file is the signed preimage byte for byte; the reply file is the signer's reply.
    const payloadBytes = fs.readFileSync(path.join(r.outDir, `1-${digest}.payload.json`), "utf8");
    expect(payloadBytes).toBe(canonical);
    expect(sha256(payloadBytes)).toBe(digest);
    const reply = JSON.parse(fs.readFileSync(path.join(r.outDir, `${digest}.board-sign.json`), "utf8"));
    expect(Object.keys(reply).sort()).toEqual(["did", "note", "payload_sha256", "schema", "sig_ed25519", "signed_at", "signer_auth"]);
    expect(reply.payload_sha256).toBe(digest);
    expect(reply.did).toBe(BOARD_DID);
    expect(reply.signer_auth).toBe("github-oidc");
    expect(verifyRaw(payloadBytes, reply.sig_ed25519, r.key.pubHex)).toBe(true);
    expect(verifyRaw(payloadBytes, reply.sig_ed25519, PINNED_KEY_HEX)).toBe(false); // a throwaway key, not the board's

    const receipt = JSON.parse(fs.readFileSync(path.join(r.outDir, "receipt.json"), "utf8"));
    expect(receipt).toEqual(r.receipt);
    expect(receipt).toMatchObject({
      kind: "corrections", run_id: "424242", run_attempt: "1", commit: "c".repeat(40),
      repository: "CSOAI-ORG/councilof-ai", ref: "refs/heads/master", did: BOARD_DID, key_ed25519_hex: r.key.pubHex,
    });
    expect(receipt.claims.job_workflow_ref).toBe(CLAIMS.job_workflow_ref);
    expect(receipt.signatures).toHaveLength(1);
    expect(receipt.signatures[0]).toMatchObject({
      n: 1, kind: "corrections", schema: "csoai.corrections-attestation/0.1", bytes: Buffer.byteLength(canonical),
      payload_sha256: digest, sig_ed25519: reply.sig_ed25519, signer_auth: "github-oidc", did: BOARD_DID,
      payload_file: `1-${digest}.payload.json`, reply_file: `${digest}.board-sign.json`,
      controls: { appended_space_rejected: true, changed_field_rejected: true },
    });

    const claims = r.lines.filter((l) => l.startsWith("CLAIMS "));
    expect(claims).toHaveLength(1);
    expect(Object.keys(JSON.parse(claims[0].slice(7))).sort()).toEqual([...CLAIM_NAMES, "exp_minus_iat"].sort());
    const signedLines = r.lines.filter((l) => l.startsWith("SIGNED "));
    expect(signedLines).toEqual([
      `SIGNED kind=corrections schema=csoai.corrections-attestation/0.1 bytes=${Buffer.byteLength(canonical)} payload_sha256=${digest} signer_auth=github-oidc signed_at=2026-10-13T07:15:01.123Z`,
    ]);
    // CLAIMS is printed before the signer is asked, so a refused token can still be diagnosed.
    expect(r.lines.findIndex((l) => l.startsWith("CLAIMS "))).toBeLessThan(r.lines.findIndex((l) => l.startsWith("SIGNED ")));
    // The whole log of a good run: four record lines, each one line of printable ASCII.
    expect(r.lines.map((l) => l.split(" ")[0])).toEqual(["CHECKED", "CLAIMS", "SIGNED", "WROTE"]);
    for (const l of r.lines) expect(l).toMatch(/^[\x20-\x7e]+$/);
    // The receipt records the clock the date rule was judged by.
    expect(receipt.checked_at).toBe(new Date(clockFor([att])).toISOString());
    tokenFree(r);
  });

  it("asks the way the signer expects: audience, fresh token per payload, browser-like agent, {payload} body", async () => {
    const payloads = [rulingAtt(0), rulingAtt(1), rulingAtt(2)];
    const r = await attempt("ruling", payloads);
    expect(r.error).toBe("");
    expect(r.calls.did).toBe(1);
    expect(r.calls.other).toEqual([]);
    expect(r.calls.token).toHaveLength(3);
    for (const t of r.calls.token) {
      expect(t.url).toBe(`${REQ_URL}&audience=${encodeURIComponent("https://councilof.ai/api/board-sign")}`);
      expect(t.headers.authorization).toBe(`Bearer ${REQ_TOKEN}`);
      expect(t.redirect).toBe("error"); // a credential is never followed across a redirect
    }
    expect(r.calls.sign).toHaveLength(3);
    r.calls.sign.forEach((s, i) => {
      expect(s.method).toBe("POST");
      expect(s.headers.authorization).toBe(`Bearer ${r.tokens[i]}`);
      expect(s.headers["user-agent"]).toMatch(/^Mozilla\/5\.0 /);
      expect(s.headers["user-agent"]).toBe(USER_AGENT);
      expect(s.headers["content-type"]).toBe("application/json");
      expect(s.redirect).toBe("error");
      expect(s.body).toEqual({ payload: payloads[i] });
    });
    expect(new Set(r.tokens).size).toBe(3);

    expect(r.files).toHaveLength(7);
    expect(r.lines.filter((l) => l.startsWith("CLAIMS "))).toHaveLength(1);
    expect(r.lines.filter((l) => l.startsWith("SIGNED kind=ruling schema=csoai.ruling-attestation/0.1 "))).toHaveLength(3);
    r.receipt.signatures.forEach((s, i) => {
      const canonical = canonSigner(payloads[i]);
      expect(s.payload_sha256).toBe(sha256(canonical));
      expect(s.n).toBe(i + 1);
      expect(fs.readFileSync(path.join(r.outDir, s.payload_file), "utf8")).toBe(canonical);
      const reply = JSON.parse(fs.readFileSync(path.join(r.outDir, s.reply_file), "utf8"));
      expect(verifyRaw(canonical, reply.sig_ed25519, r.key.pubHex)).toBe(true);
    });
    tokenFree(r);
  });

  it("a token request address with no query string gets ?audience=", async () => {
    const r = await attempt("rulings-index", [indexAtt()], {}, { ACTIONS_ID_TOKEN_REQUEST_URL: REQ_URL.split("?")[0] });
    expect(r.error).toBe("");
    expect(r.calls.token[0].url).toBe(`${REQ_URL.split("?")[0]}?audience=${encodeURIComponent(AUDIENCE)}`);
    expect(r.files).toHaveLength(3);
    tokenFree(r);
  });

  it("a refusal never carries the token either", async () => {
    const leaky = (n) => JSON.stringify({ error: "echo", saw: `Bearer ${makeJwt(n)}` });
    const r = await attempt("corrections", [committedCorrections()], { rawReply: leaky, status: 500 });
    expect(r.error).toMatch(/board-sign answered HTTP 500/);
    expect(r.error).toContain("[redacted]");
    tokenFree(r);
    tokenFree(await attempt("corrections", [committedCorrections()], { signerAuth: "pod-token" }));
    tokenFree(await attempt("ruling", [rulingAtt(0), rulingAtt(1)], { failOn: 2 }));
    // A transport error that quotes the request header: the message is passed on with the token cut out.
    const thrown = await attempt("corrections", [committedCorrections()], { signThrows: true });
    expect(thrown.error).toMatch(/socket closed after sending authorization: Bearer \[redacted\]/);
    expect(thrown.files).toEqual([]);
    tokenFree(thrown);
  });
});

describe("a request that carries a credential does not follow a redirect", () => {
  // Two real local servers and the engine's own fetch, so this is the behaviour of the Node that
  // runs the tests and not of a stub. The token endpoint is the one address this job takes from
  // its environment; the signer's address is fixed in the code and cannot be pointed at a test.
  const listen = (handler) => new Promise((resolve) => {
    const server = http.createServer(handler);
    server.listen(0, "127.0.0.1", () => resolve(server));
  });
  const close = (server) => new Promise((resolve) => {
    server.close(resolve);
    server.closeAllConnections?.(); // do not wait for an idle kept-alive socket
  });

  it("the token endpoint answers with a redirect: it gets one request, the target gets none, nothing is signed", { timeout: 30_000 }, async () => {
    const seen = { first: [], target: [] };
    const target = await listen((req, res) => {
      seen.target.push(req.headers.authorization || "(no authorization)");
      res.writeHead(200, { "content-type": "application/json" });
      res.end(JSON.stringify({ value: makeJwt(99) }));
    });
    const first = await listen((req, res) => {
      seen.first.push(req.headers.authorization || "(no authorization)");
      const u = new URL(req.url, "http://127.0.0.1");
      const where = u.searchParams.get("to") === "same" ? `/moved?api-version=2` : `http://localhost:${target.address().port}/token?api-version=2`;
      if (u.pathname === "/moved") {
        res.writeHead(200, { "content-type": "application/json" });
        res.end(JSON.stringify({ value: makeJwt(98) }));
        return;
      }
      res.writeHead(Number(u.searchParams.get("status")), { location: where });
      res.end();
    });
    try {
      const base = `http://127.0.0.1:${first.address().port}`;
      for (const to of ["other", "same"]) {
        for (const status of [301, 302, 303, 307, 308]) {
          seen.first.length = 0;
          seen.target.length = 0;
          const r = await attempt("corrections", [committedCorrections()], {
            fetchImpl: (net) => (url, init) => (String(url).startsWith(base) ? fetch(url, init) : net.fetchImpl(url, init)),
          }, { ACTIONS_ID_TOKEN_REQUEST_URL: `${base}/token?status=${status}&to=${to}` });
          const what = `${status} to ${to} origin`;
          expect(r.error, what).toMatch(/^payload 1 of 1: /);
          expect(r.error, what).toMatch(/nothing was written/);
          expect(seen.first, what).toEqual([`Bearer ${REQ_TOKEN}`]); // asked once, never again
          expect(seen.target, what).toEqual([]);
          expect(r.calls.sign, what).toHaveLength(0);
          expect(r.files, what).toEqual([]);
          expect(r.error, what).not.toContain(REQ_TOKEN);
        }
      }
      // The same endpoint answering 200 directly is used: the servers themselves are sound.
      const direct = await attempt("corrections", [committedCorrections()], {
        fetchImpl: (net) => (url, init) => (String(url).startsWith(base) ? fetch(url, init) : net.fetchImpl(url, init)),
      }, { ACTIONS_ID_TOKEN_REQUEST_URL: `${base}/moved?api-version=2` });
      expect(direct.error).toBe("");
      expect(direct.calls.sign).toHaveLength(1);
      expect(direct.calls.sign[0].headers.authorization).toBe(`Bearer ${makeJwt(98)}`);
    } finally {
      await close(first);
      await close(target);
    }
  });
});
