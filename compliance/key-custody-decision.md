# Key custody decision — XRPL Ed25519 + EVM secp256k1

> Owner decision doc. Unblocks Stage 2+/mainnet publishers.
> Measurement body signing keys are production assets — not laptop `.env`.
> Compass: `wf-7af46a56` · Build plan: `docs/COUNCIL_OS_BUILD_PLAN.md`.

## Requirement

Automated (no HITL per signature) batch attestation publish for:

- **XRPL** — Ed25519 (default) and optionally secp256k1  
- **EVM / EAS** — secp256k1 ECDSA  

Both curves in one controllable system preferred.

## Chosen shortlist (pick one to provision)

| Option | Curves | Why |
|--------|--------|-----|
| **AWS KMS** | secp256k1 + **Ed25519 (EdDSA) since 7 Nov 2025** | FIPS, non-exportable, one cloud for both rails; digest signing + low-S for EVM |
| **Turnkey** | secp256k1 + Ed25519 | Policy engine, DENY-wins, agentic/server signing, published per-sig economics |
| Later sovereignty | **YubiHSM 2** (both curves) · **Coinbase cb-mpc** (MIT, ECDSA+EdDSA) | Hardware / self-hosted MPC |

**Avoid:** ZenGo (archived); Silence Labs without verifying non-commercial headers; Lit PKPs alone (secp256k1-focused — insufficient for XRPL Ed25519).

## Enforcement

Publishers (when landed) **must refuse `--publish`** unless custody is provisioned, e.g.:

```bash
CSOAI_KEY_CUSTODY=kms   # or turnkey | hsm
```

## Provenance

- Publish issuer key provenance via **did:web** (and optionally did:xrpl / did:ethr).  
- Full audit log of every signature attempt.  
- Policy: whitelist tx types / destinations; DENY-wins.  
- Shamir/Vault = **cold backup only** — never reconstruct on the hot path.

## Owner checklist

- [ ] Provision KMS keys (both curves) **or** Turnkey org + policy  
- [ ] Wire publisher env + deny-by-default without custody  
- [ ] Publish did:web document  
- [ ] Cold backup ceremony documented  

**Not legal advice. Not a substitute for securities counsel.**
