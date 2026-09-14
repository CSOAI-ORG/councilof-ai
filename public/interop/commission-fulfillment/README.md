# /interop/commission-fulfillment — labelled probe

**UNSIGNED.** Receipt ≠ measured. Board cite live GET `/api/gspc` only (22·22·0). Never invent MEASURED.

## Wire (already LIVE)
1. Paid `/api/request-attestation` → `REVENUE_KV` `ras:<sha>`
2. `GET /api/commissions` lists subjects
3. `hub-queue-mill` curls commissions → `--priority`
4. KEEP `commission-dispatch.sh` admits **installed Ollama** models only

## Gap this probe proves
Commissioned subjects that are **not** in `csoai/hub-queue` cannot be graded by the hub mill. Ollama-shaped tags need KEEP dispatch. Synthetic subjects (e.g. payai-wrapper) stay **UNFULFILLABLE** until a real millable id is commissioned.

See `commission-fulfillment-probe.json`.
