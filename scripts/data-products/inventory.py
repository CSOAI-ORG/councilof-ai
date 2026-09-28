#!/usr/bin/env python3
"""Inventory: which signed/timestamped record families served by councilof.ai have a discoverable csoai/*
Hugging Face dataset (lane data-products-20260928). Reads the canon tree at one ref and the public Hub API
(anonymous, read-only). Publishes nothing, signs nothing.

    python3 inventory.py --git /workspace/staging/mirror/councilof-ai.git --ref 982fe3f6d --out INVENTORY.json

A family is "covered" when a csoai dataset other than an estate-wide index or mirror carries a file (or has a
name) matching the family pattern. Index/mirror datasets are reported separately, never counted as coverage.
"""
import argparse, json, re, subprocess, time, urllib.request

UA = {"User-Agent": "csoai-data-products-lane/0.1 (+https://councilof.ai/contact)"}
INDEXES = {"csoai/trust-chain-freshness", "csoai/evidence-index", "csoai/gspc-estate",
           "csoai/unified-evidence-factory-2026-09-19", "csoai/councilof-ai-evidence", "csoai/gspc-hf-estate-index"}
FAMILIES = {
 "x402 door census": r"x402-door-census", "x402 door conformance": r"x402-door-conformance",
 "x402 census cards": r"x402-census-cards", "x402 trust": r"x402-trust", "x402 facilitator": r"x402-facilitator",
 "x402 activity": r"x402-activity", "door demand (payai)": r"door-demand-payai",
 "MCP contract parity": r"contract[_-]parity|mcp-contract-parity",
 "stablecoin deep": r"stablecoin-deep", "stablecoin universe": r"stablecoin-universe",
 "stablecoin on-chain supply": r"stablecoin-onchain-supply", "stablecoin solana supply": r"stablecoin-solana-supply",
 "stablecoins extended": r"stablecoins-extended", "stablecoin corpus index": r"stablecoin-corpus-index",
 "stablecoin attestation": r"stablecoin-attestation", "wrapped-asset parity": r"wrapped-asset-parity",
 "cross-ledger supply": r"cross-ledger-", "benji on-chain supply": r"benji-onchain-supply",
 "effect-binding server probe": r"effect-binding", "COBOL measure/evidence": r"cobol-(measure|evidence)",
 "xrpl impersonation": r"xrpl-impersonation", "xrpl 16 state matrix": r"xrpl-16-state-matrix", "xrpl toml gap": r"xrpl-toml-gap",
 "MCP remote census": r"mcp-remote-census", "MCP registry snapshots": r"mcp-registry-20|mcp-registry-latest",
 "MCP registry self-listings": r"mcp-registry-self-listings", "MCP publisher concentration": r"x1-mcp-publisher-concentration",
 "MCP trust": r"mcp-trust", "MCP liveness": r"mcp-liveness", "MCP security scorecard": r"mcp-security-scorecard",
 "MCP CVE advisory": r"mcp-cve-advisory", "A2A card census": r"a2a-card-census", "A2A directories": r"a2a-directories",
 "HF MCP spaces census": r"hf-mcp-spaces-census", "HF census": r"hf-census|hf-(models|datasets|spaces)-census",
 "SWIFT census": r"swift-census", "RWA reconciliation": r"rwa-reconciliation", "axis doors": r"axis-doors-20",
 "instrument controls census": r"instrument-controls-census", "instrument guard (bank commitments)": r"instrument-guard/|bank-commitments",
 "institutional evidence links": r"institutional-evidence-links",
 "OFAC SDN census": r"ofac-sdn-census", "GDPR fine census": r"gdpr-fine-census", "ICO enforcement census": r"ico-enforcement-census",
 "regulator census": r"regulator-census", "GPAI signatories": r"gpai-signator", "Art.50 census": r"art50-census",
 "verifiability census": r"verifiability-census", "corrections that did not travel": r"corrections-that-did-not-travel",
 "state report numbers": r"state/2026-09/numbers|numbers\.signed", "measurement capsules": r"measurement-capsules|v0\.2/index",
 "disclosure lag (other lane)": r"disclosure-lag", "ERC-8004 callable": r"erc8004-callable",
}


def get(url):
    return urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=90)


def hub_trees():
    ids = [x["id"] for x in json.load(get("https://huggingface.co/api/datasets?author=csoai&limit=1000"))]
    trees = {}
    for d in ids:
        files, url = [], f"https://huggingface.co/api/datasets/{d}/tree/main?recursive=true"
        while url:
            r = get(url)
            files += [x["path"] for x in json.load(r) if x["type"] == "file"]
            link = r.headers.get("Link", "")
            url = link.split(";")[0].strip("<>") if 'rel="next"' in link else None
        trees[d] = files
        time.sleep(0.3)
    return trees


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--git", required=True)
    ap.add_argument("--ref", required=True)
    ap.add_argument("--out", required=True)
    ap.add_argument("--trees", help="cached Hub trees JSON (optional)")
    a = ap.parse_args()
    paths = subprocess.run(["git", "--git-dir", a.git, "ls-tree", "-r", "--name-only", a.ref, "public/interop",
                            "public/measurements", "public/state", "public/measurement-capsules", "public/signals",
                            "public/signed"], capture_output=True, text=True, check=True).stdout.split()
    trees = json.load(open(a.trees)) if a.trees else hub_trees()
    rows = []
    for name, pat in FAMILIES.items():
        src = [p for p in paths if re.search(pat, p)]
        prod = sorted(d for d, f in trees.items() if d not in INDEXES
                      and (re.search(pat, d.split("/")[1]) or any(re.search(pat, x) for x in f)))
        idx = sorted(d for d, f in trees.items() if d in INDEXES and any(re.search(pat, x) for x in f))
        rows.append({"family": name, "pattern": pat, "site_files": len(src),
                     "board_signed_files": sum(p.endswith(".signed.json") for p in src),
                     "ots_files": sum(p.endswith(".ots") for p in src),
                     "product_datasets": prod, "index_or_mirror_only": idx, "gap": not prod})
    out = {"canon_ref": a.ref, "hub_datasets_read": len(trees),
           "as_of": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()), "families": rows,
           "gaps": [r["family"] for r in rows if r["gap"]]}
    json.dump(out, open(a.out, "w"), indent=1)
    print(len(rows), "families;", len(out["gaps"]), "without a product dataset")


if __name__ == "__main__":
    main()
