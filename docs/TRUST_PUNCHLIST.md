# TRUST / CREDIBILITY PUNCH LIST (Claude Compass finish-line)

The estate's crown jewel is the signed, append-only attestation chain + corrections ledger —
the asset that accumulates and cannot be faked retroactively. This punch list makes it
**provable** and **bankable**. Each item is cheap ($0 or ~$0-30/mo) and credibility-critical.
Agent-doable items are marked; owner-gated items need a human action.

## 1. OpenTimestamps tamper-evidence anchoring ($0) — PARTLY DONE (tool shipped)
Anchor every signed artifact's content_id to Bitcoin via the FREE public OTS calendar. A
stranger then verifies the proof with the free public calendar — proving the artifact existed
at that Bitcoin block, independent of any infrastructure we control.

**Tool:** `harness/arena/ots_anchor.py` (built; correct API for a host with valid TLS + the
`opentimestamps` Python package + internet egress to `*.pool.opentimestamps.org`).

**Run (one command, on a clean host with egress — e.g. a RunPod pod):**
```bash
pip install opentimestamps           # or: pip install ots (ships the `ots` CLI)
python3 harness/arena/ots_anchor.py --file public/signed/arena_scoreboard.json
python3 harness/arena/ots_anchor.py --file public/signed/arena_scoreboard.json --verify
# OR the canonical CLI (handles the DetachedTimestamp + calendar correctly):
ots stamp public/signed/arena_scoreboard.json        # writes .ots
ots verify public/signed/arena_scoreboard.json.ots   # confirms block (after `ots upgrade`)
```

**Owner note:** run the CLI on a host with valid TLS (the Mac's CA bundle is broken —
`SSL CERTIFICATE_VERIFY_FAILED`; the RunPod pods reach `a.pool.opentimestamps.org` 200/0.1s).
`ots upgrade` confirms the on-chain block (needs Bitcoin node or the OTS explorer).

## 2. Distribute the 3 MPC parties across 2+ clouds (~$0-30/mo) — OWNER
Split signing/MPC across 2+ distinct clouds using free tiers. Removes single-provider key risk.
(Agent can draft the topology; provisioning is owner/tenant-level.)

## 3. SLSA/cosign-signed releases + SBOM — PARTLY DONE (SBOM exists)
`scripts/gen_sbom.py` produces `public/interop/sbom-councilof-ai.json` (CycloneDX 1.5-lite). A
stranger regenerates it. GAP: wrap the release artifacts in a cosign/SLSA provenance attestation
so downloaders verify where + how they were built.

## 4. Live board public + status page — DONE
`/status` (StatusPage) probes gateway/tools live + labels everything else honestly. The signed
board (14 measured of 14, jail TIE) is public with `?verify=1`.

## 5. Signed-release cosign attestation (wraps #3) — AGENT-DOABLE
Generate a `cosign`/SLSA provenance attestation over the release artifact (public key published
in `public/signed/`), so a stranger verifies provenance + integrity, not just the inner receipt.

---

*Consolidated from Claude Compass (08-26) finish-line alignment + the white-label regulator EAT
pivot. Doctrine: measurement-not-certification, scores never sold, regulators free forever.*
