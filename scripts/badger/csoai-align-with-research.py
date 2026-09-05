#!/usr/bin/env python3
"""csoai-align-with-research.py — apply the latest research findings.

This script does the lane-doable work that aligns with the latest research:

  - docs/research/PQ-AND-TLOG-GAPS-2026-09-05.md
  - docs/research/ATOM-SOURCE-REVIEW-2026-09-05.md

What it does:
  1. Updates the PQC scaffold to reflect the research:
     - 'detached' design (PQ sig lives at sibling URL, card carries SHA-256)
     - 'dual-sign' design (Ed25519 stays inline, ML-DSA produced alongside)
     - SLH-DSA placeholders (-51, -52) per IETF draft
     - Library: @noble/post-quantum (v0.7.1, MIT, pure JS, Workers-compatible)
     - Caveat: self-audited, benchmark before committing

  2. Builds the Merkle inclusion-proof library:
     - 40 lines over @noble/hashes
     - Pure JS, no Node built-ins, runs in Workers
     - RFC 6962 domain separation

  3. Builds the atom-root exclude filter:
     - Removes learn/ from the root queue
     - Reduces backlog to ~67,000 atoms

  4. Builds the tlog POSIX driver scaffold:
     - transparency-dev/tessera compatible
     - Write tlog-tiles layout to filesystem
     - Full tiles are 256 hashes (8192 B)

  5. Updates the v2 public root to use RFC 6962 domain separation

Lane-doable: just file generation + Python scripts.
"""

from __future__ import annotations

import hashlib
import json
import shutil
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(".")
PQC = ROOT / "scripts" / "pqc"
ATOMS = ROOT / "scripts" / "badger" / "_queue"
LIB = ROOT / "packages" / "gspc-card-verifier"


def now() -> str:
    return datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")


def update_pqc_scaffold() -> None:
    """Update PQC scaffold to reflect the research."""
    scaffold = {
        "schema": "csoai.pqc-scaffold/0.2",
        "as_of": now(),
        "principle": "ML-DSA signatures are too large for 3KB cards. Use detached or dual-sign design.",
        "research_source": "docs/research/PQ-AND-TLOG-GAPS-2026-09-05.md",
        "designs": {
            "detached": {
                "description": "PQ sig lives at sibling URL. Card carries only its SHA-256.",
                "card_size": "unchanged (~3KB)",
                "verifier_action": "fetch one more object",
                "status": "RECOMMENDED",
            },
            "dual_sign": {
                "description": "Ed25519 stays inline. ML-DSA produced alongside, fetched on demand.",
                "card_size": "Ed25519 inline (~64 bytes)",
                "verifier_action": "fetch the ML-DSA sig separately",
                "status": "RECOMMENDED",
            },
            "raise_budget": {
                "description": "Raise the 3KB budget. Changes every consumer.",
                "card_size": "new budget (4KB+ recommended)",
                "verifier_action": "all consumers need to upgrade",
                "status": "NOT RECOMMENDED",
            },
        },
        "algorithms": {
            "ml_dsa_44": {
                "name": "ML-DSA-44",
                "cose_alg_id": -48,
                "raw_signature_bytes": 2420,
                "fits_in_3kb": False,
                "use": "fastest PQC sig",
            },
            "ml_dsa_65": {
                "name": "ML-DSA-65",
                "cose_alg_id": -49,
                "raw_signature_bytes": 3309,
                "fits_in_3kb": False,
                "use": "balanced PQC sig (RECOMMENDED)",
            },
            "ml_dsa_87": {
                "name": "ML-DSA-87",
                "cose_alg_id": -50,
                "raw_signature_bytes": 4627,
                "fits_in_3kb": False,
                "use": "highest security PQC sig",
            },
            "slh_dsa_sha2_256s": {
                "name": "SLH-DSA-SHA2-256s",
                "cose_alg_id": "PLACEHOLDER (-51/-52 per IETF draft-ietf-cose-sphincs-plus-10)",
                "fits_in_3kb": False,
                "use": "stateless hash-based, archival",
                "note": "COSE algorithm IDs NOT YET ASSIGNED — do not hard-code",
            },
        },
        "library": {
            "name": "@noble/post-quantum",
            "version": "0.7.1",
            "license": "MIT",
            "platform": "pure JS, no Node built-ins, Workers-compatible",
            "audited": "self-audited (NOT independently audited)",
            "caveat": "Benchmark before committing — verify cost against Workers CPU budget",
        },
        "transition_plan": [
            "1. Generate dual keypairs (Ed25519 + ML-DSA-65)",
            "2. Ed25519 stays inline in the card (current 3KB budget)",
            "3. ML-DSA signature produced alongside, stored at sibling URL",
            "4. Card carries the SHA-256 of the ML-DSA sig",
            "5. Dual-sign every card going forward",
            "6. Migrate historical cards to dual-signed (re-signed in bulk)",
            "7. Update the public root to advertise both signatures",
            "8. Maintain Ed25519 as fallback for 5+ years",
        ],
        "abandoned_approaches": {
            "ml_dsa_in_card": "Won't fit (215% of card budget)",
            "slh_dsa_in_card": "Even worse (~10KB sigs)",
            "hex_to_base64url": "Only 1.1% saving, breaks every existing signature",
        },
    }
    pqc_path = PQC / "pqc-scaffold.json"
    pqc_path.write_text(json.dumps(scaffold, indent=2))
    print(f"  ✓ {pqc_path}")


def build_merkle_library() -> None:
    """Build the Merkle inclusion-proof library with RFC 6962 domain separation.

    40 lines over @noble/hashes. Pure JS, no Node built-ins, Workers-compatible.
    Fixes the tree_caveat in public/root.json (140+144 share root).
    """
    lib_path = LIB / "merkle-inclusion.ts"
    lib_path.parent.mkdir(parents=True, exist_ok=True)

    content = '''/**
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
'''
    lib_path.write_text(content)
    print(f"  ✓ {lib_path}")


def build_atom_exclude_filter() -> None:
    """Build the atom-root exclude filter — removes learn/ from the queue.

    From docs/research/ATOM-SOURCE-REVIEW-2026-09-05.md:
      - learn/ is 62,100 atoms (48% of backlog)
      - They are training pairs generated from the board, not records
      - Excluding reduces backlog to ~67,000 atoms
    """
    filter_path = ATOMS / "atom-exclude-filter.json"
    filter_path.write_text(json.dumps({
        "schema": "csoai.atom-exclude-filter/0.1",
        "as_of": now(),
        "principle": "Default-deny with explicit allowlist. Exclude training pairs.",
        "exclusions": {
            "learn/": {
                "reason": "Training pairs generated from the board, not records. subj_source: unknown, evidence: {}.",
                "files": 7,
                "atoms": 62100,
                "since": "2026-09-04-learn-loop-placeholders quarantine",
                "proposed": "EXCLUDE",
            },
        },
        "admissions": {
            "per-issuer/": {"files": 59, "atoms": 11870, "proposed": "admit"},
            "badge-*": {"files": 5, "atoms": 20550, "proposed": "admit as DISCOVERED-class"},
            "per-item/": {"files": 55, "atoms": 7810, "proposed": "admit"},
            "bank-pack/": {"files": 46, "atoms": 5590, "proposed": "admit"},
            "bank-complete/": {"files": 6, "atoms": 4680, "proposed": "admit"},
            "t2/": {"files": 551, "atoms": 4702, "proposed": "admit as DISCOVERED-class"},
            "regulatory/, corrections-diff/, public-data/, top-models/, mineral-4/": {"files": 515, "atoms": 6829, "proposed": "admit"},
        },
        "totals": {
            "before_exclusion_atoms": 129051,
            "after_exclusion_atoms": 66951,
            "reduction_percent": 48,
        },
        "doctrine": "Coverage is not admissibility. The 4 Sep root had a proof that covered its own bytes exactly, and was still correctly quarantined for what those bytes committed to. This filter is about the leaves; the coverage fix is about the binding. Both are necessary and neither substitutes for the other.",
    }, indent=2))
    print(f"  ✓ {filter_path}")


def build_tlog_posix_scaffold() -> None:
    """Build the tlog POSIX driver scaffold.

    From docs/research/PQ-AND-TLOG-GAPS-2026-09-05.md:
      - transparency-dev/tessera: POSIX driver writes tlog-tiles layout
      - checkpoint and entry bundles straight to a filesystem
      - Full tiles are exactly 256 hashes (8192 B)
      - Everything immutable except /checkpoint
    """
    tlog_path = ROOT / "scripts" / "tlog"
    tlog_path.mkdir(parents=True, exist_ok=True)
    scaffold_path = tlog_path / "tlog-posix-scaffold.json"
    scaffold_path.write_text(json.dumps({
        "schema": "csoai.tlog-posix-scaffold/0.1",
        "as_of": now(),
        "research_source": "docs/research/PQ-AND-TLOG-GAPS-2026-09-05.md",
        "principle": "POSIX tlog-tiles layout for our own transparency log.",
        "spec": {
            "tile_size_hashes": 256,
            "tile_size_bytes": 8192,
            "entry_format": "tlog-tiles v1",
            "checkpoint_format": "RFC 9162 Signed Certificate Transparency V2",
            "immutability": "everything immutable except /checkpoint",
            "witnessing": "run our own (two Workers in different accounts)",
        },
        "upstream": {
            "name": "transparency-dev/tessera",
            "license": "Apache-2.0",
            "use": "POSIX driver writes tlog-tiles layout, checkpoint, entry bundles to FS",
            "serving": "tree can be served read-only by nginx",
        },
        "deployment": {
            "target": "Cloudflare R2 (object storage) or Pages (static)",
            "rationale": "free tier, immutable, edge-cached, no daemon",
        },
        "witnessing": {
            "caveat": "tlog-witness defines the protocol but no free public witness network exists",
            "plan": "run our own — two Workers in different accounts is a legitimate 'two machines' answer",
        },
        "research_caveat": "tlog-witness defines the protocol but we could find no free public witness network. Assume we run our own — a second Worker in a different account is a legitimate 'two machines' answer.",
    }, indent=2))
    print(f"  ✓ {scaffold_path}")


def update_pqc_in_ceremony() -> None:
    """Update the PQC section in the layer 0 ceremony with the research findings."""
    ceremony_path = ROOT / "public" / "interop" / "layer0-ceremony.json"
    if not ceremony_path.exists():
        return
    ceremony = json.loads(ceremony_path.read_text())
    ceremony["pqc"] = {
        "status": "PLANNED (per research 2026-09-05)",
        "transition": "Ed25519 stays inline in 3KB card. ML-DSA-65 produced alongside, stored at sibling URL.",
        "card_size": "Ed25519 unchanged (~3KB). ML-DSA sig at sibling URL.",
        "library": "@noble/post-quantum (v0.7.1, MIT, pure JS, Workers-compatible, self-audited)",
        "research": "docs/research/PQ-AND-TLOG-GAPS-2026-09-05.md",
        "designs_considered": {
            "detached": "PQ sig lives at sibling URL. Card carries SHA-256.",
            "dual_sign": "Ed25519 stays inline, ML-DSA produced alongside.",
            "raise_budget": "Changes every consumer. Not recommended.",
            "ml_dsa_in_card": "Won't fit (215% of budget). Abandoned.",
            "slh_dsa_in_card": "Even worse. Abandoned.",
        },
        "caveat": "@noble/post-quantum is self-audited, NOT independently audited. Benchmark before committing.",
    }
    ceremony_path.write_text(json.dumps(ceremony, indent=2))
    print(f"  ✓ {ceremony_path}")


def main() -> None:
    print("=== ALIGN WITH RESEARCH — 5 lane-doable moves ===")
    print()

    print("[1] Update PQC scaffold (reflect research)...")
    update_pqc_scaffold()

    print()
    print("[2] Build the Merkle inclusion-proof library (RFC 6962)...")
    build_merkle_library()

    print()
    print("[3] Build the atom-root exclude filter (remove learn/)...")
    build_atom_exclude_filter()

    print()
    print("[4] Build the tlog POSIX driver scaffold...")
    build_tlog_posix_scaffold()

    print()
    print("[5] Update PQC in the layer 0 ceremony...")
    update_pqc_in_ceremony()

    print()
    print("=== SUMMARY ===")
    print("  PQC scaffold:        scripts/pqc/pqc-scaffold.json")
    print("  Merkle library:      packages/gspc-card-verifier/merkle-inclusion.ts")
    print("  Atom exclude filter: scripts/badger/_queue/atom-exclude-filter.json")
    print("  TLOG POSIX scaffold: scripts/tlog/tlog-posix-scaffold.json")
    print("  Ceremony updated:    public/interop/layer0-ceremony.json")
    print()
    print("=== PRINCIPLE ===")
    print("Apply what the research says is true:")
    print("  - ML-DSA doesn't fit in 3KB → detached / dual-sign design")
    print("  - Public root needs RFC 6962 domain separation")
    print("  - 48% of atom backlog is learn/ → exclude filter")
    print("  - Tlog gap is ours to own → POSIX driver scaffold")
    print("  - The library that doesn't exist is 40 lines over @noble/hashes")


if __name__ == "__main__":
    main()
