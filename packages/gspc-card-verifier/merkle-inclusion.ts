/**
 * merkle-inclusion.ts — RFC 6962 Merkle inclusion-proof library.
 *
 * Fixes the tree_caveat in public/root.json: 140 and 144 leaf sets share a root
 * because we used Bitcoin-style odd-node duplication with NO domain separation.
 * This library uses 0x00 (leaf) / 0x01 (node) prefix per RFC 6962 §2.1.
 *
 * ~40 lines over @noble/hashes (MIT, v2.4.0, zero deps, pure JS).
 * No Node built-ins — runs in Workers, browsers, Node, Deno.
 *
 * Usage:
 *   const root = computeRootRFC6962(leaves);
 *   const proof = inclusionProof(leaves, leafIndex);
 *   const valid = verifyInclusion(root, leaves[leafIndex], proof);
 */

import { sha256 } from "@noble/hashes/sha256";

const LEAF_PREFIX = 0x00;
const NODE_PREFIX = 0x01;

function hashLeaf(data: Uint8Array): Uint8Array {
  const buf = new Uint8Array(1 + data.length);
  buf[0] = LEAF_PREFIX;
  buf.set(data, 1);
  return sha256(buf);
}

function hashNode(left: Uint8Array, right: Uint8Array): Uint8Array {
  const buf = new Uint8Array(1 + left.length + right.length);
  buf[0] = NODE_PREFIX;
  buf.set(left, 1);
  buf.set(right, 1 + left.length);
  return sha256(buf);
}

/** Compute the Merkle root with RFC 6962 domain separation. */
export function computeRootRFC6962(leaves: Uint8Array[]): Uint8Array {
  if (leaves.length === 0) throw new Error("no leaves");
  let layer = leaves.map(hashLeaf);
  while (layer.length > 1) {
    const next: Uint8Array[] = [];
    for (let i = 0; i < layer.length; i += 2) {
      if (i + 1 < layer.length) {
        next.push(hashNode(layer[i], layer[i + 1]));
      } else {
        // Promote odd node (no sibling to combine with)
        next.push(layer[i]);
      }
    }
    layer = next;
  }
  return layer[0];
}

/** Build an inclusion proof for a leaf. */
export function inclusionProof(leaves: Uint8Array[], index: number): Uint8Array[] {
  const proof: Uint8Array[] = [];
  let layer = leaves.map(hashLeaf);
  let idx = index;
  while (layer.length > 1) {
    const siblingIdx = idx ^ 1;
    if (siblingIdx < layer.length) proof.push(layer[siblingIdx]);
    const next: Uint8Array[] = [];
    for (let i = 0; i < layer.length; i += 2) {
      if (i + 1 < layer.length) {
        next.push(hashNode(layer[i], layer[i + 1]));
      } else {
        next.push(layer[i]);
      }
    }
    layer = next;
    idx = idx >> 1;
  }
  return proof;
}

/** Verify an inclusion proof. */
export function verifyInclusion(
  root: Uint8Array,
  leaf: Uint8Array,
  proof: Uint8Array[],
  index: number
): boolean {
  let hash = hashLeaf(leaf);
  let idx = index;
  for (const sibling of proof) {
    if (idx % 2 === 0) {
      hash = hashNode(hash, sibling);
    } else {
      hash = hashNode(sibling, hash);
    }
    idx = idx >> 1;
  }
  return bytesEqual(hash, root);
}

function bytesEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
  return true;
}
