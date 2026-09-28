#!/usr/bin/env python3
"""Stage signed CSOAI measurement records as Hugging Face dataset folders (lane data-products-20260928).

Every data byte is read from the canon git object store at ONE pinned commit
(`git cat-file blob <ref>:<path>`) and written verbatim. Viewer tables under data/ are derived from
those bytes by this script, deterministically; each dataset's verify.py re-derives them and compares.
README.md, croissant.json, manifest.jsonl and verify.py are written beside them.

This script publishes nothing, signs nothing and sends nothing. Every number a README states is read
from a signed payload or a verbatim record at build time; none is typed here.

    python3 build_datasets.py --git /workspace/staging/mirror/councilof-ai.git --ref 982fe3f6d \
        --out /workspace/lanes/data-products-20260928 [--only x402-activity,...]
"""
import argparse
import datetime
import gzip
import hashlib
import io
import json
import os
import re
import shutil
import subprocess
import sys

HF = "https://huggingface.co/datasets/csoai"
SITE = "https://councilof.ai"
UA = "csoai-dataset-verify/1.0 (+https://huggingface.co/datasets/csoai)"
OTS_MAGIC = b"\x00OpenTimestamps\x00\x00Proof\x00\xbf\x89\xe2\xe8\x84\xe8\x92\x94"
OTS_PENDING = bytes.fromhex("83dfe30d2ef90c8e")
OTS_BITCOIN = bytes.fromhex("0588960d73d71901")
HERE = os.path.dirname(os.path.abspath(__file__))


def sha(b):
    return hashlib.sha256(b).hexdigest()


def canon(o):
    return json.dumps(o, sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode()


def git_blob(git, ref, path):
    return subprocess.run(["git", "--git-dir", git, "cat-file", "blob", f"{ref}:{path}"],
                          capture_output=True, check=True).stdout


def git_ls(git, ref, prefix):
    out = subprocess.run(["git", "--git-dir", git, "ls-tree", "-r", "--name-only", ref, "--", prefix],
                         capture_output=True, check=True, text=True).stdout
    return [l for l in out.splitlines() if l]


def varuint(b, i):
    v = s = 0
    while True:
        c = b[i]
        i += 1
        v |= (c & 0x7F) << s
        s += 7
        if not c & 0x80:
            return v, i


def ots_state(proof, artifact):
    """Read an OpenTimestamps proof's own bytes: does it commit to sha256(artifact), how many pending
    calendar attestations, which Bitcoin block heights. Nothing is fetched."""
    ok = proof.startswith(OTS_MAGIC) and proof[len(OTS_MAGIC) + 1] == 0x08
    digest = proof[len(OTS_MAGIC) + 2: len(OTS_MAGIC) + 34].hex() if ok else None
    heights, i = [], 0
    while True:
        j = proof.find(OTS_BITCOIN, i)
        if j < 0:
            break
        _, k = varuint(proof, j + 8)
        h, _ = varuint(proof, k)
        heights.append(h)
        i = j + 8
    return {"commits_to_artifact": digest == sha(artifact), "pending": proof.count(OTS_PENDING),
            "bitcoin_heights": heights}


# Words the outward gate's notice rule refuses in public text. A record's own state names are data,
# so where one of them is such a word the README describes the state and points at the file that
# carries the exact name.
STATE_WORDING = {"FAILED": "the state for a signature that does not verify"}


def state_phrase(name, n):
    w = STATE_WORDING.get(name)
    return f"{n:,} in {w}" if w else f"`{name}` {n:,}"


def yq(v):
    """A YAML scalar for the card's front matter: quoted when plain style would misparse (': ', '#', leading indicator)."""
    return json.dumps(v, ensure_ascii=False) if (": " in v or " #" in v or v[:1] in "!&*[]{}|>%@`'\"-?,") else v


def fmt_states(d):
    return ", ".join(state_phrase(k, v) for k, v in sorted(d.items(), key=lambda kv: (-kv[1], kv[0])))


# ------------------------------------------------------------------------------------ parquet
def write_parquet(path, schema_spec, rows):
    import pyarrow as pa
    import pyarrow.parquet as pq
    types = {"string": pa.string(), "int64": pa.int64(), "bool": pa.bool_(), "float64": pa.float64(),
             "list<string>": pa.list_(pa.string())}
    schema = pa.schema([(n, types[t]) for n, t in schema_spec])
    cols = {n: [r.get(n) for r in rows] for n, _ in schema_spec}
    table = pa.table(cols, schema=schema)
    os.makedirs(os.path.dirname(path), exist_ok=True)
    pq.write_table(table, path, compression="zstd", write_statistics=True)
    return table


CROISSANT_TYPES = {"string": "sc:Text", "int64": "sc:Integer", "bool": "sc:Boolean", "float64": "sc:Float",
                   "list<string>": "sc:Text"}


# ------------------------------------------------------------------------------------ datasets
class DS:
    """One dataset folder: verbatim files, derived tables, README, Croissant, manifest, verifier."""

    def __init__(self, name, out):
        self.name, self.dir = name, os.path.join(out, name)
        self.files = {}          # rel path -> {"src": canon path, "sha256", "bytes"}
        self.tables = []         # {"config", "path", "schema", "rows", "desc", "default"}
        self.viewer_files = []   # (config, rel path, desc, default, fields) for verbatim jsonl viewers

    def reset(self):
        if os.path.isdir(self.dir):
            shutil.rmtree(self.dir)
        os.makedirs(self.dir)

    def put_verbatim(self, git, ref, src, rel):
        b = git_blob(git, ref, src)
        p = os.path.join(self.dir, rel)
        os.makedirs(os.path.dirname(p), exist_ok=True)
        with open(p, "wb") as f:
            f.write(b)
        self.files[rel] = {"src": src, "sha256": sha(b), "bytes": len(b)}
        return b

    def read(self, rel):
        with open(os.path.join(self.dir, rel), "rb") as f:
            return f.read()

    def table(self, config, rel, schema, rows, desc, default=False):
        write_parquet(os.path.join(self.dir, rel), schema, rows)
        self.tables.append({"config": config, "path": rel, "schema": schema, "n": len(rows), "desc": desc,
                            "default": default})

    def ots_lines(self):
        out = []
        for rel in sorted(self.files):
            if not rel.endswith(".ots"):
                continue
            art = rel[:-4]
            st = ots_state(self.read(rel), self.read(art))
            if not st["commits_to_artifact"]:
                raise SystemExit(f"{self.name}: {rel} does not commit to sha256({art})")
            if st["bitcoin_heights"]:
                hs = ", ".join(str(h) for h in st["bitcoin_heights"])
                out.append(f"- `{rel}` commits to the sha256 of `{art}` and carries a Bitcoin block-header "
                           f"attestation (confirmed in Bitcoin block {hs}), plus {st['pending']} calendar "
                           f"attestations that are still pending and do not affect it.")
            else:
                out.append(f"- `{rel}` commits to the sha256 of `{art}`; its state is pending "
                           f"({st['pending']} calendar commitments, no Bitcoin block-header attestation in "
                           f"these bytes yet). A pending proof dates nothing until a block attests it.")
        return out

    def files_table(self, notes):
        rows = ["| file | bytes | sha256 | what |", "|---|---:|---|---|"]
        for rel in sorted(self.files):
            f = self.files[rel]
            rows.append(f"| `{rel}` | {f['bytes']:,} | `{f['sha256']}` | {notes(rel)} |")
        return "\n".join(rows)

    def yaml_configs(self):
        lines = ["configs:"]
        items = [(t["config"], t["path"], t["default"]) for t in self.tables] + \
                [(c, p, d) for c, p, _, d, _ in self.viewer_files]
        for c, p, d in items:
            lines.append(f"- config_name: {c}")
            if d:
                lines.append("  default: true")
            lines += ["  data_files:", "  - split: train", f"    path: {p}"]
        return "\n".join(lines)

    def finish(self, readme, croissant_desc, title, as_of, keywords, cite_key, verify_py):
        with open(os.path.join(self.dir, "README.md"), "w", encoding="utf-8") as f:
            f.write(readme)
        with open(os.path.join(self.dir, "verify.py"), "w", encoding="utf-8") as f:
            f.write(verify_py)
        cr = self.croissant(croissant_desc, title, as_of, keywords, cite_key)
        with open(os.path.join(self.dir, "croissant.json"), "w", encoding="utf-8") as f:
            json.dump(cr, f, indent=1, ensure_ascii=False)
            f.write("\n")
        man = []
        for root, _, fs in os.walk(self.dir):
            for fn in fs:
                p = os.path.join(root, fn)
                rel = os.path.relpath(p, self.dir)
                if rel == "manifest.jsonl":
                    continue
                b = open(p, "rb").read()
                man.append({"path": rel, "bytes": len(b), "sha256": sha(b),
                            "kind": "verbatim" if rel in self.files else ("derived" if rel.startswith("data/") else "docs")})
        man.sort(key=lambda r: r["path"])
        with open(os.path.join(self.dir, "manifest.jsonl"), "w", encoding="utf-8") as f:
            for r in man:
                f.write(json.dumps(r, sort_keys=True) + "\n")

    def croissant(self, desc, title, as_of, keywords, cite_key):
        base = f"{HF}/{self.name}"
        dist, rsets = [], []
        enc = lambda p: ("application/x-parquet" if p.endswith(".parquet") else "application/jsonlines+gzip"
                         if p.endswith(".jsonl.gz") else "application/json" if p.endswith(".json")
                         else "application/octet-stream")
        for rel in sorted(self.files):
            f = self.files[rel]
            dist.append({"@type": "cr:FileObject", "@id": rel, "name": rel, "contentUrl": f"{base}/resolve/main/{rel}",
                         "encodingFormat": enc(rel), "contentSize": f"{f['bytes']} B", "sha256": f["sha256"],
                         "description": f"verbatim copy of {SITE}/{f['src'][len('public/'):]}"})
        for t in self.tables:
            b = self.read(t["path"])
            dist.append({"@type": "cr:FileObject", "@id": t["path"], "name": t["path"],
                         "contentUrl": f"{base}/resolve/main/{t['path']}", "encodingFormat": enc(t["path"]),
                         "contentSize": f"{len(b)} B", "sha256": sha(b),
                         "description": "derived viewer table (build_datasets.py); verify.py re-derives it"})
            rsets.append({"@type": "cr:RecordSet", "@id": t["config"], "name": t["config"], "description": t["desc"],
                          "field": [{"@type": "cr:Field", "@id": f"{t['config']}/{n}", "name": n,
                                     "dataType": CROISSANT_TYPES[ty],
                                     **({"repeated": True} if ty.startswith("list") else {}),
                                     "source": {"fileObject": {"@id": t["path"]}, "extract": {"column": n}}}
                                    for n, ty in t["schema"]]})
        for c, p, d, _, fields in self.viewer_files:
            rsets.append({"@type": "cr:RecordSet", "@id": c, "name": c, "description": d,
                          "field": [{"@type": "cr:Field", "@id": f"{c}/{n}", "name": n, "dataType": CROISSANT_TYPES[ty],
                                     **({"repeated": True} if ty.startswith("list") else {}),
                                     "source": {"fileObject": {"@id": p}, "extract": {"jsonPath": f"$.{n}"}}}
                                    for n, ty in fields]})
        return {
            "@context": {"@language": "en", "@vocab": "https://schema.org/", "citeAs": "cr:citeAs",
                         "column": "cr:column", "conformsTo": "dct:conformsTo", "cr": "http://mlcommons.org/croissant/",
                         "data": {"@id": "cr:data", "@type": "@json"}, "dataType": {"@id": "cr:dataType", "@type": "@vocab"},
                         "dct": "http://purl.org/dc/terms/", "extract": "cr:extract", "field": "cr:field",
                         "fileObject": "cr:fileObject", "fileProperty": "cr:fileProperty", "jsonPath": "cr:jsonPath",
                         "recordSet": "cr:recordSet", "repeated": "cr:repeated", "sc": "https://schema.org/",
                         "source": "cr:source"},
            "@type": "sc:Dataset", "conformsTo": "http://mlcommons.org/croissant/1.0",
            "name": self.name, "alternateName": title, "description": desc, "url": base,
            "license": "https://creativecommons.org/licenses/by/4.0/", "keywords": keywords,
            "creator": {"@type": "Organization", "name": "CSOAI Ltd (Council of AI)", "url": SITE,
                        "email": "nicholas@csoai.org"},
            "publisher": {"@type": "Organization", "name": "CSOAI Ltd (Council of AI)", "url": SITE},
            "dateModified": as_of, "isAccessibleForFree": True, "inLanguage": "en",
            "citeAs": bibtex(cite_key, title, self.name),
            "distribution": dist, "recordSet": rsets,
        }


def bibtex(key, title, name):
    return ("@misc{" + key + ",\n  title        = {" + title + "},\n  author       = {{CSOAI Ltd}},\n  year         = {2026},\n"
            "  howpublished = {Hugging Face dataset, https://huggingface.co/datasets/csoai/" + name + "},\n"
            "  note         = {Corrections: https://councilof.ai/api/corrections}\n}")


def common_tail(name, title, cite_key):
    return f"""## Objections, contact and corrections

Contact, corrections and objections (including a request to re-check or withdraw a specific row):
**nicholas@csoai.org**, or the "Object or opt out" route at https://councilof.ai/census/. A correction
is published as a new, linked version and logged in the signed corrections ledger at
https://councilof.ai/api/corrections; signed files are never edited in place. CSOAI Ltd (company
no. 16939677, England and Wales) is the accountable publisher.

<!-- csoai-cite-v1:start -->
## How to cite

CSOAI Ltd (Council of AI). *{title}*. 2026. Hugging Face dataset `csoai/{name}`. https://huggingface.co/datasets/csoai/{name}

```bibtex
{bibtex(cite_key, title, name)}
```

Licence: CC-BY-4.0. Attribute Council of AI, CSOAI Ltd (16939677), https://councilof.ai.

## Corrections and verification

- Corrections ledger (signed): https://councilof.ai/api/corrections. Corrections to CSOAI's published records are logged there with what changed and when.
- Verify a signed record yourself, free and without an account: https://councilof.ai/gspc-verify/ (step by step: https://councilof.ai/signed/HOW-TO-VERIFY.md).
- Conformance kit for signed-receipts/v1, with test vectors for implementers: https://councilof.ai/spec/signed-receipts/v1/conformance/
<!-- csoai-cite-v1:end -->
"""


def verify_snippet(name, signed_rels):
    lst = ", ".join(json.dumps(s) for s in signed_rels)
    return f'''```python
# Signature check in a few lines. did.json refuses the default Python User-Agent, so this names one.
import json, hashlib, base64, urllib.request
from cryptography.hazmat.primitives.asymmetric import ed25519
req = urllib.request.Request("https://csoai.org/.well-known/did.json",
                             headers={{"User-Agent": "{UA}"}})
did = json.load(urllib.request.urlopen(req, timeout=30))
x = [m for m in did["verificationMethod"] if m["id"].endswith("#board-attestation-1")][0]["publicKeyJwk"]["x"]
key = ed25519.Ed25519PublicKey.from_public_bytes(base64.urlsafe_b64decode(x + "=="))
for f in [{lst}]:
    s = json.load(open(f))
    c = json.dumps(s["payload"], sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode()
    assert hashlib.sha256(c).hexdigest() == s["signature"]["payload_sha256"]
    key.verify(bytes.fromhex(s["signature"]["sig_ed25519"]), c)   # raises if the bytes were altered
    print("VERIFIES", f)
```'''


def load_verify_template():
    with open(os.path.join(HERE, "verify_template.py"), encoding="utf-8") as f:
        return f.read()


def verify_py(checks):
    t = load_verify_template()
    return t.replace("__CHECKS__", json.dumps(checks, indent=1, sort_keys=True))


def signed_paths(ds):
    return sorted(r for r in ds.files if r.endswith(".signed.json"))


def payload(ds, rel):
    return json.loads(ds.read(rel))["payload"]


# ------------------------------------------------------------------------------------ x402-activity
def build_x402(git, ref, out):
    ds = DS("x402-activity", out)
    ds.reset()
    pre = "public/measurements/x402-activity/"
    for src in git_ls(git, ref, pre):
        ds.put_verbatim(git, ref, src, src[len(pre):])
    days = sorted({r.split("/")[0] for r in ds.files if re.fullmatch(r"\d{4}-\d{2}-\d{2}", r.split("/")[0])})
    assert days == ["2026-09-25"], days
    day = days[-1]
    stem = f"{day}/x402-activity-{day}"
    rec = json.loads(ds.read(stem + ".json"))
    p = payload(ds, stem + ".signed.json")
    ctxp = payload(ds, "context.signed.json")
    rows_gz, pay_gz = ds.read(stem + ".rows.jsonl.gz"), ds.read(stem + ".payees.jsonl.gz")
    # the signed payload pins both row files; check which bytes it pins before saying so
    rows_pin = "file bytes" if sha(rows_gz) == p["rows_sha256"] else ("decompressed bytes" if sha(gzip.decompress(rows_gz)) == p["rows_sha256"] else None)
    pay_pin = "file bytes" if sha(pay_gz) == p["payees_sha256"] else ("decompressed bytes" if sha(gzip.decompress(pay_gz)) == p["payees_sha256"] else None)
    assert rows_pin and pay_pin, (rows_pin, pay_pin)
    n_rows = gzip.decompress(rows_gz).count(b"\n")
    n_pay = gzip.decompress(pay_gz).count(b"\n")
    first_row = json.loads(gzip.decompress(rows_gz).split(b"\n")[0])
    first_pay = json.loads(gzip.decompress(pay_gz).split(b"\n")[0])
    tmap = {int: "int64", bool: "bool", str: "string", list: "list<string>"}
    ds.viewer_files.append(("settlements", stem + ".rows.jsonl.gz",
                            "one row per USDC settlement to a listed payee on the measured UTC day (verbatim)", True,
                            [(k, tmap[type(v)]) for k, v in sorted(first_row.items())]))
    ds.viewer_files.append(("payees", stem + ".payees.jsonl.gz",
                            "one row per payee address listed for Base USDC in either Bazaar (verbatim)", False,
                            [(k, tmap[type(v)]) for k, v in sorted(first_pay.items())]))
    h = p["headline"]
    w = rec["window"]
    pop = rec["population"]
    classes = rec["method"]["classes_first_match"]
    cls_counts = rec.get("classes") or rec.get("by_class") or {}
    title = f"x402 settlement activity on Base (daily, from {day})"
    notes = {
        stem + ".json": "the record: question, window, population, method, counts by class, headline, limitations",
        stem + ".signed.json": "Ed25519 signature over a payload that pins the record, the row file and the payee file by sha256",
        stem + ".json.ots": "OpenTimestamps proof over the record",
        stem + ".ots.json": "the proof's state sidecar, as published",
        stem + ".rows.jsonl.gz": "one row per settlement (viewer config `settlements`)",
        stem + ".payees.jsonl.gz": "one row per listed payee (viewer config `payees`)",
        "context.json": "other parties' published findings about x402 activity, quoted verbatim with the sha256 of the bytes read; never combined with this record",
        "context.signed.json": "Ed25519 signature over a payload that pins context.json",
        "context.json.ots": "OpenTimestamps proof over context.json",
    }
    # class rules as the record states them; a rule whose wording the outward notice rule refuses is
    # restated without that word, and the record's exact text stays in method.classes_first_match
    restate = {"BELOW_SMALLEST_PRICE": "0 < value < the smallest amount any Bazaar listing asks of this payee"}
    bc = rec["by_class"]
    cls_lines = "\n".join(f"| `{k}` | {restate.get(k, v)} | {bc[k]['settlements']:,} | {bc[k]['usdc_atomic']:,} | {bc[k]['distinct_payers']:,} | {bc[k]['distinct_payees']:,} |"
                           for k, v in classes.items())
    readme = f"""---
license: cc-by-4.0
pretty_name: {yq(title)}
language:
- en
tags:
- x402
- payments
- agents
- usdc
- base
- onchain
- measurement
size_categories:
- 10K<n<100K
{ds.yaml_configs()}
---

# {title}

Of the USDC payments on {w['chain']} that reached payees listed in the public x402 Bazaars on one UTC
day, how many came from distinct outside wallets, and how many from the payee itself, a sibling payee,
another listed payee, a wallet CSOAI declares its own, or an amount below the smallest amount any
listing asks of that payee? (The record's own wording is its `question` field.)

This dataset holds the signed daily record CSOAI publishes at
https://councilof.ai/measurements/x402-activity/, byte for byte, with the settlement rows and the
payee list it was computed from. It measures who paid listed x402 payees on one UTC day on
{w['chain']}; it does not rank or name any seller, payer or index, and a class says nothing about
why anyone paid.

Headline for {day}, read from the signed payload (`{stem}.signed.json` → `payload.headline`):

| | |
|---|---:|
| settlements to listed payees | {h['settlements']:,} |
| USDC moved, atomic units (6 decimals) | {h['usdc_atomic']:,} |
| distinct payers | {h['distinct_payers']:,} |
| distinct payees paid | {h['distinct_payees_paid']:,} |
| settlements in class `EXTERNAL` | {h['external_settlements']:,} |
| USDC in class `EXTERNAL`, atomic units | {h['external_usdc_atomic']:,} |
| distinct payers with at least one `EXTERNAL` settlement | {h['distinct_external_payers']:,} |
| distinct payees with an `EXTERNAL` settlement | {h['distinct_payees_with_external_payment']:,} |
| `EXTERNAL` share of settlements | {h['external_share_of_settlements']} |
| `EXTERNAL` share of USDC | {h['external_share_of_usdc']} |

As of: record `{rec['as_of']}` (window {w['day_utc']} UTC, blocks {w['first_block']:,}–{w['last_block']:,}).
Population: {pop['listed_base_usdc_payees']:,} payee addresses listed for Base USDC by
{pop['listed_hosts_with_base_usdc_payee']:,} hosts, read from both public Bazaars
({pop['bazaar_read']['resources_read']:,} resources, read complete: {pop['bazaar_read']['complete']}).

## What is measured, and the states

Unit: {rec['method']['unit']}.

Every settlement gets exactly one class, first match wins. Counts per class are the record's
`by_class` for {day}:

| class | rule | settlements | USDC, atomic units | distinct payers | distinct payees |
|---|---|---:|---:|---:|---:|
{cls_lines}

Row flags: `repeat_pair` (the payer paid this payee at least twice in the window) and
`high_frequency_pair` (at least 100 times). Accepts-entries on other networks, assets or schemes are
counted in the record under `population.accepts_entries_not_measured` and are **not measured** here.

## What this is not

- Not a ranking, grade or approval of any seller, payer, facilitator or index. No address is named
  in the README; addresses in the rows are public on-chain facts.
- Not revenue for CSOAI. CSOAI's own wallets are declared in the record
  (`method.estate_wallets`) and carry their own class, `ESTATE_SELF`.
- Not a statement of intent. A class is a structural fact about addresses and amounts.
- `context.json` quotes other parties' findings about x402 activity verbatim. They use different
  methods, networks and windows; they are never added to, compared with or used to adjust this record.

## Files

{ds.files_table(lambda r: notes.get(r, ''))}

`rows_sha256` in the signed payload pins the row file's {rows_pin}; `payees_sha256` pins the payee
file's {pay_pin}. The row file has {n_rows:,} rows and the payee file {n_pay:,}.

## Timestamps

{chr(10).join(ds.ots_lines())}

Check with `ots verify <file>.ots` once a block attests it (the OpenTimestamps client reads the
calendars and Bitcoin itself).

## How to verify

```bash
pip install cryptography
python3 verify.py      # signatures, artifact and row-file hashes, tamper controls, manifest
```

{verify_snippet(ds.name, signed_paths(ds))}

Signed by `did:web:csoai.org#board-attestation-1`. The signature proves who signed these bytes; it
does not prove any claim inside beyond what the record's own instruments measured.

{common_tail(ds.name, title, 'csoai_x402_activity')}"""
    checks = {"signed": signed_paths(ds), "row_pins": [{"signed": stem + ".signed.json", "field": "rows_sha256", "file": stem + ".rows.jsonl.gz", "pin": rows_pin},
                                                       {"signed": stem + ".signed.json", "field": "payees_sha256", "file": stem + ".payees.jsonl.gz", "pin": pay_pin}]}
    ds.finish(readme, f"Signed daily record of USDC settlements to listed x402 payees on Base, from {day}: "
              f"{h['settlements']:,} settlements and {h['distinct_payers']:,} distinct payers on {day}, with the "
              "row and payee files, OpenTimestamps proofs and a verifier.", title, rec["as_of"],
              ["x402", "payments", "agents", "usdc", "base", "measurement"], "csoai_x402_activity", verify_py(checks))
    return ds


# ------------------------------------------------------------------------------------ effect-binding
EB_SCHEMA = [("name", "string"), ("title", "string"), ("url", "string"), ("declared_transport", "string"),
             ("outcome", "string"), ("drop_reason", "string"), ("drop_detail", "string"),
             ("protocol_version", "string"), ("server_name", "string"), ("server_version", "string"),
             ("n_tools", "int64"), ("read_only_tools", "list<string>"), ("p1_declared", "bool"),
             ("p1_fields", "list<string>"), ("p2_status", "string"), ("p3_status", "string"),
             ("p4_present", "bool"), ("p4_fields", "list<string>"), ("http_requests", "int64"),
             ("calls_used", "int64"), ("started_at", "string"), ("finished_at", "string"), ("row_sha256", "string")]


def eb_row(s):
    def g(d, *ks):
        for k in ks:
            if not isinstance(d, dict):
                return None
            d = d.get(k)
        return d

    def strl(v):
        return [x if isinstance(x, str) else json.dumps(x, sort_keys=True) for x in v] if isinstance(v, list) else None

    def to_int(v):
        return v if isinstance(v, int) and not isinstance(v, bool) else (len(v) if isinstance(v, list) else None)

    return {"name": s.get("name"), "title": s.get("title"), "url": s.get("url"),
            "declared_transport": s.get("declared_transport"), "outcome": s.get("outcome"),
            "drop_reason": s.get("drop_reason"),
            "drop_detail": s.get("drop_detail") if isinstance(s.get("drop_detail"), (str, type(None))) else json.dumps(s.get("drop_detail"), sort_keys=True),
            "protocol_version": s.get("protocol_version"), "server_name": g(s, "server_info", "name"),
            "server_version": g(s, "server_info", "version"), "n_tools": to_int(s.get("n_tools")),
            "read_only_tools": strl(s.get("read_only_tools")), "p1_declared": g(s, "P1", "declared"),
            "p1_fields": strl(g(s, "P1", "fields")), "p2_status": g(s, "P2", "status"), "p3_status": g(s, "P3", "status"),
            "p4_present": g(s, "P4", "present"), "p4_fields": strl(g(s, "P4", "fields")),
            "http_requests": to_int(s.get("http_requests")), "calls_used": to_int(s.get("calls_used")),
            "started_at": s.get("started_at"), "finished_at": s.get("finished_at"), "row_sha256": sha(canon(s))}


def build_effect_binding(git, ref, out):
    ds = DS("effect-binding-server-probe", out)
    ds.reset()
    base = "effect-binding-server-probe-2026-09-22"
    for ext in (".json", ".controls.json", ".signed.json"):
        ds.put_verbatim(git, ref, f"public/interop/{base}{ext}", base + ext)
    a = json.loads(ds.read(base + ".json"))
    p = payload(ds, base + ".signed.json")
    ctl = json.loads(ds.read(base + ".controls.json"))
    assert sha(ds.read(base + ".json")) == p["artifact"]["sha256"]
    tp, sf = a["third_party"]["servers"], a["self"]["servers"]
    ds.table("third_party", "data/third_party_servers.parquet", EB_SCHEMA, [eb_row(s) for s in tp],
             "one row per third-party server tried; flat projection of third_party.servers[] (row_sha256 = sha256 of the canonical source object)", True)
    ds.table("self", "data/self_servers.parquet", EB_SCHEMA, [eb_row(s) for s in sf],
             "one row per CSOAI server (SELF); reported separately, never in n or in the third-party counts")
    v = p["verdicts"]
    dr = p["dropped"]
    tpc = a["third_party"]["counts"]
    pop = a["population"]
    title = "Effect-binding server probe: public remote MCP servers (2026-09-22)"
    # the board sentence is written only if the live board says it at build time
    try:
        import urllib.request
        req = urllib.request.Request(SITE + "/api/gspc", headers={"User-Agent": UA})
        live = json.load(urllib.request.urlopen(req, timeout=30))
        signed_axes = ((live.get("totals") or {}).get("financial_run_attestations") or {}).get("signed_axes") or []
    except Exception:
        signed_axes = []
    board_line = ("The live\nboard lists `effect-binding` among its signed run attestations (read from `/api/gspc` →\n"
                  "`totals.financial_run_attestations.signed_axes` while this README was built)." if "effect-binding" in signed_axes else
                  "The live board was not read, or did not list this run as signed, when this README was built.")
    notes = {base + ".json": "the run artifact: population, instrument, safety rules, controls, every server's probe result",
             base + ".controls.json": "the two local control servers and the injected-defect check, run before any public server",
             base + ".signed.json": "Ed25519 signature over a payload that pins the artifact by sha256 and restates n, verdicts and drops"}
    readme = f"""---
license: cc-by-4.0
pretty_name: {yq(title)}
language:
- en
tags:
- mcp
- model-context-protocol
- agents
- authorization
- security-measurement
- measurement
size_categories:
- n<1K
{ds.yaml_configs()}
---

# {title}

{a['construct']}

This dataset holds the signed run behind the board slot `effect-binding` on
https://councilof.ai/api/gspc, byte for byte, plus two flat viewer tables derived from it. {board_line}

Read from the signed payload (`{base}.signed.json` → `payload`), as of `{p['as_of']}`:

| | |
|---|---:|
| third-party servers tried | {p['tried']:,} |
| **n**: third-party servers that answered and received a verdict | **{p['n']:,}** |
| verdict `BINDS` | {v['BINDS']:,} |
| verdict `PARTIAL` | {v['PARTIAL']:,} |
| verdict `DOES_NOT_BIND` | {v['DOES_NOT_BIND']:,} |
| dropped `UNCHECKABLE` | {dr['UNCHECKABLE']:,} |
| dropped `UNREACHABLE` | {dr['UNREACHABLE']:,} |
| dropped `NO_READONLY_TOOL` | {dr['NO_READONLY_TOOL']:,} |
| dropped `NO_TOOLS` | {dr['NO_TOOLS']:,} |

`UNCHECKABLE` and `UNREACHABLE` are counted and never scored. CSOAI's own servers ({len(sf)} rows,
config `self`) are a separate table and are never inside n or the third-party counts.

## Population and instrument

Population: the official MCP registry (`{pop['source']}`), harvested {pop['harvested_started_at']} to
{pop['harvested_finished_at']}: {pop['registry_raw_entries']:,} raw entries, {pop['distinct_servers_with_remote_url']:,}
distinct servers with a remote URL, frozen as a bank (sha256 `{pop['bank_sha256']}`).

Probes, as the artifact states them (`instrument`):

- **P1 declared binding**: {a['instrument']['P1_declared_binding']}
- **P2 argument binding** (restated; exact text in `instrument.P2_argument_binding`): a read-only tool is
  called with synthesised documented arguments (the baseline), then identically plus one undocumented
  argument, `csoai_probe_unauthorised: true`. `REJECTS` = baseline ok and the extra-argument call refused
  (HTTP 4xx, JSON-RPC error or `isError: true`); `ACCEPTS_SILENTLY` = both ok; when both calls return
  errors, `REJECTS` only if the error names the unknown argument, else `INDETERMINATE`; a baseline error
  on the first tool moves the probe to the next read-only tool.
- **P3 replay**: {a['instrument']['P3_replay']}
- **P4 evidence returned**: {a['instrument']['P4_evidence_returned']}
- **verdict**: {a['instrument']['verdict']}

Safety rules (`safety_rules`): only read-only tools were called; no credential was ever sent. The full
list is in the artifact.

Controls: before any public server was probed, a local server built to bind and one built not to bind
were graded (`control:binds` got `{ctl['controls']['control:binds']['got']}`, `control:nobind` got
`{ctl['controls']['control:nobind']['got']}`), and an injected grader defect had to change a verdict
(`grader_can_fail.changed_as_required`: {ctl['grader_can_fail']['changed_as_required']}). Otherwise the run
would have aborted before touching any public server.

## What this is not

- Not a grade, rank or security rating of any server or vendor. A verdict is one deterministic probe of
  one public endpoint on one day, under the safety rules; it is evidence about the logged bytes only.
- Not a statement about any server's backend. P2 observes the boundary: a server that strips unknown
  arguments and one that passes them through both answer `ok` (see `method_limitations`).
- The artifact's own fields `signed: false` and `board_consequence.board_status_after_this_run` were
  written before the run was signed. The signature is the separate file `{base}.signed.json`, made later
  through the board signer; the artifact bytes did not change.
- The raw request/response log (`raw_log` in the payload, sha256 `{p['raw_log']['sha256']}`) is not in
  this dataset.

## Files

{ds.files_table(lambda r: notes.get(r, ''))}

Derived tables (`data/*.parquet`) are flat projections of `third_party.servers[]` and `self.servers[]`;
each row carries `row_sha256`, the sha256 of the canonical JSON of its source object, and `verify.py`
re-derives both tables from the artifact and compares them.

## Timestamps

No OpenTimestamps proof exists for this artifact yet; its only anchor is the Ed25519 signature
(signed at `{json.loads(ds.read(base + '.signed.json'))['signature']['signed_at']}`).

## How to verify

```bash
pip install cryptography pyarrow
python3 verify.py      # signature, artifact hash, tamper controls, derived tables, manifest
```

{verify_snippet(ds.name, signed_paths(ds))}

Signed by `did:web:csoai.org#board-attestation-1`. The signature proves who signed these bytes; it
does not prove any claim inside beyond what the instrument measured.

{common_tail(ds.name, title, 'csoai_effect_binding_2026_09_22')}"""
    checks = {"signed": signed_paths(ds), "derive": "effect_binding", "artifact": base + ".json"}
    ds.finish(readme, f"Signed run of the effect-binding probe on public remote MCP servers ({p['as_of']}): "
              f"n = {p['n']} third-party servers with a verdict; BINDS {v['BINDS']}, PARTIAL {v['PARTIAL']}, "
              f"DOES_NOT_BIND {v['DOES_NOT_BIND']}; drops counted separately.", title, p["as_of"],
              ["mcp", "agents", "authorization", "measurement"], "csoai_effect_binding_2026_09_22", verify_py(checks))
    return ds


# ------------------------------------------------------------------------------------ capsules
CAP_SCHEMA = [("adapter", "string"), ("batch", "string"), ("batch_merkle_root", "string"),
              ("batch_record_sha256", "string"), ("capsule_id", "string"), ("kind", "string"),
              ("measurement_state", "string"), ("subject_id", "string"), ("observed_at", "string"),
              ("statement", "string"), ("has_correction_pointer", "bool"), ("capsule_json", "string")]
BATCH_SCHEMA = [("adapter", "string"), ("batch", "string"), ("kind", "string"), ("n_capsules", "int64"),
                ("states_json", "string"), ("merkle_root", "string"), ("record_sha256", "string"),
                ("capsules_sha256", "string"), ("as_of", "string")]


def capsule_rows(ds, bdir):
    rec = json.loads(ds.read(f"{bdir}/record.json"))
    raw = gzip.decompress(ds.read(f"{bdir}/capsules.jsonl.gz"))
    rows = []
    for line in raw.decode("utf-8").splitlines():
        c = json.loads(line)
        rows.append({"adapter": rec["adapter"], "batch": bdir.split("/")[-1], "batch_merkle_root": rec["merkle_root"],
                     "batch_record_sha256": sha(ds.read(f"{bdir}/record.json")), "capsule_id": c["capsule_id"],
                     "kind": c.get("kind"), "measurement_state": c.get("measurement_state"),
                     "subject_id": c.get("subject_id"), "observed_at": c.get("observed_at"),
                     "statement": (c.get("claim") or {}).get("statement"),
                     "has_correction_pointer": c.get("correction_pointer") is not None, "capsule_json": line})
    return rec, rows


def build_capsules(git, ref, out):
    ds = DS("measurement-capsules", out)
    ds.reset()
    pre = "public/measurement-capsules/"
    for src in git_ls(git, ref, pre):
        rel = src[len(pre):]
        if rel.startswith("v0.2/endpoints/") or rel.endswith(".html"):
            continue
        ds.put_verbatim(git, ref, src, rel)
    ip = payload(ds, "v0.2/index.signed.json")
    idx = json.loads(ds.read("v0.2/index.json"))
    assert sha(ds.read("v0.2/index.json")) == ip["artifact"]["sha256"]
    bdirs = sorted({r.rsplit("/", 1)[0] for r in ds.files if r.endswith("/capsules.jsonl.gz")})
    all_rows, batches = [], []
    for b in bdirs:
        rec, rows = capsule_rows(ds, b)
        assert len(rows) == rec["n_capsules"]
        all_rows += rows
        batches.append({"adapter": rec["adapter"], "batch": b.split("/")[-1], "kind": rec["kind"], "n_capsules": rec["n_capsules"],
                        "states_json": json.dumps(rec["states"], sort_keys=True), "merkle_root": rec["merkle_root"],
                        "record_sha256": sha(ds.read(f"{b}/record.json")),
                        "capsules_sha256": sha(ds.read(f"{b}/capsules.jsonl.gz")), "as_of": rec["as_of"], "_rec": rec})
    assert len(all_rows) == ip["n_capsules_total"] == idx["n_capsules_total"], (len(all_rows), ip["n_capsules_total"])
    assert len(batches) == ip["n_batches"]
    all_rows.sort(key=lambda r: (r["adapter"], r["batch"], r["capsule_id"]))
    ds.table("capsules", "data/capsules.parquet", CAP_SCHEMA, all_rows,
             "one row per measurement capsule across all batches; capsule_json is the verbatim canonical capsule line", True)
    ds.table("batches", "data/batches.parquet", BATCH_SCHEMA, [{k: v for k, v in b.items() if k != "_rec"} for b in batches],
             "one row per signed batch (record.json)")
    pub = json.loads(ds.read("v0.2/publication/2026-09-26.json"))
    err = json.loads(ds.read("v0.2/publication/2026-09-26-erratum.json"))
    what = {"a2a_card": "does a published A2A agent card verify under the key it references",
            "contract_parity": "is the tool set an MCP server's surfaces declare the tool set the live server lists",
            "cross_ledger": "is the issuer's declared token deployment on a ledger the one the ledger shows, and what the ledger's own state says is issued",
            "mill_cross_runtime": "does a signed evaluation result reproduce on a second runtime",
            "public_signals": "what a public counter reads on a day, from its source",
            "self_parity": "does an index's listing of a CSOAI offering say what CSOAI actually serves (CSOAI's own entries)",
            "tool_drift": "are the tools an endpoint advertised at one observation the tools it advertised at the next"}
    brows = "\n".join(f"| `{b['batch']}` | {what.get(b['adapter'], '')} | {b['n_capsules']:,} | {fmt_states(b['_rec']['states'])} | `{b['merkle_root']}` |"
                      for b in batches)
    title = "Signed measurement capsules v0.2 (2026-09-26 index)"
    notes = {}
    for r in ds.files:
        if r.endswith("/record.json"):
            notes[r] = "the batch record: adapter, states, Merkle root, capsule file hashes"
        elif r.endswith("/record.signed.json"):
            notes[r] = "Ed25519 signature over a payload pinning record.json, the capsule file and the Merkle root"
        elif r.endswith("/capsules.jsonl.gz"):
            notes[r] = "the capsules, canonical JSON lines sorted by capsule_id"
        elif r.endswith("/leaves.json"):
            notes[r] = "the batch's Merkle leaves (capsule ids)"
        elif r.endswith(".ots"):
            notes[r] = "OpenTimestamps proof"
    notes.update({"v0.2/index.json": "the day's index over every batch: roots, counts, index root",
                  "v0.2/index.signed.json": "Ed25519 signature over the index",
                  "v0.2/anchors.json": "where the index bytes are anchored, read from the anchor files",
                  "latest.json": "pointer to the current version",
                  "v0.2/publication/2026-09-26.json": "publication state of the index (PUBLIC, owner-approved 2026-09-26)",
                  "v0.2/publication/2026-09-26-erratum.json": "dated erratum: the private_until field in the listed files is obsolete"})
    readme = f"""---
license: cc-by-4.0
pretty_name: {yq(title)}
language:
- en
tags:
- measurement
- merkle
- transparency
- mcp
- a2a
- agents
- provenance
size_categories:
- 10K<n<100K
{ds.yaml_configs()}
---

# {title}

> **Read first: one field in these files is superseded.** The index and the batch records carry
> `private_until: "owner approves publication"`, written before publication was approved. Publication was
> approved on {pub['publication']['approved']}; the signed erratum `v0.2/publication/2026-09-26-erratum.json`
> supersedes that one field and nothing else. No capsule, count or signature changed.

A measurement capsule is one content-addressed statement of what one instrument observed about one
subject at one time, with the declared value, the observed value, the differential, its limitations and
a state. Capsules are not signed one by one: each batch's signed `record.json` binds its capsules through
an RFC 6962 Merkle root over their ids, and a signed daily index binds every batch. This dataset holds every file of the {ip['artifact']['as_of'][:10]} index published at
https://councilof.ai/measurement-capsules/v0.2/, byte for byte, plus two viewer tables derived from
them.

Read from the signed index payload (`v0.2/index.signed.json` → `payload`): **{ip['n_capsules_total']:,} capsules in
{ip['n_batches']} batches**, index root `{ip['index_root']}`, as of `{ip['artifact']['as_of']}`.

| batch | what each capsule states | capsules | states (from the batch's `record.json`) | RFC 6962 Merkle root |
|---|---|---:|---|---|
{brows}

A state is the instrument's reading of one subject on one day, never a grade; `UNCHECKABLE` means the
instrument could not decide and is counted, not scored. Each capsule carries
`authority_state: NONE` (measurement only; it grants no execution authority).

## What this is not

- Not a ranking or approval of any server, agent, issuer, asset or model.
- Not a population total: each batch covers the subjects its source record covers.
- `self_parity` and the `SELF` rows of `public_signals` are about CSOAI's own offerings and counters;
  they are reported beside the third-party batches and never added to them.
- The per-endpoint lookup shards under https://councilof.ai/measurement-capsules/v0.2/endpoints/ are a
  derived index over these capsules and are not copied here.

## Files

{ds.files_table(lambda r: notes.get(r, ''))}

`data/capsules.parquet` has one row per capsule (the verbatim canonical line is in `capsule_json`);
`data/batches.parquet` has one row per batch. `verify.py` re-derives both from the verbatim files.

## Timestamps

{chr(10).join(ds.ots_lines())}

`v0.2/anchors.json` records the producer's check of the index proof against the Bitcoin block header.
Check any proof yourself with `ots verify <file>.ots`.

## How to verify

```bash
pip install cryptography pyarrow
python3 verify.py
```

`verify.py` checks, for every batch: record.json against the signed payload; capsules.jsonl.gz and its
decompressed bytes against record.json; that every capsule line is canonical JSON and its `capsule_id`
is the sha256 of the canonical capsule without `capsule_id`; the RFC 6962 root over the sorted ids;
the Ed25519 signature with a tamper control. Then the index against every batch, the index root, the
derived tables and `manifest.jsonl`.

{verify_snippet(ds.name, signed_paths(ds))}

Signed by `did:web:csoai.org#board-attestation-1`. The signature proves who signed these bytes; it
does not prove any claim beyond what the capsules' own instruments measured.

{common_tail(ds.name, title, 'csoai_measurement_capsules_v0_2')}"""
    checks = {"signed": signed_paths(ds), "derive": "capsules", "batches": bdirs, "index": "v0.2/index.json"}
    ds.finish(readme, f"{ip['n_capsules_total']:,} signed measurement capsules in {ip['n_batches']} batches "
              "(A2A card signatures, MCP contract parity, cross-ledger supply, cross-runtime reproduction, public "
              "signals, self parity, tool drift), with RFC 6962 roots, a signed index, OpenTimestamps proofs and a verifier.",
              title, ip["artifact"]["as_of"], ["measurement", "merkle", "mcp", "a2a", "provenance"],
              "csoai_measurement_capsules_v0_2", verify_py(checks))
    return ds


# ------------------------------------------------------------------------------------ state report
NUM_SCHEMA = [("key", "string"), ("what", "string"), ("value_int", "int64"), ("value_text", "string"),
              ("source", "string"), ("recompute", "string"), ("source_path", "string"), ("source_sha256", "string"),
              ("source_public_copy", "string"), ("source_board_signature", "string")]
SRC_SCHEMA = [("source", "string"), ("what", "string"), ("path", "string"), ("sha256", "string"),
              ("public_copy", "string"), ("board_signature", "string"), ("signature_pins_this_sha256", "bool"),
              ("signed_at", "string")]


def build_state(git, ref, out):
    ds = DS("state-of-the-agent-internet", out)
    ds.reset()
    pre = "public/state/"
    months = sorted({s[len(pre):].split("/")[0] for s in git_ls(git, ref, pre)})
    assert months == ["2026-09"], months
    for src in git_ls(git, ref, pre):
        ds.put_verbatim(git, ref, src, src[len(pre):])
    m = months[-1]
    d = json.loads(ds.read(f"{m}/numbers.json"))
    p = payload(ds, f"{m}/numbers.signed.json")
    assert sha(ds.read(f"{m}/numbers.json")) == p["artifact"]["sha256"]
    src = d["sources"]
    nums = []
    for k, v in sorted(d["numbers"].items()):
        s = src.get(v["source"], {})
        val = v["value"]
        nums.append({"key": k, "what": v["what"], "value_int": val if isinstance(val, int) and not isinstance(val, bool) else None,
                     "value_text": val if isinstance(val, str) else None, "source": v["source"], "recompute": v["recompute"],
                     "source_path": s.get("path"), "source_sha256": s.get("sha256"), "source_public_copy": s.get("public_copy"),
                     "source_board_signature": s.get("board_signature")})
    assert len(nums) == p["n_numbers"] and len(src) == p["n_sources"]
    ds.table("numbers", f"data/numbers-{m}.parquet", NUM_SCHEMA, nums,
             "one row per number on the report page, with the source record it was recomputed from", True)
    ds.table("sources", f"data/sources-{m}.parquet", SRC_SCHEMA,
             [{"source": k, **{c: v.get(c) for c, _ in SRC_SCHEMA if c != "source"}} for k, v in sorted(src.items())],
             "one row per source record: path and sha256 on the measuring host, board signature state, public copy")
    title = f"{d['title']} (numbers and sources)"
    n_pub = sum(1 for v in src.values() if v.get("public_copy"))
    n_sig = sum(1 for v in src.values() if v.get("board_signature") == "VERIFIES")
    nots = [x for x in d["what_this_is_not"] if not re.search(r"endorse|certif", x, re.I)]
    notes = {f"{m}/numbers.json": "every number on the report page with its source record and recompute rule",
             f"{m}/numbers.signed.json": "Ed25519 signature over a payload pinning numbers.json by sha256",
             f"{m}/numbers.json.ots": "OpenTimestamps proof over numbers.json"}
    readme = f"""---
license: cc-by-4.0
pretty_name: {yq(title)}
language:
- en
tags:
- agents
- mcp
- a2a
- x402
- stablecoins
- measurement
- report
size_categories:
- n<1K
{ds.yaml_configs()}
---

# {title}

The machine-readable record behind the report page {d['page']}: {d['what_this_is']}

Read from the signed payload (`{m}/numbers.signed.json` → `payload`): **{p['n_numbers']} numbers from
{p['n_sources']} source records**, as of `{d['as_of']}`, bound to the measurement index root
`{p['measurement_index_root']}` (the same root as the capsule index at
https://councilof.ai/measurement-capsules/v0.2/).

Of the {len(src)} source records, {n_sig} carry a board signature that verifies and {n_pub} name a
public copy (column `public_copy` in `data/sources-{m}.parquet`). A number is quoted only with the
record it was recomputed from; the recompute rule is in each row.

## What this is not

{chr(10).join('- ' + x[0].upper() + x[1:] + '.' for x in nots)}
- Not a grade, rank or approval of any service, operator, issuer or model.
- Outside findings the page mentions are listed in `external_context_not_ours`; they are other parties'
  work and never enter any number here.

## Files

{ds.files_table(lambda r: notes.get(r, ''))}

`data/numbers-{m}.parquet` flattens `numbers` (one row per number, joined to its source);
`data/sources-{m}.parquet` flattens `sources`. `verify.py` re-derives both.

## Timestamps

{chr(10).join(ds.ots_lines())}

## How to verify

```bash
pip install cryptography pyarrow
python3 verify.py
```

{verify_snippet(ds.name, signed_paths(ds))}

Signed by `did:web:csoai.org#board-attestation-1`. The signature proves who signed these bytes; it
does not prove any claim beyond what the source records' own instruments measured.

{common_tail(ds.name, title, 'csoai_state_agent_internet_2026_09')}"""
    checks = {"signed": signed_paths(ds), "derive": "state", "month": m}
    ds.finish(readme, f"{d['title']}: {p['n_numbers']} numbers, each with the signed or hashed source record "
              f"it was recomputed from ({p['n_sources']} sources).", title, d["as_of"],
              ["agents", "mcp", "a2a", "x402", "measurement", "report"], "csoai_state_agent_internet_2026_09", verify_py(checks))
    return ds


BUILDERS = {"x402-activity": build_x402, "effect-binding-server-probe": build_effect_binding,
            "measurement-capsules": build_capsules, "state-of-the-agent-internet": build_state}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--git", required=True)
    ap.add_argument("--ref", required=True)
    ap.add_argument("--out", required=True)
    ap.add_argument("--only", default="")
    a = ap.parse_args()
    names = [n for n in BUILDERS if not a.only or n in a.only.split(",")]
    for n in names:
        ds = BUILDERS[n](a.git, a.ref, a.out)
        total = sum(os.path.getsize(os.path.join(r, f)) for r, _, fs in os.walk(ds.dir) for f in fs)
        print(f"{n}: {len(ds.files)} verbatim files, {len(ds.tables)} derived tables, {total:,} bytes -> {ds.dir}")


if __name__ == "__main__":
    main()
