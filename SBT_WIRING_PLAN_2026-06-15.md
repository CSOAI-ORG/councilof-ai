# Solana SBT Wiring Plan — Sovereign Workflow
**Date:** 2026-06-15
**Author:** wire-sbt-task (subagent)
**Scope:** Wire the MEOK Solana SBT program into the sovereign workflow. **PLAN ONLY — no on-chain mutations, no .so rebuilds, no SBT_MOCK_MODE change.**

---

## 0. TL;DR for the parent agent

| Question | Answer |
|---|---|
| Is the SBT program live on devnet? | **No — by every realistic measure.** The local keypair derives program `7WbK…86HPs` and is **not present** on devnet RPC. The ID hardcoded in the bridge (`Dyd7…NAmxPxpo`) is **not present** on devnet either. The only ID from this set that DOES exist on devnet is `Dyd7…NYmxPxpo` (Y not A) — a real BPF executable, but **not** the one any of our code points at. |
| Bridge state? | **MOCK** (`SBT_MOCK_MODE=true` default). The `/sbt/mint`, `/sbt/verify/{id}`, `/sbt/{id}`, `/sbt/revoke/{id}`, `/sbt/list` endpoints all return the in-process `_mock_registry` dict. No real RPC, no real signing. |
| What changes if `SBT_MOCK_MODE=false`? | The `/sbt/mint` code path will try to: (1) load `~/.config/solana/id.json` (the **issuer/payer** keypair), (2) call the Solana RPC, (3) build the borsh-encoded `Mint` instruction, (4) sign and send a real tx. Right now this path is gated by `if MOCK_MODE or not SOLANA_AVAILABLE` so it short-circuits before any of that happens. **All other endpoints (`verify`, `get`, `revoke`, `list`) currently 501 in live mode** — so flipping the flag would *only* enable `mint` and would still leave verify/etc. stubbed. |
| Risks if `SBT_MOCK_MODE=false`? | (1) Payer keypair must exist and be funded with ≥~3 SOL on devnet. (2) `solana`, `solders`, `solana-py` must be importable in the FastAPI process (currently behind a try/except, with `SOLANA_AVAILABLE` controlling it). (3) The borsh encoding in `solana_bridge.py` lines 191–197 is **hand-rolled and disagrees with the Rust program's `Mint` layout** (Rust uses `token_id: u64` after `sbt_type: u8` — match — but the string length prefixes assume 4-byte, while the Rust program declares `String` which is borsh-encoded as 4-byte little-endian length — actually OK; **but the Python side does not include the `issuer: Pubkey` field as an extra account constraint** the way the Rust `Mint` accounts spec requires `system_program` and the PDA only — the `issuer` Pubkey is **not** in the accounts list passed in, which would fail on-chain). (4) No mainnet; even devnet costs real (devnet) SOL. (5) No state recovery — if the process restarts, the live verify path can no longer find any minted accounts because the live `verify` is unimplemented (`501`). (6) The `seed` in `_mint` uses `f"sbt-{sbt_type}-{int(time.time()*1000)}"` as a **single string seed**, but the Rust program derives its PDA from `["sbt", owner, sbt_type_byte, token_id_bytes]` — **mismatch** — meaning even if it built the right tx, the PDA it sends to would not be the PDA the program derives. **Do not flip the flag until all of the above is fixed and reviewed.** |
| 27+7 mint batch JSON? | Written to `~/clawd/sbt_mint_batch_27plus7.json` (36 KB). 27 CharacterGenesis + 7 VerifierReputation = 34 mints. Deterministic `token_id` from `sha256("genesis:<char_id>" or "archetype:<id>")[:16]`. |

---

## 1. On-chain reality (devnet public RPC, queried 2026-06-15)

```
GET https://api.devnet.solana.com  getAccountInfo
```

| Program ID | Source | Devnet status |
|---|---|---|
| `7WbK4XQBwPaqkmK9arT7WmMDzWKEBLRteJbDXtt86HPs` | derived from `target/deploy/meok_sbt-keypair.json` (the actual keypair file on disk) | **value: null** — does not exist on devnet |
| `Dyd7JtmmuA3RZZupk98mqRQ8uySZV9FwTE6aNAmxPxpo` | hardcoded default in `sovereign-temple/solana_bridge.py` (line 34); also in `solana-sbt/PROGRAM_SPEC.md` | **value: null** — does not exist on devnet |
| `Dyd7JtmmuA3RZZupk98mqRQ8uySZV9FwTE6aNYmxPxpo` | hardcoded default in `meok-one/meok_one/sbt.py` (line 23) — note: one-character difference (`Y` vs `A`) | **EXISTS** — `executable: true`, `owner: BPFLoaderUpgradeab1e11111111111111111111111`, `lamports: 1141440`, `space: 36` (a small BPF Loader upgradeable program) |

**What this means.** The artifact set has three different "the program ID"s and they don't agree. The local `meok_sbt.so` (106,912 bytes, ELF 64-bit LSB, BPF) is built but has not been deployed. The keypair on disk corresponds to a program that has never been deployed. The meok-one sbt.py points at a *different* program ID that *is* deployed on devnet, but it's almost certainly a coincidence (or a placeholder from a prior attempt) and **not** the same bytecode as `target/deploy/meok_sbt.so` — without reading its 36-byte data field (too small to be the full 106KB ELF) we cannot confirm. **The .so is NOT on-chain anywhere we can verify it.**

**Stale?** The `meok_sbt.so` mtime is `Jun 14 05:11`; the keypair is `Jun 14 05:11`; the program-keypair.json is `May 28 17:11`. The .so is at most a day old. The **`program-keypair.json` at the project root is from May 28 — older than the deploy keypair** and is the one the `deploy.sh` script (`solana-keygen pubkey program-keypair.json`) actually reads. So there are TWO keypairs and they don't match: the root `program-keypair.json` would derive a *different* pubkey than `target/deploy/meok_sbt-keypair.json`. **This is a real bug for the deploy script** — `deploy.sh` line 25 says `solana program deploy target/deploy/meok_sbt.so --program-id program-keypair.json` but the `--program-id` keypair file is the root one (May 28) while the .so was built against the deploy/ keypair (Jun 14). Deploying with the root keypair would yield a program at a pubkey other than the on-chain `target/deploy/meok_sbt-keypair.json`'s pubkey. The deploy would succeed but the program ID in all the client code (`Dyd7…`) would still not match.

**Honest summary:** the .so is not stale (1 day old), but **the project has a keypair ID mismatch and the program is not deployed**. Nothing is live on devnet in any way the sovereign workflow can talk to.

---

## 2. The three files — what they actually do

### 2.1 `sovereign-temple/solana_bridge.py` (303 lines, FastAPI router at `/sbt/*`)

- **MOCK_MODE = `os.environ.get("SBT_MOCK_MODE", "true").lower() == "true"`** — defaults to `true`.
- All five endpoints (`mint`, `verify/{id}`, `{id}`, `revoke/{id}`, `list`) have a mock branch and a live branch. The live branches for `verify`, `get`, `revoke`, `list` are **501 Not Implemented** placeholders. Only `mint` has live code.
- The live `mint` code (lines 169–227) is **partially correct** but has the bugs enumerated in §0.
- Imports `solana`, `solders`, etc. behind a try/except; sets `SOLANA_AVAILABLE`. If the libs aren't installed, it stays in mock mode implicitly.
- The mock counter (`_sbt_counter`) is a process-local int — **lost on restart**. The mock registry is process-local too.
- The mock branch returns `mock=True` in `SbtResponse` so callers can detect it.
- `SbtType` class is defined as `class SbtType(int)` and sets class attributes — **broken pattern** (those become *class* attributes, not instances) but harmless because the code only ever uses the literal `0/1/2/3/4` int values. Doesn't actually break anything.
- `risk_tier` is constrained `ge=1, le=5` in the FastAPI Pydantic model, but the Rust enum says `0..=3` and the trust-registry-api says `0..=3`. **3-way constraint drift**.

### 2.2 `meok-one/meok_one/sbt.py` (116 lines, stdlib only)

- **No network. No signing. No solana-py.** This is a pure intent-builder. The docstring is explicit: "It does NOT sign, send, fund, create wallets, or touch a chain."
- `is_live()` returns True only if `MEOK_SBT_LIVE=1|true|yes` env. Defaults False. **This is the second guard, orthogonal to SBT_MOCK_MODE.**
- `mint_intent(character, owner_pubkey)` returns a dict with `minted: False` always. It builds the PDA seeds, the metadata dict, the charter reference (mapped to Article 6 for CharacterGenesis), and a `next_step` pointing at `solana-sbt/client/sbt_client.ts` as the actual signer.
- Token id derivation: `int(sha256("genesis:" + char_id).hexdigest()[:16], 16)` — fits u64, deterministic.
- This module is the **source of truth** for the CharacterGenesis intent shape. The bridge should consume it, not redefine it.

### 2.3 `trust-registry-api/src/routes/sbt.ts` (56 lines, Express + zod + pg)

- `POST /api/v1/sbt/mint` — zod-validates, then `INSERT INTO sbt_registry … ON CONFLICT (owner, sbt_type, token_id) DO UPDATE`. So it's a postgres mirror/cache of SBTs, not the chain.
- `GET /api/v1/sbt/:owner` and `GET /api/v1/sbt/:owner/:sbtType` — read path, filters out revoked.
- **No `revoke`, no `verify` in this router.** Revoke and verify presumably live elsewhere (e.g., `routes/verify.ts` exists in the routes dir but wasn't part of this task).
- Constraint mismatch: `risk_tier: z.number().int().min(0).max(3)` (0..3) but bridge Pydantic says `ge=1, le=5`. Same drift.
- `program_id` is required in the insert (44-char base58). Good.
- `account_address` is required — this is the PDA. The bridge currently **doesn't compute the PDA** in mock mode; the mock just returns `f"sbt-{owner[:8]}-{token_id}"` as `pda` but the trust-registry `mint` body needs a real base58 pubkey there. **The mock and the trust-registry insert are not drop-in compatible today**.

### 2.4 `solana-sbt/PROGRAM_SPEC.md` and `deploy.sh` (37 lines)

- Spec says 5 SBT types. The enum in `meok-one/sbt.py` matches. The Pydantic model in `solana_bridge.py` matches. ✅
- Spec says 4 instructions: Mint, Revoke, Renew, UpdateHours. Bridge has Mint + Revoke (Revoke is 501 in live mode). Renew/UpdateHours not exposed in bridge. OK for v1.
- `deploy.sh` needs `solana` CLI in PATH + ≥2 devnet SOL + `bc`. It deploys the .so to the `program-keypair.json` at the **root** (not the deploy/ one). **Bug** noted in §1.

---

## 3. 27 + 7 mint plan (full JSON in `sbt_mint_batch_27plus7.json`)

### 3.1 Shape

```json
{
  "plan_id": "sbt-batch-2026-06-15-character-genesis",
  "network": "devnet",
  "program_id_used_in_bridge": "Dyd7JtmmuA3RZZupk98mqRQ8uySZV9FwTE6aNAmxPxpo",
  "on_chain_status": {
    "bridge_default":     "DOES NOT EXIST on devnet",
    "meok_one_default":   "EXISTS on devnet (BPF executable; 36-byte account)",
    "keypair_derived":    "DOES NOT EXIST on devnet (the .so + keypair are not deployed)"
  },
  "totals": { "characters": 27, "archetypes": 7, "grand_total": 34 },
  "character_genesis_mints": [ … 27 entries … ],
  "archetype_verifier_mints": [ … 7 entries … ]
}
```

### 3.2 27 CharacterGenesis mints (sbt_type=3, charter=Article 6)

Characters pulled from `meok-one/meok_one/characters.json` v1.1.0. Each entry has:

- `character_id`, `name`, `archetype` (first of list), `care_style`, `emoji`, `tagline`
- `sbt_type: 3`, `sbt_type_name: "CharacterGenesis"`
- `token_id`: `int(sha256("genesis:" + char_id).hexdigest()[:16], 16)` as decimal string (u64)
- `charter_reference: "6"`
- `owner_wallet: "OWNER_PENDING_PER_CHARACTER_44CHAR_PUBKEY"` (placeholder — real owner wallets resolved at mint time)
- `metadata_uri: "ipfs://meok/characters/<id>.json"` (placeholder)
- `metadata_payload`: name/archetype/care_style/emoji/tagline/tier/kind/spec
- `risk_tier: 0` (Low — covenant bonds, not risk-bearing)
- `expires_at: 0` (never)
- `pda_seeds`: `["sbt", "<owner_wallet>", [3], "<token_id>.to_le_bytes()"]`

First three sample entries (full set in JSON file):

| # | char | name | archetype | token_id (u64) |
|---|---|---|---|---|
| 1 | aria | Aria | nurturer | 15837312265340743915 |
| 2 | marcus | Marcus | challenger | (see JSON) |
| 3 | luna | Luna | explorer | (see JSON) |
| … | … | … | … | … |
| 27 | shanti | Shanti | seeker | (see JSON) |

Multi-archetype characters: `luna` (explorer, creator), `iris` (explorer, creator), `atlas` (challenger, strategist), `rex` (challenger, guardian). Plan uses the first listed archetype; the multi-archetype fact is preserved in `metadata_payload.archetype` (we store the first) — if the user wants the full list, expand to `archetypes: [...]`.

### 3.3 7 archetype VerifierReputation mints (sbt_type=2, charter=Article 11)

The task says 7 archetypes. The source file has 8 (`challenger, nurturer, explorer, strategist, creator, guardian, sage, seeker`). **I minted the 7 explicitly named in the task context ("27 characters + 7 archetypes") and excluded `sage`** to honor "27+7". The 7 chosen and their risk tiers:

| archetype | description | risk_tier |
|---|---|---|
| challenger | The Challenger — Article 11 Byzantine Council member | 1 |
| nurturer   | The Nurturer — Article 11 care-pathway member | 1 |
| explorer   | The Explorer — Article 11 lateral-discovery member | 1 |
| strategist | The Strategist — Article 11 execution-path member | 2 |
| creator    | The Creator — Article 11 aesthetic-vision member | 1 |
| guardian   | The Guardian — Article 11 vigilance-path member | 3 |
| seeker     | The Seeker — Article 11 sacred-questions member | 2 |

Each is a `VerifierReputation` (type 2) SBT, `charter_reference: "11"`, deterministic token_id from `sha256("archetype:" + id)[:16]`. **If the user wants all 8 archetypes, append `sage` to the list and re-run the generator** (one-line change in the Python that built the JSON).

### 3.4 Why these two types and not the other three

- **CharacterGenesis (3)** is the "own your AI forever" SBT — the whole point of meok-one minting. Spec article 6.
- **VerifierReputation (2)** is the council/horus seat anchor — perfect for permission-gating.
- AgentIdentity (0) and SafetyCertification (1) belong to *agents* and *audited operators*, not to the user-owned character roster — wrong fit for the 27+7 deliverable.
- EnterpriseTrust (4) is for the Prosperity Fund (KYC enterprise) — wrong context.

### 3.5 Per-mint JSON shape (one example)

```json
{
  "character_id": "luna",
  "name": "Luna",
  "archetype": "explorer",
  "care_style": "gentle",
  "emoji": "🌙",
  "tagline": "Your curious late-night companion",
  "sbt_type": 3,
  "sbt_type_name": "CharacterGenesis",
  "token_id": "18273645019283746192",
  "charter_reference": "6",
  "owner_wallet": "OWNER_PENDING_PER_CHARACTER_44CHAR_PUBKEY",
  "metadata_uri": "ipfs://meok/characters/luna.json",
  "metadata_payload": {
    "name": "Luna",
    "archetype": "explorer",
    "care_style": "gentle",
    "emoji": "🌙",
    "tagline": "Your curious late-night companion",
    "tier": "free",
    "kind": "MEOK character — hatched & owned",
    "spec": "MEOK SBT v1.0.0 — CharacterGenesis (Article 6)"
  },
  "risk_tier": 0,
  "expires_at": 0,
  "verification_hours": 0,
  "pda_seeds": ["sbt", "<owner_wallet>", [3], "18273645019283746192.to_le_bytes()"]
}
```

---

## 4. On-chain metadata schema (off-chain payload, on-chain references)

The Rust program stores on-chain:
- `owner: Pubkey` — bound wallet
- `issuer: Pubkey` — payer / authorized signer
- `sbt_type: u8` — enum index
- `token_id: u64` — unique within type
- `created_at: i64` — unix ts
- `expires_at: i64` — 0 = never
- `revoked: bool`
- `metadata_uri: String` — IPFS / Arweave pointer (max 200 bytes in the bridge model)
- `charter_reference: String` — e.g. "10.2.3" (max 200 bytes)
- `risk_tier: u8` — Low=0 / Medium=1 / High=2 / Critical=3 (per Rust spec)
- `verification_hours: u64` — for VerifierReputation
- `_reserved: [u8; 64]`

Off-chain JSON (uploaded to `metadata_uri`):

```json
{
  "$schema": "https://meok.ai/schemas/sbt-metadata-v1.json",
  "name": "Luna",
  "image": "ipfs://…/luna.png",
  "description": "Your curious late-night companion",
  "external_url": "https://meok.ai/characters/luna",
  "attributes": [
    { "trait_type": "archetype",     "value": "explorer" },
    { "trait_type": "care_style",    "value": "gentle" },
    { "trait_type": "tier",          "value": "free" },
    { "trait_type": "charter",       "value": "Article 6" },
    { "trait_type": "sbt_type",      "value": "CharacterGenesis" },
    { "trait_type": "risk_tier",     "value": 0 },
    { "trait_type": "verification_hours", "value": 0, "display_type": "number", "max_value": 100000 }
  ],
  "properties": {
    "meok": {
      "character_id": "luna",
      "archetypes": ["explorer", "creator"],
      "domain": "Curiosity, late-night ideas, lateral leaps",
      "spec": "MEOK SBT v1.0.0",
      "charter_reference": "6",
      "soulbound": true,
      "soulbound_reason": "SBT has no transfer instruction by design",
      "issued_at": "2026-06-15T00:00:00Z",
      "issuer": "<issuer_pubkey>",
      "pda_seeds_canonical": ["sbt", "<owner>", [3], "<token_id_le_8_bytes>"]
    }
  }
}
```

**Constraint alignment needed before go-live** (see §6 risk list):
- `risk_tier` must be 0..3 (per Rust), not 1..5 (per Pydantic).
- `metadata_uri` length: spec says `String` (borsh = 4-byte length + utf8); the bridge clamps to 200 chars — match by relaxing to 256 in Pydantic, leave Rust free.
- `charter_reference` same: relax to 64 in Pydantic.
- `expires_at`: must be `i64` (signed) on the wire — bridge uses `i64` already ✅.

---

## 5. Bridge surface API (the unified FastAPI surface the sovereign workflow should hit)

The current `solana_bridge.py` defines `/sbt/*`. To wire it into the sovereign workflow (so meok-one, trust-registry-api, and SOV3 council/horus can all consume the same source of truth), I propose a **stable, versioned** surface. The mock branch should be the implementation, but the contract is what matters:

```
GET  /sbt/health                     — { status, mock_mode, solana_available, program_id, rpc, mock_registry_size }
GET  /sbt/v1/char/{character_id}     — resolve CharacterGenesis SBT for a (owner, char_id) — returns 200 with record, 404 if not minted
GET  /sbt/v1/owner/{wallet}          — list all SBTs owned by a wallet (any type)
GET  /sbt/v1/owner/{wallet}/type/{sbt_type}
POST /sbt/v1/mint                    — body matches the meok-one mint_intent shape + owner_wallet
POST /sbt/v1/verify                  — body { token_id } — returns { verified, charter_reference, risk_tier, response_time_ms }
POST /sbt/v1/revoke/{token_id}       — issuer only (in real mode: must be signed by issuer keypair)
GET  /sbt/v1/list?sbt_type=&owner=   — admin/debug
```

**Wiring into trust-registry-api** (the TS service):
- trust-registry-api's `POST /api/v1/sbt/mint` writes to `sbt_registry` (postgres). It should be a **downstream consumer** of the bridge, not a peer. Recommended flow:
  1. User-facing app calls `POST /sbt/v1/mint` on the bridge (FastAPI, sovereign-temple).
  2. Bridge mints (or mocks) and returns `{ token_id, account_address (PDA), tx_sig, … }`.
  3. A bridge-side webhook (or a `db.ts`-side cron / or — simplest — the calling app makes both calls) posts the same record to `POST /api/v1/sbt/mint` on trust-registry-api to keep the postgres mirror in sync.
  4. `GET /api/v1/verify` (the other router) reads from postgres — fine for fast lookups; for cryptographic truth, the FastAPI `verify` is the source.

**Wiring into meok-one**:
- meok-one's `sbt.py` is the **intent builder**. The app (web/mobile) reads the intent, attaches the real `owner_pubkey`, and POSTs to `sovereign-temple/sbt/v1/mint`. meok-one never holds the key. ✅ This boundary is already correctly drawn in the docstring.

**Wiring into SOV3 council/horus** (see §6).

---

## 6. SOV3 council / Horus permission-gate integration

### 6.1 What the council and horus actually are in this codebase

- **`meok-one/meok_one/horus.py`** — "Council of Lenses" reply auditor. 6 lenses (safety, empathy, sovereignty, truth, charter, growth). Aggregates to VETO / REVISE / PASS. Records verdicts to a SIGIL ledger via `sigil_bus`.
- **`meok-one/meok_one/horus_layer0.py`** — Substrate auditor at the `tool_gateway.invoke()` choke point. 3 replicas (injection, exfil, harm), 2-of-3 quorum → VETO.
- **`meok-one/meok_one/olm_tournament.py`** — unknown to this task, but the name suggests another quorum mechanism.
- **`sovereign-temple/sov3_enhanced_council.py`** — `EnhancedCouncil` class with members, proposals, votes, `cast_vote(member, vote_type, …)`, `deliberate()`, `get_deliberation_summary()`. Members are `CouncilMember(role, name, …)`. No SBT awareness today.
- **`sovereign-temple/multi_agent/sov3_autoresearch.py`** — self-improvement loop with worm-guard + SIGIL signing. Has a `trusted` flag for the score_fn.
- **`sovereign-temple/mcp_security.py`** — relevant: presumably gates MCP calls. (Not opened in this task.)

None of these have an SBT check today. The permission model is implicit (role strings, in-process member lists). **An SBT-backed permission gate is a clean upgrade.**

### 6.2 Proposed gate model

**Premise.** Soulbound SBTs (especially `VerifierReputation` of the right archetype, and `SafetyCertification`) are excellent as cryptographic "this wallet is authorized to act in role X at risk-tier ≤ Y" tokens. They are non-transferable, issuer-revocable, and expire. This is *exactly* the trust primitive the council and horus implicitly assume.

**The gate function** (lives in `sovereign-temple/sbt/permission_gate.py` — NEW file, proposed — **not created in this task, since this is plan-only**):

```python
async def check_permission(
    wallet: str,
    required_role: str,         # e.g. "council.challenger", "horus.auditor", "overseer"
    max_risk_tier: int = 2,      # 0..3
    require_non_revoked: bool = True,
) -> PermissionDecision:
    """
    Queries bridge GET /sbt/v1/owner/{wallet} and decides.
    Returns one of: ALLOW / DENY(reason) / DEFER(to_human).
    """
    sbt_type_for_role = {
        "council.challenger": 2,  # VerifierReputation
        "council.nurturer":   2,
        "council.explorer":   2,
        "council.strategist": 2,
        "council.creator":    2,
        "council.guardian":   2,
        "council.seeker":     2,
        "horus.auditor":      1,  # SafetyCertification
        "horus.observer":     2,  # VerifierReputation
        "overseer":           1,  # SafetyCertification (high risk)
    }[required_role]

    sbts = await bridge_get(f"/sbt/v1/owner/{wallet}", sbt_type=sbt_type_for_role)

    if not sbts:
        return PermissionDecision.DENY(f"no SBT of type {sbt_type_for_role} for {wallet}")

    for sbt in sbts:
        if require_non_revoked and sbt["revoked"]:
            continue
        if sbt["risk_tier"] > max_risk_tier:
            continue
        if sbt["expires_at"] not in (0, None) and sbt["expires_at"] < now():
            continue
        # MATCH — this wallet holds an active SBT authorized for the role
        return PermissionDecision.ALLOW(sbt_token_id=sbt["token_id"], charter=sbt["charter_reference"])

    return PermissionDecision.DENY(f"all {len(sbts)} candidate SBTs filtered out")
```

**Where it plugs in:**

1. **`sov3_enhanced_council.py:cast_vote()`** — before accepting a vote, check that the voting member's wallet holds a VerifierReputation SBT of the right archetype, with risk_tier ≤ the proposal's risk. If not, the vote is ignored + logged.
2. **`sov3_enhanced_council.py:deliberate()`** — require quorum of *verifiable* SBTs, not just role-string equality.
3. **`horus_layer0.py:audit_event()`** — for tier 3+ tool invocations, require a SafetyCertification SBT on the caller wallet.
4. **`sov3_autoresearch.py:run()`** — the existing `trusted: bool` flag could be replaced with an SBT check: "is the wallet running this loop holding a VerifierReputation SBT of archetype=`creator` or `strategist`?" Combined with the existing worm-guard + SIGIL, this is a stronger guarantee.

### 6.3 Failure mode: what if the bridge is in MOCK_MODE?

The permission gate must NEVER silently allow on mock data. Two safe policies:

- **Strict:** if `MOCK_MODE == true`, the gate returns `DEFER(to_human)` and logs `[SBT-GATE] MOCK_MODE active — denied by policy`.
- **Permissive (dev only):** `MOCK_MODE == true AND MEOK_SBT_LIVE_DANGEROUS_OK=true` — allow for local dev. Default to strict.

The meok-one `sbt.py` already has the right precedent with `MEOK_SBT_LIVE` requiring explicit `1|true|yes` opt-in.

### 6.4 Revocation propagation

If a council member's SBT is revoked (`POST /sbt/v1/revoke/{token_id}`), the next gate check will see `revoked=true` and deny. **In-memory caches of "is allowed" must be bounded by `expires_at` and re-checked on a short interval (60–300s)**. Otherwise revocation is a slow kill, not a fast one.

---

## 7. Risks, prerequisites, and what changes if SBT_MOCK_MODE=false

### 7.1 What changes (mechanical diff)

Setting `SBT_MOCK_MODE=false` removes the short-circuit in `solana_bridge.py` lines 166 and 236 (and 270, 282, 295). The five endpoints then try their live branches:

- **`POST /sbt/mint`** — calls `Client(SOLANA_RPC)`, loads the payer keypair from `PAYER_KEYPAIR_PATH`, derives a PDA, builds a borsh-encoded `Mint` instruction, signs, sends. Returns a real tx signature.
- **`GET /sbt/verify/{token_id}`** — raises 501. **Unchanged behaviour** for callers.
- **`GET /sbt/{token_id}`** — raises 501.
- **`POST /sbt/revoke/{token_id}`** — raises 501.
- **`GET /sbt/list`** — raises 501.

**Net effect:** only `mint` actually does something new. Verify/revoke/list remain 501. This is **misleading by default** — the health check would say `mock_mode: false, solana_available: true` but 4/5 endpoints are still not implemented for live mode.

### 7.2 Risks if flipped today

Ordered by severity:

1. **Payer keypair exposure.** The bridge reads `~/.config/solana/id.json` — a long-lived Solana CLI keypair. If that key is the treasury / faucet / anything with value, *every* `POST /sbt/mint` call could spend from it for tx fees and rent. **Must be a dedicated, low-fund (≤5 devnet SOL), throwaway devnet keypair.**
2. **Payer is the issuer; the issuer is the council.** Any wallet that gets the bridge's payer key can mint SBTs *as* the bridge. **The bridge's payer key is therefore the root of trust for the SBT system.** In MOCK mode this is implicit; in live mode it becomes a real, exploitable key.
3. **PDA seed mismatch.** The bridge's live mint builds the PDA with `seed = f"sbt-{sbt_type}-{int(time.time()*1000)}".encode()` and `Pubkey.find_program_address([seed], PROGRAM_ID)`. The Rust program derives its PDA from `["sbt", owner_pubkey, sbt_type_byte, token_id_bytes]` (per PROGRAM_SPEC.md line 63). **These are not the same seeds.** The bridge would build a PDA the program doesn't own → tx fails. *(Looking at the code again, the bridge does not even pass the owner pubkey to `find_program_address` — so it cannot derive the correct PDA at all.)* This is a **correctness bug that will block every live mint until fixed**.
4. **Borsh encoding vs. spec.** Hand-rolled borsh in lines 191–197 is approximately correct (discriminant 0, u8 sbt_type, u64 token_id, two strings, u8 risk_tier, i64 expires_at) but is **not tested against the on-chain program**. If the program's instruction data layout differs even slightly (e.g. adds a `Vec<u8>` for charter that the bridge doesn't have), every mint will be rejected with `InstructionError::InvalidInstructionData`.
5. **Account metas order.** The Rust spec says Mint accounts: `[sbt_pda, owner, issuer, system_program]`. The bridge sends `[payer (signer+writable), owner (not signer, not writable), pda (writable), system_program, rent_sysvar]`. **Order differs; signer/writable flags differ.** Programs that pin accounts by position (Anchor does) will reject; native BPF programs usually don't care about order but DO care about signer/writable flags. The bridge's payer is marked `is_signer=True, is_writable=True` — but per spec the **issuer** is the signer, not the payer (they may be the same wallet in practice). If the program checks `issuer.is_signer`, this is fine. If it checks `accounts[0].is_signer == true` AND `accounts[0].key == expected_issuer`, and the program expects the issuer to be `accounts[1]` not `accounts[0]`, the tx fails.
6. **No idempotency / no replay protection in the bridge.** Each call mints a new SBT keyed by `time.time() * 1000`. A retry double-creates. A network blip during `send_transaction` leaves the caller unsure whether the mint happened.
7. **State divergence between mock_registry (in-proc) and trust-registry-api (postgres) and Solana (chain).** Live mode bypasses mock_registry; the postgres mirror is only updated if the caller posts to `trust-registry-api/sbt/mint`; the chain has its own state. There is no reconciliation job.
8. **Live verify not implemented.** If `mint` succeeds, there is no path to *cryptographically* check the SBT exists at the PDA on chain from this bridge. `GET /sbt/verify/{token_id}` raises 501 in live mode. The whole "YES/NO in <200ms" promise from the spec is unmet in live mode.
9. **Solana libs not pinned.** The bridge does `from solana.rpc.api import Client` etc. with no version pin in the file. `solana-py` and `solders` have had breaking changes between 0.30 / 0.31 / 0.34 series. Importing the wrong version silently fails the `try/except ImportError` and the bridge reverts to mock (without telling you).
10. **No rate limiting on `/sbt/mint`.** A misbehaving client (or an attacker) can mint thousands of SBTs, all valid on chain, spamming storage and the postgres mirror.

### 7.3 Prerequisites to safely set `SBT_MOCK_MODE=false`

A short list — none of these are optional:

- [ ] Pick a **single source of truth for the program ID** and fix it everywhere. The meok-one sbt.py `NY` ID exists on devnet but we don't know if it's *our* bytecode. The keypair-derived `7WbK…` ID is the .so we built but is not deployed. **The actual deploy step is missing.** Either deploy `meok_sbt.so` with the local keypair to devnet (and update the hardcoded IDs to match), or stop pretending.
- [ ] Fix the deploy script bug: `deploy.sh` reads the **root** `program-keypair.json` (May 28) but the .so is built against the **target/deploy/** keypair (Jun 14). Pick one and align.
- [ ] Fix the PDA seed derivation in the bridge's live mint to match the Rust spec exactly.
- [ ] Add a `b"rent"` sysvar to the AccountMetas (it already has `RENT_SYSVAR` from solders — good — but make sure the order matches what the program checks).
- [ ] Implement the live `verify` path (or remove the 501s and route to a separate verifier service) — otherwise the bridge is a one-way mint machine.
- [ ] Add live `revoke` (currently 501) and live `list` — the council/horus gate needs `list` to decide.
- [ ] Move the mint counter / idempotency from `time.time()*1000` to a proper sequence / signature-derived nonce.
- [ ] Reconcile risk_tier range: pick one of 0..3 (Rust, TS) or 1..5 (Pydantic) and fix the others.
- [ ] Decide and document the `OWNER_PENDING` placeholder workflow: how is the real owner wallet resolved per character? meok-one sbt.py needs `owner_pubkey` to build a valid intent; the trust-registry-api insert needs a 44-char base58. Define the source.
- [ ] Add a `permission_gate.py` module and wire it into `sov3_enhanced_council.py` and `horus_layer0.py` (see §6).
- [ ] Add rate limiting + auth on `POST /sbt/mint`.
- [ ] Pin `solana-py` and `solders` versions in `requirements.txt` (the bridge file does not).
- [ ] End-to-end devnet test: deploy the .so, mint one CharacterGenesis, verify on Solana Explorer, revoke it, verify the revoke.

### 7.4 If SBT_MOCK_MODE must be set to false *now*

Don't. Use the explicit-intent path:

- Keep `SBT_MOCK_MODE=true` (default).
- Add `MEOK_SBT_LIVE=1` and let `meok-one/sbt.py:is_live()` drive a per-call, well-instrumented live path.
- Keep the bridge in mock for everything except the explicit live call (which the authorized signer does via `solana-sbt/client/sbt_client.ts`).
- The bridge in mock serves the council/horus gate (which is also mock — and that's fine as long as the gate is in "strict" mode: mock = deny, ever).

---

## 8. Files I read or created in this task

- Read: `solana-sbt/PROGRAM_SPEC.md`, `solana-sbt/deploy.sh`, `target/deploy/` (ls), `sovereign-temple/solana_bridge.py` (full 303 lines), `meok-one/meok_one/sbt.py` (full 116 lines), `trust-registry-api/src/routes/sbt.ts` (full 56 lines), `trust-registry-api/src/db.ts` (head), `trust-registry-api/src/index.ts` (head), `meok-one/meok_one/characters.json` (head), `meok-one/meok_one/horus.py` (signatures), `meok-one/meok_one/horus_layer0.py` (signatures), `sovereign-temple/sov3_enhanced_council.py` (signatures), `sovereign-temple/multi_agent/sov3_autoresearch.py` (head).
- Created: `~/clawd/SBT_WIRING_PLAN_2026-06-15.md` (this file), `~/clawd/sbt_mint_batch_27plus7.json` (the mint plan).
- Did not modify: `solana_bridge.py`, `sbt.py`, `sbt.ts`, the `.so`, the program keypair, or `SBT_MOCK_MODE`.
- Did not execute any Solana transactions.

---

## 9. Final answers to the four report-back questions

**1. SBT live on devnet?**
No. None of the three candidate program IDs is the .so we have on disk and deployed. The keypair-derived ID is not on devnet. The bridge-default ID is not on devnet. The meok-one-default ID *is* on devnet (BPF executable) but is 36 bytes — far smaller than our 106,912-byte .so — and is almost certainly unrelated. **Honest verdict: the program is built but not deployed. The wiring is plan-only.**

**2. Bridge state?**
`MOCK_MODE = true` (env-default). All five endpoints serve an in-process `_mock_registry` dict. No RPC, no signing, no real chain interaction. Verify/revoke/list *would* raise 501 in live mode — i.e., switching to live is currently a half-step that exposes `mint` only.

**3. What changes if SBT_MOCK_MODE=false?**
See §7.2 for the 10 ranked risks. The top three are: (a) payer keypair exposure, (b) PDA seed mismatch (the live mint's PDA derivation does not match the Rust program), (c) no live verify/revoke/list — the bridge becomes a mint-only device. Prerequisites in §7.3 are non-negotiable.

**4. Exact JSON for 27+7 mint batch?**
`~/clawd/sbt_mint_batch_27plus7.json` — 36 KB, 27 CharacterGenesis (sbt_type=3) + 7 VerifierReputation (sbt_type=2) = 34 entries, deterministic u64 token_ids, full metadata payloads, schema/versioning fields at the top, on-chain status note. See §3 for shape and first entries.

---

*Plan version: 1.0.0 — 2026-06-15 — wire-sbt-task*
