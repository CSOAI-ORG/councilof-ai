# Canonical account-generation export

Source preparation for the existing Council session flow. This note does not install a collector, perform a request, qualify a native principal, or grant access.

The successful canonical `GET https://councilof.ai/api/auth/me` response adds one top-level `account_generation`: the current account incarnation already checked against the signed session. The token format, signature, expiry, account lookup, lifecycle validation, login/register replies and private profile replies are unchanged. Failed verification and unavailable accounts do not return this field. The response remains `Cache-Control: no-store`.

An account generation is a nonsecret lifecycle identifier. It does not prove mailbox verification, a human identity, native membership, reviewer authority or entitlement. Do not infer a native grant from an email address, a display name, a locally decoded token, or first use.

## Existing collection path

`client/src/lib/councilSession.ts` already calls `/api/auth/me` through `options.fetcher` in `createCouncilSessionController.restore()` and `authenticate()`. Both calls use the Council origin, independently of `authApiBase`. Reuse one of those ordinary user-initiated sign-in/restoration responses. Do not add a fetch, auth endpoint, background collector, token reader, UI or storage entry.

For an explicitly requested diagnostic export, capture a clone of that successful response before its existing `.json()` consumes the body, and record the local observation time. Continue the existing controller unchanged through subject matching, operation revision, AbortSignal and live-storage guards. Collect only after it has accepted/published that same user. Supply its existing current-operation/live-storage guard as `isCurrent`; discard the clone and candidate whenever the guard fails. Never pass a token, Request, request headers, cookie or storage object to this adapter.

```ts
const observation = {
  response: response.clone(), // `verification.clone()` in authenticate()
  observed_at: new Date().toISOString(),
};
// Keep all existing response parsing, subject checks and currentStorage guards.
// After accepting the same response and user, use only this bounded adapter:
// const candidate = await collectAccountGeneration(
//   observation, user.email!, () => currentStorage(operation, expected),
// );
// Return the candidate solely to the human who requested the diagnostic.
// Do not write a pin, grant, log, localStorage entry or native configuration.
```

The following is a UI-free adapter specification, not an added auth tool or an installed controller hook. Its caller must be the existing canonical controller, with the clone above; it must not accept a user-supplied URL or construct a Response from pasted JSON. A clone or JSON body alone is not provenance. In `authenticate()`, use `verification` and the accepted `verified.email`; in `restore()`, use `response` and the accepted `user.email`.

```ts
async function collectAccountGeneration(
  observation: { response: Response; observed_at: string },
  expectedSubject: string,
  isCurrent: () => boolean,
) {
  const canonicalUrl = "https://councilof.ai/api/auth/me";
  const response = observation.response;
  const refuse = () => new Error("Canonical account observation unavailable");
  if (!isCurrent() || response.url !== canonicalUrl || response.redirected ||
      response.status !== 200 || response.bodyUsed || !response.body ||
      response.headers.get("cache-control")?.trim().toLowerCase() !== "no-store" ||
      response.headers.get("content-type")?.split(";")[0].trim().toLowerCase() !== "application/json" ||
      !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(observation.observed_at) ||
      !Number.isFinite(Date.parse(observation.observed_at))) throw refuse();
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > 65_536 || !isCurrent()) throw refuse();
      chunks.push(value);
    }
  } catch {
    // Do not await tee cancellation: the normal controller owns the other branch.
    void reader.cancel().catch(() => undefined);
    throw refuse();
  } finally {
    reader.releaseLock();
  }
  if (!size || !isCurrent()) throw refuse();
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
  let body: any;
  try { body = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes)); }
  catch { throw refuse(); }
  if (!body || typeof body !== "object" || Array.isArray(body) ||
      !body.user || typeof body.user !== "object" || Array.isArray(body.user) ||
      typeof body.user.email !== "string" || !body.user.email ||
      body.user.email.length > 254 || body.user.email.trim() !== body.user.email ||
      /[\s\u0000-\u001f\u007f]/.test(body.user.email) ||
      body.user.email !== expectedSubject ||
      typeof body.account_generation !== "string" ||
      !/^[a-f0-9]{64}$/.test(body.account_generation)) throw refuse();
  const hash = await crypto.subtle.digest("SHA-256", bytes);
  if (!isCurrent()) throw refuse();
  return {
    subject: body.user.email,
    account_generation: body.account_generation,
    canonical_url: canonicalUrl,
    observed_at: observation.observed_at,
    served_source_identity: null,
    response_sha256: Array.from(new Uint8Array(hash), b => b.toString(16).padStart(2, "0")).join(""),
  };
}
```

Export exactly those six fields, with no raw response, display name, entitlements, token, signature, cookie, request headers, password, native identifiers or configuration. The digest covers the exact application response-body bytes supplied by the browser, before JSON parsing; it is not a digest of reserialized JSON or compressed network framing. Clear the transient clone/bytes after the requested export; do not persist an observation automatically.

`served_source_identity` is deliberately `null`: this path has no qualified served-source identifier. Do not substitute a repository commit, local checkout, guessed response header or the hash of this document. If Release independently observes served source identity, it must retain that separate evidence and its scope.

The six-field candidate is an unsigned observation for explicit owner review, not a trusted owner-generation pin or native authorization. Release must separately reconcile the selected receiver, original Base/node, actual native principal, effective original-Base access, human reviewer and exact operation heads before adopting any binding. A new empty Base or operator alias cannot supply the missing proof. Case save/readback and reopening the same case in both apps remain distinct live acceptance steps.

## Validation scope

Extend the existing auth/profile regression controls: exact successful `/me` response shape and no-store; no generation in failures or profile responses; invalid/missing/tampered token refusal; missing/malformed account refusal; protected-field rejection; stable legacy and stored generations across name edits/overlapping logins; stale same-email incarnation refusal and current incarnation success. Preserve all original checks and no-upgrade-write assertions.

These source edits and the adapter note require normal current-head hosted qualification before release. The adapter has not been wired or exercised with a real account. Private gateway fixture checks are separate evidence and do not qualify this public change or a live customer workflow.
