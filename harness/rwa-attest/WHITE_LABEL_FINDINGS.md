# White-Label Findings — deterministic signed regulator/AI-insurance measurements

Genuinely-new, GPU-free white-label findings mined from the estate's LIVE signed surfaces.
Each finding is **deterministic** (no model consulted, no LLM-judge), **measured-not-certified**,
and **Ed25519-signed** (stranger-verifiable), published as a codex-clean artifact in
`public/interop/`. This is the white-label regulator pivot: hand a working GSPC E2E that sorts
every AI-compliance problem + fine exposure before anyone is contacted.

## Doctrine (binds every finding)
- **Measurement, not certification.** We measure; we never certify, accredit, endorse, or tokenize.
- **UNMEASURED is first-class.** A missing/harm-missing value is reported (never coerced to 0/LOW).
- **Signed + stranger-verifiable.** Every finding carries an Ed25519 signature over the
  canonical body (signer-consistent canon: `json.dumps(sort_keys, separators=(',',':'),
  ensure_ascii=False)` over the body without content_id/signature) — recompute + verify, trust none.
- **No fine prediction / not legal opinion / not advice.** Severity is an ordinal over published maxima.
- **Internal codenames never public** (DEFONEOS, SOVOS, OWEM, etc. are stripped from public strings).

## The findings (all in `public/interop/*.json`, all signed)

| Finding | Tool | What it says | Formula |
|---|---|---|---|
| **risk-register** | `risk_register.py` | Harm-vs-accuracy risk ranking of the board axes | `risk_score = mean_harm * (1 - accuracy)` |
| **exposure-register** | `exposure_register.py` | Axis gap x statutory fine-tier exposure ranking | `exposure_index = (1-accuracy)*harm` (harm=1.0 fallback if missing) |
| **deadline-radar** | `deadline_radar.py` | Deadline + severity ranking (urgency x penalty) | severity ordinal 1-5 over published maxima |
| **jailbreak-rating** | `jailbreak_rating.py` | Risk-grade per model from measured ASR | ASR bands: >=0.70 CRITICAL, 0.55 HIGH, 0.40 MEDIUM, <0.40 LOW |
| **sector-crosswalk** | `sector_crosswalk.py` | Frameworks + exposure grade per sector | worst-grade + C/H/M/L counts per sector |
| **attestation-integrity** | `attestation_integrity.py` | Which interop surfaces verify | recompute content_id, report SIGNED-VERIFIABLE / UNSIGNED |
| **coherence-audit** | `coherence_audit.py` | Where findings disagree (and why) | cross-check shared metrics, report cause |
| **pqc-continuity-measure** | `pqc_continuity_measure.py` | Post-quantum classification accuracy | deterministic verdict-word grading |
| **index-reverify** | `reverify_index_components.py` | Live re-verification of reference series | re-fetch + compare published values |
| **findings-index** | `findings_index.py` | Consolidated catalog + verifiability | recompute each finding's content_id |

## How a stranger verifies
```
# Recompute content_id + verify the Ed25519 signature
python3 -c "
import json, hashlib, base64
from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PublicKey
d = json.load(open('public/interop/<finding>.json'))
body = {k:v for k,v in d.items() if k not in ('content_id','signature')}
cid = hashlib.sha256(json.dumps(body, sort_keys=True, separators=(',',':'),
                     ensure_ascii=False).encode()).hexdigest()
print('cid match:', cid == d['content_id'])
pub = Ed25519PublicKey.from_public_bytes(base64.b64decode(d['signature']['pubkey']))
pub.verify(base64.b64decode(d['signature']['sig']), cid.encode())
print('Ed25519 signature valid')
"
```

## Reproducible from source
Every finding has a deterministic tool (col 2). Run it against the live signed endpoints
(`API_HOST=https://councilof.ai`) to regenerate the number at any time. The scoreboard,
regulation, and evidence-pack surfaces are the authoritative sources; a finding that consumes
a number the board does not publish is marked UNMEASURED, never guessed.

## Surface
All findings are served live via `/api/interop-bulk?surface=<finding>.json` (default free;
the x402 gate is an opt-in bulk-fetch convenience, not a paywall for verification).
