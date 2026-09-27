#!/usr/bin/env python3
"""Build the published record behind /interop/a2a-jcs-2026-09-27/ from the 2026-09-27 run folder.

    python3 scripts/interop/a2a_tck_jcs_summary.py --runs <A2A-TCK-JCS-2026-09-27/runs> \
        --public public/interop/a2a-jcs-2026-09-27 --data client/src/data/a2a-tck-jcs-2026-09-27.json

Every count on the page comes from here:
  - per implementation and target: vectors / passed / outcomes, read from the unmodified a2a-tck
    runner's own records (runs/<impl>.json), which are copied to --public byte for byte;
  - the beyond-corpus fuzz counts, parsed from runs/fuzz_beyond_corpus.txt (copied too);
  - the census verdict-change counts, parsed from runs/census_strict_jcs.txt. That file names the
    hosts whose cards were read, so it is NOT copied; only its aggregate lines are used.
Nothing here re-runs a canonicaliser. It reads, counts and hashes.
"""
import argparse, ast, hashlib, json, pathlib, re, shutil

IMPLS = [
    # key, label, role, path in councilof-ai at the tested commit, on the agent-card path?
    ("probe", "Census verifier, 0.x rule path", "Every published A2A agent-card census verdict comes from this code.",
     "scripts/census/a2a-card-probe.py jcs() + RULE_0X", True),
    ("probe1x", "Census verifier, 1.x rule path", "The same verifier with A2A 8.4.3 defaults removed before signing.",
     "scripts/census/a2a-card-probe.py jcs() + RULE_1X", True),
    ("signer", "Our card signer", "Signs CSOAI's own agent card.", "scripts/adapters/agent_card_jws.py", True),
    ("indep", "Independent verifier of our card", "Checks our own card; hand-written on purpose.",
     "scripts/verify_agent_card_jws.py", True),
    ("ts", "TypeScript test canonicaliser", "A vitest over our own card.", "functions/api/agent-card-jws.test.ts (sortDeep + JSON.stringify)", True),
    ("arena", "Arena JCS (for information)", "Not on the agent-card path.", "harness/arena/jcs.py", False),
    ("sorted_utf8", "Sorted-keys JSON, UTF-8 (for information)", "A different format, not on the agent-card path.", "json.dumps(sort_keys=True)", False),
    ("sorted_ascii", "Sorted-keys JSON, ASCII / GSPC Rule A (for information)",
     "A different format that defines published card ids; not on the agent-card path.", "json.dumps(sort_keys=True, ensure_ascii=True)", False),
    ("reference", "Reference: rfc8785 0.1.4", "The oracle check, through the same runner.", "PyPI rfc8785==0.1.4", False),
    ("probe_patched", "Census verifier with rfc8785.dumps, 0.x path", "The fix landed with this page.",
     "scripts/census/a2a-card-probe.py after the swap", True),
    ("probe_patched_1x", "Census verifier with rfc8785.dumps, 1.x path", "The fix landed with this page.",
     "scripts/census/a2a-card-probe.py after the swap", True),
]


def sha(p):
    return hashlib.sha256(pathlib.Path(p).read_bytes()).hexdigest()


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--runs", required=True)
    ap.add_argument("--public", required=True)
    ap.add_argument("--data", required=True)
    a = ap.parse_args()
    runs, pub = pathlib.Path(a.runs), pathlib.Path(a.public)
    (pub / "runs").mkdir(parents=True, exist_ok=True)
    impls, digests, commits = [], set(), set()
    for key, label, role, path, on_path in IMPLS:
        src = runs / f"{key}.json"
        d = json.loads(src.read_text())
        shutil.copyfile(src, pub / "runs" / src.name)
        digests.add(d["corpusDigest"]); commits.add(d["specCommit"])
        impls.append({"key": key, "label": label, "role": role, "code": path, "agent_card_path": on_path,
                      "record": f"runs/{src.name}", "record_sha256": sha(src),
                      "targets": {t: {"vectors": v["vectors"], "passed": v["passed"], "failed": v["failed"],
                                      "outcomes": {k: n for k, n in v["outcomes"].items() if n}}
                                  for t, v in d["targets"].items()}})
    assert len(digests) == 1 and len(commits) == 1, (digests, commits)
    fz = runs / "fuzz_beyond_corpus.txt"
    shutil.copyfile(fz, pub / "runs" / fz.name)
    ft = fz.read_text()
    cases = ast.literal_eval(re.search(r"cases per class (\{.*\})", ft).group(1))
    probe_div = ast.literal_eval(re.search(r"== probe (\{.*\})", ft).group(1))
    ct = (runs / "census_strict_jcs.txt").read_text()
    census = []
    for block in re.split(r"(?m)^===== ", ct)[1:]:
        run = block.split(":", 1)[0].strip()
        census.append({
            "run": {"data25": "2026-09-25 (v0.1.1)", "data27": "2026-09-27 (latest)"}.get(run, run),
            "cards_read": int(re.search(r"bodies (\d+)", block).group(1)),
            "bodies_matching_card_sha256": int(re.search(r"sha256\(body\)==card_sha256 for (\d+)", block).group(1)),
            "cards_whose_jcs_differs": int(re.search(r"differs ours vs rfc8785: (\d+)", block).group(1)),
            "signed_cards": int(re.search(r"cards with a signatures block: (\d+)", block).group(1)),
            "signed_cards_whose_signing_input_changes": int(re.search(r"signing input changes under strict JCS: (\d+)", block).group(1)),
        })
    exposure = {m.group(1): {"float_values": int(m.group(2)), "in_defect_ranges": int(m.group(3)), "ints_beyond_2_53": int(m.group(4))}
                for m in re.finditer(r"(?m)^(data\d+) float values in all cards: (\d+) in the defect ranges: (\d+) ints beyond 2\^53: (\d+)", ct)}
    for c, k in zip(census, ("data25", "data27")):
        c["exposure"] = exposure[k]
    table = runs / "table.json"
    shutil.copyfile(table, pub / "runs" / table.name)
    out = {
        "schema": "csoai.interop.a2a-tck-jcs/0.1",
        "date": "2026-09-27",
        "vectors": {
            "pr": "https://github.com/a2aproject/a2a-tck/pull/228",
            "pr_state_when_run": "open, not merged",
            "head": "astrogilda/a2a-tck@97b007237ee4c3b802ed563829e3937a5529244e",
            "manifest_sha256": "d38f4121bcae85f875be5de4802fa9ca4e773aec5e3a9ae1c0134825a5779a98",
            "corpus_digest": digests.pop(),
            "spec_commit": commits.pop(),
            "runner": "run_python.py from the PR, unmodified",
        },
        "tested_code": "councilof-ai master 720124db6bfd (2026-09-27 03:39Z)",
        "implementations": impls,
        "per_vector_table": {"record": "runs/table.json", "record_sha256": sha(table)},
        "fuzz": {"record": "runs/fuzz_beyond_corpus.txt", "record_sha256": sha(fz), "cases_per_class": cases,
                 "census_verifier_divergences_before_fix": probe_div},
        "census": census,
        "census_note": ("Counted from the census raw card bodies on the measuring host; the per-card file names hosts and is not "
                        "published. A JWS verdict depends only on the protected header, the payload bytes and the key, so an "
                        "unchanged signing input is an unchanged verdict."),
    }
    pathlib.Path(a.data).write_text(json.dumps(out, indent=1, ensure_ascii=False) + "\n")
    shutil.copyfile(a.data, pub / "summary.json")
    print(json.dumps({"implementations": len(impls), "census": census}, indent=1))


if __name__ == "__main__":
    main()
