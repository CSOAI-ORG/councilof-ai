#!/usr/bin/env python3
"""HF mirror coverage — every public-root leaf must resolve on the mirror.

The evidence chain a stranger walks is: root.json commits card digests; /cards/<sha16>.json
redirects to the HF mirror; the verifier reads the bytes. When the mirror trails the root,
the middle of that chain 404s and the estate's own evidence is unreachable at its canonical
URL — which happened silently between 29 Oct and 1 Nov (68 of 331 leaves missing; found by
audit, repaired by hf-evidence-sync, and now watched here).

Method: read root.json's card_sha256 (the commitments), list the mirror's cards/ tree
(HF API, paginated), and compare 16-hex prefixes. A missing leaf is a finding, not a zero.

Exit codes: 0 coverage complete · 3 any leaf missing (run hf-evidence-sync, then re-probe)
· 4 either surface unreadable (a watchdog that cannot see must say so).
"""

import datetime
import json
import sys
import urllib.request
from datetime import timezone

ROOT_URL = "https://councilof.ai/root.json"
HF_TREE = "https://huggingface.co/api/datasets/csoai/councilof-ai-evidence/tree/main/cards"
UA = {"User-Agent": "csoai-watchdog/1"}


def read(url):
    return urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=30)


def main():
    try:
        root = json.load(read(ROOT_URL))
        leaves = set(s[:16] for s in root["card_sha256"])
        root_count = root.get("card_count")
    except Exception as exc:  # noqa: BLE001
        print(f"UNREADABLE root.json: {exc}")
        sys.exit(4)

    hf = set()
    url = HF_TREE
    try:
        while url:
            r = read(url)
            hf.update(x["path"].split("/")[1].replace(".json", "") for x in json.load(r) if x.get("type") == "file")
            link = r.headers.get("Link", "")
            url = link.split("<")[1].split(">")[0] if 'rel="next"' in link else None
    except Exception as exc:  # noqa: BLE001
        print(f"UNREADABLE mirror tree: {exc}")
        sys.exit(4)

    missing = sorted(leaves - hf)
    print(json.dumps({
        "schema": "csoai.hf-mirror-coverage/0.1",
        "checked_at": datetime.datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "root_leaves": len(leaves),
        "root_card_count_field": root_count,
        "mirror_files": len(hf),
        "missing": len(missing),
        "missing_prefixes": missing[:10],
    }))
    if missing:
        print(f"STALE MIRROR: {len(missing)} root leaf/leaves unreachable at the canonical URL — dispatch hf-evidence-sync, then re-probe")
        sys.exit(3)
    print("COVERAGE COMPLETE: every public-root leaf resolves on the mirror")


if __name__ == "__main__":
    main()
