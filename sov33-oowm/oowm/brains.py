"""The 12 sovereign brain configurations."""
BRAINS = {
    "king": {"tier":"king","persona":"dragon","temperature":0.9,
             "a_stream":{"quant":"mamba-2-ssd","man":"kimi-2.7"},
             "b_stream":{"quant":"deepseek-r1:7b","man":"claude-opus-4.8"}},
    "queen": {"tier":"queen","persona":"turtle","temperature":0.3,
              "a_stream":{"quant":"mamba-2-ssd","man":"llama-3.1:8b"},
              "b_stream":{"quant":"deepseek-r1:7b","man":"llama-3.1:8b"}},
    "quant": {"role":"left-brain","focus":"numerical","backend":"mamba-2-ssd"},
    "man":   {"role":"right-brain","focus":"humanistic","backend":"kimi-2.7"},
    "oowm":  {"role":"apex","training":"15y marketing + 25 domains + personal mythology"},
    "mom":   {"role":"guardian","principle":"care-aligned","dimensions":6},
    "small-moe":{"experts":8,"target":"edge","backend":"mamba-2+lightweight"},
    "big-moe":  {"experts":64,"target":"cloud","backend":"mamba-2+attention+OLM"},
    "bridge":   {"tool_id":116,"left":"qwen3:0.6b","right":"gemma3:4b","attestation":"Ed25519"},
    "council":  {"generals":12,"quorum":7,"protocol":"bft-pbft"},
    "sovereign":{"stack":"full","post_quantum":True,"protocols":["MCP","A2A","HTTP","Sigil"]},
    "free":     {"license":"MIT","models":["llama-3.1:8b","deepseek-7b"],"cost":"$0"},
}
def get_brain(name): return BRAINS.get(name)
def list_brains(): return list(BRAINS.keys())
