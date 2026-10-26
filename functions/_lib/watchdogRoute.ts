// Public Watchdog routing (Measure). Routes each artifact type to its EXISTING verifier
// and reports three SEPARATE results. No new signer, no scheduler. Measurement, not endorsement.
// Spec: docs/watchdog/routing-spec.md
export type WState = "VERIFIED" | "FAILED" | "UNMEASURED" | "UNCHECKABLE";
export type ArtifactType =
  | "signed_mill_card" | "card_root" | "capsule_index" | "capsule_batch"
  | "signed_interop_artifact" | "did_key" | "ots_proof" | "rekor_entry" | "evidence_link";

export interface WatchdogResult {
  artifact_type: ArtifactType;
  artifact_url: string | null;
  verifier: string;               // ROUTES[artifact_type].verifier
  signature_valid: { state: WState; code: string };
  root_inclusion: { state: WState; code: string; root_id: string | null };
  conclusion: { state: WState; code: string };
  http_status: number | null;     // last retrieval status, null if not fetched
  checked_at: string;             // ISO 8601 UTC
}

export const ROUTES: Record<ArtifactType, { verifier: string; source: string }> = {
  signed_mill_card: { verifier: "verifyCard", source: "functions/_lib/cardVerify.ts (+ cardV0Verify.ts, MCP verify_card)" },
  card_root: { verifier: "verifyPublicRoot", source: "functions/_lib/publicRootVerify.ts (merkle rule of scripts/publish_public_root.py)" },
  capsule_index: { verifier: "verifySidecar + merkle", source: "functions/_lib/measurementCapsule.ts (RFC6962 rule)" },
  capsule_batch: { verifier: "verifyCapsule / rootFromProof", source: "functions/_lib/measurementCapsule.ts (MCP verify_capsule, verify_inclusion)" },
  signed_interop_artifact: { verifier: "sign_interop_artifact.verify", source: "scripts/sign_interop_artifact.py" },
  did_key: { verifier: "anchorsFromDid vs PINNED_ANCHORS", source: "functions/_lib/cardVerify.ts" },
  ots_proof: { verifier: "ots verify (existing workflow)", source: ".github/workflows/card-root-ots-upgrade.yml, scripts/maintain_card_root_ots.py" },
  rekor_entry: { verifier: "rekor_inclusion_verify.py --verify-root", source: "scripts/rekor_inclusion_verify.py" },
  evidence_link: { verifier: "HTTP HEAD + zenodoStatus", source: "functions/_lib/zenodoStatus.ts" },
};

/** Map an existing three-state verdict (VALID/INVALID/UNCHECKABLE) without changing its meaning. */
export function fromVerdict(s: "VALID" | "INVALID" | "UNCHECKABLE" | null | undefined): WState {
  if (s === "VALID") return "VERIFIED";
  if (s === "INVALID") return "FAILED";
  if (s === "UNCHECKABLE") return "UNCHECKABLE";
  return "UNMEASURED";
}

/** Retrieval outcome: absent data is UNMEASURED; 4xx/5xx/timeout is UNCHECKABLE, never FAILED. */
export function retrievalState(status: number | null, timedOut = false): WState | null {
  if (timedOut) return "UNCHECKABLE";
  if (status === null) return "UNMEASURED";
  if (status >= 400) return "UNCHECKABLE";
  return null; // retrieved; the routed verifier decides
}

/** Evidence links carry no signature or root: those two fields are always UNMEASURED. */
export function evidenceLinkResult(url: string, status: number | null, timedOut: boolean, checkedAt: string): WatchdogResult {
  const r = retrievalState(status, timedOut);
  const code = timedOut ? "TIMEOUT" : status === 410 ? "GONE_410" : status === null ? "NOT_FETCHED" : status >= 400 ? `HTTP_${status}` : "REACHABLE";
  return {
    artifact_type: "evidence_link", artifact_url: url, verifier: ROUTES.evidence_link.verifier,
    signature_valid: { state: "UNMEASURED", code: "NO_SIGNATURE" },
    root_inclusion: { state: "UNMEASURED", code: "NO_ROOT", root_id: null },
    // Reachable only means "resolves"; it is not a check of content, so VERIFIED is never set here.
    conclusion: { state: r ?? "UNMEASURED", code },
    http_status: status, checked_at: checkedAt,
  };
}
