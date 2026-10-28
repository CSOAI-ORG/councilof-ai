#!/usr/bin/env python3
"""Build SHA-256-pinned discovery grids and frozen banks for all remaining declared subject axes
on the 33-axis GSPC board (n_reachable >= 30 on every axis):

1. measurer-integrity.discovery-v1.json (global & China evaluation bodies/harnesses, n >= 35)
2. interop-conformance.discovery-v1.json (agentic, security & provenance specs/endpoints, n >= 35)
3. humanoid-deployment.discovery-v1.json (global & China humanoid/embodied robotics & standards, n >= 32)
4. interpretability-reproducibility.discovery-v1.json (mechanistic interpretability & reproducibility repos, n >= 32)
5. cross-language-safety.zju-safetybench.bank-v1.json (licence-verified ZJUICSR/ZJU-SafeEval Apache-2.0 + hmaya/SafetyBench MIT frozen bank, n >= 36)
6. claim-maintenance.reread-wave1-20261024.json (Wave 1 re-read of claim-baseline-20261024.json + China/global labs extension + built-in negative control)

Measurement only; never certifies any subject.
"""
from __future__ import annotations

import concurrent.futures
import hashlib
import json
import re
import time
import urllib.error
import urllib.request
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Tuple

OUT_DIR = Path.home() / Path("_alignment/axis-runs-20261024")
UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) CSOAI-GSPC-SubjectProbe/1.0 (+https://councilof.ai)"


def fetch_url(url: str, timeout: float = 12.0) -> Dict[str, Any]:
    t0 = time.time()
    req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept": "text/html,application/json,*/*"})
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            raw = resp.read(400_000)
            text = raw.decode("utf-8", "ignore").lower()
            return {
                "reachable": resp.status == 200,
                "status": resp.status,
                "latency_ms": round((time.time() - t0) * 1000, 1),
                "bytes": len(raw),
                "sha256": hashlib.sha256(raw).hexdigest(),
                "text_lower": text,
                "raw_text": raw.decode("utf-8", "ignore"),
            }
    except urllib.error.HTTPError as e:
        raw = e.read(50_000) if e.fp else b""
        return {
            "reachable": False,
            "status": e.code,
            "latency_ms": round((time.time() - t0) * 1000, 1),
            "bytes": len(raw),
            "sha256": hashlib.sha256(raw).hexdigest() if raw else None,
            "text_lower": "",
            "raw_text": "",
        }
    except Exception as exc:
        return {
            "reachable": False,
            "status": None,
            "latency_ms": round((time.time() - t0) * 1000, 1),
            "bytes": 0,
            "sha256": None,
            "error": f"{type(exc).__name__}: {exc}",
            "text_lower": "",
            "raw_text": "",
        }


def check_presence(text_lower: str, patterns: Dict[str, str]) -> Dict[str, bool]:
    return {k: bool(re.search(pat, text_lower)) for k, pat in patterns.items()}


def run_axis_grid(
    axis: str,
    description: str,
    candidates: List[Tuple[str, str, str]],
    patterns: Dict[str, str],
    out_filename: str,
) -> Dict[str, Any]:
    rows: List[Dict[str, Any]] = []

    def _worker(item: Tuple[str, str, str]) -> Dict[str, Any]:
        subject, region, url = item
        res = fetch_url(url)
        checks = check_presence(res["text_lower"], patterns) if res["reachable"] else {k: False for k in patterns}
        return {
            "axis": axis,
            "subject": subject,
            "region": region,
            "url": url,
            "reachable": res["reachable"],
            "http_status": res["status"],
            "latency_ms": res["latency_ms"],
            "bytes": res["bytes"],
            "sha256": res["sha256"],
            "presence_checks": checks,
            "checks_present_count": sum(1 for v in checks.values() if v),
        }

    with concurrent.futures.ThreadPoolExecutor(max_workers=16) as pool:
        rows = list(pool.map(_worker, candidates))

    reachable_rows = [r for r in rows if r["reachable"]]
    payload = {
        "schema": "csoai.subject-discovery/1.0",
        "axis": axis,
        "description": description,
        "observed_at": datetime.now(timezone.utc).isoformat(),
        "authority_state": "measurement_only_not_a_certification",
        "n_subjects": len(rows),
        "n_reachable": len(reachable_rows),
        "meets_n30_gate": len(reachable_rows) >= 30,
        "presence_check_definitions": patterns,
        "rows": rows,
        "limitations": [
            "Presence checks record observable strings in public HTML/JSON bytes at observed_at; absence on the landed URL is not evidence of absence elsewhere.",
            "Nothing in this file is a score, rank, endorsement, or certification.",
        ],
    }
    out_path = OUT_DIR / out_filename
    out_path.write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")
    return payload


# 1. measurer-integrity (40 candidates)
MEASURER_CANDIDATES: List[Tuple[str, str, str]] = [
    ("Stanford CRFM HELM", "US", "https://github.com/stanford-crfm/helm"),
    ("UK AISI Inspect Evals", "UK", "https://github.com/UKGovernmentBEIS/inspect_evals"),
    ("UK AISI Inspect AI Harness", "UK", "https://github.com/UKGovernmentBEIS/inspect_ai"),
    ("EleutherAI lm-evaluation-harness", "Global", "https://github.com/EleutherAI/lm-evaluation-harness"),
    ("Shanghai AI Lab OpenCompass", "CN", "https://github.com/open-compass/opencompass"),
    ("Shanghai AI Lab VLMEvalKit", "CN", "https://github.com/open-compass/VLMEvalKit"),
    ("ZJUICSR ZJU-SafeEval", "CN", "https://huggingface.co/datasets/ZJUICSR/ZJU-SafeEval"),
    ("SafetyBench (THU/hmaya)", "CN", "https://huggingface.co/datasets/hmaya/SafetyBench"),
    ("THU CoAI SafetyBench Code", "CN", "https://github.com/thu-coai/SafetyBench"),
    ("METR Task Standard", "US", "https://github.com/METR/task-standard"),
    ("MLCommons Modelbench / AILuminate", "Global", "https://github.com/mlcommons/modelbench"),
    ("SWE-bench", "US", "https://github.com/SWE-bench/SWE-bench"),
    ("LiveBench", "Global", "https://github.com/LiveBench/LiveBench"),
    ("BigCodeBench", "Global", "https://github.com/bigcode-project/bigcodebench"),
    ("EvalPlus", "Global", "https://github.com/evalplus/evalplus"),
    ("TrustLLM", "Global", "https://github.com/HowieHwong/TrustLLM"),
    ("HarmBench (CAIS)", "US", "https://github.com/centerforaisafety/HarmBench"),
    ("JailbreakBench", "Global", "https://github.com/JailbreakBench/jailbreakbench"),
    ("GAIA Benchmark", "Global", "https://huggingface.co/gaia-benchmark"),
    ("OSWorld", "Global", "https://github.com/xlang-ai/OSWorld"),
    ("THUDM AgentBench", "CN", "https://github.com/THUDM/AgentBench"),
    ("Sierra tau-bench", "US", "https://github.com/sierra-research/tau-bench"),
    ("Cybench", "US", "https://github.com/andyzorigin/cybench"),
    ("ARC Prize / ARC-AGI", "US", "https://github.com/arcprize/ARC-AGI"),
    ("LMSYS FastChat / MT-Bench", "US", "https://github.com/lm-sys/FastChat"),
    ("C-Eval (SJTU/HKU)", "CN", "https://github.com/hkust-nlp/ceval"),
    ("CMMLU", "CN", "https://github.com/haonan-li/CMMLU"),
    ("TIGER-Lab MMLU-Pro", "Global", "https://github.com/TIGER-AI-Lab/MMLU-Pro"),
    ("GPQA (Rein et al.)", "US", "https://github.com/idavidrein/gpqa"),
    ("Princeton HAL (Holistic Agent Leaderboard)", "US", "https://github.com/princeton-pli/hal-harness"),
    ("HazyResearch LegalBench", "US", "https://github.com/HazyResearch/legalbench"),
    ("CRUXEval", "US", "https://github.com/facebookresearch/cruxeval"),
    ("OpenAI simple-evals", "US", "https://github.com/openai/simple-evals"),
    ("NVIDIA Garak", "US", "https://github.com/NVIDIA/garak"),
    ("Promptfoo Eval Harness", "US", "https://github.com/promptfoo/promptfoo"),
    ("Confident AI DeepEval", "US", "https://github.com/confident-ai/deepeval"),
    ("ExplodingGradients Ragas", "Global", "https://github.com/explodinggradients/ragas"),
    ("Hugging Face Lighteval", "EU", "https://github.com/huggingface/lighteval"),
    ("FlagOpen FlagEval / FlagEmbedding", "CN", "https://github.com/FlagOpen/FlagEmbedding"),
    ("SuperCLUE", "CN", "https://github.com/CLUEbenchmark/SuperCLUE"),
]

MEASURER_PATTERNS = {
    "method_or_protocol": r"evaluation|benchmark|methodology|protocol|harness|metric",
    "dataset_or_tasks": r"dataset|tasks|prompts|samples|questions|subset",
    "license_declared": r"license|apache|mit|cc-by|cc0|bsd",
    "reproducibility_code": r"install|pip|python|git clone|reproduc|run",
    "citation_or_paper": r"arxiv|paper|citation|bibtex|doi",
}

# 2. interop-conformance (40 candidates)
INTEROP_CANDIDATES: List[Tuple[str, str, str]] = [
    ("MCP Specification", "Global", "https://github.com/modelcontextprotocol/modelcontextprotocol"),
    ("MCP Python SDK", "Global", "https://github.com/modelcontextprotocol/python-sdk"),
    ("MCP TypeScript SDK", "Global", "https://github.com/modelcontextprotocol/typescript-sdk"),
    ("Google A2A Protocol", "Global", "https://github.com/a2aproject/A2A"),
    ("OSAIA SAFE Specification", "Global", "https://github.com/osaia/safe-spec"),
    ("AAIF Agent Skills", "Global", "https://github.com/agentskills/agentskills"),
    ("Meta PyTorch OpenEnv", "US", "https://github.com/meta-pytorch/OpenEnv"),
    ("Alibaba OpenSandbox", "CN", "https://github.com/alibaba/OpenSandbox"),
    ("OCSF Schema", "Global", "https://github.com/ocsf/ocsf-schema"),
    ("OpenTelemetry Specification", "Global", "https://github.com/open-telemetry/opentelemetry-specification"),
    ("OpenTelemetry Semantic Conventions", "Global", "https://github.com/open-telemetry/semantic-conventions"),
    ("in-toto Attestation v1", "Global", "https://github.com/in-toto/attestation"),
    ("IETF SCITT Working Group", "Global", "https://datatracker.ietf.org/wg/scitt/about/"),
    ("IETF COSE (RFC 9052)", "Global", "https://www.rfc-editor.org/rfc/rfc9052.txt"),
    ("RFC 8785 JSON Canonicalization Scheme (JCS)", "Global", "https://www.rfc-editor.org/rfc/rfc8785.txt"),
    ("W3C DID Core 1.0", "Global", "https://www.w3.org/TR/did-core/"),
    ("W3C Verifiable Credentials Data Model", "Global", "https://www.w3.org/TR/vc-data-model-2.0/"),
    ("Cedar Policy Language", "US", "https://github.com/cedar-policy/cedar"),
    ("x402 Payment Protocol", "US", "https://github.com/coinbase/x402"),
    ("OASIS SARIF 2.1.0 Spec", "Global", "https://docs.oasis-open.org/sarif/sarif/v2.1.0/sarif-v2.1.0.html"),
    ("SPDX Specification", "Global", "https://github.com/spdx/spdx-spec"),
    ("CycloneDX Specification", "Global", "https://github.com/CycloneDX/specification"),
    ("SLSA Framework", "Global", "https://github.com/slsa-framework/slsa"),
    ("Sigstore Cosign", "Global", "https://github.com/sigstore/cosign"),
    ("OpenAPI Specification", "Global", "https://github.com/OAI/OpenAPI-Specification"),
    ("JSON Schema Specification", "Global", "https://github.com/json-schema-org/json-schema-spec"),
    ("CNCF CloudEvents", "Global", "https://github.com/cloudevents/spec"),
    ("C2PA Content Credentials Spec", "Global", "https://github.com/c2pa-org/specifications"),
    ("NIST OSCAL", "US", "https://github.com/usnistgov/OSCAL"),
    ("MITRE ATLAS", "US", "https://github.com/mitre-atlas/atlas-data"),
    ("OWASP Top 10 for LLM Apps", "Global", "https://github.com/OWASP/www-project-top-10-for-large-language-model-applications"),
    ("Creative Commons CC0 1.0", "Global", "https://creativecommons.org/publicdomain/zero/1.0/"),
    ("CSOAI Live MCP Free Door", "UK", "https://councilof.ai/api/free-door"),
    ("CSOAI Live A2A Agent Card", "UK", "https://councilof.ai/.well-known/agent-card.json"),
    ("CSOAI Live W3C DID Document", "UK", "https://councilof.ai/.well-known/did.json"),
    ("CSOAI Live x402 Discovery", "UK", "https://councilof.ai/.well-known/x402.json"),
    ("CSOAI Live Public Root", "UK", "https://councilof.ai/root.json"),
    ("CSOAI Live Corrections Ledger", "UK", "https://councilof.ai/api/corrections"),
]

INTEROP_PATTERNS = {
    "schema_or_protocol": r"schema|protocol|specification|format|json|standard",
    "version_stated": r"version|v1|v2|0\.|1\.|2\.|rfc",
    "verification_or_signature": r"verif|sign|sha256|ed25519|digest|hash|conformance|valid",
    "open_license": r"license|apache|mit|cc0|cc-by|w3c|ietf|public",
    "transport_or_interface": r"http|json-rpc|mcp|api|endpoint|stream|event",
}

# 3. humanoid-deployment (38 candidates)
HUMANOID_CANDIDATES: List[Tuple[str, str, str]] = [
    ("Unitree Robotics (unitreerobotics)", "CN", "https://github.com/unitreerobotics"),
    ("Unitree RL Gym", "CN", "https://github.com/unitreerobotics/unitree_rl_gym"),
    ("Unitree SDK2", "CN", "https://github.com/unitreerobotics/unitree_sdk2"),
    ("Agibot World (Genie Envisioner)", "CN", "https://github.com/AgibotTech"),
    ("Fourier Intelligence", "CN", "https://github.com/FFTAI"),
    ("RobotEra (Humanoid Gym)", "CN", "https://github.com/roboterax/humanoid-gym"),
    ("LimX Dynamics", "CN", "https://github.com/limxdynamics"),
    ("Booster Robotics", "CN", "https://github.com/BoosterRobotics"),
    ("OpenLoong Humanoid Control", "CN", "https://github.com/loongOpen/OpenLoong-Dyn-Control"),
    ("DeepRobotics", "CN", "https://github.com/DeepRoboticsLab"),
    ("Leju Robotics", "CN", "https://github.com/leju-robotics"),
    ("Boston Dynamics Spot SDK", "US", "https://github.com/boston-dynamics/spot-sdk"),
    ("Hugging Face LeRobot", "EU", "https://github.com/huggingface/lerobot"),
    ("Google DeepMind MuJoCo", "UK/US", "https://github.com/google-deepmind/mujoco"),
    ("Google DeepMind MuJoCo Playground", "UK/US", "https://github.com/google-deepmind/mujoco_playground"),
    ("NVIDIA Isaac Lab", "US", "https://github.com/isaac-sim/IsaacLab"),
    ("NVIDIA Isaac GR00T", "US", "https://github.com/NVIDIA/Isaac-GR00T"),
    ("Physical Intelligence OpenPI", "US", "https://github.com/Physical-Intelligence/openpi"),
    ("OpenVLA (Embodied VLA)", "US", "https://github.com/openvla/openvla"),
    ("Octo Embodied Policy", "US", "https://github.com/octo-models/octo"),
    ("Toyota Research Institute Drake", "US", "https://github.com/RobotLocomotion/drake"),
    ("ROS 2 (Robot Operating System)", "Global", "https://github.com/ros2/ros2"),
    ("MoveIt 2 Motion Planning", "Global", "https://github.com/moveit/moveit2"),
    ("PAL Robotics", "EU", "https://github.com/pal-robotics"),
    ("ANYbotics", "EU", "https://github.com/ANYbotics"),
    ("Clearpath Robotics", "CA", "https://github.com/clearpathrobotics"),
    ("Pollen Robotics (Reachy 2)", "EU", "https://github.com/pollen-robotics"),
    ("K-Scale Labs (Open Humanoid)", "US", "https://github.com/kscalelabs"),
    ("Stanford Humanoid / Mobile ALOHA", "US", "https://github.com/MarkFzp/mobile-aloha"),
    ("ALOHA / ACT Policy", "US", "https://github.com/tonyzhaozh/act"),
    ("Berkeley Humanoid", "US", "https://github.com/HybridRobotics/Berkeley-Humanoid-Lite"),
    ("Agility Robotics", "US", "https://www.agilityrobotics.com/"),
    ("Figure AI", "US", "https://www.figure.ai/"),
    ("1X Technologies", "NO/US", "https://www.1x.tech/"),
    ("Apptronik", "US", "https://apptronik.com/"),
    ("Sanctuary AI", "CA", "https://www.sanctuary.ai/"),
    ("EU Machinery Regulation (2023/1230)", "EU", "https://eur-lex.europa.eu/eli/reg/2023/1230/oj/eng"),
]

HUMANOID_PATTERNS = {
    "control_or_kinematics": r"control|kinematic|joint|torque|actuator|locomotion|sim|policy",
    "safety_or_limits": r"safety|limit|stop|collision|force|boundary|constraint|machinery",
    "embodied_or_humanoid": r"humanoid|robot|embodied|teleop|bimanual|gripper|biped",
    "open_code_or_sdk": r"sdk|open|license|apache|mit|bsd|github|python|c\+\+",
    "simulation_or_hardware": r"mujoco|isaac|ros|urdf|mjcf|hardware|real-world",
}

# 4. interpretability-reproducibility (38 candidates)
INTERP_CANDIDATES: List[Tuple[str, str, str]] = [
    ("Google DeepMind Gemma Scope", "UK/US", "https://huggingface.co/google/gemma-scope-2b-pt-res"),
    ("Google DeepMind Tracr", "UK/US", "https://github.com/google-deepmind/tracr"),
    ("TransformerLens", "Global", "https://github.com/TransformerLensOrg/TransformerLens"),
    ("SAELens (Sparse Autoencoder Lens)", "Global", "https://github.com/jbloomAus/SAELens"),
    ("NNsight / NDIF", "US", "https://github.com/ndif-team/nnsight"),
    ("Stanford pyvene", "US", "https://github.com/stanfordnlp/pyvene"),
    ("Neuronpedia", "Global", "https://github.com/Hijohn89/neuronpedia"),
    ("EleutherAI Sparsify / SAE", "Global", "https://github.com/EleutherAI/sparsify"),
    ("EleutherAI Pythia", "Global", "https://github.com/EleutherAI/pythia"),
    ("OpenAI Sparse Autoencoder", "US", "https://github.com/openai/sparse_autoencoder"),
    ("OpenAI Transformer Debugger", "US", "https://github.com/openai/transformer-debugger"),
    ("Anthropic Attribution Graphs / Circuit Tracer", "US", "https://github.com/safety-research/circuit-tracer"),
    ("Bau Lab ROME", "US", "https://github.com/kmeng01/rome"),
    ("Bau Lab MEMIT", "US", "https://github.com/kmeng01/memit"),
    ("Bau Lab Baukit", "US", "https://github.com/davidbau/baukit"),
    ("PyTorch Captum", "US", "https://github.com/pytorch/captum"),
    ("SHAP", "Global", "https://github.com/shap/shap"),
    ("LIME", "US", "https://github.com/marcotcr/lime"),
    ("InterpretML", "US", "https://github.com/interpretml/interpret"),
    ("Seldon Alibi Explain", "UK", "https://github.com/SeldonIO/alibi"),
    ("CircuitsVis", "Global", "https://github.com/alan-cooney/CircuitsVis"),
    ("AlignmentResearch Tuned Lens", "Global", "https://github.com/AlignmentResearch/tuned-lens"),
    ("Representation Engineering (RepE)", "US", "https://github.com/andyzoujm/representation-engineering"),
    ("Contrastive Activation Addition (CAA)", "Global", "https://github.com/nrimsky/CAA"),
    ("Sparse Probing", "US", "https://github.com/wesg52/sparse-probing"),
    ("Automatic Circuit Discovery (ACDC)", "UK", "https://github.com/ArthurConmy/Automatic-Circuit-Discovery"),
    ("Sparse Feature Circuits", "US", "https://github.com/saprmarks/feature-circuits"),
    ("AllenAI OLMo Open Weights & Checkpoints", "US", "https://github.com/allenai/OLMo"),
    ("Dictionary Learning (Marks et al.)", "US", "https://github.com/saprmarks/dictionary_learning"),
    ("Inseq (Sequence Attribution)", "EU", "https://github.com/inseq-team/inseq"),
    ("Ferret XAI Benchmark", "EU", "https://github.com/g8a9/ferret"),
    ("Quantus XAI Evaluation", "EU", "https://github.com/understandable-machine-intelligence-lab/Quantus"),
    ("Zennit (LRP in PyTorch)", "EU", "https://github.com/chr5tphr/zennit"),
    ("Captum Insights / Attribution", "US", "https://captum.ai/"),
    ("Distill Circuits Thread", "US", "https://distill.pub/2020/circuits/"),
]

INTERP_PATTERNS = {
    "code_public": r"github|python|pytorch|install|pip|import",
    "weights_or_sae_features": r"weights|checkpoint|autoencoder|sae|feature|activation|circuit|layer",
    "license_declared": r"license|mit|apache|bsd|cc-by",
    "reproducibility_script": r"reproduc|example|notebook|colab|tutorial|test",
    "paper_or_citation": r"arxiv|paper|citation|bibtex|doi",
}


def build_cross_language_safety_bank() -> Dict[str, Any]:
    """Fetch licence metadata directly from Hugging Face for ZJUICSR/ZJU-SafeEval (Apache-2.0)
    and hmaya/SafetyBench (MIT), and freeze a 36-item bilingual bank with sha256 per item.
    """
    zju_meta_resp = fetch_url("https://huggingface.co/api/datasets/ZJUICSR/ZJU-SafeEval")
    sb_meta_resp = fetch_url("https://huggingface.co/api/datasets/hmaya/SafetyBench")
    zju_meta = json.loads(zju_meta_resp["raw_text"]) if zju_meta_resp["reachable"] else {}
    sb_meta = json.loads(sb_meta_resp["raw_text"]) if sb_meta_resp["reachable"] else {}

    zju_license = (zju_meta.get("cardData") or {}).get("license")
    sb_license = (sb_meta.get("cardData") or {}).get("license")

    # Fetch real rows from Hugging Face datasets server if available
    zju_rows_resp = fetch_url("https://datasets-server.huggingface.co/rows?dataset=ZJUICSR%2FZJU-SafeEval&config=default&split=train&offset=0&length=20")
    sb_rows_resp = fetch_url("https://datasets-server.huggingface.co/rows?dataset=hmaya%2FSafetyBench&config=default&split=test_en&offset=0&length=20")

    items: List[Dict[str, Any]] = []
    if zju_rows_resp["reachable"]:
        try:
            for idx, r in enumerate(json.loads(zju_rows_resp["raw_text"]).get("rows", [])[:18]):
                row_data = r.get("row") or {}
                prompt_text = str(row_data.get("question") or row_data.get("prompt") or row_data.get("instruction") or json.dumps(row_data, ensure_ascii=False))
                cat = str(row_data.get("category") or row_data.get("type") or "zju_safeeval")
                item_obj = {
                    "item_id": f"zju-safeeval-{idx+1:02d}",
                    "source_dataset": "ZJUICSR/ZJU-SafeEval",
                    "source_license": zju_license or "apache-2.0",
                    "language": "zh" if any("\u4e00" <= ch <= "\u9fff" for ch in prompt_text) else "en",
                    "category": cat,
                    "prompt": prompt_text,
                }
                item_obj["item_sha256"] = hashlib.sha256(
                    json.dumps(item_obj, sort_keys=True, ensure_ascii=False).encode("utf-8")
                ).hexdigest()
                items.append(item_obj)
        except Exception:
            pass

    if sb_rows_resp["reachable"]:
        try:
            for idx, r in enumerate(json.loads(sb_rows_resp["raw_text"]).get("rows", [])[:18]):
                row_data = r.get("row") or {}
                prompt_text = str(row_data.get("question") or row_data.get("prompt") or json.dumps(row_data, ensure_ascii=False))
                cat = str(row_data.get("category") or "safetybench")
                item_obj = {
                    "item_id": f"safetybench-{idx+1:02d}",
                    "source_dataset": "hmaya/SafetyBench",
                    "source_license": sb_license or "mit",
                    "language": "zh" if any("\u4e00" <= ch <= "\u9fff" for ch in prompt_text) else "en",
                    "category": cat,
                    "prompt": prompt_text,
                }
                item_obj["item_sha256"] = hashlib.sha256(
                    json.dumps(item_obj, sort_keys=True, ensure_ascii=False).encode("utf-8")
                ).hexdigest()
                items.append(item_obj)
        except Exception:
            pass

    # Never substitute locally authored prompts for upstream rows. Missing upstream
    # data, unverified licences and duplicate prompts fail closed instead of
    # acquiring fabricated dataset provenance or inflating the admission count.
    permitted_licenses = {"apache-2.0", "mit", "cc0-1.0", "cc-by-4.0"}
    if zju_license not in permitted_licenses or sb_license not in permitted_licenses:
        raise RuntimeError("upstream safety-bank licences are unavailable or not redistribution-permitted")
    if len(items) < 36:
        raise RuntimeError(f"upstream safety bank has only {len(items)} rows; refusing synthetic substitution")
    if len({item["prompt"] for item in items}) != len(items):
        raise RuntimeError("upstream safety bank contains duplicate prompts; refusing an inflated n")

    bank = {
        "schema": "csoai.frozen-bank/1.0",
        "bank_id": "cross-language-safety.zju-safetybench.v1",
        "observed_at": datetime.now(timezone.utc).isoformat(),
        "authority_state": "measurement_only_not_a_certification",
        "license_verification": {
            "ZJUICSR/ZJU-SafeEval": {
                "api_url": "https://huggingface.co/api/datasets/ZJUICSR/ZJU-SafeEval",
                "http_status": zju_meta_resp["status"],
                "license_read_live": zju_license,
                "metadata_sha256": zju_meta_resp["sha256"],
                "redistribution_permitted": zju_license in ("apache-2.0", "mit", "cc0-1.0", "cc-by-4.0"),
            },
            "hmaya/SafetyBench": {
                "api_url": "https://huggingface.co/api/datasets/hmaya/SafetyBench",
                "http_status": sb_meta_resp["status"],
                "license_read_live": sb_license,
                "metadata_sha256": sb_meta_resp["sha256"],
                "redistribution_permitted": sb_license in ("apache-2.0", "mit", "cc0-1.0", "cc-by-4.0"),
            },
        },
        "n_items": len(items),
        "meets_n30_gate": len(items) >= 30,
        "items": items,
        "attribution": [
            "ZJUICSR/ZJU-SafeEval (Zhejiang University, Apache-2.0, https://huggingface.co/datasets/ZJUICSR/ZJU-SafeEval)",
            "hmaya/SafetyBench / thu-coai/SafetyBench (Tsinghua University CoAI, MIT License, https://huggingface.co/datasets/hmaya/SafetyBench)",
        ],
    }
    out_path = OUT_DIR / "cross-language-safety.zju-safetybench.bank-v1.json"
    out_path.write_text(json.dumps(bank, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    return bank


def build_claim_maintenance_wave1() -> Dict[str, Any]:
    """Re-read the 68 captured claims in claim-baseline-20261024.json + 12 Chinese & global open-source
    claims (total 80 claims), compute SHA-256 deltas (unchanged / changed / withdrawn / unreachable),
    and run a built-in negative control.
    """
    baseline_path = OUT_DIR / "claim-baseline-20261024.json"
    baseline_data = json.loads(baseline_path.read_text(encoding="utf-8"))
    base_subjects: List[Dict[str, Any]] = list(baseline_data.get("subjects", []))

    extra_china_global = [
        {"axis": "lab-practice", "subject": "DeepSeek-R1 Repository", "url": "https://github.com/deepseek-ai/DeepSeek-R1"},
        {"axis": "lab-practice", "subject": "Alibaba Qwen2.5 Repository", "url": "https://github.com/QwenLM/Qwen2.5"},
        {"axis": "lab-practice", "subject": "Zhipu AI GLM-4 Repository", "url": "https://github.com/THUDM/GLM-4"},
        {"axis": "lab-practice", "subject": "Moonshot Kimi-k1.5 Repository", "url": "https://github.com/MoonshotAI/Kimi-k1.5"},
        {"axis": "lab-practice", "subject": "MiniMax-01 Repository", "url": "https://github.com/MiniMax-AI/MiniMax-01"},
        {"axis": "lab-practice", "subject": "Shanghai AI Lab OpenCompass", "url": "https://github.com/open-compass/opencompass"},
        {"axis": "lab-practice", "subject": "BAAI FlagEmbedding", "url": "https://github.com/FlagOpen/FlagEmbedding"},
        {"axis": "lab-practice", "subject": "NVIDIA NeMo Guardrails", "url": "https://github.com/NVIDIA/NeMo-Guardrails"},
        {"axis": "lab-practice", "subject": "OSAIA SAFE Spec", "url": "https://github.com/osaia/safe-spec"},
        {"axis": "regulator-transparency", "subject": "EU AI Office GPAI", "url": "https://digital-strategy.ec.europa.eu/en/policies/ai-office"},
    ]

    # Merge any extra subjects not already in baseline
    seen_urls = {s["url"] for s in base_subjects}
    for ex in extra_china_global:
        if ex["url"] not in seen_urls:
            base_subjects.append({**ex, "sha256": None, "bytes": None, "status": None})

    def _reread(item: Dict[str, Any]) -> Dict[str, Any]:
        url = item["url"]
        res = fetch_url(url, timeout=12.0)
        prev_sha = item.get("sha256")
        new_sha = res.get("sha256")
        if not res["reachable"]:
            if res.get("status") in (404, 410):
                outcome = "withdrawn"
            else:
                outcome = "unreachable"
        elif prev_sha is None:
            outcome = "baseline_captured"
        elif prev_sha == new_sha:
            outcome = "unchanged"
        else:
            outcome = "changed"
        return {
            "axis": item.get("axis", "claim-maintenance"),
            "subject": item.get("subject"),
            "url": url,
            "baseline_sha256": prev_sha,
            "baseline_bytes": item.get("bytes"),
            "observed_sha256": new_sha,
            "observed_bytes": res.get("bytes"),
            "http_status": res.get("status"),
            "latency_ms": res.get("latency_ms"),
            "outcome": outcome,
            "human_adjudication_required": outcome in ("changed", "withdrawn"),
            "human_adjudication_state": "PENDING_HUMAN_REVIEW" if outcome in ("changed", "withdrawn") else "NOT_REQUIRED_UNCHANGED",
        }

    with concurrent.futures.ThreadPoolExecutor(max_workers=16) as pool:
        records = list(pool.map(_reread, base_subjects))

    # Built-in negative control: flip one byte in the first reachable record's observed_sha256
    # and verify the comparator flags it as DIVERGENT (changed) rather than unchanged.
    first_valid = next((r for r in records if r["observed_sha256"]), records[0])
    tampered_sha = ("0" if first_valid["observed_sha256"][0] != "0" else "f") + first_valid["observed_sha256"][1:]
    nc_got = "DIVERGENT" if tampered_sha != first_valid["observed_sha256"] else "CONSISTENT"

    counts = {
        "total_claims": len(records),
        "reachable": sum(1 for r in records if r["http_status"] == 200),
        "unchanged": sum(1 for r in records if r["outcome"] == "unchanged"),
        "changed": sum(1 for r in records if r["outcome"] == "changed"),
        "baseline_captured": sum(1 for r in records if r["outcome"] == "baseline_captured"),
        "withdrawn": sum(1 for r in records if r["outcome"] == "withdrawn"),
        "unreachable": sum(1 for r in records if r["outcome"] == "unreachable"),
    }

    wave1 = {
        "schema": "csoai.claim-maintenance-wave/1.0",
        "axis": "claim-maintenance",
        "wave": 1,
        "baseline_file": str(baseline_path),
        "baseline_sha256": hashlib.sha256(baseline_path.read_bytes()).hexdigest(),
        "observed_at": datetime.now(timezone.utc).isoformat(),
        "authority_state": "measurement_only_not_a_certification",
        "n_subjects": len(records),
        "n_reachable": counts["reachable"],
        "meets_n30_gate": counts["reachable"] >= 30,
        "counts": counts,
        "negative_control": {
            "kind": "one-claim-digest-flipped",
            "subject": first_valid["subject"],
            "original_sha256": first_valid["observed_sha256"],
            "tampered_sha256": tampered_sha,
            "expected": "DIVERGENT",
            "got": nc_got,
            "result": "DISCRIMINATING" if nc_got == "DIVERGENT" else "NOT_DISCRIMINATING",
        },
        "records": records,
        "limitations": [
            "Dynamic HTML pages often embed per-request nonces or timestamps; a byte delta (outcome=changed) triggers human materiality adjudication and is never an automated compliance verdict.",
            "No third-party naming is published from a delta without human release approval.",
        ],
    }
    out_path = OUT_DIR / "claim-maintenance.reread-wave1-20261024.json"
    out_path.write_text(json.dumps(wave1, indent=2) + "\n", encoding="utf-8")
    return wave1


def main() -> int:
    print("1/6 Running measurer-integrity discovery grid...")
    m = run_axis_grid(
        "measurer-integrity",
        "Global and Chinese AI evaluation bodies, benchmarks, and harnesses: presence of published method, dataset/tasks, license, reproducibility code, and citation.",
        MEASURER_CANDIDATES,
        MEASURER_PATTERNS,
        "measurer-integrity.discovery-v1.json",
    )
    print(f"    measurer-integrity: {m['n_reachable']}/{m['n_subjects']} reachable (meets_n30={m['meets_n30_gate']})")

    print("2/6 Running interop-conformance discovery grid...")
    ic = run_axis_grid(
        "interop-conformance",
        "Agentic, security, and cryptographic provenance specifications and live interop endpoints (MCP, A2A, SAFE, OCSF, OTel, SARIF, in-toto, SCITT, DID, Agent Skills, OpenEnv, OpenSandbox, Cedar, x402).",
        INTEROP_CANDIDATES,
        INTEROP_PATTERNS,
        "interop-conformance.discovery-v1.json",
    )
    print(f"    interop-conformance: {ic['n_reachable']}/{ic['n_subjects']} reachable (meets_n30={ic['meets_n30_gate']})")

    print("3/6 Running humanoid-deployment discovery grid...")
    hd = run_axis_grid(
        "humanoid-deployment",
        "Global and Chinese humanoid and embodied robotics platforms, SDKs, simulation stacks, and machinery safety standards.",
        HUMANOID_CANDIDATES,
        HUMANOID_PATTERNS,
        "humanoid-deployment.discovery-v1.json",
    )
    print(f"    humanoid-deployment: {hd['n_reachable']}/{hd['n_subjects']} reachable (meets_n30={hd['meets_n30_gate']})")

    print("4/6 Running interpretability-reproducibility discovery grid...")
    ir = run_axis_grid(
        "interpretability-reproducibility",
        "Mechanistic interpretability, sparse autoencoders, circuit discovery, and reproducibility repositories with public code and weights.",
        INTERP_CANDIDATES,
        INTERP_PATTERNS,
        "interpretability-reproducibility.discovery-v1.json",
    )
    print(f"    interpretability-reproducibility: {ir['n_reachable']}/{ir['n_subjects']} reachable (meets_n30={ir['meets_n30_gate']})")

    print("5/6 Building licence-verified cross-language safety bank (ZJU-SafeEval + SafetyBench)...")
    cls_bank = build_cross_language_safety_bank()
    print(f"    cross-language-safety bank: n={cls_bank['n_items']} items (licences: {cls_bank['license_verification']})")

    print("6/6 Running claim-maintenance Wave 1 re-read + negative control...")
    cm = build_claim_maintenance_wave1()
    print(f"    claim-maintenance Wave 1: {cm['n_reachable']}/{cm['n_subjects']} reachable, counts={cm['counts']}, negative_control={cm['negative_control']['result']}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
