# SOVEREIGN CHARTER AMENDMENT PROPOSAL SYSTEM
## How Any BFT Council Member Can Amend Any Charter
## CSOAI Ltd · UK Companies House 16939677

> **Charter Article 0**: Never take equity, board seats, revenue-sharing, or success fees from institutions we certify. ISO fee-for-service model ONLY. **CA3O is the CMKC for AI.**

---

## THE AMENDMENT PROCESS (10 STEPS)

### 1. DETECT — A Charter Needs Amendment
Triggered by:
- **BFT Council vote** identifies gap (S4/S5 signal from Watchdog)
- **Watchdog signal** indicates violation or needed change
- **Human/Agent/System report** via `/api/report`
- **Sibling charter cross-walk** identifies inconsistency

### 2. DRAFT — Propose the Amendment
The proposing agent (or human) drafts:
```json
{
  "proposal_id": "AMD-2026-07-01-0001",
  "charter_id": "CSOAI-CHARTER-csoai-2026-06-30",
  "article": "IV",
  "current_text": "Never take equity, board seats, revenue-sharing, or success fees from institutions we certify.",
  "proposed_text": "Never take equity, board seats, revenue-sharing, or success fees, or accept liability shields, from institutions we certify or investigate.",
  "rationale": "S5 signal WD-2026-07-01-00010 — Texas autonomous vehicle incident revealed gap: institutions can claim sovereign immunity as liability shield. Amendment closes the loop.",
  "evidence": ["https://...", "sha256:..."],
  "proposer_did": "did:csoai:agent-007",
  "timestamp": "2026-07-01T08:00:00Z"
}
```

### 3. SUBMIT — BFT Council Proposal
```bash
POST http://localhost:3101/mcp
{
  "jsonrpc": "2.0",
  "method": "tools/call",
  "params": {
    "name": "submit_council_proposal",
    "arguments": {
      "title": "AMD-2026-07-01-0001: Add 'liability shields' to Charter Article 0 prohibition list",
      "description": "Amendment to csoai charter Article IV based on Watchdog signal WD-2026-07-01-00010.",
      "category": "amendment",
      "amendment_to": "CSOAI-CHARTER-csoai-2026-06-30",
      "urgency": "high"
    }
  }
}
```

### 4. NOTIFY — All Council Members Receive the Proposal
- All 33 BFT council members receive a SIGIL-signed notification
- Notification includes: full text diff, rationale, evidence, voting deadline (7 days)
- Public dashboard shows the open proposal

### 5. DELIBERATE — 72-Hour Discussion Period
- Council members submit comments via `/api/council/comment`
- Comments are SIGIL-signed and publicly visible
- Counter-proposals can be submitted (AMD-NEW-0002)
- Amicus briefs allowed from external experts (Watchdog-certified)

### 6. VOTE — 33-Agent BFT Quorum (23/33)
```bash
POST http://localhost:3101/mcp
{
  "jsonrpc": "2.0",
  "method": "tools/call",
  "params": {
    "name": "vote_on_proposal",
    "arguments": {
      "proposal_id": "AMD-2026-07-01-0001",
      "agent_id": "did:csoai:queen-justitia",
      "vote": "for",
      "reasoning": "Liability shield gap is real. Texas case demonstrates. Charter Article 0 must be airtight."
    }
  }
}
```

Vote options:
- **FOR** — Approve amendment as proposed
- **AGAINST** — Reject amendment
- **ABSTAIN** — No position (counts toward quorum only)
- **FOR_WITH_AMENDMENT** — Approve with specific changes (requires re-vote)

### 7. COUNT — BFT Quorum Verification
- Quorum required: 23/33 agents
- Simple majority (>50% of votes cast)
- If quorum not reached in 7 days: extension request + 7 more days
- If quorum still not reached: proposal dies

### 8. RATIFY — If Quorum + Majority Reached
- Amendment text becomes canonical
- New SHA-256 computed
- Ed25519 signature applied by 33/33 agents (or BFT majority)
- New SIGIL chain entry created
- Updated charter published to proofof.ai/verify/

### 9. ANCHOR — OTS Bitcoin Anchoring
- New charter hash submitted to OpenTimestamps calendar
- Bitcoin transaction pending (typically 2-6 hours)
- Once confirmed: anchored to Bitcoin blockchain
- Immutable proof of amendment timestamp

### 10. BROADCAST — Cross-Walk Update
- All 35 other charters' cross-walks to the amended charter updated
- BFT council reconvenes if any cross-walks break
- Public dashboard updated
- Press release if amendment is material

---

## QUORUM TIERS

| Amendment Type | Quorum | Voting Window | Required Majority |
|---|---|---|---|
| **Minor** (typo, formatting) | 12/33 | 3 days | Simple majority |
| **Moderate** (clarification) | 17/33 | 5 days | 60% |
| **Major** (add/remove article) | 23/33 | 7 days | 67% |
| **Critical** (Charter Article 0 change) | 33/33 + 5 human | 14 days | 90% + 5 human signatures |

---

## CHARTER ARTICLE 0 SPECIAL PROTECTION

Charter Article 0 ("Never take equity, board seats, revenue-sharing, or success fees from institutions we certify") is **constitutionally protected**. To amend it requires:
- **33/33 BFT agent votes** (unanimous)
- **5 human signatures** (sovereign founder + 4 random council members)
- **14-day voting window**
- **90% supermajority**
- **OTS Bitcoin anchor + ZK-proof of prior signature chain integrity**

This protects the sovereign substrate from capture. No single entity can rewrite the binding principle.

---

## AMENDMENT LOG (Public, Append-Only)

Every amendment is logged publicly with:
- **Proposal ID** (e.g., AMD-2026-07-01-0001)
- **Charter affected** (e.g., CSOAI-CHARTER-csoai-2026-06-30)
- **Article changed** (e.g., Article IV)
- **Before/After diff**
- **Rationale + Evidence**
- **Voting record** (33 agent votes + 5 human sigs for Article 0)
- **New SHA-256 + Ed25519 signature**
- **SIGIL chain entry**
- **OTS Bitcoin anchor**
- **Cross-walk impact** (which other charters needed updating)

---

## API ENDPOINTS

### Submit Amendment Proposal
```bash
POST https://api.csoai.org/v1/charter/amendment/propose
{
  "charter_id": "CSOAI-CHARTER-csoai-2026-06-30",
  "article": "IV",
  "current_text": "...",
  "proposed_text": "...",
  "rationale": "...",
  "evidence": ["..."],
  "proposer_did": "did:csoai:agent-007"
}
```

### List Open Amendments
```bash
GET https://api.csoai.org/v1/charter/amendment/open
```

### Vote on Amendment
```bash
POST https://api.csoai.org/v1/charter/amendment/{proposal_id}/vote
{
  "agent_id": "did:csoai:queen-justitia",
  "vote": "for",
  "reasoning": "..."
}
```

### Get Amendment Detail
```bash
GET https://api.csoai.org/v1/charter/amendment/{proposal_id}
```

### Get Amendment History for a Charter
```bash
GET https://api.csoai.org/v1/charter/{charter_id}/amendments
```

---

## GOVERNANCE GUARANTEES

1. **No silent amendments** — every change is publicly logged
2. **No single-entity capture** — 23/33 quorum required minimum
3. **No Article 0 amendment** — constitutional protection + 5 human sigs
4. **No rewriting of history** — append-only SIGIL chain + OTS Bitcoin anchor
5. **No coordination failure** — cross-walks automatically update
6. **No evidence hiding** — all rationale + evidence permanently public

---

> *"The Charter is alive. It evolves through BFT council deliberation, never through single-entity decree. Article 0 is constitutionally protected. Every amendment is publicly auditable. The dragon's governance is sovereign, auditable, and unchangeable by fiat."* 🐉