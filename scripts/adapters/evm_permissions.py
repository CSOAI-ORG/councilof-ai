"""EVM permission-state reader — tokenised RWAs on public EVM chains, hourly.

What this is: an on-chain measurement of the PERMISSION STATE of the largest
tokenised real-world-asset tokens (by rwa.xyz market cap, 2 Sep 2026) as
answered by keyless PUBLIC JSON-RPC endpoints at one block per chain per run.
Each (token, chain) becomes one ≤3KB `public.notice` leaf of schema
`csoai.evm.permission-state/0.1`, signed by the public-root writer in GHA and
folded under the ONE root (public/root.json) that Rekor/OTS witness. Over hours
that is a signed, inclusion-proven history of the flags — the provable archive.

What this is NOT: not a rate, not a grade, not an opinion on any asset, not a
continuous series anyone may wire into an instrument. Outputs are discrete and
point-in-time (block N). Vocabulary rule (binding): descriptive words only,
never a judgement word about an asset (the banned list is gated by
scripts/provable-archive-vocab.test.ts); never MEASURED on a leaf.

Facts that bind the roster: BUIDL is Securitize on Ethereum + other EVMs (not
XRPL). BENJI/FOBXX is Stellar-primary + EVMs (not XRPL). USDY/OUSG are Ondo on
Ethereum + others (only a sliver of USDY/OUSG on XRPL). Non-EVM chains
(Stellar, Solana, Aptos, XRPL, Canton, Sui, Noble) are out of scope here.

Every address in ROSTER was verified by bytes on 2026-09-02: `name()` and
`symbol()` answered from the named chain's public RPC with the expected
product name. Rows in UNVERIFIED are named but never read — the address could
not be confirmed from an official page or an explorer with a full 0x string.

Proof (the strongest form): beside the eth_call reads, one eth_getProof
(EIP-1186) per (token, chain) at the same block N returns a Merkle-Patricia
proof of the account (nonce, balance, codeHash, storageHash) and of the two
EIP-1967 proxy slots against the block's stateRoot. The leaf carries the block
HASH, the proof's sha256 and its summary; the full proof bytes are written by
the publisher to public/archive/proofs/eip1186/<sha16>.json. A stranger fetches
the header for that block hash from ANY node, checks header.stateRoot against
the account proof, and never has to trust this writer. Getter values
(paused(), owner(), ...) are NOT individually slot-proven unless the storage
layout is listed in KNOWN_SLOTS — the storageHash commits the whole storage,
and the leaf says exactly which slots were proven.

Design: never raises. RPC dark → that (token, chain) is simply absent this hour
(empty leaves, sidecar says so). One batched JSON-RPC POST + one eth_getProof
per (token, chain), one block fetch per chain, ~0.15s spacing: ~70 requests per
run across all endpoints — no hammering. Fixtures: set
EVM_PERMISSIONS_FIXTURE_DIR to replay recorded responses (tests);
EVM_PERMISSIONS_RECORD_DIR to record live ones; EVM_PERMISSIONS_ONLY=SYM,SYM
narrows the roster (recording, ops).
"""
from __future__ import annotations

import hashlib
import json
import os
import re
import time
import urllib.error
import urllib.request
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Callable

SCHEMA = "csoai.evm.permission-state/0.1"
SURFACE = "public.notice"
PAYLOAD_CAP = 3072
UA = "csoai-public-root-writer/0 (+https://councilof.ai/root.json)"
AUM_SOURCE = "https://app.rwa.xyz/treasuries"
AUM_AS_OF = "2026-09-02"
METHOD_URL = "https://github.com/CSOAI-ORG/councilof-ai/blob/master/docs/PROVABLE-ARCHIVE-METHOD.md"
REQUEST_SPACING_S = 0.15

# Public, keyless endpoints. Order = preference; the first that answers is
# recorded on the leaf as `rpc`. No API keys, ever.
CHAINS: dict[str, dict[str, Any]] = {
    "ethereum": {
        "chain_id": 1,
        "rpcs": [
            "https://ethereum-rpc.publicnode.com",
            "https://eth.llamarpc.com",
            "https://cloudflare-eth.com",
            "https://1rpc.io/eth",
            "https://eth.drpc.org",
        ],
    },
    "arbitrum": {
        "chain_id": 42161,
        "rpcs": [
            "https://arbitrum-one-rpc.publicnode.com",
            "https://arb1.arbitrum.io/rpc",
            "https://1rpc.io/arb",
        ],
    },
    "optimism": {
        "chain_id": 10,
        "rpcs": [
            "https://optimism-rpc.publicnode.com",
            "https://mainnet.optimism.io",
            "https://1rpc.io/op",
        ],
    },
    "polygon": {
        "chain_id": 137,
        "rpcs": [
            "https://polygon-bor-rpc.publicnode.com",
            "https://polygon-rpc.com",
            "https://1rpc.io/matic",
        ],
    },
    "base": {
        "chain_id": 8453,
        "rpcs": [
            "https://base-rpc.publicnode.com",
            "https://mainnet.base.org",
            "https://1rpc.io/base",
        ],
    },
    "bsc": {
        "chain_id": 56,
        "rpcs": [
            "https://bsc-rpc.publicnode.com",
            "https://bsc-dataseed.bnbchain.org",
            "https://1rpc.io/bnb",
        ],
    },
    "avalanche": {
        "chain_id": 43114,
        "rpcs": [
            "https://api.avax.network/ext/bc/C/rpc",
            "https://avalanche-c-chain-rpc.publicnode.com",
            "https://1rpc.io/avax/c",
        ],
    },
    "mantle": {
        "chain_id": 5000,
        "rpcs": [
            "https://mantle-rpc.publicnode.com",
            "https://rpc.mantle.xyz",
        ],
    },
}

# Roster: top tokenised treasuries / MMFs by rwa.xyz market cap (2 Sep 2026)
# plus the named comparators from the owner brief (USCC, bIB01, ACRED). Only
# EVM chains with a VERIFIED full address are read. `aum_usd` is the rwa.xyz
# figure on AUM_AS_OF — a citation, never an on-chain fact; it is NOT written
# onto leaves. `source` is where the address was taken from; `verified` is the
# RPC name()/symbol() check by bytes.
ROSTER: list[dict[str, Any]] = [
    # 1. BlackRock BUIDL (Securitize) — Ethereum + EVMs. Not XRPL.
    {"symbol": "BUIDL", "chain": "ethereum", "address": "0x7712c34205737192402172409a8f7ccef8aa2aec",
     "product": "BlackRock USD Institutional Digital Liquidity Fund", "issuer": "BlackRock / Securitize",
     "aum_rank": 1, "aum_usd": 2722751418, "source": "https://etherscan.io/token/0x7712c34205737192402172409a8f7ccef8aa2aec",
     "verified": "rpc name()/symbol() 2026-09-02"},
    {"symbol": "BUIDL-I", "chain": "ethereum", "address": "0x6a9DA2D710BB9B700acde7Cb81F10F1fF8C89041",
     "product": "BlackRock USD Institutional Digital Liquidity Fund - I Class", "issuer": "BlackRock / Securitize",
     "aum_rank": 1, "aum_usd": None, "source": "https://etherscan.io/token/0x6a9DA2D710BB9B700acde7Cb81F10F1fF8C89041",
     "verified": "rpc name()/symbol() 2026-09-02"},
    {"symbol": "BUIDL", "chain": "arbitrum", "address": "0xa6525ae43edcd03dc08e775774dcabd3bb925872",
     "product": "BlackRock USD Institutional Digital Liquidity Fund", "issuer": "BlackRock / Securitize",
     "aum_rank": 1, "aum_usd": None, "source": "https://arbiscan.io/token/0xa6525ae43edcd03dc08e775774dcabd3bb925872",
     "verified": "rpc name()/symbol() 2026-09-02"},
    {"symbol": "BUIDL", "chain": "optimism", "address": "0xa1cdab15bba75a80df4089cafba013e376957cf5",
     "product": "BlackRock USD Institutional Digital Liquidity Fund", "issuer": "BlackRock / Securitize",
     "aum_rank": 1, "aum_usd": None, "source": "https://optimistic.etherscan.io/token/0xa1cdab15bba75a80df4089cafba013e376957cf5",
     "verified": "rpc name()/symbol() 2026-09-02"},
    {"symbol": "BUIDL", "chain": "polygon", "address": "0x2893ef551b6dd69f661ac00f11d93e5dc5dc0e99",
     "product": "BlackRock USD Institutional Digital Liquidity Fund", "issuer": "BlackRock / Securitize",
     "aum_rank": 1, "aum_usd": None, "source": "https://polygonscan.com/address/0x2893ef551b6dd69f661ac00f11d93e5dc5dc0e99",
     "verified": "rpc name()/symbol() 2026-09-02"},
    # 2. Circle / Hashnote USYC
    {"symbol": "USYC", "chain": "ethereum", "address": "0x136471a34f6ef19fE571EFFC1CA711fdb8E49f2b",
     "product": "US Yield Coin", "issuer": "Circle (Hashnote)", "aum_rank": 2, "aum_usd": 2706406813,
     "source": "https://usyc.docs.hashnote.com/overview/smart-contracts", "verified": "rpc name()/symbol() 2026-09-02"},
    {"symbol": "USYC", "chain": "bsc", "address": "0x8D0fA28f221eB5735BC71d3a0Da67EE5bC821311",
     "product": "US Yield Coin", "issuer": "Circle (Hashnote)", "aum_rank": 2, "aum_usd": None,
     "source": "https://usyc.docs.hashnote.com/overview/smart-contracts", "verified": "rpc name()/symbol() 2026-09-02"},
    # 3. Ondo USDY — Ethereum + others; XRPL holds only a sliver (read by the XRPL adapter, not here).
    {"symbol": "USDY", "chain": "ethereum", "address": "0x96F6eF951840721AdBF46Ac996b59E0235CB985C",
     "product": "Ondo U.S. Dollar Yield", "issuer": "Ondo", "aum_rank": 3, "aum_usd": 2189032755,
     "source": "https://etherscan.io/address/0x96f6ef951840721adbf46ac996b59e0235cb985c", "verified": "rpc name()/symbol() 2026-09-02"},
    {"symbol": "USDY", "chain": "mantle", "address": "0x5bE26527e817998A7206475496fDE1E68957c5A6",
     "product": "Ondo U.S. Dollar Yield", "issuer": "Ondo", "aum_rank": 3, "aum_usd": None,
     "source": "https://docs.ondo.finance/developer-guides/mantle-integration-guidelines", "verified": "rpc name()/symbol() 2026-09-02"},
    {"symbol": "USDY", "chain": "arbitrum", "address": "0x35e050d3C0eC2d29D269a8EcEa763a183bDF9A9D",
     "product": "Ondo U.S. Dollar Yield", "issuer": "Ondo", "aum_rank": 3, "aum_usd": None,
     "source": "https://arbiscan.io/token/0x35e050d3C0eC2d29D269a8EcEa763a183bDF9A9D", "verified": "rpc name()/symbol() 2026-09-02"},
    # 5. WisdomTree WTGXX
    {"symbol": "WTGXX", "chain": "ethereum", "address": "0x1feCF3d9d4Fee7f2c02917A66028a48C6706c179",
     "product": "WisdomTree Government Money Market Digital Fund", "issuer": "WisdomTree", "aum_rank": 5, "aum_usd": 1220658594,
     "source": "https://etherscan.io/address/0x1fecf3d9d4fee7f2c02917a66028a48c6706c179", "verified": "rpc name()/symbol() 2026-09-02"},
    # 6. Janus Henderson JTRSY (Centrifuge)
    {"symbol": "JTRSY", "chain": "ethereum", "address": "0x8c213ee79581Ff4984583C6a801e5263418C4b86",
     "product": "Janus Henderson Treasury Fund", "issuer": "Janus Henderson / Centrifuge", "aum_rank": 6, "aum_usd": 856585272,
     "source": "https://etherscan.io/token/0x8c213ee79581ff4984583c6a801e5263418c4b86", "verified": "rpc name()/symbol() 2026-09-02"},
    # 8. Franklin Templeton BENJI (FOBXX) — Stellar-primary; EVM share tokens. Not XRPL.
    {"symbol": "BENJI", "chain": "ethereum", "address": "0x3DDc84940Ab509C11B20B76B466933f40b750dc9",
     "product": "Franklin OnChain U.S. Government Money Fund", "issuer": "Franklin Templeton", "aum_rank": 8, "aum_usd": 689461584,
     "source": "https://etherscan.io/token/0x3ddc84940ab509c11b20b76b466933f40b750dc9", "verified": "rpc name()/symbol() 2026-09-02"},
    {"symbol": "BENJI", "chain": "arbitrum", "address": "0xB9e4765BCE2609bC1949592059B17Ea72fEe6C6A",
     "product": "Franklin OnChain U.S. Government Money Fund", "issuer": "Franklin Templeton", "aum_rank": 8, "aum_usd": None,
     "source": "https://arbiscan.io/token/0xB9e4765BCE2609bC1949592059B17Ea72fEe6C6A", "verified": "rpc name()/symbol() 2026-09-02"},
    # 9. Superstate USTB (Invesco-managed since 2026; same contract)
    {"symbol": "USTB", "chain": "ethereum", "address": "0x43415eB6ff9DB7E26A15b704e7A3eDCe97d31C4e",
     "product": "Invesco Short Duration US Government Securities Fund", "issuer": "Superstate / Invesco", "aum_rank": 9, "aum_usd": 650117377,
     "source": "https://docs.superstate.com/investors/smart-contracts", "verified": "rpc name()/symbol() 2026-09-02"},
    # 11. Ondo OUSG
    {"symbol": "OUSG", "chain": "ethereum", "address": "0x1B19C19393e2d034D8Ff31ff34c81252FcBbee92",
     "product": "Ondo Short-Term U.S. Government Bond Fund", "issuer": "Ondo", "aum_rank": 11, "aum_usd": 408754679,
     "source": "https://etherscan.io/address/0x1b19c19393e2d034d8ff31ff34c81252fcbbee92", "verified": "rpc name()/symbol() 2026-09-02"},
    # 12. OpenEden TBILL
    {"symbol": "TBILL", "chain": "ethereum", "address": "0xdd50C053C096CB04A3e3362E2b622529EC5f2e8a",
     "product": "OpenEden T-Bills", "issuer": "OpenEden", "aum_rank": 12, "aum_usd": 246783525,
     "source": "https://docs.openeden.com/tbill/smart-contract-addresses", "verified": "rpc name()/symbol() 2026-09-02"},
    {"symbol": "TBILL", "chain": "bsc", "address": "0x5b4681F0d7A01B817675F25892D3Ad73572FD1D9",
     "product": "OpenEden T-Bills", "issuer": "OpenEden", "aum_rank": 12, "aum_usd": None,
     "source": "https://docs.openeden.com/tbill/smart-contract-addresses", "verified": "rpc name()/symbol() 2026-09-02"},
    {"symbol": "TBILL", "chain": "arbitrum", "address": "0xF84D28A8D28292842dD73D1c5F99476A80b6666A",
     "product": "OpenEden T-Bills", "issuer": "OpenEden", "aum_rank": 12, "aum_usd": None,
     "source": "https://docs.openeden.com/tbill/smart-contract-addresses", "verified": "rpc name()/symbol() 2026-09-02"},
    # 13. Spiko USTBL
    {"symbol": "USTBL", "chain": "ethereum", "address": "0xe4880249745eAc5F1eD9d8F7DF844792D560e750",
     "product": "Spiko US T-Bills Money Market Fund", "issuer": "Spiko", "aum_rank": 13, "aum_usd": 168996512,
     "source": "https://etherscan.io/token/0xe4880249745eac5f1ed9d8f7df844792d560e750", "verified": "rpc name()/symbol() 2026-09-02"},
    {"symbol": "USTBL", "chain": "arbitrum", "address": "0x021289588cd81dC1AC87ea91e91607eEF68303F5",
     "product": "Spiko US T-Bills Money Market Fund", "issuer": "Spiko", "aum_rank": 13, "aum_usd": None,
     "source": "https://arbiscan.io/token/0x021289588cd81dC1AC87ea91e91607eEF68303F5", "verified": "rpc name()/symbol() 2026-09-02"},
    # 16. J.P. Morgan MONY (Kinexys)
    {"symbol": "MONY", "chain": "ethereum", "address": "0x6a7c6aa2b8b8a6A891dE552bDEFFa87c3F53bD46",
     "product": "My OnChain Net Yield Fund", "issuer": "J.P. Morgan Asset Management (Kinexys)", "aum_rank": 16, "aum_usd": 102528026,
     "source": "https://am.jpmorgan.com/us/en/asset-management/adv/about-us/media/press-releases/jp-morgan-asset-management-launches-second-tokenized-fund-on-ethereum/",
     "verified": "rpc name()/symbol() 2026-09-02"},
    # 17. Midas mTBILL
    {"symbol": "mTBILL", "chain": "ethereum", "address": "0xDD629E5241CbC5919847783e6C96B2De4754e438",
     "product": "Midas US Treasury Bill Token", "issuer": "Midas", "aum_rank": 17, "aum_usd": 71153207,
     "source": "https://etherscan.io/token/0xDD629E5241CbC5919847783e6C96B2De4754e438", "verified": "rpc name()/symbol() 2026-09-02"},
    {"symbol": "mTBILL", "chain": "base", "address": "0xDD629E5241CbC5919847783e6C96B2De4754e438",
     "product": "Midas US Treasury Bill Token", "issuer": "Midas", "aum_rank": 17, "aum_usd": None,
     "source": "https://etherscan.io/token/0xDD629E5241CbC5919847783e6C96B2De4754e438", "verified": "rpc name()/symbol() 2026-09-02"},
    # 20. VanEck VBILL (Securitize)
    {"symbol": "VBILL", "chain": "ethereum", "address": "0x2255718832bc9fd3be1caf75084f4803da14ff01",
     "product": "VanEck Treasury Fund", "issuer": "VanEck / Securitize", "aum_rank": 20, "aum_usd": 56551777,
     "source": "https://etherscan.io/token/0x2255718832bc9fd3be1caf75084f4803da14ff01", "verified": "rpc name()/symbol() 2026-09-02"},
    {"symbol": "VBILL", "chain": "bsc", "address": "0x14d72634328c4d03bba184a48081df65f1911279",
     "product": "VanEck Treasury Fund", "issuer": "VanEck / Securitize", "aum_rank": 20, "aum_usd": None,
     "source": "https://bscscan.com/token/0x14d72634328c4d03bba184a48081df65f1911279", "verified": "rpc name()/symbol() 2026-09-02"},
    # Comparators named in the owner brief (outside the rwa.xyz top-20 on 2 Sep 2026).
    {"symbol": "USCC", "chain": "ethereum", "address": "0x14d60E7FDC0D71d8611742720E4C50E7a974020c",
     "product": "Bitwise Crypto Carry Fund (formerly Superstate USCC)", "issuer": "Superstate / Bitwise", "aum_rank": None, "aum_usd": None,
     "source": "https://docs.superstate.com/investors/smart-contracts", "verified": "rpc name()/symbol() 2026-09-02"},
    {"symbol": "bIB01", "chain": "ethereum", "address": "0xCA30c93B02514f86d5C86a6e375E3A330B435Fb5",
     "product": "Backed IB01 $ Treasury Bond 0-1yr", "issuer": "Backed Finance", "aum_rank": None, "aum_usd": None,
     "source": "https://etherscan.io/token/0xca30c93b02514f86d5c86a6e375e3a330b435fb5", "verified": "rpc name()/symbol() 2026-09-02"},
    {"symbol": "bIB01", "chain": "arbitrum", "address": "0xCA30c93B02514f86d5C86a6e375E3A330B435Fb5",
     "product": "Backed IB01 $ Treasury Bond 0-1yr", "issuer": "Backed Finance", "aum_rank": None, "aum_usd": None,
     "source": "https://arbiscan.io/token/0xca30c93b02514f86d5c86a6e375e3a330b435fb5", "verified": "rpc name()/symbol() 2026-09-02"},
    {"symbol": "bIB01", "chain": "base", "address": "0xCA30c93B02514f86d5C86a6e375E3A330B435Fb5",
     "product": "Backed IB01 $ Treasury Bond 0-1yr", "issuer": "Backed Finance", "aum_rank": None, "aum_usd": None,
     "source": "https://basescan.org/token/0xca30c93b02514f86d5c86a6e375e3a330b435fb5", "verified": "rpc name()/symbol() 2026-09-02"},
    {"symbol": "bIB01", "chain": "avalanche", "address": "0xCA30c93B02514f86d5C86a6e375E3A330B435Fb5",
     "product": "Backed IB01 $ Treasury Bond 0-1yr", "issuer": "Backed Finance", "aum_rank": None, "aum_usd": None,
     "source": "https://snowscan.xyz/token/0xca30c93b02514f86d5c86a6e375e3a330b435fb5", "verified": "rpc name()/symbol() 2026-09-02"},
    {"symbol": "ACRED", "chain": "ethereum", "address": "0x17418038ecF73BA4026c4f428547BF099706F27B",
     "product": "Apollo Diversified Credit Securitize Fund", "issuer": "Apollo / Securitize", "aum_rank": None, "aum_usd": None,
     "source": "https://etherscan.io/token/0x17418038ecF73BA4026c4f428547BF099706F27B", "verified": "rpc name()/symbol() 2026-09-02"},
]

# Named, never read. A full 0x address could not be confirmed from an official
# page or an explorer on 2026-09-02, or the chain has no keyless public RPC in
# CHAINS. Listed so the gap is visible, not silent.
UNVERIFIED: list[dict[str, Any]] = [
    {"symbol": "BUIDL", "chain": "avalanche", "reason": "address not confirmed (no full 0x on an official page/explorer)"},
    {"symbol": "BUIDL", "chain": "bsc", "reason": "address not confirmed"},
    {"symbol": "BUIDL", "chain": "tempo", "reason": "chain not in CHAINS (no keyless public RPC listed)"},
    {"symbol": "USYC", "chain": "canton", "reason": "not EVM"},
    {"symbol": "USDY", "chain": "bsc", "reason": "address not confirmed"},
    {"symbol": "USDY", "chain": "plume", "reason": "chain not in CHAINS"},
    {"symbol": "USDY", "chain": "sei", "reason": "chain not in CHAINS"},
    {"symbol": "iBENJI", "chain": "ethereum", "reason": "rwa.xyz rank 4; address not found on an official page/explorer"},
    {"symbol": "iBENJI", "chain": "bsc", "reason": "address not found"},
    {"symbol": "WTGXX", "chain": "arbitrum", "reason": "address not confirmed"},
    {"symbol": "WTGXX", "chain": "avalanche", "reason": "address not confirmed"},
    {"symbol": "WTGXX", "chain": "base", "reason": "address not confirmed"},
    {"symbol": "WTGXX", "chain": "optimism", "reason": "address not confirmed"},
    {"symbol": "JTRSY", "chain": "arbitrum", "reason": "address not confirmed"},
    {"symbol": "JTRSY", "chain": "base", "reason": "address not confirmed"},
    {"symbol": "JTRSY", "chain": "bsc", "reason": "address not confirmed"},
    {"symbol": "JTRSY", "chain": "avalanche", "reason": "address not confirmed"},
    {"symbol": "JTRSY", "chain": "monad", "reason": "chain not in CHAINS"},
    {"symbol": "JTRSY", "chain": "plume", "reason": "chain not in CHAINS"},
    {"symbol": "JPM OnChain Liquidity-Token MMF", "chain": "ethereum", "reason": "rwa.xyz rank 7; address not found on an official page/explorer"},
    {"symbol": "BENJI", "chain": "polygon", "reason": "only a truncated address (0x408a634b…) was found; not read"},
    {"symbol": "BENJI", "chain": "base", "reason": "only a truncated address (0x60cfc2b1…) was found; not read"},
    {"symbol": "BENJI", "chain": "avalanche", "reason": "address not confirmed"},
    {"symbol": "BENJI", "chain": "bsc", "reason": "only a truncated address (0x3d0a2a3a…) was found; not read"},
    {"symbol": "USTB", "chain": "plume", "reason": "chain not in CHAINS (docs list 0xe4fa682f94610ccd170680cc3b045d77d9e528a8)"},
    {"symbol": "ChinaAMC USD Digital MMF (Libeara)", "chain": "ethereum", "reason": "rwa.xyz rank 10; address not found"},
    {"symbol": "OUSG", "chain": "polygon", "reason": "address not confirmed"},
    {"symbol": "USTBL", "chain": "polygon", "reason": "address not confirmed"},
    {"symbol": "USTBL", "chain": "base", "reason": "address not confirmed"},
    {"symbol": "Bosera Digital Liquidity Income Fund (Libeara)", "chain": "ethereum", "reason": "rwa.xyz rank 15; address not found"},
    {"symbol": "Theo Short Duration US Treasury Fund", "chain": "ethereum", "reason": "rwa.xyz rank 18; address not found"},
    {"symbol": "VBILL", "chain": "avalanche", "reason": "address not confirmed"},
    {"symbol": "BlackRock Daily Reinvestment Stablecoin Reserve Vehicle", "chain": "ethereum", "reason": "rwa.xyz rank 21; address not found"},
]

# Generic getter probes. Each is one eth_call at the pinned block. A selector
# that answers goes under `checked` (decoded); one that reverts or returns 0x
# goes under `absent` — meaning "did not answer at block N", nothing more.
# Selectors are keccak256(signature)[:4]; the signature is kept beside each.
# Contract families they cover (documented, not guessed):
#   ERC-20 metadata            name() symbol() decimals() totalSupply()
#   OpenZeppelin Pausable      paused()
#   Securitize DSToken         isPaused()            (BUIDL, BUIDL-I, VBILL, ACRED)
#   OZ Ownable                 owner()
#   OZ AccessControl(Enumerable) DEFAULT_ADMIN_ROLE(), getRoleMemberCount(bytes32)
#   Ondo USDY / OUSG           blocklist() allowlist() sanctionsList()
#   Superstate USTB/USCC       allowList() allowListV2()
#   Midas mTBILL               accessControl()
#   Centrifuge tranche (JTRSY) hook()
#   OpenEden TBILL             kycManager()
#   Backed bIB01               pauser() terms()
#   EIP-1967 proxy slots       (eth_getStorageAt, not a selector)
PROBES: list[tuple[str, str, str, str]] = [
    ("name", "name()", "0x06fdde03", "string"),
    ("symbol", "symbol()", "0x95d89b41", "string"),
    ("decimals", "decimals()", "0x313ce567", "uint"),
    ("totalSupply", "totalSupply()", "0x18160ddd", "uint"),
    ("paused", "paused()", "0x5c975abb", "bool"),
    ("isPaused", "isPaused()", "0xb187bd26", "bool"),
    ("owner", "owner()", "0x8da5cb5b", "address"),
    ("defaultAdminRoleMembers", "getRoleMemberCount(bytes32=0x00)", "0xca15c873" + "00" * 32, "uint"),
    ("blocklist", "blocklist()", "0xd64e5396", "address"),
    ("allowlist", "allowlist()", "0x2b47da52", "address"),
    ("sanctionsList", "sanctionsList()", "0xec571c6a", "address"),
    ("allowList", "allowList()", "0x87b9d25c", "address"),
    ("allowListV2", "allowListV2()", "0x78048253", "address"),
    ("accessControl", "accessControl()", "0x13007d55", "address"),
    ("hook", "hook()", "0x7f5a7c7b", "address"),
    ("kycManager", "kycManager()", "0x7afea44f", "address"),
    ("pauser", "pauser()", "0x9fd0506d", "address"),
    ("terms", "terms()", "0xd5025625", "string"),
]
EIP1967_IMPL = "0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc"
EIP1967_ADMIN = "0xb53127684a568b3173ae13b9f8a6016e243e63b6e8ee1178d6a717850b5d6103"
PROOF_KIND = "csoai.eip1186-proof/0.1"
PROOF_URL_PREFIX = "/archive/proofs/eip1186/"

# Storage slots proven by eth_getProof beside the two EIP-1967 slots. Keyed by
# (symbol, chain). A slot is listed only when the contract's storage layout is
# published (verified source, documented layout) — otherwise the getter value is
# read but NOT slot-proven and the leaf says so. Empty on 2026-09-02: no roster
# contract has a layout confirmed from an official source yet.
KNOWN_SLOTS: dict[tuple[str, str], list[dict[str, str]]] = {}

# Things a public RPC cannot answer; stated on every leaf so nobody reads
# "checked" as "everything".
ALWAYS_UNMEASURED = [
    "allowlist/blocklist membership of any holder address",
    "off-chain transfer-agent or KYC registry contents",
    "issuer NAV, AUM and share-class terms (not on-chain)",
    "source verification of bytecode against a published repository",
]

Transport = Callable[[str, list[dict[str, Any]]], list[dict[str, Any]] | None]


def canonical_bytes(obj: Any) -> bytes:
    return json.dumps(obj, sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode("utf-8")


def _fixture_key(url: str, batch: list[dict[str, Any]]) -> str:
    host = re.sub(r"[^a-z0-9.-]+", "_", url.split("//", 1)[-1].lower())
    return host + "-" + hashlib.sha256(canonical_bytes(batch)).hexdigest()[:16] + ".json"


def http_transport(record_dir: str | None = None) -> Transport:
    """POST a JSON-RPC batch. Returns the list of responses or None (endpoint dark)."""

    def send(url: str, batch: list[dict[str, Any]]) -> list[dict[str, Any]] | None:
        body = json.dumps(batch, separators=(",", ":")).encode("utf-8")
        req = urllib.request.Request(
            url, data=body, method="POST",
            headers={"Content-Type": "application/json", "Accept": "application/json", "User-Agent": UA},
        )
        try:
            with urllib.request.urlopen(req, timeout=25) as resp:
                raw = resp.read()
            out = json.loads(raw.decode("utf-8"))
        except Exception:
            return None
        if not isinstance(out, list) or len(out) != len(batch):
            return None
        if record_dir:
            p = Path(record_dir)
            p.mkdir(parents=True, exist_ok=True)
            (p / _fixture_key(url, batch)).write_text(
                json.dumps({"url": url, "request": batch, "response": out}, indent=1, sort_keys=True) + "\n",
                encoding="utf-8",
            )
        return out

    return send


def replay_transport(fixture_dir: str) -> Transport:
    """Answer from recorded fixtures only; anything unrecorded is dark (None)."""

    def send(url: str, batch: list[dict[str, Any]]) -> list[dict[str, Any]] | None:
        p = Path(fixture_dir) / _fixture_key(url, batch)
        if not p.is_file():
            return None
        try:
            return json.loads(p.read_text(encoding="utf-8"))["response"]
        except Exception:
            return None

    return send


def default_transport() -> Transport:
    fx = os.environ.get("EVM_PERMISSIONS_FIXTURE_DIR")
    if fx:
        return replay_transport(fx)
    return http_transport(os.environ.get("EVM_PERMISSIONS_RECORD_DIR") or None)


def _hex_result(item: dict[str, Any] | None) -> str | None:
    if not isinstance(item, dict) or "error" in item:
        return None
    r = item.get("result")
    if not isinstance(r, str) or not r.startswith("0x") or len(r) < 4:
        return None
    return r


def decode(kind: str, hexstr: str) -> Any:
    b = bytes.fromhex(hexstr[2:])
    if kind == "uint":
        if len(b) < 32:
            return None
        v = int.from_bytes(b[:32], "big")
        return v if v < 2**53 else str(v)
    if kind == "bool":
        if len(b) < 32:
            return None
        return int.from_bytes(b[:32], "big") != 0
    if kind == "address":
        if len(b) < 32:
            return None
        return "0x" + b[12:32].hex()
    if kind == "string":
        if len(b) < 64:
            return None
        ln = int.from_bytes(b[32:64], "big")
        if ln > 512:
            return None
        return b[64:64 + ln].decode("utf-8", "replace")
    return None


def _iso(ts: int) -> str:
    return datetime.fromtimestamp(ts, tz=timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def fetch_block(chain: str, transport: Transport, spacing: float = REQUEST_SPACING_S) -> dict[str, Any] | None:
    """Latest block (number, timestamp) from the first endpoint that answers."""
    for url in CHAINS[chain]["rpcs"]:
        out = transport(url, [{"jsonrpc": "2.0", "id": 1, "method": "eth_getBlockByNumber", "params": ["latest", False]}])
        time.sleep(spacing) if spacing else None
        if not out:
            continue
        blk = out[0].get("result") if isinstance(out[0], dict) else None
        if not isinstance(blk, dict):
            continue
        try:
            return {
                "rpc": url,
                "number": int(blk["number"], 16),
                "timestamp": int(blk["timestamp"], 16),
                "hash": str(blk.get("hash") or "").lower() or None,
                "state_root": str(blk.get("stateRoot") or "").lower() or None,
            }
        except Exception:
            continue
    return None


def proof_slots(row: dict[str, Any]) -> list[dict[str, str]]:
    slots = [
        {"label": "eip1967_implementation", "key": EIP1967_IMPL},
        {"label": "eip1967_admin", "key": EIP1967_ADMIN},
    ]
    slots.extend(KNOWN_SLOTS.get((row["symbol"], row["chain"]), []))
    return slots


def fetch_proof(row: dict[str, Any], block: dict[str, Any], transport: Transport,
                spacing: float = REQUEST_SPACING_S, first_url: str | None = None) -> dict[str, Any] | None:
    """eth_getProof (EIP-1186) for the account + proof slots at the pinned block.

    Returns {"rpc", "result", "sha256", "bytes", "slots"} or None when no endpoint
    answers. sha256 is over the canonical bytes of `result` alone, so anyone who
    holds the blob recomputes it without this module.
    """
    tag = hex(block["number"])
    slots = proof_slots(row)
    req = [{"jsonrpc": "2.0", "id": 1, "method": "eth_getProof", "params": [row["address"], [s["key"] for s in slots], tag]}]
    urls = [u for u in ([first_url] if first_url else []) + [block["rpc"]] + CHAINS[row["chain"]]["rpcs"]]
    seen: set[str] = set()
    for url in urls:
        if url in seen:
            continue
        seen.add(url)
        out = transport(url, req)
        time.sleep(spacing) if spacing else None
        if not out or not isinstance(out[0], dict) or "error" in out[0]:
            continue
        res = out[0].get("result")
        if not isinstance(res, dict) or not isinstance(res.get("accountProof"), list) or not res["accountProof"]:
            continue
        if not isinstance(res.get("storageProof"), list) or len(res["storageProof"]) != len(slots):
            continue
        canon = canonical_bytes(res)
        return {"rpc": url, "result": res, "sha256": hashlib.sha256(canon).hexdigest(), "bytes": len(canon), "slots": slots}
    return None


def proof_blob(row: dict[str, Any], block: dict[str, Any], proof: dict[str, Any]) -> dict[str, Any]:
    """The full proof bytes as written to public/archive/proofs/eip1186/<sha16>.json."""
    return {
        "kind": PROOF_KIND,
        "subject": f"evm:{row['symbol']}:{row['chain']}",
        "chain": row["chain"],
        "chain_id": CHAINS[row["chain"]]["chain_id"],
        "address": row["address"].lower(),
        "block": block["number"],
        "block_hash": block.get("hash"),
        "block_state_root": block.get("state_root"),
        "rpc": proof["rpc"],
        "request": {"method": "eth_getProof", "params": [row["address"], [s["key"] for s in proof["slots"]], hex(block["number"])]},
        "slots": proof["slots"],
        "result": proof["result"],
        "sha256": proof["sha256"],
        "sha256_over": "canonical JSON (sorted keys, compact, UTF-8) of `result` only",
        "verify": (
            "fetch the header for block_hash from any node; keccak(rlp(account)) path = keccak(address) "
            "must resolve through accountProof to header.stateRoot; each storageProof resolves keccak(key) "
            "to result.storageHash. EIP-1186. No trust in this writer required."
        ),
        "note": "Point-in-time bytes. Not a rate. Not a grade. Not MEASURED. Not a certificate.",
    }


def read_token(row: dict[str, Any], block: dict[str, Any], transport: Transport, spacing: float = REQUEST_SPACING_S) -> dict[str, Any] | None:
    """One batched POST: every probe + the two EIP-1967 slots, pinned to the block."""
    tag = hex(block["number"])
    addr = row["address"]
    batch: list[dict[str, Any]] = []
    for i, (_label, _sig, data, _kind) in enumerate(PROBES):
        batch.append({"jsonrpc": "2.0", "id": i + 1, "method": "eth_call", "params": [{"to": addr, "data": data}, tag]})
    n = len(PROBES)
    batch.append({"jsonrpc": "2.0", "id": n + 1, "method": "eth_getStorageAt", "params": [addr, EIP1967_IMPL, tag]})
    batch.append({"jsonrpc": "2.0", "id": n + 2, "method": "eth_getStorageAt", "params": [addr, EIP1967_ADMIN, tag]})
    urls = [block["rpc"]] + [u for u in CHAINS[row["chain"]]["rpcs"] if u != block["rpc"]]
    for url in urls:
        out = transport(url, batch)
        time.sleep(spacing) if spacing else None
        if out is None:
            continue
        by_id = {o.get("id"): o for o in out if isinstance(o, dict)}
        checked: dict[str, Any] = {}
        absent: list[str] = []
        for i, (label, sig, _data, kind) in enumerate(PROBES):
            h = _hex_result(by_id.get(i + 1))
            v = decode(kind, h) if h else None
            if v is None:
                absent.append(sig)
            else:
                checked[label] = v
        for label, rid in (("eip1967_implementation", n + 1), ("eip1967_admin", n + 2)):
            h = _hex_result(by_id.get(rid))
            if h and len(h) >= 66 and int(h[2:66], 16) != 0:
                checked[label] = "0x" + h[2:66][24:]
            else:
                absent.append(label + " (slot zero)")
        return {"rpc": url, "checked": checked, "absent": absent}
    return None


def _host(url: str) -> str:
    return url.split("//", 1)[-1].split("/", 1)[0]


def proof_summary(proof: dict[str, Any] | None) -> dict[str, Any] | None:
    if not proof:
        return None
    res = proof["result"]
    slots = []
    for spec, sp in zip(proof["slots"], res.get("storageProof") or []):
        slots.append({
            "label": spec["label"],
            "key": spec["key"],
            "value": sp.get("value"),
            "nodes": len(sp.get("proof") or []),
        })
    return {
        "kind": "eip1186",
        "sha256": proof["sha256"],
        "bytes": proof["bytes"],
        "url": f"{PROOF_URL_PREFIX}{proof['sha256'][:16]}.json",
        "rpc": _host(proof["rpc"]),
        "account": {
            "nonce": res.get("nonce"),
            "codeHash": res.get("codeHash"),
            "storageHash": res.get("storageHash"),
            "nodes": len(res.get("accountProof") or []),
        },
        "slots": slots,
        "verifies_against": "block_hash -> header.stateRoot (EIP-1186)",
    }


def build_leaf(row: dict[str, Any], block: dict[str, Any], read: dict[str, Any],
               proof: dict[str, Any] | None = None) -> dict[str, Any]:
    chain = row["chain"]
    subject = f"evm:{row['symbol']}:{chain}"
    unmeasured = list(ALWAYS_UNMEASURED)
    if proof:
        proven = {s["label"] for s in proof["slots"]}
        getters = [k for k in read["checked"] if k not in ("name", "symbol", "decimals") and k not in proven]
        if getters:
            unmeasured.append("slot-level proof of getter values (storage layout not in KNOWN_SLOTS); account storageHash proven")
    else:
        unmeasured.append("EIP-1186 proof (no endpoint answered eth_getProof at this block)")
    if read["checked"].get("paused") is None and read["checked"].get("isPaused") is None:
        unmeasured.append("pause flag (no paused()/isPaused() answered at this block)")
    if read["checked"].get("symbol") and read["checked"]["symbol"] != row["symbol"]:
        unmeasured.append(f"symbol on-chain {read['checked']['symbol']!r} differs from roster {row['symbol']!r}")
    payload: dict[str, Any] = {
        "schema": SCHEMA,
        "subject": subject,
        "symbol": row["symbol"],
        "product": row["product"],
        "chain": chain,
        "chain_id": CHAINS[chain]["chain_id"],
        "address": row["address"].lower(),
        "block": block["number"],
        "block_hash": block.get("hash"),
        "block_time": _iso(block["timestamp"]),
        "rpc": _host(read["rpc"]),
        "checked": read["checked"],
        "absent": read["absent"],
        "proof": proof_summary(proof),
        "unmeasured": unmeasured,
        "attests": (
            f"historical permission state at block {block['number']} on {chain}, as answered by the "
            f"named public RPC; discrete, point-in-time; not a rate, not a grade, not an opinion"
        ),
        "method": METHOD_URL,
    }
    # Hard cap: 3072 canonical bytes. Trim the least load-bearing fields first.
    # The proof sha256 + url are never trimmed: they are the pointer to the bytes.
    while len(canonical_bytes(payload)) > PAYLOAD_CAP:
        if payload.get("absent"):
            payload["absent"] = payload["absent"][:-1]
            continue
        if payload.get("proof") and payload["proof"].get("slots"):
            payload["proof"]["slots"] = payload["proof"]["slots"][:-1]
            continue
        if payload.get("proof") and "account" in payload["proof"]:
            payload["proof"].pop("account", None)
            payload["proof"].pop("verifies_against", None)
            continue
        if "terms" in payload["checked"]:
            payload["checked"]["terms"] = str(payload["checked"]["terms"])[:64]
        if len(payload["unmeasured"]) > 1:
            payload["unmeasured"] = payload["unmeasured"][:-1]
            continue
        payload["product"] = payload["product"][:32]
        break
    return {
        "surface": SURFACE,
        "subject": f"{subject} permission state at block {block['number']}",
        "as_of": payload["block_time"],
        "source_urls": [read["rpc"], row["source"]] + ([proof["rpc"]] if proof and proof["rpc"] != read["rpc"] else []),
        "payload": payload,
        "unmeasured": unmeasured,
        "tags": ["framework:evm", "reg.tag:public-ledger", f"chain:{chain}", "coverage:permission-state", f"subject:{row['symbol']}"],
    }


def roster(only: str | None = None) -> list[dict[str, Any]]:
    """ROSTER, optionally narrowed by a comma list of symbols (EVM_PERMISSIONS_ONLY)."""
    only = only if only is not None else os.environ.get("EVM_PERMISSIONS_ONLY")
    if not only:
        return list(ROSTER)
    want = {s.strip().lower() for s in only.split(",") if s.strip()}
    return [r for r in ROSTER if r["symbol"].lower() in want]


def collect(transport: Transport | None = None, spacing: float = REQUEST_SPACING_S,
            only: str | None = None) -> dict[str, Any]:
    """Adapter entry point. Never raises; dark RPCs mean fewer leaves, never a halt.

    Returns {"leaves", "proof_blobs" (sha256 -> full EIP-1186 blob, written by the
    publisher beside the cards), "sidecar"}.
    """
    leaves: list[dict[str, Any]] = []
    proof_blobs: dict[str, dict[str, Any]] = {}
    chains: dict[str, Any] = {}
    failures: list[dict[str, str]] = []
    rows = roster(only)
    try:
        tr = transport or default_transport()
        blocks: dict[str, dict[str, Any] | None] = {}
        for chain in sorted({r["chain"] for r in rows}):
            try:
                blocks[chain] = fetch_block(chain, tr, spacing)
            except Exception as e:  # pragma: no cover — belt and braces
                blocks[chain] = None
                failures.append({"chain": chain, "reason": f"block {type(e).__name__}"})
            b = blocks[chain]
            chains[chain] = {"rpc": _host(b["rpc"]), "block": b["number"], "block_hash": b.get("hash"), "block_time": _iso(b["timestamp"])} if b else {"status": "dark"}
        for row in rows:
            b = blocks.get(row["chain"])
            if not b:
                failures.append({"subject": f"evm:{row['symbol']}:{row['chain']}", "reason": "chain dark"})
                continue
            try:
                read = read_token(row, b, tr, spacing)
            except Exception as e:
                read = None
                failures.append({"subject": f"evm:{row['symbol']}:{row['chain']}", "reason": f"read {type(e).__name__}"})
            if not read:
                failures.append({"subject": f"evm:{row['symbol']}:{row['chain']}", "reason": "no endpoint answered"})
                continue
            try:
                proof = fetch_proof(row, b, tr, spacing, first_url=read["rpc"])
            except Exception as e:
                proof = None
                failures.append({"subject": f"evm:{row['symbol']}:{row['chain']}", "reason": f"proof {type(e).__name__}"})
            if proof is None:
                failures.append({"subject": f"evm:{row['symbol']}:{row['chain']}", "reason": "no endpoint answered eth_getProof"})
            else:
                proof_blobs[proof["sha256"]] = proof_blob(row, b, proof)
            leaves.append(build_leaf(row, b, read, proof))
    except Exception as e:  # never halt the root
        failures.append({"adapter": "evm_permissions", "reason": type(e).__name__})
        leaves = []
        proof_blobs = {}
    return {
        "leaves": leaves,
        "proof_blobs": proof_blobs,
        "sidecar": {
            "schema": SCHEMA,
            "n_leaves": len(leaves),
            "n_proofs": len(proof_blobs),
            "n_roster": len(rows),
            "n_unverified": len(UNVERIFIED),
            "aum_source": AUM_SOURCE,
            "aum_as_of": AUM_AS_OF,
            "chains": chains,
            "failures": failures[:40],
            "note": (
                "Permission state of tokenised RWAs read from keyless public EVM RPCs at one block per chain, "
                "with an EIP-1186 account+slot proof against the block hash where an endpoint answered. "
                "Discrete, point-in-time; leaves are signed only by the public-root writer in GHA. "
                "UNVERIFIED rows are named, never read. Not a rate. Not a grade. Not MEASURED."
            ),
        },
    }


def write_proof_blobs(root: Path, proof_blobs: dict[str, dict[str, Any]]) -> list[Path]:
    """Publisher hook: land the full EIP-1186 bytes at public/archive/proofs/eip1186/<sha16>.json.
    Content-addressed, so a re-run with the same proof is a no-op. Never raises."""
    written: list[Path] = []
    try:
        d = root / "public" / "archive" / "proofs" / "eip1186"
        d.mkdir(parents=True, exist_ok=True)
        for sha, blob in proof_blobs.items():
            p = d / f"{sha[:16]}.json"
            if p.is_file():
                continue
            p.write_text(json.dumps(blob, indent=1, sort_keys=True, ensure_ascii=False) + "\n", encoding="utf-8")
            written.append(p)
    except Exception:
        pass
    return written


if __name__ == "__main__":
    out = collect()
    print(json.dumps({"n_leaves": len(out["leaves"]), "sidecar": out["sidecar"]}, indent=1, ensure_ascii=False))
    for leaf in out["leaves"]:
        pr = leaf["payload"].get("proof") or {}
        print(leaf["payload"]["subject"], leaf["payload"]["block"], len(canonical_bytes(leaf["payload"])), "B",
              "proof", (pr.get("sha256") or "-")[:16])
