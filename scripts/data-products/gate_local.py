#!/usr/bin/env python3
"""Run the outward gate's own checks on a STAGED dataset folder, before anything is published.

Imports scripts/outward-gate/outward_gate.py from a councilof-ai clone (never a copy of its rules) and
applies, to the folder's README.md and files:
  README gate (the lane's publication condition): NOTICE_BANNED finds nothing, and every
  doctrine_checks(prices=True) result is PASS (certify language, public prices, LF label, statutory
  verifier claim, brand-gate.mjs rules).
  Dataset gate, as dataset_artifact() would score it once published, minus the checks that need the
  live Hub (viewer, Hub-generated Croissant): licence, configs, column types (parquet schema / first
  jsonl rows), README citation + local Croissant recordSet, verify snippet (live did.json with the
  snippet's User-Agent), signatures with tamper controls, OTS presence and stated state, stated
  sha256 claims, supersession, live-number currency, accountability.
Measures only; publishes nothing.

    python3 gate_local.py --repo <councilof-ai clone> --out <scorecard.json> DIR [DIR...]
"""
import argparse
import gzip
import hashlib
import importlib.util
import json
import os
import re
import sys


def load_gate(repo):
    p = os.path.join(repo, "scripts", "outward-gate", "outward_gate.py")
    spec = importlib.util.spec_from_file_location("outward_gate", p)
    m = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(m)
    return m


def front_matter(md):
    m = re.match(r"\A---\n([\s\S]*?)\n---\n", md)
    return m.group(1) if m else ""


def yaml_license(fm):
    m = re.search(r"^license:\s*(\S+)", fm, re.M)
    return m.group(1) if m else None


def yaml_paths(fm):
    return re.findall(r"^\s+path:\s*(\S+)", fm, re.M)


def column_check(G, d, paths):
    bad, n = [], 0
    for p in paths:
        fp = os.path.join(d, p)
        if p.endswith(".parquet"):
            import pyarrow.parquet as pq
            sch = pq.read_schema(fp)
            names = [f.name for f in sch]
            nulls = [f.name for f in sch if str(f.type) == "null"]
        else:
            op = gzip.open if p.endswith(".gz") else open
            with op(fp, "rt", encoding="utf-8") as f:
                first = [json.loads(next(f)) for _ in range(100)]
            names = sorted({k for r in first for k in r})
            nulls = [k for k in names if all(r.get(k) is None for r in first)]
        meta = {"payload", "signature", "sig_ed25519", "payload_sha256"} & set(names)
        weird = [x for x in names if re.fullmatch(r"\d+|Unnamed.*|_c\d+", x)]
        if nulls or meta or weird:
            bad.append(f"{p}: nulls {nulls} meta {sorted(meta)} weird {weird}")
        n += len(names)
    return G.R("reuse.column_types_sane", G.FAIL if bad else G.PASS, "; ".join(bad) or f"{n} typed columns across {len(paths)} config file(s)")


def run_one(G, ctx, d):
    name = os.path.basename(os.path.normpath(d))
    md = open(os.path.join(d, "README.md"), encoding="utf-8").read()
    text = G.md_text(md)
    fm = front_matter(md)
    names = set()
    for root, _, fs in os.walk(d):
        for fn in fs:
            names.add(os.path.relpath(os.path.join(root, fn), d))
    sha_of = {}

    def fsha(n):
        if n not in names:
            return None
        if n not in sha_of:
            sha_of[n] = hashlib.sha256(open(os.path.join(d, n), "rb").read()).hexdigest()
        return sha_of[n]

    readme_gate, c = [], []
    # --- README gate (publication condition)
    nb = [G.clip(md[max(0, m.start() - 30): m.end() + 30], 80) for m in G.NOTICE_BANNED.finditer(md)]
    readme_gate.append(G.R("notice_banned.empty", G.FAIL if nb else G.PASS, " | ".join(nb[:5]) if nb else "no NOTICE_BANNED hit in the README"))
    readme_gate += G.doctrine_checks(text, f"/hf/csoai/{name}", G.OWN_CP, prices=True)
    # --- dataset gate (as dataset_artifact would score it)
    try:
        import yaml
        ym = yaml.safe_load(fm)
        yok, ydet = isinstance(ym, dict), f"front matter parses; keys {sorted(ym)[:8]}" if isinstance(ym, dict) else "front matter is not a mapping"
    except Exception as e:
        yok, ydet = False, f"front matter does not parse as YAML: {type(e).__name__}: {str(e)[:160]}"
    c.append(G.R("hygiene.card_yaml_parses", G.PASS if yok else G.FAIL, ydet))
    lic = yaml_license(fm)
    c.append(G.R("reuse.licence_cc_by_4", G.PASS if lic == "cc-by-4.0" else G.FAIL, f"declared licence: {lic!r}"))
    c.append(G.R("reuse.hf_viewer_works", G.NA, "needs the live Hub; checked after publication"))
    paths = yaml_paths(fm)
    missing = [p for p in paths if p not in names]
    sup = G.superseded_files(names)
    stale = [p for p in paths if p in sup]
    c.append(G.R("reuse.configs_point_at_current_files", G.FAIL if (missing or stale) else G.PASS,
                 f"missing {missing} superseded {stale}" if (missing or stale) else f"configs -> {paths}"))
    c.append(column_check(G, d, paths))
    cr = json.load(open(os.path.join(d, "croissant.json")))
    c.append(G.croissant_citation_check(cr, md, G.OWN_CP))
    signed = sorted(n for n in names if n.endswith(".signed.json"))
    c.append(G.snippet_check(md, ctx.http, G.OWN_CP) if signed else G.R("reuse.verify_snippet_works_as_written", G.NA, "no signed record"))
    if signed:
        ver, tam, ots = [], [], []
        for sn in signed:
            sb = open(os.path.join(d, sn), "rb").read()
            default_art = sn[: -len(".signed.json")] + ".json"
            ok, det, tok, tdet = G.verify_signed(sb, ctx.did, lambda nm, _d=default_art: fsha(nm if nm in names else _d))
            ver.append((sn, ok, det))
            if tok is not None:
                tam.append((sn, tok, tdet))
            art = default_art
            try:
                a2 = json.loads(sb)["payload"]["artifact"]
                cand = (a2.get("path") or a2.get("file") or "").split("/")[-1]
                art = cand if cand in names else art
            except Exception:
                pass
            if art in names:
                proofs = {}
                for pn in (art + ".ots", art + ".bitcoin.ots", art.replace(".json", ".bitcoin.ots")):
                    if pn in names and pn not in proofs:
                        proofs[pn] = open(os.path.join(d, pn), "rb").read()
                ots.append((art, G.ots_state_check(fsha(art), proofs, G.stated_about(md, art), G.OWN_CP)))
        bad = [f"{n}: {x}" for n, ok, x in ver if not ok]
        c.append(G.R("integrity.signatures_verify_public_only", G.FAIL if bad else G.PASS, "; ".join(bad) or f"{len(ver)} signed record(s) verify with did.json only"))
        badt = [f"{n}: {x}" for n, ok, x in tam if not ok]
        c.append(G.R("integrity.tamper_control_fails", G.FAIL if (badt or not tam) else G.PASS, "; ".join(badt) or f"tampered copies rejected for {len(tam)} record(s)"))
        for art, rs in ots:
            for x in rs:
                x["check"] = f"{x['check']}[{art}]"
                c.append(x)
        if not ots:
            c.append(G.R("integrity.ots_present", G.FAIL, "no .ots proof for any signed record's artifact"))
    claims = G.readme_sha_claims(md, names)
    for sn in signed:
        try:
            claims += G.payload_file_claims(json.load(open(os.path.join(d, sn)))["payload"], names)
        except Exception:
            pass
    claims = sorted(set(claims))
    badc = [f"{fn}: stated {w[:12]} got {(fsha(fn) or 'missing')[:12]}" for fn, w in claims if fsha(fn) != w]
    c.append(G.R("integrity.file_sha256_match", G.FAIL if badc else (G.PASS if claims else G.NA),
                 "; ".join(badc) or f"{len(claims)} stated sha256(s) match the staged bytes"))
    c.append(G.R("currency.supersession_banner", G.NA, "no versioned successor file") if not sup else
             G.R("currency.supersession_banner", G.FAIL, f"versioned files {sorted(sup)[:3]}"))
    c.append(G.currency_numbers(text, ctx.live, G.OWN_CP))
    links = re.findall(r"https?://[^\s)\]>\"'`]+", md)
    c += G.accountability_checks(md, text, G.OWN_CP, links)
    c += G.doctrine_checks(text, f"/hf/csoai/{name}", G.OWN_CP)

    def score(xs):
        sc = [x for x in xs if x["status"] != G.NA]
        return sum(1 for x in sc if x["status"] == G.PASS), len(sc)

    rp, rn = score(readme_gate)
    dp, dn = score(c)
    return {"dataset": f"csoai/{name}", "readme_gate": {"pass": rp, "of": rn, "at_100": rp == rn, "checks": readme_gate},
            "dataset_gate": {"pass": dp, "of": dn, "at_100": dp == dn, "na": [x["check"] for x in c if x["status"] == G.NA],
                             "checks": c}}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--repo", required=True)
    ap.add_argument("--out", required=True)
    ap.add_argument("dirs", nargs="+")
    a = ap.parse_args()
    G = load_gate(a.repo)
    ctx = G.Ctx(G.Http(min_interval=1.05)).load()
    res = [run_one(G, ctx, d) for d in a.dirs]
    json.dump({"live": ctx.live, "did_status": ctx.did_status, "results": res}, open(a.out, "w"), indent=1)
    for r in res:
        rg, dg = r["readme_gate"], r["dataset_gate"]
        print(f"{r['dataset']}: README gate {rg['pass']}/{rg['of']}  dataset gate {dg['pass']}/{dg['of']} (NA: {', '.join(dg['na'])})")
        for x in rg["checks"] + dg["checks"]:
            if x["status"] == G.FAIL:
                print(f"   FAIL {x['check']}: {x['evidence'][:300]}")


if __name__ == "__main__":
    main()
