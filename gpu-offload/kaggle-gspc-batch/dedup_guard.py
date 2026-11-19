#!/usr/bin/env python3
"""Fail closed if a batch would re-run a model that already has a run of record.

Measure's rule (15 Oct): identical-method re-runs of an existing model x axis are
duplicates and are never signed. A batch may contain only models new to GSPC.
The excluded list is the G2 group and the B1014 newmodels entries.
"""
from __future__ import annotations

import re
import sys

EXCLUDED = {
    # G2 (B1014-G2-ties), all 31 live G2 cards come from these
    "mistral:7b", "deepseek-r1:8b", "gemma3:12b", "qwen2.5:3b", "llama3.2:3b", "qwen2.5:0.5b", "qwen3:8b", "qwen2.5:7b",
}
EXCLUDED_FAMILIES = ("lfm2.5", "ternary-bonsai", "bonsai", "mimo", "deepseek-v4")
MOVING_ALIASES = (":latest",)
HF_PINNED_RE = re.compile(
    r"^hf:([A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+)@([0-9a-f]{40})[:/]([A-Za-z0-9_.-]+\.gguf)$"
)


def check(path: str) -> list[str]:
    errs, seen = [], set()
    with open(path) as f:
        head = f.readline().rstrip("\n").split("\t")
        need = {"tag", "ollama_manifest_sha256"}
        if not need <= set(head):
            return [f"missing columns {need - set(head)}"]
        for n, line in enumerate(f, 2):
            if not line.strip():
                continue
            r = dict(zip(head, line.rstrip("\n").split("\t")))
            raw_tag = r["tag"]
            d = r["ollama_manifest_sha256"]
            if raw_tag.startswith("hf:"):
                m = HF_PINNED_RE.fullmatch(raw_tag)
                if not m:
                    errs.append(f"line {n}: {raw_tag} is a moving alias or invalid hf:gguf pin (requires @<40-hex-commit>/<file>.gguf)")
                    tag_key = raw_tag
                    repo_tail = raw_tag.removeprefix("hf:").lower()
                else:
                    repo, commit, fname = m.groups()
                    tag_key = f"hf:{repo}@{commit}/{fname}"
                    repo_tail = repo.split("/", 1)[-1].lower()
                if tag_key in seen:
                    errs.append(f"line {n}: duplicate {raw_tag}")
                seen.add(tag_key)
                if repo_tail.startswith(EXCLUDED_FAMILIES):
                    errs.append(f"line {n}: {raw_tag} is a B1014 newmodels entry")
            else:
                tag = raw_tag.removeprefix("ollama:")
                if tag in seen:
                    errs.append(f"line {n}: duplicate {tag}")
                seen.add(tag)
                if tag in EXCLUDED:
                    errs.append(f"line {n}: {tag} already has a run of record (G2)")
                if tag.lower().startswith(EXCLUDED_FAMILIES):
                    errs.append(f"line {n}: {tag} is a B1014 newmodels entry")
                if tag.endswith(MOVING_ALIASES) or ":" not in tag:
                    errs.append(f"line {n}: {tag} is a moving alias")
            if len(d) != 64 or any(c not in "0123456789abcdef" for c in d):
                errs.append(f"line {n}: {raw_tag} digest is not a full sha256")
    return errs


if __name__ == "__main__":
    e = check(sys.argv[1])
    for x in e:
        print("DEDUP_FAIL", x)
    print("dedup PASS" if not e else f"dedup FAIL ({len(e)})")
    sys.exit(1 if e else 0)
