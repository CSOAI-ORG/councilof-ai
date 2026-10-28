#!/usr/bin/env python3
"""Keep the csoai Hugging Face dataset cards' metadata and live counts honest.

Runs after every successful deploy (hf-gspc-surface-sync.yml). For each listed dataset it reads
the card that is live on the Hub, rewrites only the fields this script owns, and commits only
if the bytes changed.

Owned fields:
  * YAML `configs:` (or `viewer: false` when no file is tabular) so the Dataset Viewer either
    renders or says plainly that there is no table, never an error page.
  * YAML `# TODO` comment lines are removed.
  * csoai/gspc-board only: the block between GSPC-LIVE-COUNTS markers, read live from
    councilof.ai at run time. Every count is its own line and none are added together.
    Counts awaiting a Measure ruling (capsules, chain cards) are deliberately not printed.
    The stale "16 card_index axes" totals line and September card-root links are removed.

No prices, no partnership claims and no "certif..." wording are ever written.
"""
from __future__ import annotations

import argparse, json, os, re, sys, urllib.request

UA = "csoai-hf-card-metadata/1 (+https://github.com/CSOAI-ORG/councilof-ai)"
BOARD_URL = "https://councilof.ai/api/gspc"
CARD_ROOT_POINTER = "https://councilof.ai/interop/card-root-latest.json"
CARD_INDEX_URL = "https://councilof.ai/signed/card_index.json"
# Measure ruling 2026-10-16: the capsule total is the newest signed DAILY index in
# csoai/evidence-index measurement-index/<date>/, not v0.2/index.signed.json (stale).
# root.json card_count counts XRPL/notice coverage leaves and is never shown as cards.
EVIDENCE_TREE = "https://huggingface.co/api/datasets/csoai/evidence-index/tree/main/measurement-index"
EVIDENCE_RAW = "https://huggingface.co/datasets/csoai/evidence-index/resolve/main/"
VERIFY = "https://councilof.ai/gspc-verify"
BANNED = re.compile(r"\b(certif\w*|partner(ship)?s? with|\$\s?\d)", re.IGNORECASE)

def cfg(*paths):
    return {"configs": [{"config_name": "default", "data_files": [{"split": "train", "path": list(paths) if len(paths) > 1 else paths[0]}]}]}

NO_VIEWER = {"viewer": False}

# Dataset -> metadata this script owns. Paths were read from the Hub tree on 2026-10-16.
TARGETS: dict[str, dict] = {
    "csoai/omai-bench": cfg("items.jsonl"),
    "csoai/gspc-leaderboard-results": cfg("results.csv"),
    "csoai/mcp-census": cfg("mcp_census.jsonl"),
    "csoai/agent-interop-census": cfg("census.jsonl"),
    "csoai/mcp-registry-self-audit": cfg("snapshots/*.jsonl"),
    "csoai/index-presence": cfg("2026-09-22/mcp-registry-servers.jsonl"),
    "csoai/mcp-trust-index": {**cfg("data.csv"), "pretty_name": "CSOAI MCP trust index"},
    "csoai/councilof-ai-evidence": cfg("cards/*.json"),
    # No tabular file: say so instead of showing a viewer error.
    "csoai/living-gspc-board-2026-09-14": NO_VIEWER,
    "csoai/attestation-network-2026-09-14": NO_VIEWER,
    "csoai/x402-free-discovery-2026-09-14": NO_VIEWER,
    "csoai/unified-evidence-factory-2026-09-19": NO_VIEWER,
    "csoai/cross-ledger-supply": NO_VIEWER,
    "csoai/fleet-status": NO_VIEWER,
    "csoai/evidence-index": NO_VIEWER,
    "csoai/eu-ecosystem-measurements": NO_VIEWER,
    "csoai/safe-findings-proposal": NO_VIEWER,
    "csoai/councilof-ai-mirror": NO_VIEWER,
    "csoai/disclosure-completeness": NO_VIEWER,
    "csoai/gspc-organism": NO_VIEWER,
    "csoai/gspc-board": {},  # live counts block only
    "csoai/measurement-capsules": {},  # live counts block; frozen 13,184 headline retired
}

START, END = "<!-- GSPC-LIVE-COUNTS:START -->", "<!-- GSPC-LIVE-COUNTS:END -->"

def get_json(url: str):
    req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept": "application/json"})
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.loads(r.read())

def get_card(repo: str) -> str:
    req = urllib.request.Request(f"https://huggingface.co/datasets/{repo}/resolve/main/README.md", headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=30) as r:
        return r.read().decode("utf-8")

def split_card(text: str) -> tuple[list[str], str]:
    if not text.startswith("---\n"):
        return [], text
    end = text.index("\n---", 4)
    return text[4:end].split("\n"), text[end + 4:].lstrip("\n")

def drop_keys(lines: list[str], keys: set[str]) -> list[str]:
    out, skipping = [], False
    for ln in lines:
        top = re.match(r"^([A-Za-z_][\w-]*):", ln)
        if top:
            skipping = top.group(1) in keys
        elif ln and not ln[0].isspace() and not ln.startswith("-") and not ln.startswith("#"):
            skipping = False
        if not skipping:
            out.append(ln)
    return out

def yaml_value(key: str, val) -> list[str]:
    if isinstance(val, bool):
        return [f"{key}: {'true' if val else 'false'}"]
    if isinstance(val, str):
        return [f"{key}: {json.dumps(val)}"]
    lines = [f"{key}:"]
    for c in val:
        lines.append(f"- config_name: {c['config_name']}")
        lines.append("  data_files:")
        for df in c["data_files"]:
            lines.append(f"  - split: {df['split']}")
            p = df["path"]
            if isinstance(p, list):
                lines.append("    path:")
                lines += [f"    - {json.dumps(x)}" for x in p]
            else:
                lines.append(f"    path: {json.dumps(p)}")
    return lines

def newest_capsule_index() -> tuple[int, str, str]:
    dates = sorted(f["path"].rsplit("/", 1)[-1] for f in get_json(EVIDENCE_TREE)
                   if f["type"] == "directory" and re.fullmatch(r"\d{4}-\d{2}-\d{2}", f["path"].rsplit("/", 1)[-1]))
    if not dates:
        raise SystemExit("refusing: no dated measurement-index found")
    d = dates[-1]
    path = f"measurement-index/{d}/measurement-index-v0.2-{d}.signed.json"
    payload = get_json(EVIDENCE_RAW + path)["payload"]
    n = payload["n_capsules_total"]
    if sum(b.get("n_capsules", b.get("count", 0)) for b in payload.get("batches", []) if isinstance(b, dict)) not in (0, n):
        raise SystemExit("refusing: capsule batches do not sum to n_capsules_total")
    return n, d, EVIDENCE_RAW + path


def live_counts() -> str:
    ptr = get_json(CARD_ROOT_POINTER)
    n_chain = get_json(CARD_INDEX_URL)["n_cards"]
    n_caps, caps_date, caps_url = newest_capsule_index()
    board = get_json(BOARD_URL)
    axes = board.get("axes") or []
    measured = sum(1 for a in axes if a.get("status") == "MEASURED")
    root_url = ptr["root_url"]
    if root_url.startswith("/"):
        root_url = "https://councilof.ai" + root_url
    as_of = ptr.get("as_of", "")
    lines = [
        START,
        "## Live counts",
        "",
        f"Read from councilof.ai when this card was last refreshed after a deploy. Each number counts a different collection, so they are never added together.",
        "",
        f"- **Board axes:** {measured} measured of {len(axes)} declared slots ([board JSON]({BOARD_URL}))",
        f"- **{n_chain:,} signed GSPC chain cards** ([card_index]({CARD_INDEX_URL}))",
        f"- **{ptr['n_leaves']:,} signed mill cards** in the {as_of[:10]} Merkle root",
        f"- **{n_caps:,} signed measurement capsules**, daily index {caps_date} ([signed index]({caps_url}))",
        f"- **Latest card root:** [{root_url.rsplit('/', 1)[-1]}]({root_url}) · as of {as_of} · sha256 `{ptr.get('root_sha256', '')}`",
        f"- **Verify any card, free:** <{VERIFY}>",
        "",
        "Measurement, not a grade or endorsement.",
        END,
    ]
    return "\n".join(lines)

DATED_ROOT_LINE = (f"- **Dated card root:** [discovery pointer]({CARD_ROOT_POINTER}) — always names the latest dated "
                   "root JSON and its OpenTimestamps proof; see Live counts above.")


def fix_board_body(body: str, block: str) -> str:
    body = "\n".join(ln for ln in body.split("\n") if not re.search(r"\b\d+\s+card_index axes\b", ln))
    # Point any September dated card-root link at the live pointer instead.
    body = "\n".join(
        DATED_ROOT_LINE if ln.startswith("- **Dated card root:**") and "card-root-2026-09-" in ln else ln
        for ln in body.split("\n"))
    body = re.sub(r"https://councilof\.ai/interop/card-root-2026-09-[\w.-]+", CARD_ROOT_POINTER, body)
    if START in body and END in body:
        body = re.sub(re.escape(START) + r".*?" + re.escape(END), lambda _m: block, body, flags=re.S)
    else:
        parts = body.split("\n## ", 1)
        body = parts[0].rstrip("\n") + "\n\n" + block + "\n" + ("\n## " + parts[1] if len(parts) > 1 else "")
    return body

CAPS_STALE = re.compile(r"Read from the signed index payload \(`v0\.2/index\.signed\.json` → `payload`\): \*\*[\d,]+ capsules in\s+(\d+) batches\*\*")


def fix_capsules_body(body: str, block: str) -> str:
    body = CAPS_STALE.sub(lambda m: f"The batch table below is a frozen snapshot of `v0.2/index.signed.json` → `payload` "
                          f"({m.group(1)} batches); the current total is under Live counts", body)
    return fix_board_body(body, block)


def render(repo: str, text: str, owned: dict, block: str | None) -> str:
    meta, body = split_card(text)
    meta = [ln for ln in meta if not ln.lstrip().startswith("# TODO")]
    if owned:
        meta = drop_keys(meta, set(owned) | ({"configs"} if "viewer" in owned else {"viewer"} if "configs" in owned else set()))
        while meta and not meta[-1].strip():
            meta.pop()
        for k, v in owned.items():
            meta += yaml_value(k, v)
    if repo == "csoai/gspc-board" and block:
        body = fix_board_body(body, block)
    if repo == "csoai/measurement-capsules" and block:
        body = fix_capsules_body(body, block)
    out = "---\n" + "\n".join(meta) + "\n---\n\n" + body
    if block and BANNED.search(block):
        raise SystemExit("refusing: generated counts block contains banned wording")
    return out

def main(argv=None) -> int:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--dry-run", action="store_true")
    ap.add_argument("--out", help="write rendered cards here (for review)")
    a = ap.parse_args(argv)
    block = live_counts()
    api = None
    if not a.dry_run:
        token = os.environ.get("HF_TOKEN")
        if not token:
            print("HF_TOKEN is empty; refusing publish", file=sys.stderr)
            return 2
        from huggingface_hub import HfApi
        api = HfApi(token=token)
    changed = 0
    for repo, owned in TARGETS.items():
        try:
            cur = get_card(repo)
        except Exception as e:
            print(f"{repo}: SKIP (read failed: {e})")
            continue
        new = render(repo, cur, owned, block)
        if a.out:
            os.makedirs(a.out, exist_ok=True)
            open(os.path.join(a.out, repo.split("/")[1] + ".md"), "w").write(new)
        if new == cur:
            print(f"{repo}: unchanged")
            continue
        changed += 1
        if a.dry_run:
            print(f"{repo}: would update")
            continue
        api.upload_file(path_or_fileobj=new.encode("utf-8"), path_in_repo="README.md", repo_id=repo,
                        repo_type="dataset", commit_message="hf-card-metadata: viewer configs and live counts after deploy")
        print(f"{repo}: updated")
    print(f"{changed} card(s) {'would change' if a.dry_run else 'changed'}")
    return 0

if __name__ == "__main__":
    sys.exit(main())
