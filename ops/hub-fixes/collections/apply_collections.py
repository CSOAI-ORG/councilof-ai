#!/usr/bin/env python3
"""apply_collections.py — reduce the csoai Hugging Face collections from 10 to 3.

Reads collections_plan.csv (same folder). DRY RUN by default: prints every step and checks it
against the live collection state; nothing is changed. Writes need --confirm and HF_TOKEN.

Order of operations (safe order — nothing is deleted until the 3 kept collections are complete):
  1. keep_update_metadata   retitle / re-describe the 3 kept collections (slugs and URLs are preserved)
  2. add_item / update_item set items, notes and order in the kept collections
  3. remove_item            drop items that no longer belong in a kept collection
  4. delete_collection      delete the other 7 collections  (only with --confirm --delete)

Rows with requires_flagship=True (csoai/gspc) are skipped until that dataset exists on the Hub.

Usage
  python apply_collections.py                       # dry run
  HF_TOKEN=... python apply_collections.py --confirm            # steps 1-3
  HF_TOKEN=... python apply_collections.py --confirm --delete   # steps 1-4
"""
from __future__ import annotations

import argparse, csv, os, sys
from pathlib import Path

ORDER = ["keep_update_metadata", "add_item", "update_item", "remove_item", "delete_collection"]


def load_plan(path: Path) -> list[dict]:
    with open(path, newline="") as f:
        rows = list(csv.DictReader(f))
    for r in rows:
        r["requires_flagship"] = r.get("requires_flagship") in ("True", "true", "1")
        r["position"] = int(float(r["position"])) if r.get("position") not in (None, "") else None
    return sorted(rows, key=lambda r: (ORDER.index(r["action"]), int(r["step"])))


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--plan", default=str(Path(__file__).with_name("collections_plan.csv")))
    ap.add_argument("--confirm", action="store_true", help="REQUIRED to change anything on the Hub")
    ap.add_argument("--delete", action="store_true", help="also delete the 7 retired collections")
    a = ap.parse_args()

    from huggingface_hub import HfApi
    api = HfApi(token=os.environ.get("HF_TOKEN"))
    write = a.confirm
    if write and not os.environ.get("HF_TOKEN"):
        sys.exit("HF_TOKEN is not set.")
    flagship_exists = api.repo_exists("csoai/gspc", repo_type="dataset")
    plan = load_plan(Path(a.plan))
    live = {}

    def coll(slug):
        if slug not in live:
            live[slug] = api.get_collection(slug)
        return live[slug]

    def find_obj(slug, item_type, item_id):
        for it in coll(slug).items:
            if it.item_type == item_type and it.item_id == item_id:
                return it.item_object_id
        return None

    done = skipped = errors = 0
    for r in plan:
        act, slug = r["action"], r["collection_slug"]
        tag = f"[{r['step']:>3}] {act:21s} {slug.split('/')[-1][:48]:48s} {r.get('item_id') or ''}"
        if r["requires_flagship"] and not flagship_exists:
            print(tag, "SKIP (csoai/gspc does not exist yet)"); skipped += 1; continue
        if act == "delete_collection" and errors:
            print(tag, f"SKIP delete: {errors} earlier step(s) failed; fix those first"); skipped += 1; continue
        if act == "delete_collection" and not flagship_exists and any(x.get("requires_flagship") in ("True", True) for x in plan):
            print(tag, "SKIP delete: flagship-dependent items are not in place yet"); skipped += 1; continue
        if act == "delete_collection" and not a.delete:
            print(tag, "SKIP (needs --delete)"); skipped += 1; continue
        try:
            if act == "keep_update_metadata":
                c = coll(slug)
                print(tag, f"title: {c.title!r} -> {r['new_title']!r}; org-page position {r['position']}")
                if write:
                    api.update_collection_metadata(slug, title=r["new_title"], description=r["new_description"],
                                                   position=r["position"])
            elif act in ("add_item", "update_item"):
                oid = find_obj(slug, r["item_type"], r["item_id"])
                if oid is None:
                    print(tag, f"add at position {r['position']}")
                    if write:
                        c = api.add_collection_item(slug, r["item_id"], r["item_type"], note=r["note"], exists_ok=True)
                        live[slug] = c
                        oid = find_obj(slug, r["item_type"], r["item_id"])
                else:
                    print(tag, f"note + position {r['position']}")
                if write and oid:
                    api.update_collection_item(slug, oid, note=r["note"], position=r["position"])
            elif act == "remove_item":
                oid = find_obj(slug, r["item_type"], r["item_id"])
                print(tag, "remove" if oid else "already absent")
                if write and oid:
                    api.delete_collection_item(slug, oid, missing_ok=True)
            elif act == "delete_collection":
                n = len(coll(slug).items)
                print(tag, f"delete collection ({n} items now)")
                if write:
                    api.delete_collection(slug, missing_ok=True)
            done += 1
        except Exception as e:  # noqa: BLE001 — report and continue; nothing is retried blindly
            errors += 1
            print(tag, f"ERROR {type(e).__name__}: {str(e)[:200]}")
    print(f"{'APPLIED' if write else 'DRY RUN'}: {done} steps checked/applied, {skipped} skipped, {errors} errors. "
          f"flagship_exists={flagship_exists}")
    if errors:
        sys.exit(1)


if __name__ == "__main__":
    main()
