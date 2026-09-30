#!/usr/bin/env python3
"""Render the Hugging Face dataset card for csoai/cross-ledger-supply from the records themselves,
and stage the dataset tree (interop/... mirrors the site paths the records cite).

    cross_ledger_dataset_card.py --date 2026-09-25 --stage DIR
"""
import json, pathlib, shutil, sys

# The How-to-cite / corrections / verification block every public csoai/* card carries (lane L5, 28 Sep 2026)
# has ONE producer, scripts/hf/cite_block.py; the card below passes through it so a rebuild keeps the block.
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[1] / "hf"))
from cite_block import apply as cite_apply  # noqa: E402

HERE = pathlib.Path(__file__).resolve().parent
REPO = HERE.parents[1]
INTER = REPO / "public" / "interop"
ASSETS = ["usdc", "benji", "jpmd", "buidl", "citi-token-services", "hsbc-tokenised-deposit-service", "bny-digital-cash"]


def main(a):
    date = a[a.index("--date") + 1]
    stage = pathlib.Path(a[a.index("--stage") + 1])
    (stage / "interop").mkdir(parents=True, exist_ok=True)
    rows_md = []
    for asset in ASSETS:
        p = INTER / f"cross-ledger-{asset}-{date}.json"
        rec = json.loads(p.read_text())
        for f in (p, p.with_suffix(".signed.json"), p.with_name(p.name + ".ots"), p.with_suffix(".ots.json")):
            shutil.copy2(f, stage / "interop" / f.name)
        pdir = INTER / f"cross-ledger-{asset}-{date}"
        if pdir.is_dir():
            shutil.copytree(pdir, stage / "interop" / pdir.name, dirs_exist_ok=True)
        il = (rec.get("issuer_list_evidence") or {}).get("state")
        if rec["per_ledger"]:
            for r in rec["per_ledger"]:
                rows_md.append(f"| {rec['asset']} | {r.get('product', rec['asset'])} | {r['ledger']} | {r['supply_decimal']} | "
                               f"`{r['evidence_kind']}` | {r['two_operators_agree']} | {r['height']} |")
        else:
            rows_md.append(f"| {rec['asset']} | — | — | — | `{il}` | — | — |")
    for f in ("institutional-evidence-links.json", "institutional-evidence-links.signed.json",
              "institutional-evidence-links.json.ots", "institutional-evidence-links.ots.json"):
        shutil.copy2(INTER / f, stage / "interop" / f)
    shutil.copy2(HERE / "cross_ledger_assets.json", stage / "cross_ledger_assets.json")
    benji = json.loads((INTER / f"cross-ledger-benji-{date}.json").read_text())
    ir = benji["issuer_reported"][0]
    status = {}
    for asset in ASSETS:
        rec = json.loads((INTER / f"cross-ledger-{asset}-{date}.json").read_text())
        s = json.loads((INTER / f"cross-ledger-{asset}-{date}.signed.json").read_text())
        status[asset] = (rec["issuer_list_evidence"].get("state"), s["signature"]["signed_at"],
                         json.loads((INTER / f"cross-ledger-{asset}-{date}.ots.json").read_text())["state"])
    st_md = "\n".join(f"| {k} | `{v[0]}` | {v[1]} | {v[2]} |" for k, v in status.items())
    md = f"""---
license: cc-by-4.0
pretty_name: Cross-ledger supply (issuer-listed deployments, evidence-labelled)
tags: [tokenization, stablecoins, tokenized-funds, deposit-tokens, measurement, merkle-proofs]
---

# Cross-ledger supply — {date}

**Question.** For a token its issuer says lives on several ledgers: does each deployment the issuer
itself lists resolve as that token, and what supply (`totalSupply()` or the ledger's equivalent) does each
ledger's own state show?
Published by the Council of AI (CSOAI), an independent measurement layer. We measure; we never
certify. No institution named here is a client, partner or member of anything of ours.

## What it is NOT

An on-chain supply read is **not** AUM, NAV, ownership, redeemability, fund compliance, settlement
finality, reserves or backing. It is the ledger's `totalSupply()` (or equivalent) at a recorded height on one
ledger, which includes any tokens the issuer itself holds; it is not issued or circulating supply. It must
be reconciled against the controlling record (a fund's transfer-agent register, a bank's deposit
ledger); **no such reconciliation exists here**, and every record says so
(`reconciliation_state`, e.g. `UNRECONCILED_WITH_TRANSFER_AGENT`). An issuer's own figure is kept in a
separate `issuer_reported` block, never merged with measured supply — the issuer's statement is the
claim, not the evidence.

## Method

1. **Deployment list only from the issuer's own public page** (URL, fetched_at, sha256 of the bytes in
   each record). If no issuer-published list exists: `ISSUER_LIST_UNAVAILABLE`, nothing read
   (explorer/aggregator addresses are not issuer lists). If the issuer says the token lives on a
   private ledger: `PERMISSIONED_NOT_READABLE`, with the issuer's sentence.
2. Each deployment is read from its ledger's public endpoints. **EVM**: the `totalSupply` storage slot
   is found empirically over a declared candidate set (slots 0..64 + the OpenZeppelin ERC-7201 ERC20
   namespace), proven with `eth_getProof` and verified in the reader against the stateRoot of a block
   whose hash the reader recomputes from the header fields. **Stellar, Solana, Aptos, Sui, XRPL,
   Hedera**: operator APIs, with a second independent operator where a keyless one exists.
3. Identity: the on-ledger symbol / asset code / metadata symbol must equal the product ticker the
   issuer page names, else `REJECTED` and no supply is counted.
4. **Sums per product and per evidence kind only.** Products on one issuer page (BENJI, iBENJI,
   gBENJI, …) are different instruments and are never added.

## Evidence ladder

| kind | meaning |
|---|---|
| `STATE_PROOF_VERIFIED` | Merkle proof verified here against the stateRoot of a header whose hash was recomputed here; proven value == API value. Header not checked against consensus; an L2 header is not checked against L1. |
| `STATE_PROOF_RECORDED` | proof kept but not fully verified (failed, or the header hash could not be recomputed for that chain's header format); reason in the row |
| `OPERATOR_API` | one operator's answer; `two_operators_agree` records a second independent operator. Agreement is not a proof. |
| `UNCHECKABLE` | read failed; error kept. Never zero, never absent. |
| `REJECTED` | identity did not match; no supply counted |

## Reads

| record (issuer page) | product | ledger | supply (token units) | evidence | two operators agree | height |
|---|---|---|---|---|---|---|
{chr(10).join(rows_md)}

## Issuer-reported (kept apart)

BENJI's fund (Franklin OnChain U.S. Government Money Fund, series `{ir.get('series_id')}`) reports in its
SEC {ir.get('form')} for {ir.get('report_date')} (filed {ir.get('filing_date')}, accession `{ir.get('accession')}`):
net assets USD {ir.get('net_assets_of_series_usd')}, shares outstanding {ir.get('shares_outstanding')}; transfer
agent named in the filing: {ir.get('transfer_agent_named_in_filing')}. **Not compared** with the ledger reads:
different date, a share count is not a ledger supply, and no transfer-agent register is public.

## Records, signatures, timestamps

| asset | issuer list | signed_at (Ed25519, did:web:csoai.org#board-attestation-1) | OpenTimestamps |
|---|---|---|---|
{st_md}

The USDC record is the 2026-09-25 04:18Z pilot run, bytes unchanged; it was signed later the same day
(its internal "unsigned" status line describes the run, not the signature). `institutional-evidence-links.json`
maps the estate's institutional binding keys to these records, or to `UNMEASURED` with the reason.

Paths: a record's site path `/interop/X` is dataset path `interop/X`. `cross_ledger_assets.json` is the
asset registry (asset → issuer list → per-ledger adapter) the reader ran from.

## How to verify

**Signature.** In `X.signed.json`: serialise `payload` as JSON, keys sorted recursively, no whitespace,
UTF-8; its sha256 must equal `signature.payload_sha256`; `payload.artifact.sha256` must equal sha256 of
`X.json`. Verify `signature.sig_ed25519` (hex) with the `#board-attestation-1` Ed25519 key
(`publicKeyJwk.x`, base64url) in https://csoai.org/.well-known/did.json. Change one byte: it must fail.

```python
import json, hashlib, base64, urllib.request
from cryptography.hazmat.primitives.asymmetric import ed25519
s = json.load(open("interop/cross-ledger-benji-{date}.signed.json"))
c = json.dumps(s["payload"], sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode()
assert hashlib.sha256(c).hexdigest() == s["signature"]["payload_sha256"]
assert hashlib.sha256(open("interop/cross-ledger-benji-{date}.json", "rb").read()).hexdigest() == s["payload"]["artifact"]["sha256"]
did = json.load(urllib.request.urlopen("https://csoai.org/.well-known/did.json"))
x = [m for m in did["verificationMethod"] if m["id"].endswith("#board-attestation-1")][0]["publicKeyJwk"]["x"]
ed25519.Ed25519PublicKey.from_public_bytes(base64.urlsafe_b64decode(x + "==")).verify(bytes.fromhex(s["signature"]["sig_ed25519"]), c)
```

**Proofs.** Each `interop/cross-ledger-<asset>-{date}/<ledger>-<product>-proof.json` carries the header,
the `eth_getProof` response and `how_to_check`: keccak(rlp(header)) == block_hash; walk accountProof from
stateRoot along keccak(address); storageRoot == storageHash; walk storageProof along keccak(slot); leaf ==
rlp(totalSupply). No trust in us is needed for that step; trust in the header remains (no light client).

**Timestamp.** `ots upgrade X.json.ots` then `ots verify X.json.ots`. At publication each proof held pending
calendar attestations: a **pending calendar commitment, not a Bitcoin attestation**.

## Licence

CC-BY-4.0. Cite as: Council of AI (CSOAI), *Cross-ledger supply, issuer-listed deployments, {date}*,
csoai/cross-ledger-supply. Reader: `scripts/readers/cross_ledger_funds.py` (councilof-ai repository).
"""
    md = cite_apply(md, "csoai/cross-ledger-supply")
    (stage / "README.md").write_text(md)
    print(f"README {len(md)} chars; staged {sum(1 for _ in stage.rglob('*') if _.is_file())} files")


if __name__ == "__main__":
    main(sys.argv[1:])
