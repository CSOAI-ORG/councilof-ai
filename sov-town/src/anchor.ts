import { createHash } from "crypto";
import type { Attestation } from "./types.js";

export function anchorAttestations(attestations: Attestation[]): { txHash: string; merkleRoot: string; count: number } {
  const leaves = attestations.map((a) => hash(a.signature + a.publicKey + a.signedAt));
  let root = leaves[0] ?? hash("sov-town-empty");
  for (let i = 1; i < leaves.length; i++) {
    root = hash(root + leaves[i]);
  }
  const txHash = hash("sov-town-batch:" + root + Date.now().toString());
  return { txHash, merkleRoot: root, count: attestations.length };
}

function hash(input: string): string {
  return createHash("sha256").update(input).digest("hex").slice(0, 64);
}
