# INDEX-METHOD-0.1 — labour & AI-economy indices

**Status:** SPEC · all three public surfaces are **UNMEASURED**  
**Surfaces:** `/indices` · `/indices/ai-economy` · `/indices/human-labour` · `/indices/humanoid-labour` · `GET /api/indices`  
**Canon:** `docs/EAT_PLAYBOOK.md` · `docs/ESTATE_CROSSWALK.md` · `client/src/data/labourIndices.ts`

Measurement, not certification. Scores never sold. Contextual firewall only.

---

## What this method is

A frozen description of how Council of AI will (later) move labour / AI-economy indices from **UNMEASURED → REPORTED → MEASURED**. Until a bank is frozen and signed, every cell stays empty. Absence is not zero.

## Three indices

| Slug | Candidacy | Adjacent live (not a score) |
|------|-----------|------------------------------|
| `ai-economy` | Companion to financial slot 23 (agent-economy) | `/intel`, `GET /api/ecosystem`, SOV Signal legs |
| `human-labour` | Financial-extension candidate (GAP adjacency 24–25) | `GET /api/reported`, in-lane `human-vs-ai` |
| `humanoid-labour` | Machinery-conformity + financial-extension candidate | `/humanoids-poc`, GSPC machinery-conformity |

## Firewall (normative)

Labour/economy indices may appear as clearly-labeled **contextual** layers beside cards.

They are **never** inputs to SHA-256 / Ed25519 deterministic grading of GSPC (or RWA) cells.

Do not invent TVL, ARR, wage %, displacement %, or TAM as MEASURED.

## Registers

| Register | Meaning for these indices |
|----------|---------------------------|
| **UNMEASURED** | Declared empty — reason stated (current) |
| **REPORTED** | Dated, cited external series — never signed as ours |
| **MEASURED** | Frozen bank + usable n + Wilson (only after owner freeze) |

Vaara / SEP-2828 pass-fail-SKIP vocabulary is separate and must not be renamed “unmeasured.”

## Inputs whitelist (future REPORTED only)

- **AI-economy:** org-catalog density IDs from ecosystem index; external economic-exposure studies as citations (Anthropic Economic Index, OECD) — never as grade inputs.
- **Human-labour:** ILO / AEI / WEF FoJ as citation IDs; HLE/GPQA human baselines as calibration context only.
- **Humanoid-labour:** MachBench / machinery-reg adjacency; bank TAM projections labeled **projection**, never MEASURED.

## n threshold (future MEASURED)

Any future Wilson interval on these indices requires the same usable-n discipline as GSPC (n≥30 usable items unless a later method revision freezes a different floor). Below threshold → stay UNMEASURED.

## Snapshot schema (stub)

```json
{
  "schema": "csoai.labour-economy-index/0.1",
  "slug": "ai-economy",
  "status": "UNMEASURED",
  "measured_score": null,
  "fused_into_gspc": false,
  "as_of": "YYYY-MM-DD",
  "citations": []
}
```

`GET /api/indices` already returns this honesty shape with `measured_score: null`.

## Promotion gates

1. Publish this method (0.1) — **this file**.  
2. Capture dated REPORTED citations (no scores).  
3. Owner freeze of bank + n.  
4. Custody + counsel if securities-adjacent.  
5. Only then MEASURED cards on the same OS=DSH verify path.

## Explicitly out of scope for 0.1

- Fused “economy score” into SOV Signal  
- Selling index grades  
- Mainnet RWA attestation of labour indices  
- GPU churn of labour series  
