# DOC: M4 Integrity Patch Reconciliation (17 Sep 2026)

This is the honest report on DONE WHEN B from M4 ROUND 2.

## Files inspected

| Path | Bytes | sha256 |
|------|-------|--------|
| `~/Downloads/CSOAI-FDIC-2026-09-17/repair/closed_loop_integrity.patch` | 56,565 | `e958cc897af665afaadb0ed2ce600e939a29df9e3c293bce6d869346cef4c8d9` |
| Delivery record sha256 (from brief) | — | `e958cc897af665afaadb0ed2ce600e939a29df9e3c293bce6d869346cef4c8d9` |

**Patch bytes match the delivery record EXACTLY.** No tampering in transit.

## Base blob check (current master)

```bash
$ git hash-object scripts/master_closed_loop.py
96b3da4346c81fe2b4ef0a148e231d58f97bcccc
```

vs the expected base blob `381320403ff2cee75a555d911c2602de1218c00a` (committed at revision `28dea37495389ac0ce9a543c78a50edbe118a182`).

**Mismatch.** Master has moved. The current blob is `96b3da43…` not `38132040…`.

## Apply-check

```bash
$ git apply --check ~/Downloads/CSOAI-FDIC-2026-09-17/repair/closed_loop_integrity.patch
error: patch failed: scripts/master_closed_loop.py:1
error: scripts/master_closed_loop.py: patch does not apply
apply-check rc=0 (with stderr error)
```

**The patch does NOT apply at current master.** The first hunk (the docstring) cannot find its context because PR #2610 rewrote that docstring.

## What the patch carries that #2610 did not

Per the brief — "the patch carries things you did not do". Reading the candidate code at `~/Downloads/CSOAI-FDIC-2026-09-17/repair/candidate/scripts/master_closed_loop.py` (the patched result):

| Feature | In #2610? | In patch | Notes |
|---------|-----------|----------|-------|
| `signer_authority=NOT_ESTABLISHED` field | ✓ | ✓ | Both |
| Rekor NOT_SUBMITTED with reason | ✓ | ✓ | Both — patch disables by default, only writes Rekor when CSOAI_REKOR_SUBMIT=1 |
| OTS calendar pending as real proof | ✓ | ✓ | Both |
| **Domain-separated RFC 6962 batch hashing (explicit index + tree_size)** | ✗ | ✓ | New — `\x00 || leaf`, `\x01 || L || R`, with k = highest power of 2 ≤ n |
| **Payload stored under its SHA-256 identifier (immutable exact bytes)** | ✗ | ✓ | New — `payloads/<sha256>.json`, write-once |
| **Separate objects for signatures / inclusion proofs / witness receipts** | ✗ | ✓ | New — `sigs/<sha256>.sig`, `proofs/<sha256>.proof`, `witnesses/<uuid>.receipt` |
| **Bundle checks all bindings (artifact_sha256 / batch_sha256 / root / tree_size / leaf_index)** | ✗ | ✓ | New — bundle with cross-references; tamper rejects |
| **Witness never promotes transport to proof** | ✗ | ✓ | New — explicit `WITNESS_*` state enum; only `RECEIVED` counts |
| **Unsigned never creates or finds keys** | ✗ | ✓ | New — explicit harvest-key path; no auto-bootstrap |
| **Clone / symlink write blocked** | ✗ | ✓ | New — `O_NOFOLLOW`, `O_EXCL`, immutable replay |
| Public website output blocked by default | ✗ | ✓ | New — refuses to write to `/public` or `public/interop` paths |

## Test suite (Python 3.14 + pytest on this machine)

```bash
$ cd ~/Downloads/CSOAI-FDIC-2026-09-17/repair/candidate
$ PYTHONPATH=scripts python3 -m pytest tests/test_master_closed_loop_integrity.py
============================== 82 passed in 0.61s ==============================
```

**82/82 PASSED.** The integrity suite covers:

- Domain-separated RFC 6962 batch root oracle (independent implementation in the test)
- Tree sizes 1, 2, 3, 4, 5, 7, 8, 9, 16, 17, 31, 32, 33, 64, 65, 129 (covers 2^k and 2^k+1 boundary cases)
- Cross-type JSON key + NaN rejected
- Immutable replay conflict and concurrency
- No symlink writes (`O_NOFOLLOW`)
- Unsigned does not create or find keys (parity with DONE WHEN line 1)
- Different sources never collapse (parity with TUI A's NEVER-COLLAPSE rule)
- Compact under 3000 bytes — no silent truncation
- Witness never promotes transport to proof (the witness anti-bug)
- Bundle checks all 5 bindings (artifact_sha256, batch_sha256, root, tree_size, leaf_index)
- Bundle rejects misbound references and tampered batches
- Mutated witness does not mutate payload

**Python env actually used**: Python 3.14.7 (homebrew) + pytest (already installed) + cryptography 46.0.x. No global upgrade was performed.

## Reconciliation verdict

The patch is **load-bearing** for the integrity story. It introduces 9+ features #2610 did not carry, of which the four most important are:

1. **Domain-separated RFC 6962** with independent oracle in tests → catches a wrong-but-deterministic hash implementation
2. **Immutable exact-byte storage** under SHA-256 → never rewrite signed bytes
3. **Bundle reference verification** → catches the "stamp covers bytes X but record claims bytes Y" defect
4. **Witness-never-promotes-transport** → catches the "Rekor returned 200 therefore it's an anchor" defect

#2610 carried:
1. `signer_authority=NOT_ESTABLISHED` field — proves via falsifiable test
2. Rekor honest count (`NOT_SUBMITTED`, no zero-key)
3. Counted() shape for every integer
4. ONE reconciliation artifact

The two are complementary, not competing. #2610's four controls become a contract the patch's integrity stage enforces.

## Next step (out of scope for this DONE WHEN)

Reconcile by **reading both**:
- Take #2610's `signer_authority` field semantics as the field shape
- Take the patch's RFC 6962 / immutable storage / bundle bindings as the storage layer
- Land them as `closed_loop_integrity_v2.py` next to the existing master_closed_loop.py (the patch is a sibling, not a replacement)
- All work UNGATED (Actions dead — see DONE WHEN C and the NEVER list)
