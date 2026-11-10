"""Pinned Transformers inference; imported inside the existing ZeroGPU allocation only."""
import gc
from measurement import PROTOCOL, observed_stop, sha256


def run_inference(model_id, revision, prompts):
    import torch
    from transformers import AutoModelForCausalLM, AutoTokenizer
    tokenizer = AutoTokenizer.from_pretrained(model_id, revision=revision, trust_remote_code=False)
    model = AutoModelForCausalLM.from_pretrained(model_id, revision=revision,
        torch_dtype=torch.bfloat16, device_map="auto", trust_remote_code=False)
    model.eval()
    outputs = []
    try:
        for prompt in prompts:
            rendered, ids, raw, answer = None, [], "", ""
            try:
                rendered = tokenizer.apply_chat_template([{"role": "user", "content": prompt}],
                    tokenize=False, add_generation_prompt=True, enable_thinking=False)
                inputs = tokenizer(rendered, return_tensors="pt", add_special_tokens=False).to(model.device)
                with torch.inference_mode():
                    generated = model.generate(**inputs, max_new_tokens=PROTOCOL["max_new_tokens"],
                        do_sample=False, return_dict_in_generate=True,
                        pad_token_id=tokenizer.pad_token_id if tokenizer.pad_token_id is not None else tokenizer.eos_token_id)
                ids = generated.sequences[0, inputs["input_ids"].shape[-1]:].tolist()
                # Preserve every generated token; only the grading view omits tokenizer special tokens.
                raw = tokenizer.decode(ids, skip_special_tokens=False, clean_up_tokenization_spaces=False)
                answer = tokenizer.decode(ids, skip_special_tokens=True, clean_up_tokenization_spaces=False)
                reason = observed_stop(ids, model.generation_config.eos_token_id, PROTOCOL["max_new_tokens"])
                outputs.append({"answer": answer, "raw_output": raw, "rendered_prompt": rendered,
                    "rendered_prompt_sha256": sha256(rendered), "output_token_ids": ids,
                    "generated_tokens": len(ids), "stop_reason": reason, "stop_reason_source": "observed_tokens",
                    "token_limit_reached": reason == "length", "error_type": None})
            except Exception as exc:
                # Exception text can include provider details. Keep a typed failure, never grade it as an answer.
                outputs.append({"answer": answer, "raw_output": raw, "error_type": type(exc).__name__,
                    "rendered_prompt": rendered, "rendered_prompt_sha256": sha256(rendered) if rendered is not None else None,
                    "output_token_ids": ids, "generated_tokens": len(ids),
                    "stop_reason": "error", "stop_reason_source": "exception", "token_limit_reached": None})
    finally:
        del model, tokenizer
        gc.collect()
        if torch.cuda.is_available():
            torch.cuda.empty_cache()
    return outputs
