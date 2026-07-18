# defoneos-sign-mcp

**The sovereign assurance layer, as an MCP.** Any Claude agent — Claude Science, Claude Code, a custom agent — hands over an output and gets back a **signed, offline-verifiable DEFONEOS artifact**. The receipt verifies at [defoneos.vercel.app/verify.html](https://defoneos.vercel.app/verify.html) with **no server** — same Ed25519 scheme as the DEFONEOS dome's SIGIL ledger.

DEFONEOS doesn't live *inside* anyone's app. It's the thing the ecosystem calls **into** to make a result auditable, reproducible, and independently checkable. This is that seam.

## Why
The biggest labs now ship "auditable / reproducible" AI outputs (e.g. Claude Science attaches the code + environment + history that made a result). DEFONEOS goes one axis further: the artifact is **cryptographically signed and verifiable without trusting the vendor's server**. This MCP puts that primitive one tool-call away for any agent.

## Tools
| # | tool | does |
|---|------|------|
| 1 | `defoneos_sign` | wrap `{output, kind, subject, method, inputs}` in signed provenance → receipt (Ed25519). Records method ("how it was made"), input sources, a SHA-256 of the exact output, and the care-floor. |
| 2 | `defoneos_verify` | verify a receipt offline (tamper-evident); optionally re-bind the original output to its signed hash. |
| 3 | `defoneos_system_card` | sign a **system card** (name/version/provider/purpose/posture) into a signed DEFONEOS artifact — the JSP 936 / EU-AI-Act assurance primitive. Attests declared posture; does not accredit. |
| 4 | `defoneos_oscal` | emit a signed **NIST OSCAL 1.1.2 component-definition** of the governance posture — the auditor's lingua-franca. `.oscal` ingests into any OSCAL tool; the signature verifies offline. Declared posture, not a passed assessment. |
| 5 | `defoneos_public_key` | the sovereign public key + fingerprint (trust-on-first-use / pin it). |
| 6 | `defoneos_chain_status` | read the in-process SIGIL-style hash chain head: signed-artifact count, last `action` + `ts` + `sig`. Pure read — never signs anything new. Hosts use it to confirm the dome's ledger shape. |

## Run
```bash
node server.js          # MCP stdio server
npm test                # 18/18 — six tools × three checks (sign/verify/tamper for sign + verify; roundtrip for system-card + oscal; invariants for public-key + chain-status)
```

CSOAI Ltd (UK 16939677) · MIT + CC0.


## Install into a Claude host (copy-paste)

**Claude Code** (one command):
```bash
claude mcp add defoneos-sign -- node /ABSOLUTE/PATH/TO/defoneos-sign-mcp/server.js
# then in any session:  /mcp   → confirm "defoneos-sign" is connected
```

**Claude Desktop** — edit `claude_desktop_config.json`
(macOS: `~/Library/Application Support/Claude/claude_desktop_config.json` · Windows: `%APPDATA%\Claude\claude_desktop_config.json`), then restart Claude:
```json
{
  "mcpServers": {
    "defoneos-sign": {
      "command": "node",
      "args": ["/ABSOLUTE/PATH/TO/defoneos-sign-mcp/server.js"]
    }
  }
}
```

**Any MCP host / SDK** — stdio transport, command `node server.js`. Optional env:
`DEFONEOS_KEY_DIR` (default `~/.defoneos`), `DEFONEOS_VERIFY_URL` (default the hosted verifier).

## Worked example — sign a Claude Science / Claude Code output
Once connected, ask the agent in plain language:

> *"Sign this finding via DEFONEOS: **ΔG = −9.4 kcal/mol for ligand X on target Y**. Method: Boltz-2 via BioNeMo, seed 42, boltz@2.1. Inputs: PDB:1ABC, SMILES:CC(=O)O."*

The agent calls `defoneos_sign`, and you get a receipt. Verify it three ways, all offline:
1. paste it into `verify.html`, or
2. drop the downloaded `defoneos-receipt-*.json`, or
3. open `verify.html?receipt=<base64url>` — auto-verifies on load.

Result: **✓ signature cryptographically valid — sovereign, offline, no server.** The output now carries a signed record of *what it is, how it was made, and from which inputs* — the assurance layer on top of the workbench.

## What a receipt looks like
```json
{ "defoneos_signed_contact": {
    "message": { "i":0, "ts":"…", "action":"artifact:finding", "detail":"{…method,inputs,output_sha256,care_floor…}", "prev":"" },
    "signature_ed25519": "…128 hex…",
    "public_key_ed25519": "…64 hex…",
    "fingerprint": "SOV:XXXX-XXXX-…" } }
```
Drop it into `verify.html` (paste, file-drop, or `?receipt=<base64url>`), or verify with any Ed25519 library:
recompute `utf8(JSON.stringify(message))`, then Ed25519-verify `signature_ed25519` with `public_key_ed25519`.

## Guarantees & honest scope
- **Ed25519 (RFC 8032)**, raw message sign — cross-library verified (Node `crypto` ↔ `@noble/ed25519` in the browser verifier).
- **Sovereign key** persists at `~/.defoneos/sign.key` (0600); nothing is sent anywhere.
- **Care-floor recorded** in every envelope + a hard-stop note: signed for **assurance only** — no kinetic/surveillance tasking (a Layer-0 hard stop). This MCP signs; it does not act.
- It attests *that an output was produced and by what method*; it does **not** validate the output is scientifically correct. Provenance ≠ truth — that stays with the researcher.

CSOAI Ltd (UK 16939677) · MIT + CC0.
