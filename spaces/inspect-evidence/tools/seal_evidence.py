"""Seal Inspect .eval logs into a Layer-0-style evidence manifest.

Inputs : a directory of .eval logs + a pin table (task -> dataset revision taken
         from the task's source constant, because .eval headers do not record
         the HF dataset revision).
Outputs: evidence/logs/*.eval (copied byte-for-byte), evidence/evidence_manifest.json,
         evidence/evidence_manifest.csv, evidence/evidence_manifest.md

Merkle rule (RFC 6962 style, recomputed in-browser by the Space):
  leaves  = logs sorted by filename (byte order); leaf_i = SHA256(0x00 || raw32(sha256(file_i)))
  parent  = SHA256(0x01 || left || right); an odd node at a level is promoted unchanged.
Attestation state: CONTENT_ADDRESSED_UNSIGNED (no private key is used here; signing is an owner step).
"""
import csv, hashlib, json, shutil, sys, datetime as dt
from pathlib import Path
from inspect_ai.log import read_eval_log
import inspect_ai

PINS = {  # task -> (dataset, revision, where the pin was read)
    "gspc_govbench": ("csoai/gspc-gov", "c6ddc5a92c2354248e6b1328ebd341872ee80019",
                      "gspc_govbench/govbench.py DATASET_REVISION"),
    "inspect_evals/air_bench": ("stanford-crfm/air-bench-2024", "976d9fbb0f52bce704dcbef5bd7a2652e65f2a21",
                                "inspect_evals/air_bench/air_bench.py AIR_BENCH_DATASET_REVISION"),
    "inspect_evals/coconot": ("allenai/coconot", "2cbe16aabf9069f17e48c8daad8aeabc29469eb7",
                              "inspect_evals/coconot/coconot.py COCONOT_DATASET_REVISION"),
}
AXES = {"gspc_govbench": "governance", "inspect_evals/air_bench": "art5-safeguard (partial), governance (adjacent)",
        "inspect_evals/coconot": "safety, care (partial; substitute for gated XSTest)"}


def sha256_file(p: Path) -> str:
    h = hashlib.sha256()
    with open(p, "rb") as f:
        for b in iter(lambda: f.read(1 << 20), b""):
            h.update(b)
    return h.hexdigest()


def merkle_root(hex_leaves: list[str]) -> str:
    level = [hashlib.sha256(b"\x00" + bytes.fromhex(x)).digest() for x in hex_leaves]
    if not level:
        return ""
    while len(level) > 1:
        nxt = []
        for i in range(0, len(level), 2):
            if i + 1 < len(level):
                nxt.append(hashlib.sha256(b"\x01" + level[i] + level[i + 1]).digest())
            else:
                nxt.append(level[i])
        level = nxt
    return level[0].hex()


def main(src_dirs: list[str], out_dir: str = "evidence") -> None:
    out = Path(out_dir); (out / "logs").mkdir(parents=True, exist_ok=True)
    files = sorted({p for d in src_dirs for p in Path(d).glob("*.eval")}, key=lambda p: p.name)
    rows = []
    for p in files:
        dst = out / "logs" / p.name
        shutil.copyfile(p, dst)
        h = read_eval_log(str(dst), header_only=True)
        e = h.eval
        model = e.model
        kind = "PIPELINE_TEST_MOCKLLM (not a measurement)" if model.startswith("mockllm/") \
            else "SMOKE_RUN_REAL_MODEL (n too small for any claim)"
        ds, rev, pin_src = PINS.get(e.task, (e.dataset.name, "UNPINNED", "not recorded"))
        args = {k: v for k, v in (e.task_args_passed or {}).items()}
        metrics = {}
        if h.results:
            for s in h.results.scores:
                for k, v in s.metrics.items():
                    metrics[f"{s.name}.{k}"] = v.value
        rows.append(dict(
            file=p.name, sha256=sha256_file(dst), bytes=dst.stat().st_size,
            task=e.task, task_version=str(e.task_version), task_args=json.dumps(args, sort_keys=True),
            model=model, run_kind=kind, status=h.status,
            samples_run=(h.results.total_samples if h.results else 0), dataset_size=e.dataset.samples,
            dataset=ds, dataset_revision=rev, revision_pin_source=pin_src,
            inspect_ai=e.packages.get("inspect_ai", ""), inspect_evals=e.packages.get("inspect_evals", ""),
            eval_id=e.eval_id, run_id=e.run_id, created=e.created, gspc_axes=AXES.get(e.task, ""),
            metrics=json.dumps(metrics, sort_keys=True, default=str),
        ))
    root = merkle_root([r["sha256"] for r in rows])
    manifest = dict(
        schema="layer0-evidence-manifest/0.1",
        sealed_at=dt.datetime.now(dt.timezone.utc).isoformat(timespec="seconds"),
        sealer_inspect_ai=inspect_ai.__version__,
        attestation="CONTENT_ADDRESSED_UNSIGNED",
        attestation_note="Hashes and Merkle root only; no signature. An owner Ed25519 signature over merkle_root "
                         "(e.g. under did:web:csoai.org) is the next step and is NOT performed here.",
        merkle_rule="leaves sorted by filename; leaf=SHA256(0x00||sha256(file)); node=SHA256(0x01||L||R); odd node promoted",
        merkle_root=root, leaf_count=len(rows),
        caveat="mockllm rows are pipeline tests: the mock model returns a fixed default string, so metrics are not measurements.",
        logs=rows,
    )
    (out / "evidence_manifest.json").write_text(json.dumps(manifest, indent=2, default=str))
    with open(out / "evidence_manifest.csv", "w", newline="") as f:
        w = csv.DictWriter(f, fieldnames=list(rows[0].keys())); w.writeheader(); w.writerows(rows)
    md = [f"# Evidence manifest ({manifest['schema']})", "",
          f"- sealed_at: `{manifest['sealed_at']}`", f"- merkle_root: `{root}` over {len(rows)} logs",
          f"- merkle_rule: {manifest['merkle_rule']}", f"- attestation: **{manifest['attestation']}**: {manifest['attestation_note']}",
          f"- caveat: {manifest['caveat']}", "",
          "| file | sha256 | task (v) | model | run_kind | n run / dataset | dataset@revision |", "|---|---|---|---|---|---|---|"]
    for r in rows:
        md.append(f"| {r['file']} | `{r['sha256']}` | {r['task']} ({r['task_version']}) | {r['model']} | {r['run_kind']} | "
                  f"{r['samples_run']} / {r['dataset_size']} | {r['dataset']}@{r['dataset_revision'][:12]} |")
    (out / "evidence_manifest.md").write_text("\n".join(md) + "\n")
    print(root, len(rows))


if __name__ == "__main__":
    main(sys.argv[1:] or ["logs"])
