export type RunAttestation = "ED25519_SIGNED" | "CONTENT_ADDRESSED_UNSIGNED";

export type AxisRunEvidence = {
  href: string;
  label: string;
  detail: string;
};

/** A content ID identifies bytes; only an explicit signature state identifies a signer. */
export function axisRunEvidence(a: {
  evidence_url?: unknown;
  run_attestation?: unknown;
  [key: string]: unknown;
}): AxisRunEvidence | null {
  if (typeof a.evidence_url !== "string" || !a.evidence_url.trim()) return null;
  if (a.run_attestation === "ED25519_SIGNED") {
    return {
      href: a.evidence_url,
      label: "Ed25519-signed run",
      detail: "This run declares an Ed25519 signature.",
    };
  }
  if (a.run_attestation === "CONTENT_ADDRESSED_UNSIGNED") {
    return {
      href: a.evidence_url,
      label: "Content-addressed unsigned run",
      detail: "Its content ID identifies the bytes; it is not a signature.",
    };
  }
  return {
    href: a.evidence_url,
    label: "Run artifact",
    detail: "No run-attestation state was declared.",
  };
}
