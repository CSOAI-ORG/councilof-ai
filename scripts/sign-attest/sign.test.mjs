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
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  AUDIENCE, BOARD_DID, CLAIM_NAMES, DID_URL, NO_OIDC, PINNED_KEY_HEX, SIGN_URL, USER_AGENT,
  canonSigner, decodePayloads, labelViolation, loadKinds, pickClaims, registryDefects, run, signOne,
  validatePayload, verifyRaw,
} from "./sign.mjs";
import { BOARD_ATTESTATION_DID, PAYLOAD_CAP_BYTES, canonicalBytes, signLabelViolation } from "../../functions/_lib/cardSign.ts";
import { LEDGER } from "../../functions/api/corrections.ts";
import {
  ATTESTATION_SCHEMA, BOARD_KEY_HEX, CLASSES, CONTENT_ID_RULE, INDEX_ATTESTATION_SCHEMA,
  INDEX_CONTENT_ID_RULE, SIGN_CAP, buildAttestation, buildIndexAttestation,
} from "../rulings/ruling-lib.mjs";

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const KINDS = loadKinds();
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
 *   didKeyHex (what the DID document publishes), failOn (the n-th sign call answers 401),
 *   signThrows (the sign call throws an error that quotes the request's Authorization header).
 */
function stubNetwork(key, opts = {}) {
  const calls = { total: 0, token: [], sign: [], did: 0, other: [] };
  const tokens = [];
  const fetchImpl = async (url, init = {}) => {
    calls.total += 1;
    const u = String(url);
    if (u.startsWith(REQ_URL.split("?")[0])) {
      calls.token.push({ url: u, headers: init.headers || {} });
      const t = makeJwt(calls.token.length);
      tokens.push(t);
      return new Response(JSON.stringify({ value: t }), { status: 200 });
    }
    if (u === DID_URL) {
      calls.did += 1;
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
      calls.sign.push({ headers: init.headers || {}, body, method: init.method });
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
      return new Response(JSON.stringify(reply, null, 2), { status: opts.status ?? 200 });
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

/** Run with a stub; return what happened, including everything logged and everything written. */
async function attempt(kind, payloads, opts = {}, envExtra = {}) {
  const key = opts.key ?? keyPair();
  const net = stubNetwork(key, opts);
  const outDir = path.join(tmp(), "out");
  const lines = [];
  let receipt = null;
  let error = "";
  try {
    receipt = await run({ env: runEnv(kind, payloads, envExtra), fetchImpl: net.fetchImpl, outDir, log: (l) => lines.push(String(l)), pinnedKeyHex: opts.pinnedKeyHex ?? key.pubHex });
  } catch (e) {
    error = String(e.message);
  }
  const files = fs.existsSync(outDir) ? fs.readdirSync(outDir).sort() : [];
  return { key, ...net, outDir, lines, receipt, error, files };
}

// ---- tests ---------------------------------------------------------------------------------

describe("kinds.json - the registry", () => {
  it("is usable, holds exactly three kinds, and carries the two limits", () => {
    expect(registryDefects(KINDS)).toEqual([]);
    expect(Object.keys(KINDS.kinds).sort()).toEqual(["corrections", "ruling", "rulings-index"]);
    expect(KINDS.max_payloads).toBe(10);
    expect(KINDS.max_bytes).toBe(3072);
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
    expect(refusal(() => validatePayload("corrections", { ...good(), status: "MEASURED" }, KINDS))).toMatch(/extra key\(s\): status/);
    expect(refusal(() => validatePayload("ruling", { ...rulingAtt(), n: 30 }, KINDS))).toMatch(/extra key\(s\): n/);
    expect(refusal(() => validatePayload("rulings-index", { ...indexAtt(), status: "MEASURED" }, KINDS))).toMatch(/extra key\(s\): status/);
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
      expect(why, kind).toMatch(/extra key\(s\): .*status/);
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
    expect(bad({ signed_at: "2026-10-13T07:15:00.000Z" })).toMatch(/signed_at does not match/);
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
    const wide = { max_payloads: 10, max_bytes: 3072, kinds: { wide: { keys: ["blob"], equals: {}, patterns: { blob: "^a+$" }, integers: [], enums: {} } } };
    expect(validatePayload("wide", { blob: "a".repeat(3072 - 11) }, wide).bytes).toBe(3072);
    expect(refusal(() => validatePayload("wide", { blob: "a".repeat(3072 - 10) }, wide))).toBe("REFUSED kind=wide: 3073 canonical bytes exceeds the 3072 cap");
  });

  it("a never-sign label", () => {
    expect(refusal(() => validatePayload("corrections", { ...good(), note: "a THIN card" }, KINDS))).toMatch(/never-sign label THIN/);
    const loose = { max_payloads: 10, max_bytes: 3072, kinds: { loose: { keys: ["text"], equals: {}, patterns: { text: "^[ -~]+$" }, integers: [], enums: {} } } };
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
    const env = { PATH: process.env.PATH, KIND: "corrections", PAYLOADS_B64: b64([committedCorrections()]), OUT_DIR: out };
    const r = spawnSync(process.execPath, ["scripts/sign-attest/sign.mjs"], { cwd: REPO, env, encoding: "utf8" });
    expect(r.status).toBe(1);
    expect(r.stderr).toContain(NO_OIDC);
    expect(r.stdout).toMatch(/^CHECKED kind=corrections payloads=1 /);
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
    await expect(run({ env: runEnv("corrections", one()), fetchImpl: net.fetchImpl, outDir, log: () => {}, pinnedKeyHex: key.pubHex }))
      .rejects.toThrow(/is not empty/);
    expect(net.calls.total).toBe(0);
  });
});

describe("a reply that passes every check is kept, and the token is not", () => {
  const everythingSeen = (r) => [
    ...r.lines,
    r.error,
    JSON.stringify(r.receipt),
    ...r.files.map((f) => fs.readFileSync(path.join(r.outDir, f), "utf8")),
    ...r.files,
  ].join("\n");
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
    }
    expect(r.calls.sign).toHaveLength(3);
    r.calls.sign.forEach((s, i) => {
      expect(s.method).toBe("POST");
      expect(s.headers.authorization).toBe(`Bearer ${r.tokens[i]}`);
      expect(s.headers["user-agent"]).toMatch(/^Mozilla\/5\.0 /);
      expect(s.headers["user-agent"]).toBe(USER_AGENT);
      expect(s.headers["content-type"]).toBe("application/json");
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
