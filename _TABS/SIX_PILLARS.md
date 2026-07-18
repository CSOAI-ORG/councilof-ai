# MEOK Six Pillars — Architecture Lens (companion to the hub)

> **The hub (`MEOK_ECOSYSTEM_TABS.md`) is the source of truth for inventory + tab scope.**
> This doc is a *complementary lens*: it maps the six names Nick uses
> (SIGIL · LAW · MAP · COMPLIANCE LAYER · DOME · COUNCIL) onto the real codebase,
> and defines the CSOAI-as-engine wiring contract. Where this disagrees with the
> hub on *what exists or who owns it*, the hub wins.
> Authored 2026-06-07. Corrected after Nick's "DOME is ours" + GitHub alignment.

---

## The six names → real homes (verified, no hype)

| Pillar | What it actually is | Real home in code | Ecosystem (hub tab) | Status |
|--------|---------------------|-------------------|---------------------|--------|
| **SIGIL** | Provenance & signing — hash-chained audit + HMAC-signed attestations | `meok-attestation-api/` (own repo, `/sign /verify /audit`) + MEOK ONE "SIGIL hash-chained audit" inner feature | CSOAI (2) + MEOK ONE (1) | 🟢 live |
| **LAW** | The rules as product — 28-framework crosswalk incl. physical-safety layer | `meok-one/meok_one/law*.py` + `/law` surface + CSOAI crosswalk | MEOK ONE (1) / CSOAI (2) shared | 🟢 live on VM |
| **MAP** | The terrain *data* — ecosystem topology + MCP registry that DOME renders | `_TOPOLOGY/`, registry manifests in `mcp-marketplace/`, `meok/ui/.../constellation` data | MCP Fleet (3) + MEOK ONE (1) | 🟡 data exists, not a unified product |
| **COMPLIANCE LAYER** | The transport — streamable-HTTP / containerised delivery of any MEOK MCP to cloud marketplaces | `meok-compliance-gateway/` | CSOAI (2) | 🟢 built (no running container / no tests yet) |
| **DOME** | **MEOK's own World / constellation map** — the visual ecosystem surface (NOT 3rd-party AIdome) | `meok-one/meok_one/web/dome` (= MEOK World map) + `meok/ui/src/app/constellation/page.tsx` | MEOK ONE (1) | 🟢 live on VM |
| **COUNCIL** | Governance — BFT council brain-mode + multi-agent voting | `councilof-ai/` + SOV3 `submit_council_proposal`/`vote_on_proposal` + MEOK ONE Council brain mode | CSOAI (2) + MEOK ONE (1) | 🟢 live |
| **(engine) CSOAI** | Shared runtime — auth · signing · billing · identity · models | `csoai-platform/`, csoai.org, + the attestation-api spine | CSOAI (2) | 🟢 live |

### MAP ↔ DOME (the one genuine ambiguity)
DOME is the **rendered** ecosystem map (World/constellation surface, ours, civilian).
MAP is the **terrain data** behind it (topology + registry). DOME without MAP is a
pretty picture with nothing under it; MAP without DOME is a JSON nobody looks at.
*This split is my interpretation — correct me if you mean them as one thing.*

### DOME correction (was wrong, now right)
Earlier I read `CSOAI-CORP/aidome/` and framed DOME as 3rd-party Israeli
**defence** assurance (Palantir/Pentagon). **Wrong.** DOME is MEOK's own World map.
*AIdome* (the defence platform) is unrelated and stays out of every shipped MEOK
surface — consistent with the Gods Eye civilian rebrand. Any defence variant lives
privately under Dagon, never here.

---

## CSOAI-as-engine wiring contract (the integration target)

Each pillar should consume the engine rather than roll its own. "Wired" = the pillar
calls CSOAI for these four:

1. **Identity / auth** — one CSOAI account → access to all surfaces.
2. **Signing (SIGIL)** — one attestation key; verifiable at the single public `/verify`.
3. **Billing** — one Stripe spine + the all-access upsell (kill the 50-link sprawl — hub flags this too).
4. **Model access** — CSOAI model routing (Ollama local / GCP VM councils), not bespoke keys.

**Good news from the audit:** SIGIL's `meok-attestation-api` already ships
`/provision`, `/webhook`, billing, and a tamper-evident `/api/audit` ledger — so the
*signing + billing spine of the engine already exists*. Wiring is mostly pointing the
other pillars at it, not building it.

---

## Brand hygiene (standing)
Zero CSGA / James Castle / Terranova anywhere. CSOAI LTD (UK CH 16939677) is the
legal entity. `CSOAI-CORP/` root (outside the workspace repo) is contaminated with
severed-brand material — do not source product framing from it.
