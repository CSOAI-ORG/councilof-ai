# The CC0 Crosswalk Moat — why MEOK's IP can't be cloned in a weekend
**DATA_ROOM/02_ip · 2026-06-06 · the answer to "what stops Vanta/Credo just copying this?"**

## The argument in one line
The source regulations and frameworks are public — **anyone can read them.** What no one else has is MEOK's **structured cross-mapping** of them into one navigable corpus. The map is the moat, not the territory.

## Why this is defensible (the Westlaw precedent)
Court judgments are public domain. Yet **Westlaw and LexisNexis built multi-billion-dollar businesses** by organising those public records into proprietary, cross-referenced, navigable databases. The *organisation, interpretation, and operationalisation* is the protectable asset — not the underlying public texts.

MEOK is the same shape for AI governance:
- **Public inputs:** EU AI Act, NIST AI RMF, ISO/IEC 42001, DORA, NIS2, CRA, OECD, UNESCO, plus ~12 frameworks — all publicly available. Anthropic even released its **Constitution (~23,000 words) under CC0 / full public domain** (Jan 2026) — free to use, zero attribution, zero legal risk.
- **Proprietary output:** ~18 months of hand-built **clause-level crosswalks** mapping each framework to the others, operationalised as installable MCP tools ("MEOK LAW", commit `8439b15`) that emit signed, auditable evidence.

A competitor can read every source overnight. They **cannot** reproduce the structural alignment, the clause-to-clause interpretive mapping, or the 271-tool operationalisation without spending the same 12–18 months. That lead time *is* the asset.

## Why CC0 specifically is an advantage, not a risk
- CC0 inputs (like Anthropic's Constitution) mean MEOK can **integrate the latest frontier-lab safety thinking for free, commercially, with zero licensing or fair-use overhang** — and layer proprietary structure on top.
- Most compliance vendors are **closed-source and unverifiable**; MEOK is **MIT-licensed *and* cryptographically verifiable**. The openness builds trust; the *crosswalk corpus + attestation chain* is what's defensible. You give away the readable layer and keep the navigable one.

## What is and isn't protected (honest boundaries)
| Element | Protectable? | How |
|---|---|---|
| The public source frameworks | No (public) | n/a — and that's fine |
| The clause-level crosswalk corpus | **Yes** — copyright in the compilation/structure (Westlaw-style) + trade-secret in the methodology | keep the master crosswalk private; license/sell the operationalised output |
| The 271 operationalised MCP tools | **Yes** — copyright in the code; MIT-licensed but the *coverage breadth* is the moat | published catalogue |
| The attestation issuance + chain-of-trust process | **Potentially patentable** | file the UK application (02.4 — `NEED`); until then say "patentable", never "patented" |
| "MEOK" / "CSOAI" brand | **Yes** once filed | trademark (02.5 — `NEED`) |

## How a buyer/investor verifies the moat in 15 minutes
1. Read any public framework, then open the matching MEOK crosswalk MCP — see the clause-level mapping they'd have to rebuild.
2. `pip install` 3 of the 271 tools — confirm the operationalisation is real, not slideware.
3. Note the date span on the crosswalk commits — confirm the 12–18-month lead is real.

## The one honest caveat
Copyright protects the *specific expression/structure* of the compilation, not the *idea* of crosswalking frameworks. The durable defence is therefore **lead time + breadth + the trade-secret master mapping + the verifiable attestation layer**, not a single legal lever. That combination is exactly what AuditBoard paid to acquire in FairNow (Oct 2025) rather than build — the comparable that proves buyers value this asset class.
