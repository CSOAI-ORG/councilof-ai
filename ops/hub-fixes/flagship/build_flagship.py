#!/usr/bin/env python3
"""build_flagship.py — stage and (optionally) publish the consolidated csoai/gspc dataset.

SAFE BY DEFAULT.  Without --confirm this script never writes to the Hugging Face Hub: it
downloads the pinned source revisions (read-only), stages the flagship tree locally, writes
SHA256SUMS, a copy plan (plan.csv) and redirect-card previews, and validates the README configs.

Hub writes (each one needs --confirm, and every repo change is a Pull Request, never a push to main):
  --create-repo   create csoai/gspc if it does not exist (owner decision: --public / default private)
  --open-pr       open ONE PR on csoai/gspc adding the staged tree (create_pr=True)
  --redirects     open one PR per source repo that prepends a redirect banner to its README
                  (refuses unless csoai/gspc main already has the configs, i.e. the flagship PR is merged)

Pins were read live on 2026-11-20 from https://councilof.ai/api/gspc and the HF Hub API.
The source repos are NOT modified, renamed or deleted by this script: the live board's
`dataset` / `dataset_url` fields point at them, so they must keep resolving.

Usage
  python build_flagship.py                         # dry run: stage into ./gspc_stage
  python build_flagship.py --validate              # dry run + load every config with `datasets`
  HF_TOKEN=... python build_flagship.py --confirm --create-repo --open-pr
  HF_TOKEN=... python build_flagship.py --confirm --redirects
"""
from __future__ import annotations

import argparse, csv, hashlib, json, os, re, shutil, sys
from pathlib import Path

FLAGSHIP = "csoai/gspc"
PERITEM_REPO = "csoai/gspc-peritem-rows-2026-08-12"
PERITEM_REVISION = "294e4cf9e8b72a00aa50de024b3ed3e7ab0b3361"   # = /api/gspc peritem_rows.dataset_revision
PERITEM_DIR = "peritem-rows-2026-08-12"
SKIP = {".gitattributes"}
RENAME = {"README.md": "SOURCE_README.md"}      # keep each source card, without clashing with the flagship card
BOARD_COLS = ["axis", "family", "kind", "bench", "task", "n", "status", "note", "colour", "hue",
              "_authority", "_source", "_public_count", "_as_of"]

AXIS_SOURCES = {
    'governance': ('csoai/gspc-gov', 'c6ddc5a92c2354248e6b1328ebd341872ee80019'),
    'safety': ('csoai/gspc-agi', '3c72b7514768479384e0eae0aebf0c758220e447'),
    'provenance': ('csoai/gspc-prv', 'd7f2a9b7564dcf368c410c787c83902a7aa8d06d'),
    'continuity': ('csoai/gspc-asi', '34988253b732a26c75f695fef6896405f53dfa30'),
    'conformance': ('csoai/gspc-mcp', 'e1f3824cd63ebbc375cbac45c7f8259bb986aac4'),
    'openness': ('csoai/gspc-oss', '19ea8bea666af826278e4db9a5c42ac462127770'),
    'machinery-conformity': ('csoai/gspc-mach', 'cfc0706fa3731d92e9e78bb33b802a4e27b0fc50'),
    'care': ('csoai/gspc-care', '262246d022537160083223f1cf348282b1f8396b'),
    'cross-reality': ('csoai/gspc-xr', 'b1205946c0293b8002f140b743e04e907d0de2e4'),
    'detector-interop': ('csoai/gspc-det', '18d7669ef9cd21c7715d560b62da6ebee278a1e3'),
    'art5-safeguard': ('csoai/gspc-art5', 'cf1df8c3e688e02efa067e41973560223fe03237'),
    'swarm': ('csoai/gspc-swarm', 'dc7e6b63cc5fcf6a2a28318fcf6f3274d152f156'),
    'affect': ('csoai/gspc-affect', '33736b383d7c0b20e6f46f2e0df7a7c350748d36'),
    'jail': ('csoai/gspc-jail-goldbank', '1c692b9d467ffbb8b4c20a092bba537594ad02dd'),
    'provenance-controls': ('csoai/gspc-provenance-controls', '6c0c84cb78ae97fd1d18ede12a8a1454a0846d7a'),
    'reserve-attestation': ('csoai/gspc-reserve-attestation', 'e82e2d87f44af1d2fbd25094bf4224f64817dc2f'),
    'regulatory-framework': ('csoai/gspc-regulatory-framework', '25c7af1b6a2da2fa1e2b521fd297f63321622014'),
    'distribution-integrity': ('csoai/gspc-distribution-integrity', 'e189846db53b49726db808c7d62e9762c3c311f3'),
    'custody-disclosure': ('csoai/gspc-custody-disclosure', 'c80e21b462ec0cf3764ae853f637a0ebca831600'),
    'ai-adoption-components': ('csoai/gspc-ai-economy-index', '3f438574491b5d867610367b9670496d8e5a77bc'),
    'labour-components': ('csoai/gspc-human-labour-index', '5b2efc8fcb9ba9934996255491be152535f3df80'),
    'humanoid-labour-index': ('csoai/gspc-humanoid-labour-index', '73616177b3961b8b307a83c676335ebfb8d57a72'),
}

PERITEM_FILES_SHA256 = {
    "peritem_affect.jsonl": "7e8a612889d486df40ba638e36ba976cd2820460272fe65c0202e271c95e99e7",
    "peritem_agi.jsonl": "b70ccaa015668a80aeb50196623e8a138b6238e023b6cdff4308ee4fd592b2cb",
    "peritem_art5.jsonl": "950861961ed3e1d0481c4577850b908b41ef696785b500956f11c502015cf1a3",
    "peritem_asi.jsonl": "f90910c6cede5f97a1158226535020c17cf6f7f22a19ce65201511b179ef9e40",
    "peritem_care.jsonl": "888f230b58e5d78a8570244b9e8374c9740f24c3d6fd9f45d67b372db25f27b2",
    "peritem_det.jsonl": "665e358bedbaf899620fd5119a2a9d9b1415eb91396a463955c0e667c21b94a3",
    "peritem_gov.jsonl": "3a1d3193d3651448dd311efe4c7efcbdffb19e07fba06c15e628b844bfbfa2a5",
    "peritem_mach.jsonl": "d3133100c2889cf259f2faa5390c69ccd3c71ac157fbb4ccd369b3c679996a0b",
    "peritem_mcp.jsonl": "9ac4db30d9d0039555702445ab940346974da36b4b1d8de58dc775849caa26da",
    "peritem_oss.jsonl": "f04421a8a8b4a6f01d79dfe771ede8ef40de4338955dcb64a48244df9008685f",
    "peritem_prv.jsonl": "fb9efe3afda9d075cf38607c53f1c6a8044909b642e58747b9559a87fcc83237",
    "peritem_swarm.jsonl": "0a54c4abae07d638d25e7121771500dfc3f40ad0a40a46279a1b6a4dc17f6212",
    "peritem_xr.jsonl": "34758dd55d2b632e8a2a26390c3f1e01d7044a92e8c38d7ee76bd0386bcc8a6a"
}

SPEC = [
    {'config': 'board', 'axis': '*', 'kind': 'derived', 'source_repo': '(derived from axes/*/axis-live.jsonl)', 'source_revision': None, 'source_path': None, 'flagship_glob': 'board/axis_live.jsonl', 'source_config': None},
    {'config': 'governance', 'axis': 'governance', 'kind': 'model-comparison', 'source_repo': 'csoai/gspc-gov', 'source_revision': 'c6ddc5a92c2354248e6b1328ebd341872ee80019', 'source_path': 'items.jsonl', 'flagship_glob': 'axes/governance/items.jsonl', 'source_config': 'default'},
    {'config': 'safety', 'axis': 'safety', 'kind': 'model-comparison', 'source_repo': 'csoai/gspc-agi', 'source_revision': '3c72b7514768479384e0eae0aebf0c758220e447', 'source_path': 'items.jsonl', 'flagship_glob': 'axes/safety/items.jsonl', 'source_config': 'default'},
    {'config': 'provenance', 'axis': 'provenance', 'kind': 'model-comparison', 'source_repo': 'csoai/gspc-prv', 'source_revision': 'd7f2a9b7564dcf368c410c787c83902a7aa8d06d', 'source_path': 'items.jsonl', 'flagship_glob': 'axes/provenance/items.jsonl', 'source_config': 'default'},
    {'config': 'continuity', 'axis': 'continuity', 'kind': 'model-comparison', 'source_repo': 'csoai/gspc-asi', 'source_revision': '34988253b732a26c75f695fef6896405f53dfa30', 'source_path': 'items.jsonl', 'flagship_glob': 'axes/continuity/items.jsonl', 'source_config': 'default'},
    {'config': 'conformance', 'axis': 'conformance', 'kind': 'model-comparison', 'source_repo': 'csoai/gspc-mcp', 'source_revision': 'e1f3824cd63ebbc375cbac45c7f8259bb986aac4', 'source_path': 'items.jsonl', 'flagship_glob': 'axes/conformance/items.jsonl', 'source_config': 'default'},
    {'config': 'openness', 'axis': 'openness', 'kind': 'model-comparison', 'source_repo': 'csoai/gspc-oss', 'source_revision': '19ea8bea666af826278e4db9a5c42ac462127770', 'source_path': 'items.jsonl', 'flagship_glob': 'axes/openness/items.jsonl', 'source_config': 'default'},
    {'config': 'machinery-conformity', 'axis': 'machinery-conformity', 'kind': 'model-comparison', 'source_repo': 'csoai/gspc-mach', 'source_revision': 'cfc0706fa3731d92e9e78bb33b802a4e27b0fc50', 'source_path': 'items.jsonl', 'flagship_glob': 'axes/machinery-conformity/items.jsonl', 'source_config': 'default'},
    {'config': 'care', 'axis': 'care', 'kind': 'model-comparison', 'source_repo': 'csoai/gspc-care', 'source_revision': '262246d022537160083223f1cf348282b1f8396b', 'source_path': 'items.jsonl', 'flagship_glob': 'axes/care/items.jsonl', 'source_config': 'default'},
    {'config': 'cross-reality', 'axis': 'cross-reality', 'kind': 'model-comparison', 'source_repo': 'csoai/gspc-xr', 'source_revision': 'b1205946c0293b8002f140b743e04e907d0de2e4', 'source_path': 'items.jsonl', 'flagship_glob': 'axes/cross-reality/items.jsonl', 'source_config': 'default'},
    {'config': 'detector-interop', 'axis': 'detector-interop', 'kind': 'model-comparison', 'source_repo': 'csoai/gspc-det', 'source_revision': '18d7669ef9cd21c7715d560b62da6ebee278a1e3', 'source_path': 'items.jsonl', 'flagship_glob': 'axes/detector-interop/items.jsonl', 'source_config': 'default'},
    {'config': 'art5-safeguard', 'axis': 'art5-safeguard', 'kind': 'model-comparison', 'source_repo': 'csoai/gspc-art5', 'source_revision': 'cf1df8c3e688e02efa067e41973560223fe03237', 'source_path': 'items.jsonl', 'flagship_glob': 'axes/art5-safeguard/items.jsonl', 'source_config': 'default'},
    {'config': 'swarm', 'axis': 'swarm', 'kind': 'model-comparison', 'source_repo': 'csoai/gspc-swarm', 'source_revision': 'dc7e6b63cc5fcf6a2a28318fcf6f3274d152f156', 'source_path': 'items.jsonl', 'flagship_glob': 'axes/swarm/items.jsonl', 'source_config': 'default'},
    {'config': 'affect', 'axis': 'affect', 'kind': 'model-comparison', 'source_repo': 'csoai/gspc-affect', 'source_revision': '33736b383d7c0b20e6f46f2e0df7a7c350748d36', 'source_path': 'items.jsonl', 'flagship_glob': 'axes/affect/items.jsonl', 'source_config': 'default'},
    {'config': 'jail', 'axis': 'jail', 'kind': 'model-comparison', 'source_repo': 'csoai/gspc-jail-goldbank', 'source_revision': '1c692b9d467ffbb8b4c20a092bba537594ad02dd', 'source_path': 'samples.jsonl', 'flagship_glob': 'axes/jail/samples.jsonl', 'source_config': 'inspect'},
    {'config': 'provenance-controls', 'axis': 'provenance-controls', 'kind': 'deterministic-facts', 'source_repo': 'csoai/gspc-provenance-controls', 'source_revision': '6c0c84cb78ae97fd1d18ede12a8a1454a0846d7a', 'source_path': 'pointers.jsonl', 'flagship_glob': 'axes/provenance-controls/pointers.jsonl', 'source_config': 'default'},
    {'config': 'reserve-attestation', 'axis': 'reserve-attestation', 'kind': 'deterministic-facts', 'source_repo': 'csoai/gspc-reserve-attestation', 'source_revision': 'e82e2d87f44af1d2fbd25094bf4224f64817dc2f', 'source_path': 'axis-live.jsonl', 'flagship_glob': 'axes/reserve-attestation/axis-live.jsonl', 'source_config': 'default'},
    {'config': 'regulatory-framework', 'axis': 'regulatory-framework', 'kind': 'deterministic-facts', 'source_repo': 'csoai/gspc-regulatory-framework', 'source_revision': '25c7af1b6a2da2fa1e2b521fd297f63321622014', 'source_path': 'axis-live.jsonl', 'flagship_glob': 'axes/regulatory-framework/axis-live.jsonl', 'source_config': 'default'},
    {'config': 'distribution-integrity', 'axis': 'distribution-integrity', 'kind': 'deterministic-facts', 'source_repo': 'csoai/gspc-distribution-integrity', 'source_revision': 'e189846db53b49726db808c7d62e9762c3c311f3', 'source_path': 'axis-live.jsonl', 'flagship_glob': 'axes/distribution-integrity/axis-live.jsonl', 'source_config': 'default'},
    {'config': 'custody-disclosure', 'axis': 'custody-disclosure', 'kind': 'deterministic-facts', 'source_repo': 'csoai/gspc-custody-disclosure', 'source_revision': 'c80e21b462ec0cf3764ae853f637a0ebca831600', 'source_path': 'axis-live.jsonl', 'flagship_glob': 'axes/custody-disclosure/axis-live.jsonl', 'source_config': 'default'},
    {'config': 'ai-adoption-components', 'axis': 'ai-adoption-components', 'kind': 'deterministic-facts', 'source_repo': 'csoai/gspc-ai-economy-index', 'source_revision': '3f438574491b5d867610367b9670496d8e5a77bc', 'source_path': 'axis-live.jsonl', 'flagship_glob': 'axes/ai-adoption-components/axis-live.jsonl', 'source_config': 'default'},
    {'config': 'labour-components', 'axis': 'labour-components', 'kind': 'deterministic-facts', 'source_repo': 'csoai/gspc-human-labour-index', 'source_revision': '5b2efc8fcb9ba9934996255491be152535f3df80', 'source_path': 'axis-live.jsonl', 'flagship_glob': 'axes/labour-components/axis-live.jsonl', 'source_config': 'default'},
    {'config': 'humanoid-labour-index', 'axis': 'humanoid-labour-index', 'kind': 'deterministic-facts', 'source_repo': 'csoai/gspc-humanoid-labour-index', 'source_revision': '73616177b3961b8b307a83c676335ebfb8d57a72', 'source_path': 'axis-live.jsonl', 'flagship_glob': 'axes/humanoid-labour-index/axis-live.jsonl', 'source_config': 'default'},
    {'config': 'cross-reality-checks', 'axis': 'cross-reality', 'kind': 'model-comparison', 'source_repo': 'csoai/gspc-xr', 'source_revision': 'b1205946c0293b8002f140b743e04e907d0de2e4', 'source_path': 'checks.jsonl', 'flagship_glob': 'axes/cross-reality/checks.jsonl', 'source_config': 'checks'},
    {'config': 'detector-interop-protocol', 'axis': 'detector-interop', 'kind': 'model-comparison', 'source_repo': 'csoai/gspc-det', 'source_revision': '18d7669ef9cd21c7715d560b62da6ebee278a1e3', 'source_path': 'protocol.jsonl', 'flagship_glob': 'axes/detector-interop/protocol.jsonl', 'source_config': 'protocol'},
    {'config': 'swarm-protocol', 'axis': 'swarm', 'kind': 'model-comparison', 'source_repo': 'csoai/gspc-swarm', 'source_revision': 'dc7e6b63cc5fcf6a2a28318fcf6f3274d152f156', 'source_path': 'protocol.jsonl', 'flagship_glob': 'axes/swarm/protocol.jsonl', 'source_config': 'protocol'},
    {'config': 'swarm-inspect', 'axis': 'swarm', 'kind': 'model-comparison', 'source_repo': 'csoai/gspc-swarm', 'source_revision': 'dc7e6b63cc5fcf6a2a28318fcf6f3274d152f156', 'source_path': 'samples.jsonl', 'flagship_glob': 'axes/swarm/samples.jsonl', 'source_config': 'inspect'},
    {'config': 'peritem-governance', 'axis': 'governance', 'kind': 'per-item rows', 'source_repo': 'csoai/gspc-peritem-rows-2026-08-12', 'source_revision': '294e4cf9e8b72a00aa50de024b3ed3e7ab0b3361', 'source_path': 'rows/peritem_gov.jsonl', 'flagship_glob': 'peritem-rows-2026-08-12/rows/peritem_gov.jsonl', 'source_config': 'governance'},
    {'config': 'peritem-safety', 'axis': 'safety', 'kind': 'per-item rows', 'source_repo': 'csoai/gspc-peritem-rows-2026-08-12', 'source_revision': '294e4cf9e8b72a00aa50de024b3ed3e7ab0b3361', 'source_path': 'rows/peritem_agi.jsonl', 'flagship_glob': 'peritem-rows-2026-08-12/rows/peritem_agi.jsonl', 'source_config': 'safety'},
    {'config': 'peritem-provenance', 'axis': 'provenance', 'kind': 'per-item rows', 'source_repo': 'csoai/gspc-peritem-rows-2026-08-12', 'source_revision': '294e4cf9e8b72a00aa50de024b3ed3e7ab0b3361', 'source_path': 'rows/peritem_prv.jsonl', 'flagship_glob': 'peritem-rows-2026-08-12/rows/peritem_prv.jsonl', 'source_config': 'provenance'},
    {'config': 'peritem-continuity', 'axis': 'continuity', 'kind': 'per-item rows', 'source_repo': 'csoai/gspc-peritem-rows-2026-08-12', 'source_revision': '294e4cf9e8b72a00aa50de024b3ed3e7ab0b3361', 'source_path': 'rows/peritem_asi.jsonl', 'flagship_glob': 'peritem-rows-2026-08-12/rows/peritem_asi.jsonl', 'source_config': 'continuity'},
    {'config': 'peritem-conformance', 'axis': 'conformance', 'kind': 'per-item rows', 'source_repo': 'csoai/gspc-peritem-rows-2026-08-12', 'source_revision': '294e4cf9e8b72a00aa50de024b3ed3e7ab0b3361', 'source_path': 'rows/peritem_mcp.jsonl', 'flagship_glob': 'peritem-rows-2026-08-12/rows/peritem_mcp.jsonl', 'source_config': 'conformance'},
    {'config': 'peritem-openness', 'axis': 'openness', 'kind': 'per-item rows', 'source_repo': 'csoai/gspc-peritem-rows-2026-08-12', 'source_revision': '294e4cf9e8b72a00aa50de024b3ed3e7ab0b3361', 'source_path': 'rows/peritem_oss.jsonl', 'flagship_glob': 'peritem-rows-2026-08-12/rows/peritem_oss.jsonl', 'source_config': 'openness'},
    {'config': 'peritem-machinery-conformity', 'axis': 'machinery-conformity', 'kind': 'per-item rows', 'source_repo': 'csoai/gspc-peritem-rows-2026-08-12', 'source_revision': '294e4cf9e8b72a00aa50de024b3ed3e7ab0b3361', 'source_path': 'rows/peritem_mach.jsonl', 'flagship_glob': 'peritem-rows-2026-08-12/rows/peritem_mach.jsonl', 'source_config': 'machinery-conformity'},
    {'config': 'peritem-care', 'axis': 'care', 'kind': 'per-item rows', 'source_repo': 'csoai/gspc-peritem-rows-2026-08-12', 'source_revision': '294e4cf9e8b72a00aa50de024b3ed3e7ab0b3361', 'source_path': 'rows/peritem_care.jsonl', 'flagship_glob': 'peritem-rows-2026-08-12/rows/peritem_care.jsonl', 'source_config': 'care'},
    {'config': 'peritem-cross-reality', 'axis': 'cross-reality', 'kind': 'per-item rows', 'source_repo': 'csoai/gspc-peritem-rows-2026-08-12', 'source_revision': '294e4cf9e8b72a00aa50de024b3ed3e7ab0b3361', 'source_path': 'rows/peritem_xr.jsonl', 'flagship_glob': 'peritem-rows-2026-08-12/rows/peritem_xr.jsonl', 'source_config': 'cross-reality'},
    {'config': 'peritem-detector-interop', 'axis': 'detector-interop', 'kind': 'per-item rows', 'source_repo': 'csoai/gspc-peritem-rows-2026-08-12', 'source_revision': '294e4cf9e8b72a00aa50de024b3ed3e7ab0b3361', 'source_path': 'rows/peritem_det.jsonl', 'flagship_glob': 'peritem-rows-2026-08-12/rows/peritem_det.jsonl', 'source_config': 'detector-interop'},
    {'config': 'peritem-art5-safeguard', 'axis': 'art5-safeguard', 'kind': 'per-item rows', 'source_repo': 'csoai/gspc-peritem-rows-2026-08-12', 'source_revision': '294e4cf9e8b72a00aa50de024b3ed3e7ab0b3361', 'source_path': 'rows/peritem_art5.jsonl', 'flagship_glob': 'peritem-rows-2026-08-12/rows/peritem_art5.jsonl', 'source_config': 'art5-safeguard'},
    {'config': 'peritem-swarm', 'axis': 'swarm', 'kind': 'per-item rows', 'source_repo': 'csoai/gspc-peritem-rows-2026-08-12', 'source_revision': '294e4cf9e8b72a00aa50de024b3ed3e7ab0b3361', 'source_path': 'rows/peritem_swarm.jsonl', 'flagship_glob': 'peritem-rows-2026-08-12/rows/peritem_swarm.jsonl', 'source_config': 'swarm'},
    {'config': 'peritem-affect', 'axis': 'affect', 'kind': 'per-item rows', 'source_repo': 'csoai/gspc-peritem-rows-2026-08-12', 'source_revision': '294e4cf9e8b72a00aa50de024b3ed3e7ab0b3361', 'source_path': 'rows/peritem_affect.jsonl', 'flagship_glob': 'peritem-rows-2026-08-12/rows/peritem_affect.jsonl', 'source_config': 'affect'},
    {'config': 'manifest', 'axis': '*', 'kind': 'file manifests', 'source_repo': '(each axis repo manifest.jsonl)', 'source_revision': None, 'source_path': 'manifest.jsonl', 'flagship_glob': 'axes/*/manifest.jsonl', 'source_config': 'manifest'},
]


BANNER_MARK = "<!-- csoai-flagship-redirect:v1 -->"


def sha256(p: Path) -> str:
    h = hashlib.sha256()
    with open(p, "rb") as f:
        for b in iter(lambda: f.read(1 << 20), b""):
            h.update(b)
    return h.hexdigest()


def hub():
    from huggingface_hub import HfApi, snapshot_download
    return HfApi(token=os.environ.get("HF_TOKEN")), snapshot_download


def check_drift(api, allow: bool) -> list[str]:
    """Compare pinned revisions with the current main of each source repo."""
    drift = []
    for axis, (repo, rev) in AXIS_SOURCES.items():
        cur = api.dataset_info(repo).sha
        if cur != rev:
            drift.append(f"{repo}: pinned {rev[:10]} but main is {cur[:10]}")
    for d in drift:
        print("DRIFT", d)
    if drift and not allow:
        sys.exit("Source repos moved since the pins were taken. Re-read them, update AXIS_SOURCES, "
                 "or pass --allow-drift to build from the pinned (older) revisions.")
    return drift


def stage(stage_dir: Path, cache: Path, readme: Path) -> list[dict]:
    api, snapshot_download = hub()
    if stage_dir.exists():
        shutil.rmtree(stage_dir)
    stage_dir.mkdir(parents=True)
    plan = []

    def copy_tree(repo, rev, dest_rel):
        src = Path(snapshot_download(repo_id=repo, repo_type="dataset", revision=rev,
                                     local_dir=cache / repo.replace("/", "__") / rev))
        files = []
        for p in sorted(src.rglob("*")):
            if not p.is_file() or ".cache" in p.parts or p.name in SKIP:
                continue
            rel = p.relative_to(src).as_posix()
            out_rel = RENAME.get(rel, rel)
            dst = stage_dir / dest_rel / out_rel
            dst.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(p, dst)
            h = sha256(dst)
            files.append({"path": out_rel, "sha256": h, "bytes": dst.stat().st_size})
            plan.append({"source_repo": repo, "source_revision": rev, "source_path": rel,
                         "flagship_path": f"{dest_rel}/{out_rel}", "sha256": h, "bytes": dst.stat().st_size})
        (stage_dir / dest_rel / "SOURCE.json").write_text(json.dumps(
            {"source_repo": repo, "source_revision": rev,
             "source_url": f"https://huggingface.co/datasets/{repo}/tree/{rev}",
             "copied_unchanged": True, "renamed": RENAME, "files": files}, indent=1) + "\n")
        return src

    # 1. per-axis repos -> axes/<axis>/
    for axis, (repo, rev) in AXIS_SOURCES.items():
        copy_tree(repo, rev, f"axes/{axis}")
    # 2. frozen per-item rows -> peritem-rows-2026-08-12/ (verify against the live board's hashes)
    copy_tree(PERITEM_REPO, PERITEM_REVISION, PERITEM_DIR)
    for name, want in PERITEM_FILES_SHA256.items():
        got = sha256(stage_dir / PERITEM_DIR / "rows" / name)
        if got != want:
            sys.exit(f"per-item file {name} hash {got} != /api/gspc {want}")
    print(f"per-item rows: {len(PERITEM_FILES_SHA256)} files match /api/gspc peritem_rows.files")
    # 3. derived board config: one row per axis, common columns + the full original row as JSON
    rows = []
    for axis, (repo, rev) in AXIS_SOURCES.items():
        for line in (stage_dir / "axes" / axis / "axis-live.jsonl").read_text().splitlines():
            if not line.strip():
                continue
            rec = json.loads(line)
            out = {c: rec.get(c) for c in BOARD_COLS}
            out["_as_of"] = None if rec.get("_as_of") is None else str(rec.get("_as_of"))
            out.update(source_repo=repo, source_revision=rev,
                       axis_live_json=json.dumps(rec, ensure_ascii=False, sort_keys=True))
            rows.append(out)
    (stage_dir / "board").mkdir(exist_ok=True)
    with open(stage_dir / "board" / "axis_live.jsonl", "w") as f:
        for r in rows:
            f.write(json.dumps(r, ensure_ascii=False) + "\n")
    print(f"board/axis_live.jsonl: {len(rows)} rows (derived; source snapshots, not the live GET)")
    # 4. flagship card
    shutil.copy2(readme, stage_dir / "README.md")
    # 5. whole-repo SHA256SUMS (sorted, sha256sum format)
    sums = sorted((p.relative_to(stage_dir).as_posix(), sha256(p))
                  for p in stage_dir.rglob("*") if p.is_file() and p.name != "SHA256SUMS")
    (stage_dir / "SHA256SUMS").write_text("".join(f"{h}  {rel}\n" for rel, h in sums))
    return plan


def check_readme_configs(stage_dir: Path) -> None:
    """Every data_files path in the README YAML must exist in the staged tree; every SPEC config must be declared."""
    import yaml, glob
    text = (stage_dir / "README.md").read_text()
    meta = yaml.safe_load(text.split("---", 2)[1])
    declared = {c["config_name"]: c for c in meta["configs"]}
    missing_cfg = [s["config"] for s in SPEC if s["config"] not in declared]
    bad = []
    for name, c in declared.items():
        for df in c["data_files"]:
            if not glob.glob(str(stage_dir / df["path"])):
                bad.append(f"{name}: {df['path']}")
    if missing_cfg or bad:
        sys.exit(f"README/config mismatch. missing configs={missing_cfg} missing files={bad}")
    print(f"README declares {len(declared)} configs; all data_files resolve in the stage")


def validate_with_datasets(stage_dir: Path) -> None:
    import yaml
    from datasets import load_dataset
    meta = yaml.safe_load((stage_dir / "README.md").read_text().split("---", 2)[1])
    fails = 0
    for c in meta["configs"]:
        try:
            ds = load_dataset(str(stage_dir), c["config_name"], split="train")
            print(f"  ok   {c['config_name']:32s} rows={ds.num_rows} cols={len(ds.column_names)}")
        except Exception as e:  # noqa: BLE001
            fails += 1
            print(f"  FAIL {c['config_name']:32s} {type(e).__name__}: {str(e)[:200]}")
    if fails:
        sys.exit(f"{fails} configs failed to load")


def redirect_banner(axis: str, repo: str, rev: str, cfg_names: list[str]) -> str:
    cfgs = ", ".join(f"`{c}`" for c in cfg_names)
    return (f"{BANNER_MARK}\n"
            f"> **This bank is now also part of the consolidated GSPC dataset "
            f"[`csoai/gspc`](https://huggingface.co/datasets/{FLAGSHIP}) (configs {cfgs}).**  \n"
            f"> The files of revision `{rev[:10]}` of this repository are mirrored unchanged under "
            f"`axes/{axis}/` there, with `SOURCE.json` recording each file's SHA-256.  \n"
            f"> This repository stays online, at the same URL, so pinned revisions and the live "
            f"board's `dataset_url` keep resolving.  \n"
            f"> Load: `load_dataset(\"{FLAGSHIP}\", \"{axis}\")` · Current state: "
            f"[councilof.ai/api/gspc](https://councilof.ai/api/gspc) · Measurement, not certification.\n\n")


def insert_banner(readme_text: str, banner: str) -> str:
    if BANNER_MARK in readme_text:
        return readme_text
    m = re.match(r"^---\n.*?\n---\n", readme_text, flags=re.S)
    if m:
        return readme_text[: m.end()] + "\n" + banner + readme_text[m.end():]
    return banner + readme_text


def write_redirect_previews(stage_root: Path, cache: Path) -> list[tuple[str, Path]]:
    out = []
    by_repo = {}
    for s in SPEC:
        if s["source_repo"] in {r for r, _ in AXIS_SOURCES.values()}:
            by_repo.setdefault(s["source_repo"], []).append(s["config"])
    for axis, (repo, rev) in AXIS_SOURCES.items():
        src = cache / repo.replace("/", "__") / rev / "README.md"
        text = src.read_text() if src.exists() else ""
        new = insert_banner(text, redirect_banner(axis, repo, rev, by_repo.get(repo, [axis])))
        dst = stage_root / "redirects" / repo.replace("/", "__") / "README.md"
        dst.parent.mkdir(parents=True, exist_ok=True)
        dst.write_text(new)
        out.append((repo, dst))
    return out


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--stage-dir", default="gspc_stage")
    ap.add_argument("--cache-dir", default="gspc_cache")
    ap.add_argument("--readme", default="gspc_flagship_README.md")
    ap.add_argument("--validate", action="store_true", help="load every config with the datasets library")
    ap.add_argument("--allow-drift", action="store_true")
    ap.add_argument("--confirm", action="store_true", help="REQUIRED for any Hub write")
    ap.add_argument("--create-repo", action="store_true")
    ap.add_argument("--public", action="store_true", help="create the flagship public (default: private) — owner decision")
    ap.add_argument("--open-pr", action="store_true")
    ap.add_argument("--redirects", action="store_true")
    ap.add_argument("--force-redirects", action="store_true", help="skip the 'flagship merged' check")
    a = ap.parse_args()

    root = Path(a.stage_dir).resolve().parent
    stage_dir, cache = Path(a.stage_dir).resolve(), Path(a.cache_dir).resolve()
    api, _ = hub()
    drift = check_drift(api, a.allow_drift)
    plan = stage(stage_dir, cache, Path(a.readme))
    check_readme_configs(stage_dir)
    with open(root / "plan.csv", "w", newline="") as f:
        w = csv.DictWriter(f, fieldnames=list(plan[0].keys()))
        w.writeheader(); w.writerows(plan)
    previews = write_redirect_previews(root, cache)
    nfiles = sum(1 for p in stage_dir.rglob("*") if p.is_file())
    print(f"staged {nfiles} files ({len(plan)} copied) into {stage_dir}; plan.csv and "
          f"{len(previews)} redirect previews written; drift={len(drift)}")
    if a.validate:
        validate_with_datasets(stage_dir)

    wants_write = a.create_repo or a.open_pr or a.redirects
    if not wants_write:
        print("DRY RUN complete — nothing was written to the Hub.")
        return
    if not a.confirm:
        sys.exit("Refusing Hub writes without --confirm (dry-run is the default).")
    if not os.environ.get("HF_TOKEN"):
        sys.exit("HF_TOKEN is not set.")

    from huggingface_hub import CommitOperationAdd
    if a.create_repo:
        if api.repo_exists(FLAGSHIP, repo_type="dataset"):
            print(f"{FLAGSHIP} exists; not creating")
        else:
            api.create_repo(FLAGSHIP, repo_type="dataset", private=not a.public)
            print(f"created {FLAGSHIP} (private={not a.public})")
    if a.open_pr:
        ops = [CommitOperationAdd(path_in_repo=p.relative_to(stage_dir).as_posix(), path_or_fileobj=str(p))
               for p in sorted(stage_dir.rglob("*")) if p.is_file()]
        info = api.create_commit(FLAGSHIP, repo_type="dataset", operations=ops, create_pr=True,
                                 commit_message="Consolidate GSPC per-axis banks into one dataset (one config per axis)",
                                 commit_description=f"{len(ops)} files. Source pins and hashes: axes/*/SOURCE.json, SHA256SUMS.")
        print("flagship PR:", info.pr_url)
    if a.redirects:
        if not a.force_redirects:
            try:
                from huggingface_hub import hf_hub_download
                card = Path(hf_hub_download(FLAGSHIP, "README.md", repo_type="dataset")).read_text()
                if "config_name: governance" not in card:
                    raise RuntimeError("configs not on main")
            except Exception as e:  # noqa: BLE001
                sys.exit(f"Flagship not merged on main yet ({e}); merge the flagship PR first or pass --force-redirects.")
        for repo, path in previews:
            info = api.create_commit(repo, repo_type="dataset", create_pr=True,
                                     operations=[CommitOperationAdd(path_in_repo="README.md", path_or_fileobj=str(path))],
                                     commit_message="Card: point to the consolidated csoai/gspc dataset",
                                     commit_description="Prepends a redirect banner; no data file is changed.")
            print("redirect PR:", repo, info.pr_url)


if __name__ == "__main__":
    main()
