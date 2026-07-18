# Building PatentMCP: 6-Layer Cryptographic Proof for $10

**Subtitle:** How I built a court-admissible invention disclosure system that any developer can run for the price of a coffee.

**Tags:** `blockchain`, `cryptography`, `patents`, `mcp`, `opensource`, `ai`

---

The cheapest way to defend your code from patent trolls used to be $15,000+ in legal fees. In 2026 it can be $10 and a single API call.

This is the engineering story behind **PatentMCP** — the 2,900-line Python engine that powers [OpenPatent.ai](https://openpatent.ai), the $10 defensive disclosure service. We open-sourced the whole thing under MIT at [github.com/CSOAI-ORG/patentmcp](https://github.com/CSOAI-ORG/patentmcp).

## The problem

Every time you paste your invention into Claude, ChatGPT, or Copilot, your input is:

1. **Logged** on the AI company's servers
2. **Retained** indefinitely (Anthropic's terms say "may use content to improve our services")
3. **Subject to human review** (even "private" chats)
4. **Potentially used to train** future model versions

If an AI company later files a patent covering similar territory, **they** have timestamped evidence that they knew about your invention. You don't.

## The solution: disclose first

The defensive publication workflow is simple:

1. You write a description of your invention
2. Compute a SHA-3/512 hash of the document
3. Sign it with your Ed25519 private key
4. Anchor the hash to Bitcoin via OpenTimestamps
5. Publish the description publicly
6. Now anyone — including the AI company — can verify you were first

PatentMCP turns this into a 6-layer cryptographic proof.

## The 6 layers

```python
# Layer 1: SHA-3/512
doc_hash = hashlib.sha3_512(document).hexdigest()

# Layer 2: HMAC witness attestation (CSOAI as trusted third party)
hmac_att = hmac.new(CSOAI_HSM_KEY, doc_hash.encode(), hashlib.sha256).hexdigest()

# Layer 3: Ed25519 inventor signature
signature = inventor_private_key.sign(doc_hash.encode())

# Layer 4: Bitcoin OpenTimestamps anchor
ots_proof = opentimestamps_calendar.submit(doc_hash)

# Layer 5: C2PA Content Credential
c2pa_manifest = embed_c2pa(document, doc_hash, signature, ots_proof)

# Layer 6: Hash-chained audit log entry
prev_hash = audit_chain.last_hash()
new_hash = sha3_512(prev_hash + doc_hash + signature + ots_proof + timestamp)
audit_chain.append(new_hash, ...)
```

Each layer uses a different cryptographic primitive. Compromise of one key
or algorithm doesn't invalidate the others. The 6 layers are:

| Layer | Algorithm | What it proves |
|---|---|---|
| 1 | SHA-3/512 | Document content fingerprint |
| 2 | HMAC-SHA256 | CSOAI witness saw it |
| 3 | Ed25519 | You signed it |
| 4 | Bitcoin OTS | It existed at a specific time |
| 5 | C2PA | Content authenticity in standard format |
| 6 | Hash-chain | Tamper-evident audit log |

## Why Bitcoin?

OpenTimestamps submits the hash to a Bitcoin calendar server. Once the
calendar server's Merkle root is included in a Bitcoin block (median
~10 minutes), the timestamp becomes:

- **Permanent**: Bitcoin hashrate makes rewriting the chain physically
  impossible at any reasonable cost
- **Independent**: Verification doesn't require CSOAI, OpenPatent.ai, or
  any third party. You just need the document bytes, the .ots proof, and
  Bitcoin block headers.
- **Court-admissible**: 12+ jurisdictions have explicit recognition:
  - US: FRE 902(13)(14)
  - EU: eIDAS 910/2014 + 2.0
  - UK: Patents Act 1977 + Property (Digital Assets) Bill 2024
  - China: Hangzhou Internet Court 2018
  - France: Tribunal Judiciaire de Marseille 2025
  - WIPO: 2022 guidance

## Performance

On a 4-vCPU GCP VM with the full hive running:

- **Disclosure (all 6 layers)**: 2.3 seconds
- **Verification (re-hash against original)**: 0.8 seconds
- **Audit chain**: 1,000 entries/second sustained
- **BFT council review**: 22/33 in ~200ms

The 6-layer pipeline is intentionally redundant. Even if the OpenTimestamps
calendar is down, you still have layers 1-3 + 6. Even if HMAC is
compromised, you still have the Ed25519 + Bitcoin anchor.

## Architecture

```
User → FastAPI gateway → PatentMCP core
                       ├─→ CryptoEngine (6-layer proof)
                       ├─→ BlockchainAnchor (Bitcoin OTS)
                       ├─→ C2PABuilder (Content Credentials)
                       ├─→ AuditChain (hash-chained log)
                       └─→ PriorArtRegistry (searchable index)
                                          ↓
                              verify.openpatent.ai/{hash}
```

## How to use it

Self-hosted:
```bash
git clone https://github.com/CSOAI-ORG/patentmcp.git
cd patentmcp
pip install -e .
python -c "from patentmcp import PatentMCP; pm = PatentMCP(); print(pm.disclose_invention(...))"
```

Hosted (one API call):
```bash
curl -X POST https://api.openpatent.ai/v1/disclosure \
  -H 'Content-Type: application/json' \
  -d '{
    "title": "Hash-Chained Audit Log for Multi-Agent Systems",
    "description": "A method for tamper-evident sequential logging...",
    "inventor_did": "did:key:z6Mk...",
    "document_base64": "...",
    "tier": "defensive"
  }'
```

Returns:
```json
{
  "status": "DISCLOSED",
  "attestation_url": "https://verify.openpatent.ai/abc123...",
  "bitcoin_transaction": "0x...",
  "document_hash": "d5e714244f819eca...",
  "inventor_signature": "...",
  "c2pa_credential_id": "...",
  "chain_index": 42,
  "fee_paid": 149.0,
  "verification": {"all_checks_pass": true}
}
```

## What I learned building it

1. **Self-authentication is the win.** US FRE 902(13)(14) means you don't
   need a foundation witness to admit blockchain evidence. The hash
   *is* the witness.
2. **C2PA is underused.** The Content Authenticity Initiative's standard
   for content credentials is perfect for patent disclosure manifests.
   We use COSE-based C2PA manifests with self-signed Ed25519 credentials.
3. **6 layers > 1 perfect layer.** The marginal cost of adding HMAC + Ed25519
   is ~50ms, and the robustness gain is enormous. Compromise resilience
   > theoretical purity.
4. **Disclosure is not a patent grant.** A blockchain timestamp proves you
   invented something at a point in time. It doesn't grant you offensive
   patent rights. Be very clear about this in your UX.
5. **The 22/33 BFT council is real.** For high-value disclosures, getting
   22 of 33 independent agents to agree on patentability is the strongest
   prior art validation available. This is a different category from
   "I think I invented this."

## What's next

We're working on the Phase 2 workflow (auto-detect novel patterns in
codebases, draft claims automatically, route through BFT council review,
and disclose — all in under 8 minutes from git commit).

The MCP server is at [mcp.openpatent.ai](https://mcp.openpatent.ai).
Install with:
```bash
npx -y @openpatent/mcp-server
```

Star the repo, try a $10 disclosure, and tell me what you'd build on top.
