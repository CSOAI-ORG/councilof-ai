#!/usr/bin/env python3
"""README-only hygiene for the csoai/* census datasets (26 Sep 2026). Data files are never touched.

For each dataset: fetch README.md at the current commit, apply named edits (each must match exactly once or the run stops),
write README.<name>.new.md for review, and with --publish commit ONLY README.md with the parent pinned, then prove every other
file's git blob id is identical before and after.

Edits: a named User-Agent in every verification snippet (csoai.org answers 403 to Python's default UA); an offline timestamp
check (`ots --no-bitcoin verify` + block-explorer merkle root); a "Contact, objections and re-checks" section; a BibTeX block
(Croissant citeAs); a2a-card-census: the viewer config points at the 0.1.1 rows.

  dataset-card-hygiene.py --out DIR [--only NAME] [--publish] [--hf-token FILE]
"""
import argparse, json, os, pathlib, sys

UA = "csoai-dataset-verify/1.0 (+https://huggingface.co/csoai)"
CONTACT = """## Contact, objections and re-checks

- **Contact:** nicholas@csoai.org (Council of AI / CSOAI). Please name this dataset and the {what} you mean.
- **Ask for a re-check.** Reply with the {what}. We re-measure it with the same read-only instrument and run a tamper
  control beside it (a deliberately altered copy must fail the same check, or the re-check does not count). A dated
  re-check record is published only with your knowledge. Published rows are never edited in place: a correction is a new,
  signed file that supersedes the old one, and both stay visible.
- **Object, or opt out of future {reads}.** Name the {what}. It is added to the exclusion list
  (`scripts/census/probe-exclusions.json` in the census code, dated, public), and the next run honours it before sending
  any request and records the skip by name. {enforcement}
- **Objections are recorded.** Every objection, opt-out and re-check request is logged with its date and what was done;
  nothing is removed silently.

<!-- OWNER: add acknowledgement time commitment if desired -->

"""
BY_HAND = ("The reader behind this dataset (`{reader}`) does not yet read that list in code; until it does, an entry is "
           "honoured by hand before the next run, and the skip is still recorded by name.")
OFFLINE = """
Without a Bitcoin node (a full `ots verify` needs one), check an upgraded proof offline and compare the merkle root with a
public block explorer (two independent ones is better):

```sh
# (a pending proof must first be upgraded: ots upgrade <proof>)
ots --no-bitcoin verify -f {file} {proof}
# -> "To verify manually, check that Bitcoin block H has merkleroot M"
B=$(curl -s -A "{ua}" https://mempool.space/api/block-height/H)
curl -s -A "{ua}" https://mempool.space/api/block/$B | python3 -c 'import sys,json;print(json.load(sys.stdin)["merkle_root"])'
# must print M; repeat against https://blockstream.info/api/...
```
"""
BIB = """## Citation

```bibtex
@misc{{{key},
  author       = {{{{Council of AI (CSOAI)}}}},
  title        = {{{title}}},
  year         = {{2026}},
  publisher    = {{Hugging Face}},
  howpublished = {{\\url{{https://huggingface.co/datasets/csoai/{name}}}}}
}}
```

"""
NAMED = 'urllib.request.Request("https://csoai.org/.well-known/did.json", headers={{"User-Agent": "{ua}"}})'.format(ua=UA)
DS = {
    "mcp-remote-census": {"what": "endpoint", "reads": "probing", "title": "Remote MCP endpoint census: measured read of 2026-09-25",
                          "enforcement": "The list is enforced in code by the probe that made this dataset (`scripts/census/mcp-remote-probe.py`), with a test and a must-fail control.",
                          "ts": ("record.v0.1.1.json", "record.v0.1.1.json.bitcoin.ots")},
    "a2a-card-census": {"what": "agent card URL or host", "reads": "probing", "title": "A2A agent card census: measured read of 2026-09-25",
                        "reader": "scripts/census/a2a-card-probe.py", "ts": ("record.json", "record.json.bitcoin.ots")},
    "hf-mcp-spaces-census": {"what": "Space id or endpoint", "reads": "probing", "title": "Hugging Face MCP Spaces census: measured read of 2026-09-25",
                             "reader": "the HF Spaces census probe", "ts": ("record.json", "record.json.bitcoin.ots")},
    "cross-ledger-supply": {"what": "contract, ledger or issuer page", "reads": "reads", "title": "Cross-ledger supply: issuer-listed deployments, 2026-09-25",
                            "reader": "scripts/readers/cross_ledger_funds.py",
                            "ts": ("interop/cross-ledger-usdc-2026-09-25.json", "interop/cross-ledger-usdc-2026-09-25.json.bitcoin.ots")},
    "evidence-index": {"what": "repository, package or item", "reads": "reads", "title": "CSOAI evidence index",
                       "reader": "build_evidence_index.py", "ts": ("index.json", "index.json.ots")},
}


def edit(name, md):
    d = DS[name]
    n = {"ua": 0}

    def rep(old, new, count=1):
        nonlocal md
        assert md.count(old) == count, (name, old[:70], md.count(old))
        md = md.replace(old, new)
    # 1. named User-Agent
    if 'urllib.request.urlopen("https://csoai.org/.well-known/did.json")' in md:
        rep('did = json.load(urllib.request.urlopen("https://csoai.org/.well-known/did.json"))',
            "# csoai.org answers 403 to Python's default User-Agent, so send a named one\n"
            f"did = json.load(urllib.request.urlopen({NAMED}))")
        n["ua"] += 1
    if 'headers={"user-agent": "Mozilla/5.0"}' in md:
        rep("# the site's bot filter answers 403 to Python's default user agent, so send a browser-like one",
            "# csoai.org answers 403 to Python's default User-Agent, so send a named one")
        rep('urllib.request.Request("https://csoai.org/.well-known/did.json", headers={"user-agent": "Mozilla/5.0"})', NAMED)
        n["ua"] += 1
    if name == "evidence-index":
        rep("By hand, the signature: in `index.signed.json`",
            "`verify.py` sends its own named User-Agent (csoai.org answers 403 to Python's default one). By hand:\n\n```python\n"
            "import json, hashlib, base64, urllib.request\nfrom cryptography.hazmat.primitives.asymmetric import ed25519\n"
            's = json.load(open("index.signed.json"))\n'
            'c = json.dumps(s["payload"], sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode()\n'
            'assert hashlib.sha256(c).hexdigest() == s["signature"]["payload_sha256"]\n'
            'assert hashlib.sha256(open("index.json", "rb").read()).hexdigest() == s["payload"]["artifact"]["sha256"]\n'
            f"did = json.load(urllib.request.urlopen({NAMED}))\n"
            'x = [m for m in did["verificationMethod"] if m["id"].endswith("#board-attestation-1")][0]["publicKeyJwk"]["x"]\n'
            'ed25519.Ed25519PublicKey.from_public_bytes(base64.urlsafe_b64decode(x + "==")).verify(bytes.fromhex(s["signature"]["sig_ed25519"]), c)\n'
            "```\n\nIn words, the signature: in `index.signed.json`")
        n["ua"] += 1
    assert n["ua"] >= 1, (name, "no verification snippet found to give a named User-Agent")
    # 2. offline timestamp check, after the Timestamp paragraph
    key = "The timestamp:" if name == "evidence-index" else "**Timestamp.**"
    i = md.index(key)
    j = md.index("\n\n", i)
    f, p = d["ts"]
    md = md[:j] + "\n" + OFFLINE.format(file=f, proof=p, ua=UA).rstrip("\n") + md[j:]
    # 3. contact + 4. citation, before the Licence section
    enf = d.get("enforcement") or BY_HAND.format(reader=d["reader"])
    block = CONTACT.format(what=d["what"], reads=d["reads"], enforcement=enf) + BIB.format(
        key="csoai_" + name.replace("-", "_") + "_2026", title=d["title"], name=name)
    rep("\n## Licence\n", "\n" + block + "## Licence\n")
    # 5. a2a viewer
    if name == "a2a-card-census":
        rep("configs:\n- config_name: cards-2026-09-25\n  data_files: data/cards.jsonl.gz\n",
            "configs:\n- config_name: cards-2026-09-25\n  data_files: data/cards.v0.1.1.jsonl.gz\n  default: true\n"
            "- config_name: cards-v0.1-superseded\n  data_files: data/cards.jsonl.gz\n")
    return md


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--out", required=True)
    ap.add_argument("--only")
    ap.add_argument("--publish", action="store_true")
    ap.add_argument("--hf-token", default="~/.secrets/hf_token")
    a = ap.parse_args()
    from huggingface_hub import HfApi, hf_hub_download, CommitOperationAdd
    tok = pathlib.Path(os.path.expanduser(a.hf_token)).read_text().strip()
    api = HfApi(token=tok)
    out = pathlib.Path(a.out)
    out.mkdir(parents=True, exist_ok=True)
    res = {}
    for name in DS:
        if a.only and name != a.only:
            continue
        rid = f"csoai/{name}"
        info = api.dataset_info(rid, files_metadata=True)
        blobs = {s.rfilename: s.blob_id for s in info.siblings if s.rfilename != "README.md"}
        old = pathlib.Path(hf_hub_download(rid, "README.md", repo_type="dataset", token=tok, revision=info.sha, force_download=True)).read_text()
        new = edit(name, old)
        (out / f"README.{name}.new.md").write_text(new)
        res[name] = {"parent": info.sha, "chars": [len(old), len(new)]}
        if not a.publish:
            continue
        ci = api.create_commit(rid, repo_type="dataset", parent_commit=info.sha,
                               operations=[CommitOperationAdd(path_in_repo="README.md", path_or_fileobj=str(out / f"README.{name}.new.md"))],
                               commit_message="README: contact / objections / re-checks, named User-Agent in verify snippets, "
                                              "offline OTS check, citation" + ("; viewer on the 0.1.1 rows" if name == "a2a-card-census" else ""))
        after = api.dataset_info(rid, files_metadata=True, revision=ci.oid)
        blobs2 = {s.rfilename: s.blob_id for s in after.siblings if s.rfilename != "README.md"}
        assert blobs2 == blobs, (name, "a data file changed")
        got = pathlib.Path(hf_hub_download(rid, "README.md", repo_type="dataset", token=tok, revision=ci.oid, force_download=True)).read_text()
        assert got == new
        res[name].update(hf_commit=ci.oid, data_files_unchanged=len(blobs))
    (out / "hygiene.json").write_text(json.dumps(res, indent=1) + "\n")
    print(json.dumps(res, indent=1))


if __name__ == "__main__":
    main()
