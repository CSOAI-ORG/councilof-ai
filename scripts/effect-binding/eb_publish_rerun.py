#!/usr/bin/env python3
"""Effect-binding server probe: build the artifact for a DATED RE-RUN over the servers of an earlier signed run.

    eb_publish_rerun.py <run_dir> <code_dir> <parent_artifact.json> <parent_signed.json> <date YYYY-MM-DD>
                        [--lane NAME] [--companion]

--companion (the monthly re-probe, scripts/effect-binding/eb-monthly-pod.sh + the Oracle trigger): the artifact
says it is signed, if at all, by <name>.signed.json, whose payload pins its sha256; the staged-only wording goes.
A bank holding the parent's whole 600-server frozen slice (eb_monthly_bank.py) is described as that slice.

Same method: the counts, rows, instrument text and controls block are produced by the PUBLISHED eb_publish.py
(<code_dir>/eb_publish.py, executed unmodified up to the point where it names and writes its file). This script then
changes only what is not true of a re-run: the file name and date, the population wording (a subset of the parent's
frozen bank, no reshuffle), the signature state, the board consequence and the produced_by / raw_log lines, and adds
a same-server comparison with the parent run. It uploads nothing and signs nothing.

Nothing here is a grade. A same-server transition mixes a change in the service with the run-to-run variance of one
probe on one day; it is recorded, not interpreted as a trend.
"""
import collections, hashlib, json, os, platform, subprocess, sys

RUN, CODE, PARENT, PARENT_SIGNED, DATE = sys.argv[1:6]
_opt = sys.argv[6:]
LANE = _opt[_opt.index("--lane") + 1] if "--lane" in _opt else "measure-refresh-20260928"
COMPANION = "--companion" in _opt
NAME = f"effect-binding-server-probe-{DATE}"
CODE_FILES = ("eb_harvest.py", "eb_mcp.py", "eb_probe.py", "eb_controls.py", "eb_run.py", "eb_publish.py")


def fsha(p):
    return hashlib.sha256(open(p, "rb").read()).hexdigest()


def blob(p):
    return subprocess.check_output(["git", "hash-object", p], text=True).strip()


# 1. the published builder, unmodified, up to (not including) the line that names its output file
src = open(os.path.join(CODE, "eb_publish.py")).read()
cut = src.index('name = "effect-binding-server-probe-2026-09-22"')
ns = {"__name__": "eb_publish_published"}
argv0 = sys.argv
sys.argv = ["eb_publish.py", RUN, "build"]
exec(compile(src[:cut], os.path.join(CODE, "eb_publish.py"), "exec"), ns)
sys.argv = argv0
art, tp, sf, n_ok, bank, sl = ns["art"], ns["tp"], ns["sf"], ns["n_ok"], ns["bank"], ns["sl"]

parent_b = open(PARENT, "rb").read()
parent = json.loads(parent_b)
psigned = json.load(open(PARENT_SIGNED))
assert hashlib.sha256(parent_b).hexdigest() == psigned["payload"]["artifact"]["sha256"], "parent artifact is not the signed one"
assert bank.get("parent_artifact_sha256") == hashlib.sha256(parent_b).hexdigest(), "bank was not drawn from this parent"

# 2. the code this run executed == the code published with the parent (git blob ids, sizes)
code = {f: {"sha256": fsha(os.path.join(RUN, f)), "git_blob": blob(os.path.join(RUN, f))} for f in CODE_FILES}
for f in CODE_FILES:
    assert fsha(os.path.join(RUN, f)) == fsha(os.path.join(CODE, f)), f"{f}: run copy differs from code dir"

# 3. what is not true of a re-run
art["signed"] = False
art["signature_state"] = "SIGN_PENDING"
art["unsigned_reason"] = ("SIGN_PENDING. The signing path used for the parent run (POST /api/board-sign with the pod caller "
                          "token) needs a token file that is not present on the rebuilt build pod outside the deploy-host "
                          "directories, which this lane may not read. Signing is left to integration; until then this file "
                          "is unsigned and is not evidence for the board.")
if COMPANION:
    art.pop("unsigned_reason", None)
    art["signature_state"] = "SIGNED_BY_COMPANION_IF_PRESENT"
    art["signature_note"] = (f"This file is not signed in place. It is signed, if at all, by {NAME}.signed.json beside it, whose "
                             "payload pins this file's sha256 (did:web:csoai.org#board-attestation-1 via POST /api/board-sign; "
                             "the PKCS8 never leaves Cloudflare). Without that companion this file is unsigned and is not evidence.")
pop = art["population"]
pop["bank_kind"] = bank["kind"]
pop["bank_rows_third_party"], pop["bank_rows_self"] = bank["rows_third_party"], bank["rows_self"]
pop["parent_bank_sha256"] = bank["parent_bank_sha256"]
pop["parent_artifact_sha256"] = bank["parent_artifact_sha256"]
pop["selection_rule"] = bank["selection_rule"]
FULL_SLICE = bank["rows_third_party"] == parent["population"]["frozen_slice"]["slice_n"]
pop["frozen_slice"] = {"rule": ("the parent's whole frozen slice: the same 600 third-party servers (seed 20260922), tried again whatever "
                                "their parent outcome; the run's own seeded shuffle only orders the work queue" if FULL_SLICE else
                                "no reshuffle: every third-party row of the bank (the parent run's servers with a verdict), in the parent's slice order"),
                       "seed": sl["seed"], "slice_n": sl["slice_n"], "chosen_names": sl["chosen"]}
pop["registry_reread"] = False
pop["registry_note"] = ("No registry was re-read. The same remote URL probed on the parent date is probed again (URL equal for "
                        "every third-party row); a server that moved its endpoint since is probed at the old one.")
art["regrade"] = None
art["regrade_note"] = "No regrade. Verdicts come from the rules the parent run published after its P4 regrade (eb_probe.py, same bytes)."
art["method_limitations"] = [x for x in art["method_limitations"]
                             if not x.startswith("Unsigned:") and not x.startswith("No GitHub write")] + [
] + ([
    "Signed only through the companion named in signature_note. This is not a card in any of the three card corpora and does not alter /api/gspc.",
    "No board write: board slot 23 rests on the signed parent run; a monthly re-run neither replaces nor re-flips it.",
] if COMPANION else [
    "Unsigned (SIGN_PENDING, see unsigned_reason). This is not a card in any of the three card corpora and does not alter /api/gspc.",
    "Staged only: no board write, no deploy, no upload. Publication, if any, happens at integration.",
]) + ([] if FULL_SLICE else [
    "Population is the parent run's verdict set, so servers that were UNCHECKABLE / UNREACHABLE / without a read-only tool on the "
    "parent date are not re-tried; this run says nothing about them.",
])
art["board_consequence"] = {
    "board_status_after_this_run": "unchanged by this run",
    "note": ("Board slot 23 rests on the signed parent run (see rerun_of). This dated re-run " +
             ("is signed only through its companion (signature_note)" if COMPANION else "is staged unsigned") +
             "; it neither replaces nor confirms the parent on the board, and no board write was attempted."),
    "adr_002_gate": {"n_unit": "tool-call servers probed", "minimum_third_party_servers_with_verdict": 30,
                     "third_party_servers_with_verdict": n_ok, "n_gate_reached": n_ok >= 30, "frozen_bank": True,
                     "run_signed": False, "signed_run_published": False, "flipped": False},
}
art["produced_by"] = (f"the parent run's published code (git blob ids in code_executed) plus eb_publish_rerun.py, on the build pod "
                      f"(RunPod, host {platform.node()}), lane {LANE}; no GitHub write, no board write" + ("" if COMPANION else ", no upload"))
art["code_executed"] = code
art["raw_log"] = f"{NAME}.log.jsonl beside this file (every request and response, verbatim; no credentials were ever sent)"

# 4. same-server comparison with the parent (same servers, same code, same rules)
old = {s["name"]: s for s in parent["third_party"]["servers"]}
new = {s["name"]: s for s in art["third_party"]["servers"]}
assert set(new) <= set(old), "a re-run row is not in the parent"
trans = collections.Counter(f'{old[k]["outcome"]} -> {new[k]["outcome"]}' for k in sorted(new))
changed = [{"name": k, "url": new[k]["url"], "parent": old[k]["outcome"], "rerun": new[k]["outcome"],
            "rerun_drop_reason": new[k].get("drop_reason")} for k in sorted(new) if old[k]["outcome"] != new[k]["outcome"]]
art["rerun_of"] = {
    "artifact": psigned["payload"]["artifact"]["path"], "sha256": psigned["payload"]["artifact"]["sha256"],
    "as_of": parent["as_of"], "signed_payload_sha256": psigned["signature"]["payload_sha256"],
    "signed_at": psigned["signature"].get("signed_at"),
    "parent_counts": {"n": parent["n"], "verdicts": psigned["payload"]["verdicts"], "tried": psigned["payload"]["tried"]},
}
art["comparison_with_parent"] = {
    "method": ("same servers (the parent's 600-server frozen slice)" if FULL_SLICE else "same servers (the parent's third-party verdict set)") +
              ", same remote URLs, same code bytes, same safety rules and verdict rule",
    "servers_compared": len(new),
    "same_outcome": sum(1 for k in new if old[k]["outcome"] == new[k]["outcome"]),
    "outcome_transitions": dict(sorted(trans.items())),
    "changed": changed,
    "reading": ("A transition is recorded, not interpreted: it mixes a change in the service with the variance of one probe on " +
                ("one day (timeouts, rate limits). " + ("n is comparable in population with the parent's n: both come from the same 600 tried "
                "servers; it is still one probe per server per date, not a trend." if FULL_SLICE else "n is not comparable to the parent's n as a trend: the parent's n came from 600 "
                "tried servers, this run's from the parent's 261 verdict servers."))),
    "self_rows": {"parent": dict(collections.Counter(s["outcome"] for s in parent["self"]["servers"])),
                  "rerun": dict(collections.Counter(s["outcome"] for s in art["self"]["servers"])),
                  "note": "SELF rows are never in n and never added to third-party counts."},
}

apath = os.path.join(RUN, NAME + ".json")
with open(apath, "w") as fh:
    json.dump(art, fh, indent=1, sort_keys=False)
print("artifact", apath, os.path.getsize(apath), fsha(apath))
print(json.dumps({"n": n_ok, "third_party": tp["outcomes"], "self": sf["outcomes"],
                  "transitions": art["comparison_with_parent"]["outcome_transitions"]}, indent=1))
