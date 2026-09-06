"""Mill window honesty: never slugs[:limit] forever; window moves by hour.

Drives scripts/mill_window.py (the function mill_hf_inference.py calls).
Does not mill, does not HTTP, does not invent scores.
"""
from __future__ import annotations

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[2] / "scripts"))
from mill_window import (  # noqa: E402
    DEFAULT_PROVIDERS,
    chat_capable_slugs,
    live_providers,
    mill_exit_for_window,
    mill_names_for_kind,
    mill_router_names,
    millable_slugs,
    provider_order,
    resolve_route,
    route_kind,
    select_window,
)


def test_empty_fleet_empty_window() -> None:
    off, win = select_window([], 8, 1_780_000_000)
    assert off == 0
    assert win == []


def test_window_is_not_always_prefix() -> None:
    slugs = [f"m/{i}" for i in range(40)]
    # hour 0 *may* start at 0; a later hour must not be the prefix.
    _, w0 = select_window(slugs, 8, 0)
    _, w1 = select_window(slugs, 8, 3600)
    assert w1 != slugs[:8], "rotation must leave the first eight after one hour"
    assert w0 != w1, "logged window must change across hours"


def test_shards_partition_one_hour() -> None:
    slugs = [f"m/{i}" for i in range(2200)]
    seen: list[str] = []
    for shard in range(20):
        _, w = select_window(slugs, 30, 1_780_000_000, shard=shard, shards=20)
        assert len(w) == 30
        seen.extend(w)
    assert len(seen) == 600
    assert len(set(seen)) == 600, "shards in one hour must not overlap"


def test_wraps_without_inventing_slugs() -> None:
    slugs = ["a/x", "b/y", "c/z"]
    off, w = select_window(slugs, 8, 99_000)
    assert off < 3
    assert set(w) <= set(slugs)
    assert len(w) == 3


def test_chat_capable_skips_embed_and_gguf() -> None:
    models = [
        {"slug": "sentence-transformers/all-MiniLM-L6-v2", "pipeline_tag": "sentence-similarity"},
        {"slug": "Qwen/Qwen3-8B", "pipeline_tag": "text-generation"},
        {"slug": "unsloth/MiniMax-H3-GGUF", "pipeline_tag": "text-generation"},
        {"slug": "google/siglip2", "pipeline_tag": "zero-shot-image-classification"},
        {"slug": "Qwen/Qwen2.5-VL-7B-Instruct", "pipeline_tag": "image-text-to-text"},
        {"slug": "", "pipeline_tag": "text-generation"},
    ]
    got = chat_capable_slugs(models)
    assert "sentence-transformers/all-MiniLM-L6-v2" not in got
    assert "google/siglip2" not in got
    assert "unsloth/MiniMax-H3-GGUF" not in got
    assert got[0] == "Qwen/Qwen3-8B"
    assert "Qwen/Qwen2.5-VL-7B-Instruct" in got
    _, w = select_window(got, 2, 0)
    assert w[0] == "Qwen/Qwen3-8B"


def test_shards_do_not_overlap_when_fleet_smaller_than_stride() -> None:
    slugs = [f"m/{i}" for i in range(320)]
    seen: list[str] = []
    for shard in range(20):
        _, w = select_window(slugs, 30, 1_780_000_000, shard=shard, shards=20)
        seen.extend(w)
    assert len(set(seen)) == len(seen), "shards must not overlap when n < limit*shards"
    assert set(seen) == set(slugs)


def test_chat_capable_skips_quant_and_base() -> None:
    """6 Sep mill (0): GPTQ/AWQ/FP8/NVFP4/-Base 400 'not served'. Those must
    not consume the hourly window. What would make this fail: putting a GPTQ
    slug back in chat_capable_slugs."""
    models = [
        {"slug": "Qwen/Qwen2.5-72B-Instruct", "pipeline_tag": "text-generation"},
        {"slug": "Qwen/Qwen2.5-72B-Instruct-AWQ", "pipeline_tag": "text-generation"},
        {"slug": "Qwen/Qwen3.5-122B-A10B-GPTQ-Int4", "pipeline_tag": "text-generation"},
        {"slug": "nvidia/Qwen3.6-35B-A3B-NVFP4", "pipeline_tag": "text-generation"},
        {"slug": "ornith-ai/Ornith-1.0-35B-FP8", "pipeline_tag": "text-generation"},
        {"slug": "HuggingFaceTB/SmolLM3-3B-Base", "pipeline_tag": "text-generation"},
        {"slug": "google/gemma-4-E2B-it-qat-w4a16-ct", "pipeline_tag": "text-generation"},
        {"slug": "google/gemma-3-27b-it", "pipeline_tag": "text-generation"},
    ]
    got = chat_capable_slugs(models)
    assert got == ["Qwen/Qwen2.5-72B-Instruct", "google/gemma-3-27b-it"]
    assert "GPTQ" not in "".join(got)
    assert "AWQ" not in "".join(got)
    assert "FP8" not in "".join(got)
    assert "NVFP4" not in "".join(got)


def test_millable_skips_already_tried() -> None:
    models = [
        {"slug": "a/unmeasured", "pipeline_tag": "text-generation", "status": "UNMEASURED"},
        {"slug": "b/practiced", "pipeline_tag": "text-generation", "status": "practice-mill"},
        {"slug": "c/uncheckable", "pipeline_tag": "automatic-speech-recognition", "status": "UNCHECKABLE", "reason": "HTTP 400 not served"},
        {"slug": "d/awq", "pipeline_tag": "text-generation", "status": "UNMEASURED"},
        {"slug": "Qwen/Qwen2.5-7B-Instruct-AWQ", "pipeline_tag": "text-generation", "status": "UNMEASURED"},
    ]
    got = millable_slugs(models)
    assert "a/unmeasured" in got
    assert "b/practiced" not in got
    # HTTP 400 is a mill even if restore dropped providers_live.
    assert "c/uncheckable" not in got
    # Quant packs must be attempted so UNCHECKABLE is recorded, not skipped.
    assert "Qwen/Qwen2.5-7B-Instruct-AWQ" in got
    assert "d/awq" in got
    assert route_kind("text-generation", "Qwen/Qwen2.5-7B-Instruct-AWQ") == "feature"


def test_millable_retries_hf_inference_uncheckable() -> None:
    """Chat-tag UNCHECKABLE still retry (bare slug 200s). A non-chat
    hf-inference miss already ran the embed route — do not loop it."""
    models = [
        {
            "slug": "nomic-ai/nomic-embed-text-v1.5",
            "pipeline_tag": "sentence-similarity",
            "status": "UNCHECKABLE",
            "reason": 'HTTP 400 {"error":"Model not supported by provider hf-inference"}',
        },
        {
            "slug": "Qwen/Qwen3-8B",
            "pipeline_tag": "text-generation",
            "status": "UNCHECKABLE",
            "reason": "HTTP 400 not a chat model",
        },
        {
            "slug": "Qwen/Qwen2.5-7B-Instruct",
            "pipeline_tag": "text-generation",
            "status": "practice-mill",
        },
    ]
    got = millable_slugs(models)
    # HTTP 400 is a mill even if restore dropped providers_live.
    assert "nomic-ai/nomic-embed-text-v1.5" not in got
    assert "Qwen/Qwen3-8B" not in got
    assert "Qwen/Qwen2.5-7B-Instruct" not in got


def test_millable_skips_zero_provider_unmeasured() -> None:
    models = [
        {"slug": "a/fresh", "pipeline_tag": "text-generation", "status": "UNMEASURED"},
        {
            "slug": "b/none",
            "pipeline_tag": "text-generation",
            "status": "UNMEASURED",
            "unmeasured_reason": "no live Inference Provider",
            "providers_live": [],
        },
    ]
    got = millable_slugs(models)
    assert got == ["a/fresh"]


def test_provider_order_never_defaults_to_hf_inference() -> None:
    assert "hf-inference" not in DEFAULT_PROVIDERS
    assert provider_order(["hf-inference", "featherless-ai"])[0] == "featherless-ai"
    assert "hf-inference" not in provider_order(["hf-inference", "featherless-ai"])
    assert "hf-inference" not in provider_order(["hf-inference"])
    assert "hf-inference" not in provider_order([])
    assert provider_order([])[0] == "groq"
    assert "nebius" not in DEFAULT_PROVIDERS


def test_live_providers_uses_mapping_keys_not_model_ids() -> None:
    """Hub mapping: key=together, providerId=Qwen/...-Turbo. Mill must
    call slug:together, not slug:Qwen/...-Turbo."""
    mapping = {
        "together": {
            "status": "live",
            "providerId": "Qwen/Qwen2.5-7B-Instruct-Turbo",
            "task": "conversational",
        },
        "featherless-ai": {
            "status": "live",
            "providerId": "Qwen/Qwen2.5-7B-Instruct",
            "task": "conversational",
        },
        "offline": {"status": "error", "providerId": "x"},
    }
    got = live_providers(mapping)
    assert got == ["together", "featherless-ai"]
    assert "Qwen/Qwen2.5-7B-Instruct-Turbo" not in got
    assert provider_order(got)[0] == "together"


def test_millable_does_not_respray_provider_policy_fails() -> None:
    """34049312401: 286 millable were resprayed; last 400 was invalid nebius.
    A later chat-bare retry is allowed once. After route_kind=chat, stop."""
    models = [
        {
            "slug": "facebook/opt-125m",
            "pipeline_tag": "text-generation",
            "status": "UNCHECKABLE",
            "reason": "HTTP 400 {\"error\":{\"message\":\"the provider or policy you attempted to specify 'nebius' is not valid.\"}}",
        },
        {
            "slug": "nomic-ai/nomic-embed-text-v1.5",
            "pipeline_tag": "sentence-similarity",
            "status": "UNCHECKABLE",
            "reason": 'HTTP 400 {"error":"Model not supported by provider hf-inference"}',
        },
        {
            "slug": "Qwen/Qwen2.5-7B-Instruct",
            "pipeline_tag": "text-generation",
            "status": "UNCHECKABLE",
            "route_kind": "chat",
            "providers_live": [],
            "reason": "HTTP 400 {\"error\":{\"message\":\"the provider or policy you attempted to specify 'nebius' is not valid.\"}}",
        },
    ]
    got = millable_slugs(models)
    # HTTP 400 without providers_live is already milled (restore dropped the key).
    assert "facebook/opt-125m" not in got
    # Empty mapping + route_kind=chat is Hub-probe only; mill the bare slug.
    assert "Qwen/Qwen2.5-7B-Instruct" in got
    assert "nomic-ai/nomic-embed-text-v1.5" not in got
    # After chat-bare the reason is no longer nebius. Bare respray is forbidden
    # once Hub has been probed empty. Missing providers_live still needs a probe.
    models[0]["route_kind"] = "chat-bare"
    models[0]["reason"] = "HTTP 400 {\"error\":{\"message\":\"The requested model 'facebook/opt-125m' is not supported.\"}}"
    models[0]["providers_live"] = []
    got = millable_slugs(models)
    assert "facebook/opt-125m" not in got


def test_millable_probes_uncheckable_for_live_providers() -> None:
    """millable=0 is not terminal. Hub live mapping is the 200-route.
    What would make this fail: skipping chat-bare forever even when
    providers_live is together, or HTTP-milling an empty mapping."""
    models = [
        {
            "slug": "Qwen/Qwen3-8B",
            "pipeline_tag": "text-generation",
            "status": "UNCHECKABLE",
            "route_kind": "chat-bare",
            "reason": "HTTP 400 not supported",
            "providers_live": ["featherless-ai"],
        },
        {
            "slug": "facebook/opt-125m",
            "pipeline_tag": "text-generation",
            "status": "UNCHECKABLE",
            "route_kind": "chat-bare",
            "reason": "HTTP 400 not supported",
            "providers_live": [],
        },
        {
            "slug": "meta-llama/Llama-3.1-8B-Instruct",
            "pipeline_tag": "text-generation",
            "status": "UNCHECKABLE",
            "route_kind": "chat-mapped",
            "reason": "HTTP 400 not supported",
            "providers_live": ["together"],
        },
        {
            "slug": "needs/probe",
            "pipeline_tag": "text-generation",
            "status": "UNCHECKABLE",
        },
    ]
    got = millable_slugs(models)
    assert "Qwen/Qwen3-8B" in got
    assert "facebook/opt-125m" not in got
    assert "meta-llama/Llama-3.1-8B-Instruct" not in got
    assert "needs/probe" in got
    # Empty mapping is not terminal for chat: mill the bare slug.
    # chat-bare already 400'd that call; chat-mapped already 400'd mapped.
    assert mill_router_names("facebook/opt-125m", "chat", [], uncheckable=True) == [
        "facebook/opt-125m"
    ]
    mapped = mill_router_names("Qwen/Qwen3-8B", "chat", ["featherless-ai"], uncheckable=True)
    assert mapped == ["Qwen/Qwen3-8B:featherless-ai"]
    assert "Qwen/Qwen3-8B:groq" not in mapped
    assert "nebius" not in "".join(mapped)
    feat = mill_router_names("Qwen/Qwen3-Embedding-4B", "feature", ["deepinfra"], uncheckable=True)
    assert feat == ["Qwen/Qwen3-Embedding-4B:deepinfra"]
    assert "hf-inference" not in "".join(feat)


def test_millable_honors_reason_when_restore_drops_providers_live() -> None:
    """Published lock lost providers_live/route_kind; millable reopened to
    1049. A HTTP 400 or 'no live Inference Provider' reason is the mill.
    What would make this fail: treating a missing key as never-tried."""
    models = [
        {
            "slug": "cross-encoder/ms-marco-MiniLM-L6-v2",
            "pipeline_tag": "text-ranking",
            "status": "UNCHECKABLE",
            "reason": "HTTP 400 {\"error\":{\"message\":\"The requested model 'cross-encoder/ms-marco-MiniLM-L6-v2' is not a chat model.\"}}",
        },
        {
            "slug": "google/gemma-4-E4B-it",
            "pipeline_tag": "any-to-any",
            "status": "UNCHECKABLE",
            "reason": "no live Inference Provider",
        },
        {
            "slug": "needs/probe",
            "pipeline_tag": "text-generation",
            "status": "UNCHECKABLE",
        },
        {
            "slug": "rate/limited",
            "pipeline_tag": "text-generation",
            "status": "UNCHECKABLE",
            "reason": "HTTP 429 Too Many Requests",
        },
    ]
    got = millable_slugs(models)
    assert "cross-encoder/ms-marco-MiniLM-L6-v2" not in got
    assert "google/gemma-4-E4B-it" not in got
    assert "needs/probe" in got
    assert "rate/limited" in got


def test_empty_mapping_chat_mills_bare_slug_not_treated_terminal() -> None:
    """Hub inferenceProviderMapping=[] is not a router 400. Chat-like
    UNCHECKABLE with empty mapping mill the bare slug. What would make
    this fail: millable=0 because providers_live=[]."""
    models = [
        {
            "slug": "google/gemma-4-E4B-it",
            "pipeline_tag": "any-to-any",
            "status": "UNCHECKABLE",
            "route_kind": "chat",
            "reason": "no live Inference Provider",
            "providers_live": [],
        },
        {
            "slug": "facebook/opt-125m",
            "pipeline_tag": "text-generation",
            "status": "UNCHECKABLE",
            "route_kind": "chat-bare",
            "reason": "HTTP 400 not supported",
            "providers_live": [],
        },
        {
            "slug": "Qwen/Qwen3-8B",
            "pipeline_tag": "text-generation",
            "status": "UNCHECKABLE",
            "route_kind": "chat-mapped",
            "reason": "HTTP 400 not supported",
            "providers_live": ["together"],
        },
        {
            "slug": "openai/whisper-tiny",
            "pipeline_tag": "automatic-speech-recognition",
            "status": "UNCHECKABLE",
            "route_kind": "try-chat-then-feature",
            "reason": "no live Inference Provider",
            "providers_live": [],
        },
    ]
    got = millable_slugs(models)
    assert "google/gemma-4-E4B-it" in got
    assert "facebook/opt-125m" not in got
    assert "Qwen/Qwen3-8B" not in got
    assert "openai/whisper-tiny" not in got
    assert mill_router_names("google/gemma-4-E4B-it", "chat", [], uncheckable=True) == [
        "google/gemma-4-E4B-it"
    ]
    models.append(
        {
            "slug": "unsloth/Qwen3-8B-GGUF",
            "pipeline_tag": "text-generation",
            "status": "UNCHECKABLE",
            "route_kind": "feature",
            "reason": "no live Inference Provider",
            "providers_live": [],
        }
    )
    got = millable_slugs(models)
    assert "unsloth/Qwen3-8B-GGUF" not in got
    assert "google/gemma-4-E4B-it" in got


def test_millable_retries_nonchat_after_chat_policy_spray() -> None:
    """Chat mill last-fail was nebius. Embed/fill-mask/class rows were never
    hit on their route. MILL_EXHAUSTED is not evidence they cannot 200.
    What would make this fail: treating provider-or-policy as terminal for
    sentence-similarity the same way as text-generation."""
    models = [
        {
            "slug": "facebook/opt-125m",
            "pipeline_tag": "text-generation",
            "status": "UNCHECKABLE",
            "reason": "HTTP 400 {\"error\":{\"message\":\"the provider or policy you attempted to specify 'nebius' is not valid.\"}}",
        },
        {
            "slug": "sentence-transformers/all-MiniLM-L6-v2",
            "pipeline_tag": "sentence-similarity",
            "status": "UNCHECKABLE",
            "reason": "HTTP 400 {\"error\":{\"message\":\"the provider or policy you attempted to specify 'nebius' is not valid.\"}}",
        },
        {
            "slug": "answerdotai/ModernBERT-base",
            "pipeline_tag": "fill-mask",
            "status": "UNCHECKABLE",
            "reason": "HTTP 400 {\"error\":{\"message\":\"the provider or policy you attempted to specify 'nebius' is not valid.\"}}",
        },
        {
            "slug": "BAAI/bge-small-en-v1.5",
            "pipeline_tag": "feature-extraction",
            "status": "UNCHECKABLE",
            "reason": "HTTP 400 {\"error\":{\"message\":\"the provider or policy you attempted to specify 'nebius' is not valid.\"}}",
        },
        {
            "slug": "dslim/bert-base-NER",
            "pipeline_tag": "token-classification",
            "status": "UNCHECKABLE",
            "reason": "HTTP 400 {\"error\":{\"message\":\"the provider or policy you attempted to specify 'nebius' is not valid.\"}}",
        },
        {
            "slug": "sentence-transformers/all-MiniLM-L6-v2-done",
            "pipeline_tag": "sentence-similarity",
            "status": "UNCHECKABLE",
            "route_kind": "similarity",
            "reason": "HTTP 400 embeddings not served",
            "providers_live": [],
        },
    ]
    got = millable_slugs(models)
    assert "facebook/opt-125m" not in got
    assert "sentence-transformers/all-MiniLM-L6-v2" not in got
    assert "answerdotai/ModernBERT-base" not in got
    assert "BAAI/bge-small-en-v1.5" not in got
    assert "dslim/bert-base-NER" not in got
    assert "sentence-transformers/all-MiniLM-L6-v2-done" not in got
    models[1]["providers_live"] = ["together"]
    models[1]["route_kind"] = "chat-bare"
    got = millable_slugs(models)
    assert "sentence-transformers/all-MiniLM-L6-v2" in got
    assert route_kind("sentence-similarity") == "similarity"
    assert route_kind("fill-mask") == "fill-mask"
    assert route_kind("token-classification") == "text"


def test_millable_drops_image_lora_windows() -> None:
    """34050320277 shard 15: 0/91 on text-to-image LoRAs. Those must not
    consume the window that chat-like UNMEASURED need for n_measured>=1000."""
    models = [
        {"slug": "Qwen/Qwen3-8B", "pipeline_tag": "text-generation", "status": "UNMEASURED"},
        {"slug": "prithivMLmods/QIE-outfit", "pipeline_tag": "text-to-image", "status": "UNMEASURED"},
        {"slug": "black-forest-labs/FLUX.2-klein-4B", "pipeline_tag": "image-to-image", "status": "UNMEASURED"},
        {
            "slug": "Qwen/Qwen2.5-3B-Instruct",
            "pipeline_tag": "text-generation",
            "status": "UNCHECKABLE",
            "reason": "HTTP 429 Too Many Requests",
        },
    ]
    got = millable_slugs(models)
    assert "Qwen/Qwen3-8B" in got
    assert "prithivMLmods/QIE-outfit" not in got
    assert "black-forest-labs/FLUX.2-klein-4B" not in got
    assert "Qwen/Qwen2.5-3B-Instruct" in got


def test_millable_original_reachable_despite_skip_tags() -> None:
    """Original HF2200 image/ASR rows Hub still lists on a provider must mill.
    Unstamped LoRAs stay out. Membership is not expanded."""
    models = [
        {
            "slug": "Falconsai/nsfw_image_detection",
            "pipeline_tag": "image-classification",
            "status": "UNCHECKABLE",
            "providers_live": ["hf-inference"],
            "reason": "HTTP 400 chat miss",
        },
        {
            "slug": "prithivMLmods/QIE-outfit",
            "pipeline_tag": "text-to-image",
            "status": "UNCHECKABLE",
            "reason": "HTTP 400 chat miss",
        },
        {
            "slug": "Qwen/Qwen3-8B",
            "pipeline_tag": "text-generation",
            "status": "practice-mill",
            "providers_live": ["featherless-ai"],
        },
    ]
    got = millable_slugs(models)
    assert "Falconsai/nsfw_image_detection" in got
    assert "prithivMLmods/QIE-outfit" not in got
    assert "Qwen/Qwen3-8B" not in got


def test_millable_includes_embed_and_fill_mask() -> None:
    """Chat mill 400s MiniLM; hf-inference similarity 200. Those slugs
    must enter the window or n_measured cannot leave the chat-only 96."""
    models = [
        {"slug": "sentence-transformers/all-MiniLM-L6-v2", "pipeline_tag": "sentence-similarity", "status": "UNMEASURED"},
        {"slug": "google-bert/bert-base-uncased", "pipeline_tag": "fill-mask", "status": "UNMEASURED"},
        {"slug": "BAAI/bge-small-en-v1.5", "pipeline_tag": "feature-extraction", "status": "UNMEASURED"},
        {"slug": "google/siglip2", "pipeline_tag": "zero-shot-image-classification", "status": "UNMEASURED"},
        {"slug": "Qwen/Qwen3-8B", "pipeline_tag": "text-generation", "status": "UNMEASURED"},
    ]
    got = millable_slugs(models)
    assert "sentence-transformers/all-MiniLM-L6-v2" in got
    assert "google-bert/bert-base-uncased" in got
    assert "BAAI/bge-small-en-v1.5" in got
    assert "Qwen/Qwen3-8B" in got
    assert "google/siglip2" not in got
    assert route_kind("zero-shot-image-classification") == "try-chat-then-feature"
    assert route_kind("sentence-similarity") == "similarity"
    assert route_kind("text-generation") == "chat"
    assert route_kind("fill-mask") == "fill-mask"
    assert route_kind("") == "try-chat-then-feature"


def test_shards_cover_2200_at_limit_110() -> None:
    slugs = [f"m/{i}" for i in range(2200)]
    seen: list[str] = []
    for shard in range(20):
        _, w = select_window(slugs, 110, 1_780_000_000, shard=shard, shards=20)
        assert len(w) == 110
        seen.extend(w)
    assert len(seen) == 2200
    assert len(set(seen)) == 2200, "20×110 must cover HF2200 once in one hour"


def test_payload_for_kind_is_the_200_shapes() -> None:
    """MiniLM 400s on {inputs: str}; 200 on source_sentence. Drive the
    shipped payload builder, no HTTP."""
    from mill_hf_inference import payload_for_kind  # noqa: E402

    sim = payload_for_kind("similarity")
    assert "source_sentence" in sim["inputs"]
    assert "sentences" in sim["inputs"]
    assert payload_for_kind("fill-mask")["inputs"] == "The [MASK] is here"
    assert payload_for_kind("feature")["inputs"] == "hello world"
    zs = payload_for_kind("text", "zero-shot-classification")
    assert zs["inputs"] == "This is a test."
    assert "candidate_labels" in zs["parameters"]
    qa = payload_for_kind("text", "question-answering")
    assert "question" in qa["inputs"] and "context" in qa["inputs"]


def test_resolve_route_refuses_chat_respray_on_empty_lock_tag() -> None:
    """215 empty-tag UNCHECKABLE would Hub-fill as text-generation and
    spray nebius again. What would make this fail: using Hub chat tag as
    a fresh mill."""
    tag, kind = resolve_route("", "text-generation", "UNCHECKABLE", "google/electra-base-discriminator")
    assert tag == "text-generation"
    assert kind == "try-chat-then-feature"
    tag, kind = resolve_route("", "fill-mask", "UNCHECKABLE", "google/electra-base-discriminator")
    assert kind == "fill-mask"
    tag, kind = resolve_route("", "text-generation", "UNMEASURED", "Qwen/Qwen3-8B")
    assert kind == "chat"
    tag, kind = resolve_route("sentence-similarity", "text-generation", "UNCHECKABLE")
    assert tag == "sentence-similarity"
    assert kind == "similarity"


def test_mill_names_uncheckable_chat_is_bare_plus_mapped_not_default_spray() -> None:
    """DEFAULT spray is what wrote 1311 nebius 400s. A retry with empty
    Hub mapping must be the bare slug only. What would make this fail:
    provider_order filling groq/cerebras when mapped is []."""
    bare = mill_names_for_kind("facebook/opt-125m", "chat", [], defaults=())
    assert bare == ["facebook/opt-125m"]
    mapped = mill_names_for_kind("Qwen/Qwen3-8B", "chat", ["featherless-ai"], defaults=())
    assert mapped[0] == "Qwen/Qwen3-8B"
    assert "Qwen/Qwen3-8B:featherless-ai" in mapped
    assert "Qwen/Qwen3-8B:groq" not in mapped
    assert "nebius" not in "".join(mapped)


def test_mill_names_nonchat_pins_hf_inference_not_groq() -> None:
    """Chat mill never defaults hf-inference. Embed mill must, or MiniLM
    never 200s. What would make this fail: spraying groq onto bge."""
    chat = mill_names_for_kind("Qwen/Qwen3-8B", "chat", ["featherless-ai"])
    assert chat[0] == "Qwen/Qwen3-8B"
    assert "Qwen/Qwen3-8B:featherless-ai" in chat
    assert "Qwen/Qwen3-8B:hf-inference" not in chat
    feat = mill_names_for_kind("BAAI/bge-small-en-v1.5", "feature", [])
    assert feat[0] == "BAAI/bge-small-en-v1.5"
    assert feat[1] == "BAAI/bge-small-en-v1.5:hf-inference"
    assert "BAAI/bge-small-en-v1.5:groq" not in feat


def test_exhausted_millable_is_not_a_cron_killing_fail() -> None:
    assert mill_exit_for_window(2200, 0, 0) == 0
    assert mill_exit_for_window(0, 0, 0) == 1
    assert mill_exit_for_window(2200, 10, 0) == 1
    assert mill_exit_for_window(2200, 10, 8) == 0
    # 34058589553 mill (19): millable=285, start=285, empty remainder.
    # That is not MILL_EMPTY. What would make this fail: exit 1 on the last shard.
    assert mill_exit_for_window(2200, 285, 0, start=285) == 0
    assert mill_exit_for_window(2200, 285, 0, start=0) == 1


if __name__ == "__main__":
    test_empty_fleet_empty_window()
    test_window_is_not_always_prefix()
    test_shards_partition_one_hour()
    test_wraps_without_inventing_slugs()
    test_chat_capable_skips_embed_and_gguf()
    test_shards_do_not_overlap_when_fleet_smaller_than_stride()
    test_chat_capable_skips_quant_and_base()
    test_millable_skips_already_tried()
    test_millable_retries_hf_inference_uncheckable()
    test_millable_skips_zero_provider_unmeasured()
    test_provider_order_never_defaults_to_hf_inference()
    test_live_providers_uses_mapping_keys_not_model_ids()
    test_millable_does_not_respray_provider_policy_fails()
    test_millable_probes_uncheckable_for_live_providers()
    test_millable_honors_reason_when_restore_drops_providers_live()
    test_empty_mapping_chat_mills_bare_slug_not_treated_terminal()
    test_millable_retries_nonchat_after_chat_policy_spray()
    test_millable_drops_image_lora_windows()
    test_millable_original_reachable_despite_skip_tags()
    test_millable_includes_embed_and_fill_mask()
    test_shards_cover_2200_at_limit_110()
    test_payload_for_kind_is_the_200_shapes()
    test_resolve_route_refuses_chat_respray_on_empty_lock_tag()
    test_mill_names_uncheckable_chat_is_bare_plus_mapped_not_default_spray()
    test_mill_names_nonchat_pins_hf_inference_not_groq()
    test_exhausted_millable_is_not_a_cron_killing_fail()
    print("test_mill_window: 26 passed")
