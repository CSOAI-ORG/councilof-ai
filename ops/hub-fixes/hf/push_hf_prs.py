#!/usr/bin/env python3
"""Open one Hugging Face pull request per repo from the csoai card-fix bundle.

Safe by default:
  * --dry-run is the DEFAULT. Nothing is written unless you pass --apply.
  * Every write uses create_pr=True. Nothing is committed to main.
  * A repo is skipped when its proposed README.md equals the live one, or when
    the manifest marks it as unchanged / skipped.
  * Stale-base guard: before opening a PR, the live README is re-downloaded and
    its sha256 compared with the one recorded when the bundle was built. On a
    mismatch the repo is skipped unless --allow-stale is given.
  * Gated repos (mcp-census, mcp-trust-index, councilof-ai-mirror) get no
    README in the bundle, because the anonymous bundle build could not read
    them. They are always skipped.

Usage:
  export HF_TOKEN=hf_...            # write token for csoai / Nicholastempleman
  python push_hf_prs.py --bundle hf_fix_bundle            # dry run, prints the plan
  python push_hf_prs.py --bundle hf_fix_bundle --only csoai/councilof-ai-evidence --apply
  python push_hf_prs.py --bundle hf_fix_bundle --apply --limit 10

Bundle layout: <bundle>/<owner>__<name>__<kind>/README.md and README.diff, plus
<bundle>/hf_fix_manifest.csv (or pass --manifest).
"""
import argparse, csv, hashlib, os, sys, time

PR_TITLE = "Card fixes (README only): metadata, citation, limitations"


def sha256(b):
    return hashlib.sha256(b).hexdigest()


def pr_description(row):
    changes = [c.strip() for c in (row.get("changes") or "").split(";") if c.strip()]
    owner = [c.strip() for c in (row.get("needs_owner_ruling") or "").split(";") if c.strip()]
    lines = [
        "This PR only edits `README.md`, the repository card. It does not touch data files.",
        "",
        "Changes:",
    ]
    lines += [f"- {c}" for c in changes] or ["- (none)"]
    lines += ["", f"Validated with huggingface_hub `RepoCard.validate`: {row.get('validated')}."]
    if row.get("kind") == "dataset":
        lines += [f"Proposed configs loaded locally with `datasets`: {row.get('verified_load')}."]
    if owner:
        lines += ["", "Needs an owner ruling before merge:"] + [f"- {o}" for o in owner]
    lines += ["", "Existing YAML keys and body text are preserved. Additions sit between the "
              "`<!-- csoai-card-fixes:start -->` and `<!-- csoai-card-fixes:end -->` markers.",
              "", "Measurement is not certification. Front door: https://councilof.ai"]
    return "\n".join(lines)


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--bundle", default="hf_fix_bundle")
    ap.add_argument("--manifest", default=None)
    g = ap.add_mutually_exclusive_group()
    g.add_argument("--dry-run", dest="apply", action="store_false", default=False, help="default: only print the plan")
    g.add_argument("--apply", dest="apply", action="store_true", help="actually open PRs (create_pr=True)")
    ap.add_argument("--only", nargs="*", default=None, help="repo ids to include")
    ap.add_argument("--kind", choices=["dataset", "model", "space"], default=None)
    ap.add_argument("--limit", type=int, default=None)
    ap.add_argument("--wave", default="wave1", help="manifest wave: wave1 (default), wave2-owner, or all")
    ap.add_argument("--allow-stale", action="store_true", help="open PR even if live README changed since bundle build")
    ap.add_argument("--sleep", type=float, default=2.0, help="seconds between PRs")
    a = ap.parse_args()

    from huggingface_hub import HfApi, hf_hub_download
    token = os.environ.get("HF_TOKEN")
    if a.apply and not token:
        sys.exit("HF_TOKEN is not set; refusing to --apply.")
    api = HfApi(token=token)

    man = a.manifest or os.path.join(a.bundle, "hf_fix_manifest.csv")
    rows = list(csv.DictReader(open(man, newline="", encoding="utf-8")))
    n_plan = n_skip = n_done = n_err = 0
    for row in rows:
        rid, kind = row["repo"], row["kind"]
        if a.only and rid not in a.only:
            continue
        if a.kind and kind != a.kind:
            continue
        if a.wave != "all" and row.get("wave", "wave1") != a.wave:
            continue
        if row.get("status") != "changed":
            n_skip += 1
            print(f"SKIP  {kind:7s} {rid}: status={row.get('status')}")
            continue
        folder = os.path.join(a.bundle, row["folder"])
        path = os.path.join(folder, "README.md")
        if not os.path.exists(path):
            n_skip += 1
            print(f"SKIP  {kind:7s} {rid}: no README.md in bundle")
            continue
        new = open(path, "rb").read()
        try:
            live_p = hf_hub_download(rid, "README.md", repo_type=kind, token=token, force_download=True)
            live = open(live_p, "rb").read()
        except Exception as e:
            live = None
            if row.get("live_sha256"):
                print(f"WARN  {kind:7s} {rid}: could not re-read live README ({type(e).__name__})")
        if live is not None and live == new:
            n_skip += 1
            print(f"SKIP  {kind:7s} {rid}: proposed README identical to live")
            continue
        if row.get("live_sha256") and live is not None and sha256(live) != row["live_sha256"] and not a.allow_stale:
            n_skip += 1
            print(f"STALE {kind:7s} {rid}: live README changed since bundle build; rebuild or pass --allow-stale")
            continue
        n_plan += 1
        if a.limit and n_plan > a.limit:
            break
        if not a.apply:
            print(f"PLAN  {kind:7s} {rid}: PR '{PR_TITLE}' ({len(new)} bytes)")
            continue
        try:
            info = api.upload_file(path_or_fileobj=new, path_in_repo="README.md", repo_id=rid, repo_type=kind,
                                   commit_message=PR_TITLE, commit_description=pr_description(row),
                                   create_pr=True)
            n_done += 1
            print(f"PR    {kind:7s} {rid}: {getattr(info, 'pr_url', info)}")
            time.sleep(a.sleep)
        except Exception as e:
            n_err += 1
            print(f"ERROR {kind:7s} {rid}: {type(e).__name__}: {str(e)[:200]}")
    mode = "APPLY" if a.apply else "DRY-RUN"
    print(f"\n[{mode}] planned={n_plan} opened={n_done} skipped={n_skip} errors={n_err}")


if __name__ == "__main__":
    main()
