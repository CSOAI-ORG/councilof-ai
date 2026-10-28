# art50-probe

Deterministic, evidence-carrying probe for the three EU AI Act **Article 50** transparency
obligations: (1) AI-interaction disclosure, (2) machine-readable marking of synthetic
content, (3) AI-media/deepfake labelling.

```
pip install art50-probe
art50-probe https://example.com --json out.json
```

Every verdict carries its evidence snippet or the explicit note "checked, none found".
Stdlib-only. Output is **unsigned probe observations** — independent *measurement* data,
never certification, grading or sealing. Signed measurement cards are produced separately
by the CSOAI measurement pipeline (councilof.ai). This package states mechanism and scope
only — no prices anywhere.

Honest labels: `ABSENT` = checked, none found in scanned HTML (not a legal finding);
JS-mounted widgets can evade a static scan. One home page per run in v0.
