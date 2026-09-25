#!/usr/bin/env node
/**
 * claim-capture.mjs — the reference implementation of Claim Maintenance v0.1.
 *
 * Specification: https://councilof.ai/spec/claim-maintenance/v0.1/  (CC0 1.0)
 * This file:     MIT, the repository's code licence.
 *
 * A specification with no runnable implementation is a manifesto. This is the runnable part:
 * it captures a claim from a public page, extracts visible text by the spec's §6.3 rules,
 * computes both digests by §6, writes a conforming artifact, and verifies one — including
 * REJECTING an artifact whose bytes have been altered after the digest was taken.
 *
 * It has no dependencies. Node 18+ (global fetch). Anyone can run it against any public page,
 * including against us.
 *
 *   # capture
 *   node scripts/claim-capture.mjs --url https://example.com/ \
 *        --subject "Example Corp" --identifier example.com --identifier-kind domain \
 *        --claim "market leader powering the majority of the sector" \
 *        --plan "majority = >50%; estimable from the public breakdown; capture weekly" \
 *        --out artifact.json
 *
 *   # verify (exit 0 = conforming, exit 1 = not, with every reason printed)
 *   node scripts/claim-capture.mjs --verify artifact.json
 *
 * WHAT VERIFICATION ANSWERS. Whether these bytes are internally consistent and conform to the
 * state machine: the digests recompute, the state carries the fields its state requires, and no
 * observed change is written as an accusation. It does NOT answer whether the claim is true,
 * whether the measurement was performed competently, or whether the maintainer read the source
 * honestly. A sound digest over a wrong number is a sound digest.
 */
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";

export const STATES = ["CLAIM_CAPTURED", "CLAIM_MEASURED", "UNMEASURED", "UNCHECKABLE"];
export const SCHEMA = "csoai.claim-maintenance.artifact/0.1";
export const SPEC_URL = "https://councilof.ai/spec/claim-maintenance/v0.1/";

/** Fields that cannot be inside their own digest (spec §6.4). */
const DIGEST_EXCLUDES = new Set(["artifact_sha256", "sig"]);

export const sha256hex = (data) => createHash("sha256").update(data).digest("hex");

/**
 * Canonical JSON bytes (spec §6.1). Keys sorted by code point, no insignificant whitespace,
 * UTF-8, no NaN/Infinity, and NO floating-point numbers — their shortest round-trip form
 * varies between runtimes, and a digest that varies between runtimes is not a digest.
 */
export function canonicalBytes(value) {
  const walk = (v) => {
    if (v === null || typeof v === "boolean" || typeof v === "string") return JSON.stringify(v);
    if (typeof v === "number") {
      if (!Number.isFinite(v)) throw new Error("canonicalBytes: NaN/Infinity is not representable");
      if (!Number.isInteger(v))
        throw new Error(
          `canonicalBytes: non-integer number ${v} — carry decimals as strings (spec 6.1 step 5)`,
        );
      return String(v);
    }
    if (Array.isArray(v)) return "[" + v.map(walk).join(",") + "]";
    if (typeof v === "object") {
      const keys = Object.keys(v)
        .filter((k) => v[k] !== undefined)
        .sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
      return "{" + keys.map((k) => JSON.stringify(k) + ":" + walk(v[k])).join(",") + "}";
    }
    throw new Error(`canonicalBytes: unsupported value of type ${typeof v}`);
  };
  return Buffer.from(walk(value), "utf8");
}

/**
 * Visible-text extraction (spec §6.3). Strip script/style/template/noscript and comments, take
 * the remaining text in document order, collapse whitespace, NFC, trim.
 *
 * Deliberately a regex extractor, not a DOM: the spec REQUIRES that the extraction rule be
 * published with the digest, and this is that rule in full. Implementations differ, which is why
 * the artifact also records extracted_chars — so a third party can tell an extractor difference
 * from a content change.
 */
export function extractVisibleText(html) {
  return html
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<(script|style|template|noscript)\b[^>]*>[\s\S]*?<\/\1\s*>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
    .replace(/\s+/g, " ")
    .normalize("NFC")
    .trim();
}

/** claim_hash: SHA-256 over UTF-8 of the claim text alone (spec §6.2). */
export const claimHash = (text) => sha256hex(Buffer.from(text, "utf8"));

/** artifact_sha256: SHA-256 over canonical bytes without artifact_sha256 and sig (spec §6.4). */
export function artifactDigest(artifact) {
  const body = {};
  for (const [k, v] of Object.entries(artifact)) if (!DIGEST_EXCLUDES.has(k)) body[k] = v;
  return sha256hex(canonicalBytes(body));
}

/**
 * Words that turn an observation into an allegation (spec §4.9, §10.1). An observed change is
 * a statement about two digests. The moment it acquires a motive it has become something this
 * specification forbids, and the verifier says so rather than leaving it to an editor's judgement.
 */
const ALLEGATION_LEXICON =
  /\b(quietly|scrubbed|walked back|backtrack(?:ed|ing)?|buried|covered up|cover-?up|misleading|deceptive|deceit|false(?:hood)?|fraud(?:ulent)?|dishonest|lie[sd]?|lying|exaggerat(?:ed|ing|ion)|overstat(?:ed|ing|ement)|caught|red-?handed)\b/i;

/** States that are a rate/share/fraction claim need a denominator when measured (spec §5.3). */
const RATE_LIKE = /\b(majority|most|leading|market leader|share|percent|%|per cent|rate|fraction|proportion|ratio|out of)\b/i;

const isIso = (s) => typeof s === "string" && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z$/.test(s);
const isHex64 = (s) => typeof s === "string" && /^[0-9a-f]{64}$/.test(s);

/**
 * Verify one artifact. Returns { ok, errors } — never throws on bad input, because a verifier
 * that crashes on a malformed artifact tells you less than one that names what is wrong.
 */
export function verifyArtifact(artifact) {
  const e = [];
  const bad = (m) => e.push(m);

  if (!artifact || typeof artifact !== "object" || Array.isArray(artifact)) {
    return { ok: false, errors: ["artifact is not a JSON object"] };
  }
  if (artifact.schema !== SCHEMA) bad(`schema must be "${SCHEMA}" (got ${JSON.stringify(artifact.schema)})`);

  for (const f of [
    "claim_id",
    "subject",
    "claim_verbatim",
    "source_url",
    "access_date",
    "source_content_hash",
    "claim_hash",
    "state",
    "does_not_prove",
    "observed_changes",
    "next_read_utc",
  ]) {
    if (artifact[f] === undefined || artifact[f] === null) bad(`missing required field: ${f}`);
  }

  const s = artifact.subject;
  if (s && typeof s === "object") {
    if (!s.name) bad("subject.name is required");
    if (!s.identifier) bad("subject.identifier is required — a trading name alone does not identify a subject (spec 5.7)");
    if (!s.identifier_kind) bad("subject.identifier_kind is required");
  } else if (artifact.subject !== undefined) {
    bad("subject must be an object");
  }

  if (artifact.state !== undefined && !STATES.includes(artifact.state))
    bad(`state must be one of ${STATES.join(", ")} — there is no fifth state (spec 4)`);

  if (typeof artifact.claim_verbatim === "string") {
    if (!artifact.claim_verbatim.trim()) bad("claim_verbatim is empty");
    const want = claimHash(artifact.claim_verbatim);
    if (artifact.claim_hash !== want)
      bad(`claim_hash mismatch: recomputed ${want}, artifact says ${artifact.claim_hash}`);
  }

  const h = artifact.source_content_hash;
  if (h && typeof h === "object") {
    if (h.alg !== "sha256") bad("source_content_hash.alg must be sha256");
    if (!isHex64(h.value)) bad("source_content_hash.value must be 64 lower-case hex chars");
    if (!["visible-text", "raw-bytes", "response-json-canonical"].includes(h.covers))
      bad("source_content_hash.covers must be stated — a digest whose coverage is unstated cannot be reproduced (spec 5.6)");
  } else if (artifact.source_content_hash !== undefined) {
    bad("source_content_hash must be an object");
  }

  if (artifact.access_date !== undefined && !isIso(artifact.access_date))
    bad("access_date must be an ISO-8601 UTC instant ending in Z");
  if (artifact.next_read_utc !== undefined && !isIso(artifact.next_read_utc))
    bad("next_read_utc must be an ISO-8601 UTC instant ending in Z — a claim maintained once is not maintained (spec 1.1)");

  if (!Array.isArray(artifact.does_not_prove) || artifact.does_not_prove.length === 0)
    bad("does_not_prove must be a non-empty array — an empty does_not_prove is a malformed artifact (spec 5.4)");
  else if (artifact.state !== "CLAIM_MEASURED" && !artifact.does_not_prove.some((d) => /false|falsity|untrue|wrong/i.test(String(d))))
    bad("does_not_prove must state that this record does not indicate the claim is false (spec 5.4)");

  // Conditional requirements by state (spec 5.3).
  if (artifact.state === "CLAIM_MEASURED") {
    if (!artifact.window) bad("CLAIM_MEASURED requires window (spec 4.5)");
    if (!artifact.method) bad("CLAIM_MEASURED requires method (spec 4.5)");
    if (!artifact.result) bad("CLAIM_MEASURED requires result (spec 4.5)");
    if (artifact.method && (!Array.isArray(artifact.method.evidence) || !artifact.method.evidence.length))
      bad("CLAIM_MEASURED requires at least one named public evidence source in method.evidence (spec 4.5)");
    if (artifact.result && !Number.isInteger(artifact.result.n))
      bad("CLAIM_MEASURED requires result.n (spec 4.5)");
    if (artifact.result && typeof artifact.result.value === "number")
      bad("result.value must be a string — floating-point numbers are not reproducible across runtimes (spec 6.1)");
    const rateLike = RATE_LIKE.test(String(artifact.claim_verbatim || "")) || RATE_LIKE.test(String(artifact.result?.unit || ""));
    if (rateLike && !artifact.denominator)
      bad("a share/majority/rate claim measured without a denominator is not a measurement (spec 5.3)");
  }
  if (artifact.state === "UNCHECKABLE" && !artifact.uncheckable_reason)
    bad("UNCHECKABLE requires uncheckable_reason — a statement about the evidence, never about the subject (spec 4.4)");
  if ((artifact.state === "CLAIM_CAPTURED" || artifact.state === "UNMEASURED") && !artifact.measurement_plan)
    bad(`${artifact.state} requires measurement_plan (spec 5.3)`);
  if (artifact.state !== "CLAIM_MEASURED" && (artifact.result || artifact.method))
    bad("result/method are present but state is not CLAIM_MEASURED — a plan is not a measurement (spec 4.6)");

  // Observed changes are observations, never findings (spec 4.9).
  if (Array.isArray(artifact.observed_changes)) {
    artifact.observed_changes.forEach((c, i) => {
      if (!c || typeof c !== "object") return bad(`observed_changes[${i}] must be an object`);
      if (!isIso(c.observed_utc)) bad(`observed_changes[${i}].observed_utc must be an ISO-8601 UTC instant`);
      if (!isHex64(c.previous_hash) || !isHex64(c.current_hash))
        bad(`observed_changes[${i}] must name both digests (spec 4.9)`);
      if (c.previous_hash === c.current_hash)
        bad(`observed_changes[${i}] records identical digests — that is not a change`);
      if (typeof c.note !== "string" || !c.note.trim())
        bad(`observed_changes[${i}].note is required`);
      else if (ALLEGATION_LEXICON.test(c.note))
        bad(
          `observed_changes[${i}].note uses a word of motive or verdict ("${c.note.match(ALLEGATION_LEXICON)[0]}") — ` +
            `an observed change is never an allegation (spec 4.9, 10.1)`,
        );
    });
  } else if (artifact.observed_changes !== undefined) {
    bad("observed_changes must be an array");
  }

  // Nothing anywhere may assert falsity about the subject (spec 10.1).
  for (const field of ["measurement_plan", "uncheckable_reason"]) {
    const v = artifact[field];
    if (typeof v === "string" && ALLEGATION_LEXICON.test(v))
      bad(`${field} asserts a verdict ("${v.match(ALLEGATION_LEXICON)[0]}") — this specification asserts no falsity about anyone (spec 10.1)`);
  }

  // The tamper check. Everything a relying party reads is inside this digest (spec 6.5).
  if (artifact.artifact_sha256 !== undefined) {
    if (!isHex64(artifact.artifact_sha256)) bad("artifact_sha256 must be 64 lower-case hex chars");
    else {
      let want;
      try {
        want = artifactDigest(artifact);
      } catch (err) {
        bad(`artifact could not be canonicalised: ${err.message}`);
      }
      if (want && want !== artifact.artifact_sha256)
        bad(
          `artifact_sha256 MISMATCH — these bytes are not the bytes that were digested. ` +
            `recomputed ${want}, artifact says ${artifact.artifact_sha256}`,
        );
    }
  }

  return { ok: e.length === 0, errors: e };
}

/** Build a conforming artifact from a capture. Digest is computed last, over everything else. */
export function buildArtifact(input) {
  const {
    claim_id,
    subject,
    claim_verbatim,
    claim_type,
    source_url,
    access_date,
    content_hash,
    covers = "visible-text",
    extracted_chars,
    state = "CLAIM_CAPTURED",
    measurement_plan,
    uncheckable_reason,
    does_not_prove,
    next_read_utc,
    conflicts = [],
    first_captured_utc,
  } = input;

  const artifact = {
    schema: SCHEMA,
    claim_id,
    subject,
    claim_verbatim,
    ...(claim_type ? { claim_type } : {}),
    source_url,
    access_date,
    source_content_hash: {
      alg: "sha256",
      value: content_hash,
      covers,
      ...(Number.isInteger(extracted_chars) ? { extracted_chars } : {}),
    },
    claim_hash: claimHash(claim_verbatim),
    state,
    ...(measurement_plan ? { measurement_plan } : {}),
    ...(uncheckable_reason ? { uncheckable_reason } : {}),
    window: null,
    denominator: null,
    method: null,
    result: null,
    does_not_prove:
      does_not_prove && does_not_prove.length
        ? does_not_prove
        : [
            "that the claim is false — this record makes no such statement, and none may be derived from it",
            "that the claim is true — nothing here has been measured",
            "who wrote the page, or why it says what it says",
          ],
    observed_changes: [],
    conflicts,
    first_captured_utc: first_captured_utc || access_date,
    next_read_utc,
  };
  // result/method are null placeholders in a captured artifact; strip them so the verifier's
  // "result present but not measured" rule reads the shape, not the placeholder.
  if (state !== "CLAIM_MEASURED") {
    delete artifact.method;
    delete artifact.result;
  }
  artifact.artifact_sha256 = artifactDigest(artifact);
  return artifact;
}

/** Capture a claim from a live public page. Returns the artifact; writes nothing. */
export async function captureFromUrl(opts) {
  const { url, claim, fetchImpl = fetch } = opts;
  const res = await fetchImpl(url, {
    redirect: "follow",
    headers: {
      // Identify the reader. A maintainer that hides what it is doing is not doing this.
      "user-agent": `CSOAI-claim-maintenance/0.1 (+${SPEC_URL})`,
      accept: "text/html,application/xhtml+xml,application/json;q=0.9,*/*;q=0.8",
    },
  });
  if (!res.ok) throw new Error(`GET ${url} -> HTTP ${res.status}`);
  const body = await res.text();
  const ctype = (res.headers.get("content-type") || "").toLowerCase();
  const isHtml = ctype.includes("html") || /^\s*<(!doctype|html)/i.test(body);
  const covers = isHtml ? "visible-text" : "raw-bytes";
  const text = isHtml ? extractVisibleText(body) : body;
  const access_date = new Date().toISOString().replace(/\.\d+Z$/, "Z");
  const present = text.includes(claim);
  return {
    artifact: buildArtifact({
      ...opts,
      claim_verbatim: claim,
      access_date,
      content_hash: sha256hex(Buffer.from(text, "utf8")),
      covers,
      extracted_chars: text.length,
    }),
    claim_present_at_source: present,
  };
}

// ── CLI ────────────────────────────────────────────────────────────────────────────────────
const isMain = process.argv[1] && import.meta.url === `file://${process.argv[1]}`;
if (isMain) {
  const arg = (k, d) => {
    const i = process.argv.indexOf(`--${k}`);
    return i > 0 && process.argv[i + 1] && !process.argv[i + 1].startsWith("--") ? process.argv[i + 1] : d;
  };
  const verifyPath = arg("verify");
  if (verifyPath) {
    let doc;
    try {
      doc = JSON.parse(readFileSync(verifyPath, "utf8"));
    } catch (err) {
      console.error(`REJECTED ${verifyPath}: not parseable JSON — ${err.message}`);
      process.exit(1);
    }
    const docs = Array.isArray(doc) ? doc : [doc];
    let failed = 0;
    for (const [i, d] of docs.entries()) {
      const { ok, errors } = verifyArtifact(d);
      const label = docs.length > 1 ? `${verifyPath}[${i}] ${d?.claim_id ?? ""}` : verifyPath;
      if (ok) console.log(`CONFORMING  ${label}  state=${d.state}  ${d.artifact_sha256 ?? "(no digest)"}`);
      else {
        failed++;
        console.error(`REJECTED    ${label}`);
        for (const m of errors) console.error(`  · ${m}`);
      }
    }
    console.error(
      failed
        ? `\n${failed} of ${docs.length} artifact(s) REJECTED. Verification answers whether these bytes are internally consistent and conform — never whether a claim is true.`
        : "",
    );
    process.exit(failed ? 1 : 0);
  }

  const url = arg("url");
  const claim = arg("claim");
  if (!url || !claim) {
    console.error(
      [
        "claim-capture.mjs — reference implementation of Claim Maintenance v0.1",
        SPEC_URL,
        "",
        "  --url <url> --claim <verbatim text> [--subject <name>] [--identifier <id>]",
        "  [--identifier-kind url|domain|company-register|lei|did|contract-address|other]",
        "  [--claim-id ID] [--plan <measurement plan>] [--state CLAIM_CAPTURED|UNMEASURED|UNCHECKABLE]",
        "  [--reason <why uncheckable>] [--next-read <ISO8601Z>] [--out <file>]",
        "",
        "  --verify <file>   verify an artifact (or an array of them) and exit non-zero if any fails",
      ].join("\n"),
    );
    process.exit(2);
  }
  const state = arg("state", "CLAIM_CAPTURED");
  const next =
    arg("next-read") || new Date(Date.now() + 7 * 86400000).toISOString().replace(/T.*/, "T00:00:00Z");
  const { artifact, claim_present_at_source } = await captureFromUrl({
    url,
    claim,
    claim_id: arg("claim-id", "C-1"),
    subject: {
      name: arg("subject", new URL(url).hostname),
      identifier: arg("identifier", new URL(url).hostname),
      identifier_kind: arg("identifier-kind", "domain"),
    },
    claim_type: arg("claim-type"),
    source_url: url,
    state,
    measurement_plan: arg("plan", state === "UNCHECKABLE" ? undefined : "not yet planned"),
    uncheckable_reason: arg("reason"),
    next_read_utc: next,
  });
  const { ok, errors } = verifyArtifact(artifact);
  if (!ok) {
    console.error("refusing to emit a non-conforming artifact:");
    for (const m of errors) console.error(`  · ${m}`);
    process.exit(1);
  }
  const out = arg("out");
  const body = JSON.stringify(artifact, null, 2) + "\n";
  if (out) {
    writeFileSync(out, body);
    console.error(`wrote ${out}`);
  } else process.stdout.write(body);
  console.error(
    claim_present_at_source
      ? "the claim text was present in the captured source at this read"
      : "NOTE: the claim text was NOT found in the captured source at this read. That is an observation about this capture — it is not a statement about the subject. Check the extraction and the exact wording before recording it.",
  );
}
