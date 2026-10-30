/** Frontend presentation contract. This is not a backend HTTP payload or an auth grant. */
export type CompanyCaseSession =
  | { status: "verifying" }
  | { status: "signed_out" }
  | { status: "unavailable" }
  | { status: "ready"; subject: string };

export type CompanyCaseSource = {
  title: string;
  reference: string;
  sha256?: string;
} & ({ fetchedAt: string; recordedAt?: never } | { recordedAt: string; fetchedAt?: never });

/** The adapter must verify canonical envelope digests and their bindings before returning this. */
export type CommittedCompanyCase = {
  caseId: string;
  requestId: string;
  ownerSubject: string;
  request: string;
  result: {
    id: string;
    text: string;
    fetchedAt: string;
    sha256: string;
    sources: CompanyCaseSource[];
  };
  receipt: {
    id: string;
    caseId: string;
    resultId: string;
    resultSha256: string;
    sha256: string;
    createdAt: string;
    integrity: "unsigned";
  };
  persistence: {
    merged: true;
    nativeReadbackVerified: true;
    nativeCommitId: string;
  };
  verification: {
    resultDigestVerified: true;
    receiptDigestVerified: true;
    receiptBindingVerified: true;
  };
};


export type ProposedCompanyRecord = { operationId: string; headCommitId: string; payloadSha256: string };
/** Durable native proposal heads; these identifiers are not merged record IDs. */
export type PendingCompanyCase = Omit<CommittedCompanyCase, "persistence" | "verification"> & {
  persistence: {
    merged: false;
    nativeReadbackVerified: false;
    proposalReadbackVerified: true;
    changeRequestId: string;
    reviewStatus: "in_review" | "changes_requested" | "approved";
    proposedRecords: Record<"case" | "result" | "receipt", ProposedCompanyRecord>;
  };
  verification: CommittedCompanyCase["verification"] & { proposalReferencesVerified: true };
};
export type CompanyCase = CommittedCompanyCase | PendingCompanyCase;

export type CompanyCaseClient = {
  /** Derive the owner-bound recovery ID before any POST is attempted. */
  caseIdForRequest(requestId: string): Promise<string>;
  submit(request: string, options: { requestId: string; signal: AbortSignal }): Promise<CompanyCase>;
  read(caseId: string, options: { signal: AbortSignal }): Promise<CompanyCase>;
};

export type CompanyCaseConnection = {
  session: CompanyCaseSession;
  client?: CompanyCaseClient;
};

/** A stateful view must be remounted before any prior owner's request or result can render. */
export function companyCaseSessionKey(connection?: CompanyCaseConnection): string {
  const session = connection?.session;
  return session?.status === "ready" ? `owner:${session.subject}` : `session:${session?.status ?? "disconnected"}`;
}

export type CompanyCaseViewState =
  | { status: "idle" }
  | { status: "preparing"; request: string; requestId: string }
  | { status: "submitting"; request: string; requestId: string; caseId: string }
  | { status: "reading"; caseId: string }
  | { status: "saved"; value: CommittedCompanyCase }
  | { status: "awaiting_review"; value: PendingCompanyCase }
  | { status: "failed"; message: string; caseId?: string; requestId?: string; outcomeUnknown: boolean; requiresSignIn?: boolean };

const SHA256 = /^[a-f0-9]{64}$/i;
const CONTROL = /[\u0000-\u001f\u007f-\u009f]/;
const record = (value: unknown): value is Record<string, unknown> =>
  Boolean(value && typeof value === "object" && !Array.isArray(value));
const text = (value: unknown, max: number): value is string =>
  typeof value === "string" && value.trim().length > 0 && value.length <= max;
const timestamp = (value: unknown): value is string =>
  typeof value === "string" && /^\d{4}-\d\d-\d\dT/.test(value) && Number.isFinite(Date.parse(value));
const digest = (value: unknown): value is string => typeof value === "string" && SHA256.test(value);

/** Bounded opaque identifiers are encoded by the shared navigation helper, never interpreted as URLs. */
export function isCompanyCaseId(value: unknown): value is string {
  return typeof value === "string" && value.trim() === value && value.length > 0 && value.length <= 256 && !CONTROL.test(value);
}

export function companyWorkspaceSelection(search: string): { enabled: boolean; caseId?: string; invalidCase: boolean } {
  const query = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search);
  const workspaces = query.getAll("workspace");
  const enabled = workspaces.includes("company");
  if (!enabled) return { enabled: false, invalidCase: false };
  // Ambiguous company navigation must never fall back to a public request path.
  if (workspaces.length !== 1) return { enabled: true, invalidCase: true };
  const ids = query.getAll("case");
  if (!ids.length) return { enabled: true, invalidCase: false };
  if (ids.length !== 1 || !isCompanyCaseId(ids[0])) return { enabled: true, invalidCase: true };
  return { enabled: true, caseId: ids[0], invalidCase: false };
}

/** Fail closed at the presentation boundary, including crossed owner, request and receipt identities. */
export function requireVerifiedCompanyCase(
  value: unknown,
  expected: { ownerSubject: string; caseId?: string; requestId?: string; request?: string },
): CompanyCase {
  if (!record(value) || !isCompanyCaseId(value.caseId) || !isCompanyCaseId(value.requestId) ||
    !text(expected.ownerSubject, 512) || value.ownerSubject !== expected.ownerSubject || !text(value.request, 2000) ||
    (expected.caseId !== undefined && value.caseId !== expected.caseId) ||
    (expected.requestId !== undefined && value.requestId !== expected.requestId) ||
    (expected.request !== undefined && value.request !== expected.request)) {
    throw new Error("The saved case identity could not be verified.");
  }
  const { result, receipt, persistence, verification } = value;
  if (!record(result) || !isCompanyCaseId(result.id) || !text(result.text, 100000) || !timestamp(result.fetchedAt) ||
    !digest(result.sha256) || !Array.isArray(result.sources) || result.sources.length === 0 || result.sources.length > 56 ||
    !result.sources.every((source: unknown) => record(source) && text(source.title, 512) && text(source.reference, 4096) &&
      ((timestamp(source.fetchedAt) && source.recordedAt === undefined) || (timestamp(source.recordedAt) && source.fetchedAt === undefined)) &&
      (source.sha256 === undefined || digest(source.sha256)))) {
    throw new Error("The saved result and sources could not be verified.");
  }
  if (!record(receipt) || !isCompanyCaseId(receipt.id) || receipt.caseId !== value.caseId || receipt.resultId !== result.id ||
    !digest(receipt.resultSha256) || receipt.resultSha256.toLowerCase() !== result.sha256.toLowerCase() ||
    !digest(receipt.sha256) || !timestamp(receipt.createdAt) || receipt.integrity !== "unsigned" ||
    !record(persistence) || !record(verification) || verification.resultDigestVerified !== true ||
    verification.receiptDigestVerified !== true || verification.receiptBindingVerified !== true) {
    throw new Error("The saved receipt and storage commit could not be verified.");
  }
  if (persistence.merged === true) {
    if (persistence.nativeReadbackVerified !== true || !isCompanyCaseId(persistence.nativeCommitId) ||
      "proposedRecords" in persistence || "proposalReadbackVerified" in persistence) {
      throw new Error("The saved storage commit could not be verified.");
    }
  } else {
    const proposed = persistence.proposedRecords;
    if (persistence.merged !== false || persistence.nativeReadbackVerified !== false ||
      persistence.proposalReadbackVerified !== true || !isCompanyCaseId(persistence.changeRequestId) ||
      !["in_review", "changes_requested", "approved"].includes(persistence.reviewStatus as string) ||
      "nativeCommitId" in persistence || "nativeRecords" in persistence || "native_records" in persistence ||
      verification.proposalReferencesVerified !== true || !record(proposed) ||
      Object.keys(proposed).sort().join(",") !== "case,receipt,result") {
      throw new Error("The pending review could not be verified.");
    }
    const entries = ["case", "result", "receipt"].map((key) => proposed[key]);
    if (entries.some((item) => !record(item) ||
      Object.keys(item).sort().join(",") !== "headCommitId,operationId,payloadSha256" ||
      !isCompanyCaseId(item.operationId) || !isCompanyCaseId(item.headCommitId) || !digest(item.payloadSha256)) ||
      new Set(entries.map((item) => (item as ProposedCompanyRecord).operationId)).size !== 3 ||
      new Set(entries.map((item) => (item as ProposedCompanyRecord).headCommitId)).size !== 3 ||
      result.id !== (proposed.result as ProposedCompanyRecord).headCommitId ||
      receipt.id !== (proposed.receipt as ProposedCompanyRecord).headCommitId) {
      throw new Error("The pending proposal identities could not be verified.");
    }
  }
  return value as CompanyCase;
}

/** Existing committed-only callers retain a strict finality boundary. */
export function requireCommittedCompanyCase(
  value: unknown,
  expected: { ownerSubject: string; caseId?: string; requestId?: string; request?: string },
): CommittedCompanyCase {
  const verified = requireVerifiedCompanyCase(value, expected);
  if (!verified.persistence.merged) throw new Error("The case is awaiting review.");
  return verified as CommittedCompanyCase;
}


/** Error copy is deliberately fixed: raw transport errors may contain private request or auth details. */
export function companyCaseFailure(error: unknown, requestId?: string): Extract<CompanyCaseViewState, { status: "failed" }> {
  const failure = record(error) ? error : {};
  const caseId = isCompanyCaseId(failure.caseId) ? failure.caseId : undefined;
  if (failure.code === "unauthorized" || failure.code === "forbidden") {
    const unknown = failure.outcomeUnknown === true;
    return { status: "failed", message: unknown
      ? "Sign in with the authorized account, then check this same case. The previous save outcome is still unknown."
      : "This session cannot open the company case. Sign in with the authorized account.", caseId: unknown ? caseId : undefined, requestId, outcomeUnknown: unknown, requiresSignIn: true };
  }
  if (failure.code === "invalid_request" && failure.outcomeUnknown === false) {
    return { status: "failed", message: "This request could not be sent. Include GSPC in a request of up to 2,000 characters.", requestId, outcomeUnknown: false };
  }
  if (failure.outcomeUnknown === true) {
    return { status: "failed", message: "The save could not be confirmed. Check the same case before submitting again.", caseId, requestId, outcomeUnknown: true };
  }
  if (failure.code === "not_found") {
    return { status: "failed", message: "This case is not available to this account. No saved result is shown.", caseId, requestId, outcomeUnknown: false };
  }
  return {
    status: "failed",
    message: requestId
      ? "The save could not be confirmed. Check the same case before submitting again."
      : "The saved case could not be verified or reached. No saved result is shown.",
    caseId,
    requestId,
    outcomeUnknown: Boolean(requestId),
  };
}

export function companyCaseReadFailure(error: unknown, caseId: string, requestId?: string): Extract<CompanyCaseViewState, { status: "failed" }> {
  const failure = companyCaseFailure(error, requestId);
  // A 404 while a pending write completes is not proof that its POST may be repeated.
  return { ...failure, caseId, outcomeUnknown: failure.outcomeUnknown || !record(error) || (error.code !== "unauthorized" && error.code !== "forbidden") };
}
