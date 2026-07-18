# GENERALS BRIDGE — WIRED + PROVEN, 2026-07-10
## MEOK-SOV3 · the 12-generals registry now drives OWEM domain routing

## WHAT WAS ACTUALLY MISSING (corrected from earlier mischaracterization)
An auditor caught me calling L4 a "stub" — it was NOT. The OWEM (sov33_owem_v3.py) already:
- L1 Care-Floor gates, L2 BFT council of 13 governance Queens votes, L5 SIGIL signs every hop,
- L4 SovereignMergeBrain.think() already POSTs to localhost:11434 with qwen2.5:3b (real, degrades
  to [offline] on exception).
The REAL gap was L3 routing: it used 4 generic keyword anchors, NOT the domain experts in
sovereign-temple-public/generals_registry.json. That is what this bridge fixes.

## WHAT THE BRIDGE DOES (sov33_generals_bridge.py)
1. Loads the generals from the registry (9 in the file; metadata claims 12 active — MISMATCH,
   flagged in output, not hidden).
2. Routes a task to the right general by domain keywords (Druid=land, Hydrologist=water,
   Guardian=security, Emperor=orchestration, Banker=finance, ...).
3. Maps the general's domain -> one of the OWEM's 4 anchors and sets task['forced_anchor'].
4. The OWEM (patched _classify_anchor) now HONORS forced_anchor, so the general genuinely drives
   the anchor instead of falling through to the VOICE default.
5. Full governance runs unchanged: Care-Floor + BFT council + SIGIL chain.

## PROVEN (end-to-end, on disk)
| task                              | general        | anchor mapped==used | decision            | sigil |
|-----------------------------------|----------------|---------------------|---------------------|-------|
| soil drainage / fen forestry      | The Druid      | INTUITION==INTUITION| adopted             | ✓17   |
| pH telemetry / water flow         | The Hydrologist| INTUITION==INTUITION| adopted             | ✓17   |
| audit for security threats        | The Guardian   | DEFENSE==DEFENSE    | adopted             | ✓17   |
| route+arbitrate global task       | The Emperor    | COMPLIANCE==COMPL.  | adopted             | ✓17   |
| x402 payment, care=0.30 (breach)  | The Banker     | COMPLIANCE==COMPL.  | vetoed_care_floor   | ✓16   |
- SIGIL chain verify = True on every task (fixed a string-vs-dict read bug).
- OWEM base self-test still passes (no regression from the forced_anchor patch).
- The care-0.30 breach is VETOED even with a correct domain match — governance holds. THIS is
  "governance baked into the architecture": a domain expert cannot answer around the Care-Floor.

## HONEST LIMITS (no overclaim)
- The generals' registry moe_mix lists CLOUD/CLOSED models (gpt-4o, gemini, claude, llama-405b).
  Those are NOT downloaded weights. For the sovereign run a general = a DOMAIN-ROUTING TAG +
  PERSONA over the ONE local base (qwen2.5:3b). It is 9 configs over one model, NOT 9 minds.
- Turning them into real separate experts = the merge-kit fine-tune path (needs GPU), not done here.
- The brain answer is [offline] in this sandbox because localhost:11434 is on the Mac. It runs
  real when executed there (`python3 sov33_generals_bridge.py` on the Mac with ollama up).
- This is NOT AGI/ASI and adds no capability beyond qwen2.5:3b. It adds GOVERNED DOMAIN ROUTING.

## RUN IT ON YOUR MAC (real model answers)
    cd ~/clawd/_alignment/sovereign_merge_kit
    python3 sov33_generals_bridge.py     # ollama must be up; qwen2.5:3b is pulled

## FILES
- sov33_owem_v3.py         (patched: _classify_anchor honors forced_anchor)
- sov33_generals_bridge.py (NEW: registry -> domain routing -> governed OWEM)
