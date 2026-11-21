# Security Policy — Council of AI (CSOAI Ltd)

## Reporting a vulnerability

- **Preferred:** GitHub private vulnerability reporting on this repository (Security tab).
- **Email:** nicholas@csoai.org (CSOAI Ltd, UK Companies House 16939677)
- **Site-level:** https://councilof.ai/.well-known/security.txt

## Scope

- The GSPC board API (https://councilof.ai/api/gspc), the MCP endpoints (/mcp, /mcp/free), signature and Merkle verification paths, and the publication pipeline for signed records.
- Report: signature-verification bypasses, tampering paths, provenance gaps between published artifacts and live endpoints, injection in tool parameter handling.

## Out of scope

- The measurement methodology itself (use the corrections ledger: https://councilof.ai/corrections/).
- Third-party mirror availability; social-engineering reports without technical substance.

## Commitments

- Acknowledgement within 5 business days; fixes for accepted reports within 90 days.
- Public disclosure only after a fix ships; corrections are ledger entries, not silent edits.

Verification is free, forever, no account: `curl -s https://councilof.ai/api/gspc | head -40`. Measurement, never certification.
