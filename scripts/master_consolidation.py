#!/usr/bin/env python3
"""One master index of everything CSOAI holds, across every surface, committed to a single root.

WHAT THIS IS
  A census. For each artifact it records where it lives, what it is, and a digest, then commits
  the whole set to one Merkle root so a reader can prove any single entry was in the set when the
  root was stamped.

WHAT THE DIGEST COVERS — two classes, never mixed, never added together.
  bytes_leaf   sha256 of the artifact's OWN bytes. We read the file. Inclusion proves those exact
               bytes were in the set.
  record_leaf  sha256 of OUR canonical record ABOUT a remote artifact we did not download (a
               repository on another host, say). Inclusion proves we recorded that identity and
               revision at that time. It proves NOTHING about the remote bytes, which can change
               under us without breaking anything here.

WHAT THIS IS NOT
  Not signed. There is no key over this root, so it says when, not who. It is therefore not
  Rekor-witnessable the way public/root.json is. It is not the signed card root and it does not
  replace public/root.json or public/signed/card_index.json, each of which commits to its own
  separate corpus (see council-os/CARD-CORPORA.md).
  INDEXED is not MEASURED. Counting an artifact here says we found it, never that it was measured.

Merkle rule: leaf = sha256(bytes). Pairs hashed in order; an odd node is carried up unchanged,
never duplicated. The rule is restated in the artifact so a stranger can recompute the root.
"""
import argparse, hashlib, json, pathlib, re, sys, datetime

# Some identifiers carry internal codenames that scripts/brand-gate.mjs forbids on any public
# surface. Dropping those entries would make the census lie by omission, so the entry STAYS and
# only its human-readable identifier is withheld. The digest is untouched: it still commits to the
# full record including the real identifier, so anyone holding that identifier can recompute the
# leaf and check its inclusion. The withheld count is published so the omission is visible.
INTERNAL_CODENAME = re.compile(r"\b(sovos|sov3\d*|dorado|cibola|ceasai)\b", re.I)

def sha256b(b: bytes) -> str: return hashlib.sha256(b).hexdigest()
def canon(o) -> bytes: return json.dumps(o, sort_keys=True, separators=(",", ":"), ensure_ascii=True).encode()

def merkle(leaves):
    if not leaves: return "", []
    levels=[list(leaves)]; cur=list(leaves)
    while len(cur)>1:
        nxt=[sha256b(bytes.fromhex(cur[i])+bytes.fromhex(cur[i+1])) for i in range(0,len(cur)-1,2)]
        if len(cur)%2: nxt.append(cur[-1])
        levels.append(nxt); cur=nxt
    return cur[0], levels

def proof_for(index, levels):
    path, idx = [], index
    for lvl in levels[:-1]:
        if idx%2==0:
            if idx+1 < len(lvl): path.append({"side":"right","hash":lvl[idx+1]})
        else: path.append({"side":"left","hash":lvl[idx-1]})
        idx//=2
    return path

def verify(leaf, path, root):
    cur=leaf
    for step in path:
        cur = sha256b(bytes.fromhex(step["hash"])+bytes.fromhex(cur)) if step["side"]=="left" \
              else sha256b(bytes.fromhex(cur)+bytes.fromhex(step["hash"]))
    return cur==root

def main():
    ap=argparse.ArgumentParser()
    ap.add_argument("--inputs",required=True,help="directory holding the mined surface files")
    ap.add_argument("--out",required=True)
    ap.add_argument("--summary-out",dest="summary_out",help="a small entries-free summary safe to import into a Worker bundle")
    ap.add_argument("--selftest",action="store_true")
    a=ap.parse_args()
    if a.selftest:
        ls=[sha256b(bytes([i])) for i in range(7)]
        r,lv=merkle(ls)
        assert all(verify(ls[i],proof_for(i,lv),r) for i in range(7)), "inclusion proof failed"
        bad=sha256b(b"not in the set")
        assert not verify(bad,proof_for(0,lv),r), "a leaf outside the set verified — the check is vacuous"
        print("selftest OK: 7/7 leaves verify; a leaf outside the set does not"); return 0

    d=pathlib.Path(a.inputs); entries=[]
    def add(surface,kind,ident,digest,leaf_class,**extra):
        entries.append({"surface":surface,"kind":kind,"id":ident,"digest":digest,
                        "leaf_class":leaf_class,"state":"INDEXED",**extra})

    for r in json.loads((d/"hf.json").read_text()):
        rec={"surface":"huggingface","kind":r["kind"],"id":r["id"],"revision":r.get("sha"),
             "private":r.get("private"),"last_modified":r.get("lastModified")}
        add("huggingface",r["kind"],r["id"],sha256b(canon(rec)),"record_leaf",
            revision=r.get("sha"),private=r.get("private"),url=r.get("url"))
    for r in json.loads((d/"gh_org.json").read_text()):
        rec={"surface":"github","kind":"repository","id":"CSOAI-ORG/"+r["name"],
             "visibility":r["visibility"],"updated_at":r.get("updatedAt")}
        add("github","repository","CSOAI-ORG/"+r["name"],sha256b(canon(rec)),"record_leaf",
            visibility=r["visibility"],url=r.get("url"))
    kp=d/"kaggle.json"
    if kp.exists():
        for r in json.loads(kp.read_text()):
            rec={"surface":"kaggle","kind":"dataset","id":r.get("ref"),"total_bytes":r.get("totalBytes")}
            add("kaggle","dataset",r.get("ref"),sha256b(canon(rec)),"record_leaf",title=r.get("title"))
    op=d/"oracle.json"
    if op.exists():
        for r in json.loads(op.read_text()):
            rec={"surface":"oracle_object_storage","kind":"object","id":r["name"],
                 "bytes":r.get("size"),"etag":r.get("etag"),"md5":r.get("md5")}
            add("oracle_object_storage","object",r["name"],sha256b(canon(rec)),"record_leaf",
                bytes=r.get("size"),
                digest_covers="our record of the object identity, size and the store's own md5; we did not download 14 GB to hash it ourselves")
    dp=d/"docs.json"
    if dp.exists():
        for r in json.loads(dp.read_text()):
            add("repo","written_document",r["path"],r["sha256"],"bytes_leaf",bytes=r["bytes"])
    for r in json.loads((d/"banks.json").read_text()):
        if r.get("sha256"):
            add("huggingface","frozen_question_bank",r["bank"],r["sha256"],"bytes_leaf",
                items=r["items"],bytes=r["bytes"],
                digest_covers="the exact bytes of items.jsonl as read at build time")
    for r in json.loads((d/"repo.json").read_text()):
        add("repo",r["group"],r["path"],r["sha256"],"bytes_leaf",bytes=r["bytes"])

    # Every string field is checked, not only the identifier: a codename hides just as easily in a
    # title or a URL, and a gate that looked at one field would pass while the artifact still leaked.
    withheld = 0
    for e in entries:
        hit = any(isinstance(v, str) and INTERNAL_CODENAME.search(v) for k, v in e.items() if k != "digest")
        if not hit:
            continue
        withheld += 1
        e["id_withheld"] = True
        for k in list(e):
            if k in ("digest", "leaf_class", "state", "surface", "kind", "id_withheld"):
                continue
            if isinstance(e[k], str) and INTERNAL_CODENAME.search(e[k]):
                e[k] = "<withheld: internal codename>"
        e["id"] = ("<identifier withheld: it carries an internal codename that may not appear on a "
                   "public surface; the digest still commits to the full record, so a holder of the "
                   f"real identifier can recompute this leaf> {e['digest'][:12]}")

    entries.sort(key=lambda e:(e["surface"],e["kind"],e["id"]))
    leaves=[e["digest"] for e in entries]
    root,levels=merkle(leaves)
    checked=[i for i in range(0,len(entries),max(1,len(entries)//200))]
    verified=sum(1 for i in checked if verify(leaves[i],proof_for(i,levels),root))
    control_ok = not verify(sha256b(b"deliberately absent"),proof_for(0,levels),root)

    from collections import Counter
    by_surface=Counter(e["surface"] for e in entries)
    by_class=Counter(e["leaf_class"] for e in entries)
    art={
      "artifact":"master-consolidation",
      "as_of": datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
      "what_this_is":"A census of every artifact CSOAI holds across every surface, committed to one Merkle root.",
      "what_the_root_proves":"That these exact entries were in this set when the root was stamped. Nothing else.",
      "what_this_is_not":[
        "Not signed. No key is applied, so the root says when, not who.",
        "Not Rekor-witnessable: that witness uploads a signature, and there is no signature here.",
        "Not a replacement for public/root.json or public/signed/card_index.json, which commit to their own separate corpora.",
        "INDEXED is not MEASURED. An entry here means we found the artifact, never that it was measured."],
      "leaf_classes":{
        "bytes_leaf":"sha256 of the artifact's own bytes, which we read. Inclusion proves those bytes were in the set.",
        "record_leaf":"sha256 of our canonical record about a remote artifact we did not download. Inclusion proves we recorded that identity and revision at that time, and proves nothing about the remote bytes."},
      "merkle_rule":"leaf = sha256(bytes); pairs hashed in order; an odd node is carried up unchanged, never duplicated",
      "totals":{"entries":len(entries),
                "bytes_leaves":by_class["bytes_leaf"],
                "record_leaves":by_class["record_leaf"],
                "by_surface":dict(sorted(by_surface.items())),
                "never_add_these":"bytes_leaves and record_leaves answer different questions; report both, never their sum as one number"},
      "identifiers_withheld":{
        "count":withheld,
        "rule":"An identifier carrying an internal codename is replaced by a marker. The entry is NOT dropped and its digest is NOT recomputed, so the leaf still commits to the real record and inclusion can still be proved by anyone who holds the real identifier.",
        "why":"scripts/brand-gate.mjs blocks internal codenames on every public surface, and a census that quietly dropped them would understate the estate."},
      "merkle_root":root,
      "inclusion_self_check":{"sampled":len(checked),"verified":verified,
        "a_leaf_outside_the_set_is_rejected":control_ok},
      "entries":entries}
    pathlib.Path(a.out).write_text(json.dumps(art,indent=2,sort_keys=False)+"\n")
    if a.summary_out:
        summary={k:v for k,v in art.items() if k!="entries"}
        summary["full_artifact"]="/"+str(pathlib.Path(a.out)).split("public/",1)[-1]
        summary["entries_are_not_here"]=("The 6,000-plus entries live in the full artifact. This summary exists so the "
            "live API can quote the root and the counts without bundling the whole index.")
        pathlib.Path(a.summary_out).write_text(json.dumps(summary,indent=2)+"\n")
    print(f"entries {len(entries)}  bytes_leaves {by_class['bytes_leaf']}  record_leaves {by_class['record_leaf']}")
    print("by surface:",dict(sorted(by_surface.items())))
    print(f"merkle_root {root}")
    print(f"inclusion self-check: {verified}/{len(checked)} sampled leaves verify; control rejected = {control_ok}")
    return 0 if verified==len(checked) and control_ok else 2

if __name__=="__main__": sys.exit(main())
