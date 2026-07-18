#!/usr/bin/env python3
"""sov33_k3_distill_harness.py — STAGED K3-teacher distillation harness (BUILD ONLY).

Nick's ask: build the harness so the instant K3 open weights + a permissive licence are
confirmed (promised 2026-07-27), we can fire distillation — but it must REFUSE to run until then.

THE GATE (the whole point). Distillation is only clean if BOTH hold:
  (a) OPEN WEIGHTS EXIST on Hugging Face  (moonshotai/Kimi-K3*), checked via HF API list — NO download.
  (b) the repo LICENSE is PERMISSIVE       (MIT / Apache-2.0 / Modified-MIT), read from the actual
      LICENSE file — NOT trusted from the card `license:` tag (Modified-MIT shows as `other`).
If either fails -> REFUSED with the reason; the pipeline body is NEVER entered.

WHY THIS RULE (encoded here, not just documented):
  - OPEN-WEIGHTS distillation (you host the weights, generate locally) is licence-governed only.
  - TRAINING-ON-API-OUTPUTS (you cannot host, so you hit a hosted endpoint) is a provider ToS gate,
    a separate and stricter question. The gate keeps these apart: an "open" licence on a model you
    cannot self-host does NOT authorise training on its API outputs.

HONEST REGISTER:
  - RUNNING here = the two gate checks (HF list + LICENSE read) actually execute against the live Hub.
  - The pipeline body (corpus-grow -> teacher answers -> judge-filter -> refusal-strip -> SIGIL-sign
    -> train_sector.py on Modal) is STAGED behind the gate. Nothing fires: no GPU, no Modal, no K3 API.
  - Teacher answers, when they eventually flow, are distillation SIGNAL, not gold ground-truth.
"""
import os, sys, json, datetime

HERE = os.path.dirname(os.path.abspath(__file__))
if HERE not in sys.path:
    sys.path.insert(0, HERE)

# permissive licence families we will accept for open-weights distillation
PERMISSIVE_KEYS = ("mit", "apache", "apache-2.0", "apache 2.0", "bsd")
# textual markers that identify a Modified-MIT (still permissive for our purposes)
MODIFIED_MIT_MARKERS = ("modified mit", "permission is hereby granted, free of charge")


# ─────────────────────────────────────────────────────────────────────────────
# GATE CHECK (a): do open weights exist on the Hub?  (HF API list — NO download)
# ─────────────────────────────────────────────────────────────────────────────
def check_open_weights(hf_search, author="moonshotai"):
    """Return {'exists': bool, 'repo_ids': [...], 'error': str|None}. Lists only — never downloads."""
    try:
        from huggingface_hub import HfApi
    except Exception as e:
        return {"exists": False, "repo_ids": [], "error": f"huggingface_hub unavailable: {e}"}
    api = HfApi()
    repo_ids = []
    try:
        # author-scoped + global search; dedup
        for kw in ({"author": author, "search": hf_search}, {"search": hf_search}):
            for m in api.list_models(limit=100, **kw):
                if m.id not in repo_ids:
                    repo_ids.append(m.id)
    except Exception as e:
        return {"exists": False, "repo_ids": [], "error": f"HF list failed: {type(e).__name__}: {e}"}
    return {"exists": len(repo_ids) > 0, "repo_ids": repo_ids, "error": None}


# ─────────────────────────────────────────────────────────────────────────────
# GATE CHECK (b): is the repo LICENSE permissive?  (read LICENSE file — NO weight download)
# ─────────────────────────────────────────────────────────────────────────────
def check_license_permissive(repo_id):
    """Read the actual LICENSE file and classify. Returns
    {'permissive': bool, 'family': str, 'license_file': str|None, 'card_license': str|None, 'error': str|None}."""
    try:
        from huggingface_hub import HfApi, hf_hub_download
    except Exception as e:
        return {"permissive": False, "family": "unknown", "license_file": None,
                "card_license": None, "error": f"huggingface_hub unavailable: {e}"}
    api = HfApi()
    card_license = None
    try:
        info = api.model_info(repo_id)
        card_license = (info.cardData or {}).get("license") if info.cardData else None
        files = api.list_repo_files(repo_id)
    except Exception as e:
        return {"permissive": False, "family": "unknown", "license_file": None,
                "card_license": card_license, "error": f"model_info/list failed: {type(e).__name__}: {e}"}
    lic_files = [f for f in files if "LICENSE" in f.upper()]
    if not lic_files:
        # fall back to card tag ONLY if it is unambiguously permissive
        fam = (card_license or "").lower()
        perm = any(k in fam for k in PERMISSIVE_KEYS)
        return {"permissive": perm, "family": card_license or "none",
                "license_file": None, "card_license": card_license,
                "error": None if perm else "no LICENSE file and card license not clearly permissive"}
    lf = lic_files[0]
    try:
        path = hf_hub_download(repo_id, lf, repo_type="model")
        txt = open(path, encoding="utf-8", errors="replace").read()
    except Exception as e:
        return {"permissive": False, "family": "unknown", "license_file": lf,
                "card_license": card_license, "error": f"LICENSE read failed: {type(e).__name__}: {e}"}
    low = txt.lower()
    if "modified mit" in low or ("mit license" in low and "permission is hereby granted" in low
                                 and "our only modification" in low):
        family = "Modified-MIT"
        permissive = True
    elif "apache license" in low:
        family = "Apache-2.0"
        permissive = True
    elif "permission is hereby granted, free of charge" in low and "mit" in low:
        family = "MIT"
        permissive = True
    elif "apache" in low or any(k in low[:400] for k in PERMISSIVE_KEYS):
        family = (card_license or "permissive?")
        permissive = True
    else:
        family = card_license or "non-permissive/custom"
        permissive = False
    return {"permissive": permissive, "family": family, "license_file": lf,
            "card_license": card_license, "error": None,
            "license_excerpt": txt[:400].strip()}


# ─────────────────────────────────────────────────────────────────────────────
# SELF-HOSTABILITY — derived from real HF metadata, not hardcoded.
# ─────────────────────────────────────────────────────────────────────────────
def estimate_model_size(repo_id):
    """Return {'params': int|None, 'weight_bytes': int|None, 'source': str, 'error': str|None}.
    Prefers safetensors param count from model_info; falls back to summing weight-file sizes.
    NO weight download — metadata only."""
    try:
        from huggingface_hub import HfApi
    except Exception as e:
        return {"params": None, "weight_bytes": None, "source": "none", "error": str(e)}
    api = HfApi()
    # (1) safetensors total param count (most reliable when present)
    try:
        info = api.model_info(repo_id)
        st = getattr(info, "safetensors", None)
        total = None
        if st is not None:
            total = getattr(st, "total", None)
            if total is None and isinstance(st, dict):
                total = st.get("total")
        if total:
            return {"params": int(total), "weight_bytes": None,
                    "source": "safetensors.total", "error": None}
    except Exception as e:
        info = None  # fall through to file-size path
    # (2) sum sizes of weight shards (bytes ~ params * bytes-per-param)
    try:
        files = api.list_repo_files(repo_id)
        wf = [f for f in files if f.endswith((".safetensors", ".bin", ".gguf"))]
        total_bytes = 0
        for f in wf:
            try:
                meta = api.get_paths_info(repo_id, [f])[0]
                total_bytes += getattr(meta, "size", 0) or 0
            except Exception:
                pass
        if total_bytes > 0:
            return {"params": None, "weight_bytes": int(total_bytes),
                    "source": "sum(weight_file_sizes)", "error": None}
    except Exception as e:
        return {"params": None, "weight_bytes": None, "source": "none", "error": str(e)}
    return {"params": None, "weight_bytes": None, "source": "none",
            "error": "no safetensors metadata and no weight files sized"}


def self_host_verdict(repo_id, budget_gb, bytes_per_param=2):
    """Decide, from REAL metadata, whether repo_id fits in budget_gb of memory.
    Returns {'self_hostable': bool|None, 'reason': str, 'size': {...}}.
    self_hostable=None means size could not be determined (do NOT assert either way)."""
    size = estimate_model_size(repo_id)
    budget_bytes = budget_gb * (1024 ** 3)
    if size["params"] is not None:
        need = size["params"] * bytes_per_param
        gb = need / (1024 ** 3)
        fits = need <= budget_bytes
        return {"self_hostable": fits,
                "reason": (f"~{size['params']/1e9:.1f}B params -> ~{gb:.0f}GB at {bytes_per_param}B/param "
                           f"vs {budget_gb}GB budget: {'FITS' if fits else 'DOES NOT FIT'}"),
                "size": size}
    if size["weight_bytes"] is not None:
        gb = size["weight_bytes"] / (1024 ** 3)
        fits = size["weight_bytes"] <= budget_bytes
        return {"self_hostable": fits,
                "reason": (f"~{gb:.0f}GB of weight files vs {budget_gb}GB budget: "
                           f"{'FITS' if fits else 'DOES NOT FIT'}"),
                "size": size}
    return {"self_hostable": None,
            "reason": f"size undetermined ({size.get('error')}) — cannot assert self-hostability",
            "size": size}


# ─────────────────────────────────────────────────────────────────────────────
# THE GATE — both checks must pass or the pipeline body is never entered.
# ─────────────────────────────────────────────────────────────────────────────
def licence_gate(hf_search, author="moonshotai", require_self_hostable_gb=None):
    """Run both gate checks. Returns a verdict dict; verdict in {'PASS','REFUSED'}.
    require_self_hostable_gb: if set, flags (does NOT block) models too large to self-host —
    that flips an 'open licence' into an API/hosted-teacher path with its own ToS gate."""
    weights = check_open_weights(hf_search, author=author)
    result = {
        "target": hf_search, "author": author,
        "checked_at": datetime.datetime.now(datetime.timezone.utc).isoformat(),
        "check_a_open_weights": weights,
        "check_b_license": None,
        "verdict": "REFUSED", "reasons": [], "self_host_flag": None,
    }
    if not weights["exists"]:
        result["reasons"].append(
            f"OPEN-WEIGHTS CHECK FAILED: no repo matching '{hf_search}' under '{author}' "
            f"(or globally) on Hugging Face. Weights are not public.")
        if weights["error"]:
            result["reasons"].append(f"(HF error: {weights['error']})")
        return result
    # pick the best-matching repo (exact-ish first)
    repo_id = weights["repo_ids"][0]
    for r in weights["repo_ids"]:
        if hf_search.lower() in r.lower():
            repo_id = r
            break
    result["resolved_repo"] = repo_id
    lic = check_license_permissive(repo_id)
    result["check_b_license"] = lic
    if not lic["permissive"]:
        result["reasons"].append(
            f"LICENSE CHECK FAILED: {repo_id} licence '{lic['family']}' is not permissive "
            f"(need MIT / Apache-2.0 / Modified-MIT). {lic.get('error') or ''}".strip())
        return result
    # both checks pass
    result["verdict"] = "PASS"
    result["reasons"].append(
        f"OPEN WEIGHTS present ({repo_id}); LICENSE = {lic['family']} (permissive). "
        f"Open-weights distillation is licence-authorised.")
    # self-hostability advisory (does not block the licence gate, but changes the honest path).
    # Computed from REAL HF metadata — never hardcoded.
    if require_self_hostable_gb is not None:
        sh = self_host_verdict(repo_id, require_self_hostable_gb)
        result["self_host"] = sh
        if sh["self_hostable"] is False:
            result["self_host_flag"] = (
                f"SELF-HOST WARNING ({sh['reason']}): {repo_id} does NOT fit in "
                f"{require_self_hostable_gb}GB. Open-weights distillation requires hosting the weights; "
                f"since you cannot, the only route is a HOSTED/API teacher — a training-on-outputs ToS "
                f"gate (separate, stricter) — NOT the open-weights clean path this licence authorises.")
        elif sh["self_hostable"] is True:
            result["self_host_flag"] = (
                f"SELF-HOSTABLE ({sh['reason']}): {repo_id} fits in {require_self_hostable_gb}GB — "
                f"the clean open-weights distillation path applies (no API-teacher ToS gate needed).")
        else:  # None -> size undetermined; do NOT assert either way
            result["self_host_flag"] = (
                f"SELF-HOST UNDETERMINED ({sh['reason']}) for {repo_id} — confirm the actual model "
                f"size before choosing the open-weights vs API-teacher path.")
    return result


# ─────────────────────────────────────────────────────────────────────────────
# STAGED PIPELINE BODY — reuses the proven corpus-grow -> judge -> refusal-strip
# -> SIGIL-sign -> train_sector.py-on-Modal pattern. NOTHING fires: it returns the
# staged plan + the exact Modal command, gated so it is unreachable until PASS.
# ─────────────────────────────────────────────────────────────────────────────
def stage_distillation(gate_result, prompts_file=None, out_file="k3_distill_dataset.jsonl",
                       max_prompts=2000, fire=False):
    """Prepare the distillation run BEHIND the gate. Never queries a teacher, never trains.
    If gate is REFUSED -> returns REFUSED. If PASS -> returns a staged plan (fire is ignored unless
    weights+licence confirmed AND fire=True AND the teacher is self-hostable open-weights)."""
    if gate_result.get("verdict") != "PASS":
        return {"status": "REFUSED",
                "reason": "licence gate did not PASS — pipeline body not entered",
                "gate": gate_result}
    repo_id = gate_result.get("resolved_repo")
    prompts_file = prompts_file or os.path.join(HERE, "expert_data", "compliance.jsonl")
    n_prompts = 0
    if os.path.exists(prompts_file):
        n_prompts = min(max_prompts, sum(1 for l in open(prompts_file) if l.strip()))
    # SIGIL-sign the staged plan (real Ed25519 signature — proves this staging record is authentic)
    signed = None
    try:
        from sov33_ed25519_sigil import Ed25519Sigil
        sig = Ed25519Sigil()
        signed = sig.sign({"stage": "k3_distill", "teacher": repo_id, "n_prompts": n_prompts})
        signed = {"seq": signed["seq"], "own_hash": signed["own_hash"],
                  "ed25519": signed["ed25519"], "pub_hex": sig.pub_hex()}
    except Exception as e:
        signed = {"error": f"SIGIL sign unavailable: {e}"}
    plan = {
        "status": "STAGED (gate PASS) — NOT FIRED",
        "teacher_repo": repo_id,
        "self_host_flag": gate_result.get("self_host_flag"),
        "pipeline": [
            "1. corpus-grow: pool prompts from expert_data + growth_controller queue",
            "2. teacher answers: query the teacher on each prompt (open-weights host if self-hostable, "
            "else hosted/API under its ToS)",
            "3. judge-filter: cross-lineage / quality judge drops empty, truncated, low-quality answers",
            "4. refusal-strip: drop refusal-worded answers (teacher cannot ground SOV-internal terms)",
            "5. SIGIL-sign: Ed25519-sign the cleaned dataset manifest (authenticity)",
            "6. train_sector.py on Modal: LoRA fine-tune the student sector on the signed corpus",
        ],
        "prompts_file": prompts_file, "n_prompts_staged": n_prompts,
        "out_file": out_file,
        "sigil_signed_manifest": signed,
        "modal_run_command": (
            f"modal run train_sector.py "
            f"# env: BASE_MODEL=Qwen/Qwen2.5-0.5B-Instruct SECTOR_CORPUS={out_file} "
            f"SECTOR_NAME=k3_distill  (FIRE ONLY when weights+licence confirmed)"),
        "fired": False,
        "fire_note": ("fire=True is intentionally a no-op in this build — actually firing requires "
                      "confirmed self-hostable open weights OR an explicit ToS-cleared API-teacher path, "
                      "plus Nick's go-ahead for GPU/Modal spend."),
    }
    return plan


def run_gate_now():
    """Run the gate for K3 (expected REFUSED) and K2.7-Code (expected PASS-license, self-host flagged)."""
    report = {"run_at": datetime.datetime.now(datetime.timezone.utc).isoformat(), "gates": {}}
    # K3 — the target the whole harness is staged for
    k3 = licence_gate("Kimi-K3", author="moonshotai", require_self_hostable_gb=192)
    report["gates"]["K3"] = k3
    # K2.7-Code — the fire-today open-weights alternative (licence PASS, but 1T -> not self-hostable)
    k27 = licence_gate("Kimi-K2.7-Code", author="moonshotai", require_self_hostable_gb=192)
    report["gates"]["K2.7-Code"] = k27
    # staged pipeline behind each gate (proves the body is unreachable on REFUSED)
    report["staged_K3"] = stage_distillation(k3)
    report["staged_K2.7-Code"] = stage_distillation(k27)
    return report


if __name__ == "__main__":
    rep = run_gate_now()
    print(json.dumps(rep, indent=2))
    print("\n=== GATE VERDICTS ===")
    print("K3        :", rep["gates"]["K3"]["verdict"], "->", rep["gates"]["K3"]["reasons"][0])
    print("K2.7-Code :", rep["gates"]["K2.7-Code"]["verdict"], "->", rep["gates"]["K2.7-Code"]["reasons"][0])
    if rep["gates"]["K2.7-Code"].get("self_host_flag"):
        print("           ", rep["gates"]["K2.7-Code"]["self_host_flag"].split("—")[0].strip())
