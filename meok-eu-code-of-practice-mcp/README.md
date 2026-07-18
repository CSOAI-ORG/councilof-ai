# meok-eu-code-of-practice-mcp

A [Model Context Protocol](https://modelcontextprotocol.io/) server that wraps C2PA Content Credentials and watermarking into a single, signed **two-layer attestation manifest** compliant with the **EU Code of Practice on AI content marking (draft 2, finalising June 2026)**, which operationalises **EU AI Act Article 50(2)** transparency obligations (enforceable 2 August 2026 for new systems).

## Why this exists

Article 50(2) of the EU AI Act requires providers and deployers of AI systems that generate or manipulate image, audio, video or text content to ensure the output is **machine-readable** and **detectable as artificially generated or manipulated**. The Code of Practice (draft 2) prescribes a **two-layer approach**:

- **Layer 1 — C2PA Content Credentials**: cryptographic provenance (assertions, signed manifest store).
- **Layer 2 — Watermarking**: visible or invisible signal embedded in the content bits.

Optional best-practice: fingerprinting + immutable audit logging.

This MCP produces a **single signed manifest** that says *"this content has been marked per the EU Code of Practice, here's the C2PA assertion, here's the watermark, here's the audit trail, signed by MEOK"*, plus a **public `verify_url`** so any auditor can confirm Code-of-Practice compliance **without calling the MCP** — the *Let's Encrypt model* applied to content marking.

## The two-layer schema (this is the IP)

```jsonc
{
  "code_of_practice_version": "draft-2-2026-06",
  "mcp_version": "1.0.0",
  "generated_at": "<ISO-8601 timestamp>",
  "content_hash": "<sha256 hex of content>",
  "layers": [
    {
      "c2pa_manifest": {
        "claim_generator": "meok-c2pa-watermark-mcp/1.0.0",
        "claim_generator_info": [{ "name": "MEOK", "version": "1.0.0" }],
        "assertions": [
          { "label": "c2pa.actions",
            "data":   { "actions": ["c2pa.created", "c2pa.transcoded"] } }
        ],
        "signature": "<c2pa signature hex>"
      },
      "c2pa_store_path": "<local C2PA store path>",
      "c2pa_verify_url":  "https://verify.contentcredentials.org/verify/<...>"
    },
    {
      "watermark_type":      "invisible",
      "watermark_payload":   "<base64 payload>",
      "embedding_method":    "dwt-dct-svd",
      "detection_confidence": 0.97
    }
  ],
  "signature": "<ed25519 128-hex-char signature over canonical JSON>"
}
```

The outer Ed25519 signature is produced by this MCP and covers `canonicaljson.dumps(audit, sort_keys=True)`.

## Tools (exactly 4)

| # | Tool | Purpose |
|---|------|---------|
| 1 | `mark_content(content, content_type, generator)` | Produce a signed two-layer attestation manifest for a piece of content. |
| 2 | `verify_attestation(manifest)` | Verify a manifest's C2PA layer, watermark layer, and Ed25519 signature. |
| 3 | `detect_ai_content(content)` | Heuristically score whether content appears AI-generated and optionally match a fingerprint. |
| 4 | `compliance_check(operator)` | Return a Code-of-Practice compliance posture for a given operator. |

All tools return JSON with: `status`, `manifest` (where applicable), `compliance_posture`, `recommendations`, `signature`, `code_of_practice_version`.

## Verify URL template

```
https://meok-attestation-api.vercel.app/verify/<content_hash>
```

Any auditor with a `content_hash` can confirm Code-of-Practice compliance without holding MCP credentials.

## Installation

```bash
pip install meok-eu-code-of-practice-mcp
# or, from source:
pip install -e .
```

## Running the MCP server

```bash
meok-eu-code-of-practice-mcp
```

## Testing

```bash
pip install -e ".[test]"
pytest tests/ -q
```

## Security note

This package ships with a **hardcoded demo Ed25519 key** for reproducibility. In production, replace `SIGNING_KEY` in `server.py` with a key fetched from a KMS (AWS KMS / GCP KMS / HSM). The comment in the source marks the swap point.

## License

MIT — Copyright (c) 2026 MEOK AI Labs CSOAI LTD.
