# meok-sovereign-bft-mcp

**BFT 3/5/7 voter council runtime. Smaller councils vote better (EAT-12). Sovereign by construction.**

## 5 tools

| Tool | What |
|---|---|
| `council_create` | Create a BFT council |
| `vote` | Cast a vote |
| `tally` | Count votes and decide outcome |
| `dissent_record` | Record dissent reason |
| `get_outcome` | Get the outcome of a council |

## BFT Quorum Table

| Size | Quorum | Threshold |
|---|---|---|
| 3 | 2 | 2/3 (66.7%) |
| 5 | 3 | 3/5 (60.0%) |
| 7 | 5 | 5/7 (71.4%) |

## Install
```
pip install meok-sovereign-bft-mcp
```

## Usage
```python
from meok_sovereign_bft_mcp import council_create, vote, tally, dissent_record, get_outcome

# Create a 5-member council
council = council_create("Charter Amendment", ["Argus", "Scribe", "Shield", "Builder", "Abacus"])
cid = council["council_id"]

# Cast votes
vote(cid, "Argus", "YES")
vote(cid, "Scribe", "YES")
vote(cid, "Shield", "YES")
vote(cid, "Builder", "NO")
vote(cid, "Abacus", "ABSTAIN")

# Tally and get outcome
result = tally(cid)
print(f"Outcome: {result['outcome']} (Yes: {result['yes']}, No: {result['no']})")

# Record dissent
dissent_record(cid, "Builder", "Need more care floor probes")
```

## License
MIT — CSOAI Ltd (UK 16939677)
