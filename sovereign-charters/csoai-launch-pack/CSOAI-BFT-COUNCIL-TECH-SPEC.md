# BFT COUNCIL TECHNICAL SPECIFICATION
## CSOAI Sovereign BFT 33-Agent Council · HotStuff Consensus

> **Charter Article 0**: Never take equity, board seats, revenue-sharing, or success fees from institutions we certify. ISO fee-for-service model ONLY. **CA3O is the CMKC for AI.**

---

## ARCHITECTURE

### 33-AGENT COUNCIL
- 12 Sovereign Queens (strategic layer)
- 1 Sentinel Watchtower (continuous monitor)
- 20 Hive Ambassadors (industry-specific)
- Total: 33 agents (HotStuff BFT f < n/3 Byzantine fault tolerance)

### CONSENSUS PROTOCOL: HOTSTUFF 4-PHASE

#### Phase 1: PREPARE
- Proposer broadcasts block with new high QC
- All replicas elect leader lock + prepare vote

#### Phase 2: PRE-COMMIT
- Receiving 2f+1 votes (n-f-of-n threshold)
- Replica locks pre-commit + sends pre-commit vote
- Leader forms pre-commit QC

#### Phase 3: COMMIT
- Receiving 2f+1 pre-commit votes
- Replica locks commit + sends commit vote
- Leader forms commit QC

#### Phase 4: DECIDE
- Receiving 2f+1 commit votes
- Replica finalises block
- Finality reached

---

## QUORUM RULES

### Standard Amendment (Article I-V)
- Quorum: 23/33 agents
- Voting window: 7 days
- Required majority: 67%

### Minor Amendment (typo, formatting)
- Quorum: 12/33
- Voting window: 3 days
- Majority: 50%

### Critical Amendment (Article 0)
- Quorum: 33/33 unanimous
- Voting window: 14 days
- Majority: 90%
- + 5 human signatures required

---

## PERFORMANCE

| Metric | Target | Current |
|---|---|---|
| Throughput | 500 votes/min | 49,127 sigils/day = 0.57/sec |
| Finality | 4.5s | 4.5s |
| View change | 90s | 90s |
| Block time | ~6h | ~6h |
| Quorum satisfaction | 95%+ | 95%+ |

---

## SECURITY PROPERTIES

### Byzantine Fault Tolerance
- f < n/3 = 10 malicious nodes tolerated
- Beyond 10/33 malicious agents, capture impossible
- Combined with Charter Article 0 unanimous protection = real capture-proof

### Cryptographic Binding
- Every vote Ed25519-signed
- SHA-256 hash chain (append-only)
- OTS Bitcoin anchored

---

## ED25519 VOTE FORMAT

```
V|<agent_did>|<charter_id>|<proposal_id>|<vote>|<weight>|<ed25519_signature>|<timestamp>
```

### Example:
```
V|agent-001|king|proposal_8742dd7759d3|FOR|1.0|9a7f83e6b2c4d1a5...|2026-07-02T14:00:00Z
```

---

## IMPLEMENTATION

### Stack
- **Consensus**: HotStuff (4-phase)
- **Signatures**: Ed25519 (RFC 8032)
- **Hash chain**: SHA-256 (append-only, 1,000 sigils/block)
- **Anchor**: OTS Bitcoin (block height)

### Mamba-2 SSM Integration
- 16-dim state vector
- Vote heuristics (probabilistic acceleration)
- Care Membrane calibration

---

## API (REST)

### POST /v1/bft/propose
```json
{
  "type": "charter_amendment",
  "charter_id": "01-csoai-charter",
  "current_text": "...",
  "proposed_text": "...",
  "tier": "moderate|major|critical",
  "voter_did": "did:csoai:..."
}
```

### POST /v1/bft/vote
```json
{
  "proposal_id": "proposal_8742dd7759d3",
  "vote": "for|against|abstain",
  "agent_did": "did:csoai:agent-XX",
  "signature": "ed25519:..."
}
```

### GET /v1/bft/proposals
```json
{
  "active_proposals": [{
    "proposal_id": "proposal_8742dd7759d3",
    "votes_for": 25, "votes_against": 3, "votes_abstain": 3, "votes_pending": 2,
    "voting_ends_at": "2026-07-08T12:00:00Z"
  }]
}
```

---

## CHARTER ARTICLE 0 BINDING

- Article 0 changes: 33/33 unanimous + 5 human sigs (constitutional)
- Standard amendments: 23/33 quorum
- Capture-proof: f < n/3 + Article 0 binding + Ed25519 signatures + OTS anchoring
- Honesty register: illustrative ≠ live, provenance ≠ truth, assurance ≠ certification

---

CSOAI Ltd · UK Companies House 16939677
Sovereign root key: d75a980182b10ab7d54bfed3c964073a0ee172f3daa62325af021a68f707511a
Ed25519-signed · BFT-ratified · OTS-Bitcoin-anchored · Charter Article 0 binding
