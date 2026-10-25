import { isCompanyCaseId, requireVerifiedCompanyCase } from "../components/talk/companyCaseModel";

/** Shared presentation identity; this grants no tools, permissions or human authority. */
export const CSOAI_STAFF_PROFILE = Object.freeze({
  version: 1,
  name: "Cody",
  actor: "Codex",
  kind: "AI",
  role: "CSOAI operations assistant",
  disclosure: "Cody is an AI staff assistant run by CSOAI, not a human.",
  greeting: "Hi, I'm Cody, CSOAI's AI staff assistant. Tell me what you need, and I'll explain the next step and show you its result.",
  personality: Object.freeze(["calm", "direct", "warm", "candid", "concise"] as const),
  approach: "Explain the next action, show its actual result, and say when something is unknown. Do not invent human experience.",
});

/** Voice selection remains with the existing user preference and councilVoice APIs. */
export type CompanyCaseSpeechOptions = {
  expected: {
    ownerSubject: string;
    caseId: string;
    requestId: string;
    request?: string;
  };
  reason: "submitted" | "read" | "initial-read";
  previousKey?: string;
};

export type CompanyCaseSpeech = {
  /** An ephemeral, owner-scoped presentation key; not a receipt or stored authority. */
  key: string;
  status: "saved" | "awaiting_review";
  text: string | null;
};

const record = (value: unknown): value is Record<string, unknown> =>
  Boolean(value && typeof value === "object" && !Array.isArray(value));

/**
 * Consume the existing authenticated client's checked case model after the component's
 * live-operation/session guards. This does not verify raw bytes or grant authority.
 * Capture expected identities from that current operation, never from conversation text.
 * Keep the returned key in the existing owner's component ref, clear it on session change,
 * and stop microphone/speech through the existing lifecycle. No media or storage is used here.
 */
export function getCompanyCaseSpeech(
  state: unknown,
  options: CompanyCaseSpeechOptions,
): CompanyCaseSpeech | null {
  try {
    if (!record(state) || state.outcomeUnknown === true ||
      (state.status !== "saved" && state.status !== "awaiting_review") ||
      !record(options) || !["submitted", "read", "initial-read"].includes(options.reason) ||
      !record(options.expected) || !isCompanyCaseId(options.expected.caseId) ||
      !isCompanyCaseId(options.expected.requestId)) return null;

    const value = requireVerifiedCompanyCase(state.value, options.expected);
    if ((state.status === "saved") !== value.persistence.merged) return null;

    const persistence = value.persistence;
    const persistenceKey = persistence.merged
      ? ["committed", persistence.nativeCommitId]
      : [
        "proposal",
        persistence.changeRequestId,
        persistence.reviewStatus,
        ...(["case", "result", "receipt"] as const).map((role) => {
          const proposal = persistence.proposedRecords[role];
          return [role, proposal.operationId, proposal.headCommitId, proposal.payloadSha256];
        }),
      ];
    const key = JSON.stringify([
      value.ownerSubject, value.caseId, value.requestId,
      value.result.id, value.result.sha256,
      value.receipt.id, value.receipt.sha256,
      persistenceKey,
    ]);
    const silent = options.reason === "initial-read" || options.previousKey === key;
    return {
      key,
      status: state.status,
      text: silent ? null : value.persistence.merged
        ? "Your case is saved. The stored result and receipt have been checked."
        : "Your proposal is retained. It has not been merged.",
    };
  } catch {
    // Unverified, malformed and uncertain results have no success narration.
    return null;
  }
}
