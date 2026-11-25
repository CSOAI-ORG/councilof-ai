"""Council-B GPU runner (pre-registered protocol councilof-ai/council-b/2026-11-24/v1).
Never reads key.jsonl. Inputs: bank.jsonl, protocol.json, and for --phase referee a panels.jsonl
(vote tallies per item and arm, built locally from phase-1 outputs; the adversarial panel is the
designed injected input). Outputs under out/.
Usage:
  python run_council.py --phase voters  --models M1,M2,M3,M4 --weights /weights
  python run_council.py --phase referee --panels panels.jsonl --weights /weights
"""
import argparse, hashlib, json, os, sys, time, gc

P = json.load(open("protocol.json"))
BANK = [json.loads(l) for l in open("bank.jsonl")]
LAB = ["TRUE", "FALSE", "UNCHECKABLE"]


def opts(item):
    return "\n".join(f"{k}) {v}" for k, v in sorted(item["options"].items()))


def seed_for(item_id, mk, s):
    return int(hashlib.sha256(f"{item_id}|{mk}|{s}".encode()).hexdigest()[:8], 16)


def chat(tok, system, user):
    msgs = [{"role": "system", "content": system}, {"role": "user", "content": user}]
    try:
        return tok.apply_chat_template(msgs, tokenize=False, add_generation_prompt=True)
    except Exception:
        return tok.apply_chat_template([{"role": "user", "content": system + "\n\n" + user}],
                                       tokenize=False, add_generation_prompt=True)


def load(mk, weights):
    from vllm import LLM
    m = P["models"][mk]
    path = os.path.join(weights, mk)
    llm = LLM(model=path, dtype=os.environ.get("CB_DTYPE", "bfloat16"), max_model_len=P["engine"]["max_model_len"],
              tensor_parallel_size=int(os.environ.get("CB_TP", "1")),
              gpu_memory_utilization=0.90, seed=0, trust_remote_code=False)
    return llm, llm.get_tokenizer()


def run(llm, prompts, params, tag, mk):
    t0 = time.time()
    outs = llm.generate(prompts, params, use_tqdm=False)
    wall = time.time() - t0
    rows = []
    for (meta, _), o in zip(tag, outs):
        rows.append({**meta, "model": mk, "text": o.outputs[0].text,
                     "prompt_tokens": len(o.prompt_token_ids), "completion_tokens": len(o.outputs[0].token_ids)})
    return rows, wall


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--phase", required=True)
    ap.add_argument("--models", default="M1,M2,M3,M4")
    ap.add_argument("--weights", default="/weights")
    ap.add_argument("--panels")
    ap.add_argument("--run", default="run1")
    a = ap.parse_args()
    from vllm import SamplingParams
    import vllm
    os.makedirs("out", exist_ok=True)
    dec = P["decoding"]
    timing = {"vllm_version": vllm.__version__, "phase": a.phase, "run": a.run}
    pr = P["prompts"]
    if a.phase == "voters":
        for mk in a.models.split(","):
            t_load = time.time(); llm, tok = load(mk, a.weights); timing[f"{mk}_load_s"] = time.time() - t_load
            prompts, params, tag = [], [], []
            nsamp = 13 if mk == "M1" else 3
            for it in BANK:
                u = pr["voter_user"].format(source_header=it["source_header"], source_text=it["source_text"],
                                            claim=it["claim"], options=opts(it))
                p = chat(tok, pr["voter_system"], u)
                g = dec["greedy_voter"]
                prompts.append(p); params.append(SamplingParams(temperature=0.0, max_tokens=g["max_tokens"], seed=0))
                tag.append(({"item_id": it["item_id"], "kind": "greedy", "sample": -1}, None))
                s = dec["sampled_voter"]
                for k in range(nsamp):
                    prompts.append(p)
                    params.append(SamplingParams(temperature=s["temperature"], top_p=s["top_p"],
                                                 max_tokens=s["max_tokens"], seed=seed_for(it["item_id"], mk, k)))
                    tag.append(({"item_id": it["item_id"], "kind": "sample", "sample": k}, None))
            rows, wall = run(llm, prompts, params, tag, mk)
            timing[f"{mk}_gen_s"] = wall
            with open(f"out/{a.run}_voters_{mk}.jsonl", "w") as f:
                for r in rows: f.write(json.dumps(r) + "\n")
            print(mk, "calls", len(rows), "gen_s", round(wall, 1), flush=True)
            del llm; gc.collect()
            try:
                import torch; torch.cuda.empty_cache()
            except Exception:
                pass
    elif a.phase == "referee":
        panels = [json.loads(l) for l in open(a.panels)]
        byid = {it["item_id"]: it for it in BANK}
        llm, tok = load("M1", a.weights)
        r = dec["referee"]
        prompts, params, tag = [], [], []
        for pn in panels:
            it = byid[pn["item_id"]]
            u = pr["referee_user"].format(source_header=it["source_header"], source_text=it["source_text"],
                                          claim=it["claim"], votes=pn["votes"], options=opts(it))
            prompts.append(chat(tok, pr["referee_system"], u))
            params.append(SamplingParams(temperature=0.0, max_tokens=r["max_tokens"], seed=0))
            tag.append(({"item_id": pn["item_id"], "kind": "referee", "arm": pn["arm"], "sample": -1}, None))
        rows, wall = run(llm, prompts, params, tag, "M1")
        timing["referee_gen_s"] = wall
        with open(f"out/{a.run}_referee.jsonl", "w") as f:
            for x in rows: f.write(json.dumps(x) + "\n")
    json.dump(timing, open(f"out/{a.run}_{a.phase}_timing.json", "w"), indent=1)
    print(json.dumps(timing))


if __name__ == "__main__":
    main()
