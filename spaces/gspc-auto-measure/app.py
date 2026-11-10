"""GSPC Auto-Measure. Canonical source: CSOAI-ORG/councilof-ai/spaces/gspc-auto-measure."""
import spaces  # Must precede imports that initialize CUDA.
import gradio as gr
import importlib.metadata
import json
import os
import threading
from datetime import datetime, timezone
from pathlib import Path
from huggingface_hub import HfApi

from inference import run_inference
from measurement import (BANKS, MODELS, HERE, load_bank, read_history, recovery_state,
                         select_window, make_result, render_result)

_gpu_inference = spaces.GPU(duration=120)(run_inference)
_lock = threading.Lock()
_next_sequence = None
_completed = {}
_history_source = None


def _source_revision():
    release = HERE / "SOURCE_REVISION.json"
    return json.loads(release.read_text())["commit"] if release.exists() else "unpublished-local-source"


def _measure(sequence=None, progress=None):
    global _next_sequence, _completed, _history_source
    # Serial reservation and completion prevent two concurrent clients from selecting the same next pair.
    with _lock:
        if _next_sequence is None:
            history, _history_source = read_history()
            _next_sequence, _completed = recovery_state(history)
        if sequence is None:
            sequence = _next_sequence
        if isinstance(sequence, bool) or not isinstance(sequence, int) or sequence < 0:
            raise ValueError("sequence must be a nonnegative integer")
        if sequence in _completed:
            return _completed[sequence]
        # Explicit sequences let an existing driver own/retry its durable request. No automatic backfill.
        bank_id, model_id = BANKS[sequence % len(BANKS)], MODELS[sequence % len(MODELS)]
        metadata, rows = load_bank(bank_id)
        offset, window = select_window(sequence, rows, bank_id)
        revision = HfApi(token=False).model_info(model_id).sha
        if not revision or len(revision) != 40:
            raise ValueError("model revision is unavailable")
        if progress:
            progress(0.2, f"Measuring {model_id} on {bank_id}")
        outputs = _gpu_inference(model_id, revision, [row["prompt"] for row in window])
        runtime = {}
        for package in ["transformers", "torch", "gradio", "spaces", "huggingface_hub"]:
            try:
                runtime[package] = importlib.metadata.version(package)
            except importlib.metadata.PackageNotFoundError:
                runtime[package] = "unavailable"
        result = make_result(sequence, revision, bank_id, metadata, window, offset, outputs,
            datetime.now(timezone.utc).isoformat(), _source_revision(), _history_source, runtime)
        result_dir = Path(os.environ.get("GSPC_RESULTS_DIR", "/tmp/results"))
        result_dir.mkdir(parents=True, exist_ok=True)
        path = result_dir / f"{result['run_id']}.json"
        temporary = path.with_suffix(".tmp")
        temporary.write_text(json.dumps(result, ensure_ascii=False, indent=2))
        temporary.replace(path)
        _completed[sequence] = result
        _next_sequence = max(_next_sequence, sequence + 1)
        return result


def measure_next(progress=gr.Progress()):
    """Legacy single Markdown output, including the complete JSON receipt."""
    return render_result(_measure(progress=progress))


def measure_at(sequence: int):
    """Driver API: explicit durable sequence and structured full receipt; repeated committed runs replay."""
    return _measure(sequence=sequence)


with gr.Blocks(title="GSPC Auto-Measure") as demo:
    gr.Markdown("""# GSPC Auto-Measure
Each run measures one model on one frozen bank using the canonical Council of AI label grader.
Results include full outputs, source and model revisions, token stop observations, and coverage.
The existing ZeroGPU allocation is used only when Run is clicked or an inference API is called.

Restart recovery follows receipts archived in the public results dataset. The persistence driver
must archive the returned JSON; local-only runs can repeat after a restart. These unsigned
measurements do not write to the GSPC board or establish independent admission.
""")
    btn = gr.Button("Measure next model × bank", variant="primary")
    output = gr.Markdown("Ready.")
    btn.click(fn=measure_next, outputs=output, api_name="measure_next", concurrency_limit=1)
    # Additive API for drivers. Keep the original button and response contract unchanged.
    with gr.Accordion("Driver sequence", open=False):
        sequence = gr.Number(label="Committed sequence to run or replay", precision=0, value=0)
        run_at = gr.Button("Measure explicit sequence")
        receipt = gr.JSON(label="Full receipt to archive")
        run_at.click(fn=measure_at, inputs=sequence, outputs=receipt, api_name="measure_at", concurrency_limit=1)

if __name__ == "__main__":
    demo.queue(default_concurrency_limit=1).launch()
