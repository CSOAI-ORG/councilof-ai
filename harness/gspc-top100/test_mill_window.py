"""Mill window honesty: never slugs[:limit] forever; window moves by hour.

Drives scripts/mill_window.py (the function mill_hf_inference.py calls).
Does not mill, does not HTTP, does not invent scores.
"""
from __future__ import annotations

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[2] / "scripts"))
from mill_window import (  # noqa: E402
    chat_capable_slugs,
    mill_exit_for_window,
    millable_slugs,
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
        {"slug": "c/uncheckable", "pipeline_tag": "text-generation", "status": "UNCHECKABLE"},
        {"slug": "d/awq", "pipeline_tag": "text-generation", "status": "UNMEASURED"},
        {"slug": "Qwen/Qwen2.5-7B-Instruct-AWQ", "pipeline_tag": "text-generation", "status": "UNMEASURED"},
    ]
    got = millable_slugs(models)
    assert got == ["a/unmeasured"]
    assert "b/practiced" not in got
    assert "c/uncheckable" not in got
    assert "Qwen/Qwen2.5-7B-Instruct-AWQ" not in got


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


def test_exhausted_millable_is_not_a_cron_killing_fail() -> None:
    assert mill_exit_for_window(2200, 0, 0) == 0
    assert mill_exit_for_window(0, 0, 0) == 1
    assert mill_exit_for_window(2200, 10, 0) == 1
    assert mill_exit_for_window(2200, 10, 8) == 0


if __name__ == "__main__":
    test_empty_fleet_empty_window()
    test_window_is_not_always_prefix()
    test_shards_partition_one_hour()
    test_wraps_without_inventing_slugs()
    test_chat_capable_skips_embed_and_gguf()
    test_shards_do_not_overlap_when_fleet_smaller_than_stride()
    test_chat_capable_skips_quant_and_base()
    test_millable_skips_already_tried()
    test_millable_includes_embed_and_fill_mask()
    test_shards_cover_2200_at_limit_110()
    test_payload_for_kind_is_the_200_shapes()
    test_exhausted_millable_is_not_a_cron_killing_fail()
    print("test_mill_window: 12 passed")
