#!/usr/bin/env node
/**
 * npm-release-state — ONE derivation of the published npm release's facts, and of the sentence
 * each surface states about them.
 *
 * WHY THIS EXISTS. The npm package's deprecation state was HAND-TYPED into five public surfaces
 * and was FALSE in all five:
 *
 *   - public/llms.txt (twice) — the agent entry document: "The published npm release is marked
 *     deprecated on npm and carries fewer tools than the HTTP door".
 *   - public/.well-known/mcp.json and public/.well-known/mcp/server-card.json — the discovery
 *     documents an agent fetches before it installs anything: "published releases are deprecated
 *     on npm and carry fewer tools".
 *   - the live MCP door's own install block (functions/mcp/[[path]].ts, GET /mcp) — "deprecated on
 *     npm; npx -y csoai-gspc-mcp …".
 *   - the site's own npm flag (client/src/lib/nSitesFlags.ts) — "Every published npm release is
 *     marked deprecated on npm…".
 *
 * The typed claim came from a 6 Oct 2026 observation that was true then and was never retired:
 * npm DOES deprecate 0.1.0, 0.1.1, 0.2.0, 0.2.1 and 0.2.2. The estate's own releases since then
 * (0.2.3, 0.2.4, 0.2.5) are NOT deprecated. So "the published release is deprecated" became false
 * the moment the estate published a non-deprecated release, and nothing in the build noticed —
 * the sentence was a string in a template, a generator constant and a hand-written TS note.
 *
 * THE FACT IS MEASURED, NOT TYPED. npm-publish-live.mjs reads the registry document and records
 * `published.deprecated` in distribution/npm/npm-publish-check.json, a dated capture. This module
 * reads that capture and refuses to invent a fact it does not carry: a capture with no deprecation
 * flag is an error, not a "false".
 *
 * WHAT THE STATE ACTUALLY IS, AND WHY THE STDIO PIN IS STILL WITHHELD. The reason the pin is
 * withheld is NOT deprecation and never was, in the present:
 *
 *   1. The repository PREPARES 0.2.6 (mcp/gspc-server/package.json). npm's latest PUBLISHED
 *      release is 0.2.5. A pin at the prepared version would name a version that does not exist
 *      on the registry, so no pin is advertised.
 *   2. The published tarball carries 53 tool names; the door serves 54. The published release is
 *      not the contract, so the door is.
 *
 * Both conditions are measured, so both are derived. When the estate publishes a release that
 * carries the served tool set, the decision flips by itself instead of waiting for a human to
 * notice a stale sentence — which is the whole reason this module exists.
 *
 * IT IS PURE. No file system, no network: it takes a capture object and returns facts and
 * sentences, so the Node generators, the Pages Function and the site bundle can all render the
 * SAME words from the SAME capture. The one sentence lives here; the surfaces are mirrors.
 *
 *   import { npmReleaseState, cardNote, doorInstallLine, llmsStdioSentence } from
 *     "./npm-release-state.mjs";
 */
export const CAPTURE_SCHEMA = "csoai.npm-publish-check/1";

/** The capture file, relative to the repository root. One dated record of the published release. */
export const CAPTURE_PATH = "distribution/npm/npm-publish-check.json";

const isNum = (v) => typeof v === "number" && Number.isFinite(v);
const isStr = (v) => typeof v === "string" && v.length > 0;

/**
 * The facts. Every field is read from the capture; a missing field is an error, because
 * "absent is not zero" and "absent is not false" are the same rule.
 */
export function npmReleaseState(capture) {
  if (!capture || typeof capture !== "object") {
    throw new Error("npm release state: no capture to read");
  }
  if (capture.schema !== CAPTURE_SCHEMA) {
    throw new Error(
      `npm release state: capture schema is ${JSON.stringify(capture.schema)}, expected ${CAPTURE_SCHEMA}`,
    );
  }
  const pub = capture.published;
  const door = capture.live_door;
  const diff = capture.diff;
  if (!pub || typeof pub !== "object") throw new Error("npm release state: capture carries no published{}");
  if (!door || typeof door !== "object") throw new Error("npm release state: capture carries no live_door{}");
  if (!diff || typeof diff !== "object") throw new Error("npm release state: capture carries no diff{}");
  if (!isStr(pub.version)) throw new Error("npm release state: capture carries no published.version");
  if (!isStr(pub.published_at)) throw new Error("npm release state: capture carries no published.published_at");
  if (typeof pub.deprecated !== "boolean") {
    throw new Error(
      "npm release state: the capture carries no published.deprecated flag — the flag is the measurement, " +
        "and a missing measurement is not a negative one. Re-run scripts/harness-x/npm-publish-live.mjs",
    );
  }
  if (!isNum(pub.total_tools)) throw new Error("npm release state: capture carries no published.total_tools");
  if (!isNum(door.total_tools)) throw new Error("npm release state: capture carries no live_door.total_tools");
  if (!isStr(capture.checked_at)) throw new Error("npm release state: capture carries no checked_at");
  const liveOnly = Array.isArray(diff.live_only) ? diff.live_only.filter(isStr) : null;
  const publishedOnly = Array.isArray(diff.published_only) ? diff.published_only.filter(isStr) : null;
  if (!liveOnly || !publishedOnly) {
    throw new Error("npm release state: capture carries no diff.live_only / diff.published_only lists");
  }
  return {
    version: pub.version,
    publishedAt: pub.published_at,
    deprecated: pub.deprecated,
    deprecatedReason: pub.deprecated_reason ?? null,
    publishedTools: pub.total_tools,
    publishedFree: isNum(pub.free_tools) ? pub.free_tools : null,
    publishedMetered: isNum(pub.metered_tools) ? pub.metered_tools : null,
    capturedDoorTools: door.total_tools,
    measuredGap: door.total_tools - pub.total_tools,
    liveOnly,
    publishedOnly,
    checkedAt: capture.checked_at,
    measuredDay: String(capture.checked_at).slice(0, 10),
    /** One grammar, no caller re-phrasing it: the subject is always "the published release". */
    deprecationPhrase: pub.deprecated ? "is marked deprecated on npm" : "is not marked deprecated on npm",
  };
}

/**
 * Whether the stdio pin may be advertised, and the one fact a sentence has to carry that the
 * other sentences do not already say.
 *
 * The three conditions are all measured:
 *   - the release the repository prepares is the release npm actually published (else the pin
 *     names a version nobody can install);
 *   - npm does not mark that release deprecated;
 *   - that release's tool names equal the tool names the door serves.
 *
 * `doorTools` is the count the SURFACE serves — each surface knows its own fleet, and the door's
 * fleet is not a fact about npm.
 */
export function stdioAdvertisement(state, { preparedVersion, doorTools }) {
  const pinMatchesPublished = preparedVersion === state.version;
  const notDeprecated = !state.deprecated;
  const matchesServed = state.publishedTools === doorTools;
  return {
    advertise: pinMatchesPublished && notDeprecated && matchesServed,
    pinMatchesPublished,
    notDeprecated,
    matchesServed,
    /**
     * The only reason a surface must state in ADDITION to the facts its sentence already carries
     * (the deprecation flag and the tool counts). Null when the prepared version IS published.
     */
    versionMismatch: pinMatchesPublished
      ? null
      : `the prepared release ${preparedVersion} is not on npm yet (npm's latest published release is ${state.version})`,
  };
}

/** The tool-count clause. One grammar for every surface; the gap is named, not implied. */
export function toolClause(state, doorTools) {
  if (state.publishedTools === doorTools) {
    return `the same ${state.publishedTools} tool names the door serves`;
  }
  const gap = doorTools - state.publishedTools;
  const short = `${gap} name${gap === 1 ? "" : "s"} short`;
  return `${state.publishedTools} tool names against the ${doorTools} the door serves — ${short}`;
}

/** The names the published tarball does not carry, as a phrase that reads as a sentence. */
export function missingNamesPhrase(state) {
  if (!state.liveOnly.length) return "";
  const names = state.liveOnly.map((n) => `\`${n}\``).join(", ");
  return `The published tarball lacks ${names}, which the door added after ${state.version}.`;
}

/**
 * The discovery-document note (.well-known/mcp.json and the server card). One sentence: what is
 * published, whether npm marks it deprecated, how many names it carries, and where to go instead.
 */
export function cardNote(state, { npmId, freeDoor, doorTools, preparedVersion }) {
  const adv = stdioAdvertisement(state, { preparedVersion, doorTools });
  const pinPart = adv.versionMismatch ? ` No stdio pin is advertised: ${adv.versionMismatch}.` : "";
  return (
    `npm ${npmId}: the latest published release is ${state.version} (published ${state.publishedAt}, ` +
    `measured ${state.measuredDay}) and ${state.deprecationPhrase}; it carries ${toolClause(state, doorTools)}.` +
    `${pinPart} Use the free door ${freeDoor}`
  );
}

/**
 * The live door's own install line (GET /mcp, functions/mcp/[[path]].ts). It answers the
 * question an agent actually asks at initialize: can I install this locally, and should I?
 */
export function doorInstallLine(state, { npmId, stdioLiteLine, freeDoor, doorTools, preparedVersion }) {
  const adv = stdioAdvertisement(state, { preparedVersion, doorTools });
  const pinPart = adv.versionMismatch
    ? ` ${adv.versionMismatch.charAt(0).toUpperCase()}${adv.versionMismatch.slice(1)}.`
    : "";
  return (
    `npm ${npmId}@${state.version} (stdio-lite ${stdioLiteLine}): it carries ${toolClause(state, doorTools)}, ` +
    `and it ${state.deprecationPhrase} (measured ${state.measuredDay}).${pinPart} ` +
    `Ask it for its tools/list, or use the free door ${freeDoor}`
  );
}

/**
 * The long sentence for llms.txt — the agent entry document, where the reader is deciding whether
 * a local install is worth it at all.
 */
export function llmsStdioSentence(state, { doorTools, freeDoor, preparedVersion }) {
  const adv = stdioAdvertisement(state, { preparedVersion, doorTools });
  const gapPart = state.liveOnly.length ? ` ${missingNamesPhrase(state)}` : "";
  const tail = adv.advertise
    ? " This dated comparison is of tool names; it does not establish equivalent tool behavior between a local install and the remote door. The free door stays the no-install path."
    : ` Until a published release carries the door's tool set, use ${freeDoor}.`;
  return (
    `The latest published npm release is ${state.version} (published ${state.publishedAt}, ` +
    `measured ${state.measuredDay}) and ${state.deprecationPhrase}; its published tarball carries ` +
    `${toolClause(state, doorTools)}.${gapPart}${tail}`
  );
}

/** The short sentence for llms.txt's distribution line. */
export function llmsStdioShort(state, { doorTools, freeDoor }) {
  return (
    `the latest published release is ${state.version} and ${state.deprecationPhrase}; it carries ` +
    `${toolClause(state, doorTools)} (measured ${state.measuredDay}) — use ${freeDoor}`
  );
}

/** The site's own npm flag note (client/src/lib/nSitesFlags.ts). */
export function clientNote(state, { doorTools, freeDoor }) {
  return (
    `The latest published npm release is ${state.version} (measured ${state.measuredDay}) and ` +
    `${state.deprecationPhrase}; it carries ${toolClause(state, doorTools)}. ` +
    `Ask that install for its tools/list, or use the free door ${freeDoor}.`
  );
}
