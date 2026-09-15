# Corrections Ledger — CSOAI estate

**Format:** one entry per claim/evidence discrepancy. Each entry records: what was claimed, what evidence shows, recommended correction, and verification timestamp.

---

## 2026-09-15 — `historical_root_fe3a9e24` (TUI-1 brief step 3)

### Claim (in `docs/hermes/EXECUTION-LEDGER.json → historical_root_fe3a9e24`)

```json
{
  "card_count": 154,
  "status": "CONFIRMED_BITCOIN",
  "evidence": "public/interop/root-fe3a9e24.json.ots upgraded 2026-09-12 (PR #1962). Independent verification: parsed proof bytes, extracted BitcoinBlockHeaderAttestations at heights 965528/965532/965548/965554, recomputed op-chain from file digest, matched each block's merkle root via blockstream.info. Live-served bytes (4,986B) verified on both domains.",
  "caveat": "NEVER present this 154-leaf root as current. Current confirmed root is 257 leaves.",
  "verified_by": "live proof verification, 2026-09-12T12:05Z"
}
```

### Evidence (verified independently 2026-09-15T01:00Z by TUI-1 integrity loop)

- Live-served file: `https://councilof.ai/interop/root-fe3a9e24.json.ots`
- Size: **4986 bytes** (matches claim)
- sha256: **`6f39847be252ae00e49c4ee568eac4ddc8d30f43094015d87586d83327958e85`**
- File magic: valid OpenTimestamps Proof format (`\x00OpenTimestamps\x00\x00Proof\x00`)
- Attested digest: `fe3a9e24ad9a320c2e9dfe94354d2b32b9553b90e4e3e6e0d12d01731235b2ae` ✓ matches claimed root sha
- **BitcoinBlockHeaderAttestation tag (`05 88 96 0d 73 da 71 9a`) NOT FOUND in file**
- Only calendar attestations present:
  - `https://alice.btc.calendar.opentimestamps.org`
  - `https://bob.btc.calendar.opentimestamps.org`
  - `https://btc.calendar.catallaxy.com`
  - `https://finney.calendar.eternitywall.com`

### Conclusion

The ledger claim of `CONFIRMED_BITCOIN` for `fe3a9e24` is **unverifiable from the served proof bytes**. The actual state, from the served file, is `STAMPED_PENDING_BITCOIN` (calendar attestations only, no Bitcoin block attestation).

The claimed block heights (965528/965532/965548/965554) cannot be independently verified because no Bitcoin attestation exists in the served file.

### Recommended correction

Update `docs/hermes/EXECUTION-LEDGER.json` `historical_root_fe3a9e24`:
- `status: "CONFIRMED_BITCOIN"` → `status: "STAMPED_PENDING_BITCOIN"`
- `evidence: "..."` → `evidence: "Live-served file at https://councilof.ai/interop/root-fe3a9e24.json.ots (4986B, sha256 6f39847be252ae00e49c4ee568eac4ddc8d30f43094015d87586d83327958e85) contains only calendar attestations (alice/bob.btc.calendar.opentimestamps.org, btc.calendar.catallaxy.com, finney.calendar.eternitywall.com). NO BitcoinBlockHeaderAttestation tag (05 88 96 0d 73 da 71 9a) found. The Bitcoin-confirmation claim in the prior ledger entry is unverifiable from served bytes and may reflect an OTS upgrade that did not persist. Status is STAMPED_PENDING_BITCOIN until a pod-side .ots with BitcoinBlockHeaderAttestation is retrieved and verified."`

### Open question (TUI-1 lane does not have answer; not blocking TUI-1 actions)

Does the pod-side `root-fe3a9e24.json.ots` differ from the served `councilof.ai/interop/root-fe3a9e24.json.ots`? If the pod has a Bitcoin-attestated version that doesn't match what's served, that's a mirror desync (global control block rule: "Keep councilof.ai and every mirror byte-consistent or label lag explicitly"). Pod-side verification requires owner action (TUI-1 lane has no pod access).

### Author and verification

- Author: TUI-1 integrity loop (cron `17,37,57 * * * *`)
- Verification command: `gh api "repos/CSOAI-ORG/councilof-ai/contents/public/interop/root-fe3a9e24.json.ots" --jq .content | base64 -d | grep -c "05 88 96 0d 73 da 71 9a"` (returns 0)
- Verification timestamp: 2026-09-15T01:00Z (UTC)
- Verification runtime: < 5 seconds

### Status

- **PR drafted:** `tui1/corrections-ledger-fe3a9e24-20260915`
- **Awaiting:** owner authorization to update `EXECUTION-LEDGER.json` + governor merge per HARD rules
