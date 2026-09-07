# Wave G — SkillSpector measurement layer (design only)
**Measure · 7 Sep 2026 · no stamp · no board rewrite · LIVE GET 22·22·0**

## Locks
- Three states only: **VALID / INVALID / UNCHECKABLE**
- Every claim carries **n** + a **named method**
- Never 0–100 risk score · never “safe-to-install” · never certify · never badge/trustmark
- NVIDIA SkillSpector = **Apache-2.0 substrate**, not a rival scanner we compete with for mindshare-as-score
- GSPC public board stays **22·22·0** — this layer is a **new card-v0 surface**, not a 23rd axis invent
- SIGNED leaf still needs n≥30 + 4way + keystone (same gate as other surfaces)
- Public names only: Council of AI, GSPC, RAS

## Substrate (cite, don’t invent)
| Fact | Cite |
|---|---|
| Repo | https://github.com/NVIDIA/SkillSpector |
| Docs | https://docs.nvidia.com/skills/scanning-agent-skills |
| License | Apache-2.0 |
| Role | Static (+ optional LLM) scanner for agent skills; emits findings + **0–100 risk score** + install recommendation |
| Patterns | ~71 patterns / 17 categories (README; pattern counts drift across secondary write-ups — **pin version in method**) |
| Output formats | Terminal, JSON, Markdown, SARIF |

**Doctrine gap we fill:** SkillSpector’s score/safe-to-install elides denominator and reproducibility. We publish dated, signed, stranger-recomputable **per-skill** three-state results over the same corpus/tool, with n and method pinned.

## Product shape (what we ship later — not today)
A **measurement layer over** SkillSpector runs — not a fork that invents a better score.

1. Freeze a skill bank (list of skill URIs / content digests)
2. Run named method (pinned SkillSpector version + flags)
3. Map tool output → per-skill VALID/INVALID/UNCHECKABLE
4. Emit card-v0 leaf (unsigned until gates) + optional census rollup with n
5. Free verify path cites the card; never sells a grade

## card-v0 surface draft
**Proposed surface id:** `gspc.skill.spectrometry`  
(alt short: `skill.spectrometry` — CEO names final)

### Outer envelope (unchanged owner fields)
`schema` · `surface` · `subject` · `as_of` · `source_urls` · `payload` · `sha256` · `unmeasured` · optional `sig_ed25519`

### Payload profile (Measure-owned)
```json
{
  "kind": "skill-spectrometry",
  "not_a_certification": true,
  "not_a_score": true,
  "not_safe_to_install_verdict": true,
  "subject_skill": {
    "uri": "https://…/SKILL.md-or-repo",
    "content_sha256": "…",
    "format": "skill.md|dir|zip|git"
  },
  "method": {
    "name": "skillspector-static-vN",
    "tool": "NVIDIA/SkillSpector",
    "tool_version": "vX.Y.Z",
    "tool_commit": "…",
    "license": "Apache-2.0",
    "flags": ["--no-llm"],
    "patterns_ref": "pinned count @ version",
    "llm_pass": false
  },
  "result": {
    "status": "VALID|INVALID|UNCHECKABLE",
    "n": 1,
    "n_unit": "skill",
    "findings_n": 0,
    "categories_hit": [],
    "raw_artifact_sha256": "…",
    "note": "Never copy SkillSpector 0–100 into this object"
  },
  "honesty": {
    "substrate_not_rival": true,
    "board_authority": "GET https://councilof.ai/api/gspc — 22·22·0; this surface is not a board axis invent",
    "signed_path": "n≥30 bank census + 4way + keystone before public SIGNED"
  }
}
```

### Three-state mapping (named method — draft)
Pin one method string; do not freestyle per run.

| Status | When (static method `skillspector-static-vN`, `--no-llm`) |
|---|---|
| **INVALID** | Tool exits cleanly; ≥1 finding in severity class named by method (e.g. high/critical pattern hit) — **not** “score ≥ X” |
| **VALID** | Tool exits cleanly; zero findings under the pinned pattern set |
| **UNCHECKABLE** | Tool error / timeout / unsupported format / missing artifact / offline OSV required-and-failed / LLM-pass required-but-disabled when method demands it |

**Forbidden mappings:** score thresholds · “safe to install” · averaging across skills into a grade · inventing MEASURED on GSPC board from this surface.

### Census card (bank rollup)
Separate leaf or same surface with `n_unit: "skills"`:
- `n` = skills in frozen bank attempted
- counts: `n_valid` · `n_invalid` · `n_uncheckable` (must sum to n)
- never publish a single “corpus risk score”

## Bank plan (design)
| Phase | Bank | n target | Notes |
|---|---|---|---|
| **B0** | Smoke fixtures (3–5 crafted skills: clean / inject / exfil) | n≥5 | Prove mapping + card emit; Hub HOLD |
| **B1** | Public sample set (curated git URLs + content digests) | n≥30 | First UNSIGNED census eligible for 4way path later |
| **B2** | Stranger-recomputable HF bank `csoai/gspc-skill-spectrometry` (name TBD) | n≥30 frozen | items = uri + content_sha256 + expected optional |
| **HOLD** | Full “wild” 42k-scale bank | — | Cite Liu et al. research only until Nick names compute + publish path |

**Bank row schema (draft):**
`id` · `uri` · `content_sha256` · `format` · `source` · `as_of` · optional `note`

Independent n = unique `content_sha256` (not repeated URI pads). Same honesty rule as swarm candidates-v2.

## Run path (estate)
| Step | Owner | Lock |
|---|---|---|
| Pin SkillSpector version + flags in method registry | Measure | No floating “latest” |
| Execute scan (KEEP or Actions) | Foreman / CI | Prefer Actions when M4 disk critical; KEEP OK for small B0 |
| Map → three-state | Measure harness | `writes_board=false` forever for this surface until CEO names otherwise |
| Emit card-v0 | Measure | UNSIGNED until n≥30+4way+keystone |
| Hub / HF spray | N-Sites | HOLD until CEO names |
| Verify UI “try a skill card” | Surface | After first UNSIGNED census exists |

## Explicit non-goals
- Competing as a scanner UI or installing SkillSpector as “our” product brand
- Replacing NVIDIA Verified Skills pipeline
- Publishing 0–100 or safe-to-install
- Adding a public GSPC axis row without CEO NAMED stamp
- Inventing scores when SkillSpector returns errors (those are UNCHECKABLE)

## Open questions (CEO)
1. Final surface id: `gspc.skill.spectrometry` vs `skill.spectrometry`?
2. INVALID severity threshold: any finding vs high/critical-only? (Measure default proposal: **high/critical → INVALID**; low/info alone → VALID with findings_n noted in raw artifact, or UNCHECKABLE if method forbids silent low — prefer **any finding → INVALID** for v0 honesty)
3. LLM semantic pass: method variant `skillspector-static+llm-vN` later, never mix in same bank without new method name
4. Who owns first B0 fixture authorship — Measure draft + Hive red/blue review?

## Deliverables this wave (done when CEO eats)
- [x] This design memo
- [ ] CEO NAMED surface id + INVALID rule
- [ ] B0 fixture list (paths + digests) — after NAMED
- [ ] card-v0 schema additive PR — after NAMED (Surface/Infra)
- [ ] No mill stamp / no board rewrite meanwhile

## Cite chain
- Landscape Intel Brief 7 Sep 2026 (`/workspace/ceo/LANDSCAPE-INTEL-BRIEF-2026-09-07.md`)
- Landscape Absorb Waves (`/workspace/ceo/LANDSCAPE-ABSORB-WAVES-2026-09-07.md`) item 1 Wave G
- card-v0 grammar (`docs__CARD_V0_EVIDENCE_GRAMMAR_2026-09-01.md`)
- NVIDIA/SkillSpector Apache-2.0

Hub HOLD · writes_board=false · LIVE 22·22·0 · Artifact > green tick.

---

## CEO NAMED (7 Sep 2026) — locked
1. **surface id** = `gspc.skill.spectrometry` (card-v0 nest · **NOT** a board axis)
2. **INVALID rule v0** = any finding → INVALID; zero findings → VALID; tool fail → UNCHECKABLE. Never score thresholds. Method `skillspector-static-v0` · `--no-llm` only (LLM = later named method)
3. **B0 owner** = Measure fixtures + Hive red/blue review

B0 fixture list: `b0-fixtures/B0-FIXTURE-LIST.md` + `b0-fixtures/B0-MANIFEST.json` (n=5).
Schema fragment: `schema-fragment-gspc.skill.spectrometry.json`
Example UNSIGNED card: `card-v0-example-unsigned-skill-spectrometry.json`

Hub HOLD · writes_board=false · no stamp · LIVE 22·22·0.
