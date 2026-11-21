#!/usr/bin/env python3
"""
push_kaggle.py - publish the prepared Kaggle metadata + starter notebooks for nicktempleman.

SAFE BY DEFAULT. Without --confirm-publish it only prints what WOULD be published.
Kaggle has no pull-request workflow: `kaggle datasets metadata --update` and
`kaggle kernels push` change the live pages immediately.

Layout expected (kaggle_fix_bundle/):
  <slug>/dataset-metadata.json        full replacement metadata (title, subtitle, description,
                                      licenses, keywords, collaborators, expectedUpdateFrequency,
                                      userSpecifiedSources, resources/file + column descriptions)
  <slug>/live-metadata-at-prep.json   live metadata snapshot taken when the bundle was prepared
  <slug>/cover-proposal.png           optional cover; used only with --with-cover
  <slug>/FIELDS.md                    field reference (not uploaded)
  <slug>/notebook/{starter.ipynb,kernel-metadata.json}   top-20 datasets only
  kaggle_fix_manifest.csv             (next to the bundle) needs_owner_ruling etc.

Requirements: `pip install kaggle` (CLI >= 1.7), env KAGGLE_USERNAME + KAGGLE_KEY.

Examples
  python push_kaggle.py                                  # dry run, all datasets
  python push_kaggle.py --only csoai-gspc-board --diff   # dry run with field diff vs live
  python push_kaggle.py --only csoai-gspc-board --confirm-publish
  python push_kaggle.py --confirm-publish --notebooks --with-cover --accept-owner-rulings
"""
import argparse, csv, hashlib, json, os, shutil, subprocess, sys, tempfile, time
from pathlib import Path

OWNER = "nicktempleman"
UPDATED_FIELDS = ["title", "subtitle", "description", "isPrivate", "licenses", "keywords", "collaborators",
                  "expectedUpdateFrequency", "userSpecifiedSources", "resources"]

def live_metadata(ref):
    """Anonymous read of the live metadata (curl: Kaggle answers curl, not python-requests)."""
    out = subprocess.run(["curl", "-s", f"https://www.kaggle.com/api/v1/datasets/metadata/{ref}"],
                         capture_output=True, text=True, timeout=60)
    try:
        return json.loads(out.stdout).get("info")
    except Exception:
        return None

def comparable(info):
    """Fields the prep step read; used to detect edits made on Kaggle after the bundle was built."""
    if not info:
        return None
    keep = {k: info.get(k) for k in ["title", "subtitle", "description", "keywords", "expectedUpdateFrequency",
                                     "userSpecifiedSources", "collaborators"]}
    keep["licenses"] = [l.get("name") for l in info.get("licenses", [])]
    return hashlib.sha256(json.dumps(keep, sort_keys=True).encode()).hexdigest()

def summarize(meta):
    res = meta.get("resources", [])
    return {
        "title": meta["title"], "subtitle": meta["subtitle"], "licenses": [l["name"] for l in meta["licenses"]],
        "keywords": meta["keywords"], "expectedUpdateFrequency": meta.get("expectedUpdateFrequency"),
        "userSpecifiedSources": meta.get("userSpecifiedSources", "")[:160],
        "description_chars": len(meta.get("description", "")),
        "resources": len(res), "resources_with_column_schema": sum(1 for r in res if "schema" in r),
        "collaborators": meta.get("collaborators", []), "isPrivate": meta.get("isPrivate", False),
    }

def diff(live, meta):
    lines = []
    if not live:
        return ["  (live metadata unavailable)"]
    pairs = [("title", live.get("title"), meta["title"]), ("subtitle", live.get("subtitle"), meta["subtitle"]),
             ("licenses", [l["name"] for l in live.get("licenses", [])], [l["name"] for l in meta["licenses"]]),
             ("keywords", live.get("keywords"), meta["keywords"]),
             ("expectedUpdateFrequency", live.get("expectedUpdateFrequency"), meta.get("expectedUpdateFrequency")),
             ("userSpecifiedSources", live.get("userSpecifiedSources"), meta.get("userSpecifiedSources")),
             ("description_chars", len(live.get("description") or ""), len(meta.get("description", "")))]
    for name, a, b in pairs:
        if a != b:
            lines.append(f"  ~ {name}: {json.dumps(a, ensure_ascii=False)[:200]}  ->  {json.dumps(b, ensure_ascii=False)[:200]}")
    lines.append(f"  ~ resources: {len(meta.get('resources', []))} file descriptions "
                 f"({sum(1 for r in meta.get('resources', []) if 'schema' in r)} with column schema)")
    return lines

def run(cmd):
    print("    $", " ".join(cmd))
    p = subprocess.run(cmd, capture_output=True, text=True)
    print("     ", (p.stdout + p.stderr).strip().replace("\n", "\n      "))
    return p.returncode == 0

def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--bundle", default=str(Path(__file__).with_name("kaggle_fix_bundle")))
    ap.add_argument("--manifest", default=str(Path(__file__).with_name("kaggle_fix_manifest.csv")))
    ap.add_argument("--only", nargs="*", help="dataset slugs to include (default: all)")
    ap.add_argument("--dry-run", action="store_true", default=True, help="default; print only")
    ap.add_argument("--confirm-publish", action="store_true", help="actually publish to Kaggle (live, no PR)")
    ap.add_argument("--diff", action="store_true", help="fetch live metadata anonymously and show field changes")
    ap.add_argument("--notebooks", action="store_true", help="also push starter notebooks (kernels push)")
    ap.add_argument("--with-cover", action="store_true", help="also upload cover-proposal.png as dataset image")
    ap.add_argument("--accept-owner-rulings", action="store_true",
                    help="publish datasets whose manifest lists a needs_owner_ruling (licence / update frequency)")
    ap.add_argument("--force-stale", action="store_true",
                    help="publish even if the live page changed after the bundle was prepared")
    ap.add_argument("--sleep", type=float, default=2.0, help="seconds between API calls")
    a = ap.parse_args()
    publish = a.confirm_publish

    bundle = Path(a.bundle)
    rulings = {}
    if Path(a.manifest).exists():
        with open(a.manifest, newline="", encoding="utf-8") as fh:
            for row in csv.DictReader(fh):
                rulings[row["ref"]] = [x for x in (row.get("needs_owner_ruling") or "").split(";") if x]

    if publish:
        user, key = os.environ.get("KAGGLE_USERNAME"), os.environ.get("KAGGLE_KEY")
        if not (user and key):
            sys.exit("KAGGLE_USERNAME and KAGGLE_KEY must be set to publish.")
        if user != OWNER:
            sys.exit(f"KAGGLE_USERNAME is {user!r}; these datasets belong to {OWNER!r}.")
        if shutil.which("kaggle") is None:
            sys.exit("kaggle CLI not found (pip install kaggle).")
        print("*** PUBLISH MODE: changes go live on kaggle.com immediately (no review step). ***")
    else:
        print("DRY RUN - nothing will be sent. Add --confirm-publish to publish.")

    folders = sorted(p for p in bundle.iterdir() if (p / "dataset-metadata.json").exists())
    if a.only:
        folders = [p for p in folders if p.name in set(a.only)]
    n_ok = n_skip = n_fail = 0
    for d in folders:
        meta = json.loads((d / "dataset-metadata.json").read_text(encoding="utf-8"))
        ref = meta["id"]
        if not ref.startswith(OWNER + "/"):
            print(f"[skip] {ref}: not owned by {OWNER}"); n_skip += 1; continue
        print(f"\n=== {ref}")
        print("  would update (full replacement of):", ", ".join(UPDATED_FIELDS))
        for k, v in summarize(meta).items():
            print(f"    {k}: {json.dumps(v, ensure_ascii=False)}")
        if a.with_cover and (d / "cover-proposal.png").exists():
            print("    image: cover-proposal.png -> dataset-cover-image.png")
        nbdir = d / "notebook"
        if a.notebooks and (nbdir / "kernel-metadata.json").exists():
            km = json.loads((nbdir / "kernel-metadata.json").read_text())
            print(f"    notebook: {km['id']} (public={km['is_private'] == 'false'}, sources={km['dataset_sources']})")
        pend = rulings.get(ref, [])
        if pend:
            print(f"    needs_owner_ruling: {', '.join(pend)}")
        live = None
        if a.diff or publish:
            live = live_metadata(ref); time.sleep(a.sleep)
        if a.diff:
            print("\n".join(diff(live, meta)))
        if not publish:
            continue
        # ---- publish guards ----
        if pend and not a.accept_owner_rulings:
            print("  [skip] owner ruling pending (use --accept-owner-rulings after deciding)"); n_skip += 1; continue
        snap = d / "live-metadata-at-prep.json"
        if snap.exists() and not a.force_stale:
            if comparable(live) != comparable(json.loads(snap.read_text(encoding="utf-8"))):
                print("  [skip] live page changed since prep (or unreadable); re-run prep or use --force-stale")
                n_skip += 1; continue
        if live and live.get("collaborators"):
            print("  [skip] live dataset has collaborators; bundle would remove them"); n_skip += 1; continue
        with tempfile.TemporaryDirectory() as tmp:
            shutil.copy(d / "dataset-metadata.json", Path(tmp) / "dataset-metadata.json")
            if a.with_cover and (d / "cover-proposal.png").exists():
                shutil.copy(d / "cover-proposal.png", Path(tmp) / "dataset-cover-image.png")
            ok = run(["kaggle", "datasets", "metadata", ref, "--update", "-p", tmp])
        time.sleep(a.sleep)
        if ok and a.notebooks and (nbdir / "kernel-metadata.json").exists():
            ok = run(["kaggle", "kernels", "push", "-p", str(nbdir)]); time.sleep(a.sleep)
        n_ok += ok; n_fail += (not ok)
    print(f"\n{len(folders)} dataset folders; published={n_ok} skipped={n_skip} failed={n_fail}"
          + ("" if publish else " (dry run)"))

if __name__ == "__main__":
    main()
