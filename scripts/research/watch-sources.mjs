#!/usr/bin/env node
/**
 * Continuous GSPC source watch: confirmed source changes become UNSIGNED human-review requests.
 * No candidate is a measurement, legal interpretation, signed finding, model update, repair or
 * board promotion. Reuses the regulation watch's successful-fetch and two-observation policy.
 *
 * Run: node scripts/research/watch-sources.mjs [--init]
 * State: research-watch-state.json; review requests: research-review-requests/
 */
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { assessFingerprint, fetchOk, EMPTY_SHA256 } from "../reg-watch-policy.mjs";
import registry from "../../functions/api/_gspc_research_semantics.json" with { type: "json" };

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const sha = (value) => createHash("sha256").update(value).digest("hex");

export function watchlist(sourceRegistry = registry) {
  const bySource = new Map();
  for (const axis of sourceRegistry.axes) {
    for (const sourceId of axis.source_ids) {
      const source = sourceRegistry.sources[sourceId];
      if (!source?.watch) continue;
      const current = bySource.get(sourceId) ?? { id: sourceId, ...source, axes: [] };
      if (!current.axes.includes(axis.axis)) current.axes.push(axis.axis);
      bySource.set(sourceId, current);
    }
  }
  return [...bySource.values()].sort((a, b) => a.id.localeCompare(b.id));
}

export async function fingerprint(url, fetchImpl = fetch) {
  const response = await fetchImpl(url, {
    headers: { "user-agent": "csoai-gspc-research-watch/0.1 (+https://councilof.ai)" },
    redirect: "follow",
  });
  const lastModified = response.headers.get("last-modified") || "";
  const etag = response.headers.get("etag") || "";
  let body = await response.text();
  const rawSha = sha(body);
  if (!fetchOk({ status: response.status, bodyLength: body.length, bodySha256: rawSha })) {
    throw new Error(`FETCH_FAILED (HTTP ${response.status}, ${body.length} bytes${rawSha === EMPTY_SHA256 ? ", empty-body hash" : ""})`);
  }
  body = body
    .replace(/name="__?[A-Za-z]*token"[^>]*>/gi, "")
    .replace(/nonce="[^"]*"/gi, "")
    .replace(/\s+/g, " ");
  if (!body.trim() || sha(body) === EMPTY_SHA256) throw new Error("FETCH_FAILED (body empty after normalisation)");
  return { method: lastModified || etag ? "headers+body" : "body", last_modified: lastModified, etag, body_sha256: sha(body) };
}

export function reviewRequest({ axis, source, previous, current, assessment, observedAt }) {
  return {
    schema: "csoai.research-review-request/0.1",
    classification: "RESEARCH_REVIEW_REQUEST",
    state: "AWAITING_HUMAN_REVIEW",
    request: "ASSESS_SOURCE_IMPACT_AND_DECIDE_WHETHER_TO_REMEASURE",
    axis,
    source: { id: source.id, publisher: source.publisher, title: source.title, url: source.url },
    observed_at: observedAt,
    previous: { body_sha256: previous.body_sha256, last_modified: previous.last_modified ?? null, checked: previous.checked ?? null },
    current: { body_sha256: current.body_sha256, last_modified: current.last_modified ?? null },
    detection_basis: assessment.basis,
    confirmations: assessment.confirmations,
    measurement_state: "UNMEASURED",
    signed: false,
    signature: null,
    automatic_submission: false,
    writes_board: false,
    model_training: false,
    automatic_fixing: false,
    automatic_signing: false,
    automatic_promotion: false,
    limitations: [
      "A confirmed source fingerprint change is not an interpretation of what changed or a legal conclusion.",
      "This unsigned request is not a measurement, finding, attestation or evidence of compliance.",
      "A person must inspect the source, map affected semantics and authorise any versioned re-measurement.",
    ],
  };
}

export async function runWatch({
  now = new Date().toISOString(),
  fetchImpl = fetch,
  stateFile = resolve(ROOT, "research-watch-state.json"),
  requestsDir = resolve(ROOT, "research-review-requests"),
  init = false,
  sourceRegistry = registry,
  log = console.log,
} = {}) {
  const state = existsSync(stateFile)
    ? JSON.parse(readFileSync(stateFile, "utf8"))
    : { schema: "csoai.gspc-research-watch-state/0.1", sources: {} };
  state.schema = "csoai.gspc-research-watch-state/0.1";
  state.sources ??= {};
  const candidates = [];
  let failed = 0;
  let unconfirmed = 0;

  for (const source of watchlist(sourceRegistry)) {
    try {
      const current = await fingerprint(source.url, fetchImpl);
      const previous = state.sources[source.id];
      if (!previous || init) {
        state.sources[source.id] = { ...current, first_seen: previous?.first_seen ?? now, checked: now };
        log(`${source.id}: baseline recorded`);
        continue;
      }
      const assessment = assessFingerprint(previous, current, now);
      if (assessment.changed) {
        for (const axis of source.axes) {
          candidates.push(reviewRequest({ axis, source, previous, current, assessment, observedAt: now }));
        }
        log(`${source.id}: CHANGED; ${source.axes.length} unsigned review request(s)`);
      } else {
        if (assessment.state === "UNCONFIRMED") unconfirmed++;
        if (assessment.state === "FETCH_FAILED") failed++;
        log(`${source.id}: ${assessment.state}`);
      }
      state.sources[source.id] = assessment.next;
    } catch (error) {
      failed++;
      if (state.sources[source.id]) state.sources[source.id].last_error = `${now}: ${error.message}`;
      log(`${source.id}: FETCH_FAILED; no candidate`);
    }
  }

  mkdirSync(dirname(stateFile), { recursive: true });
  writeFileSync(stateFile, JSON.stringify(state, null, 2) + "\n");
  const written = [];
  if (candidates.length) {
    mkdirSync(requestsDir, { recursive: true });
    for (const candidate of candidates) {
      const filename = `${now.slice(0, 10)}-${candidate.source.id}-${candidate.axis}-${candidate.current.body_sha256.slice(0, 12)}.json`;
      const path = resolve(requestsDir, filename);
      writeFileSync(path, JSON.stringify(candidate, null, 2) + "\n");
      written.push(path);
    }
  }
  return { candidates, written, failed, unconfirmed, state };
}

const isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMain) {
  const result = await runWatch({ init: process.argv.includes("--init") });
  console.log(`GSPC research watch: ${result.candidates.length} review request(s), ${result.failed} failed, ${result.unconfirmed} unconfirmed.`);
  if (result.candidates.length) process.exitCode = 2;
}
