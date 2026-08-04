# SOV Counter Canon — CSOAI Ltd

**Status:** Normative. This file is the single source of truth for every number
CSOAI Ltd publishes anywhere — website (csoai.org), proofof.ai, docs, decks,
pitch material, GitHub READMEs, social copy, and partner collateral.

**G3 law:** No number appears in any public property unless that number has a
file on disk in this repository. If a number has no evidence file, the number
does not exist. If a public property shows a number that differs from this
canon, the property is wrong by definition and is corrected — the canon is
never edited to match a page.

**Audit date:** 2026-08-02
**Trigger:** Three contradictory counter sets shipped publicly within 24 hours
(see Appendix A). This file resolves them and prevents recurrence.

---

## 1. THE CANON TABLE

Resolution legend:
- **VERIFIED** — independently confirmed against an authoritative source.
- **PENDING OWNER CONFIRMATION** — the audit could not determine ground truth
  from the artifacts available; the listed value is the *current best
  candidate* and must be confirmed by the named owner against a frozen harness
  output before it is treated as canonical.
- **LOCKED** — phrasing is register-locked; the exact string must be used
  verbatim wherever the finding is cited.

| # | Metric | Canonical value | Exact public phrasing | Evidence file path | Last verified | Owner |
|---|--------|-----------------|------------------------|--------------------|---------------|-------|
| 1 | Company number | **16939677** (VERIFIED) | "CSOAI Ltd, company number 16939677" | `evidence/registry/companies-house-16939677.json` | 2026-08-02 | Company Secretary |
| 2 | EU AI Act Art. 50 in-force date | **2026-08-02** (VERIFIED) | "Article 50 transparency obligations apply from 2 August 2026" | `evidence/regulatory/eu-ai-act-art50-in-force.md` | 2026-08-02 | Regulatory Counsel |
| 3 | Statutory provisions count | **417** (VERIFIED 2026-08-02) | "417 statutory provisions crosswalked" | `evidence/harness/freeze/latest/statutory-provisions.json` | 2026-08-02 | SOV Harness Custodian |
| 4 | Frameworks crosswalked | **PENDING OWNER CONFIRMATION** — candidate: 30 | "30 regulatory frameworks crosswalked" | `evidence/harness/freeze/latest/framework-crosswalk.json` (audit record filed 2026-08-02: no dataset yields 30; owner decision required) | 2026-08-02 (audit) | SOV Harness Custodian |
| 5 | GovBench items | **193** (VERIFIED 2026-08-02) | "193 GovBench items" | `evidence/harness/freeze/latest/govbench-results.json` | 2026-08-02 | SOV Harness Custodian |
| 6 | Signed agents | **PENDING OWNER CONFIRMATION** — candidate: 19 | "19 signed agents in the registry" | `evidence/registry/signed-agents.json` (audit record filed 2026-08-02: 8 signed-status vs 19 network domains — definition conflict, owner decision required) | 2026-08-02 (audit) | Registry Maintainer |
| 7 | Models in verdict path | **0** (VERIFIED 2026-08-02) | "0 models in the verdict path" | `evidence/harness/freeze/latest/verdict-path-audit.json` | 2026-08-02 | SOV Harness Custodian |
| 8 | Charter articles | **52** (VERIFIED 2026-08-02) | "a 52-article charter" | `evidence/charter/charter-article-count.json` | 2026-08-02 | Charter Editor |
| 9 | MCP tools | **PENDING OWNER CONFIRMATION** — candidate: 9 | "9 MCP tools" | `evidence/harness/freeze/latest/mcp-tools-manifest.json` (audit record filed 2026-08-02: NO 9-tool manifest exists — number may not ship per G3) | 2026-08-02 (audit) | Platform Lead |
| 10 | Probe-harness size | **PENDING OWNER CONFIRMATION** — candidate: 16 probes | "16-probe red-team harness" | `evidence/harness/freeze/latest/probe-harness-manifest.json` (audit record filed 2026-08-02: 16 unbacked; 45 flywheel probes measured candidate) | 2026-08-02 (audit) | Red Team Lead |
| 11 | Passport schema version | **PENDING OWNER CONFIRMATION** — candidate: 1.0 (filed 2026-08-02) | "Agent Passport schema vX.Y" | `evidence/schema/agent-passport-schema-version.json` | 2026-08-02 (audit) | Platform Lead |
| 12 | ProvBench finding | **LOCKED** | Exact string: "0 of 20 assets survived (95% CI, clustered by asset)" | `evidence/harness/freeze/latest/provbench-results.json` (frozen 2026-08-02: k=0, n=20, Wilson one-sided 11.9%) | 2026-08-02 (audit) | SOV Harness Custodian |
| 13 | Governed MCP servers | **291** (VERIFIED 2026-08-04) | "291 governed MCP servers" | `evidence/registry/mcp-servers-count.json` (derived from `client/src/data/mcpRegistry.json`: total=291, servers.length=291, self-consistent). Rejected drift: 293 (canonMcpRegistry declared, not self-consistent, not the rendered file), 378 (ToolCommons fallback, no evidence file), 341/233 (no evidence file). | 2026-08-04 | SOV Harness Custodian |

### 1.1 Register-locked phrasing

The ProvBench finding is cited **only** as:

> "0 of 20 assets survived (95% CI, clustered by asset)"

Forbidden variants: "0% survival rate", "all 20 assets failed", "no assets
survived" (drops the denominator and interval), any paraphrase that omits the
confidence interval or the clustering note. If the harness is re-run and the
finding changes, the new phrasing is locked at change time via the Change
Procedure in Section 4.

### 1.2 Crosswalk notation

The compound claim "N frameworks x M provisions" (e.g., the observed
"13 x 8 crosswalks") is **not** a canon metric and may not appear publicly.
Public copy states frameworks (metric 4) and provisions (metric 3) separately.
Any cross-product figure requires its own canon row and evidence file before
use.

---

## 2. OBSERVED-SETS APPENDIX (audit, 2026-08-02)

Three mutually contradictory counter sets shipped publicly within 24 hours:

### Set A — csoai.org new SPA (observed 2026-08-02)
- "417 statutory provisions"
- "30 frameworks crosswalked"
- "193 GovBench items"
- "19 signed agents"
- "0 models in verdict path"

### Set B — csoai.org earlier same-day build (observed 2026-08-02, superseded by Set A within the day)
- "349 legal provisions"
- "72 GovBench cells"
- "0.939 / 0.979" (unlabelled scores)
- "n=1,293"
- "0.0%"

### Set C — proofof.ai (observed 2026-08-02)
- "30 regulatory frameworks"
- "52-article charter"
- "9 MCP tools"
- "16-probe harness"

### Additional conflicting citations found on other pages
- "13 frameworks"
- "13 x 8 crosswalks"
- "417 provisions" (agrees with Set A on this one metric)

### Contradiction map
| Metric | Set A | Set B | Set C | Other pages |
|--------|-------|-------|-------|-------------|
| Provisions | 417 | 349 | — | 417 |
| Frameworks | 30 | — | 30 | 13, 13x8 |
| GovBench | 193 items | 72 cells | — | — |
| Signed agents | 19 | — | — | — |
| Models in verdict path | 0 | — | — | — |
| Charter articles | — | — | 52 | — |
| MCP tools | — | — | 9 | — |
| Probe harness | — | — | 16 | — |
| Unlabelled scores | — | 0.939 / 0.979, n=1,293, 0.0% | — | — |

### Resolution rule
**Frozen harness output wins.** For each metric, the value in the most recent
frozen harness output (or authoritative registry/schema export) under
`evidence/` is the canon value. Any public property showing anything else is
corrected to canon. If no frozen output exists for a metric (the case for all
PENDING rows above as of 2026-08-02), the owner either (a) locates the frozen
output that produced the candidate value and files it under `evidence/`, or
(b) re-runs the harness and freezes fresh output. The canon is updated only
through the Change Procedure in Section 4. Hand-editing a page to match another
page is never a resolution.

Note on Set B: the values 0.939, 0.979, n=1,293, and 0.0% have no canon rows.
They are quarantined: they may not appear in any public property unless and
until each is admitted as its own canon metric with a frozen evidence file and
a locked definition (metric name, population, and units).

---

## 3. DISTRIBUTION CONTRACT

All public properties consume the canon through exactly one machine-readable
file. No page, component, template, slide, or README may contain a hardcoded
counter string.

### 3.1 Single source file
- Path: `counters.json` at the repository root.
- Generated from this canon; every value field either matches Section 1
  verbatim or is the string `"PENDING_OWNER_CONFIRMATION"` (pending rows ship
  their candidate value only in the `candidate` field, never in `value`).
- Each public property (csoai.org SPA, proofof.ai, docs site) renders counters
  by fetching/importing this file at build time. Runtime fetch is permitted
  only if the build pins the file's content hash.

### 3.2 counters.json template

```json
{
  "canon_version": "1.0.0",
  "canon_file": "SOV-Counter-Canon.md",
  "generated_at": "2026-08-02T00:00:00Z",
  "counters": {
    "company_number": {
      "value": "16939677",
      "status": "VERIFIED",
      "phrasing": "CSOAI Ltd, company number 16939677",
      "evidence": "evidence/registry/companies-house-16939677.json",
      "last_verified": "2026-08-02",
      "owner": "Company Secretary"
    },
    "art50_in_force_date": {
      "value": "2026-08-02",
      "status": "VERIFIED",
      "phrasing": "Article 50 transparency obligations apply from 2 August 2026",
      "evidence": "evidence/regulatory/eu-ai-act-art50-in-force.md",
      "last_verified": "2026-08-02",
      "owner": "Regulatory Counsel"
    },
    "statutory_provisions": {
      "value": null,
      "candidate": 417,
      "status": "PENDING_OWNER_CONFIRMATION",
      "phrasing": "417 statutory provisions crosswalked",
      "evidence": "evidence/harness/freeze/latest/statutory-provisions.json",
      "last_verified": "2026-08-02",
      "owner": "SOV Harness Custodian"
    },
    "frameworks_crosswalked": {
      "value": null,
      "candidate": 30,
      "status": "PENDING_OWNER_CONFIRMATION",
      "phrasing": "30 regulatory frameworks crosswalked",
      "evidence": "evidence/harness/freeze/latest/framework-crosswalk.json",
      "last_verified": "2026-08-02",
      "owner": "SOV Harness Custodian"
    },
    "govbench_items": {
      "value": null,
      "candidate": 193,
      "status": "PENDING_OWNER_CONFIRMATION",
      "phrasing": "193 GovBench items",
      "evidence": "evidence/harness/freeze/latest/govbench-results.json",
      "last_verified": "2026-08-02",
      "owner": "SOV Harness Custodian"
    },
    "signed_agents": {
      "value": null,
      "candidate": 19,
      "status": "PENDING_OWNER_CONFIRMATION",
      "phrasing": "19 signed agents in the registry",
      "evidence": "evidence/registry/signed-agents.json",
      "last_verified": "2026-08-02",
      "owner": "Registry Maintainer"
    },
    "models_in_verdict_path": {
      "value": null,
      "candidate": 0,
      "status": "PENDING_OWNER_CONFIRMATION",
      "phrasing": "0 models in the verdict path",
      "evidence": "evidence/harness/freeze/latest/verdict-path-audit.json",
      "last_verified": "2026-08-02",
      "owner": "SOV Harness Custodian"
    },
    "charter_articles": {
      "value": null,
      "candidate": 52,
      "status": "PENDING_OWNER_CONFIRMATION",
      "phrasing": "a 52-article charter",
      "evidence": "evidence/charter/charter-article-count.json",
      "last_verified": "2026-08-02",
      "owner": "Charter Editor"
    },
    "mcp_tools": {
      "value": null,
      "candidate": 9,
      "status": "PENDING_OWNER_CONFIRMATION",
      "phrasing": "9 MCP tools",
      "evidence": "evidence/harness/freeze/latest/mcp-tools-manifest.json",
      "last_verified": "2026-08-02",
      "owner": "Platform Lead"
    },
    "probe_harness_size": {
      "value": null,
      "candidate": 16,
      "status": "PENDING_OWNER_CONFIRMATION",
      "phrasing": "16-probe red-team harness",
      "evidence": "evidence/harness/freeze/latest/probe-harness-manifest.json",
      "last_verified": "2026-08-02",
      "owner": "Red Team Lead"
    },
    "passport_schema_version": {
      "value": null,
      "candidate": null,
      "status": "PENDING_OWNER_CONFIRMATION",
      "phrasing": "Agent Passport schema vX.Y",
      "evidence": "evidence/schema/agent-passport-schema-version.json",
      "last_verified": "2026-08-02",
      "owner": "Platform Lead"
    },
    "provbench_finding": {
      "value": "0 of 20 assets survived (95% CI, clustered by asset)",
      "status": "LOCKED",
      "phrasing": "0 of 20 assets survived (95% CI, clustered by asset)",
      "evidence": "evidence/harness/freeze/latest/provbench-results.json",
      "last_verified": "2026-08-02",
      "owner": "SOV Harness Custodian"
    }
  }
}
```

### 3.3 CI enforcement
Every public property's build pipeline runs a canon check that fails the build
if:
1. Any rendered page contains a numeric counter matching the shape of a canon
   metric whose value differs from `counters.json`.
2. Any rendered page contains a hardcoded copy of a canon `phrasing` string
   instead of a reference to `counters.json`.
3. Any rendered page contains a quarantined value from Appendix A Set B
   (0.939, 0.979, n=1,293, 0.0% in score context) or the forbidden crosswalk
   forms "13 x 8" / "N x M crosswalks".
4. `counters.json` references an evidence path that does not exist on disk
   for a counter with status VERIFIED or LOCKED.
5. A counter with status PENDING_OWNER_CONFIRMATION is rendered with its
   `candidate` value presented as confirmed fact. (Properties may either omit
   the counter or render it with the pending marker, per page policy.)

### 3.4 Rendering rule
Per-page counters are rendered from `counters.json` at build time, keyed by
counter name — never typed by hand, never copy-pasted from another page. A
page that needs a number not in `counters.json` is blocked: the number must
first be admitted to the canon via Section 4.

---

## 4. CHANGE PROCEDURE

A counter value changes only through this sequence, in this order:

1. **Harness re-run.** The metric's owner re-runs the harness, registry
   export, or schema export that produces the metric. No other source of new
   values is accepted.
2. **New evidence file.** The output is frozen and committed under
   `evidence/` with an immutable, dated path (e.g.,
   `evidence/harness/freeze/2026-08-15/govbench-results.json`), and
   `evidence/harness/freeze/latest/` is updated to point at it. A frozen file
   is never modified in place.
3. **Version bump in canon.** This file and `counters.json` are updated in the
   same commit: new value, new evidence path, new `last_verified` date, and a
   `canon_version` bump (patch for confirmation of a PENDING row, minor for a
   value change, major for adding/removing a metric).
4. **Refutation-ledger entry.** An entry is appended to the refutation ledger
   recording: the metric, old value, new value, evidence path, reason for the
   change (e.g., harness re-run with expanded corpus, methodology fix,
   confirmation of a previously pending figure), and the date. The ledger is
   append-only; superseded values are marked as such, never deleted.

A counter is **never** edited by hand in a page, template, deck, or post. Any
hand-edited counter discovered in the wild is treated as a defect: the page
is reverted to canon rendering and the incident is recorded in the refutation
ledger.

---

*Canon version 1.0.1 — issued 2026-08-02, patch-frozen 2026-08-02 (rows 3, 5, 7, 8
confirmed VERIFIED; row 12 evidence frozen; five rows remain PENDING pending owner
decisions recorded in the evidence files and the refutation ledger
`evidence/REFUTATION_LEDGER.md`).*
