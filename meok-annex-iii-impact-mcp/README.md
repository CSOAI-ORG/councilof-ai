# meok-annex-iii-impact-mcp

> Automated EU AI Act **Annex III** risk classification + impact assessment engine.

A Mavis-pattern MCP server that classifies AI systems against the **8 categories of high-risk AI** defined in Annex III of the EU AI Act (Regulation (EU) 2024/1689) and produces the compliance documentation regulators expect:

- **Article 27** Fundamental Rights Impact Assessment (FRIA), as draft Markdown
- **Annex IV** technical documentation, as structured JSON
- **Article 9 / 10 / 13 / 14 / 15** compliance check, PASS / FAIL / REVIEW
- **Ed25519-signed attestation** of the classification (legally reproducible, offline, deterministic)

The classification engine is **100% offline, deterministic, reproducible** — it uses keyword weighting, not LLM calls. The same input always produces the same classification. Auditors can re-run the engine and obtain the same answer.

---

## Why

The `eu-ai-act-compliance-mcp` (the 410-article regulatory reference) tells you *what the law says*. This MCP tells you *what applies to YOUR system* — and drafts the FRIA + Annex IV documentation you owe the regulator. The pair forms a complete compliance loop: legal reference ↔ automated applicability ↔ human sign-off.

## The 8 Annex III categories

| # | id | name |
|---|----|------|
| 1 | `biometric_identification` | Biometric identification (real-time remote, post) |
| 2 | `critical_infrastructure` | Critical infrastructure (water, gas, heating, electricity, traffic) |
| 3 | `education_and_vocational_training` | Education & vocational training (admissions, assessment, proctoring) |
| 4 | `employment_workers_management` | Employment & workers management (recruitment, promotion, termination, task allocation) |
| 5 | `access_to_essential_services` | Access to essential services (public services, credit scoring, insurance, emergency) |
| 6 | `law_enforcement` | Law enforcement (risk assessment, lie detection, evidence evaluation) |
| 7 | `migration_asylum_border_control` | Migration, asylum & border control (visa, asylum, border) |
| 8 | `justice_democratic_processes` | Justice & democratic processes (court, election influence, public opinion) |

## The 4 tools

1. **`classify_system(system_description, deployment_context)`** — returns the Annex III category (or `not_high_risk`) with confidence, applicable articles, and key obligations.
2. **`generate_fria(system_id, classification)`** — produces a draft Fundamental Rights Impact Assessment in Markdown, ready for human review (covers Article 27: deployment context, affected groups, potential harms, mitigation, oversight).
3. **`check_article_compliance(system, articles)`** — returns PASS / FAIL / REVIEW per article (e.g. `[9, 10, 13, 14, 15, 27]`) with the evidence each article requires.
4. **`generate_annex_iv_documentation(system)`** — produces Annex IV technical documentation in JSON, the 9 required sections (general description, design specs, data preparation, capabilities/limitations, intended purposes, risk management, validation, transparency, post-market monitoring).

All tools return JSON envelopes with `status`, `classification`, `draft_document`, `evidence_requirements`, `recommendations`, and `signature`.

## Install

```bash
cd meok-annex-iii-impact-mcp
python3 -m venv /tmp/annex-venv
/tmp/annex-venv/bin/pip install -e ".[dev]"
```

## Run

```bash
# MCP server (stdio)
meok-annex-iii-impact-mcp

# Or programmatic
/tmp/annex-venv/bin/python3 -c "from meok_annex_iii_impact_mcp.server import classify_system; print(classify_system('AI that screens job applicants','recruitment'))"
```

## Test

```bash
/tmp/annex-venv/bin/pytest tests/ -q
```

12+ tests, hermetic, <1s.

## License

MIT — Copyright (c) 2026 MEOK AI Labs CSOAI LTD
