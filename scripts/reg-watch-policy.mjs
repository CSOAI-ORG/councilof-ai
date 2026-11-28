/**
 * Decide whether a regulation fingerprint is a confirmed source change.
 *
 * Adopted 29 Sep 2026 from the harness router (lanes/harness-router-20260929,
 * task change-detection, winner gated_fetchok_2fetch: false-change rate 0.000
 * against 0.931 for the naive hash compare; owner ruling "adopt the winners"):
 *
 *   1. fetch_ok gate. A fetch counts only when it was HTTP 2xx with a
 *      non-empty body whose sha256 is not e3b0c442... (the empty string).
 *      Anything else is FETCH_FAILED: the baseline and any pending candidate
 *      are kept untouched, and it is never a change.
 *   2. Two-fetch confirmation. A new fingerprint (Last-Modified, ETag or body
 *      hash, whichever both sides expose, in that order) is a change only when
 *      the SAME new value is seen on two fetch_ok fetches at least
 *      CONFIRM_MIN_GAP_MS (10 minutes) apart. Until then it is UNCONFIRMED.
 *
 * A pending candidate that is itself the empty-body hash (written by the
 * pre-29-Sep policy, e.g. reg-watch-state.json on 14 Sep) is ignored, so it can
 * never be "confirmed" by a later failed fetch.
 */
export const EMPTY_SHA256 = "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855";
export const CONFIRM_MIN_GAP_MS = 10 * 60 * 1000;

/** fetch_ok: 2xx and a non-empty body whose hash is not the empty-string hash. */
export function fetchOk({ status, bodyLength, bodySha256 }) {
  return (
    Number.isInteger(status) && status >= 200 && status < 300 &&
    Number(bodyLength) > 0 &&
    typeof bodySha256 === "string" && bodySha256.length > 0 && bodySha256 !== EMPTY_SHA256
  );
}

/** The comparable token for two observations: Last-Modified, then ETag, then the body hash. */
function tokenOf(previous, current) {
  if (previous.last_modified && current.last_modified) {
    return { basis: "last-modified", prev: previous.last_modified, cur: current.last_modified };
  }
  if (previous.etag && current.etag) {
    return { basis: "etag", prev: previous.etag, cur: current.etag };
  }
  return { basis: "body", prev: previous.body_sha256, cur: current.body_sha256 };
}

function clearPending(o) {
  const n = { ...o };
  for (const k of ["pending_body_sha256", "pending_token", "pending_basis", "pending_first_seen", "pending_seen", "last_error"]) {
    delete n[k];
  }
  return n;
}

export function assessFingerprint(previous, current, observedAt) {
  const firstSeen = previous.first_seen ?? observedAt;

  // 1. fetch_ok gate: an empty body (or its hash) is a failed fetch, never an observation.
  if (!current.body_sha256 || current.body_sha256 === EMPTY_SHA256 || current.fetch_ok === false) {
    return {
      changed: false,
      state: "FETCH_FAILED",
      basis: "fetch-not-ok",
      confirmations: 0,
      next: { ...previous, last_error: `${observedAt}: FETCH_FAILED (empty body or not 2xx)` },
    };
  }

  const stableNext = clearPending({ ...previous, ...current, first_seen: firstSeen, checked: observedAt });
  delete stableNext.fetch_ok;
  const t = tokenOf(previous, current);

  if (t.prev === t.cur) {
    return { changed: false, state: "UNCHANGED", basis: `${t.basis}-stable`, confirmations: 0, next: stableNext };
  }

  // A legacy empty-body pending candidate is not a candidate.
  const legacyPending = previous.pending_token ?? previous.pending_body_sha256;
  const pendingToken = legacyPending === EMPTY_SHA256 ? undefined : legacyPending;
  const pendingBasis = previous.pending_basis ?? (previous.pending_body_sha256 ? "body" : undefined);
  const pendingSince = previous.pending_first_seen ? Date.parse(previous.pending_first_seen) : NaN;
  const gapMs = Date.parse(observedAt) - pendingSince;

  // 2. two-fetch confirmation: the same new token, seen again >= 10 minutes after it was first seen.
  if (pendingToken !== undefined && pendingToken === t.cur && pendingBasis === t.basis &&
      Number.isFinite(gapMs) && gapMs >= CONFIRM_MIN_GAP_MS) {
    return {
      changed: true,
      state: "CHANGED",
      basis: `${t.basis}-two-fetches-${Math.round(gapMs / 1000)}s-apart`,
      confirmations: 2,
      next: stableNext,
    };
  }

  // Seen once (or again too soon): UNCONFIRMED. The baseline is kept; the candidate is remembered with the
  // time it was FIRST seen, so a repeat inside 10 minutes does not restart or shorten the clock.
  const sameCandidate = pendingToken !== undefined && pendingToken === t.cur && pendingBasis === t.basis;
  return {
    changed: false,
    state: "UNCONFIRMED",
    basis: sameCandidate ? `${t.basis}-candidate-seen-again-under-10min` : `${t.basis}-candidate-pending-confirmation`,
    confirmations: 1,
    next: {
      ...clearPending(previous),
      checked: observedAt,
      pending_token: t.cur,
      pending_basis: t.basis,
      ...(t.basis === "body" ? { pending_body_sha256: t.cur } : {}),
      pending_first_seen: sameCandidate ? previous.pending_first_seen : observedAt,
      pending_seen: sameCandidate ? Number(previous.pending_seen || 1) + 1 : 1,
    },
  };
}

/** Bounded read of a fixed watchlist URL. A failed transport never supplies a fingerprint.
 * Preserve Response.text() UTF-8 decoding semantics for existing normalized hashes.
 * Cancellation is advisory; a stalled transport cannot hold the whole watchdog.
 */
export async function boundedRegulationRead(url, {
  fetcher = fetch, deadlineMs = 30_000, maxBytes = 32 * 1024 * 1024,
} = {}) {
  if (!Number.isInteger(deadlineMs) || deadlineMs < 1 || deadlineMs > 30_000 ||
      !Number.isInteger(maxBytes) || maxBytes < 1 || maxBytes > 32 * 1024 * 1024) {
    throw new Error("SOURCE_LIMIT");
  }
  const controller = new AbortController();
  let rejectDeadline, reader, response, stopped = false;
  const deadline = new Promise((_, reject) => { rejectDeadline = reject; });
  const timer = setTimeout(() => {
    stopped = true;
    controller.abort();
    rejectDeadline(new Error("SOURCE_DEADLINE"));
  }, deadlineMs);
  const cancel = stream => {
    try { void stream?.cancel().catch(() => {}); } catch { /* advisory */ }
  };
  const wait = async promise => {
    const value = await Promise.race([promise, deadline]);
    if (stopped) throw new Error("SOURCE_DEADLINE");
    return value;
  };
  try {
    response = await wait(Promise.resolve().then(() => fetcher(url, {
      headers: { "user-agent": "csoai-reg-watch/0.1 (+https://councilof.ai; measurement body change-detector)" },
      redirect: "follow", signal: controller.signal,
    })).then(value => {
      if (stopped) cancel(value?.body);
      return value;
    }));
    const advertised = response.headers.get("content-length");
    if (advertised && /^\d+$/.test(advertised) && Number(advertised) > maxBytes) throw new Error("SOURCE_SIZE");
    if (!response.body?.getReader) throw new Error("SOURCE_BODY_UNAVAILABLE");
    reader = response.body.getReader();
    const decoder = new TextDecoder();
    const parts = [];
    let bytes = 0;
    for (;;) {
      const part = await wait(reader.read());
      if (part.done) break;
      bytes += part.value.byteLength;
      if (bytes > maxBytes) throw new Error("SOURCE_SIZE");
      parts.push(decoder.decode(part.value, { stream: true }));
    }
    parts.push(decoder.decode());
    return { status: response.status, lastMod: response.headers.get("last-modified") || "",
      etag: response.headers.get("etag") || "", body: parts.join("") };
  } catch (error) {
    stopped = true;
    controller.abort();
    cancel(reader || response?.body);
    throw error;
  } finally {
    clearTimeout(timer);
    try { reader?.releaseLock(); } catch { /* already released */ }
  }
}
