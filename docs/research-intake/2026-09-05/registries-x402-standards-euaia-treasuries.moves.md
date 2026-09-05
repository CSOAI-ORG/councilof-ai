# Registries, x402, Standards, EU AI Act, Tokenised Treasuries — extracted moves

**Source brief:** `~/Downloads/compass_artifact_wf-6fa9c19b-bd5b-5edd-bb01-3adbca02807f_text_markdown.md`
**Mined:** 2026-09-05, TUI-5 (research-intake lane)
**Rule:** the `already live?` column is a PROBE RESULT taken at mine time, never an assumption.
Probe commands are in the Evidence column so a stranger re-runs them.

| move | lane-doable? | owner-gated? | already live? (probed) | evidence |
|---|---|---|---|---|
| **GLEIF LEI** L1+L2 harvest — free, keyless, redistribution-friendly, cross-links BIC/ISIN/MIC | **YES** (new door) | no | **MISSING** — no `gleif`/`lei` slug in 193 doors + 240 formats | slug probe over `/.well-known/index.json` |
| **ESMA MiCA register** (CASPS.csv; 331 authorised CASPs @ 2 Sep 2026) | **YES** (new door) | no | **PARTIAL** — `esma` slug exists, no `mica` slug | slug probe |
| **EU AI Act Article 71 database** — Art 71(4) requires machine-readable public access | **YES** (new door) | no | **MISSING** — no `article-71`/`art71` slug | slug probe |
| SEC EDGAR / OFAC SDN — free, keyless, machine-readable | **YES** (new door) | no | **MISSING** — no `edgar`/`ofac` slug | slug probe |
| Companies House API | no — needs a free API key (breaks keyless doctrine at the key step) | **YES** (key) | **MISSING** | slug probe |
| eIDAS trusted lists / EU Digital Product Passport / EU Transparency Register | **YES** (new doors) | no | **MISSING** — no `eidas`/`product-passport`/`transparency-register` slug | slug probe |
| **ERC-3643 / T-REX** tokenised-treasury door | **YES** (new door) | no | **MISSING** — no `trex`/`t-rex` slug | slug probe |
| **EAS on Base** as anchor layer (off-chain free; on-chain cents) | no — wallet/keys | **YES** | `eas` matches are unrelated financial cards, not an EAS anchor | slug probe + `root.json` has no `eas` field |
| **OpenTimestamps** the single Merkle root | no — CI/keys | **YES** | **MISSING** — deployed `root.json` carries no `ots`/`anchor`/`rekor` field | `curl -s https://councilof.ai/root.json` |
| IETF SCITT I-D / mailing list | no | **YES** | `scitt` door EXISTS (`gsr-scitt-statement`) | slug probe |
| **OSCAL crosswalk door** | **YES** (new door) | no | **MISSING** — 404 and no `oscal` slug | `curl -o /dev/null -w '%{http_code}' https://councilof.ai/.well-known/oscal.json` |

## The standout

GLEIF is called out in the brief as *"the single best harvest target you have not fully
exploited"* — authoritative, machine-readable (CDF/XML/JSON), redistribution-friendly, daily
Golden Copy/Delta, and it cross-links to BIC, ISIN, MIC and OpenCorporates. The estate has
**no GLEIF or LEI door at all**. That is the largest single registry gap found in this mine.

**Caveat carried from the brief, not resolved here:** the Art 71 database's public JSON/API
endpoint is *unverified* as live and well-formed. A door must say UNMEASURED until probed.
